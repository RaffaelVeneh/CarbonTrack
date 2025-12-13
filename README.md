# CarbonTrack 🌍

CarbonTrack is a comprehensive full-stack web application designed to empower users to track, visualize, and reduce their daily carbon footprint. By combining activity logging, gamified missions, AI-powered eco-assistant, and social features, CarbonTrack makes sustainability engaging, educational, and actionable.

## ✨ Features

### Core Features
- **📊 Interactive Dashboard**: Real-time visualization of carbon emissions and savings with dual-line charts, island health system, and daily/total statistics.
- **🤖 AI-Powered EcoBot**: Conversational AI assistant powered by Groq (LLaMA 3.3 70B) that provides personalized eco-friendly advice, tips for reducing carbon footprint, and answers questions about sustainability in Indonesian context.
- **📝 Activity Logging**: Log daily activities across multiple categories (transportation, energy usage, diet, waste) with automatic CO2 calculation.
- **🎯 Progressive Mission System**: 52+ gamified missions spanning 21 levels with 6 mission types (CO2 saved, specific activities, consecutive days, total distance, etc.).
- **📅 Daily & Weekly Missions**: Time-limited challenges that reset daily and weekly, providing fresh goals and consistent engagement.
- **🏅 Badge System**: Earn achievement badges for reaching milestones (CO2 saved, activities logged, consecutive days, missions completed).
- **🏆 Leaderboard**: Real-time competitive rankings showing top eco-warriors by total XP and carbon savings.
- **👤 User Profile & Progress**: Track personal journey with XP system, level progression, achievement history, badge collection, and carbon impact over time.
- **📧 Email Verification**: Secure account verification via email with password reset functionality.
- **🔑 Google OAuth**: Quick sign-in with Google account for seamless authentication.

### Advanced Features
- **🎨 Dynamic Island Visualization**: Interactive Lottie animations reflecting environmental health (Healthy 🌳 → Normal 🌿 → Dead ☠️) based on user's carbon impact.
- **💾 Persistent Chat History**: AI chatbot conversations saved in localStorage with "New Chat" functionality.
- **🎊 Celebration System**: Confetti animations and reward feedback when completing missions, earning badges, or leveling up.
- **📈 Multi-Type Mission Tracking**: Intelligent progress calculation for various mission types including CO2-based, activity-based, and streak-based challenges.
- **🔐 Secure Authentication**: JWT-based authentication with BCrypt password hashing, email verification, and OAuth 2.0 integration.
- **🎯 Level-Gated Content**: Missions unlock progressively as users level up (100 XP per level).
- **📬 Notification System**: Real-time notifications for mission completions, badge unlocks, and daily/weekly mission resets.
- **⚙️ User Settings**: Customize username with cooldown protection and manage account preferences.

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
- **Users**: id, username, email, password, total_xp, current_level, island_health, email_verified, verification_token, reset_token, reset_token_expires, google_id, last_username_change, created_at
- **Activities**: id, name, category, co2_per_unit, unit
- **Daily Logs**: id, user_id, activity_id, input_value, carbon_emission, carbon_saved, log_date, created_at
- **Missions**: id, title, description, mission_type (enum), target_value, duration_days, required_activity_id, min_level, max_level, xp_reward, health_reward, icon, difficulty (enum)
- **User Missions**: id, user_id, mission_id, claimed_at
- **Daily Missions**: id, title, description, mission_type, target_value, xp_reward, icon, created_at
- **User Daily Missions**: id, user_id, daily_mission_id, progress, completed, claimed, mission_date, claimed_at
- **Weekly Missions**: id, title, description, mission_type, target_value, xp_reward, icon, week_start, week_end, created_at
- **User Weekly Missions**: id, user_id, weekly_mission_id, progress, completed, claimed, claimed_at
- **Badges**: id, name, description, icon, requirement_type (enum), requirement_value, created_at
- **User Badges**: id, user_id, badge_id, earned_at
- **Notifications**: id, user_id, type, title, message, is_read, created_at

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

   # Email Service Configuration (for email verification & password reset)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=CarbonTrack <noreply@carbontrack.app>
   CLIENT_URL=http://localhost:3000

   # Google OAuth Configuration (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

   **🤖 Setting up Groq AI (5 minutes, FREE):**
   1. Visit https://console.groq.com/ and sign up (Google/GitHub)
   2. Navigate to https://console.groq.com/keys
   3. Click "Create API Key" → Copy the key (format: `gsk_...`)
   4. Paste into `.env` as shown above
   5. Free tier includes **14,400 requests/day** (more than enough!)
   
   **📧 Setting up Email Service:**
   See `server/migrations/SETUP_EMAIL.md` for detailed instructions on configuring Gmail SMTP or other email providers.

   **🔑 Setting up Google OAuth:**
   See `server/migrations/SETUP_GOOGLE_OAUTH.md` for step-by-step guide to enable Google Sign-In.

