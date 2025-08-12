import { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from './supabase';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_KEY!,
  }),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        isSignUp: { label: 'Is Sign Up', type: 'hidden' },
        faculty: { label: 'Faculty', type: 'text' },
        major: { label: 'Major', type: 'text' },
        profileImageUrl: { label: 'Profile Image URL', type: 'text' },
        isTelegram: { label: 'Is Telegram', type: 'hidden' },
        telegramInitData: { label: 'Telegram Init Data', type: 'text' }
      },
      async authorize(credentials) {
        // Telegram Mini App branch: no manual signup, verify Telegram initData
        if (credentials?.isTelegram === 'true') {
          try {
            if (!credentials.telegramInitData) return null
            // Verify Telegram initData signature server-side
            const isValid = await verifyTelegramInitData(credentials.telegramInitData)
            if (!isValid) return null
            const parsed = parseTelegramInitData(credentials.telegramInitData)
            const telegramId = String(parsed.user?.id || '')
            if (!telegramId) return null
            const telegramUsername = parsed.user?.username || null
            const name = parsed.user?.first_name || parsed.user?.username || 'Telegram User'
            // Upsert user by telegram_id
            const { data: existing } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('telegram_id', telegramId)
              .single()
            if (!existing) {
              const { data: created, error } = await supabaseAdmin
                .from('users')
                .insert({ name, telegram_id: telegramId, telegram_username: telegramUsername, role: 'participant' })
                .select()
                .single()
              if (error || !created) return null
              return { id: created.id, email: created.email, name: created.name, role: created.role }
            }
            // Update username/name best-effort
            await supabaseAdmin.from('users').update({ name, telegram_username: telegramUsername }).eq('id', existing.id)
            return { id: existing.id, email: existing.email, name: existing.name, role: existing.role }
          } catch (e) {
            console.error('Telegram authorize error', e)
            return null
          }
        }

        if (!credentials?.email) return null;

        try {
          if (credentials.isSignUp === 'true') {
            // Sign up
            const { data: existingUser } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('email', credentials.email)
              .single();

            if (existingUser) {
              throw new Error('User already exists');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(credentials.password, 12);

            const { data: newUser, error } = await supabaseAdmin
              .from('users')
              .insert({
                email: credentials.email,
                name: credentials.name || 'Anonymous',
                password_hash: hashedPassword,
                role: 'participant',
                faculty: credentials.faculty || null,
                major: credentials.major || null,
                profile_image_url: credentials.profileImageUrl || null
              })
              .select()
              .single();

            if (error) {
              // Handle unique constraint gracefully
              if ((error as any).code === '23505') {
                throw new Error('User already exists');
              }
              throw error;
            }

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role
            };
          } else {
            // Sign in
            const { data: user } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('email', credentials.email)
              .single();

            if (!user) {
              throw new Error('Invalid email or password');
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
            if (!isPasswordValid) {
              throw new Error('Invalid email or password');
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            };
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET
};

// --- Telegram Mini App helpers ---
import crypto from 'crypto'

function parseTelegramInitData(initData: string): any {
  const search = new URLSearchParams(initData)
  const obj: Record<string, any> = {}
  search.forEach((value, key) => {
    obj[key] = value
  })
  if (obj.user) {
    try { obj.user = JSON.parse(obj.user) } catch {}
  }
  return obj
}

async function verifyTelegramInitData(initData: string): Promise<boolean> {
  try {
    const data = parseTelegramInitData(initData)
    const hash = data.hash
    if (!hash) return false
    delete data.hash
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN || '').digest()
    const dataCheckString = Object.keys(data)
      .sort()
      .map((k) => `${k}=${data[k]}`)
      .join('\n')
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    return computedHash === hash
  } catch (e) {
    console.error('verifyTelegramInitData error', e)
    return false
  }
}