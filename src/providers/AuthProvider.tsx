import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isProvider: boolean;
  toggleFavorite: (businessId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isProvider: false,
  toggleFavorite: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        // Use onSnapshot for real-time updates (e.g. role changes)
        unsubscribeProfile = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            const adminEmails = ['admin@booksy.com', 'chonjifuaclinton93@gmail.com'];
            const isAdminEmail = adminEmails.includes(user.email || '');
            
            if (isAdminEmail && data.role !== 'admin') {
              // Automatically upgrade to admin if email matches but role is different
              await updateDoc(userRef, { role: 'admin' });
              // The next snapshot will have the updated role
            } else {
              setProfile(data);
            }
          } else {
            // Initial profile creation if it doesn't exist
            const adminEmails = ['admin@booksy.com', 'chonjifuaclinton93@gmail.com'];
            const isAdminEmail = adminEmails.includes(user.email || '');
            const newProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || (isAdminEmail ? 'System Admin' : user.email?.split('@')[0] || 'User'),
              role: isAdminEmail ? 'admin' : 'client',
              createdAt: new Date()
            };
            setDoc(userRef, newProfile).then(() => {
              setProfile(newProfile);
            });
          }
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const toggleFavorite = async (businessId: string) => {
    if (!user || !profile) return;
    
    const favorites = profile.favorites || [];
    const isFavorite = favorites.includes(businessId);
    
    const newFavorites = isFavorite 
      ? favorites.filter(id => id !== businessId)
      : [...favorites, businessId];
      
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        favorites: newFavorites
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isProvider: profile?.role === 'business',
    toggleFavorite,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
