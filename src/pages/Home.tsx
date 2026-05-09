import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { db } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Business } from '../types';
import BusinessCard from '../components/BusinessCard';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';

const Home = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const q = query(collection(db, 'businesses'), limit(9));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Business[];
        setBusinesses(data);
      } catch (error) {
        console.error("Error fetching businesses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  return (
    <div className="flex flex-col gap-10 py-8 px-4 sm:px-8 max-w-6xl mx-auto">
      {/* Categories Horizontal Scroll */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Popular Categories</h2>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <button 
            onClick={() => setActiveCategory(null)}
            className={cn(
              "whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-bold transition-all border",
              !activeCategory 
                ? "bg-brand text-black border-brand shadow-lg shadow-brand/20" 
                : "bg-neutral-900 text-neutral-400 border-dark-border hover:border-neutral-700"
            )}
          >
            All Services
          </button>
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-bold transition-all border",
                activeCategory === cat.id 
                  ? "bg-brand text-black border-brand shadow-lg shadow-brand/20" 
                  : "bg-neutral-900 text-neutral-400 border-dark-border hover:border-neutral-700"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Featured/Hero Banner-like Section if empty or just first card */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-neutral-900 to-black border border-dark-border p-8 min-h-[300px] flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand/5 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col gap-4 max-w-lg">
          <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            Limited time offers
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight">
            Elevate your look <br /> <span className="text-neutral-500">Professional styling.</span>
          </h1>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Book your next appointment with the top rated professionals in Cameroon.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <button className="bg-white text-black font-bold px-8 py-3.5 rounded-2xl hover:scale-105 transition-transform flex items-center gap-2">
              Book Today
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Recommended Grid */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-white tracking-tight">Recommended for you</h2>
            <p className="text-sm text-neutral-500 font-medium">Handpicked services based on your location</p>
          </div>
          <button className="text-sm font-bold text-neutral-400 hover:text-white transition-colors">See all</button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-[16/12] rounded-3xl bg-neutral-900" />)}
          </div>
        ) : businesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {businesses.map((biz, i) => (
              <motion.div
                key={biz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <BusinessCard business={biz} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-dark-surface rounded-[40px] border border-dashed border-dark-border">
            <MapPin className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-1">No businesses found</h3>
            <p className="text-neutral-500 max-w-xs mx-auto">Try seeding sample data from the dashboard to see what's possible!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
