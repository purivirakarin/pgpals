import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { validateRequestBody, patterns, sanitizers } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validation = validateRequestBody(body, {
      telegram_id: {
        required: true,
        pattern: patterns.telegramId,
        sanitizer: sanitizers.trim
      },
      telegram_username: {
        required: false,
        pattern: patterns.telegramUsername,
        sanitizer: sanitizers.trim
      }
    });
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const { telegram_id, telegram_username } = validation.data!;

    // Check if this Telegram account is already linked to another user
    const { data: existingLink } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('telegram_id', telegram_id.toString())
      .single();

    if (existingLink && existingLink.id !== session.user.id) {
      return NextResponse.json({ 
        error: 'This Telegram account is already linked to another user' 
      }, { status: 400 });
    }

    // Update the user's Telegram information
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        telegram_id: telegram_id.toString(),
        telegram_username: telegram_username || null
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to link Telegram account:', error);
      return NextResponse.json({ error: 'Failed to link Telegram account' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram account linked successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Telegram linking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove Telegram linking
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        telegram_id: null,
        telegram_username: null
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to unlink Telegram account:', error);
      return NextResponse.json({ error: 'Failed to unlink Telegram account' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram account unlinked successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Telegram unlinking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}