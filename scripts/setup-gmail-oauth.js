#!/usr/bin/env node

/**
 * Gmail OAuth2 Setup Script for PGPals
 * This script helps you set up Gmail OAuth2 for sending emails
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Configuration
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly'
];
const REDIRECT_URL = 'https://developers.google.com/oauthplayground';

/**
 * Load credentials from Google Cloud JSON file
 */
function loadCredentials(credentialsPath) {
  try {
    const credentialsFile = fs.readFileSync(credentialsPath, 'utf8');
    const credentials = JSON.parse(credentialsFile);
    
    // Handle both installed app and web app credential formats
    const clientInfo = credentials.installed || credentials.web;
    
    if (!clientInfo) {
      throw new Error('Invalid credentials file format');
    }
    
    return {
      clientId: clientInfo.client_id,
      clientSecret: clientInfo.client_secret,
      redirectUris: clientInfo.redirect_uris || [REDIRECT_URL]
    };
  } catch (error) {
    console.error('❌ Error loading credentials:', error.message);
    process.exit(1);
  }
}

/**
 * Generate authorization URL
 */
function generateAuthUrl(credentials) {
  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    REDIRECT_URL
  );
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    response_type: 'code',
    prompt: 'consent', // Force consent to get refresh token
    include_granted_scopes: true
  });
  
  return { oauth2Client, authUrl };
}

/**
 * Exchange authorization code for tokens
 */
async function getTokens(oauth2Client, authCode) {
  try {
    const { tokens } = await oauth2Client.getToken(authCode);
    return tokens;
  } catch (error) {
    console.error('❌ Error getting tokens:', error.message);
    process.exit(1);
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('🎮 PGPals Gmail OAuth2 Setup\n');
  
  // Get credentials file path
  const args = process.argv.slice(2);
  let credentialsPath = args[0];
  
  if (!credentialsPath) {
    // Look for the file you mentioned
    const defaultPath = path.join(process.cwd(), 'client_secret_2_953018339287-bp5r3cr4enj99cbhjh1s3b3mm234qp41.apps.googleusercontent.com.json');
    if (fs.existsSync(defaultPath)) {
      credentialsPath = defaultPath;
      console.log(`📁 Found credentials file: ${path.basename(defaultPath)}`);
    } else {
      console.error('❌ Please provide the path to your Google Cloud credentials JSON file');
      console.log('Usage: node setup-gmail-oauth.js <path-to-credentials.json>');
      process.exit(1);
    }
  }
  
  if (!fs.existsSync(credentialsPath)) {
    console.error(`❌ Credentials file not found: ${credentialsPath}`);
    process.exit(1);
  }
  
  // Load credentials
  console.log('📋 Loading credentials...');
  const credentials = loadCredentials(credentialsPath);
  console.log(`✅ Client ID: ${credentials.clientId.substring(0, 20)}...`);
  
  // Generate authorization URL
  console.log('🔗 Generating authorization URL...');
  const { oauth2Client, authUrl } = generateAuthUrl(credentials);
  
  console.log('\n📧 Gmail OAuth2 Setup Instructions:');
  console.log('=====================================');
  console.log('1. FIRST: Enable Gmail API in Google Cloud Console:');
  console.log('   https://console.cloud.google.com/apis/library/gmail.googleapis.com');
  console.log('\n2. Open this URL in your browser:');
  console.log(`   ${authUrl}`);
  console.log('\n3. Sign in with the Gmail account you want to use for sending emails');
  console.log('4. Grant the requested permissions (Gmail Send & Read)');
  console.log('5. Copy the authorization code from the browser');
  console.log('6. Run this script again with the code:');
  console.log(`   node setup-gmail-oauth.js "${credentialsPath}" "<authorization-code>"`);
  
  // If authorization code is provided
  const authCode = args[1];
  if (authCode) {
    console.log('\n🔄 Exchanging authorization code for tokens...');
    const tokens = await getTokens(oauth2Client, authCode);
    
    if (!tokens.refresh_token) {
      console.error('❌ No refresh token received. Please ensure you:');
      console.log('   - Used the exact URL provided above');
      console.log('   - Granted all requested permissions');
      console.log('   - This is the first time authorizing this app');
      process.exit(1);
    }
    
    console.log('✅ Tokens received successfully!');
    
    // Display environment variables
    console.log('\n🔧 Environment Variables for .env.local:');
    console.log('==========================================');
    console.log(`EMAIL_PROVIDER=gmail`);
    console.log(`GMAIL_CLIENT_ID=${credentials.clientId}`);
    console.log(`GMAIL_CLIENT_SECRET=${credentials.clientSecret}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`EMAIL_FROM=your-gmail@gmail.com`);
    console.log(`EMAIL_FROM_NAME=PGPals`);
    
    console.log('\n📝 Next Steps:');
    console.log('==============');
    console.log('1. Copy the environment variables above to your .env.local file');
    console.log('2. Replace "your-gmail@gmail.com" with the actual Gmail address you authorized');
    console.log('3. Test the email configuration by using the forgot password feature');
    console.log('\n✅ Gmail OAuth2 setup complete!');
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