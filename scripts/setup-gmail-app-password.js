#!/usr/bin/env node

/**
 * Gmail App Password Setup Script for PGPals
 * This script helps you set up Gmail App Password for sending emails
 */

const fs = require('fs');
const path = require('path');

/**
 * Main setup function
 */
async function main() {
  console.log('🎮 PGPals Gmail App Password Setup\n');
  
  console.log('📧 Gmail App Password Setup Instructions:');
  console.log('==========================================');
  console.log('');
  console.log('1. 🔐 Enable 2-Factor Authentication on your Gmail account:');
  console.log('   https://myaccount.google.com/security');
  console.log('');
  console.log('2. 📱 Generate an App Password:');
  console.log('   a. Go to: https://myaccount.google.com/apppasswords');
  console.log('   b. Sign in to your Google account');
  console.log('   c. Click "Generate" and create a new app password');
  console.log('   d. Choose "Mail" as the app and "Other" as device');
  console.log('   e. Enter "PGPals" as the device name');
  console.log('   f. Copy the 16-character app password (like: abcd efgh ijkl mnop)');
  console.log('');
  console.log('3. 🔧 Update your .env.local file with these values:');
  console.log('   GMAIL_USER=your-gmail@gmail.com');
  console.log('   GMAIL_APP_PASSWORD=your-16-char-app-password');
  console.log('   EMAIL_FROM_NAME=PGPals');
  console.log('');
  console.log('4. 🧪 Test your configuration:');
  console.log('   node scripts/test-gmail-app-password.js');
  console.log('');
  console.log('✅ Gmail App Password setup complete!');
  console.log('');
  console.log('💡 Benefits of App Passwords vs OAuth2:');
  console.log('   - Much simpler setup (no OAuth flow)');
  console.log('   - More reliable for server applications');
  console.log('   - No token expiration issues');
  console.log('   - Works great for SMTP sending');
  
  // Check if .env.local exists and show current config
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('\n📄 Current .env.local configuration:');
    console.log('=====================================');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    const emailLines = lines.filter(line => 
      line.includes('EMAIL_') || line.includes('GMAIL_')
    );
    
    if (emailLines.length > 0) {
      emailLines.forEach(line => {
        if (line.includes('PASSWORD') || line.includes('SECRET') || line.includes('TOKEN')) {
          const [key] = line.split('=');
          console.log(`${key}=***hidden***`);
        } else {
          console.log(line);
        }
      });
    } else {
      console.log('No email configuration found.');
    }
  }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error.message);
  process.exit(1);
});

// Run the script
main().catch(console.error);
