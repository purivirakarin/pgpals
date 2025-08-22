#!/usr/bin/env node

/**
 * Test Gmail App Password connection in detail
 */

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testGmailAppPassword() {
  console.log('🧪 Gmail App Password Detailed Test\n');
  
  const config = {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
    fromEmail: process.env.GMAIL_USER,
    fromName: process.env.EMAIL_FROM_NAME || 'PGPals'
  };
  
  console.log('1️⃣ Checking Configuration...');
  console.log(`   User: ${config.user}`);
  console.log(`   Password: ${config.pass ? '***provided***' : '❌ MISSING'}`);
  console.log(`   From Email: ${config.fromEmail}`);
  console.log(`   From Name: ${config.fromName}`);
  
  if (!config.user) {
    console.log('❌ Gmail user is required. Set GMAIL_USER in .env.local');
    return;
  }
  
  if (!config.pass) {
    console.log('❌ Gmail app password is required. Set GMAIL_APP_PASSWORD in .env.local');
    console.log('   Generate one at: https://myaccount.google.com/apppasswords');
    return;
  }
  
  console.log('\n2️⃣ Creating Gmail Transporter...');
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    
    console.log('✅ Transporter created successfully');
    
    console.log('\n3️⃣ Testing SMTP Connection...');
    
    const verified = await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    console.log('\n4️⃣ Sending Test Email...');
    
    const testEmail = {
      from: `${config.fromName} <${config.fromEmail}>`,
      to: config.fromEmail, // Send to yourself for testing
      subject: 'PGPals Gmail App Password Test',
      html: `
        <h2>🎉 Gmail App Password Test Successful!</h2>
        <p>This email confirms that your Gmail App Password configuration is working correctly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Provider: gmail-app-password</li>
          <li>User: ${config.user}</li>
          <li>Time: ${new Date().toISOString()}</li>
        </ul>
        <p>Your PGPals application can now send emails successfully! 🚀</p>
      `,
      text: `
        Gmail App Password Test Successful!
        
        This email confirms that your Gmail App Password configuration is working correctly.
        
        Test Details:
        - Provider: gmail-app-password
        - User: ${config.user}
        - Time: ${new Date().toISOString()}
        
        Your PGPals application can now send emails successfully!
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}`);
    
    console.log('\n🎉 All Tests Passed!');
    console.log('=====================================');
    console.log('Your Gmail App Password configuration is working perfectly.');
    console.log('PGPals can now send emails using Gmail.');
    console.log('\nNext steps:');
    console.log('1. Check your Gmail inbox for the test email');
    console.log('2. Try the password reset feature in your app');
    console.log('3. Your configuration is ready - no additional setup needed!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication Failed:');
      console.log('   - Check that your Gmail user email is correct');
      console.log('   - Verify your app password is correct (16 characters)');
      console.log('   - Make sure 2-Factor Authentication is enabled on your Gmail');
      console.log('   - Generate a new app password at: https://myaccount.google.com/apppasswords');
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection Failed:');
      console.log('   - Check your internet connection');
      console.log('   - Make sure Gmail SMTP is not blocked by firewall');
    }
    
    console.log('\n📞 Need help?');
    console.log('   - Gmail App Passwords: https://support.google.com/accounts/answer/185833');
    console.log('   - 2-Factor Auth: https://support.google.com/accounts/answer/185839');
  }
}

testGmailAppPassword().catch(console.error);
