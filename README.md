# PGPals - Prince George's Park Residence

A modern quest-based gamification web application where participants complete challenges, submit proof via Telegram, and compete on leaderboards with comprehensive admin management tools.

## 🎯 Core Features

### 🏆 For Participants
- **Quest Discovery**: Browse quests with advanced filtering by category, status, and search
- **Smart Sorting**: Sort quests by title, points, creation date, or expiration date
- **Quest Details**: View comprehensive quest information including requirements and expiration dates
- **Visual Status Tracking**: Clear status badges (Pending Review, Completed, Rejected)
- **Telegram Integration**: Submit proof photos directly via Telegram bot
- **Real-time Leaderboard**: Live rankings with points and completion streaks
- **Profile Management**: Track personal progress and submission history
- **Expiration Awareness**: Color-coded quest cards showing expired/expiring quests

### 🛠️ For Administrators
- **Complete Quest Management**: Create, edit, delete, and manage quest lifecycle
- **Advanced Quest Configuration**: 
  - Set expiration dates with automatic status management
  - Configure points, categories, and validation criteria
  - Toggle quest status (active/inactive)
- **Comprehensive Submission Review**:
  - Combined filtering for efficient workflow (pending, approved, rejected)
  - Bulk review capabilities for AI and manual submissions
  - Detailed submission analysis with admin feedback
- **User Management**: Monitor participant progress and manage user roles
- **Advanced Filtering & Sorting**: Multi-dimensional quest organization tools
- **Responsive Design**: Consistent experience across desktop and mobile devices

### 🤖 AI & Automation
- **AI Validation**: Automatic submission validation with confidence scoring
- **Manual Override**: Admin review capability for edge cases
- **Smart Status Management**: Automatic quest expiration handling
- **Batch Processing**: Efficient handling of large submission volumes

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

## 📱 Detailed User Guide

### 👥 Participant Experience

#### Quest Discovery & Management
1. **Browse Quests** (`/quests`):
   - Search by title, description, or category
   - Filter by quest categories (Academic, Social, Fitness, etc.)
   - Sort by creation date, title, points, or expiration date
   - View quest cards with points, status, and expiration information

2. **Quest Interaction**:
   - Click quest cards to view detailed requirements
   - See validation criteria and submission guidelines
   - Track quest status with clear visual indicators:
     - 🟢 **Completed**: Quest successfully completed
     - 🟡 **Pending Review**: Submission under review
     - 🔴 **Rejected**: Submission did not meet criteria
   - Monitor expiration dates with color-coded warnings

3. **Telegram Integration Process**:
   - **Step 1**: Create account on the website first
   - **Step 2**: Find the Telegram bot and send `/start` to get your Telegram ID
   - **Step 3**: Enter the Telegram ID in your website Profile page
   - **Step 4**: Click "Link Account" to connect

4. **Telegram Submission Workflow** (after linking):
   - Browse available quests: `/quests`
   - Submit proof: Send photo with `/submit [quest_id]`
   - Check submission status: `/status`
   - View personal leaderboard position: `/leaderboard`

5. **Progress Tracking**:
   - Personal profile showing total points and completion streak
   - Submission history with timestamps and status updates
   - Real-time leaderboard positioning

### 🔧 Administrator Experience

#### Quest Management Dashboard (`/admin/quests`)
1. **Quest Creation**:
   - Set title, description, and category
   - Configure point values and requirements
   - Define validation criteria (JSON format)
   - **Set expiration dates** for time-limited quests
   - Choose initial status (active/inactive)

2. **Quest Editing**:
   - Modify all quest parameters including expiration dates
   - Toggle quest status to activate/deactivate
   - Update points (automatically recalculates user totals)
   - Clear or update expiration dates

3. **Advanced Quest Organization**:
   - **Search**: Find quests by title, description, or category
   - **Filter by Category**: Organize by quest types
   - **Filter by Status**: View active, inactive, or all quests
   - **Sort Options**: 
     - Created Date (newest/oldest first)
     - Title (A-Z or Z-A)
     - Points (highest/lowest first)
     - Category (alphabetical)
     - **Expiration Date** (soonest/latest expiring first)
   - **Pagination**: Navigate through large quest collections

