const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./auth');
const QuizAttempt = require('../models/quizAttempt');
const mongoose = require('mongoose');

// Get user quiz history by userId
router.get('/:userId/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        console.log(`[PROFILE] Fetching quiz history for user: ${userId}, page: ${page}, limit: ${limit}`);

        // Validate userId is valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        // Count total number of results for pagination
        const totalCount = await QuizAttempt.countDocuments({ user: userId });

        // Find all quiz attempts for this user, populate quiz details
        const results = await QuizAttempt.find({ user: userId })
            .sort({ completedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('quiz', 'title category difficulty');

        console.log(`[PROFILE] Found ${results.length} quiz attempts (page ${page} of ${Math.ceil(totalCount / limit)})`);

        // Calculate stats from all attempts (not just current page)
        const allResults = await QuizAttempt.find({ user: userId });
        const totalScore = allResults.reduce((sum, result) => sum + result.score, 0);
        const totalQuestions = allResults.reduce((sum, result) => sum + result.totalQuestions, 0);
        const averageScore = allResults.length ? Math.round((totalScore / totalQuestions) * 100) : 0;

        // Format response
        res.json({
            success: true,
            quizzesTaken: totalCount,
            averageScore,
            correctAnswers: totalScore,
            totalQuestions,
            page,
            pages: Math.ceil(totalCount / limit),
            total: totalCount,
            history: results.map(result => ({
                id: result._id,
                quizId: result.quiz ? result.quiz._id : null,
                title: result.quiz ? result.quiz.title : 'Unknown Quiz',
                category: result.quiz ? result.quiz.category : 'Unknown',
                difficulty: result.quiz ? result.quiz.difficulty : 'Unknown',
                score: result.score,
                percentage: result.percentage,
                totalQuestions: result.totalQuestions,
                timeTaken: result.timeTaken,
                completedAt: result.completedAt
            }))
        });
    } catch (error) {
        console.error('[PROFILE] Error fetching quiz history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching quiz history',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
});

module.exports = router; 