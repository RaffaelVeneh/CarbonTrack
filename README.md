# CarbonTrack 🌍

CarbonTrack is a comprehensive full-stack web application designed to empower users to track, visualize, and reduce their daily carbon footprint. By combining activity logging, gamified missions, and AI-powered insights, CarbonTrack makes sustainability engaging and actionable.

## ✨ Features

- **📊 Interactive Dashboard**: Real-time visualization of your carbon emissions with dynamic charts and statistics.
- **🤖 AI Assistant**: Get personalized eco-friendly advice and insights powered by AI to help you make better choices.
- **📝 Activity Logging**: Easily log daily activities (transportation, energy usage, diet) to calculate your impact.
- **🎯 Gamified Missions**: Complete eco-friendly challenges to earn points and build sustainable habits.
- **🏆 Leaderboard**: Compete with other users and see who is making the biggest positive impact.
- **👤 User Profile & History**: Track your journey over time and manage your account settings.
- **🎨 Engaging UI**: Modern, responsive design featuring interactive Lottie animations that reflect your progress (Healthy vs. Warning states).
- **🔐 Secure Authentication**: Robust login and registration system using JWT and BCrypt.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS
- **Visualization**: Recharts
- **Animations**: Lottie React, React Confetti
- **Icons**: Lucide React
- **Utilities**: html2canvas, jspdf

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: MySQL (using `mysql2`)
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: BCrypt (Password Hashing), CORS

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18 or higher)
- MySQL Server
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CarbonTrack
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Configuration

1. **Database Setup**
   - Create a MySQL database named `carbontrack`.
   - Ensure your MySQL server is running.

2. **Server Environment Variables**
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=carbontrack
   JWT_SECRET=your_jwt_secret_key
   # Add any AI API keys if required
   ```

3. **Client Environment Variables**
   Create a `.env.local` file in the `client` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd server
   npx nodemon index.js
   # or
   node index.js
   ```
   The server will run on `http://localhost:5000`.

2. **Start the Frontend Client**
   ```bash
   cd client
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## 📂 Project Structure

```
CarbonTrack/
├── client/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/            # App Router pages (Dashboard, Missions, AI Assistant, etc.)
│   │   ├── assets/         # Static assets and Lottie animations
│   │   └── components/     # Reusable UI components
│   └── ...
└── server/                 # Express Backend
    ├── config/             # Database configuration
    ├── controllers/        # Logic for AI, Auth, Logs, Missions, Users
    ├── models/             # Database models
    ├── routes/             # API Routes
    └── index.js            # Entry point
```

## 🔗 API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/logs/summary/:userId` - Get dashboard summary
- `POST /api/logs` - Log a new activity
- `GET /api/missions` - Get available missions
- `POST /api/ai/ask` - Get AI advice
- `GET /api/users/leaderboard` - Get leaderboard data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.
