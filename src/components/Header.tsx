import React from 'react';
import { Search, MapPin, Menu, User } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { Button } from './ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { auth } from '../lib/firebase';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import Sidebar from './Sidebar';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

const Header = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleSwitchToBusiness = async () => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: 'business' });
      toast.success("Welcome! You are now a Business Owner.");
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error("Failed to switch role");
    }
  };

  const handleSwitchToClient = async () => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: 'client' });
      toast.success("Switched to Client profile.");
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error("Failed to switch role");
    }
  };

  return (
    <header className="h-20 shrink-0 border-b border-dark-border px-4 sm:px-8 flex items-center justify-between bg-dark-surface/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 transition-colors">
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-none w-64 bg-dark-surface">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <Link to="/" className="md:hidden font-black text-2xl tracking-tighter text-white">BOA.</Link>
      </div>

      <div className="flex-1 max-w-xl hidden md:block">
        <div className="relative group">
          <span className="absolute inset-y-0 left-4 flex items-center text-neutral-500 group-focus-within:text-brand transition-colors">
            <Search className="w-5 h-5" />
          </span>
          <input 
            type="text" 
            placeholder="Search for hair, nails, massage..." 
            className="w-full bg-neutral-900/50 border border-dark-border rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand text-white shadow-inner transition-all placeholder:text-neutral-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-8 ml-auto">
        <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-neutral-400 cursor-pointer hover:text-white transition-colors">
          <MapPin className="w-4 h-4 text-brand" />
          Cameroon
        </div>
        
        {user ? (
          <div className="flex items-center gap-4">
             {profile?.role === 'business' ? (
               <Button 
                onClick={handleSwitchToClient}
                className="hidden sm:flex bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 border border-dark-border text-xs font-bold rounded-xl transition-all"
               >
                Switch to Client
              </Button>
             ) : (
               <Button 
                onClick={handleSwitchToBusiness}
                className="hidden sm:flex bg-brand/10 text-brand hover:bg-brand/20 border border-brand/20 text-xs font-bold rounded-xl transition-all"
               >
                Switch to Business
              </Button>
             )}
            <DropdownMenu>
              <DropdownMenuTrigger className="w-10 h-10 rounded-full bg-neutral-800 border border-dark-border overflow-hidden flex items-center justify-center hover:border-brand transition-all outline-none">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="u" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-neutral-500 w-5 h-5" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-neutral-900 border-dark-border text-neutral-200">
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="hover:bg-neutral-800 focus:bg-neutral-800">Dashboard</DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={async () => {
                    const url = prompt("Enter new photo URL:", user.photoURL || "");
                    if (url !== null) {
                      try {
                        const userRef = doc(db, 'users', user.uid);
                        await updateDoc(userRef, { photoURL: url });
                        toast.success("Profile photo updated!");
                      } catch (err) {
                        toast.error("Failed to update photo");
                      }
                    }
                  }} 
                  className="hover:bg-neutral-800 focus:bg-neutral-800"
                >
                  Change Photo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => auth.signOut()} className="text-red-400 hover:bg-red-950/20 focus:bg-red-950/20">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Link to="/auth">
            <Button className="bg-brand hover:bg-brand-light text-black font-bold rounded-xl h-11 px-6 shadow-lg shadow-brand/20">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
