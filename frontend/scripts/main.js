// Main JavaScript file for QuizMaster

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Initialize parallax effect
    initParallax();

    // Initialize 3D logo cube
    initLogoCube();

    // Check if we're on a quiz page
    const quizContainer = document.querySelector('.quiz-container');
    if (quizContainer) {
        initQuiz();
    }

    // Check if we're on the profile page
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer) {
        loadUserProfile();
    }

    // Check if we're on the quizzes page
    const quizzesGrid = document.querySelector('.quizzes-grid');
    if (quizzesGrid) {
        loadQuizzes();
    }

    // Check if we're on the login/register page
    const authForm = document.querySelector('.auth-form');
    if (authForm) {
        initAuthForm(authForm);
    }

    // Check if user is logged in and update UI accordingly
    updateAuthUI();
});

// Parallax Background Effect
function initParallax() {
    const parallaxBg = document.querySelector('.parallax-bg');
    if (!parallaxBg) return;

    // Create parallax items
    for (let i = 0; i < 20; i++) {
        const item = document.createElement('div');
        item.classList.add('parallax-item');

        // Random size between 10px and 50px
        const size = Math.random() * 40 + 10;
        item.style.width = `${size}px`;
        item.style.height = `${size}px`;

        // Random position
        item.style.left = `${Math.random() * 100}%`;
        item.style.top = `${Math.random() * 100}%`;

        // Random layer (affects parallax speed)
        const layer = Math.floor(Math.random() * 3) + 1;
        item.dataset.layer = layer;

        parallaxBg.appendChild(item);
    }

    // Move items on mouse move
    document.addEventListener('mousemove', (e) => {
        const items = document.querySelectorAll('.parallax-item');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        items.forEach(item => {
            const layer = item.dataset.layer;
            const speed = layer * 10;

            const x = (mouseX * speed);
            const y = (mouseY * speed);

            item.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
}

// 3D Logo Cube Animation
function initLogoCube() {
    const logoCube = document.querySelector('.logo-cube');
    if (!logoCube) return;

    // Add Q letter to each face
    const faces = logoCube.querySelectorAll('.logo-face');
    faces.forEach(face => {
        face.textContent = 'Q';
    });
}

// Quiz functionality
function initQuiz() {
    const quizForm = document.getElementById('quiz-form');
    const quizContainer = document.querySelector('.quiz-container');
    const questionContainer = document.getElementById('question-container');
    const progressBar = document.querySelector('.quiz-progress-bar');
    const questionCounter = document.querySelector('.question-counter');
    const timerElement = document.querySelector('.quiz-timer');
    const prevBtn = document.querySelector('.btn-prev');
    const nextBtn = document.querySelector('.btn-next');
    const submitBtn = document.querySelector('.btn-submit');
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    // Added variables for timing
    let startTime = Date.now();
    let timerInterval;
    let timeTaken = 0;

    let currentQuestionIndex = 0;
    let questions = [];
    let userAnswers = {};

    if (!quizContainer || !quizForm) return;

    // Load quiz data
    loadQuiz(quizId)
        .then(quiz => {
            questions = quiz.questions;

            // Update quiz header with quiz details
            const quizTitle = document.querySelector('.quiz-title');
            const quizCategory = document.querySelector('#quiz-category');
            const quizDifficulty = document.querySelector('#quiz-difficulty');
            const quizQuestionCount = document.querySelector('#quiz-question-count');

            if (quizTitle) quizTitle.textContent = quiz.title || 'Quiz';
            if (quizCategory) quizCategory.textContent = quiz.category || 'General';
            if (quizDifficulty) quizDifficulty.textContent = quiz.difficulty || 'Medium';
            if (quizQuestionCount) quizQuestionCount.textContent = questions.length;

            // Start the timer
            startTime = Date.now();
            if (timerElement && quiz.timeLimit) {
                const timeLimit = quiz.timeLimit * 60; // convert to seconds
                let timeRemaining = timeLimit;

                timerInterval = setInterval(() => {
                    timeRemaining--;

                    if (timeRemaining <= 0) {
                        clearInterval(timerInterval);
                        submitQuiz();
                        return;
                    }

                    const minutes = Math.floor(timeRemaining / 60);
                    const seconds = timeRemaining % 60;
                    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                    // Update progress
                    const timerProgress = document.querySelector('.timer-progress');
                    if (timerProgress) {
                        const percentage = (timeRemaining / timeLimit) * 100;
                        timerProgress.style.width = `${percentage}%`;

                        // Change color as time runs out
                        if (percentage < 25) {
                            timerProgress.style.backgroundColor = '#f72585';
                        } else if (percentage < 50) {
                            timerProgress.style.backgroundColor = '#ffd166';
                        }
                    }
                }, 1000);
            }

            // Initialize question display
            updateQuestionDisplay();
        })
        .catch(error => {
            console.error('Error initializing quiz:', error);
            if (questionContainer) {
                questionContainer.innerHTML = `<div class="error-message">Error loading quiz: ${error.message}</div>`;
            }
        });

    // Attach event listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                updateQuestionDisplay();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentQuestionIndex < questions.length - 1) {
                currentQuestionIndex++;
                updateQuestionDisplay();
            }
        });
    }

    // Form submission handler
    if (quizForm) {
        quizForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitQuiz();
        });
    }

    // Function to display the current question
    function updateQuestionDisplay() {
        if (questions.length === 0 || !questionContainer) return;

        // Update progress
        if (progressBar) {
            const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
            progressBar.style.width = `${progress}%`;
        }

        if (questionCounter) {
            const currentNum = document.getElementById('current-question-num');
            const totalNum = document.getElementById('total-questions');
            if (currentNum) currentNum.textContent = currentQuestionIndex + 1;
            if (totalNum) totalNum.textContent = questions.length;
        }

        // Show/hide navigation buttons
        if (prevBtn) {
            prevBtn.style.visibility = currentQuestionIndex === 0 ? 'hidden' : 'visible';
        }

        if (nextBtn && submitBtn) {
            if (currentQuestionIndex === questions.length - 1) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'block';
            } else {
                nextBtn.style.display = 'block';
                submitBtn.style.display = 'none';
            }
        }

        // Display question
        const question = questions[currentQuestionIndex];
        const userAnswer = userAnswers[currentQuestionIndex];

        questionContainer.innerHTML = `
            <div class="question-card">
                <h3 class="question-text">${question.text}</h3>
                
                <div class="options-list">
                    ${question.options.map((option, index) => `
                        <div class="option-item ${userAnswer === index ? 'selected' : ''}">
                            <input type="radio" id="option-${index}" name="question-${currentQuestionIndex}" value="${index}" ${userAnswer === index ? 'checked' : ''}>
                            <label for="option-${index}">${option}</label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners to options
        const optionItems = questionContainer.querySelectorAll('.option-item');
        optionItems.forEach((item, index) => {
            // Add click event to the entire option item div for better UX
            item.addEventListener('click', () => {
                const input = item.querySelector('input[type="radio"]');
                input.checked = true;
                userAnswers[currentQuestionIndex] = index;

                // Update selected class for all options
                optionItems.forEach((el, i) => {
                    if (i === index) {
                        el.classList.add('selected');
                    } else {
                        el.classList.remove('selected');
                    }
                });
            });

            // Also add change event to the radio input itself
            const input = item.querySelector('input[type="radio"]');
            input.addEventListener('change', () => {
                userAnswers[currentQuestionIndex] = index;

                // Update selected class for all options
                optionItems.forEach((el, i) => {
                    if (i === index) {
                        el.classList.add('selected');
                    } else {
                        el.classList.remove('selected');
                    }
                });
            });
        });
    }

    // Submit quiz for scoring
    function submitQuiz() {
        // Calculate time taken
        timeTaken = Math.floor((Date.now() - startTime) / 1000); // in seconds

        // Clear timer interval
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        // Check if all questions have been answered
        const unansweredCount = questions.length - Object.keys(userAnswers).length;
        if (unansweredCount > 0) {
            if (!confirm(`You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Are you sure you want to submit?`)) {
                return;
            }
        }

        // Convert userAnswers object to array
        const answers = [];
        for (let i = 0; i < questions.length; i++) {
            answers.push(userAnswers[i] !== undefined ? userAnswers[i] : null);
        }

        // Show loading state
        if (questionContainer) {
            questionContainer.innerHTML = `<div class="spinner"></div><p class="text-center">Submitting your answers...</p>`;
        }

        // Disable navigation buttons
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }

        // Submit answers to server
        submitQuizAnswers(quizId, answers, timeTaken)
            .then(result => {
                displayQuizResults(result);
            })
            .catch(error => {
                console.error('Error submitting quiz:', error);

                if (questionContainer) {
                    questionContainer.innerHTML = `
                        <div class="error-message">
                            <p>Error submitting quiz: ${error.message}</p>
                            <button class="btn" onclick="submitQuiz()">Try Again</button>
                        </div>
                    `;
                } else {
                    alert(`Error submitting quiz: ${error.message}`);
                }

                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Quiz';
                    submitBtn.style.display = 'block';
                }
            });
    }

    // Display quiz results
    function displayQuizResults(result) {
        if (timerElement) {
            timerElement.style.display = 'none';
        }

        if (progressBar) {
            progressBar.style.width = '100%';
        }

        if (questionCounter) {
            const currentNum = document.getElementById('current-question-num');
            const totalNum = document.getElementById('total-questions');
            if (currentNum && totalNum) {
                questionCounter.textContent = 'Quiz Completed';
            }
        }

        // Hide navigation buttons
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';

        // Add confetti animation for good scores
        if (result.percentage >= 70) {
            createConfetti(result.percentage);
        }

        // Update quiz container with results
        if (questionContainer) {
            questionContainer.innerHTML = `
              <div class="results-container">
                <h2>Quiz Results</h2>
                <div class="score-card">
                  <div class="score-circle">
                    <div class="score-number">${Math.round(result.percentage)}%</div>
                  </div>
                  <p>You scored ${result.score} out of ${result.totalQuestions}</p>
                  <p class="time-taken">Time: ${formatTime(timeTaken)}</p>
                </div>
                
                <div class="results-details">
                  <h3>Question Details</h3>
                  ${result.results.map((item, index) => `
                    <div class="result-item ${item.isCorrect ? 'correct' : 'incorrect'}">
                      <p><strong>Q${index + 1}:</strong> ${item.question}</p>
                      <p>Your answer: ${item.userAnswer !== null && item.userAnswer !== undefined && questions[index] ? questions[index].options[item.userAnswer] : 'Not answered'}</p>
                      <p>Correct answer: ${questions[index] ? questions[index].options[item.correctAnswer] : ''}</p>
                      ${item.explanation ? `<p class="explanation">${item.explanation}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
                
                <div class="results-actions">
                  <a href="quizzes.html" class="btn">Try Another Quiz</a>
                  <a href="index.html" class="btn btn-outline">Back to Home</a>
                </div>
              </div>
            `;
        }
    }

    // Helper function to format time
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
}

