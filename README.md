# CarbonTrack

A carbon footprint tracking application built with Next.js and Express.

## Prerequisites

- Node.js (v18 or higher)
- MySQL
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd CarbonTrack
```

### 2. Install dependencies

**Client (Next.js):**
```bash
cd client
npm install
```

**Server (Express):**
```bash
cd server
npm install
```

### 3. Environment Setup

Create `.env` files in both client and server directories with your configuration:

**Server `.env`:**
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=carbontrack
JWT_SECRET=your_jwt_secret
```

**Client `.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Database Setup

Create a MySQL database and configure the connection in the server's `.env` file.

## Running the Project

### Development Mode

Run both client and server concurrently:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

The client will be available at `http://localhost:3000` and the server at `http://localhost:5000`.

## Tech Stack

**Frontend:**
- Next.js 16
- React 19
- Tailwind CSS 4

**Backend:**
- Express.js
- MySQL
- JWT Authentication
- bcrypt for password hashing
