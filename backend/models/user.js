const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [20, 'Username cannot exceed 20 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    profilePicture: {
        type: String,
        default: 'default-profile.png'
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for quiz attempts
userSchema.virtual('quizAttempts', {
    ref: 'QuizAttempt',
    localField: '_id',
    foreignField: 'user'
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user statistics
userSchema.methods.getStats = async function () {
    await this.populate({
        path: 'quizAttempts',
        options: { sort: { 'completedAt': -1 } },
        populate: {
            path: 'quiz',
            select: 'title category difficulty'
        }
    });

    const totalQuizzes = this.quizAttempts.length;
    let totalScore = 0;
    let totalQuestions = 0;

    this.quizAttempts.forEach(attempt => {
        totalScore += attempt.score;
        totalQuestions += attempt.totalQuestions;
    });

    const averageScore = totalQuizzes > 0 ? (totalScore / totalQuestions) * 100 : 0;

    return {
        totalQuizzes,
        averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
        recentQuizzes: this.quizAttempts.slice(0, 5).map(attempt => ({
            quiz: {
                id: attempt.quiz._id,
                title: attempt.quiz.title,
                category: attempt.quiz.category,
                difficulty: attempt.quiz.difficulty
            },
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            percentage: attempt.percentage,
            dateCompleted: attempt.completedAt
        }))
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User; 