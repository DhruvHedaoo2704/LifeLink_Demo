import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
dotenv.config();

const config = {
  // Environment info
  get env() { return process.env.NODE_ENV || 'development'; },
  get isProduction() { return this.env === 'production'; },
  get isTest() { return this.env === 'test'; },
  get port() { return parseInt(process.env.PORT || '5000', 10); },

  // Database
  get mongodbUri() { 
    if (this.isProduction && !process.env.MONGODB_URI && !process.env.MONGO_URI && !process.env.DATABASE_URL) {
      throw new Error('Database URI is not configured in environment variables for production.');
    }
    return process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/lifelink'; 
  },

  // CORS Allowed Origins & URLs
  get frontendUrl() { 
    return process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173'; 
  },
  get corsOrigins() {
    const list = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || process.env.CLIENT_URL;
    if (list) {
      return list.split(',').map(item => item.trim());
    }
    if (this.isProduction) {
      return ['https://life-link-wheat.vercel.app'];
    }
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  },
  isOriginAllowed(origin) {
    if (!origin) return true;
    const origins = this.corsOrigins;
    if (origins.includes(origin) || origins.includes('*')) {
      return true;
    }
    const isVercelPreview = origin.endsWith('.vercel.app') && origin.toLowerCase().includes('life-link');
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    return isVercelPreview || isLocalhost;
  },

  // JWT configuration
  get jwtSecret() { 
    if (this.isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'lifelink_jwt_secret_key_2026_special_auth_token')) {
      throw new Error('JWT_SECRET must be set to a secure unique string in production.');
    }
    return process.env.JWT_SECRET || 'lifelink_jwt_secret_key_2026_special_auth_token'; 
  },
  get jwtRefreshSecret() { 
    if (this.isProduction && (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'lifelink_jwt_refresh_secret_key_2026_refresh_auth_token')) {
      throw new Error('JWT_REFRESH_SECRET must be set to a secure unique string in production.');
    }
    return process.env.JWT_REFRESH_SECRET || 'lifelink_jwt_refresh_secret_key_2026_refresh_auth_token'; 
  },
  get jwtExpire() { return process.env.JWT_EXPIRE || '15m'; },
  get jwtRefreshExpire() { return process.env.JWT_REFRESH_EXPIRE || '7d'; },

  // Encryption key
  get encryptionKey() { 
    if (this.isProduction && (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === 'f1a8b9c8d7e6f5a4b3c2d1e0f9a8b7c6')) {
      throw new Error('ENCRYPTION_KEY must be set to a secure 32-byte key in production.');
    }
    return process.env.ENCRYPTION_KEY || 'f1a8b9c8d7e6f5a4b3c2d1e0f9a8b7c6'; 
  },

  // Logger level
  get logLevel() { return process.env.LOG_LEVEL || 'info'; },

  // Email Config
  get emailProvider() { return process.env.EMAIL_PROVIDER || 'log'; },
  get smtpHost() { return process.env.SMTP_HOST || ''; },
  get smtpPort() { return parseInt(process.env.SMTP_PORT || '587', 10); },
  get smtpUser() { return process.env.SMTP_USER || ''; },
  get smtpPass() { return process.env.SMTP_PASS || ''; },
  get emailFrom() { return process.env.EMAIL_FROM || '"LifeLink" <no-reply@lifelink.org>'; },

  // SMS Twilio Config
  get twilioAccountSid() { return process.env.TWILIO_ACCOUNT_SID || ''; },
  get twilioAuthToken() { return process.env.TWILIO_AUTH_TOKEN || ''; },
  get twilioPhoneNumber() { return process.env.TWILIO_PHONE || process.env.TWILIO_PHONE_NUMBER || ''; },
  get twilioEnabled() {
    return !!(this.twilioAccountSid && this.twilioAuthToken && this.twilioPhoneNumber);
  },

  // Cloudinary configuration (if applicable)
  get cloudinaryName() { return process.env.CLOUDINARY_NAME || ''; },
  get cloudinaryKey() { return process.env.CLOUDINARY_KEY || ''; },
  get cloudinarySecret() { return process.env.CLOUDINARY_SECRET || ''; },

  // OAuth Google Config
  get googleClientId() { return process.env.GOOGLE_CLIENT_ID || ''; },
  get googleClientSecret() { return process.env.GOOGLE_CLIENT_SECRET || ''; },

  // Session Config
  get sessionSecret() { return process.env.SESSION_SECRET || 'lifelink_default_session_secret_2026'; }
};

export default config;
