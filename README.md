# CarbonTrack 🌍

CarbonTrack is a comprehensive full-stack web application designed to empower users to track, visualize, and reduce their daily carbon footprint. By combining activity logging, gamified missions, and AI-powered eco-assistant, CarbonTrack makes sustainability engaging, educational, and actionable.

## ✨ Features

### Core Features
- **📊 Interactive Dashboard**: Real-time visualization of carbon emissions and savings with dual-line charts, island health system, and daily/total statistics.
- **🤖 AI-Powered EcoBot**: Conversational AI assistant powered by Groq (LLaMA 3.3 70B) that provides personalized eco-friendly advice, tips for reducing carbon footprint, and answers questions about sustainability in Indonesian context.
- **📝 Activity Logging**: Log daily activities across multiple categories (transportation, energy usage, diet, waste) with automatic CO2 calculation.
- **🎯 Progressive Mission System**: 52+ gamified missions spanning 21 levels with 6 mission types (CO2 saved, specific activities, consecutive days, total distance, etc.).
- **🏆 Leaderboard**: Real-time competitive rankings showing top eco-warriors by total XP and carbon savings.
- **👤 User Profile & Progress**: Track personal journey with XP system, level progression, achievement history, and carbon impact over time.

### Advanced Features
- **🎨 Dynamic Island Visualization**: Interactive Lottie animations reflecting environmental health (Healthy 🌳 → Normal 🌿 → Dead ☠️) based on user's carbon impact.
- **💾 Persistent Chat History**: AI chatbot conversations saved in localStorage with "New Chat" functionality.
- **🎊 Celebration System**: Confetti animations and reward feedback when completing missions or leveling up.
- **📈 Multi-Type Mission Tracking**: Intelligent progress calculation for various mission types including CO2-based, activity-based, and streak-based challenges.
- **🔐 Secure Authentication**: JWT-based authentication with BCrypt password hashing and protected routes.
- **🎯 Level-Gated Content**: Missions unlock progressively as users level up (100 XP per level).

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15+ (App Router with React Server Components)
- **Library**: React 19 (Client Components for interactivity)
- **Styling**: Tailwind CSS v3 (Custom gradients, animations, responsive design)
- **Data Visualization**: Recharts (LineChart, BarChart, PieChart)
- **Animations**: 
  - Lottie React (Island health states with 3 animation files)
  - React Confetti (Mission completion celebrations)
- **Icons**: Lucide React (Modern icon library)
- **Utilities**: 
  - html2canvas & jspdf (Export reports)
  - localStorage (Chat history persistence)

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js 5 (RESTful API)
- **Database**: MySQL 8+ / TiDB Cloud (Serverless MySQL-compatible)
- **ORM**: Raw SQL queries with `mysql2` promise-based connection pool
- **AI Integration**: Groq SDK (LLaMA 3.3 70B Versatile model)
- **Authentication**: 
  - JSON Web Tokens (JWT) for session management
  - BCrypt for password hashing (10 salt rounds)
- **Security**: CORS, dotenv for environment variables
- **Development**: Nodemon for hot-reload

### Database Schema
- **Users**: id, username, email, password, total_xp, current_level, island_health
- **Activities**: id, name, category, co2_per_unit, unit
- **Daily Logs**: id, user_id, activity_id, input_value, carbon_emission, carbon_saved, log_date
- **Missions**: id, title, description, mission_type (enum), target_value, duration_days, required_activity_id, min_level, max_level, xp_reward, health_reward, icon, difficulty (enum)
- **User Missions**: id, user_id, mission_id, claimed_at

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18 or higher)
- MySQL Server
- npm or yarn

### Installation

The project consists of two main parts: the `client` (Frontend) and the `server` (Backend). Each has its own `package.json` file listing the required dependencies. You need to install these dependencies for both parts.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CarbonTrack
   ```

2. **Install Server Dependencies**
   Navigate to the `server` directory. The `npm install` command will read the `package.json` file and install all necessary backend packages (Express, MySQL2, etc.).
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**
   Navigate to the `client` directory. Similarly, `npm install` will read the `client/package.json` file and install all frontend packages (Next.js, React, Tailwind, etc.).
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
   # Database Configuration (MySQL/TiDB Cloud)
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=carbontrack
   DB_PORT=3306

   # Authentication
   JWT_SECRET=your_jwt_secret_key_here

   # Groq AI API Key (FREE - Get from https://console.groq.com/keys)
   GROQ_API_KEY=gsk_your_groq_api_key_here
   ```

   **🤖 Setting up Groq AI (5 minutes, FREE):**
   1. Visit https://console.groq.com/ and sign up (Google/GitHub)
   2. Navigate to https://console.groq.com/keys
   3. Click "Create API Key" → Copy the key (format: `gsk_...`)
   4. Paste into `.env` as shown above
   5. Free tier includes **14,400 requests/day** (more than enough!)
   
   See `GROQ_SETUP.md` for detailed instructions and troubleshooting.

