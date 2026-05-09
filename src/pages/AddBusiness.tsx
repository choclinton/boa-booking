import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CATEGORIES } from '../constants';
import { toast } from 'sonner';
import { ChevronLeft, Plus, Trash2, Store } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const AddBusiness = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [businessData, setBusinessData] = useState({
    name: '',
    category: CATEGORIES[0].id,
    address: '',
    city: '',
    description: '',
    bannerImage: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=800'
  });

  const [services, setServices] = useState([
    { name: '', price: '', duration: '30' }
  ]);

  const handleAddService = () => {
    setServices([...services, { name: '', price: '', duration: '30' }]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: string, value: string) => {
    const newServices = [...services];
    (newServices[index] as any)[field] = value;
    setServices(newServices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      // 1. Create Business
      const bizPath = 'businesses';
      const bizDoc = await addDoc(collection(db, bizPath), {
        ...businessData,
        ownerId: auth.currentUser.uid,
        rating: 5.0,
        reviewCount: 0,
        images: [businessData.bannerImage],
        createdAt: serverTimestamp()
      });

      // 2. Create Services
      const servicesPath = `${bizPath}/${bizDoc.id}/services`;
      for (const svc of services) {
        if (svc.name && svc.price) {
          await addDoc(collection(db, servicesPath), {
            businessId: bizDoc.id,
            name: svc.name,
            price: parseFloat(svc.price),
            duration: parseInt(svc.duration),
            createdAt: serverTimestamp()
          });
        }
      }

      toast.success("Business created successfully!");
      navigate('/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'businesses');
      toast.error("Failed to create business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-dark-bg text-neutral-200 p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-dark-surface rounded-xl flex items-center justify-center border border-dark-border hover:border-neutral-600 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Add Your Business</h1>
          <p className="text-sm text-neutral-500 font-medium">Create your professional profile and list your services</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        {/* Basic Info */}
        <section className="bg-dark-surface p-6 sm:p-8 rounded-[32px] border border-dark-border shadow-xl flex flex-col gap-6">
          <div className="flex items-center gap-3 text-brand font-black uppercase tracking-[0.2em] text-[10px]">
             <Store className="w-4 h-4" />
             Basic Information
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Business Name</Label>
              <Input 
                required
                placeholder="e.g. Sharp Studio"
                className="h-14 bg-neutral-900 border-dark-border rounded-2xl px-5 text-white focus:ring-brand shadow-inner"
                value={businessData.name}
                onChange={(e) => setBusinessData({...businessData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Category</Label>
              <select 
                className="w-full h-14 bg-neutral-900 border border-dark-border rounded-2xl px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand shadow-inner appearance-none"
                value={businessData.category}
                onChange={(e) => setBusinessData({...businessData, category: e.target.value})}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Address</Label>
              <Input 
                required
                placeholder="123 Street Ave"
                className="h-14 bg-neutral-900 border-dark-border rounded-2xl px-5 text-white focus:ring-brand shadow-inner"
                value={businessData.address}
                onChange={(e) => setBusinessData({...businessData, address: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">City</Label>
              <Input 
                required
                placeholder="Cameroon"
                className="h-14 bg-neutral-900 border-dark-border rounded-2xl px-5 text-white focus:ring-brand shadow-inner"
                value={businessData.city}
                onChange={(e) => setBusinessData({...businessData, city: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Banner Image URL</Label>
              <Input 
                placeholder="https://images.unsplash.com/..."
                className="h-14 bg-neutral-900 border-dark-border rounded-2xl px-5 text-white focus:ring-brand shadow-inner"
                value={businessData.bannerImage}
                onChange={(e) => setBusinessData({...businessData, bannerImage: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">About Business</Label>
              <textarea 
                required
                placeholder="Briefly describe what you offer..."
                className="w-full h-32 bg-neutral-900 border border-dark-border rounded-2xl p-5 text-white focus:outline-none focus:ring-2 focus:ring-brand shadow-inner resize-none"
                value={businessData.description}
                onChange={(e) => setBusinessData({...businessData, description: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="bg-dark-surface p-6 sm:p-8 rounded-[32px] border border-dark-border shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-brand font-black uppercase tracking-[0.2em] text-[10px]">
               <Plus className="w-4 h-4" />
               Services & Pricing
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAddService}
              className="bg-neutral-800 border-neutral-700 h-9 rounded-xl text-xs font-bold px-4"
            >
              Add Row
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {services.map((svc, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-neutral-900/50 p-4 rounded-2xl border border-dark-border">
                <div className="sm:col-span-6 space-y-1.5">
                  <Label className="text-[10px] font-black text-neutral-600 uppercase ml-1">Service Name</Label>
                  <Input 
                    required
                    placeholder="e.g. Skin Fade" 
                    className="bg-neutral-800 border-dark-border rounded-xl h-12"
                    value={svc.name}
                    onChange={(e) => updateService(index, 'name', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-[10px] font-black text-neutral-600 uppercase ml-1">Price ($)</Label>
                  <Input 
                    required
                    type="number" 
                    placeholder="35" 
                    className="bg-neutral-800 border-dark-border rounded-xl h-12"
                    value={svc.price}
                    onChange={(e) => updateService(index, 'price', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-black text-neutral-600 uppercase ml-1">Min</Label>
                  <Input 
                    required
                    type="number" 
                    placeholder="30" 
                    className="bg-neutral-800 border-dark-border rounded-xl h-12"
                    value={svc.duration}
                    onChange={(e) => updateService(index, 'duration', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-neutral-600 hover:text-red-400 hover:bg-neutral-800 h-12 w-full rounded-xl"
                    onClick={() => handleRemoveService(index)}
                    disabled={services.length === 1}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="sticky bottom-8 z-20">
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-16 bg-brand text-black font-black text-xl rounded-3xl hover:bg-brand-light shadow-2xl shadow-brand/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            {loading ? "Launching your business..." : "Launch Business"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddBusiness;
