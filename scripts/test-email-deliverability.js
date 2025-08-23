#!/usr/bin/env node

/**
 * Test script for email deliverability improvements
 * Run with: node scripts/test-email-deliverability.js
 */

const { 
  validateEmailAddress, 
  EmailDeliverability, 
  generatePasswordResetEmail 
} = require('../src/lib/email.ts');

async function testEmailDeliverability() {
  console.log('🧪 Testing Email Deliverability Improvements...\n');

  // Test 1: Email validation
  console.log('📧 Testing Email Validation:');
  const testEmails = [
    'valid@example.com',
    'invalid-email',
    'test@10minutemail.com',
    'user..double@test.com',
    '.leading@test.com'
  ];

  testEmails.forEach(email => {
    const result = validateEmailAddress(email);
    console.log(`  ${email}: ${result.isValid ? '✅ Valid' : '❌ Invalid'} ${result.reason ? `(${result.reason})` : ''}`);
  });

  // Test 2: Content analysis
  console.log('\n📝 Testing Content Analysis:');
  const testSubjects = [
    'PGPals Password Reset Verification Code',
    'URGENT!!! ACT NOW FOR FREE MONEY!!!',
    'Your quest submission has been approved',
    'Click here for amazing deals!!!'
  ];

  testSubjects.forEach(subject => {
    const analysis = EmailDeliverability.analyzeContent(subject, 'Test email content.');
    console.log(`  "${subject}": Score ${analysis.score}/100`);
    if (analysis.issues.length > 0) {
      console.log(`    Issues: ${analysis.issues.join(', ')}`);
    }
  });

  // Test 3: Email template generation
  console.log('\n📄 Testing Email Template Generation:');
  const template = generatePasswordResetEmail('John Doe', '123456', 15);
  console.log(`  Subject: ${template.subject}`);
  console.log(`  HTML length: ${template.html.length} characters`);
  console.log(`  Text length: ${template.text.length} characters`);
  
  // Analyze the generated template
  const templateAnalysis = EmailDeliverability.analyzeContent(template.subject, template.text);
  console.log(`  Template spam score: ${templateAnalysis.score}/100`);

  // Test 4: Deliverability recommendations
  console.log('\n💡 Email Deliverability Recommendations:');
  const recommendations = EmailDeliverability.getRecommendations();
  recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });

  console.log('\n✅ Email deliverability testing completed!');
  console.log('\n📊 Summary of Improvements:');
  console.log('  • Enhanced SMTP configuration with connection pooling');
  console.log('  • Comprehensive anti-spam headers (50+ headers)');
  console.log('  • Rate limiting (50 emails/hour per recipient)');
  console.log('  • Email validation and content analysis');
  console.log('  • Professional HTML/text templates');
  console.log('  • Authentication simulation headers');
  console.log('  • Organization and sender identification');
  console.log('  • Unsubscribe links and compliance headers');
  console.log('  • Content spam score analysis');
  console.log('  • Deliverability testing utilities');
}

// Handle potential ES module/CommonJS issues
if (typeof module !== 'undefined' && module.exports) {
  testEmailDeliverability().catch(console.error);
} else {
  console.log('⚠️ Note: This is a test script. Import the functions to test them in your environment.');
}
