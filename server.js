require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { body, validationResult, param, query } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");

const { testConnection, DatabaseHelper } = require("./database/config");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "voiceroute_secret_key_2025";

const fetch = require('node-fetch');require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

app.use(express.json());

app.post('/api/gemini', async (req, res) => {
    const { query } = req.body;

    const messages = [
        { role: "user", parts: [ query ] }
    ];

    try {
        const apiRes = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: messages })
        });
        const data = await apiRes.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "[No response]";
        res.json({ reply });
    } catch(e) {
        res.status(500).json({ error: 'Gemini API Error: ' + e.message });
    }
});

app.listen(8080, () => console.log('Server running on port 8080'));


// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline scripts for development
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || [
      "http://localhost:3000",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later." },
});
app.use(limiter);

// Voice API rate limiting (more restrictive)
const voiceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 voice requests per minute
  message: {
    error:
      "Voice API rate limit exceeded. Please wait before making more requests.",
  },
});

// API usage logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", async () => {
    const duration = Date.now() - start;
    const usageData = {
      user_id: req.user?.user_id || null,
      ip_address: req.ip || req.connection.remoteAddress,
      endpoint: req.path,
      method: req.method,
      status_code: res.statusCode,
      response_time_ms: duration,
      request_size_bytes: JSON.stringify(req.body).length || 0,
      response_size_bytes: res.get("content-length") || 0,
      user_agent: req.get("user-agent"),
    };

    await DatabaseHelper.logAPIUsage(usageData);
  });

  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Optional authentication (for guest access)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

// ==================== STATIC FILE SERVING ====================
// Serve static files (HTML, CSS, JS)
app.use(express.static("."));

// ==================== ROUTES ====================

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const dbConnected = await testConnection();
    const systemHealth = await DatabaseHelper.getSystemHealth();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: dbConnected ? "connected" : "disconnected",
      version: "1.0.0",
      ...systemHealth,
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// ==================== AUTHENTICATION ROUTES ====================