4. **Quest Status Management**:
   - Visual indicators for expired quests (red badges)
   - Warning indicators for soon-to-expire quests (yellow badges)
   - Automatic status changes for expired quests
   - Bulk status management capabilities

#### Submission Review Dashboard (`/admin/submissions`)
1. **Comprehensive Review System**:
   - View all submissions with participant details
   - See submission photos and quest context
   - Access AI analysis results and confidence scores
   - Add detailed admin feedback

2. **Efficient Filtering**:
   - **Combined Status Filtering**: 
     - "Pending Review" includes both AI and manual review queues
     - "Approved" shows all approved submissions
     - "Rejected" displays all rejected submissions
   - **Smart Workflow**: No need to distinguish between AI vs manual review types

3. **Review Actions**:
   - Approve submissions with automatic point allocation
   - Reject submissions with explanatory feedback
   - Override AI decisions when necessary
   - Bulk review capabilities for efficiency

4. **Submission Analytics**:
   - Track review patterns and approval rates
   - Monitor AI confidence levels
   - Identify quests requiring frequent manual review

#### User Management (`/admin/users`)
- Monitor participant engagement and progress
- View detailed user statistics and submission history
- Manage user roles and permissions
- Track leaderboard performance over time

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with responsive design
- **Authentication**: NextAuth.js with Supabase integration
- **State Management**: React hooks with optimistic updates
- **Components**: Custom reusable components with consistent styling

### Backend Infrastructure
- **API**: Next.js API routes with RESTful design
- **Database**: PostgreSQL via Supabase with Row Level Security
- **File Storage**: Telegram as CDN for image submissions
- **Real-time Updates**: Supabase real-time subscriptions
- **AI Processing**: Local Python scripts for cost-effective validation

### Key Features Implementation

#### Quest Expiration System
- Database triggers for automatic status updates
- Cron-ready functions for batch expiration processing
- Visual indicators with color-coded warnings
- Sorting and filtering by expiration dates

#### Submission Workflow
- AI-first validation with manual override capability
- Combined status management for efficient admin workflow
- Optimistic UI updates for responsive user experience
- Comprehensive audit trail for all submission changes

#### Responsive Design
- Mobile-first approach with progressive enhancement
- Custom dropdown components replacing native OS elements
- Consistent spacing and alignment across all screen sizes
- Touch-friendly interfaces for mobile admin management

### Database Schema Highlights

```sql
-- Core Tables
users              -- Participant and admin accounts with roles
quests             -- Quest definitions with expiration support
submissions        -- Submission tracking with AI analysis
user_quest_completions -- Achievement tracking

-- Key Features
- Row Level Security on all tables
- Automatic point calculation via database views
- Quest expiration triggers and functions
- Comprehensive indexing for performance
```

### Performance Optimizations
- **Pagination**: Efficient handling of large datasets
- **Lazy Loading**: Component-level code splitting
- **Caching**: Strategic use of Next.js caching mechanisms
- **Database Views**: Pre-computed user statistics
- **Image Optimization**: Telegram CDN integration

## 🔧 Development Guide

### Local Development Setup

```bash
# Clone and install
git clone <repository-url>
cd pgpals
npm install

# Environment setup
cp .env.example .env.local
# Fill in your Supabase and Telegram credentials

# Database setup
# 1. Create Supabase project
# 2. Run database.sql in SQL Editor
# 3. Apply migrations in order:
#    - migration_add_quest_expiration.sql
#    - migration_comprehensive.sql

# Start development server
npm run dev
```

### Development Commands

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run lint:fix

# Build for production testing
npm run build
npm start

# Database migrations (manual)
# Run SQL files in Supabase SQL Editor
```

### Code Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API endpoints
│   ├── quests/            # Quest browsing
│   └── leaderboard/       # Public leaderboard
├── components/            # Reusable UI components
│   ├── QuestCard.tsx     # Quest display component
│   ├── Dropdown.tsx      # Custom dropdown component
│   ├── Header.tsx        # Navigation header
│   └── Leaderboard.tsx   # Leaderboard display
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth configuration
│   ├── supabase.ts      # Database client
│   └── telegram.ts      # Bot integration
└── types/               # TypeScript definitions
    ├── index.ts         # Core type definitions
    └── next-auth.d.ts   # Auth type extensions
```

