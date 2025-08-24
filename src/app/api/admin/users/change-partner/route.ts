import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/admin/users/change-partner - Change a user's partner (handles partner swaps)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, newPartnerId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get current user info
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('id, name, partner_id')
      .eq('id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If newPartnerId is null, we're removing the partnership
    if (newPartnerId === null || newPartnerId === undefined) {
      if (!currentUser.partner_id) {
        return NextResponse.json({ error: 'User has no partner to remove' }, { status: 400 });
      }

      // Get current partner info for logging
      const { data: currentPartner } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .eq('id', currentUser.partner_id)
        .single();

      // Remove partnership (trigger will handle group deactivation)
      const { error: removeError } = await supabaseAdmin
        .from('users')
        .update({ partner_id: null, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (removeError) {
        console.error('Error removing partnership:', removeError);
        return NextResponse.json({ error: 'Failed to remove partnership' }, { status: 500 });
      }

      // Log the admin action
      await supabaseAdmin
        .from('activities')
        .insert({
          user_id: userId,
          activity_type: 'partnership_removed',
          description: `Partnership with ${currentPartner?.name || 'unknown'} was removed by admin`,
          created_by: session.user.id,
          created_at: new Date().toISOString()
        });

      return NextResponse.json({ 
        message: `Successfully removed partnership between ${currentUser.name} and ${currentPartner?.name || 'unknown'}`,
        success: true 
      });
    }

    // Verify new partner exists
    const { data: newPartner } = await supabaseAdmin
      .from('users')
      .select('id, name, partner_id')
      .eq('id', newPartnerId)
      .single();

    if (!newPartner) {
      return NextResponse.json({ error: 'New partner not found' }, { status: 404 });
    }

    if (newPartner.id === userId) {
      return NextResponse.json({ error: 'Cannot link user to themselves' }, { status: 400 });
    }

    // Get current partner info for logging (if exists)
    let currentPartner = null;
    if (currentUser.partner_id) {
      const { data: partner } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .eq('id', currentUser.partner_id)
        .single();
      currentPartner = partner;
    }

    // Check if new partner already has a different partner
    if (newPartner.partner_id && newPartner.partner_id !== userId) {
      return NextResponse.json({ 
        error: `New partner ${newPartner.name} is already partnered with someone else. Use force-change if you want to break existing partnerships.`,
        partnerId: newPartner.partner_id
      }, { status: 400 });
    }

    // Update the partnership (trigger will handle old group deactivation and new group creation)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ partner_id: newPartnerId, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Error changing partnership:', updateError);
      return NextResponse.json({ error: 'Failed to change partnership' }, { status: 500 });
    }

    // Log the admin action
    const activityDescription = currentPartner 
      ? `Partnership changed from ${currentPartner.name} to ${newPartner.name} by admin`
      : `Partnership created with ${newPartner.name} by admin`;

    await supabaseAdmin
      .from('activities')
      .insert([
        {
          user_id: userId,
          activity_type: currentPartner ? 'partnership_changed' : 'partnership_created',
          description: activityDescription,
          created_by: session.user.id,
          created_at: new Date().toISOString()
        }
      ]);

    const successMessage = currentPartner
      ? `Successfully changed ${currentUser.name}'s partnership from ${currentPartner.name} to ${newPartner.name}`
      : `Successfully created partnership between ${currentUser.name} and ${newPartner.name}`;

    return NextResponse.json({ 
      message: successMessage,
      success: true,
      oldPartner: currentPartner,
      newPartner: newPartner
    });

  } catch (error) {
    console.error('Error in change-partner API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/users/change-partner/force - Force change partnerships (breaks existing ones)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, newPartnerId } = await request.json();

    if (!userId || !newPartnerId) {
      return NextResponse.json({ error: 'Both user ID and new partner ID are required' }, { status: 400 });
    }

    if (userId === newPartnerId) {
      return NextResponse.json({ error: 'Cannot link user to themselves' }, { status: 400 });
    }

    // Get both users info
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, partner_id')
      .in('id', [userId, newPartnerId]);

    if (!users || users.length !== 2) {
      return NextResponse.json({ error: 'One or both users not found' }, { status: 404 });
    }

    const user = users.find(u => u.id === userId)!;
    const newPartner = users.find(u => u.id === newPartnerId)!;

    // Collect info about partnerships that will be broken
    const partnerships_to_break = [];
    
    if (user.partner_id) {
      const { data: oldPartner } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', user.partner_id)
        .single();
      partnerships_to_break.push({
        userId: user.id,
        userName: user.name,
        oldPartnerId: user.partner_id,
        oldPartnerName: oldPartner?.name || 'Unknown'
      });
    }

    if (newPartner.partner_id && newPartner.partner_id !== userId) {
      const { data: oldPartner } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', newPartner.partner_id)
        .single();
      partnerships_to_break.push({
        userId: newPartner.id,
        userName: newPartner.name,
        oldPartnerId: newPartner.partner_id,
        oldPartnerName: oldPartner?.name || 'Unknown'
      });
    }

    // Force update both users to have the new partnership
    // The trigger will handle deactivating old groups and creating new ones
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ partner_id: newPartnerId, updated_at: new Date().toISOString() })
      .eq('id', userId);

    const { error: partnerError } = await supabaseAdmin
      .from('users')
      .update({ partner_id: userId, updated_at: new Date().toISOString() })
      .eq('id', newPartnerId);

    if (userError || partnerError) {
      console.error('Error forcing partnership change:', userError || partnerError);
      return NextResponse.json({ error: 'Failed to force partnership change' }, { status: 500 });
    }

    // Log all the partnership changes
    const activities = [];
    
    for (const brokenPartnership of partnerships_to_break) {
      activities.push({
        user_id: brokenPartnership.userId,
        activity_type: 'partnership_force_changed',
        description: `Partnership with ${brokenPartnership.oldPartnerName} was forcibly broken by admin`,
        created_by: session.user.id,
        created_at: new Date().toISOString()
      });

      // Also log for the old partner
      activities.push({
        user_id: brokenPartnership.oldPartnerId,
        activity_type: 'partnership_force_broken',
        description: `Partnership with ${brokenPartnership.userName} was forcibly broken by admin`,
        created_by: session.user.id,
        created_at: new Date().toISOString()
      });
    }

    // Log the new partnership creation
    activities.push({
      user_id: userId,
      activity_type: 'partnership_force_created',
      description: `Force partnered with ${newPartner.name} by admin`,
      created_by: session.user.id,
      created_at: new Date().toISOString()
    });

    activities.push({
      user_id: newPartnerId,
      activity_type: 'partnership_force_created',
      description: `Force partnered with ${user.name} by admin`,
      created_by: session.user.id,
      created_at: new Date().toISOString()
    });

    await supabaseAdmin
      .from('activities')
      .insert(activities);

    return NextResponse.json({ 
      message: `Successfully force-changed partnerships. ${user.name} and ${newPartner.name} are now partners.`,
      success: true,
      brokenPartnerships: partnerships_to_break.length,
      partnerships_to_break
    });

  } catch (error) {
    console.error('Error in force change-partner API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}