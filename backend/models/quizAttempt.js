const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: [true, 'Quiz is required']
    },
    answers: [{
        questionIndex: Number,
        selectedAnswer: Number
    }],
    score: {
        type: Number,
        required: [true, 'Score is required']
    },
    totalQuestions: {
        type: Number,
        required: [true, 'Total questions is required']
    },
    percentage: {
        type: Number,
        required: [true, 'Percentage is required']
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    timeTaken: {
        type: Number, // in seconds
        default: 0
    },
    results: [{
        question: String,
        userAnswer: Number,
        correctAnswer: Number,
        isCorrect: Boolean,
        explanation: String
    }]
});

// Virtual for getting formatted score
quizAttemptSchema.virtual('formattedScore').get(function () {
    return `${this.score}/${this.totalQuestions} (${this.percentage}%)`;
});

// Index for faster queries
quizAttemptSchema.index({ user: 1, completedAt: -1 });
quizAttemptSchema.index({ quiz: 1, completedAt: -1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

module.exports = QuizAttempt; 