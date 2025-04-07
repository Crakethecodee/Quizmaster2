# QuizMaster

A modern quiz application with a responsive frontend and REST API backend. Test your knowledge with quizzes on various topics, track your progress, and even create your own quizzes to share with others.

![QuizMaster Screenshot](screenshot.png)

## Features

- **User Authentication**: Register, login, and manage your profile
- **Quiz Taking**: Take quizzes on various topics with a timer
- **Score Tracking**: View your quiz history and performance statistics
- **Quiz Creation**: Create your own quizzes to share with the community
- **Responsive Design**: Works well on desktop, tablet, and mobile devices
- **Dark Theme**: Modern dark purple/black theme for comfortable viewing

## Tech Stack

### Frontend
- HTML5, CSS3, Vanilla JavaScript
- Responsive design with CSS Grid and Flexbox
- 3D animations with CSS transformations
- Font Awesome icons
- Google Fonts (Poppins)

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Bcrypt for password hashing

## Project Structure

```
quizmaster/
├── frontend/
│   ├── public/
│   │   ├── images/
│   │   └── animations/
│   ├── styles/
│   │   └── main.css
│   ├── scripts/
│   │   └── main.js
│   └── pages/
│       ├── index.html
│       ├── about.html
│       ├── profile.html
│       └── quizzes.html
└── backend/
    ├── models/
    │   ├── user.js
    │   └── quiz.js
    ├── routes/
    │   ├── auth.js
    │   └── quiz.js
    ├── config/
    │   └── db.js
    └── server.js
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/quizmaster.git
   cd quizmaster
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/quizmaster
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Quizzes

- `GET /api/quizzes` - Get all quizzes (with filters)
- `GET /api/quizzes/featured` - Get featured quizzes
- `GET /api/quizzes/:id` - Get a specific quiz
- `POST /api/quizzes` - Create a new quiz
- `PUT /api/quizzes/:id` - Update a quiz
- `DELETE /api/quizzes/:id` - Delete a quiz
- `POST /api/quizzes/:id/submit` - Submit quiz answers

## Future Enhancements

- Social media integration
- Multiplayer quiz mode
- Advanced analytics
- Premium content
- Mobile app versions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Images from [Unsplash](https://unsplash.com)
- Icons from [Font Awesome](https://fontawesome.com)
- Placeholder profile images from [RandomUser](https://randomuser.me) 