// Create confetti animation
function createConfetti(score) {
    const confettiContainer = document.createElement('div');
    confettiContainer.classList.add('confetti-container');
    document.body.appendChild(confettiContainer);

    // Number of confetti pieces based on score
    const count = Math.floor(score / 2);

    // Create confetti pieces
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');

        // Random color
        const colors = ['#7b68ee', '#f72585', '#4cc9f0', '#ffd166'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.backgroundColor = randomColor;

        // Random size
        const size = Math.random() * 10 + 5;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;

        // Random position
        confetti.style.left = `${Math.random() * 100}vw`;

        // Random rotation
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

        // Random delay
        confetti.style.animationDelay = `${Math.random() * 2}s`;

        confettiContainer.appendChild(confetti);
    }

    // Remove confetti after animation completes
    setTimeout(() => {
        confettiContainer.remove();
    }, 7000);
}

// Auth form functionality
function initAuthForm(form) {
    if (!form) {
        console.error('Form not found');
        return;
    }

    const isLoginForm = form.id === 'login-form';
    const errorMessage = form.querySelector('.error-message') || document.createElement('div');

    // Add error message element if it doesn't exist
    if (!form.querySelector('.error-message')) {
        errorMessage.classList.add('error-message');
        form.prepend(errorMessage);
        errorMessage.style.display = 'none'; // Hide by default
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous error
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';

        // Disable form fields during submission
        const formFields = form.querySelectorAll('input, button');
        formFields.forEach(field => field.disabled = true);

        try {
            if (isLoginForm) {
                // Login form
                const emailInput = form.querySelector('#email');
                const passwordInput = form.querySelector('#password');

                if (!emailInput || !passwordInput) {
                    throw new Error('Required form fields are missing');
                }

                const email = emailInput.value;
                const password = passwordInput.value;

                // Validate email
                if (!validateEmail(email)) {
                    throw new Error('Please enter a valid email address');
                }

                // Validate password
                if (!password) {
                    throw new Error('Please enter your password');
                }

                // Attempt login
                const result = await loginUser(email, password);

                if (!result.success) {
                    throw new Error(result.message || 'Login failed');
                }

                // Redirect to home page after successful login
                window.location.href = '/';
            } else {
                // Register form
                const usernameInput = form.querySelector('#username');
                const emailInput = form.querySelector('#email');
                const passwordInput = form.querySelector('#password');
                const confirmPasswordInput = form.querySelector('#confirmPassword'); // Fixed ID here

                // Check if all inputs exist
                if (!usernameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
                    throw new Error('Required form fields are missing');
                }

                const username = usernameInput.value;
                const email = emailInput.value;
                const password = passwordInput.value;
                const confirmPassword = confirmPasswordInput.value;

                // Validate username
                if (!username || username.length < 3) {
                    throw new Error('Username must be at least 3 characters long');
                }

                // Validate email
                if (!validateEmail(email)) {
                    throw new Error('Please enter a valid email address');
                }

                // Validate password
                if (!password || password.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }

                // Validate confirm password
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                // Attempt registration
                const result = await registerUser(username, email, password);

                if (!result.success) {
                    throw new Error(result.message || 'Registration failed');
                }

                // Redirect to home page after successful registration
                window.location.href = '/';
            }
        } catch (error) {
            // Display error message
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
            console.error('Form submission error:', error);
        } finally {
            // Re-enable form fields
            formFields.forEach(field => field.disabled = false);
        }
    });
}

