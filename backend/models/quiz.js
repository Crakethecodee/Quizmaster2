const mongoose = require('mongoose');

// Question Schema (embedded)
const questionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true
    },
    options: {
        type: [String],
        required: [true, 'Options are required'],
        validate: {
            validator: function (v) {
                return v.length >= 2; // At least 2 options required
            },
            message: 'A question must have at least 2 options'
        }
    },
    correctAnswer: {
        type: Number,
        required: [true, 'Correct answer index is required'],
        min: 0
    },
    explanation: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        trim: true
    }
});

// Quiz Schema
const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Quiz title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Quiz description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['General Knowledge', 'Science', 'History', 'Technology', 'Pop Culture', 'Sports', 'Art', 'Geography', 'Language', 'Movies', 'Music', 'Other']
    },
    difficulty: {
        type: String,
        required: [true, 'Difficulty is required'],
        enum: ['Easy', 'Medium', 'Hard']
    },
    timeLimit: {
        type: Number,
        default: 60, // Default time limit of 60 seconds per question
        min: [10, 'Time limit must be at least 10 seconds']
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    },
    questions: {
        type: [questionSchema],
        required: [true, 'Questions are required'],
        validate: {
            validator: function (v) {
                return v.length > 0; // At least 1 question required
            },
            message: 'A quiz must have at least 1 question'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    timesPlayed: {
        type: Number,
        default: 0
    },
    averageScore: {
        type: Number,
        default: 0
    }
});

// Virtuals
quizSchema.virtual('questionCount').get(function () {
    return this.questions.length;
});

// Methods
quizSchema.methods.updateStats = function (score) {
    this.timesPlayed += 1;
    this.averageScore = ((this.averageScore * (this.timesPlayed - 1)) + score) / this.timesPlayed;
    return this.save();
};

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz; 