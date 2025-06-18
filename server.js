import express from 'express';
import cors from 'cors';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting server...');
console.log('Current directory:', __dirname);

// Load environment variables from .env
try {
  dotenv.config();
  console.log('Environment file loaded successfully');
} catch (error) {
  console.error('Error loading environment file:', error);
  process.exit(1);
}

// Debug: Log all environment variables (without exposing sensitive data)
console.log('\nEnvironment variables loaded:');
console.log('VITE_SENDGRID_API_KEY exists:', !!process.env.VITE_SENDGRID_API_KEY);
console.log('VITE_SENDGRID_API_KEY prefix:', process.env.VITE_SENDGRID_API_KEY?.substring(0, 5) + '...');
console.log('VITE_SENDGRID_FROM_EMAIL:', process.env.VITE_SENDGRID_FROM_EMAIL);
console.log('VITE_SUPABASE_URL exists:', !!process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const app = express();
const port = process.env.PORT || 3000;

// Configure rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { 
    success: false, 
    error: 'Too many requests, please try again later.',
    details: { errors: [{ message: 'Rate limit exceeded. Please wait 15 minutes before trying again.' }] }
  }
});

// Configure CORS
const corsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are not set in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Configure SendGrid
const apiKey = process.env.VITE_SENDGRID_API_KEY;
const fromEmail = process.env.VITE_SENDGRID_FROM_EMAIL;

if (!apiKey) {
  console.error('VITE_SENDGRID_API_KEY is not set in environment variables');
  process.exit(1);
}

if (!fromEmail) {
  console.error('VITE_SENDGRID_FROM_EMAIL is not set in environment variables');
  process.exit(1);
}

try {
  sgMail.setApiKey(apiKey);
  console.log('SendGrid configured successfully');
} catch (error) {
  console.error('Error configuring SendGrid:', error);
  process.exit(1);
}

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`\n${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Email validation function
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Waitlist endpoint with rate limiting
app.post('/api/waitlist', limiter, async (req, res) => {
  console.log('\nProcessing waitlist request...');
  console.log('Request body:', req.body);
  
  const { email } = req.body;
  
  // Validate email presence
  if (!email) {
    console.log('Missing email in request');
    return res.status(400).json({ 
      success: false, 
      error: 'Email is required',
      details: { errors: [{ message: 'Please provide an email address' }] }
    });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    console.log('Invalid email format:', email);
    return res.status(400).json({
      success: false,
      error: 'Invalid email format',
      details: { errors: [{ message: 'Please provide a valid email address' }] }
    });
  }

  try {
    // Check if email already exists in Supabase
    const { data: existingUser, error: queryError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email)
      .single();

    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw queryError;
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
        details: { errors: [{ message: 'This email is already on our waitlist' }] }
      });
    }

    // Store email in Supabase
    const { error: insertError } = await supabase
      .from('waitlist')
      .insert([{ 
        email,
        created_at: new Date().toISOString()
      }]);

    if (insertError) {
      throw insertError;
    }

    console.log('Email stored in Supabase successfully');

    // Send welcome email
    console.log('Preparing to send welcome email to:', email);
    const msg = {
      to: email,
      from: fromEmail,
      subject: 'Welcome to the Waitlist!',
      text: `Thank you for joining our waitlist! We'll keep you updated on our progress.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to the Waitlist!</h1>
          <p>Thank you for joining our waitlist! We're excited to have you on board.</p>
          <p>We'll keep you updated on our progress and let you know as soon as we launch.</p>
          <p>Best regards,<br>Ilya Zoria, Founder of <a href="https://www.resumebuilderai.xyz/" target="_blank" rel="noopener noreferrer">Resume Builder AI</a></p>
        </div>
      `,
    };

    console.log('Email configuration:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject
    });

    await sgMail.send(msg);
    console.log('Welcome email sent successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing waitlist request:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.body,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process waitlist request',
      details: {
        message: error.message,
        sendgridError: error.response?.body,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`\nServer running at http://localhost:${port}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
}); 