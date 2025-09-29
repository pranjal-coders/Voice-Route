-- VoiceRoute Database Schema
-- Created for DBMS Project - Voice Transportation Enquiry System

DROP DATABASE IF EXISTS voiceroute_db;
CREATE DATABASE voiceroute_db;
USE voiceroute_db;

-- Users table for authentication and personalization
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    full_name VARCHAR(100),
    preferences JSON DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_created_at (created_at)
);

-- User sessions for authentication management
CREATE TABLE user_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Search history for analytics and personalization
CREATE TABLE search_history (
    search_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    session_id VARCHAR(128) DEFAULT NULL,
    query_text TEXT NOT NULL,
    source_location VARCHAR(100),
    destination VARCHAR(100),
    transport_type ENUM('bus', 'train', 'both') DEFAULT 'both',
    search_results JSON DEFAULT NULL,
    response_time_ms INT DEFAULT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_search_timestamp (search_timestamp),
    INDEX idx_transport_type (transport_type),
    INDEX idx_source_destination (source_location, destination),
    FULLTEXT idx_query_text (query_text)
);

-- Transportation routes cache
CREATE TABLE routes (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    transport_type ENUM('bus', 'train') NOT NULL,
    operator_name VARCHAR(100) NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    route_number VARCHAR(50),
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    journey_duration INT NOT NULL, -- minutes
    fare_base DECIMAL(8,2) NOT NULL,
    fare_sleeper DECIMAL(8,2) DEFAULT NULL,
    fare_ac DECIMAL(8,2) DEFAULT NULL,
    total_seats INT DEFAULT NULL,
    available_seats INT DEFAULT NULL,
    route_days SET('monday','tuesday','wednesday','thursday','friday','saturday','sunday') DEFAULT 'monday,tuesday,wednesday,thursday,friday,saturday,sunday',
    status ENUM('active', 'cancelled', 'delayed', 'maintenance') DEFAULT 'active',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_source VARCHAR(50) DEFAULT 'manual',

    INDEX idx_transport_type (transport_type),
    INDEX idx_source_destination (source, destination),
    INDEX idx_departure_time (departure_time),
    INDEX idx_operator (operator_name),
    INDEX idx_route_number (route_number),
    INDEX idx_status (status),
    INDEX idx_last_updated (last_updated)
);

-- User favorite routes for quick access
CREATE TABLE user_favorites (
    favorite_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    route_id INT NOT NULL,
    alias VARCHAR(100) DEFAULT NULL, -- Custom name like "Home to Office"
    notification_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_route (user_id, route_id),
    INDEX idx_user_id (user_id)
);

-- Feedback and ratings system
CREATE TABLE user_feedback (
    feedback_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    route_id INT DEFAULT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback_type ENUM('route_accuracy', 'app_performance', 'voice_recognition', 'general') DEFAULT 'general',
    comments TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating),
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_created_at (created_at)
);

-- Voice recognition analytics
CREATE TABLE voice_analytics (
    analytics_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    session_id VARCHAR(128),
    voice_command TEXT NOT NULL,
    recognized_intent VARCHAR(100),
    confidence_score DECIMAL(5,4) DEFAULT NULL, -- 0.0000 to 1.0000
    processing_time_ms INT,
    language_detected VARCHAR(10) DEFAULT 'en-US',
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_intent (recognized_intent),
    INDEX idx_success (success),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_voice_command (voice_command)
);

-- System notifications and alerts
CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('route_alert', 'system_update', 'booking_reminder', 'promotional') DEFAULT 'system_update',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500) DEFAULT NULL,
    expires_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- API usage tracking for rate limiting
CREATE TABLE api_usage (
    usage_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    ip_address VARCHAR(45) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    response_time_ms INT,
    request_size_bytes INT DEFAULT NULL,
    response_size_bytes INT DEFAULT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_endpoint (endpoint),
    INDEX idx_created_at (created_at),
    INDEX idx_status_code (status_code)
);

