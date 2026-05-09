import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Heart, Shield, Plus, LogOut, Users, Store } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { APP_NAME } from '../constants';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const { user, profile, isAdmin, isProvider } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    const common = [
      { label: 'Explore', icon: Home, path: '/' },
    ];

    if (isAdmin) {
      return [
        ...common,
        { label: 'System Overview', icon: Shield, path: '/dashboard' },
        { label: 'Manage Users', icon: Users, path: '/admin/users' },
        { label: 'All Businesses', icon: Store, path: '/admin/businesses' },
      ];
    }

    if (isProvider) {
      return [
        ...common,
        { label: 'My Dashboard', icon: Calendar, path: '/dashboard' },
        { label: 'Add Business', icon: Plus, path: '/add-business' },
      ];
    }

    return [
      ...common,
      { label: 'My Appointments', icon: Calendar, path: '/dashboard' },
      { label: 'Favorites', icon: Heart, path: '/favorites' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex flex-col h-full bg-dark-surface w-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-12 h-8 bg-brand rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-sm leading-none tracking-tighter">BOA</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-white">{APP_NAME.toUpperCase()}</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        <div className="py-4 px-2 text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Main Menu</div>
        {menuItems.map((item) => (
          <Link 
            key={item.label + item.path}
            to={item.path} 
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
              location.pathname === item.path 
                ? "bg-neutral-800 text-white shadow-lg" 
                : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-brand" : "text-neutral-500 group-hover:text-neutral-300")} />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 mt-auto border-t border-dark-border">
        {user ? (
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-neutral-800 border border-dark-border overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt="p" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile?.displayName || user.email?.split('@')[0]}</p>
              <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{profile?.role || 'User'}</p>
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link to="/auth">
            <button className="w-full py-2.5 bg-brand text-black font-bold text-sm rounded-xl hover:bg-brand-light transition-all shadow-lg shadow-brand/10">
              Sign In
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
