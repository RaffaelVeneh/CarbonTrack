# CarbonTrack 🌍

CarbonTrack is a full-stack web application designed to help users track and reduce their daily carbon footprint. Built with Next.js for the frontend and Express.js for the backend, it provides a dashboard to visualize emission data, log activities, and complete eco-friendly missions.

## ✨ Features

- **User Authentication**: Secure login and registration system.
- **Dashboard**: Real-time visualization of carbon emissions with charts and statistics.
- **Activity Logging**: Track daily activities (transportation, energy usage, etc.) to calculate carbon footprint.
- **Missions**: Gamified challenges to encourage eco-friendly habits.
- **Responsive Design**: Modern UI built with Tailwind CSS.

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- Tailwind CSS
- Recharts (Data Visualization)
- Lucide React (Icons)

**Backend:**
- Node.js & Express.js
- MySQL (Database)
- JWT (Authentication)
- BCrypt (Password Hashing)

## 🚀 Getting Started

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
│   ├── src/app/            # App Router Pages (Dashboard, Login, etc.)
│   ├── src/components/     # Reusable Components
│   └── public/             # Static Assets
└── server/                 # Express Backend
    ├── config/             # Database Configuration
    ├── controllers/        # Request Handlers
    ├── models/             # Database Models
    └── routes/             # API Routes
```

## 🔗 API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/logs/summary/:userId` - Get dashboard summary
- `POST /api/logs` - Log a new activity
- `GET /api/missions` - Get available missions