### Key Development Features

#### Component Design System
- **Consistent Styling**: Tailwind CSS with custom component library
- **Responsive Design**: Mobile-first approach with breakpoint utilities
- **Accessibility**: ARIA labels and keyboard navigation support
- **Type Safety**: Full TypeScript coverage with strict mode

#### API Design Patterns
- **RESTful Endpoints**: Consistent HTTP methods and status codes
- **Error Handling**: Structured error responses with user-friendly messages
- **Validation**: Input sanitization and type checking on all endpoints
- **Authorization**: Role-based access control with session verification

#### Database Interaction
- **Type-Safe Queries**: Supabase client with TypeScript integration
- **Real-Time Updates**: Live subscription for leaderboard and submissions
- **Optimistic Updates**: UI updates before server confirmation
- **Transaction Safety**: Atomic operations for point calculations

### Testing Strategy

#### Manual Testing Checklist
- [ ] Quest creation and editing with expiration dates
- [ ] Submission workflow from Telegram to admin review
- [ ] Filtering and sorting across all admin interfaces
- [ ] Mobile responsiveness on all pages
- [ ] Permission boundaries between participant and admin roles

#### Integration Testing
- [ ] Telegram webhook endpoint functionality
- [ ] Database migration compatibility
- [ ] Authentication flow with role assignment
- [ ] Point calculation accuracy across user actions

## 📊 Database Schema & Migrations

### Core Tables
```sql
users                  -- Participant and admin accounts
├── id (UUID)         -- Unique identifier
├── email             -- Authentication email
├── name              -- Display name
├── telegram_id       -- Telegram integration
├── role              -- 'participant' | 'admin'
├── total_points      -- Calculated via database view
└── created_at        -- Registration timestamp

quests                 -- Quest definitions and management
├── id (UUID)         -- Unique identifier
├── title             -- Quest name
├── description       -- Detailed requirements
├── category          -- Organization category
├── points            -- Reward value
├── status            -- 'active' | 'inactive' | 'archived'
├── expires_at        -- Optional expiration timestamp
├── requirements      -- Submission guidelines
├── validation_criteria -- AI validation rules (JSON)
├── created_by        -- Admin who created quest
└── created_at        -- Creation timestamp

submissions            -- Quest submission tracking
├── id (UUID)         -- Unique identifier
├── user_id           -- Participant reference
├── quest_id          -- Quest reference
├── telegram_file_id  -- Image storage reference
├── status            -- Comprehensive status tracking:
│   ├── pending_ai    -- Awaiting AI validation
│   ├── ai_approved   -- AI validation passed
│   ├── ai_rejected   -- AI validation failed
│   ├── manual_review -- Requires admin review
│   ├── approved      -- Admin approved
│   └── rejected      -- Admin rejected
├── ai_analysis       -- AI processing results (JSON)
├── ai_confidence_score -- Validation confidence (0-1)
├── admin_feedback    -- Manual review comments
├── reviewed_by       -- Admin who reviewed
└── submitted_at      -- Submission timestamp
```

### Essential Migrations

1. **Quest Expiration Support** (`migration_add_quest_expiration.sql`):
   - Adds `expires_at` column to quests table
   - Creates automatic expiration triggers
   - Implements batch expiration functions
   - Adds performance indexes

2. **Comprehensive Indexes** (`migration_comprehensive.sql`):
   - Optimizes query performance for large datasets
   - Supports efficient filtering and sorting
   - Enables real-time leaderboard calculations

### Database Views
```sql
user_points_view       -- Real-time point calculations
quest_statistics_view  -- Quest completion analytics
submission_summary_view -- Admin dashboard metrics
```

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

## 🚀 Deployment & Production Setup

### Vercel Deployment (Recommended)

1. **Deploy to Vercel**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from local
vercel deploy

