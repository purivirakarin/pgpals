/**
 * Email utilities for PGPals
 * Handles sending password reset OTP codes and other notifications using Gmail App Passwords
 */

import nodemailer from 'nodemailer';

export interface EmailConfig {
  provider: 'gmail-app-password' | 'console'; // Simplified - only App Password and console
  gmailAppPassword?: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailError extends Error {
  constructor(message: string, public provider: string) {
    super(`Email Error (${provider}): ${message}`);
    this.name = 'EmailError';
  }
}

/**
 * Get email configuration from environment variables
 */
function getEmailConfig(): EmailConfig {
  // Since we're using Gmail App Password exclusively, default to that
  const provider = 'gmail-app-password' as EmailConfig['provider'];
  
  return {
    provider,
    gmailAppPassword: {
      user: process.env.GMAIL_USER || '',
      pass: process.env.GMAIL_APP_PASSWORD || '',
    },
    fromEmail: process.env.GMAIL_USER || 'noreply@pgpals.app',
    fromName: process.env.EMAIL_FROM_NAME || 'PGPals',
  };
}

/**
 * Create Gmail App Password transporter
 */

/**
 * Create Gmail App Password transporter
 */
async function createGmailAppPasswordTransporter(config: EmailConfig): Promise<nodemailer.Transporter> {
  if (!config.gmailAppPassword) {
    throw new EmailError('Gmail App Password configuration is required', 'gmail-app-password');
  }

  const { user, pass } = config.gmailAppPassword;
  
  if (!user || !pass) {
    throw new EmailError('Gmail user and app password are required', 'gmail-app-password');
  }
  
  try {
    // Create transporter with App Password authentication
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });
    
    return transporter;
  } catch (error) {
    throw new EmailError(
      `Failed to create Gmail App Password transporter: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'gmail-app-password'
    );
  }
}

/**
 * Send email using Gmail + App Password
 */
async function sendEmailWithGmailAppPassword(
  request: SendEmailRequest,
  config: EmailConfig
): Promise<SendEmailResponse> {
  try {
    const transporter = await createGmailAppPasswordTransporter(config);
    
    const mailOptions = {
      from: `${config.fromName} <${config.fromEmail}>`,
      to: request.to,
      subject: request.subject,
      html: request.html,
      text: request.text,
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    if (error instanceof EmailError) throw error;
    throw new EmailError(
      error instanceof Error ? error.message : 'Unknown error',
      'gmail-app-password'
    );
  }
}

/**
 * Console logging for development
 */
async function sendEmailWithConsole(
  request: SendEmailRequest,
  config: EmailConfig
): Promise<SendEmailResponse> {
  console.log('\n📧 Email would be sent:');
  console.log(`From: ${config.fromName} <${config.fromEmail}>`);
  console.log(`To: ${request.to}`);
  console.log(`Subject: ${request.subject}`);
  console.log('HTML Content:');
  console.log(request.html);
  if (request.text) {
    console.log('Text Content:');
    console.log(request.text);
  }
  console.log('---');

  return {
    success: true,
    messageId: `dev-${Date.now()}`,
  };
}

/**
 * Main email sending function
 */
export async function sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  const config = getEmailConfig();

  try {
    switch (config.provider) {
      case 'gmail-app-password':
        return await sendEmailWithGmailAppPassword(request, config);
      case 'console':
        return await sendEmailWithConsole(request, config);
      default:
        throw new EmailError(`Unsupported email provider: ${config.provider}`, 'unknown');
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    
    // In development, fall back to console logging
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falling back to console logging in development...');
      return await sendEmailWithConsole(request, config);
    }
    
    throw error;
  }
}

/**
 * Generate password reset email template
 */
export function generatePasswordResetEmail(
  name: string,
  otpCode: string,
  expiresIn: number = 15
): EmailTemplate {
  const subject = 'Your PGPals Password Reset Code';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - PGPals</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #3B82F6; }
            .otp-box { background: #F3F4F6; border: 2px solid #E5E7EB; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1F2937; font-family: 'Courier New', monospace; }
            .warning { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 6px; padding: 15px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px; text-align: center; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🎮 PGPals</div>
            <h1>Password Reset Request</h1>
        </div>
        
        <p>Hello ${name},</p>
        
        <p>We received a request to reset your password for your PGPals account. Use the verification code below to complete your password reset:</p>
        
        <div class="otp-box">
            <div style="font-size: 16px; margin-bottom: 10px; color: #6B7280;">Your verification code:</div>
            <div class="otp-code">${otpCode}</div>
        </div>
        
        <p>Enter this code on the password reset page to set your new password.</p>
        
        <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This code expires in <strong>${expiresIn} minutes</strong></li>
                <li>Only use this code if you requested a password reset</li>
                <li>Never share this code with anyone</li>
            </ul>
        </div>
        
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
        
        <div class="footer">
            <p>This email was sent by PGPals Quest System<br>
            If you have any questions, please contact our support team.</p>
            <p style="margin-top: 20px;">
                <small>PGPals - Making residence life more engaging through gamified quests</small>
            </p>
        </div>
    </body>
    </html>
  `;
  
  const text = `
    PGPals Password Reset
    
    Hello ${name},
    
    We received a request to reset your password for your PGPals account.
    
    Your verification code: ${otpCode}
    
    Enter this code on the password reset page to set your new password.
    
    Important:
    - This code expires in ${expiresIn} minutes
    - Only use this code if you requested a password reset
    - Never share this code with anyone
    
    If you didn't request a password reset, please ignore this email.
    
    Thanks,
    The PGPals Team
  `;

  return { subject, html, text };
}

/**
 * Send password reset OTP email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  otpCode: string,
  expiresIn: number = 15
): Promise<SendEmailResponse> {
  const template = generatePasswordResetEmail(name, otpCode, expiresIn);
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Validate email configuration
 */
export function validateEmailConfig(): { isValid: boolean; errors: string[] } {
  const config = getEmailConfig();
  const errors: string[] = [];

  if (config.provider === 'gmail-app-password') {
    if (!config.gmailAppPassword) {
      errors.push('Gmail App Password configuration is missing');
    } else {
      const { user, pass } = config.gmailAppPassword;
      if (!user) errors.push('Gmail user is required');
      if (!pass) errors.push('Gmail app password is required');
    }
  }

  if (!config.fromEmail) {
    errors.push('From email address is required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (config.fromEmail && !emailRegex.test(config.fromEmail)) {
    errors.push('From email address is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Test Gmail configuration
 */
export async function testGmailConnection(): Promise<{ success: boolean; error?: string }> {
  const config = getEmailConfig();
  
  if (config.provider !== 'gmail-app-password') {
    return { success: false, error: 'Gmail App Password provider not configured' };
  }
  
  try {
    const transporter = await createGmailAppPasswordTransporter(config);
    
    // Verify the connection
    await transporter.verify();
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Validate email configuration on import in production
if (process.env.NODE_ENV === 'production') {
  const validation = validateEmailConfig();
  if (!validation.isValid) {
    console.warn('⚠️ Email configuration issues:', validation.errors);
  }
}