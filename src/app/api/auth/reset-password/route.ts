import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateRequestBody, patterns, sanitizers } from '@/lib/validation';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequestBody(body, {
      email: {
        required: true,
        pattern: patterns.email,
        sanitizer: (value: string) => sanitizers.toLowerCase(sanitizers.trim(value))
      },
      token: {
        required: true,
        minLength: 6,
        maxLength: 6,
        pattern: /^\d{6}$/,
        sanitizer: sanitizers.trim
      },
      newPassword: {
        required: true,
        minLength: 8,
        maxLength: 128,
        pattern: patterns.strongPassword
      }
    });
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const { email, token, newPassword } = validation.data!;
    
    // Verify the password reset token using database function
    const { data: verificationResult, error: verificationError } = await supabaseAdmin
      .rpc('verify_password_reset_token', {
        p_email: email,
        p_token: token
      });
    
    if (verificationError || !verificationResult || verificationResult.length === 0) {
      console.error('Token verification error:', verificationError);
      return NextResponse.json({
        error: 'Invalid or expired reset code.'
      }, { status: 400 });
    }
    
    const verification = verificationResult[0];
    
    if (!verification.is_valid) {
      return NextResponse.json({
        error: verification.error_message || 'Invalid reset code.'
      }, { status: 400 });
    }
    
    const userId = verification.user_id;
    
    // Hash the new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json({
        error: 'Failed to update password. Please try again.'
      }, { status: 500 });
    }
    
    // Log the password reset activity
    try {
      await supabaseAdmin
        .from('activities')
        .insert({
          user_id: userId,
          type: 'password_reset',
          description: 'Password was reset using email verification',
          metadata: { email, method: 'otp' },
          created_by: userId,
          created_at: new Date().toISOString()
        });
    } catch (activityError) {
      console.error('Failed to log password reset activity:', activityError);
      // Don't fail the request for activity logging errors
    }
    
    console.log(`Password reset successful for user ${userId} (${email})`);
    
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({
      error: 'Internal server error. Please try again.'
    }, { status: 500 });
  }
}