# PGPals - Prince George's Park Residence Event

A modern quest-based gamification web application where participants complete challenges, submit proof via Telegram, and compete on leaderboards.

## 🎯 Features

- **Quest Management**: Browse and complete various quests across different categories
- **Telegram Integration**: Submit proof photos directly via Telegram bot
- **AI Validation**: Automatic submission validation with local AI processing
- **Leaderboard**: Real-time rankings of top participants
- **Admin Panel**: Manage quests, review submissions, and moderate content

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier)
- Telegram Bot Token

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pgpals
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
- Supabase URL and keys
- Telegram bot token
- NextAuth secret

4. Set up the database:
- Create a new Supabase project
- Run the SQL from `database.sql` in your Supabase SQL editor

5. Start the development server:
```bash
npm run dev
```

## 🤖 Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get your bot token and add it to `.env.local`
3. Set up webhook (in production):
```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-domain.com/api/telegram/webhook"}'
```

## 📱 How to Use

### For Participants

1. Start the Telegram bot: `/start`
2. Browse quests: `/quests`  
3. Submit proof: Send photo with `/submit [quest_id]`
4. Check status: `/status`
5. View leaderboard: `/leaderboard`

### For Admins

- Access admin panel at `/admin` (requires admin role)
- Manage quests and review submissions
- Send announcements via Telegram

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript + Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL via Supabase
- **Storage**: Telegram as free CDN
- **AI Processing**: Local Python scripts for validation
- **Deployment**: Vercel (free tier)

## 🔧 Development

```bash
# Run development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

## 📊 Database Schema

Key tables:
- `users` - Participant and admin accounts
- `quests` - Available challenges
- `submissions` - Quest submission records
- `user_quest_completions` - Completed quest tracking

See `database.sql` for complete schema.

## 🤖 Local AI Processing

For cost-effective validation of 7000+ submissions:

1. Set up Python environment:
```bash
python -m venv pgpals_ai
source pgpals_ai/bin/activate
pip install torch torchvision transformers opencv-python pillow requests python-telegram-bot supabase
```

2. Run daily processing script (to be created):
```bash
python scripts/daily_ai_processing.py
```

## 🚀 Deployment

1. Deploy to Vercel:
```bash
vercel deploy
```

2. Set environment variables in Vercel dashboard
3. Set up Telegram webhook to your production URL

## 📈 Scaling

The current setup handles:
- Unlimited submissions via Telegram storage
- Local AI processing (no API costs)
- Real-time leaderboards
- Free tier deployment

For larger scale:
- Consider Redis for caching
- Implement queue system for AI processing
- Add CDN for static assets

## 🛡️ Security

- Row Level Security (RLS) enabled on all tables
- Environment variables for sensitive data
- Input validation on all endpoints
- Rate limiting on API routes

## 📝 License

MIT License - see LICENSE file for details.