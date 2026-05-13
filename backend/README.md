# Zebvo AI Backend

This folder contains the backend API for authentication, workspaces, content storage, scheduling, analytics, and Gemini AI relay.

## ✅ Features
- JWT auth (signup/login)
- Workspace CRUD
- Content history CRUD
- Scheduling CRUD
- Analytics summary
- Gemini API relay (server-side key)

## ✅ Setup
1. Install dependencies
2. Create a `.env` file based on `.env.example`
3. Run Prisma migration
4. Start the server

### Quick commands
```
npm install
cp .env.example .env
npm run generate
npm run migrate -- --name init
npm run dev
```

## Example environment
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change_me"
GEMINI_API_KEY="your_gemini_api_key"
PORT=5050
CORS_ORIGIN="http://localhost:5173"
```

## API Base
`http://localhost:5050`

## Health
`GET /health`

## Auth
- `POST /auth/signup`
- `POST /auth/login`

## Workspaces
- `GET /workspaces`
- `POST /workspaces`
- `PATCH /workspaces/:id`
- `DELETE /workspaces/:id`

## Content
- `GET /content?workspaceId=...`
- `POST /content`
- `PATCH /content/:id`
- `DELETE /content/:id`

## Schedule
- `GET /schedule?workspaceId=...`
- `POST /schedule`
- `PATCH /schedule/:id`
- `DELETE /schedule/:id`

## Analytics
- `GET /analytics?workspaceId=...`

## Gemini Relay
- `POST /ai/generate` (body: { prompt, stream })
