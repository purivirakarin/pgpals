import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/email';
import { validateRequestBody, patterns, sanitizers } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequestBody(body, {
      email: {
        required: true,
        pattern: patterns.email,
        sanitizer: (value: string) => sanitizers.toLowerCase(sanitizers.trim(value))
      }
    });
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Please enter a valid email address (e.g., eXXXXXXX@u.nus.edu)', 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const { email } = validation.data!;
    
    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      // Don't reveal if email exists or not for security (prevents email enumeration)
      // But provide a more helpful message to legitimate users
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists in our system, a password reset code has been sent. Please check your email (including spam folder).'
      });
    }
    
    // Generate password reset token using database function
    const { data: tokenResult, error: tokenError } = await supabaseAdmin
      .rpc('create_password_reset_token', {
        p_user_id: user.id,
        p_email: email
      });
    
    if (tokenError || !tokenResult || tokenResult.length === 0) {
      console.error('Failed to create password reset token:', tokenError);
      return NextResponse.json({
        error: 'Failed to generate reset code. Please try again.'
      }, { status: 500 });
    }
    
    const token = tokenResult[0];
    const otpCode = token.token;
    const expiresAt = new Date(token.expires_at);
    const expiresInMinutes = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60));
    
    // Send OTP email
    try {
      const emailResult = await sendPasswordResetEmail(
        email,
        user.name,
        otpCode,
        expiresInMinutes
      );
      
      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
        return NextResponse.json({
          error: 'Failed to send reset code. Please try again.'
        }, { status: 500 });
      }
      
      console.log(`Password reset code sent to ${email} (Message ID: ${emailResult.messageId})`);
      
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json({
        error: 'Failed to send reset code. Please try again.'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password reset code sent to your email address.',
      expiresIn: expiresInMinutes
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({
      error: 'Internal server error. Please try again.'
    }, { status: 500 });
  }
}