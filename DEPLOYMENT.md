I’ve prepared a complete deployment guide in Markdown format for your architecture:

* Next.js frontend → Vercel
* Socket.IO server → Render
* MongoDB Atlas
* Clerk
* LiveKit

You can copy this directly into your project docs or Cursor notes.

````md
# Full Deployment Guide
# Next.js + Socket.IO + Clerk + MongoDB + LiveKit

Architecture:

Frontend:
- Next.js App Router
- Hosted on Vercel

Realtime Backend:
- Express + Socket.IO
- Hosted on Render

Database:
- MongoDB Atlas

Authentication:
- Clerk

Voice Chat:
- LiveKit

---

# 1. REQUIREMENTS

Before deployment make sure you have:

- GitHub account
- Vercel account
- Render account
- MongoDB Atlas account
- Clerk account
- LiveKit account

---

# 2. PUSH PROJECT TO GITHUB

Initialize git:

```bash
git init
git add .
git commit -m "initial commit"
````

Create GitHub repository.

Then push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

git branch -M main

git push -u origin main
```

---

# 3. PROJECT STRUCTURE

Recommended structure:

```txt
project/
│
├── client/        # Next.js frontend
│
├── server/        # Express + Socket.IO server
│
└── README.md
```

---

# 4. DEPLOY SOCKET SERVER TO RENDER

Go to:
[https://render.com](https://render.com)

Login with GitHub.

---

## Create Web Service

Click:

```txt
New +
→ Web Service
```

Select your GitHub repository.

---

# 5. CONFIGURE RENDER

## Root Directory

Set:

```txt
server
```

---

## Environment

Choose:

```txt
Node
```

---

## Build Command

```bash
npm install
```

---

## Start Command

```bash
node server.js
```

OR

```bash
npm start
```

Depending on your server setup.

---

# 6. ADD ENV VARIABLES IN RENDER

Go:

```txt
Service → Environment
```

Add:

```env
MONGODB_URI=

LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=

CLIENT_URL=https://your-vercel-app.vercel.app
```

IMPORTANT:
Use actual production frontend URL.

---

# 7. DEPLOY RENDER SERVICE

Click:

```txt
Create Web Service
```

Wait for deployment.

Render gives URL:

```txt
https://your-server.onrender.com
```

Save this URL.

You will use it in frontend.

---

# 8. UPDATE SOCKET CORS

In your Socket.IO server:

```ts
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});
```

VERY IMPORTANT.

---

# 9. DEPLOY NEXT.JS FRONTEND TO VERCEL

Go to:
[https://vercel.com](https://vercel.com)

Login with GitHub.

---

# 10. IMPORT PROJECT

Click:

```txt
Add New Project
```

Select GitHub repository.

---

# 11. CONFIGURE VERCEL

If frontend inside `client` folder:

Set Root Directory:

```txt
client
```

---

## Framework Preset

Choose:

```txt
Next.js
```

---

# 12. ADD ENV VARIABLES IN VERCEL

Go:

```txt
Project Settings
→ Environment Variables
```

Add:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

MONGODB_URI=

LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=

NEXT_PUBLIC_SOCKET_URL=https://your-server.onrender.com

NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

IMPORTANT:
Use actual Render backend URL.

---

# 13. DEPLOY FRONTEND

Click:

```txt
Deploy
```

Wait until deployment completes.

Vercel gives URL:

```txt
https://your-app.vercel.app
```

---

# 14. UPDATE CLERK SETTINGS

Go to:
[https://dashboard.clerk.com](https://dashboard.clerk.com)

---

## Add Production Domain

Go:

```txt
Domains
```

Add:

```txt
your-app.vercel.app
```

---

## Update Redirect URLs

Add:

```txt
https://your-app.vercel.app
```

---

# 15. UPDATE LIVEKIT SETTINGS

Go to:
[https://cloud.livekit.io](https://cloud.livekit.io)

Ensure:

* Production domain allowed
* WebSocket connections enabled

---

# 16. UPDATE MONGODB NETWORK ACCESS

Go to:
[https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)

---

## Network Access

Allow:

```txt
0.0.0.0/0
```

For development/testing.

---

# 17. IMPORTANT NEXT.JS SOCKET CLIENT SETUP

Socket client:

```ts
import { io } from "socket.io-client";

export const socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL!,
  {
    transports: ["websocket"],
  }
);
```

---

# 18. IMPORTANT SOCKET SERVER SETUP

Example:

```ts
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
```

---

# 19. IMPORTANT RENDER FREE TIER LIMITATION

Render free services sleep after inactivity.

This may cause:

* socket reconnect delay
* first connection delay

This is normal on free tier.

---

# 20. HTTPS IMPORTANT

Good news:

* Vercel provides HTTPS automatically
* Render provides HTTPS automatically

This is REQUIRED for:

* microphone access
* WebRTC
* LiveKit

---

# 21. PRODUCTION SECURITY CHECKLIST

* Never expose secret keys
* Use environment variables only
* Validate socket events server-side
* Protect admin routes
* Verify room permissions
* Sanitize user input

---

# 22. FINAL PRODUCTION ARCHITECTURE

```txt
Frontend:
https://your-app.vercel.app

Socket Backend:
https://your-server.onrender.com

Database:
MongoDB Atlas

Auth:
Clerk

Voice:
LiveKit
```

---

# 23. COMMON DEPLOYMENT ERRORS

## CORS Error

Fix:

* update CLIENT_URL
* allow frontend domain in socket server

---

## Socket Not Connecting

Fix:

* verify NEXT_PUBLIC_SOCKET_URL
* verify Render backend is running

---

## Clerk Auth Failing

Fix:

* add production domain in Clerk dashboard
* update redirect URLs

---

## Microphone Not Working

Fix:

* use HTTPS
* allow microphone permissions

---

## MongoDB Connection Error

Fix:

* whitelist IP in MongoDB Atlas
* verify MONGODB_URI

---

# 24. RECOMMENDED PRODUCTION FLOW

```txt
GitHub
   ↓
Render → Socket Server
Vercel → Next.js Frontend
MongoDB Atlas → Database
Clerk → Authentication
LiveKit → Voice Chat
```

```
```
