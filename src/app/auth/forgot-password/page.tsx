'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const router = useRouter();

  // Redirect authenticated users to home page
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/');
    }
  }, [session, status, router]);

  // Don't render if user is authenticated or still loading
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader className="w-8 h-8 animate-spin text-primary-600" />
    </div>;
  }

  if (status === 'authenticated') {
    return null; // Component will be unmounted due to redirect
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setExpiresIn(data.expiresIn);
        // Redirect to reset password page after 3 seconds
        setTimeout(() => {
          router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
        }, 3000);
      } else {
        // Show more helpful error messages
        let errorMessage = data.error || 'Failed to send reset code';
        
        if (response.status === 400) {
          if (data.error && data.error.includes('valid email')) {
            errorMessage = 'Please enter a valid email address (e.g., user@example.com)';
          }
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a few moments.';
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Check Your Email
            </h2>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 mb-2">
                We&apos;ve sent a 6-digit verification code to:
              </p>
              <p className="font-medium text-green-900">{email}</p>
              {expiresIn && (
                <p className="text-xs text-green-600 mt-2">
                  Code expires in {expiresIn} minutes
                </p>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Check your email (including spam folder) and enter the code on the next page. 
              If you don&apos;t receive the email within a few minutes, please verify you&apos;re using 
              the correct email address or try requesting another code.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Redirecting automatically in 3 seconds...
            </p>
          </div>
          
          <div className="space-y-3">
            <Link
              href={`/auth/reset-password?email=${encodeURIComponent(email)}`}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Continue to Reset Password
            </Link>
            
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Send Another Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link 
            href="/auth/signin"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Sign In
          </Link>
          
          <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-primary-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              No worries! Enter your email address and we&apos;ll send you a verification code to reset your password.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Code...
                </div>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link 
                href="/auth/signin" 
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> For security reasons, we won&apos;t reveal if an email exists in our system. 
              If you don&apos;t receive a code within a few minutes, please check:
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Your spam/junk folder</li>
              <li>• That you&apos;re using the correct email address</li>
              <li>• That you have an account with us</li>
            </ul>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• We&apos;ll send a 6-digit code to your email</li>
            <li>• The code expires in 15 minutes</li>
            <li>• Enter the code to set a new password</li>
            <li>• Check your spam folder if you don&apos;t see the email</li>
          </ul>
        </div>
      </div>
    </div>
  );
}