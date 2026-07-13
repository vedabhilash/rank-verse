# RankVerse: AI-Powered Community Ranking Platform

RankVerse is an AI-powered "Top 10" ranking platform built using the MERN stack (MongoDB, Express, React, Node.js). Users can create, discover, and vote on Top 10 lists for any category. Personal rankings feed into a global Community Ranking Engine that aggregates votes across the network into live, auto-updating global Top 10 rankings.

## Monorepo Directory Structure

```text
rankverse/
├── client/                      # React frontend client (Vite)
│   ├── src/
│   │   ├── api/                 # axios instances & API routes
│   │   ├── components/          # reusable React components
│   │   ├── pages/               # page templates (Home, Explore, etc.)
│   │   ├── context/             # AuthContext, SocketContext
│   │   └── App.jsx              # central routes & router
│   └── tailwind.config.js       # style configurations
├── server/                      # Express backend server
│   ├── src/
│   │   ├── config/              # db connection, Cloudinary, Gemini configs
│   │   ├── models/              # Mongoose database schemas
│   │   ├── controllers/         # route controllers
│   │   ├── routes/              # Express API router definitions
│   │   ├── middleware/          # auth guards, rate limiters, upload parses
│   │   ├── services/            # aggregation, AI, trending, sockets services
│   │   ├── tests/               # integration test cases
│   │   └── server.js            # Entry application script
│   └── .env.example             # configurations keys example
└── README.md                    # project documentation
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Local MongoDB instance or MongoDB Atlas Connection URI
- Gemini API Key, Cloudinary Cloud details, Pexels & Pixabay API Keys

### Installation
From the root directory, run:
```bash
npm install && npm install --prefix server && npm install --prefix client --legacy-peer-deps
```

### Environment Setup
Create a `.env` file in the `server/` directory and populate it:
```ini
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/rankverse
JWT_ACCESS_SECRET=your_jwt_access_secret_12345
JWT_REFRESH_SECRET=your_jwt_refresh_secret_67890
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_google_gemini_api_key
PEXELS_API_KEY=your_pexels_key
PIXABAY_API_KEY=your_pixabay_key
AI_IMAGE_PROVIDER_API_KEY=your_optional_image_generation_provider_key
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the `client/` directory:
```ini
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### Running Locally
To launch both client and server in concurrent development mode:
```bash
npm run dev
```
Alternatively:
- Server only: `npm run server`
- Client only: `npm run client`

---

## API Documentation

### Versioned Endpoint Prefix: `/api/v1`

#### User & Auth
- `POST /auth/register` - Create user account (returns user, signs access + refresh tokens).
- `POST /auth/login` - Authenticate credentials.
- `POST /auth/refresh` - Refresh access token via httpOnly cookie.
- `POST /auth/logout` - Clear cookies & session.

#### Rankings CRUD
- `POST /rankings` - Create ranking list (guarded, requires items list).
- `GET /rankings` - Query rankings (supports search `?search=`, category `?category=`, sort `?sort=latest|trending|popular|views`, pagination).
- `GET /rankings/:id` - Fetch single ranking by ID or Slug.
- `PATCH /rankings/:id` - Edit ranking (owner only).
- `DELETE /rankings/:id` - Soft-remove ranking (creator or admin).

#### Social & Voting
- `POST /rankings/:id/like` - Toggle like status.
- `POST /rankings/:id/bookmark` - Toggle bookmark status.
- `POST /rankings/:id/view` - Debounced views count increment.
- `POST /rankings/:id/items/:itemId/vote` - Upvote ranking item. Removes vote if toggled again. Enforces unique one vote per item per user.

#### Community Standings
- `GET /community/:category` - Return live Top 10 list aggregated dynamically from user submissions.

#### Comments
- `POST /rankings/:id/comments` - Post comment (or reply to parentComment).
- `GET /rankings/:id/comments` - Get hierarchical comment threads.
- `DELETE /comments/:id` - Delete comment and recursive replies.

#### Discovery & Leaderboards
- `GET /trending` - List top trending rankings based on decay weight.
- `GET /search?q=&type=rankings|users` - Global search results.
- `GET /leaderboards/creators` - Hall of Fame top curators.
- `GET /leaderboards/rankings` - List popular lists.

#### AI Services
- `POST /ai/describe-image` - Analyse image and return description + tags using Gemini 2.5 Flash.
- `POST /ai/generate-image` - Text-to-image generation from prompt title + category.

---

## Running Integration Tests

To verify user authentication, unique voting constraints, and the Community aggregation engine, run:
```bash
node server/src/tests/run-tests.js
```
*(Make sure a local MongoDB instance is running, as it connects to `mongodb://127.0.0.1:27017/rankverse-test`)*
