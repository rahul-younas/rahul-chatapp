# VoiceHub — Realtime Voice Chat

Discord-style temporary chat rooms with realtime text chat, built with Next.js (JavaScript), Clerk, MongoDB, and Socket.IO.

## Features

- Clerk authentication (Google, email/password)
- Temporary chat rooms with auto-delete when empty
- Realtime text chat (in-memory only, never stored in MongoDB)
- Admin dashboard (ban users, manage roles, delete rooms)

## Tech Stack

- **Frontend:** Next.js App Router, JavaScript, Tailwind CSS, shadcn-style UI
- **Auth:** Clerk
- **Database:** MongoDB + Mongoose
- **Realtime:** Socket.IO (standalone server)

## Prerequisites

- Node.js 20+
- pnpm
- MongoDB Atlas (or local MongoDB)
- [Clerk](https://clerk.com) application

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `MONGODB_URI` | MongoDB connection string |
| `NEXT_PUBLIC_APP_URL` | App URL (`http://localhost:3000`) |
| `NEXT_PUBLIC_SOCKET_URL` | Socket server URL (`http://localhost:3001`) |
| `SOCKET_PORT` | Socket server port (default `3001`) |

### Clerk setup

1. Create a Clerk app and enable Email + Google providers.
2. Set sign-in URL: `/sign-in`, sign-up URL: `/sign-up`.
3. Add `http://localhost:3000` to allowed origins.

### Admin role

Users default to `role: "user"`. Promote to admin in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## Local Development

Run **both** the Next.js app and Socket.IO server:

```bash
pnpm install
pnpm dev
```

- Next.js: http://localhost:3000
- Socket.IO: http://localhost:3001

Or run separately:

```bash
pnpm dev:next    # terminal 1
pnpm dev:socket  # terminal 2
```

## Project Structure

```
app/              # Next.js pages & API routes
components/       # UI & feature components
hooks/            # Client hooks (socket)
lib/              # Utilities, auth, validators
models/           # Mongoose schemas
server/           # Standalone Socket.IO server
actions/          # Server actions
providers/        # React providers
middleware.js     # Clerk route protection
```

## Deployment (Vercel + free tiers)

Vercel **cannot** host persistent WebSocket servers. Deploy in two parts:

### 1. Next.js on Vercel (free)

1. Push repo to GitHub.
2. Import project in [Vercel](https://vercel.com).
3. Add all env vars from `.env.local`.
4. Set `NEXT_PUBLIC_SOCKET_URL` to your socket server URL (step 2).

### 2. Socket.IO on Render / Railway (free)

1. Create a **Web Service** pointing to `node server/index.js`.
2. Set env: `MONGODB_URI`, `CLERK_SECRET_KEY`, `SOCKET_PORT`, `NEXT_PUBLIC_APP_URL` (your Vercel URL).
3. Use the Render/Railway public URL as `NEXT_PUBLIC_SOCKET_URL` in Vercel.

### MongoDB

- **MongoDB Atlas** — free M0 cluster.

### Production checklist

- [ ] `NEXT_PUBLIC_APP_URL` = production Vercel URL
- [ ] `NEXT_PUBLIC_SOCKET_URL` = production socket server URL
- [ ] Clerk production keys + allowed domains

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Next.js + Socket.IO concurrently |
| `pnpm dev:next` | Next.js only |
| `pnpm dev:socket` | Socket server only |
| `pnpm build` | Production build |
| `pnpm start` | Start production Next.js |

## Security

- Clerk middleware protects routes
- Socket events validate JWT via Clerk
- Input sanitization (DOMPurify)
- In-memory rate limiting on API and socket events
- Admin actions require `role: "admin"` in MongoDB

## License

MIT