3. **Client Environment Variables**
   Create a `.env.local` file in the `client` directory:
   ```env
   # Backend API URL
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
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
├── client/                          # Next.js Frontend (Port 3000)
│   ├── src/
│   │   ├── app/                     # App Router Pages
│   │   │   ├── page.js              # Landing/Login page
│   │   │   ├── dashboard/           # 📊 Main dashboard with graphs
│   │   │   ├── assistant/           # 🤖 AI chatbot interface
│   │   │   ├── missions/            # 🎯 Mission list & progress
│   │   │   ├── history/             # 📝 Activity log history
│   │   │   ├── leaderboard/         # 🏆 User rankings
│   │   │   ├── profile/             # 👤 User profile & stats
│   │   │   ├── settings/            # ⚙️ App settings
│   │   │   └── layout.js            # Root layout with Sidebar
│   │   ├── assets/
│   │   │   └── lottie/              # Island health animations
│   │   │       ├── healthy.json     # 🌳 Green healthy island
│   │   │       ├── normal.json      # 🌿 Normal state island
│   │   │       └── dead.json        # ☠️ Polluted dead island
│   │   ├── components/
│   │   │   ├── Sidebar.js           # Navigation sidebar
│   │   │   └── ActivityModal.js     # Activity logging modal
│   │   └── utils/                   # Helper functions
│   ├── .env.local                   # Client environment variables
│   └── package.json                 # Frontend dependencies
│
└── server/                          # Express Backend (Port 5000)
    ├── config/
    │   └── db.js                    # MySQL connection pool
    ├── controllers/
    │   ├── aiController.js          # 🤖 Groq AI integration
    │   ├── authController.js        # 🔐 Login/Register logic
    │   ├── logController.js         # 📊 Activity logging & stats
    │   ├── missionControllerV2.js   # 🎯 Mission progress & rewards
    │   └── userController.js        # 👤 User profile & leaderboard
    ├── models/
    │   └── userModel.js             # User database operations
    ├── routes/
    │   ├── aiRoutes.js              # POST /api/ai/ask
    │   ├── authRoutes.js            # POST /api/auth/login|register
    │   ├── logRoutes.js             # GET|POST /api/logs/*
    │   ├── missionRoutes.js         # GET|POST /api/missions/*
    │   └── userRoutes.js            # GET /api/users/*
    ├── .env                         # Server environment variables
    ├── index.js                     # Express server entry point
    └── package.json                 # Backend dependencies
```

## 🔗 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user (username, email, password)
- `POST /api/auth/login` - User login → Returns JWT token

### Activity Logs (`/api/logs`)
- `GET /api/logs/summary/:userId` - Dashboard summary (today/total emissions, savings, graph data)
- `POST /api/logs` - Log new activity (userId, activityId, inputValue, logDate)
- `GET /api/logs/history/:userId` - Get activity history with pagination

### Missions (`/api/missions`)
- `GET /api/missions/:userId` - Get all missions with progress calculation (6 mission types)
- `POST /api/missions/claim` - Claim completed mission rewards (XP + health)
- `GET /api/missions/history/:userId` - Get claimed missions history

### AI Assistant (`/api/ai`)
- `POST /api/ai/ask` - Ask EcoBot any sustainability question
  - Request: `{ question: "How to save energy?" }`
  - Response: `{ answer: "Detailed eco-friendly tips..." }`
  - Powered by Groq LLaMA 3.3 70B with fallback to keyword matching

### Users (`/api/users`)
- `GET /api/users/leaderboard` - Get top 10 users by XP and carbon savings
- `GET /api/users/profile/:userId` - Get user profile data
- `PUT /api/users/profile/:userId` - Update user profile

### Mission Types
1. **co2_saved** - Save X kg CO2 within Y days
2. **co2_produced** - Keep emissions under X kg within Y days (inverse challenge)
3. **activity_count** - Complete any activity X times within Y days
4. **specific_activity** - Complete specific activity X times within Y days
5. **consecutive_days** - Log activities for X consecutive days
6. **total_distance** - Travel X km using eco-friendly transport within Y days