// Email validation
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Update UI based on authentication status
function updateAuthUI() {
    const user = getUserFromSession();
    const authLinks = document.querySelectorAll('.auth-links');
    const userLinks = document.querySelectorAll('.user-links');
    const usernameElements = document.querySelectorAll('.username');

    if (user) {
        // User is logged in
        authLinks.forEach(el => el.style.display = 'none');
        userLinks.forEach(el => el.style.display = 'flex');
        usernameElements.forEach(el => el.textContent = user.username);

        // Update profile picture if available
        const profilePics = document.querySelectorAll('.profile-pic');
        profilePics.forEach(pic => {
            if (user.profilePicture) {
                pic.src = user.profilePicture;
            }
        });
    } else {
        // User is not logged in
        authLinks.forEach(el => el.style.display = 'flex');
        userLinks.forEach(el => el.style.display = 'none');

        // Redirect from protected pages
        const isProtectedPage = document.body.classList.contains('protected-page');
        if (isProtectedPage) {
            window.location.href = `login.html?redirect=${window.location.pathname}`;
        }
    }
}

// API Functions

// Load quiz data
async function loadQuiz(quizId) {
    try {
        const response = await fetch(`/api/quizzes/${quizId}`);

        if (!response.ok) {
            throw new Error(`Failed to load quiz: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error loading quiz:', error);
        throw error;
    }
}

// Submit quiz answers
async function submitQuizAnswers(quizId, answers, timeTaken) {
    const token = getAuthToken();
    const user = getUserFromSession();

    if (!token || !user) {
        // If not logged in, redirect to login page
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `login.html?redirect=${currentUrl}`;
        throw new Error('Please log in to submit your quiz');
    }

    try {
        console.log('Submitting quiz answers:', { quizId, answers, timeTaken });

        // Format the answers as required by the backend
        const formattedAnswers = answers.map((answer, index) => ({
            questionIndex: index,
            selectedAnswer: answer
        }));

        // Prepare request payload
        const payload = {
            userId: user.id,  // Include user ID from session
            answers: formattedAnswers,
            timeTaken: timeTaken || 0
        };

        console.log('Request payload:', payload);

        let response;
        let endpointTried = false;

        // Try the primary endpoint first
        try {
            response = await fetch(`/api/quizzes/${quizId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            endpointTried = true;

            // If response is 404, we'll try the alternative endpoint
            if (response.status === 404) {
                throw new Error('Primary endpoint not found');
            }
        } catch (error) {
            console.log('Error with primary endpoint:', error.message);

            // Only try alternative endpoint if the first one was tried
            if (endpointTried) {
                console.log('Trying alternative endpoint');
                response = await fetch('/api/submit-quiz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        quizId,
                        ...payload
                    })
                });
            } else {
                // If we couldn't even make the first request, re-throw the error
                throw error;
            }
        }

        // Check if the response was successful
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to submit quiz: ${response.statusText}`;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // If parsing fails, use the original error text
                if (errorText) {
                    errorMessage = errorText;
                }
            }

            throw new Error(errorMessage);
        }

        // Parse response data
        const data = await response.json();

        // Check if data has the expected structure
        if (!data.data && data.success) {
            console.warn('Server returned success but no data object, creating mock result');
            return {
                score: answers.filter(a => a !== null).length,
                totalQuestions: answers.length,
                percentage: Math.round((answers.filter(a => a !== null).length / answers.length) * 100),
                results: answers.map((answer, index) => ({
                    question: `Question ${index + 1}`,
                    userAnswer: answer,
                    correctAnswer: answer, // Assume correct in mock data
                    isCorrect: true,
                    explanation: ''
                }))
            };
        }

        // Show success message
        console.log('Quiz submitted successfully:', data);

        return data.data;
    } catch (error) {
        console.error('Error submitting quiz:', error);
        throw error;
    }
}

// Load quizzes for quizzes page
async function loadQuizzes() {
    const quizzesGrid = document.querySelector('.quizzes-grid');
    const filterForm = document.querySelector('.filter-form');

    if (!quizzesGrid) return;

    // Show loading state
    quizzesGrid.innerHTML = '<div class="spinner"></div>';

    // Get filter values if available
    let queryParams = '';

    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(filterForm);
            const data = Object.fromEntries(formData.entries());

            // Build query string
            const params = new URLSearchParams();

            if (data.category && data.category !== 'all') {
                params.append('category', data.category);
            }

            if (data.difficulty && data.difficulty !== 'all') {
                params.append('difficulty', data.difficulty);
            }

            // Reload quizzes with filters
            loadFilteredQuizzes(params.toString());
        });
    }

    // Load quizzes
    loadFilteredQuizzes(queryParams);

    // Function to load quizzes with filters
    async function loadFilteredQuizzes(queryParams) {
        try {
            const response = await fetch(`/api/quizzes?${queryParams}`);

            if (!response.ok) {
                throw new Error(`Failed to load quizzes: ${response.statusText}`);
            }

            const data = await response.json();

            // Display quizzes
            if (data.data.length === 0) {
                quizzesGrid.innerHTML = '<p>No quizzes found. Try adjusting your filters.</p>';
                return;
            }

            quizzesGrid.innerHTML = data.data.map(quiz => `
        <div class="card quiz-card">
          <div class="card-body">
            <h3 class="card-title">${quiz.title}</h3>
            <p class="card-text">${quiz.description}</p>
            <div class="quiz-meta">
              <span class="quiz-category">${quiz.category}</span>
              <span class="quiz-difficulty">${quiz.difficulty}</span>
              <span class="quiz-questions">${quiz.questionCount} questions</span>
            </div>
          </div>
          <div class="card-footer">
            <span class="card-meta">By ${quiz.creator}</span>
            <a href="quiz.html?id=${quiz.id}" class="btn btn-sm">Start Quiz</a>
          </div>
        </div>
      `).join('');

        } catch (error) {
            console.error('Error loading quizzes:', error);
            quizzesGrid.innerHTML = `<p>Error loading quizzes: ${error.message}</p>`;
        }
    }
}

// Load user profile
async function loadUserProfile() {
    const token = getAuthToken();
    const user = getUserFromSession();

    if (!token || !user) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html?redirect=profile.html';
        return;
    }

    const profileContent = document.querySelector('.profile-content');
    const profileName = document.querySelector('.profile-name');
    const profileUsername = document.querySelector('.profile-username');
    const profileAvatar = document.querySelector('.profile-avatar');
    const statsElements = document.querySelectorAll('.stat-value');
    const quizHistoryContainer = document.querySelector('.quiz-history');

    // Show loading state
    if (profileContent) {
        profileContent.innerHTML = '<div class="spinner"></div>';
    }

    try {
        // Get basic user data
        const userResponse = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!userResponse.ok) {
            throw new Error(`Failed to load profile: ${userResponse.statusText}`);
        }

        const userData = await userResponse.json();

        // Get detailed quiz history from profile endpoint
        const historyResponse = await fetch(`/api/profile/${user.id}/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!historyResponse.ok) {
            throw new Error(`Failed to load quiz history: ${historyResponse.statusText}`);
        }

        const historyData = await historyResponse.json();
        console.log('Quiz history data:', historyData);

        // Update profile UI with basic info
        if (profileName) profileName.textContent = userData.user.username;
        if (profileUsername) profileUsername.textContent = userData.user.email;
        if (profileAvatar) {
            // Add data attribute to track error handling
            if (!profileAvatar.hasAttribute('data-error-handled')) {
                if (userData.user.profilePicture) {
                    // Fix profile picture path if needed
                    if (userData.user.profilePicture.startsWith('/')) {
                        profileAvatar.src = userData.user.profilePicture;
                    } else {
                        profileAvatar.src = `/images/${userData.user.profilePicture}`;
                    }
                    // Handle image error only once
                    profileAvatar.onerror = function () {
                        // Prevent infinite loop by marking this element
                        this.setAttribute('data-error-handled', 'true');
                        // Only set default if not already set to default
                        if (!this.src.includes('default-profile.png')) {
                            console.log('Profile image failed to load, using default');
                            this.src = '/images/default-profile.png';
                            // Remove the error handler after setting default
                            this.onerror = null;
                        }
                    };
                } else {
                    // No profile picture in user data, use default immediately
                    profileAvatar.src = '/images/default-profile.png';
                    profileAvatar.setAttribute('data-error-handled', 'true');
                }
            }
        }

        // Update stats if available
        if (statsElements && statsElements.length >= 2) {
            // Total quizzes taken
            if (statsElements[0]) {
                statsElements[0].textContent = historyData.quizzesTaken || 0;
            }

            // Average score
            if (statsElements[1]) {
                statsElements[1].textContent = `${historyData.averageScore || 0}%`;
            }

            // Only update these if they exist (for backwards compatibility)
            if (statsElements.length >= 4) {
                // Total questions answered
                if (statsElements[2]) {
                    statsElements[2].textContent = historyData.totalQuestions || 0;
                }

                // Correct answers
                if (statsElements[3]) {
                    statsElements[3].textContent = historyData.correctAnswers || 0;
                }
            }
        }

        // Update quiz history
        if (quizHistoryContainer) {
            const quizHistory = historyData.history;

            if (quizHistory.length === 0) {
                // No quiz history
                quizHistoryContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No Quiz History</h3>
                        <p>You haven't taken any quizzes yet.</p>
                        <a href="quizzes.html" class="btn">Find Quizzes</a>
                    </div>
                `;
            } else {
                // Show quiz history
                quizHistoryContainer.innerHTML = `
                    <h3>Recent Quizzes</h3>
                    <div class="history-list">
                        ${quizHistory.map(attempt => `
                            <div class="history-item">
                                <div class="quiz-meta">
                                    <div class="quiz-info">
                                        <h4>${attempt.title}</h4>
                                        <div class="quiz-tags">
                                            <span class="quiz-category">${attempt.category}</span>
                                            <span class="quiz-difficulty">${attempt.difficulty}</span>
                                        </div>
                                    </div>
                                    <div class="quiz-date">
                                        ${new Date(attempt.completedAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div class="quiz-result">
                                    <div class="score-badge ${getScoreClass(attempt.percentage)}">
                                        ${attempt.percentage}%
                                    </div>
                                    <p class="score-text">${attempt.score}/${attempt.totalQuestions} correct</p>
                                    <p class="time-text">${formatTime(attempt.timeTaken)}</p>
                                </div>
                                <div class="quiz-actions">
                                    <a href="quiz.html?id=${attempt.quizId}" class="btn btn-sm">Retry Quiz</a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ${historyData.pages > 1 ? `
                        <div class="quiz-history-footer">
                            <p>Showing ${quizHistory.length} of ${historyData.total} results</p>
                            <div class="pagination">
                                ${createPagination(historyData.page, historyData.pages)}
                            </div>
                        </div>
                    ` : ''}
                `;

                // Add pagination event listeners
                const paginationLinks = quizHistoryContainer.querySelectorAll('.pagination-link');
                paginationLinks.forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const page = parseInt(link.dataset.page);
                        loadQuizHistoryPage(page);
                    });
                });
            }
        }

        // Remove loading state
        if (profileContent) {
            profileContent.classList.remove('loading');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        if (profileContent) {
            profileContent.innerHTML = `<div class="error-message">Error loading profile: ${error.message}</div>`;
        }
    }
}

