import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Business } from '../../types';
import { useAuth } from '../../providers/AuthProvider';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Store, Trash2, ExternalLink, MapPin, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

const AdminBusinesses = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const q = query(collection(db, 'businesses'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setBusinesses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Business)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin) fetchBusinesses();
  }, [isAdmin]);

  const handleDelete = async (bizId: string) => {
    if (!window.confirm("Are you sure you want to remove this business? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'businesses', bizId));
      setBusinesses(businesses.filter(b => b.id !== bizId));
      toast.success("Business removed successfully");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${bizId}`);
    }
  };

  if (!isAdmin) return <div className="p-12 text-center text-neutral-500 font-bold">Unauthorized Access</div>;

  return (
    <div className="p-8 flex flex-col gap-8 bg-dark-bg min-h-screen text-neutral-200">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Store className="w-8 h-8 text-brand" />
            Platform Directory
          </h1>
          <p className="text-neutral-500 font-medium">Global directory of all listed professional businesses.</p>
        </div>
        <Badge className="bg-brand/10 text-brand border-brand/20 px-4 py-1.5 rounded-xl font-bold uppercase tracking-widest text-[10px]">
          {businesses.length} Global Listings
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-brand" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {businesses.map(b => (
            <Card key={b.id} className="bg-dark-surface border-dark-border rounded-[32px] overflow-hidden group hover:border-brand/40 transition-all shadow-xl flex flex-col">
              <div className="h-32 relative overflow-hidden">
                <img src={b.bannerImage} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" alt={b.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-surface via-dark-surface/40 to-transparent"></div>
              </div>
              <CardContent className="p-6 flex flex-col flex-1 gap-4">
                <div className="flex flex-col gap-1">
                   <div className="flex items-center justify-between">
                     <Badge className="bg-brand/10 text-brand border-brand/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                       {b.category}
                     </Badge>
                     <div className="flex items-center gap-1 text-[10px] text-brand font-bold">
                       <Star className="w-3 h-3 fill-brand" />
                       {b.rating}
                     </div>
                   </div>
                   <h3 className="text-lg font-black text-white mt-2 leading-tight">{b.name}</h3>
                   <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                     <MapPin className="w-3 h-3" />
                     {b.city}
                   </div>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-dark-border/50">
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-neutral-900 border-dark-border h-10 rounded-xl text-[10px] font-black tracking-widest uppercase hover:border-brand"
                    onClick={() => navigate(`/biz/${b.id}`)}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-2" />
                    Visit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-10 h-10 p-0 bg-neutral-900 border-dark-border rounded-xl text-red-500 hover:bg-red-500/10 hover:border-red-500"
                    onClick={() => handleDelete(b.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {businesses.length === 0 && (
            <div className="col-span-full py-20 text-center text-neutral-500 bg-neutral-900/50 rounded-[40px] border border-dashed border-dark-border">
              No businesses found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBusinesses;
