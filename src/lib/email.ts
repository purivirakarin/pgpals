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
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
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
  const subject = 'PGPals - Password Reset Request';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - PGPals</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #1F2937; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .email-container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center; 
                padding: 40px 30px;
                position: relative;
            }
            .header::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 20px;
                background: white;
                border-radius: 20px 20px 0 0;
            }
            .logo { 
                font-size: 32px; 
                font-weight: 800; 
                margin-bottom: 8px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            .subtitle { 
                font-size: 18px; 
                opacity: 0.9; 
                font-weight: 500;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 24px;
            }
            .description {
                color: #6B7280;
                margin-bottom: 32px;
                font-size: 16px;
            }
            .otp-container { 
                background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
                border: 2px solid #E5E7EB;
                border-radius: 12px; 
                padding: 32px; 
                text-align: center; 
                margin: 32px 0;
                position: relative;
            }
            .otp-label { 
                font-size: 14px; 
                font-weight: 600;
                color: #6B7280;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 16px; 
            }
            .otp-code { 
                font-size: 36px; 
                font-weight: 900; 
                letter-spacing: 12px; 
                color: #1F2937; 
                font-family: 'Courier New', monospace;
                background: white;
                padding: 16px 24px;
                border-radius: 8px;
                border: 2px dashed #9CA3AF;
                display: inline-block;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .instructions {
                background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
                border-left: 4px solid #3B82F6;
                border-radius: 0 8px 8px 0;
                padding: 20px;
                margin: 24px 0;
            }
            .instructions-title {
                font-weight: 600;
                color: #1E40AF;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
            }
            .instructions-text {
                color: #1F2937;
                font-size: 15px;
            }
            .warning { 
                background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
                border: 1px solid #F59E0B; 
                border-radius: 8px; 
                padding: 20px; 
                margin: 24px 0;
                border-left: 4px solid #F59E0B;
            }
            .warning-title {
                font-weight: 700;
                color: #92400E;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                font-size: 16px;
            }
            .warning-list {
                color: #78350F;
                margin: 0;
                padding-left: 20px;
            }
            .warning-list li {
                margin: 8px 0;
                font-size: 14px;
            }
            .security-note {
                background: #F9FAFB;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                padding: 16px;
                margin: 24px 0;
                color: #6B7280;
                font-size: 14px;
                text-align: center;
            }
            .footer { 
                background: #F9FAFB;
                padding: 30px;
                border-top: 1px solid #E5E7EB; 
                color: #6B7280; 
                font-size: 14px; 
                text-align: center;
            }
            .footer-title {
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }
            .footer-tagline {
                font-style: italic;
                color: #9CA3AF;
                margin-top: 16px;
                font-size: 13px;
            }
            .timer-icon {
                display: inline-block;
                margin-right: 8px;
                font-size: 18px;
            }
            .lock-icon {
                display: inline-block;
                margin-right: 8px;
                font-size: 16px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">🎮 PGPals</div>
                <div class="subtitle">Quest-Based Gaming Platform</div>
            </div>
            
            <div class="content">
                <div class="greeting">Hi ${name}! 👋</div>
                
                <div class="description">
                    We received a request to reset your password for your PGPals account. Use the verification code below to complete your password reset and get back to completing quests!
                </div>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otpCode}</div>
                </div>
                
                <div class="instructions">
                    <div class="instructions-title">
                        <span class="lock-icon">🔐</span>
                        Next Steps
                    </div>
                    <div class="instructions-text">
                        Enter this code on the password reset page to set your new password and regain access to your account.
                    </div>
                </div>
                
                <div class="warning">
                    <div class="warning-title">
                        <span class="timer-icon">⏰</span>
                        Important Security Information
                    </div>
                    <ul class="warning-list">
                        <li>This code expires in <strong>${expiresIn} minutes</strong></li>
                        <li>Only use this code if you requested a password reset</li>
                        <li>Never share this code with anyone</li>
                        <li>Our team will never ask for this code</li>
                    </ul>
                </div>
                
                <div class="security-note">
                    If you didn't request a password reset, please ignore this email or contact our support team if you have concerns about your account security.
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-title">PGPals Quest System</div>
                <div>Prince George's Park Residence</div>
                <div style="margin-top: 12px;">
                    Need help? Contact our support team
                </div>
                <div class="footer-tagline">
                    Making residence life more engaging through gamified quests
                </div>
            </div>
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
    PGPals Team
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