// Get score class based on percentage
function getScoreClass(percentage) {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'average';
    return 'poor';
}

// Create pagination HTML
function createPagination(currentPage, totalPages) {
    let html = '';
    const maxLinks = 5; // Maximum number of links to show

    let startPage = Math.max(1, currentPage - Math.floor(maxLinks / 2));
    let endPage = Math.min(totalPages, startPage + maxLinks - 1);

    if (endPage - startPage + 1 < maxLinks) {
        startPage = Math.max(1, endPage - maxLinks + 1);
    }

    // Previous page
    if (currentPage > 1) {
        html += `<a href="#" class="pagination-link" data-page="${currentPage - 1}">«</a>`;
    }

    // Page links
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<span class="pagination-current">${i}</span>`;
        } else {
            html += `<a href="#" class="pagination-link" data-page="${i}">${i}</a>`;
        }
    }

    // Next page
    if (currentPage < totalPages) {
        html += `<a href="#" class="pagination-link" data-page="${currentPage + 1}">»</a>`;
    }

    return html;
}

// Load specific page of quiz history
async function loadQuizHistoryPage(page) {
    const token = getAuthToken();
    const user = getUserFromSession();
    const quizHistoryContainer = document.querySelector('.quiz-history');

    if (!token || !quizHistoryContainer || !user) return;

    // Show loading state
    quizHistoryContainer.innerHTML = '<div class="spinner"></div>';

    try {
        const response = await fetch(`/api/profile/${user.id}/history?page=${page}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load quiz history: ${response.statusText}`);
        }

        const data = await response.json();
        const quizHistory = data.history;

        // Update content
        quizHistoryContainer.innerHTML = `
            <h3>Recent Quizzes</h3>
            <div class="history-list">
                ${quizHistory.map(attempt => `
                    <div class="history-item">
                        <div class="quiz-meta">
                            <div class="quiz-info">
                                <h4>${attempt.title}</h4>
                                <div class="quiz-tags">
                                    <span class="quiz-category">${attempt.category}</span>
                                    <span class="quiz-difficulty">${attempt.difficulty}</span>
                                </div>
                            </div>
                            <div class="quiz-date">
                                ${new Date(attempt.completedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div class="quiz-result">
                            <div class="score-badge ${getScoreClass(attempt.percentage)}">
                                ${attempt.percentage}%
                            </div>
                            <p class="score-text">${attempt.score}/${attempt.totalQuestions} correct</p>
                            <p class="time-text">${formatTime(attempt.timeTaken)}</p>
                        </div>
                        <div class="quiz-actions">
                            <a href="quiz.html?id=${attempt.quizId}" class="btn btn-sm">Retry Quiz</a>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${data.pages > 1 ? `
                <div class="quiz-history-footer">
                    <p>Showing ${quizHistory.length} of ${data.total} results</p>
                    <div class="pagination">
                        ${createPagination(data.page, data.pages)}
                    </div>
                </div>
            ` : ''}
        `;

        // Re-add pagination event listeners
        const paginationLinks = quizHistoryContainer.querySelectorAll('.pagination-link');
        paginationLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const newPage = parseInt(link.dataset.page);
                loadQuizHistoryPage(newPage);
            });
        });
    } catch (error) {
        console.error('Error loading quiz history page:', error);
        quizHistoryContainer.innerHTML = `<div class="error-message">Error loading quiz history: ${error.message}</div>`;
    }
}

