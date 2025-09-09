/**
 * API endpoint for downloading leaderboard data as CSV
 * 
 * Returns CSV with columns:
 * - Name: Individual name or "Partner1 & Partner2" for partnerships
 * - Group ID: "user_X" for individuals or "group_X" for partnerships  
 * - Total Score: Sum of all points earned
 * - Total Quests Completed: Number of quests completed
 * 
 * Only accessible to admin users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin users to download CSV
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the view that automatically calculates points from approved submissions
    // Exclude admin users from leaderboard
    const { data: users, error } = await supabaseAdmin
      .from('user_points_view')
      .select('*')
      .neq('role', 'admin')
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Leaderboard fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Group partners together and create unique leaderboard entries
    const processedEntries = new Map();
    const processedUserIds = new Set();

    users?.forEach((user: any) => {
      // Skip if this user was already processed as part of a partnership
      if (processedUserIds.has(user.id)) {
        return;
      }

      if (user.partner_id && user.partner_name) {
        // This user has a partner, create a combined entry
        const partnerUser = users.find((u: any) => u.id === user.partner_id);
        
        if (partnerUser) {
          // Mark both users as processed
          processedUserIds.add(user.id);
          processedUserIds.add(user.partner_id);

          // Create combined entry (use the user with the lower ID as the key for consistency)
          const entryKey = Math.min(user.id, user.partner_id);
          processedEntries.set(entryKey, {
            name: `${user.name} & ${user.partner_name}`,
            group_id: `group_${entryKey}`, // Partnership group ID
            total_score: user.total_points, // Points are already combined in the view
            total_quests_completed: user.completed_quests || 0, // Quest count from the view
            is_partnership: true,
            partner_names: [user.name, user.partner_name]
          });
        } else {
          // Partner not found, treat as individual
          processedUserIds.add(user.id);
          processedEntries.set(user.id, {
            name: user.name,
            group_id: `user_${user.id}`, // Individual user ID
            total_score: user.total_points || 0,
            total_quests_completed: user.completed_quests || 0,
            is_partnership: false
          });
        }
      } else {
        // Individual user (no partner)
        processedUserIds.add(user.id);
        processedEntries.set(user.id, {
          name: user.name,
          group_id: `user_${user.id}`, // Individual user ID
          total_score: user.total_points || 0,
          total_quests_completed: user.completed_quests || 0,
          is_partnership: false
        });
      }
    });

    // Convert to array and sort by points
    const leaderboardArray = Array.from(processedEntries.values())
      .sort((a, b) => b.total_score - a.total_score);

    // Create CSV content with proper escaping
    const csvHeaders = 'Name,Group ID,Total Score,Total Quests Completed\n';
    const csvRows = leaderboardArray.map((entry, index) => {
      // Escape commas and quotes in names
      const escapedName = `"${entry.name.replace(/"/g, '""')}"`;
      const rank = index + 1;
      return `${escapedName},${entry.group_id},${entry.total_score},${entry.total_quests_completed}`;
    }).join('\n');
    
    const csvContent = csvHeaders + csvRows;

    // Create filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `leaderboard_${currentDate}.csv`;

    // Return CSV as download
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Leaderboard CSV API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
