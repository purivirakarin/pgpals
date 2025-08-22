import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Quest } from '@/types';
import { validateRequestBody, validateQueryParams, schemas, patterns } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryValidation = validateQueryParams(searchParams, {
      status: {
        required: false,
        pattern: patterns.questStatus
      },
      category: {
        required: false,
        pattern: patterns.questCategory
      }
    });
    
    if (!queryValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid query parameters', 
        details: queryValidation.errors 
      }, { status: 400 });
    }
    
    const status = queryValidation.sanitized?.status;
    const category = queryValidation.sanitized?.category;

    // First, expire any quests that have passed their expiration date
    await supabaseAdmin.rpc('expire_quests');

    let query = supabase
      .from('quests')
      .select('*')
      .order('created_at', { ascending: false });

    // If user is admin and no status specified, return all quests
    // If user is admin and status specified, filter by status
    // If user is not admin, only return active quests
    if (session?.user?.role === 'admin') {
      if (status) {
        query = query.eq('status', status);
      }
      // No filter for admin means all quests
    } else {
      // Non-admin users only see active quests
      query = query.eq('status', 'active');
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: quests, error } = await query;

    if (error) {
      console.error('Quests fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 });
    }

    return NextResponse.json(quests || []);
  } catch (error) {
    console.error('Quests API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = validateRequestBody(body, {
      ...schemas.quest,
      validation_criteria: {
        required: false,
        customValidator: (value) => {
          if (!value) return true;
          try {
            JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
            return true;
          } catch {
            return false;
          }
        }
      }
    });
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const { title, description, category, points, requirements, validation_criteria, expires_at } = validation.data!;

    const insertData: any = {
      title,
      description,
      category,
      points,
      requirements,
      validation_criteria: validation_criteria || {},
      created_by: session.user.id,
      status: 'active'
    };

    // Only add expires_at if it's provided and not empty
    if (expires_at) {
      const expirationDate = new Date(expires_at);
      if (expirationDate <= new Date()) {
        return NextResponse.json({ 
          error: 'Expiration date must be in the future' 
        }, { status: 400 });
      }
      insertData.expires_at = expirationDate.toISOString();
    }

    const { data: quest, error } = await supabaseAdmin
      .from('quests')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Quest creation error:', error);
      return NextResponse.json({ error: 'Failed to create quest' }, { status: 500 });
    }

    return NextResponse.json(quest, { status: 201 });
  } catch (error) {
    console.error('Quest creation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}