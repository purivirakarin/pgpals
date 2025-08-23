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
    { name: 'Groups', href: '/groups' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Help', href: '/help' },
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
    <header className="glass-card border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl lg:text-2xl font-bold text-white drop-shadow-lg">PGPals</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap hover:bg-white/10 rounded-lg"
              >
                {item.name}
              </Link>
            ))}
            {session && session.user?.role !== 'admin' && userNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white/90 hover:text-white px-2 xl:px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap hover:bg-white/10 rounded-lg"
              >
                {item.name}
              </Link>
            ))}
            {session?.user?.role === 'admin' && (
              <>
                <div className="border-l border-white/30 mx-2"></div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-accent-300 hover:text-accent-200 px-2 xl:px-3 py-2 text-sm font-medium transition-colors flex items-center whitespace-nowrap hover:bg-white/10 rounded-lg"
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
                  className="flex items-center space-x-1 xl:space-x-2 text-white/90 hover:text-white transition-colors hover:bg-white/10 rounded-lg px-2 py-1"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium max-w-24 xl:max-w-none truncate">
                    {session.user?.name}
                  </span>
                  {session.user?.role === 'admin' && (
                    <Shield className="w-4 h-4 text-accent-300" />
                  )}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors whitespace-nowrap hover:bg-white/10 rounded-lg px-2 py-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm hidden xl:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 xl:space-x-3">
                <Link
                  href="/auth/signin"
                  className="btn-secondary text-sm whitespace-nowrap"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white/90 hover:text-white p-2 hover:bg-white/10 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/20 py-4 bg-white/10 backdrop-blur-md rounded-b-2xl shadow-lg">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/15 rounded-lg mx-2 transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {session && session.user?.role !== 'admin' && userNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/15 rounded-lg mx-2 transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {session?.user?.role === 'admin' && (
                <>
                  <div className="border-t border-white/20 mx-2 my-3"></div>
                  <div className="px-2 mb-2">
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Admin</span>
                  </div>
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/15 rounded-lg mx-2 transition-all duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        {item.name === 'Admin Dashboard' && <Shield className="w-4 h-4 mr-3" />}
                        {item.name}
                      </div>
                    </Link>
                  ))}
                </>
              )}

              <div className="border-t border-white/20 mx-2 mt-4 pt-4">
                {session ? (
                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/15 rounded-lg mx-2 transition-all duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <User className="w-5 h-5 mr-3" />
                        <span className="flex-1">{session.user?.name}</span>
                        {session.user?.role === 'admin' && (
                          <Shield className="w-4 h-4 text-white/60 ml-2" />
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/15 rounded-lg mx-2 transition-all duration-200"
                    >
                      <div className="flex items-center">
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="px-2">
                    <Link
                      href="/auth/signin"
                      className="block px-4 py-3 text-center text-base font-semibold bg-white/90 text-primary-700 rounded-lg hover:bg-white transition-all duration-200 shadow-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
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