3. **Client Environment Variables**
   Create a `.env.local` file in the `client` directory:
   ```env
   # Backend API URL
   NEXT_PUBLIC_API_URL=http://localhost:5000/api

   # NextAuth Configuration (for Google OAuth)
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_key
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
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
├── client/                              # Next.js Frontend (Port 3000)
│   ├── src/
│   │   ├── app/                         # App Router Pages
│   │   │   ├── page.js                  # Landing/Login page
│   │   │   ├── layout.js                # Root layout with Sidebar
│   │   │   ├── globals.css              # Global styles
│   │   │   ├── api/
│   │   │   │   └── auth/
│   │   │   │       └── [...nextauth]/   # NextAuth API routes
│   │   │   │           └── route.js     # OAuth configuration
│   │   │   ├── auth/
│   │   │   │   └── google-callback/     # Google OAuth callback
│   │   │   │       └── page.js
│   │   │   ├── dashboard/               # 📊 Main dashboard with graphs
│   │   │   │   └── page.js
│   │   │   ├── assistant/               # 🤖 AI chatbot interface
│   │   │   │   └── page.js
│   │   │   ├── missions/                # 🎯 Mission list & progress
│   │   │   │   └── page.js
│   │   │   ├── history/                 # 📝 Activity log history
│   │   │   │   └── page.js
│   │   │   ├── leaderboard/             # 🏆 User rankings
│   │   │   │   └── page.js
│   │   │   ├── profile/                 # 👤 User profile & stats
│   │   │   │   └── page.js
│   │   │   ├── settings/                # ⚙️ App settings
│   │   │   │   └── page.js
│   │   │   ├── login/                   # 🔐 Login page
│   │   │   │   └── page.js
│   │   │   ├── forgot-password/         # 🔑 Password recovery
│   │   │   │   └── page.js
│   │   │   └── reset-password/          # 🔄 Password reset
│   │   │       └── page.js
│   │   ├── assets/
│   │   │   └── lottie/                  # Island health animations
│   │   │       ├── healthy.json         # 🌳 Green healthy island
│   │   │       ├── normal.json          # 🌿 Normal state island
│   │   │       └── dead.json            # ☠️ Polluted dead island
│   │   ├── components/
│   │   │   ├── Sidebar.js               # Navigation sidebar
│   │   │   ├── ActivityModal.js         # Activity logging modal
│   │   │   ├── EcoPlant.js              # Island visualization component
│   │   │   ├── DailyMissionsTab.js      # Daily missions display
│   │   │   ├── WeeklyMissionsTab.js     # Weekly missions display
│   │   │   ├── BadgeCollection.js       # Badge showcase
│   │   │   ├── BadgeRewardModal.js      # Badge unlock modal
│   │   │   └── NotificationDropdown.js  # Notification center
│   │   ├── contexts/
│   │   │   ├── ThemeContext.js          # Theme management
│   │   │   └── BadgeContext.js          # Badge state management
│   │   └── utils/                       # Helper functions
│   ├── public/                          # Static assets
│   ├── .env.local                       # Client environment variables
│   ├── package.json                     # Frontend dependencies
│   ├── next.config.mjs                  # Next.js configuration
│   ├── postcss.config.mjs               # PostCSS configuration
│   ├── eslint.config.mjs                # ESLint configuration
│   └── jsconfig.json                    # JavaScript configuration
│
└── server/                              # Express Backend (Port 5000)
    ├── config/
    │   ├── db.js                        # MySQL connection pool
    │   └── scheduler.js                 # Cron jobs for daily/weekly resets
    ├── controllers/
    │   ├── aiController.js              # 🤖 Groq AI integration
    │   ├── authController.js            # 🔐 Login/Register/OAuth logic
    │   ├── logController.js             # 📊 Activity logging & stats
    │   ├── missionControllerV2.js       # 🎯 Mission progress & rewards
    │   ├── dailyMissionController.js    # 📅 Daily mission management
    │   ├── weeklyMissionController.js   # 📆 Weekly mission management
    │   ├── badgeController.js           # 🏅 Badge system & achievements
    │   └── userController.js            # 👤 User profile & leaderboard
    ├── models/
    │   └── userModel.js                 # User database operations
    ├── routes/
    │   ├── aiRoutes.js                  # POST /api/ai/ask
    │   ├── authRoutes.js                # POST /api/auth/* (login, register, verify, reset)
    │   ├── logRoutes.js                 # GET|POST /api/logs/*
    │   ├── missionRoutes.js             # GET|POST /api/missions/*
    │   ├── dailyMissionRoutes.js        # GET|POST /api/daily-missions/*
    │   ├── weeklyMissionRoutes.js       # GET|POST /api/weekly-missions/*
    │   ├── badgeRoutes.js               # GET /api/badges/*
    │   └── userRoutes.js                # GET|PUT /api/users/*
    ├── services/
    │   └── emailService.js              # Email sending functionality
    ├── migrations/
    │   ├── db.sql                       # Main database schema
    │   ├── add_email_verification.sql   # Email verification tables
    │   ├── add_google_auth.sql          # Google OAuth fields
    │   ├── add_username_cooldown.sql    # Username change protection
    │   ├── SETUP_EMAIL.md               # Email configuration guide
    │   └── SETUP_GOOGLE_OAUTH.md        # OAuth setup guide
    ├── backup/                          # Controller backups
    │   ├── aiController.js.backup
    │   ├── dailyMissionController.js.backup
    │   └── missionController.js.old
    ├── .env                             # Server environment variables
    ├── index.js                         # Express server entry point
    ├── package.json                     # Backend dependencies
    └── vercel.json                      # Vercel deployment config
```

