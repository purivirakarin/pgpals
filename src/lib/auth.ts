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
        isSignUp: { label: 'Is Sign Up', type: 'hidden' }
      },
      async authorize(credentials) {
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
                role: 'participant'
              })
              .select()
              .single();

            if (error) throw error;

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