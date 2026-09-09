const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Import routes
const authRoutes = require('./Routes/authRoutes');
const userRoutes = require('./Routes/userRoutes');
const medicationRoutes = require('./Routes/medicationRoutes');
const appointmentRoutes = require('./Routes/appointmentRoutes');
const documentRoutes = require('./Routes/documentRoutes');
const vitalsRoutes = require('./Routes/vitalsRoutes');
const sosRoutes = require('./Routes/sosRoutes');
const aiRoutes = require('./Routes/aiRoutes');
require('./Config/passport'); // Initialize Google OAuth

// Import middleware
const { errorHandler } = require('./Middleware/errorMiddleware');
const { rateLimiter } = require('./Middleware/rateLimiter');

// Import services for initialization
const { loadDrugInteractionDatabase } = require('./Utils/drugDatabase');
const { checkOllamaHealth } = require('./Utils/ollamaClient');

const app = express();

// Trust proxy for rate limiting (needed for Vercel/proxies)
app.set('trust proxy', 1);

// =====================================================
// ✅ Initialize Services on Startup
// =====================================================

// Initialize drug interaction database
(async () => {
  try {
    loadDrugInteractionDatabase();
    console.log('✅ Drug interaction database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize drug interaction database:', error.message);
  }
})();

// Initialize Ollama health check
(async () => {
  try {
    const health = await checkOllamaHealth();
    if (health.healthy) {
      console.log('✅ Ollama is running and healthy');
      if (health.models && health.models.length > 0) {
        console.log(`   Available models: ${health.models.join(', ')}`);
      }
    } else {
      console.warn('⚠️  WARNING: Ollama is not available:', health.error);
      console.warn('   AI features will operate in degraded mode using fallback data');
      console.warn('   To enable full AI features, please start Ollama server');
    }
  } catch (error) {
    console.warn('⚠️  WARNING: Could not check Ollama health:', error.message);
    console.warn('   AI features will operate in degraded mode');
  }
})();

// =====================================================
// ✅ CORS Configuration - FIXED
// =====================================================

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS middleware - handles both preflight and actual requests
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id']
}));


// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use(rateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Nabda Backend API is Running Successfully!');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Health Sync API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'Health Sync API',
    version: '1.0.0',
    description: 'Health Management System API',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      medications: '/api/medications',
      appointments: '/api/appointments',
      documents: '/api/documents'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