## 🔗 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user (username, email, password)
- `POST /api/auth/login` - User login → Returns JWT token
- `POST /api/auth/google` - Google OAuth login/register
- `GET /api/auth/verify-email/:token` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password/:token` - Reset password with token

### Activity Logs (`/api/logs`)
- `GET /api/logs/summary/:userId` - Dashboard summary (today/total emissions, savings, graph data)
- `POST /api/logs` - Log new activity (userId, activityId, inputValue, logDate)
- `GET /api/logs/history/:userId` - Get activity history with pagination
- `GET /api/logs/activities` - Get all available activities

### Missions (`/api/missions`)
- `GET /api/missions/:userId` - Get all missions with progress calculation (6 mission types)
- `POST /api/missions/claim` - Claim completed mission rewards (XP + health)
- `GET /api/missions/history/:userId` - Get claimed missions history

### Daily Missions (`/api/daily-missions`)
- `GET /api/daily-missions/:userId` - Get today's daily missions with progress
- `POST /api/daily-missions/claim` - Claim completed daily mission rewards
- `POST /api/daily-missions/generate` - Admin: Generate new daily missions

### Weekly Missions (`/api/weekly-missions`)
- `GET /api/weekly-missions/:userId` - Get current week's missions with progress
- `POST /api/weekly-missions/claim` - Claim completed weekly mission rewards
- `POST /api/weekly-missions/generate` - Admin: Generate new weekly missions

### Badges (`/api/badges`)
- `GET /api/badges/:userId` - Get user's earned badges
- `GET /api/badges/all/:userId` - Get all badges with unlock status
- `POST /api/badges/check/:userId` - Check and award eligible badges

### AI Assistant (`/api/ai`)
- `POST /api/ai/ask` - Ask EcoBot any sustainability question
  - Request: `{ question: "How to save energy?" }`
  - Response: `{ answer: "Detailed eco-friendly tips..." }`
  - Powered by Groq LLaMA 3.3 70B with fallback to keyword matching

### Users (`/api/users`)
- `GET /api/users/leaderboard` - Get top 10 users by XP and carbon savings
- `GET /api/users/profile/:userId` - Get user profile data
- `PUT /api/users/profile/:userId` - Update user profile
- `PUT /api/users/username/:userId` - Change username (30-day cooldown)
- `GET /api/users/notifications/:userId` - Get user notifications
- `PUT /api/users/notifications/:notificationId/read` - Mark notification as read

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
  - Complete main missions: +30-600 XP (based on difficulty)
  - Complete daily missions: +10-50 XP (resets daily)
  - Complete weekly missions: +50-150 XP (resets weekly)
  - Consecutive day streaks: Bonus XP
- **Level Benefits**:
  - Unlock new missions every level
  - Access harder challenges with bigger rewards
  - Increase island health capacity
  - Unlock exclusive badges

### Mission System Types

#### Main Missions (Progressive)
- 🟢 **Easy** (30-50 XP): Basic activities, short duration
- 🟡 **Medium** (80-150 XP): Moderate challenges, 7-14 days
- 🔴 **Hard** (200-300 XP): Significant goals, 14-30 days
- ⚫ **Expert** (400-600 XP): Ultimate challenges for level 11+ users

#### Daily Missions (24-hour reset)
- 3 missions generated daily at midnight
- Fresh challenges every day
- 10-50 XP rewards
- Encourages daily engagement

#### Weekly Missions (7-day reset)
- 3 missions generated weekly on Monday
- Longer-term challenges
- 50-150 XP rewards
- Weekly progress tracking

### Badge Achievement System
Earn badges by reaching milestones:
- **🌱 Carbon Saver Badges**: Save 10kg, 50kg, 100kg, 500kg, 1000kg CO2
- **📝 Activity Logger Badges**: Log 10, 50, 100, 500, 1000 activities
- **🔥 Streak Master Badges**: 7, 30, 100, 365 consecutive days
- **🏆 Mission Completer Badges**: Complete 5, 25, 50, 100, 250 missions
- **⭐ Level Achievement Badges**: Reach levels 5, 10, 20, 30, 50

### Island Health System
- **100% Health** = 🌳 Lush green island (healthy.json)
- **50-99% Health** = 🌿 Normal island (normal.json)
- **0-49% Health** = ☠️ Dead polluted island (dead.json)
- Health decreases with emissions, increases with carbon savings
- Visual feedback motivates users to reduce carbon footprint
- Dynamic Lottie animations provide immersive experience

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
- **Mission Progress**: View active daily, weekly, and main missions
- **Badge Showcase**: Display recently earned badges
- **Notifications**: Real-time alerts for achievements and rewards
- **Leaderboard Preview**: See your rank among other eco-warriors

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

**Daily/Weekly missions not resetting:**
- Check if `scheduler.js` is running (cron jobs)
- Verify server timezone matches your expected timezone
- Manually trigger reset via admin endpoints if needed

**Graph not displaying:**
- Ensure `getDashboardSummary` endpoint returns proper format
- Check browser console for fetch errors
- Verify `graphData` array has correct structure: `[{ name, emission, saved }]`

**Chat history disappears:**
- localStorage might be disabled or cleared
- Check browser privacy settings (Allow cookies/localStorage)
- "Chat Baru" button intentionally clears history

**Email verification not working:**
- Check email service configuration in `.env`
- Verify SMTP credentials (Gmail requires App Password)
- Check spam/junk folder for verification emails
- See `SETUP_EMAIL.md` for detailed troubleshooting

**Google OAuth not working:**
- Verify Google Client ID and Secret in `.env`
- Check OAuth redirect URIs in Google Console
- Ensure NextAuth is properly configured
- See `SETUP_GOOGLE_OAUTH.md` for setup guide

**Badges not unlocking:**
- Run badge check endpoint: `POST /api/badges/check/:userId`
- Verify badge requirements in database
- Check if user meets all criteria for the badge

**Username change cooldown:**
- Users can only change username once every 30 days
- Check `last_username_change` field in users table
- Admin can manually reset cooldown if needed

## 📚 Additional Documentation

- **Database Schema**: Check `server/migrations/db.sql` for complete table structures
- **Email Setup**: See `server/migrations/SETUP_EMAIL.md` for email service configuration
- **Google OAuth Setup**: See `server/migrations/SETUP_GOOGLE_OAUTH.md` for OAuth configuration
- **Email Verification**: See `server/migrations/add_email_verification.sql` for schema changes
- **Google Auth Fields**: See `server/migrations/add_google_auth.sql` for OAuth fields
- **Username Cooldown**: See `server/migrations/add_username_cooldown.sql` for protection feature
- **Mission System**: See `missionControllerV2.js` for progress calculation logic
- **Badge System**: See `badgeController.js` for achievement logic
- **Scheduler**: See `config/scheduler.js` for automated task management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
- Follow existing code structure and naming conventions
- Add comments for complex logic (especially mission progress calculation)
- Test new features locally before committing
- Update README if adding new features or changing configuration

## 📄 License

This project is licensed under the ISC License.

## 🔧 Automated Tasks (Scheduler)

The application includes automated cron jobs for maintaining game mechanics:

- **Daily Mission Reset**: Every day at 00:00 (midnight)
  - Generates 3 new daily missions
  - Resets user progress for the new day
  
- **Weekly Mission Reset**: Every Monday at 00:00
  - Generates 3 new weekly missions
  - Resets user progress for the new week
  
- **Badge Auto-Check**: Runs periodically
  - Automatically checks and awards eligible badges
  - Sends notifications for new achievements

See `server/config/scheduler.js` for cron job configurations.

## 🌟 Key Technologies & Dependencies

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart library
- **Lottie React** - Animation library
- **React Confetti** - Celebration effects
- **Lucide React** - Icon library
- **NextAuth.js** - Authentication library for OAuth
- **html2canvas & jspdf** - Export functionality

### Backend
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **BCrypt** - Password hashing
- **JSON Web Token (JWT)** - Authentication tokens
- **Groq SDK** - AI integration
- **Node-cron** - Task scheduling
- **Nodemailer** - Email service
- **CORS** - Cross-origin resource sharing
- **Dotenv** - Environment variables

## 🌟 Acknowledgments

- **Groq** - Free AI API for LLaMA models
- **TiDB Cloud** - Serverless MySQL-compatible database
- **Lottie** - Beautiful animations for island health states
- **Recharts** - Simple yet powerful chart library
- **Lucide** - Beautiful open-source icon set
- **Next.js Team** - Amazing React framework
- **Vercel** - Deployment platform
- **Google** - OAuth authentication provider

---

**Built with 💚 for a sustainable future | Track, Reduce, Thrive 🌍**
