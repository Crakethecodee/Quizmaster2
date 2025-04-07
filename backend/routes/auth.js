const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const QuizAttempt = require('../models/quizAttempt');

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');

        // Find user by id
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Add user to request
        req.user = user;
        req.token = token;

        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        // Check if request body exists and has required fields
        if (!req.body || !req.body.email || !req.body.password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1d' }
        );

        // Return JSON response
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during login',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        // Get user stats using the async function
        const stats = await req.user.getStats();

        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                profilePicture: req.user.profilePicture,
                stats: stats
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
});

// Logout user - This is handled on client side by removing the token
router.post('/logout', authMiddleware, (req, res) => {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// Update user profile
router.put('/update-profile', authMiddleware, async (req, res) => {
    try {
        const updates = {};

        // Only allow these fields to be updated
        ['username', 'email', 'profilePicture'].forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid updates provided' });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Check current password
        const isMatch = await req.user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // Update password
        req.user.password = newPassword;
        await req.user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user quiz history
router.get('/quiz-history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        console.log(`[QUIZ HISTORY] Fetching quiz history for user: ${userId}`);

        // Get total count for pagination
        const totalCount = await QuizAttempt.countDocuments({ user: userId });

        // Get quiz attempts with pagination
        const quizAttempts = await QuizAttempt.find({ user: userId })
            .sort({ completedAt: -1 }) // Most recent first
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'quiz',
                select: 'title category difficulty'
            });

        console.log(`[QUIZ HISTORY] Found ${quizAttempts.length} quiz attempts for user`);

        // Calculate statistics
        let totalScore = 0;
        let totalQuestions = 0;

        const allAttempts = await QuizAttempt.find({ user: userId });
        allAttempts.forEach(attempt => {
            totalScore += attempt.score;
            totalQuestions += attempt.totalQuestions;
        });

        const averageScore = totalQuestions > 0
            ? Math.round((totalScore / totalQuestions) * 100 * 10) / 10
            : 0;

        const formattedAttempts = quizAttempts.map(attempt => ({
            id: attempt._id,
            quiz: attempt.quiz ? {
                id: attempt.quiz._id,
                title: attempt.quiz.title,
                category: attempt.quiz.category,
                difficulty: attempt.quiz.difficulty
            } : {
                title: 'Unknown Quiz',
                category: 'Unknown',
                difficulty: 'Unknown'
            },
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            percentage: attempt.percentage,
            timeTaken: attempt.timeTaken,
            completedAt: attempt.completedAt
        }));

        return res.status(200).json({
            success: true,
            stats: {
                totalQuizzes: totalCount,
                averageScore: averageScore,
                totalQuestionsAnswered: totalQuestions,
                correctAnswers: totalScore
            },
            quizHistory: {
                total: totalCount,
                page,
                pages: Math.ceil(totalCount / limit),
                attempts: formattedAttempts
            }
        });
    } catch (error) {
        console.error('[QUIZ HISTORY] Error fetching quiz history:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching quiz history',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
});

// Export router and middleware
module.exports = { router, authMiddleware }; 