// User registration
app.post(
  "/api/auth/register",
  [
    body("username").isLength({ min: 3 }).trim().escape(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("full_name").optional().isLength({ min: 2 }).trim().escape(),
    body("phone").optional().isMobilePhone("any"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, password, full_name, phone, preferences } =
        req.body;

      // Check if user already exists
      const existingUser = await DatabaseHelper.getUserByEmail(email);
      if (existingUser.success && existingUser.data.length > 0) {
        return res
          .status(409)
          .json({ error: "User already exists with this email" });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 12);

      // Create user
      const result = await DatabaseHelper.createUser({
        username,
        email,
        password_hash,
        phone,
        full_name,
        preferences: preferences || {},
      });

      if (result.success) {
        const token = jwt.sign(
          { user_id: result.data.insertId, email, username },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        res.status(201).json({
          message: "User registered successfully",
          token,
          user: {
            user_id: result.data.insertId,
            username,
            email,
            full_name,
            phone,
          },
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

// User login
app.post(
  "/api/auth/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await DatabaseHelper.getUserByEmail(email);
      if (!result.success || result.data.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result.data[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { user_id: user.user_id, email: user.email, username: user.username },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          preferences: user.preferences,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// ==================== ROUTE SEARCH ROUTES ====================

// Search routes (with optional authentication for personalization)
app.post(
  "/api/search/routes",
  optionalAuth,
  [
    body("source").isLength({ min: 2 }).trim().escape(),
    body("destination").isLength({ min: 2 }).trim().escape(),
    body("transport_type").optional().isIn(["bus", "train", "both"]),
    body("query_text").optional().isLength({ max: 500 }).trim(),
  ],
  handleValidationErrors,
  async (req, res) => {
    const startTime = Date.now();

    try {
      const {
        source,
        destination,
        transport_type = "both",
        query_text,
      } = req.body;
      const userId = req.user?.user_id;

      // Search routes
      let routeResult;
      if (userId) {
        // Personalized search for authenticated users
        routeResult = await DatabaseHelper.getPersonalizedRoutes(
          userId,
          source,
          destination,
          transport_type
        );
      } else {
        // Standard search for guests
        routeResult = await DatabaseHelper.searchRoutes(
          source,
          destination,
          transport_type
        );
      }

      if (!routeResult.success) {
        throw new Error(routeResult.error);
      }

      const routes = routeResult.data;
      const responseTime = Date.now() - startTime;

      // Log search history
      const searchData = {
        user_id: userId,
        session_id: req.sessionID || null,
        query_text: query_text || `${source} to ${destination}`,
        source_location: source,
        destination: destination,
        transport_type: transport_type,
        search_results: {
          results_found: routes.length,
          api_calls: 1,
          cache_hit: false,
        },
        response_time_ms: responseTime,
        user_agent: req.get("user-agent"),
        ip_address: req.ip,
      };

      await DatabaseHelper.logSearch(searchData);

      res.json({
        success: true,
        data: routes,
        metadata: {
          results_count: routes.length,
          search_time_ms: responseTime,
          source: source,
          destination: destination,
          transport_type: transport_type,
        },
      });
    } catch (error) {
      console.error("Route search error:", error);
      res.status(500).json({
        error: "Route search failed",
        details: error.message,
      });
    }
  }
);

// Get popular routes
app.get("/api/routes/popular", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await DatabaseHelper.getPopularRoutes(limit);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Popular routes error:", error);
    res.status(500).json({ error: "Failed to fetch popular routes" });
  }
});

// ==================== VOICE PROCESSING ROUTES ====================

// Process voice command
app.post(
  "/api/voice/process",
  voiceLimiter,
  optionalAuth,
  [
    body("voice_command").isLength({ min: 1, max: 1000 }).trim(),
    body("confidence_score").optional().isFloat({ min: 0, max: 1 }),
    body("language").optional().isLength({ min: 2, max: 10 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const startTime = Date.now();

    try {
      const {
        voice_command,
        confidence_score = 0.8,
        language = "en-US",
      } = req.body;
      const userId = req.user?.user_id;

      // Simple NLP processing for voice commands
      const processedCommand = processVoiceCommand(voice_command);
      const processingTime = Date.now() - startTime;

      // Log voice analytics
      const voiceData = {
        user_id: userId,
        session_id: req.sessionID || null,
        voice_command: voice_command,
        recognized_intent: processedCommand.intent,
        confidence_score: confidence_score,
        processing_time_ms: processingTime,
        language_detected: language,
        success: true,
        error_message: null,
      };

      await DatabaseHelper.logVoiceAnalytics(voiceData);

      // Generate response based on intent
      let response = generateVoiceResponse(processedCommand);

      // If it's a route search, perform the search
      if (
        processedCommand.intent === "route_search" &&
        processedCommand.source &&
        processedCommand.destination
      ) {
        const searchResult = await DatabaseHelper.searchRoutes(
          processedCommand.source,
          processedCommand.destination,
          processedCommand.transport_type || "both",
          5
        );

        if (searchResult.success && searchResult.data.length > 0) {
          response.data = searchResult.data;
          response.message = `I found ${searchResult.data.length} routes from ${processedCommand.source} to ${processedCommand.destination}. ${response.message}`;
        }
      }

      res.json({
        success: true,
        intent: processedCommand.intent,
        response: response,
        processing_time_ms: processingTime,
        confidence_score: confidence_score,
      });
    } catch (error) {
      console.error("Voice processing error:", error);

      // Log failed voice analytics
      const voiceData = {
        user_id: req.user?.user_id,
        session_id: req.sessionID || null,
        voice_command: req.body.voice_command,
        recognized_intent: "error",
        confidence_score: 0,
        processing_time_ms: Date.now() - startTime,
        language_detected: req.body.language || "en-US",
        success: false,
        error_message: error.message,
      };

      await DatabaseHelper.logVoiceAnalytics(voiceData);

      res.status(500).json({
        error: "Voice processing failed",
        details: error.message,
      });
    }
  }
);

// ==================== USER ROUTES ====================

// Get user profile
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const result = await DatabaseHelper.getUserById(req.user.user_id);

    if (result.success && result.data.length > 0) {
      const user = result.data[0];
      delete user.password_hash; // Remove sensitive data

      res.json({
        success: true,
        data: user,
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Get user favorites
app.get("/api/user/favorites", authenticateToken, async (req, res) => {
  try {
    const result = await DatabaseHelper.getUserFavorites(req.user.user_id);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Favorites fetch error:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// Add favorite route
app.post(
  "/api/user/favorites",
  authenticateToken,
  [
    body("route_id").isInt({ min: 1 }),
    body("alias").optional().isLength({ max: 100 }).trim().escape(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { route_id, alias } = req.body;
      const result = await DatabaseHelper.addFavorite(
        req.user.user_id,
        route_id,
        alias
      );

      if (result.success) {
        res.json({
          success: true,
          message: "Route added to favorites",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(500).json({ error: "Failed to add favorite" });
    }
  }
);

// Remove favorite route
app.delete(
  "/api/user/favorites/:routeId",
  authenticateToken,
  [param("routeId").isInt({ min: 1 })],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await DatabaseHelper.removeFavorite(
        req.user.user_id,
        req.params.routeId
      );

      if (result.success) {
        res.json({
          success: true,
          message: "Route removed from favorites",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  }
);

// ==================== FEEDBACK ROUTES ====================

// Submit feedback
app.post(
  "/api/feedback",
  optionalAuth,
  [
    body("route_id").optional().isInt({ min: 1 }),
    body("rating").isInt({ min: 1, max: 5 }),
    body("feedback_type").isIn([
      "route_accuracy",
      "app_performance",
      "voice_recognition",
      "general",
    ]),
    body("comments").optional().isLength({ max: 1000 }).trim().escape(),
    body("is_anonymous").optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const feedbackData = {
        user_id: req.user?.user_id,
        route_id: req.body.route_id || null,
        rating: req.body.rating,
        feedback_type: req.body.feedback_type,
        comments: req.body.comments || null,
        is_anonymous: req.body.is_anonymous || false,
      };

      const result = await DatabaseHelper.addFeedback(feedbackData);

      if (result.success) {
        res.json({
          success: true,
          message: "Feedback submitted successfully",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  }
);

// ==================== HELPER FUNCTIONS ====================

// Simple NLP processing for voice commands
function processVoiceCommand(command) {
  const lowerCommand = command.toLowerCase();

  // Intent recognition patterns
  const patterns = {
    route_search:
      /(?:find|show|search|get|look for).*(train|bus|route|travel|way).*(?:from|to)|(?:train|bus).*(?:from|to)/i,
    greeting: /^(?:hello|hi|hey|good morning|good afternoon|good evening)/i,
    help: /help|assist|support|what can you do|how to use/i,
    goodbye: /bye|goodbye|see you|thanks|thank you/i,
  };

  let intent = "general";
  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.test(lowerCommand)) {
      intent = key;
      break;
    }
  }

  // Extract locations and transport type
  const fromMatch = lowerCommand.match(/from\s+([a-zA-Z\s]+?)(?:\s+to|$)/);
  const toMatch = lowerCommand.match(/to\s+([a-zA-Z\s]+?)(?:\s|$)/);

  const transportMatch = lowerCommand.match(/\b(train|bus|both)\b/);

  return {
    intent,
    source: fromMatch ? fromMatch[1].trim() : null,
    destination: toMatch ? toMatch[1].trim() : null,
    transport_type: transportMatch ? transportMatch[1] : "both",
    original_command: command,
  };
}

// Generate appropriate voice responses
function generateVoiceResponse(processedCommand) {
  const responses = {
    route_search: {
      message:
        "Let me search for the best routes for you. I'll check both trains and buses to find the most suitable options.",
      speak: true,
    },
    greeting: {
      message:
        "Hello! I'm VoiceRoute assistant. I can help you find train and bus routes across India. Just tell me where you want to go!",
      speak: true,
    },
    help: {
      message:
        "I can help you find transportation routes. Try saying things like 'Find trains from Delhi to Mumbai' or 'Show bus routes to Pune'. You can also ask for the fastest or cheapest options.",
      speak: true,
    },
    goodbye: {
      message:
        "Thank you for using VoiceRoute! Have a safe journey and feel free to ask for help anytime.",
      speak: true,
    },
    general: {
      message:
        "I understand you're looking for travel information. Could you please specify your source and destination? For example, say 'Find routes from Delhi to Mumbai'.",
      speak: true,
    },
  };

  return responses[processedCommand.intent] || responses.general;
}

// ==================== SCHEDULED TASKS ====================

// Clean up old sessions and logs (runs daily at 2 AM)
cron.schedule("0 2 * * *", async () => {
  console.log("Running daily cleanup tasks...");

  try {
    // Clean up expired sessions
    await DatabaseHelper.query(
      "DELETE FROM user_sessions WHERE expires_at < NOW()"
    );

    // Archive old search history (older than 6 months)
    await DatabaseHelper.query(`
            DELETE FROM search_history 
            WHERE search_timestamp < DATE_SUB(NOW(), INTERVAL 6 MONTH)
        `);

    // Clean up old API usage logs (older than 30 days)
    await DatabaseHelper.query(`
            DELETE FROM api_usage 
            WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);

    console.log("Daily cleanup completed successfully");
  } catch (error) {
    console.error("Daily cleanup failed:", error);
  }
});

// ==================== ERROR HANDLING ====================

// Root path - serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// 404 handler for API routes only
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    available_endpoints: [
      "GET /api/health",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "POST /api/search/routes",
      "GET /api/routes/popular",
      "POST /api/voice/process",
      "GET /api/user/profile",
      "GET /api/user/favorites",
      "POST /api/user/favorites",
      "POST /api/feedback",
    ],
  });
});

// 404 handler for all other non-API routes
app.use("*", (req, res) => {
  res.status(404).sendFile(__dirname + "/index.html");
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  res.status(error.status || 500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error(
        "❌ Failed to connect to database. Please check your MySQL configuration."
      );
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 VoiceRoute Backend Server Running!`);
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📖 API Documentation available at endpoints`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log(`\n🎯 Ready to handle voice transportation queries!`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

startServer();




