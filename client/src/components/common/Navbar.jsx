import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/axios';
import { 
  Menu, X, TrendingUp, Compass, Award, PlusCircle, 
  Bell, Settings, LogOut, ShieldAlert, User as UserIcon 
} from 'lucide-react';

import Avatar from './Avatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch initial unread count
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const response = await api.get('/notifications');
          const unread = response.data.notifications.filter(n => !n.read).length;
          setUnreadCount(unread);
        } catch (error) {
          console.error('Failed to load notifications count:', error);
        }
      };
      fetchNotifications();
    }
  }, [user]);

  // Listen for real-time notifications to update count
  useEffect(() => {
    if (socket) {
      const handleNotification = () => {
        setUnreadCount(prev => prev + 1);
      };
      socket.on('notification', handleNotification);
      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [socket]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/explore?sort=trending') {
      return location.pathname === '/explore' && location.search.includes('sort=trending');
    }
    if (path === '/explore') {
      return location.pathname === '/explore' && !location.search.includes('sort=trending');
    }
    return location.pathname === path;
  };

  const navLinks = [
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Trending', path: '/explore?sort=trending', icon: TrendingUp },
    { name: 'Leaderboards', path: '/leaderboards', icon: Award },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5">
              <img src="/favicon.png" alt="RankVerse Logo" className="w-6 h-6 object-contain invert" />
              <span className="text-2xl font-extrabold text-white tracking-wider">
                RANKVERSE
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 border ${
                    isActive(link.path)
                      ? 'bg-slate-900 text-indigo-400 border-slate-800'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {user && (
              <Link
                to="/create"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition duration-200 shadow shadow-emerald-500/10"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create List</span>
              </Link>
            )}
          </div>

          {/* User profile dropdown / auth triggers */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  onClick={() => setUnreadCount(0)}
                  className="relative p-2 text-slate-400 hover:text-slate-100 bg-slate-900/50 rounded-full border border-slate-850 hover:bg-slate-900 transition-all duration-200"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xxs font-bold leading-none text-white bg-pink-500 rounded-full transform translate-x-1/3 -translate-y-1/3">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <Avatar user={user} className="w-9 h-9" sizeText="text-sm" />
                  </button>

                  {/* Dropdown Box */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-lg shadow-xl py-1 bg-slate-900 border border-slate-800 ring-1 ring-black ring-opacity-5">
                      <div className="px-4 py-2 border-b border-slate-850">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-semibold truncate text-slate-200">{user.name}</p>
                      </div>

                      <Link
                        to={`/profile/${user._id}`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-pink-400 hover:bg-slate-800 hover:text-pink-300"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-850 hover:text-rose-400 border-t border-slate-850 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-full transition duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {user && (
              <Link
                to="/notifications"
                onClick={() => setUnreadCount(0)}
                className="relative p-2 mr-2 text-slate-400 hover:text-slate-100 bg-slate-900/50 rounded-full border border-slate-850 hover:bg-slate-900 transition-all duration-200"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xxs font-bold leading-none text-white bg-pink-500 rounded-full transform translate-x-1/3 -translate-y-1/3">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-905 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-900 px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-slate-900 text-indigo-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          {user && (
            <>
              <Link
                to="/create"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 mt-2"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Create List</span>
              </Link>
              <Link
                to={`/profile/${user._id}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-slate-400 hover:text-white hover:bg-slate-900"
              >
                <UserIcon className="w-5 h-5" />
                <span>My Profile</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-slate-400 hover:text-white hover:bg-slate-900"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-pink-400 hover:text-pink-300 hover:bg-slate-900"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>Admin Console</span>
                </Link>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-rose-450 hover:bg-slate-900 border-t border-slate-900 mt-2 pt-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </>
          )}

          {!user && (
            <div className="grid grid-cols-2 gap-2 mt-4 px-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-center px-4 py-2 border border-slate-800 rounded-md text-sm font-medium text-slate-350 hover:bg-slate-900 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="text-center px-4 py-2 bg-white hover:bg-slate-100 rounded-md text-sm font-bold text-slate-950"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
