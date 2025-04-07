const express = require('express');
// Create router using Express Router
const router = express.Router();
// Import authMiddleware
const { authMiddleware } = require('./auth');
const Quiz = require('../models/quiz');
const QuizAttempt = require('../models/quizAttempt');
const mongoose = require('mongoose');

// Get all quizzes
router.get('/', (req, res) => {
    try {
        // Get query parameters
        const category = req.query.category;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;

        // Mock data
        const quizzes = [
            {
                id: "1",
                title: "General Knowledge Quiz",
                description: "Test your knowledge with these general knowledge questions",
                category: "General Knowledge",
                difficulty: "Medium",
                questionCount: 5,
                creator: "Admin",
                createdAt: new Date(),
                timesPlayed: 25
            },
            {
                id: "2",
                title: "Science Quiz",
                description: "Test your scientific knowledge with these challenging questions",
                category: "Science",
                difficulty: "Hard",
                questionCount: 5,
                creator: "Admin",
                createdAt: new Date(),
                timesPlayed: 18
            },
            {
                id: "3",
                title: "History Quiz",
                description: "Test your knowledge of historical events and figures",
                category: "History",
                difficulty: "Medium",
                questionCount: 5,
                creator: "Admin",
                createdAt: new Date(),
                timesPlayed: 12
            }
        ];

        // Filter by category if provided
        const filteredQuizzes = category
            ? quizzes.filter(quiz => quiz.category === category)
            : quizzes;

        res.json({
            success: true,
            count: filteredQuizzes.length,
            total: filteredQuizzes.length,
            page,
            pages: Math.ceil(filteredQuizzes.length / limit),
            data: filteredQuizzes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get featured quizzes
router.get('/featured', (req, res) => {
    try {
        // Mock data for featured quizzes
        const featuredQuizzes = [
            {
                id: "1",
                title: "General Knowledge Quiz",
                description: "Test your knowledge with these general knowledge questions",
                category: "General Knowledge",
                difficulty: "Medium",
                questionCount: 5,
                creator: "Admin"
            },
            {
                id: "2",
                title: "Science Quiz",
                description: "Test your scientific knowledge with these challenging questions",
                category: "Science",
                difficulty: "Hard",
                questionCount: 5,
                creator: "Admin"
            },
            {
                id: "3",
                title: "History Quiz",
                description: "Test your knowledge of historical events and figures",
                category: "History",
                difficulty: "Medium",
                questionCount: 5,
                creator: "Admin"
            }
        ];

        res.json({
            success: true,
            data: featuredQuizzes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get a single quiz
router.get('/:id', (req, res) => {
    try {
        // Mock data for a single quiz
        const quiz = {
            id: req.params.id,
            title: "Sample Quiz",
            description: "This is a sample quiz description",
            category: "General Knowledge",
            difficulty: "Medium",
            timeLimit: 60,
            questions: [
                {
                    id: "q1",
                    text: "What is the capital of France?",
                    options: ["London", "Berlin", "Paris", "Madrid"]
                },
                {
                    id: "q2",
                    text: "Which planet is known as the Red Planet?",
                    options: ["Earth", "Mars", "Jupiter", "Venus"]
                }
            ],
            creator: "Admin"
        };

        res.json({
            success: true,
            data: quiz
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add basic route handlers for all necessary endpoints
router.post('/', authMiddleware, (req, res) => {
    res.status(201).json({
        success: true,
        message: "Quiz created successfully",
        data: { id: "new-quiz-id" }
    });
});

// Submit quiz answers
router.post('/:id/submit', authMiddleware, async (req, res) => {
    try {
        const quizId = req.params.id;
        const userId = req.user._id;
        let { answers, timeTaken } = req.body;

        console.log(`[QUIZ-SUBMIT] Processing submission - Quiz ID: ${quizId}, User ID: ${userId}`);
        console.log(`[QUIZ-SUBMIT] Request body:`, JSON.stringify(req.body));

        // Check if the answers are empty or missing
        if (!answers) {
            console.log('[QUIZ-SUBMIT] Error: Missing answers in request body');
            return res.status(400).json({
                success: false,
                message: 'Answers are required'
            });
        }

        // Normalize answers array format
        if (!Array.isArray(answers)) {
            console.log('[QUIZ-SUBMIT] Error: Answers must be an array', typeof answers);
            return res.status(400).json({
                success: false,
                message: 'Invalid answers format. Expected an array.'
            });
        }

        // Try to find the quiz 
        let quiz;
        let isMockQuiz = false;

        try {
            // Check if ID is a numeric string like "1", "2", etc. - these are mock quizzes
            if (/^\d+$/.test(quizId)) {
                console.log('[QUIZ-SUBMIT] Detected numeric ID, using mock quiz data:', quizId);
                isMockQuiz = true;

                // Create mock quiz with a valid ObjectId
                quiz = {
                    _id: new mongoose.Types.ObjectId(), // Generate a valid ObjectId for the mock quiz
                    title: `${quizId === "1" ? "JavaScript" : quizId === "2" ? "Science" : "General"} Quiz`,
                    questions: [
                        { text: "Question 1", options: ["Option A", "Option B", "Option C", "Option D"], correctAnswer: 2 },
                        { text: "Question 2", options: ["Option 1", "Option 2", "Option 3", "Option 4"], correctAnswer: 1 }
                    ],
                    updateStats: async function () {
                        console.log('[QUIZ-SUBMIT] Mock stats update for quiz', quizId);
                        return Promise.resolve();
                    }
                };
            }
            // Otherwise try to find a real quiz by ObjectId
            else if (mongoose.Types.ObjectId.isValid(quizId)) {
                console.log('[QUIZ-SUBMIT] Looking up quiz by ObjectId');
                quiz = await Quiz.findById(quizId);
            }

            // If quiz is still not found, return 404
            if (!quiz) {
                console.log('[QUIZ-SUBMIT] Quiz not found:', quizId);
                return res.status(404).json({
                    success: false,
                    message: 'Quiz not found'
                });
            }
        } catch (error) {
            console.error('[QUIZ-SUBMIT] Error finding quiz:', error);
            return res.status(400).json({
                success: false,
                message: 'Invalid quiz ID format'
            });
        }

        console.log(`[QUIZ-SUBMIT] Found quiz: ${quiz.title} with ${quiz.questions.length} questions`);

        // Extract raw answers for score calculation
        const rawAnswers = Array.isArray(answers[0]) ? answers :
            (answers[0] && answers[0].selectedAnswer !== undefined) ?
                answers.map(a => a.selectedAnswer) : answers;

        console.log('[QUIZ-SUBMIT] Raw answers for score calculation:', rawAnswers);

        // Calculate score
        let score = 0;
        const results = [];

        // Make sure answers are not longer than questions
        const validAnswers = rawAnswers.slice(0, quiz.questions.length);

        // Ensure all answers are >= 0
        const sanitizedAnswers = validAnswers.map(answer => {
            return answer !== null && answer !== undefined ? Math.max(0, answer) : null;
        });

        sanitizedAnswers.forEach((answer, index) => {
            // Make sure there's a corresponding question
            if (index < quiz.questions.length) {
                const question = quiz.questions[index];

                // Check if answer is valid 
                const isValid = answer !== null && answer >= 0 && answer < question.options.length;

                // Determine if correct
                const isCorrect = isValid && answer === question.correctAnswer;

                if (isCorrect) {
                    score++;
                }

                results.push({
                    question: question.text,
                    userAnswer: isValid ? answer : null,
                    correctAnswer: question.correctAnswer,
                    isCorrect: isCorrect,
                    explanation: question.explanation || ''
                });
            }
        });

        const totalQuestions = quiz.questions.length;
        const percentage = Math.round((score / totalQuestions) * 100);

        console.log(`[QUIZ-SUBMIT] Score calculated: ${score}/${totalQuestions} (${percentage}%)`);

        try {
            // Special handling for mock quiz mode
            if (isMockQuiz) {
                console.log('[QUIZ-SUBMIT] Running in mock mode - returning results without DB save');
                return res.json({
                    success: true,
                    data: {
                        score,
                        totalQuestions,
                        percentage,
                        results,
                        quizAttemptId: new mongoose.Types.ObjectId().toString()
                    }
                });
            }

            // For real quizzes, save to database
            // Create a new quiz attempt for real DB
            console.log('[QUIZ-SUBMIT] Creating quiz attempt document');

            // Ensure answers are in the correct format for the schema
            const formattedAnswers = sanitizedAnswers.map((answer, index) => ({
                questionIndex: index,
                selectedAnswer: answer !== null ? answer : 0 // Ensure we don't store null or negative values
            }));

            const quizAttempt = new QuizAttempt({
                user: userId,
                quiz: quiz._id,
                answers: formattedAnswers,
                score,
                totalQuestions,
                percentage,
                timeTaken: timeTaken || 0,
                results,
                completedAt: new Date()
            });

            console.log('[QUIZ-SUBMIT] Saving quiz attempt');

            // Save the attempt
            await quizAttempt.save();

            console.log('[QUIZ-SUBMIT] Attempt saved successfully, ID:', quizAttempt._id);

            // Return results
            return res.json({
                success: true,
                data: {
                    score,
                    totalQuestions,
                    percentage,
                    results,
                    quizAttemptId: quizAttempt._id
                }
            });
        } catch (dbError) {
            console.error('[QUIZ-SUBMIT] Error saving quiz attempt:', dbError);
            console.error('[QUIZ-SUBMIT] Error details:', dbError.errors || dbError.message);

            // Return a simplified error for the client
            return res.status(500).json({
                success: false,
                message: 'Error saving quiz submission. Please try again.',
                error: process.env.NODE_ENV === 'development' ? dbError.message : 'Database error'
            });
        }
    } catch (error) {
        console.error('[QUIZ-SUBMIT] Unexpected error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error submitting quiz',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
});

// Submit quiz answers (alternative endpoint)
router.post('/submit-quiz', authMiddleware, async (req, res) => {
    try {
        const { quizId, answers, timeTaken } = req.body;
        const userId = req.user._id;

        console.log(`[SUBMIT-QUIZ] Processing submission via alternative endpoint - Quiz ID: ${quizId}, User ID: ${userId}`);
        console.log(`[SUBMIT-QUIZ] Request body:`, JSON.stringify(req.body));

        // Validate required fields
        if (!quizId) {
            console.log('[SUBMIT-QUIZ] Error: Missing quizId in request body');
            return res.status(400).json({
                success: false,
                message: 'Quiz ID is required'
            });
        }

        if (!answers) {
            console.log('[SUBMIT-QUIZ] Error: Missing answers in request body');
            return res.status(400).json({
                success: false,
                message: 'Answers are required'
            });
        }

        if (!Array.isArray(answers)) {
            console.log('[SUBMIT-QUIZ] Error: Answers must be an array', typeof answers);
            return res.status(400).json({
                success: false,
                message: 'Invalid answers format. Expected an array.'
            });
        }

        // Try to find the quiz 
        let quiz;
        let isMockQuiz = false;

        try {
            // Check if ID is a numeric string like "1", "2", etc. - these are mock quizzes
            if (/^\d+$/.test(quizId)) {
                console.log('[SUBMIT-QUIZ] Detected numeric ID, using mock quiz data:', quizId);
                isMockQuiz = true;

                // Create mock quiz with a valid ObjectId
                quiz = {
                    _id: new mongoose.Types.ObjectId(), // Generate a valid ObjectId for the mock quiz
                    title: `${quizId === "1" ? "JavaScript" : quizId === "2" ? "Science" : "General"} Quiz`,
                    questions: [
                        { text: "Question 1", options: ["Option A", "Option B", "Option C", "Option D"], correctAnswer: 2 },
                        { text: "Question 2", options: ["Option 1", "Option 2", "Option 3", "Option 4"], correctAnswer: 1 }
                    ],
                    updateStats: async function () {
                        console.log('[SUBMIT-QUIZ] Mock stats update for quiz', quizId);
                        return Promise.resolve();
                    }
                };
            }
            // Otherwise try to find a real quiz by ObjectId
            else if (mongoose.Types.ObjectId.isValid(quizId)) {
                console.log('[SUBMIT-QUIZ] Looking up quiz by ObjectId');
                quiz = await Quiz.findById(quizId);
            }

            // If quiz is still not found, return 404
            if (!quiz) {
                console.log('[SUBMIT-QUIZ] Quiz not found:', quizId);
                return res.status(404).json({
                    success: false,
                    message: 'Quiz not found'
                });
            }
        } catch (error) {
            console.error('[SUBMIT-QUIZ] Error finding quiz:', error);
            return res.status(400).json({
                success: false,
                message: 'Invalid quiz ID format'
            });
        }

        console.log(`[SUBMIT-QUIZ] Found quiz: ${quiz.title} with ${quiz.questions.length} questions`);

        // Extract raw answers for score calculation
        const rawAnswers = Array.isArray(answers[0]) ? answers :
            (answers[0] && answers[0].selectedAnswer !== undefined) ?
                answers.map(a => a.selectedAnswer) : answers;

        console.log('[SUBMIT-QUIZ] Raw answers for score calculation:', rawAnswers);

        // Calculate score
        let score = 0;
        const results = [];

        // Make sure answers are not longer than questions
        const validAnswers = rawAnswers.slice(0, quiz.questions.length);

        // Ensure all answers are >= 0
        const sanitizedAnswers = validAnswers.map(answer => {
            return answer !== null && answer !== undefined ? Math.max(0, answer) : null;
        });

        sanitizedAnswers.forEach((answer, index) => {
            // Make sure there's a corresponding question
            if (index < quiz.questions.length) {
                const question = quiz.questions[index];

                // Check if answer is valid 
                const isValid = answer !== null && answer >= 0 && answer < question.options.length;

                // Determine if correct
                const isCorrect = isValid && answer === question.correctAnswer;

                if (isCorrect) {
                    score++;
                }

                results.push({
                    question: question.text,
                    userAnswer: isValid ? answer : null,
                    correctAnswer: question.correctAnswer,
                    isCorrect: isCorrect,
                    explanation: question.explanation || ''
                });
            }
        });

        const totalQuestions = quiz.questions.length;
        const percentage = Math.round((score / totalQuestions) * 100);

        console.log(`[SUBMIT-QUIZ] Score calculated: ${score}/${totalQuestions} (${percentage}%)`);

        try {
            // Special handling for mock quiz mode
            if (isMockQuiz) {
                console.log('[SUBMIT-QUIZ] Running in mock mode - returning results without DB save');
                return res.json({
                    success: true,
                    data: {
                        score,
                        totalQuestions,
                        percentage,
                        results,
                        quizAttemptId: new mongoose.Types.ObjectId().toString()
                    }
                });
            }

            // For real quizzes, save to database
            console.log('[SUBMIT-QUIZ] Creating quiz attempt document');

            // Ensure answers are in the correct format for the schema
            const formattedAnswers = sanitizedAnswers.map((answer, index) => ({
                questionIndex: index,
                selectedAnswer: answer !== null ? answer : 0 // Ensure we don't store null or negative values
            }));

            const quizAttempt = new QuizAttempt({
                user: userId,
                quiz: quiz._id,
                answers: formattedAnswers,
                score,
                totalQuestions,
                percentage,
                timeTaken: timeTaken || 0,
                results,
                completedAt: new Date()
            });

            console.log('[SUBMIT-QUIZ] Saving quiz attempt');

            // Save the attempt
            await quizAttempt.save();

            console.log('[SUBMIT-QUIZ] Attempt saved successfully, ID:', quizAttempt._id);

            // Return results
            return res.json({
                success: true,
                data: {
                    score,
                    totalQuestions,
                    percentage,
                    results,
                    quizAttemptId: quizAttempt._id
                }
            });
        } catch (dbError) {
            console.error('[SUBMIT-QUIZ] Error saving quiz attempt:', dbError);
            console.error('[SUBMIT-QUIZ] Error details:', dbError.errors || dbError.message);

            // Return a simplified error for the client
            return res.status(500).json({
                success: false,
                message: 'Error saving quiz submission. Please try again.',
                error: process.env.NODE_ENV === 'development' ? dbError.message : 'Database error'
            });
        }
    } catch (error) {
        console.error('[SUBMIT-QUIZ] Unexpected error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error submitting quiz',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
});

router.put('/:id', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Quiz updated successfully"
    });
});

router.delete('/:id', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Quiz deleted successfully"
    });
});

module.exports = router; 