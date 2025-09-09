import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Get system settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all system settings
    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value, description, updated_at')
      .order('setting_key');

    if (error) {
      console.error('Error fetching system settings:', error);
      return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 });
    }

    // Transform array to object for easier use
    const settingsObject = settings?.reduce((acc, setting) => {
      acc[setting.setting_key] = {
        value: setting.setting_value,
        description: setting.description,
        updated_at: setting.updated_at
      };
      return acc;
    }, {} as any) || {};

    return NextResponse.json(settingsObject);

  } catch (error) {
    console.error('System settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update system settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { setting_key, setting_value } = await request.json();

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json({ error: 'setting_key and setting_value are required' }, { status: 400 });
    }

    // Validate setting key
    const validSettings = ['submissions_enabled', 'leaderboard_visible'];
    if (!validSettings.includes(setting_key)) {
      return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 });
    }

    // Validate setting value based on key
    let processedValue;
    switch (setting_key) {
      case 'submissions_enabled':
      case 'leaderboard_visible':
        if (typeof setting_value !== 'boolean') {
          return NextResponse.json({ error: 'Value must be a boolean' }, { status: 400 });
        }
        processedValue = setting_value;
        break;
      default:
        processedValue = setting_value;
    }

    // Update the setting using our helper function
    const { error: functionError } = await supabaseAdmin
      .rpc('update_system_setting', {
        setting_name: setting_key,
        setting_val: processedValue,
        admin_user_id: parseInt(session.user.id)
      });

    if (functionError) {
      console.error('Error updating system setting:', functionError);
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }

    // Get the updated setting to return
    const { data: updatedSetting } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value, updated_at')
      .eq('setting_key', setting_key)
      .single();

    return NextResponse.json({
      message: 'Setting updated successfully',
      setting: updatedSetting
    });

  } catch (error) {
    console.error('System settings update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