# Deploy to production
vercel --prod
```

2. **Environment Configuration**:
Set these variables in Vercel dashboard:
```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

3. **Database Setup**:
```bash
# Apply base schema
# Run database.sql in Supabase SQL Editor

# Apply migrations (in order)
# 1. migration_add_quest_expiration.sql
# 2. migration_comprehensive.sql
# 3. Any additional migrations
```

4. **Telegram Webhook Configuration**:
```bash
# Set production webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-domain.vercel.app/api/telegram/webhook"}'

# Verify webhook
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### Production Considerations

#### Performance Optimization
- **Pagination**: All admin interfaces support efficient pagination
- **Indexing**: Database indexes optimize common queries
- **Caching**: Static generation for public pages
- **Image Optimization**: Telegram CDN reduces bandwidth costs

#### Monitoring & Analytics
- **Submission Metrics**: Track AI vs manual review rates
- **Quest Performance**: Monitor completion rates and user engagement
- **System Health**: Database connection pooling and error logging
- **User Analytics**: Leaderboard engagement and retention metrics

#### Security Measures
- **Row Level Security**: Database-level access control
- **API Rate Limiting**: Prevents abuse and ensures fair usage
- **Input Validation**: Comprehensive sanitization on all endpoints
- **Authentication**: Secure session management with NextAuth.js

### Scaling Recommendations

#### Current Capacity (Free Tier)
- **Users**: Up to 1,000 active participants
- **Submissions**: Unlimited via Telegram storage
- **Quests**: Unlimited with efficient pagination
- **AI Processing**: Local processing eliminates API costs

#### Growth Scaling
1. **Database**: Upgrade Supabase plan for increased connections
2. **Compute**: Vercel Pro for enhanced build performance
3. **Caching**: Implement Redis for session and query caching
4. **AI Processing**: Distribute processing across multiple instances
5. **CDN**: Consider dedicated CDN for enhanced global performance

## 🛡️ Security & Compliance

### Data Protection
- **Row Level Security**: Database-level access control on all tables
- **Environment Variables**: Sensitive data stored securely
- **Input Validation**: Comprehensive sanitization on all endpoints
- **Rate Limiting**: API protection against abuse
- **Session Management**: Secure authentication with NextAuth.js

### Privacy Considerations
- **Telegram Integration**: Images stored on Telegram servers (not local storage)
- **User Data**: Minimal data collection with explicit consent
- **Admin Access**: Role-based permissions with audit trails
- **Data Retention**: Configurable submission retention policies

## 🎉 Recent Enhancements (2025)

### Quest Management Improvements
- ✅ **Expiration Date System**: Full lifecycle management for time-limited quests
- ✅ **Advanced Sorting**: Sort by expiration date, creation date, points, title, and category
- ✅ **Visual Indicators**: Color-coded quest cards showing expiration status
- ✅ **Automatic Status Management**: Database triggers for expired quest handling

### Admin Interface Overhaul
- ✅ **Unified Submission Filtering**: Combined AI and manual review workflows
- ✅ **Custom Dropdown Components**: Consistent cross-platform interface elements
- ✅ **Responsive Layout Fixes**: Perfect alignment across desktop and mobile
- ✅ **Enhanced Quest Organization**: Multi-dimensional filtering and sorting

### User Experience Enhancements
- ✅ **Simplified Status Labels**: Removed technical "AI" terminology for participants
- ✅ **Mobile-First Design**: Touch-friendly interfaces for all screen sizes
- ✅ **Intuitive Navigation**: Clear visual hierarchy and consistent interactions
- ✅ **Performance Optimization**: Efficient pagination and query optimization

### Technical Infrastructure
- ✅ **Database Migration System**: Structured schema evolution with rollback support
- ✅ **API Endpoint Improvements**: Full support for quest expiration in all CRUD operations
- ✅ **Type Safety Enhancements**: Extended TypeScript coverage for all new features
- ✅ **Component Architecture**: Reusable UI components with consistent styling

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

For technical support or feature requests:
- Create an issue in the repository
- Review existing documentation in `/docs` folder
- Check migration files for database setup guidance

---

**PGPals** - Transforming residence life through gamified engagement and community building.