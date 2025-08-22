import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testGmailConnection, sendEmail, validateEmailConfig } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admins to test email configuration
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { testType, recipientEmail } = await request.json();
    
    if (testType === 'config') {
      // Test configuration
      const validation = validateEmailConfig();
      
      return NextResponse.json({
        success: validation.isValid,
        message: validation.isValid ? 'Configuration is valid' : 'Configuration has errors',
        errors: validation.errors,
        config: {
          provider: 'gmail-app-password',
          fromEmail: process.env.GMAIL_USER || 'noreply@pgpals.app',
          fromName: process.env.EMAIL_FROM_NAME || 'PGPals',
          hasGmailAppPassword: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
        }
      });
    }
    
    if (testType === 'connection') {
      // Test Gmail connection
      try {
        const result = await testGmailConnection();
        
        return NextResponse.json({
          success: result.success,
          message: result.success 
            ? 'Gmail connection successful!' 
            : `Gmail connection failed: ${result.error}`,
          error: result.error
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: 'Connection test failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    if (testType === 'basic' || testType === 'send') {
      // Test sending an actual email
      const recipient = recipientEmail || session.user.email;
      
      if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
        return NextResponse.json({
          success: false,
          error: 'Valid recipient email is required for send test'
        }, { status: 400 });
      }
      
      try {
        const result = await sendEmail({
          to: recipient,
          subject: '🧪 PGPals Email Test',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3B82F6;">🎮 PGPals Email Test</h2>
              <p>This is a test email from your PGPals application.</p>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li>Sent at: ${new Date().toISOString()}</li>
                <li>Sent by: ${session.user.name} (${session.user.email})</li>
                <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
              </ul>
              <p>If you received this email, your Gmail OAuth2 configuration is working correctly!</p>
              <hr style="margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">
                This email was sent as a test from the PGPals admin panel.
              </p>
            </div>
          `,
          text: `
            PGPals Email Test
            
            This is a test email from your PGPals application.
            
            Test Details:
            - Sent at: ${new Date().toISOString()}
            - Sent by: ${session.user.name} (${session.user.email})
            - Provider: Gmail OAuth2
            
            If you received this email, your Gmail OAuth2 configuration is working correctly!
          `
        });
        
        return NextResponse.json({
          success: result.success,
          message: result.success 
            ? `Test email sent successfully to ${recipientEmail}!` 
            : `Failed to send test email: ${result.error}`,
          messageId: result.messageId,
          error: result.error
        });
      } catch (error) {
        console.error('Test email error:', error);
        return NextResponse.json({
          success: false,
          message: 'Failed to send test email',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      error: 'Invalid test type. Use "connection" or "send"'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Email test API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admins to view email configuration
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Return current email configuration (without sensitive data)
    const provider = 'gmail-app-password';
    const fromEmail = process.env.GMAIL_USER || 'noreply@pgpals.app';
    const fromName = process.env.EMAIL_FROM_NAME || 'PGPals';
    
    const config = {
      provider,
      fromEmail,
      fromName,
      isConfigured: false
    };
    
    const hasUser = !!process.env.GMAIL_USER;
    const hasAppPassword = !!process.env.GMAIL_APP_PASSWORD;
    
    config.isConfigured = hasUser && hasAppPassword;
    
    return NextResponse.json({
      ...config,
      gmail: {
        hasUser,
        hasAppPassword,
        userPreview: hasUser 
          ? `${process.env.GMAIL_USER?.substring(0, 10)}...` 
          : null
      }
    });
    
  } catch (error) {
    console.error('Email config API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}