import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';
import config from './config/index.js';
import { nosqlSanitize, xssClean } from './middleware/security.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Load routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import requestRoutes from './routes/requests.js';
import notificationRoutes from './routes/notifications.js';
import assistantRoutes from './routes/assistant.js';

// Swagger OpenAPI documentation
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';

// Initialize express app
const app = express();

// Apply response compression
app.use(compression());

// Security Headers Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (config.isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsers
app.use(express.json({ limit: '10mb' })); // Limit body size to prevent DOS
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Custom Security Sanitization (NoSQL injection and XSS protection)
app.use(nosqlSanitize);
app.use(xssClean);

// Global Rate Limiter for API endpoints
app.use('/api', apiLimiter);

// Swagger Documentation UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount REST Route endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/assistant', assistantRoutes);

// Base health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LifeLink Backend Server is active and healthy.'
  });
});

// Serve frontend static assets in production (fallback mode)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (config.isProduction) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/api-docs')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global central error handler middleware
app.use(errorHandler);

export default app;
