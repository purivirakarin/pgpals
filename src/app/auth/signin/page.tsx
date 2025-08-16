'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        await getSession();
        router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      console.log('Sign-in attempt:', { email, password, error });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Telegram Sign-in</h1>
          <p className="mt-2 text-gray-600">
            Open this Mini App inside Telegram to sign in automatically.
          </p>
        </div>

        <div className="card p-8">
          <form className="space-y-6" onSubmit={(e)=>e.preventDefault()}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}

            <div className="text-sm text-gray-600">Use the bot link below to launch the Mini App:</div>
            <a href="https://t.me/pgpals_bot" className="w-full inline-flex items-center justify-center py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700">Open in Telegram</a>
          </form>
        </div>
      </div>
    </div>
  );
}