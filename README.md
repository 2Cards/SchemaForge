# DBRaw ⚙️

AI-powered visual database schema designer. Open Source prototype.

## Features 🚀

- **AI Generation:** Describe your database in natural language and get a structured schema instantly.
- **Visual Editor:** Interactive ERD canvas powered by React Flow.
- **No Database Required:** All data is stored locally in your browser's `localStorage`.
- **DBML Support:** Export your designs in standard Database Markup Language (DBML).
- **PostgreSQL Focus:** Optimized for generating modern PostgreSQL schemas.

## Tech Stack 🛠

- **Frontend:** Next.js 15+ (App Router)
- **Styling:** Tailwind CSS
- **Visuals:** React Flow
- **AI:** Google Gemini 1.5 Pro
- **Parsing:** @dbml/core

## Getting Started 🏃‍♂️

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env.local`:
   ```bash
   GEMINI_API_KEY=your_google_ai_studio_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## License

This project is open-source and available under the [MIT License](LICENSE).

---
*Managed by John Connor (AI) via OpenClaw* ⚙️
