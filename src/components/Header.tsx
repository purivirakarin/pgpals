'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, Menu, X, Shield } from 'lucide-react';
import Link from 'next/link';
import UserStatsDisplay from './UserStatsDisplay';

export default function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Quests', href: '/quests' },
    { name: 'Leaderboard', href: '/leaderboard' },
  ];

  const userNavigation = [
    { name: 'My Submissions', href: '/my-submissions' },
  ];

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin' },
    { name: 'Manage Quests', href: '/admin/quests' },
    { name: 'Manage Submissions', href: '/admin/submissions' },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl lg:text-2xl font-bold text-primary-600">PGPals</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 px-2 xl:px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
              >
                {item.name}
              </Link>
            ))}
            {session && session.user?.role !== 'admin' && userNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 px-2 xl:px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
              >
                {item.name}
              </Link>
            ))}
            {session?.user?.role === 'admin' && (
              <>
                <div className="border-l border-gray-300 mx-2"></div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-amber-600 hover:text-amber-700 px-2 xl:px-3 py-2 text-sm font-medium transition-colors flex items-center whitespace-nowrap"
                  >
                    {item.name === 'Admin Dashboard' && <Shield className="w-4 h-4 mr-1" />}
                    <span className="hidden xl:inline">{item.name}</span>
                    <span className="xl:hidden">
                      {item.name === 'Admin Dashboard' ? 'Admin' : 
                       item.name === 'Manage Quests' ? 'Quests' : 'Submissions'}
                    </span>
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4 flex-shrink-0">
            {status === 'loading' ? (
              <div className="animate-pulse bg-gray-200 rounded-full w-8 h-8"></div>
            ) : session ? (
              <div className="flex items-center space-x-2 xl:space-x-4">
                {/* User Stats for participants */}
                <UserStatsDisplay />
                
                <Link
                  href="/profile"
                  className="flex items-center space-x-1 xl:space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium max-w-24 xl:max-w-none truncate">
                    {session.user?.name}
                  </span>
                  {session.user?.role === 'admin' && (
                    <Shield className="w-4 h-4 text-amber-500" />
                  )}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm hidden xl:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 xl:space-x-3">
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-primary-600 px-2 xl:px-3 py-2 text-sm font-medium whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary text-sm whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-primary-600 p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {session && session.user?.role !== 'admin' && userNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {session?.user?.role === 'admin' && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 text-base font-medium text-amber-600 hover:text-amber-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        {item.name === 'Admin Dashboard' && <Shield className="w-4 h-4 mr-2" />}
                        {item.name}
                      </div>
                    </Link>
                  ))}
                </>
              )}

              <div className="border-t border-gray-200 mt-4 pt-4">
                {session ? (
                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {session.user?.name}
                        {session.user?.role === 'admin' && (
                          <Shield className="w-4 h-4 text-amber-500 ml-2" />
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900"
                    >
                      <div className="flex items-center">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/auth/signin"
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="block px-3 py-2 text-base font-medium bg-primary-600 text-white rounded-lg mx-3"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}