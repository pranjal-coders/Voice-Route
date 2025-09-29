const mysql = require("mysql2/promise");
const path = require("path");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "voiceroute_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Removed deprecated options: acquireTimeout, timeout, reconnect
  // These are handled differently in mysql2
  idleTimeout: 60000,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully!");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

// Database helper functions
class DatabaseHelper {
  static async query(sql, params = []) {
    try {
      const [rows, fields] = await pool.execute(sql, params);
      return { success: true, data: rows, fields };
    } catch (error) {
      console.error("Database query error:", error.message);
      return { success: false, error: error.message };
    }
  }

  static async transaction(queries) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const results = [];
      for (const query of queries) {
        const [rows] = await connection.execute(query.sql, query.params || []);
        results.push(rows);
      }

      await connection.commit();
      return { success: true, data: results };
    } catch (error) {
      await connection.rollback();
      console.error("Transaction error:", error.message);
      return { success: false, error: error.message };
    } finally {
      connection.release();
    }
  }

  // User-related queries
  static async createUser(userData) {
    const { username, email, password_hash, phone, full_name, preferences } =
      userData;
    const sql = `
            INSERT INTO users (username, email, password_hash, phone, full_name, preferences) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
    return await this.query(sql, [
      username,
      email,
      password_hash,
      phone,
      full_name,
      JSON.stringify(preferences),
    ]);
  }

  static async getUserByEmail(email) {
    const sql = "SELECT * FROM users WHERE email = ? AND is_active = TRUE";
    return await this.query(sql, [email]);
  }

  static async getUserById(userId) {
    const sql = "SELECT * FROM users WHERE user_id = ? AND is_active = TRUE";
    return await this.query(sql, [userId]);
  }

  // Route search queries
  static async searchRoutes(
    source,
    destination,
    transportType = "both",
    limit = 10
  ) {
    let sql = `
            SELECT r.*, 
                   AVG(f.rating) as avg_rating,
                   COUNT(f.feedback_id) as review_count
            FROM routes r
            LEFT JOIN user_feedback f ON r.route_id = f.route_id
            WHERE r.source LIKE ? 
                AND r.destination LIKE ? 
                AND r.status = 'active'
        `;

    const params = [`%${source}%`, `%${destination}%`];

    if (transportType !== "both") {
      sql += " AND r.transport_type = ?";
      params.push(transportType);
    }

    sql += `
            GROUP BY r.route_id
            ORDER BY r.departure_time ASC, avg_rating DESC
            LIMIT ?
        `;
    params.push(limit);

    return await this.query(sql, params);
  }

  static async getPersonalizedRoutes(
    userId,
    source,
    destination,
    transportType = "both"
  ) {
    const sql = `
            CALL GetRouteRecommendations(?, ?, ?, ?, 10)
        `;
    return await this.query(sql, [userId, source, destination, transportType]);
  }

  // Search history logging
  static async logSearch(searchData) {
    const sql = `
            INSERT INTO search_history 
            (user_id, session_id, query_text, source_location, destination, transport_type, 
             search_results, response_time_ms, user_agent, ip_address) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    return await this.query(sql, [
      searchData.user_id,
      searchData.session_id,
      searchData.query_text,
      searchData.source_location,
      searchData.destination,
      searchData.transport_type,
      JSON.stringify(searchData.search_results),
      searchData.response_time_ms,
      searchData.user_agent,
      searchData.ip_address,
    ]);
  }

  // Voice analytics logging
  static async logVoiceAnalytics(voiceData) {
    const sql = `
            INSERT INTO voice_analytics 
            (user_id, session_id, voice_command, recognized_intent, confidence_score, 
             processing_time_ms, language_detected, success, error_message) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    return await this.query(sql, [
      voiceData.user_id,
      voiceData.session_id,
      voiceData.voice_command,
      voiceData.recognized_intent,
      voiceData.confidence_score,
      voiceData.processing_time_ms,
      voiceData.language_detected,
      voiceData.success,
      voiceData.error_message,
    ]);
  }

  // User favorites
  static async getUserFavorites(userId) {
    const sql = `
            SELECT uf.*, r.transport_type, r.operator_name, r.route_name, 
                   r.source, r.destination, r.departure_time, r.fare_base
            FROM user_favorites uf
            JOIN routes r ON uf.route_id = r.route_id
            WHERE uf.user_id = ?
            ORDER BY uf.created_at DESC
        `;
    return await this.query(sql, [userId]);
  }

  static async addFavorite(userId, routeId, alias = null) {
    const sql = `
            INSERT INTO user_favorites (user_id, route_id, alias, notification_enabled) 
            VALUES (?, ?, ?, FALSE)
            ON DUPLICATE KEY UPDATE alias = VALUES(alias)
        `;
    return await this.query(sql, [userId, routeId, alias]);
  }

  static async removeFavorite(userId, routeId) {
    const sql = "DELETE FROM user_favorites WHERE user_id = ? AND route_id = ?";
    return await this.query(sql, [userId, routeId]);
  }

  // Feedback system
  static async addFeedback(feedbackData) {
    const sql = `
            INSERT INTO user_feedback 
            (user_id, route_id, rating, feedback_type, comments, is_anonymous) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
    return await this.query(sql, [
      feedbackData.user_id,
      feedbackData.route_id,
      feedbackData.rating,
      feedbackData.feedback_type,
      feedbackData.comments,
      feedbackData.is_anonymous,
    ]);
  }

  // Analytics queries
  static async getPopularRoutes(limit = 10) {
    const sql = `
            SELECT * FROM popular_routes LIMIT ?
        `;
    return await this.query(sql, [limit]);
  }

  static async getUserStats(userId) {
    const sql = `
            SELECT * FROM user_search_stats WHERE user_id = ?
        `;
    return await this.query(sql, [userId]);
  }

  // API usage logging
  static async logAPIUsage(usageData) {
    const sql = `
            INSERT INTO api_usage 
            (user_id, ip_address, endpoint, method, status_code, response_time_ms, 
             request_size_bytes, response_size_bytes, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    return await this.query(sql, [
      usageData.user_id,
      usageData.ip_address,
      usageData.endpoint,
      usageData.method,
      usageData.status_code,
      usageData.response_time_ms,
      usageData.request_size_bytes,
      usageData.response_size_bytes,
      usageData.user_agent,
    ]);
  }

  // Notifications
  static async getUserNotifications(userId, limit = 20) {
    const sql = `
            SELECT * FROM notifications 
            WHERE user_id = ? OR user_id IS NULL
            ORDER BY priority DESC, created_at DESC 
            LIMIT ?
        `;
    return await this.query(sql, [userId, limit]);
  }

  static async markNotificationRead(notificationId, userId) {
    const sql = `
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE notification_id = ? AND user_id = ?
        `;
    return await this.query(sql, [notificationId, userId]);
  }

  // Health check queries
  static async getSystemHealth() {
    const queries = [
      "SELECT COUNT(*) as total_users FROM users",
      'SELECT COUNT(*) as total_routes FROM routes WHERE status = "active"',
      "SELECT COUNT(*) as total_searches_today FROM search_history WHERE DATE(search_timestamp) = CURDATE()",
      "SELECT AVG(response_time_ms) as avg_response_time FROM search_history WHERE search_timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)",
    ];

    const results = {};
    for (const query of queries) {
      const result = await this.query(query);
      if (result.success) {
        Object.assign(results, result.data[0]);
      }
    }

    return results;
  }
}

module.exports = {
  pool,
  testConnection,
  DatabaseHelper,
};
