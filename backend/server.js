const express = require('express');
const mongoose = require('mongoose'); // ✅ Include Mongoose
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizmaster';

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        // Continue running even if MongoDB fails to connect
        console.log("⚠️ Running without MongoDB - some features will not work");
    });

// Debug environment variables
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', __dirname);

// Important middleware - MUST be before route handlers
// Parse JSON request bodies
app.use(express.json());

// Enable CORS
app.use(cors());

// Parse URL-encoded bodies (HTML forms)
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Import routes - FIXED: import the router correctly
const authModule = require('./routes/auth');
const quizRouter = require('./routes/quiz');
const profileRouter = require('./routes/profile');

// Define paths
const frontendPath = path.resolve(__dirname, '../frontend');
const pagesPath = path.resolve(frontendPath, 'pages');
const publicPath = path.resolve(frontendPath, 'public');
const stylesPath = path.resolve(frontendPath, 'styles');
const scriptsPath = path.resolve(frontendPath, 'scripts');

console.log('Frontend path:', frontendPath);

// Serve static files from frontend directories in the correct order
// 1. First, serve files from the public directory at the root level
app.use(express.static(publicPath));

// Also serve images from public/images at /images path for compatibility
app.use('/images', express.static(path.join(publicPath, 'images')));

// Add cache control for static images
app.use('/images', (req, res, next) => {
    // Set cache headers for images
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString());
    next();
});

// 2. Serve static assets from specific directories
app.use('/styles', express.static(stylesPath));
app.use('/scripts', express.static(scriptsPath));

// Register API routes - ✅ Fixed auth router registration
app.use('/api/auth', authModule.router);
app.use('/api/quizzes', quizRouter);
app.use('/api/profile', profileRouter);

// Add the alternative submit endpoint
app.post('/api/submit-quiz', (req, res) => {
    console.log('[SERVER] Redirecting /api/submit-quiz to quiz router');
    quizRouter.handle(req, res);
});

// 3. Serve HTML files from specific URLs
// Route for index.html (both / and /index.html)
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(pagesPath, 'index.html'));
});

// Route for other HTML files
app.get('/:page.html', (req, res, next) => {
    const pagePath = path.join(pagesPath, req.params.page + '.html');

    // Check if file exists before sending
    if (fs.existsSync(pagePath)) {
        res.sendFile(pagePath);
    } else {
        next(); // Pass to next handler if file doesn't exist
    }
});

// Legacy routes for backward compatibility
app.get('/pages/:page', (req, res) => {
    const pagePath = path.join(pagesPath, req.params.page);
    console.log('Attempting to serve page via /pages route:', pagePath);

    if (fs.existsSync(pagePath)) {
        res.sendFile(pagePath);
    } else {
        res.status(404).json({ error: 'Page not found' });
    }
});

// Handle client-side routing for SPAs
app.get('/quiz/:id', (req, res) => {
    res.sendFile(path.join(pagesPath, 'quiz.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Fallback to index.html for SPA routing
// This should be AFTER API routes but BEFORE the 404 handler
app.use((req, res, next) => {
    // Skip API routes and file requests
    if (req.url.startsWith('/api/') || req.url.includes('.')) {
        next();
        return;
    }

    // Send index.html for client-side routing
    res.sendFile(path.join(pagesPath, 'index.html'));
});

// 404 handler - this should be after all valid routes
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: 'Resource not found',
        path: req.url
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`🔗 Access the app at http://localhost:${PORT}`);
});
