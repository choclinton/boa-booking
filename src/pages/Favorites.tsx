import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Business } from '../types';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Heart, Store, MapPin, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!profile?.favorites || profile.favorites.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Firestore 'in' query has a limit of 10-30 IDs usually. 
        // For simplicity, we'll fetch them one by one if the list is small, 
        // or chunk it if needed. Here we'll do individual gets for accuracy.
        const bizData = await Promise.all(
          profile.favorites.map(async (id) => {
            const bizDoc = await getDoc(doc(db, 'businesses', id));
            if (bizDoc.exists()) {
              return { id: bizDoc.id, ...bizDoc.data() } as Business;
            }
            return null;
          })
        );
        setFavoriteBusinesses(bizData.filter((b): b is Business => b !== null));
      } catch (error) {
        console.error("Error fetching favorite businesses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      fetchFavorites();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [profile, authLoading]);

  if (authLoading || (loading && profile?.favorites?.length)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-500 font-medium animate-pulse">Loading favorites...</p>
        </div>
      </div>
    );
  }

  if (!profile && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
        <Heart className="w-16 h-16 text-neutral-800" />
        <h1 className="text-2xl font-bold">Sign in to see favorites</h1>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 flex flex-col gap-8 bg-dark-bg min-h-screen text-neutral-200">
      <div className="flex flex-col">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
          Your Favorites
        </h1>
        <p className="text-neutral-500 font-medium mt-2">Saved businesses that you love.</p>
      </div>

      {!profile?.favorites || profile.favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-dark-surface rounded-[40px] border border-dashed border-dark-border text-center gap-6">
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center border border-dark-border">
            <Heart className="w-10 h-10 text-neutral-700" />
          </div>
          <div className="max-w-xs">
            <h3 className="text-xl font-black text-white">No favorites yet</h3>
            <p className="text-sm text-neutral-500 mt-2">Browse services and tap the heart icon to save businesses here.</p>
          </div>
          <Button onClick={() => navigate('/')} className="bg-brand text-black font-black px-8 h-12 rounded-xl">
            Explore Services
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteBusinesses.map((biz) => (
            <Card 
              key={biz.id} 
              className="bg-dark-surface rounded-[32px] border-dark-border overflow-hidden group hover:border-brand/40 transition-all shadow-xl flex flex-col cursor-pointer"
              onClick={() => navigate(`/biz/${biz.id}`)}
            >
              <div className="h-40 relative overflow-hidden">
                <img src={biz.bannerImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" alt={biz.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-surface via-dark-surface/40 to-transparent"></div>
              </div>
              <CardContent className="p-6 flex flex-col flex-1 gap-4">
                <div className="flex flex-col gap-1">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-brand uppercase tracking-widest">{biz.category}</span>
                     <div className="flex items-center gap-1 text-[10px] text-brand font-bold">
                       <Star className="w-3 h-3 fill-brand" />
                       {biz.rating}
                     </div>
                   </div>
                   <h3 className="text-xl font-black text-white mt-1 leading-tight">{biz.name}</h3>
                   <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mt-2">
                     <MapPin className="w-3.5 h-3.5" />
                     {biz.city}
                   </div>
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between text-brand font-black text-xs uppercase tracking-widest">
                  View Profile
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