-- Create views for commonly used queries
CREATE VIEW user_search_stats AS
SELECT 
    u.user_id,
    u.username,
    COUNT(sh.search_id) as total_searches,
    COUNT(DISTINCT sh.source_location) as unique_sources,
    COUNT(DISTINCT sh.destination) as unique_destinations,
    AVG(sh.response_time_ms) as avg_response_time,
    MAX(sh.search_timestamp) as last_search_date
FROM users u
LEFT JOIN search_history sh ON u.user_id = sh.user_id
GROUP BY u.user_id, u.username;

CREATE VIEW popular_routes AS
SELECT 
    r.route_id,
    r.transport_type,
    r.operator_name,
    r.source,
    r.destination,
    COUNT(sh.search_id) as search_count,
    AVG(COALESCE(f.rating, 0)) as avg_rating,
    COUNT(uf.favorite_id) as favorite_count
FROM routes r
LEFT JOIN search_history sh ON (sh.source_location = r.source AND sh.destination = r.destination)
LEFT JOIN user_feedback f ON r.route_id = f.route_id
LEFT JOIN user_favorites uf ON r.route_id = uf.route_id
WHERE r.status = 'active'
GROUP BY r.route_id
ORDER BY search_count DESC, avg_rating DESC;

-- Create stored procedures
DELIMITER //

-- Procedure to log voice search with analytics
CREATE PROCEDURE LogVoiceSearch(
    IN p_user_id INT,
    IN p_session_id VARCHAR(128),
    IN p_voice_command TEXT,
    IN p_query_text TEXT,
    IN p_source VARCHAR(100),
    IN p_destination VARCHAR(100),
    IN p_transport_type VARCHAR(10),
    IN p_confidence DECIMAL(5,4),
    IN p_processing_time INT,
    IN p_user_agent TEXT,
    IN p_ip_address VARCHAR(45)
)
BEGIN
    DECLARE search_id INT;
    DECLARE analytics_id INT;

    START TRANSACTION;

    -- Log search history
    INSERT INTO search_history (
        user_id, session_id, query_text, source_location, destination, 
        transport_type, response_time_ms, user_agent, ip_address
    ) VALUES (
        p_user_id, p_session_id, p_query_text, p_source, p_destination,
        p_transport_type, p_processing_time, p_user_agent, p_ip_address
    );

    SET search_id = LAST_INSERT_ID();

    -- Log voice analytics
    INSERT INTO voice_analytics (
        user_id, session_id, voice_command, confidence_score, 
        processing_time_ms, success
    ) VALUES (
        p_user_id, p_session_id, p_voice_command, p_confidence,
        p_processing_time, TRUE
    );

    SET analytics_id = LAST_INSERT_ID();

    COMMIT;

    SELECT search_id, analytics_id;
END //

-- Procedure to get personalized route recommendations
CREATE PROCEDURE GetRouteRecommendations(
    IN p_user_id INT,
    IN p_source VARCHAR(100),
    IN p_destination VARCHAR(100),
    IN p_transport_type VARCHAR(10),
    IN p_limit INT DEFAULT 10
)
BEGIN
    -- Get routes with user preference weighting
    SELECT 
        r.*,
        CASE 
            WHEN uf.favorite_id IS NOT NULL THEN 1000
            ELSE 0 
        END + 
        COALESCE(AVG(f.rating) * 50, 0) + 
        (100 - ABS(TIMESTAMPDIFF(MINUTE, r.departure_time, TIME(NOW())))) as relevance_score
    FROM routes r
    LEFT JOIN user_favorites uf ON (r.route_id = uf.route_id AND uf.user_id = p_user_id)
    LEFT JOIN user_feedback f ON r.route_id = f.route_id
    WHERE r.source = p_source 
        AND r.destination = p_destination
        AND (p_transport_type = 'both' OR r.transport_type = p_transport_type)
        AND r.status = 'active'
    GROUP BY r.route_id
    ORDER BY relevance_score DESC
    LIMIT p_limit;
END //

DELIMITER ;