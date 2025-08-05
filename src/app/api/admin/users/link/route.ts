import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { sourceUserId, targetUserId } = await request.json();

    if (!sourceUserId || !targetUserId) {
      return NextResponse.json({ error: 'Source and target user IDs are required' }, { status: 400 });
    }

    if (sourceUserId === targetUserId) {
      return NextResponse.json({ error: 'Cannot link user to themselves' }, { status: 400 });
    }

    // Verify both users exist and check if they already have partners
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, partner_id')
      .in('id', [sourceUserId, targetUserId]);

    if (!users || users.length !== 2) {
      return NextResponse.json({ error: 'One or both users not found' }, { status: 404 });
    }

    const sourceUser = users.find(u => u.id === sourceUserId);
    const targetUser = users.find(u => u.id === targetUserId);

    // Check if either user already has a partner
    if (sourceUser?.partner_id || targetUser?.partner_id) {
      return NextResponse.json({ error: 'One or both users already have a partner' }, { status: 400 });
    }

    // Create partnership - both users point to each other
    const { error: sourceError } = await supabaseAdmin
      .from('users')
      .update({ partner_id: targetUserId, updated_at: new Date().toISOString() })
      .eq('id', sourceUserId);

    if (sourceError) {
      console.error('Error linking source user:', sourceError);
      return NextResponse.json({ error: 'Failed to link source user' }, { status: 500 });
    }

    const { error: targetError } = await supabaseAdmin
      .from('users')
      .update({ partner_id: sourceUserId, updated_at: new Date().toISOString() })
      .eq('id', targetUserId);

    if (targetError) {
      console.error('Error linking target user:', targetError);
      // Rollback source user update
      await supabaseAdmin
        .from('users')
        .update({ partner_id: null })
        .eq('id', sourceUserId);
      return NextResponse.json({ error: 'Failed to link target user' }, { status: 500 });
    }

    // Log the admin action for both users
    await supabaseAdmin
      .from('activities')
      .insert([
        {
          user_id: sourceUserId,
          activity_type: 'partnership_created',
          description: `Partnered with ${targetUser?.name}`,
          created_by: session.user.id,
          created_at: new Date().toISOString()
        },
        {
          user_id: targetUserId,
          activity_type: 'partnership_created',
          description: `Partnered with ${sourceUser?.name}`,
          created_by: session.user.id,
          created_at: new Date().toISOString()
        }
      ]);

    return NextResponse.json({ 
      message: `Successfully linked ${sourceUser?.name} and ${targetUser?.name} as partners`,
      success: true 
    });

  } catch (error) {
    console.error('Error linking users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add unlink functionality
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user and their partner
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, partner_id')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.partner_id) {
      return NextResponse.json({ error: 'User has no partner to unlink' }, { status: 400 });
    }

    const { data: partner } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('id', user.partner_id)
      .single();

    // Remove partnership from both users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ partner_id: null, updated_at: new Date().toISOString() })
      .eq('id', userId);

    const { error: partnerError } = await supabaseAdmin
      .from('users')
      .update({ partner_id: null, updated_at: new Date().toISOString() })
      .eq('id', user.partner_id);

    if (userError || partnerError) {
      console.error('Error unlinking users:', userError || partnerError);
      return NextResponse.json({ error: 'Failed to unlink users' }, { status: 500 });
    }

    // Log the admin action
    await supabaseAdmin
      .from('activities')
      .insert([
        {
          user_id: userId,
          activity_type: 'partnership_removed',
          description: `Partnership with ${partner?.name} was removed by admin`,
          created_by: session.user.id,
          created_at: new Date().toISOString()
        },
        {
          user_id: user.partner_id,
          activity_type: 'partnership_removed',
          description: `Partnership with ${user.name} was removed by admin`,
          created_by: session.user.id,
          created_at: new Date().toISOString()
        }
      ]);

    return NextResponse.json({ 
      message: `Successfully unlinked ${user.name} and ${partner?.name}`,
      success: true 
    });

  } catch (error) {
    console.error('Error unlinking users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