## 🎮 Gamification System

### Level & XP Mechanics
- **100 XP per level** (Level 1: 0-100 XP, Level 2: 101-200 XP, etc.)
- **XP Sources**:
  - Log activities: +5-20 XP (varies by carbon impact)
  - Complete missions: +30-600 XP (based on difficulty)
  - Consecutive day streaks: Bonus XP
- **Level Benefits**:
  - Unlock new missions every level
  - Access harder challenges with bigger rewards
  - Increase island health capacity

### Mission Difficulty Tiers
- 🟢 **Easy** (30-50 XP): Basic activities, short duration
- 🟡 **Medium** (80-150 XP): Moderate challenges, 7-14 days
- 🔴 **Hard** (200-300 XP): Significant goals, 14-30 days
- ⚫ **Expert** (400-600 XP): Ultimate challenges for level 11+ users

### Island Health System
- **100% Health** = 🌳 Lush green island (healthy.json)
- **50-99% Health** = 🌿 Normal island (normal.json)
- **0-49% Health** = ☠️ Dead polluted island (dead.json)
- Health decreases with emissions, increases with carbon savings
- Visual feedback motivates users to reduce carbon footprint

## 🤖 AI Assistant Features

### Groq-Powered Intelligence
- **Model**: LLaMA 3.3 70B Versatile (70 billion parameters)
- **Response Time**: <1 second average
- **Context**: Specialized in Indonesian sustainability & climate action
- **Personality**: Friendly, encouraging, solution-focused
- **Knowledge Areas**:
  - Energy efficiency (AC, lighting, appliances)
  - Green transportation (public transport, cycling, EVs)
  - Low-carbon diet (meatless meals, local produce)
  - Waste reduction (zero waste, composting, recycling)
  - Water conservation
  - Climate change facts & Indonesian impact

### Chat Features
- **Persistent History**: Conversations saved in localStorage
- **New Chat Button**: Reset conversation anytime
- **Fallback System**: Keyword matching if API unavailable
- **Natural Language**: Understands casual Indonesian questions

## 📊 Dashboard Statistics

- **Today's Impact**: Emission vs. Saved CO2 (real-time)
- **Total Impact**: Lifetime statistics
- **Dual-Line Graph**: Visualize emission trends (red) vs. savings (green)
- **Island Visualization**: Dynamic Lottie animation based on health
- **Quick Actions**: Log activity modal accessible from dashboard

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd client
vercel --prod
```

### Backend (Render/Railway)
- Set environment variables in hosting dashboard
- Deploy from GitHub repository
- Update `NEXT_PUBLIC_API_URL` in client to production URL

### Database (TiDB Cloud/PlanetScale)
- Import schema from migrations
- Update connection string in server `.env`

## 🐛 Troubleshooting

### Common Issues

**AI not responding / "ERROR" message:**
- Check `GROQ_API_KEY` in server `.env`
- Verify API key is valid at https://console.groq.com/keys
- Check server logs for Groq API errors
- Fallback keyword matching should still work

**Missions not unlocking:**
- Verify user level matches mission `min_level`
- Check database: `SELECT current_level, total_xp FROM users WHERE id = ?`
- Mission progress calculation requires activity logs

**Graph not displaying:**
- Ensure `getDashboardSummary` endpoint returns proper format
- Check browser console for fetch errors
- Verify `graphData` array has correct structure: `[{ name, emission, saved }]`

**Chat history disappears:**
- localStorage might be disabled or cleared
- Check browser privacy settings (Allow cookies/localStorage)
- "Chat Baru" button intentionally clears history

## 📚 Additional Documentation

- **Groq Setup Guide**: See `GROQ_SETUP.md` for detailed AI configuration
- **Database Schema**: Check `server/migrations/` for table structures
- **Mission System**: See `missionControllerV2.js` for progress calculation logic

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
- Follow existing code structure and naming conventions
- Add comments for complex logic (especially mission progress calculation)
- Test new features locally before committing
- Update README if adding new features or changing configuration

## 📄 License

This project is licensed under the ISC License.

## 🌟 Acknowledgments

- **Groq** - Free AI API for LLaMA models
- **TiDB Cloud** - Serverless MySQL-compatible database
- **Lottie** - Beautiful animations for island health states
- **Recharts** - Simple yet powerful chart library
- **Lucide** - Beautiful open-source icon set

---

**Built with 💚 for a sustainable future | Track, Reduce, Thrive 🌍**
