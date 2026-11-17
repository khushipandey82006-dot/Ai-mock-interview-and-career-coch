# AI Mock Interview & Career Coach

Next.js (React) + serverless API route + Gemini API. Built from the project proposal deck.

## Run locally
    npm install
    cp .env.example .env.local   # add GEMINI_API_KEY
    npm run dev

## Deploy on Vercel
1. Push this folder to GitHub.
2. vercel.com -> Add New Project -> import the repo (Next.js is auto-detected).
3. Settings -> Environment Variables -> add `GEMINI_API_KEY`, then deploy.

## Notes
- Session history is stored in the browser (localStorage). To match the proposal's PostgreSQL storage, add Vercel Postgres/Neon and save the `hist` entry from `finish()` in `app/page.js` via a new API route.
- Swap Gemini for OpenAI by editing `lib/gemini.js` only.
