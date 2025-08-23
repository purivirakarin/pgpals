# PGPals - Quest-Based Gamification Platform

A modern web application where participants complete quests, submit proof via Telegram, and compete on leaderboards.

## 🎯 Core Features

- **Quest Management**: Browse, filter, and complete quests with expiration dates
- **Partner System**: Form partnerships with other participants for collaborative quests
- **Group Submissions**: Multiple pairs can work together on large-scale activities
- **Telegram Integration**: Submit photos directly via bot with automatic validation
- **Real-time Leaderboard**: Track rankings and progress with live updates
- **Admin Dashboard**: Complete management of quests, submissions, and users
- **AI Validation**: Automatic photo validation with manual admin override

## 🚀 Quick Start

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd pgpals
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
# Fill in: Supabase URL/keys, Telegram bot token, NextAuth secret
```

3. **Set up database:**
- Create Supabase project
- Run migrations in `/database/` folder in order (01-11)

4. **Start development:**
```bash
npm run dev
```

### Telegram Bot Setup

1. Create bot via [@BotFather](https://t.me/botfather)
2. Add token to `.env.local`
3. Set webhook: `/api/telegram/set-webhook`

## 🎮 How It Works

### For Participants
1. **Get Started**: Create account → Link Telegram → Browse quests
2. **Partner Up**: Optional partnership system for collaborative quests
3. **Submit Proof**: Send photos via Telegram bot (`/submit [quest_id]`)
4. **Track Progress**: View real-time leaderboard and submission history

### Quest Categories
- **Pair**: Activities for 2 people (individual pairs)
- **Multiple-Pair**: Group activities for 4+ people (multiple pairs working together)
- **Bonus**: Time-limited special activities with expiration dates

### Group Submissions
For multiple-pair quests, use group codes:
```bash
/submit [quest_id] group:GRP002
# Your group is automatically included - just specify other groups
```

### For Administrators
- **Quest Management**: Create/edit quests with expiration dates
- **Submission Review**: AI-assisted validation with manual override
- **User Management**: Monitor progress and manage partnerships

## 🏗️ Technical Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API routes + PostgreSQL (Supabase)
- **Authentication**: NextAuth.js with role-based access
- **Real-time**: Supabase subscriptions for live updates
- **Image Storage**: Telegram Bot API (cost-effective CDN)
- **AI Processing**: Local Python scripts for validation
- **Deployment**: Vercel + Supabase (free tier compatible)

## 🔧 Development

### Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting
npm run type-check   # TypeScript validation
```

### Key Files
- `/src/app/api/` - API routes
- `/src/components/` - React components
- `/database/` - SQL migration files
- `/src/lib/` - Utilities (auth, database, telegram)
- `/src/types/` - TypeScript definitions

## 📊 Database

### Core Tables
- `users` - Participant and admin accounts with partnerships
- `quests` - Quest definitions with categories and expiration
- `submissions` - Photo submissions with AI analysis
- `partner_groups` - Group codes for collaborative submissions  
- `group_submissions` - Multi-pair quest submissions

### Migrations
Run migrations in `/database/` folder in numerical order (01-11) in your Supabase SQL editor.

## 🤖 AI Processing

Set up local Python environment for cost-effective validation:
```bash
python -m venv pgpals_ai && source pgpals_ai/bin/activate
pip install torch torchvision transformers opencv-python pillow requests supabase
```

## 🚀 Production Deployment

### Vercel + Supabase
1. Deploy to Vercel: `npx vercel --prod`
2. Set environment variables in Vercel dashboard
3. Configure Telegram webhook: `/api/telegram/set-webhook`

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret
TELEGRAM_BOT_TOKEN=your_bot_token
```

## 📝 License

MIT License

---

**PGPals** - Quest-based gamification platform for community engagement