// Auth API functions

// Login user
async function loginUser(email, password) {
    try {
        // Clear any previous errors
        console.log('Attempting login for email:', email);

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        // Check if response is ok (status 200-299)
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Login error response:', errorText);

            // Try to parse the error as JSON, but handle if it's not valid JSON
            let errorData;
            try {
                errorData = JSON.parse(errorText);
                throw new Error(errorData.message || 'Login failed');
            } catch (parseError) {
                // If we can't parse it as JSON, just use the error text or a default message
                throw new Error('Login failed: ' + (errorText || 'Unknown error'));
            }
        }

        // Parse JSON response
        const data = await response.json();
        console.log('Login success:', data);

        // Save user data and token
        saveUserSession(data.token, data.user);

        // Return success
        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: error.message || 'Login failed'
        };
    }
}

// Register user
async function registerUser(username, email, password) {
    try {
        console.log('Attempting registration for:', username, email);

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        // Check if response is ok (status 200-299)
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Registration error response:', errorText);

            // Try to parse the error as JSON, but handle if it's not valid JSON
            let errorData;
            try {
                errorData = JSON.parse(errorText);
                throw new Error(errorData.message || 'Registration failed');
            } catch (parseError) {
                // If we can't parse it as JSON, just use the error text or a default message
                throw new Error('Registration failed: ' + (errorText || 'Unknown error'));
            }
        }

        // Parse JSON response
        const data = await response.json();
        console.log('Registration success:', data);

        // Save user data and token
        saveUserSession(data.token, data.user);

        // Return success
        return { success: true };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            message: error.message || 'Registration failed'
        };
    }
}

// Logout user
function logoutUser() {
    // Clear session storage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');

    // Redirect to home page
    window.location.href = 'index.html';
}

// Session storage functions

// Save user session
function saveUserSession(token, user) {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('user', JSON.stringify(user));
}

// Get auth token
function getAuthToken() {
    return sessionStorage.getItem('authToken');
}

// Get user from session
function getUserFromSession() {
    const userJson = sessionStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
} 