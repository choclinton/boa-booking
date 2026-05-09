import React from 'react';
import { Star, MapPin, Clock } from 'lucide-react';
import { Business } from '../types';
import { Badge } from './ui/badge';
import { Link } from 'react-router-dom';

interface BusinessCardProps {
  business: Business;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business }) => {
  return (
    <Link to={`/biz/${business.id}`}>
      <div className="bg-dark-surface rounded-2xl overflow-hidden border border-dark-border hover:border-neutral-700 transition-all group flex flex-col h-full shadow-sm">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img 
            src={business.bannerImage} 
            alt={business.name} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-3 right-3">
            <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-white/10">
              <Star className="w-3 h-3 fill-brand text-brand mr-1" />
              {business.rating}
            </div>
          </div>
        </div>
        <div className="p-5 flex flex-col flex-1 gap-2">
          <div>
            <h3 className="font-bold text-lg text-white leading-tight mb-1 group-hover:text-brand transition-colors line-clamp-1">{business.name}</h3>
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
              <span>{business.category}</span>
              <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {business.city}
              </div>
            </div>
          </div>
          
          <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">{business.description}</p>
          
          <div className="mt-auto pt-4 border-t border-dark-border flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-widest text-neutral-600">Starting from</span>
              <span className="text-brand font-bold text-lg leading-none">$35.00</span>
            </div>
            <button className="text-[11px] font-black uppercase tracking-widest text-white bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-xl transition-colors">
              Book
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BusinessCard;
