# 🤖 PGPals Bingo - Telegram Mini App Setup Guide

This guide will help you deploy and configure the PGPals Bingo app as a Telegram Mini App.

## 📋 Prerequisites

- A Telegram account
- Access to [@BotFather](https://t.me/botfather) on Telegram
- A hosting service (Vercel, Netlify, etc.)
- Domain name (required for Telegram Mini Apps)

## 🚀 Step 1: Deploy Your App

### Option A: Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set custom domain (required for Telegram)
vercel domains add yourdomain.com
```

### Option B: Deploy to Netlify
```bash
# Build the app
npm run build

# Deploy to Netlify
# Upload the .next folder to Netlify
```

**Important:** Your app MUST be served over HTTPS with a valid SSL certificate.

## 🤖 Step 2: Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Choose a name: `PGPals Bingo`
4. Choose a username: `pgpals_bingo_bot` (must end with 'bot')
5. Save the bot token - you'll need it later

## 🌐 Step 3: Configure Mini App

### Set Mini App URL
Send this command to @BotFather:
```
/newapp
```

Then select your bot and provide:
- **App Name:** `PGPals Bingo`
- **Description:** `Prince George's Park Pair Activities - A fun bingo game for PGP residents`
- **Photo:** Upload the PGPals logo
- **Web App URL:** `https://yourdomain.com`

### Set Bot Commands (Optional)
```
/setcommands
```

Add these commands:
```
start - Start playing PGPals Bingo
help - Get help and instructions
leaderboard - View current leaderboard
```

## ⚙️ Step 4: Configure Bot Settings

### Set Bot Description
```
/setdescription
```
```
🎮 PGPals Bingo - The official bingo game for Prince George's Park residents!

Complete fun activities with your partner, earn points, and climb the leaderboard. Features:
• Cross-device progress sync
• Achievement system  
• Partner activities tracking
• Leaderboard competition

Join the fun and strengthen your PGP community bonds! 🏆
```

### Set About Text
```
/setabouttext
```
```
Official PGPals Bingo game for Prince George's Park residents. Complete activities, earn achievements, and have fun with your partner!
```

### Set Bot Picture
```
/setuserpic
```
Upload the PGPals logo as the bot profile picture.

## 🔧 Step 5: Test Your Mini App

1. Open your bot in Telegram
2. Send `/start` command
3. Tap the "Open App" button or send the web app

## 📱 Step 6: Features Verification

### Test these Telegram Mini App features:

✅ **App Loading**
- App opens in Telegram interface
- Proper loading and initialization

✅ **User Integration**  
- User's Telegram name appears in profile
- Theme matches Telegram's light/dark mode

✅ **Haptic Feedback**
- Vibration on tile clicks (mobile only)
- Success feedback on achievements

✅ **Cloud Storage**
- Progress syncs across devices
- Data persists between sessions
- Fallback to localStorage on older versions

✅ **Native Features**
- Achievement popups use Telegram alerts
- Proper app closing behavior
- Theme integration

## 🎯 Step 7: Advanced Configuration

### Custom Domain Setup
```bash
# If using custom domain, update these files:
# 1. Update bot web app URL in @BotFather
# 2. Ensure SSL certificate is valid
# 3. Test HTTPS access
```

### Analytics Setup (Optional)
```javascript
// Add to app/layout.tsx for tracking
{process.env.NODE_ENV === 'production' && (
  <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
)}
```

## 🛡️ Security Best Practices

1. **Validate Init Data**
   ```javascript
   // Add server-side validation of Telegram init data
   // See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
   ```

2. **Environment Variables**
   ```bash
   # Set in your hosting platform
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

3. **Rate Limiting**
   - Implement rate limiting for API calls
   - Monitor for unusual activity patterns

## 📊 Monitoring & Analytics

### Key Metrics to Track:
- Daily active users
- Game completion rates
- Most popular activities
- User retention
- Cross-device usage

### Telegram-Specific Metrics:
- Mini App launch rate
- Cloud storage usage
- Platform distribution (iOS/Android/Desktop)

## 🐛 Troubleshooting

### Common Issues:

**App won't load in Telegram:**
- Check HTTPS certificate validity
- Verify domain is accessible
- Check console for JavaScript errors

**Cloud storage not working:**
- Check Telegram version (requires 6.1+)
- Verify localStorage fallback is working
- Check network connectivity

**Haptic feedback not working:**
- Only works on mobile Telegram apps
- Check device haptic settings
- Verify Telegram permissions

**Theme not adapting:**
- Check Telegram theme detection
- Verify CSS custom properties
- Test in both light/dark modes

## 🎉 Launch Checklist

- [ ] Bot created and configured
- [ ] Mini App URL set in @BotFather
- [ ] HTTPS domain with valid SSL
- [ ] App loads correctly in Telegram
- [ ] User data syncs across devices
- [ ] Haptic feedback works on mobile
- [ ] Themes adapt to Telegram settings
- [ ] Error handling works properly
- [ ] Performance is optimized
- [ ] Analytics tracking setup

## 📞 Support

For issues with:
- **Telegram Mini Apps:** [Telegram Bot Support](https://t.me/BotSupport)
- **App Development:** Check the GitHub repository issues
- **PGPals Community:** Contact PGP administrators

## 🔗 Useful Links

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Mini App Examples](https://github.com/twa-dev/MainButton)

---

🎮 **Your PGPals Bingo Telegram Mini App is now ready!** 🎮

Share your bot with the PGP community and start building those partnership bonds! 🏆