import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { Business, Service } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Calendar } from '../components/ui/calendar';
import { Badge } from '../components/ui/badge';
import { Star, Clock, MapPin, ChevronLeft, Calendar as CalendarIcon, Info, Plus, Trash2, X, Edit2, Save, Camera, Heart } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { serverTimestamp } from 'firebase/firestore';
import { format, addMinutes } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const BusinessProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, toggleFavorite } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', duration: '30' });
  const [addingService, setAddingService] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    bannerImage: '',
    address: '',
    city: ''
  });
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  const isOwner = auth.currentUser?.uid === business?.ownerId;
  const isFavorite = id ? profile?.favorites?.includes(id) : false;

  const handleToggleFavorite = async () => {
    if (!id || !auth.currentUser) {
      if (!auth.currentUser) {
        toast.error("Please sign in to save favorites");
        navigate('/auth');
      }
      return;
    }
    setTogglingFavorite(true);
    try {
      await toggleFavorite(id);
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites!");
    } catch (err) {
      toast.error("Failed to update favorites");
    } finally {
      setTogglingFavorite(false);
    }
  };

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !business) return;
    
    setSavingBusiness(true);
    try {
      const bizRef = doc(db, 'businesses', id);
      await updateDoc(bizRef, {
        ...editData,
        updatedAt: serverTimestamp()
      });
      
      setBusiness({ ...business, ...editData });
      setIsEditMode(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${id}`);
      toast.error("Failed to update business");
    } finally {
      setSavingBusiness(false);
    }
  };

  const startEditing = () => {
    if (!business) return;
    setEditData({
      name: business.name,
      description: business.description || '',
      bannerImage: business.bannerImage,
      address: business.address,
      city: business.city
    });
    setIsEditMode(true);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newService.name || !newService.price) return;
    
    setAddingService(true);
    try {
      const servicesPath = `businesses/${id}/services`;
      const docRef = await addDoc(collection(db, servicesPath), {
        businessId: id,
        name: newService.name,
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration),
        createdAt: serverTimestamp()
      });
      
      const addedService = { id: docRef.id, ...newService, price: parseFloat(newService.price), duration: parseInt(newService.duration) } as Service;
      setServices([...services, addedService]);
      setNewService({ name: '', price: '', duration: '30' });
      setShowAddService(false);
      toast.success("Service added successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${id}/services`);
      toast.error("Failed to add service");
    } finally {
      setAddingService(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const bizDoc = await getDoc(doc(db, 'businesses', id));
        if (bizDoc.exists()) {
          setBusiness({ id: bizDoc.id, ...bizDoc.data() } as Business);
          
          const servicesSnap = await getDocs(collection(db, 'businesses', id, 'services'));
          setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[]);
        }
      } catch (error) {
        console.error("Error fetching business:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBooking = async () => {
    if (!auth.currentUser) {
      toast.error("Please sign in to book");
      navigate('/auth');
      return;
    }
    if (!selectedService || !selectedDate || !selectedTime || !business) return;

    setBookingLoading(true);
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = addMinutes(startTime, selectedService.duration);

      const bookingData = {
        businessId: business.id,
        businessOwnerId: business.ownerId,
        serviceId: selectedService.id,
        clientId: auth.currentUser.uid,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: 'pending',
        totalPrice: selectedService.price
      };

      const path = 'bookings';
      try {
        await addDoc(collection(db, path), bookingData);
        toast.success("Booking requested successfully!");
        navigate('/dashboard');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create booking");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="p-4 space-y-4"><Skeleton className="h-64 w-full rounded-2xl" /><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>;
  if (!business) return <div className="p-12 text-center text-neutral-500">Business not found</div>;

  const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div className="flex flex-col min-h-screen bg-dark-bg text-neutral-200">
      {/* Hero Section */}
      <div className="relative h-72 overflow-hidden">
        <img src={business.bannerImage} className="w-full h-full object-cover" alt={business.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-black/20"></div>
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 w-12 h-12 bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-2xl hover:bg-black transition-all group"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <div className="absolute top-6 right-6 flex items-center gap-3">
          <button 
            disabled={togglingFavorite}
            onClick={handleToggleFavorite}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xl transition-all group ${
              isFavorite 
                ? 'bg-red-500 border-red-500 text-white' 
                : 'bg-black/60 backdrop-blur-md border-white/10 text-white hover:bg-black'
            }`}
          >
            <Heart className={`w-6 h-6 transition-all ${isFavorite ? 'fill-white scale-110' : 'group-hover:scale-110'}`} />
          </button>

          {isOwner && !isEditMode && (
            <button 
              onClick={startEditing}
              className="px-4 h-12 bg-brand text-black font-bold rounded-2xl flex items-center gap-2 shadow-2xl hover:bg-brand-light transition-all"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-8 py-8 flex flex-col gap-8 -mt-10 bg-dark-bg rounded-t-[40px] relative z-10 border-t border-dark-border shadow-2xl shadow-black/50">
        {isEditMode ? (
          <Card className="bg-dark-surface border-brand/20 p-6 sm:p-8 rounded-[40px] shadow-2xl">
            <form onSubmit={handleUpdateBusiness} className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider">Edit Business Profile</h2>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsEditMode(false)} className="text-neutral-500">Cancel</Button>
                  <Button type="submit" disabled={savingBusiness} className="bg-brand text-black font-bold px-6 rounded-xl">
                    {savingBusiness ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Business Name</Label>
                  <Input 
                    required
                    value={editData.name}
                    onChange={e => setEditData({...editData, name: e.target.value})}
                    className="h-12 bg-neutral-900 border-dark-border rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Banner Image URL</Label>
                  <div className="relative">
                    <Input 
                      required
                      value={editData.bannerImage}
                      onChange={e => setEditData({...editData, bannerImage: e.target.value})}
                      className="h-12 bg-neutral-900 border-dark-border rounded-xl pl-10"
                    />
                    <Camera className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Address</Label>
                  <Input 
                    required
                    value={editData.address}
                    onChange={e => setEditData({...editData, address: e.target.value})}
                    className="h-12 bg-neutral-900 border-dark-border rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">City</Label>
                  <Input 
                    required
                    value={editData.city}
                    onChange={e => setEditData({...editData, city: e.target.value})}
                    className="h-12 bg-neutral-900 border-dark-border rounded-xl"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">About Business</Label>
                  <textarea 
                    required
                    value={editData.description}
                    onChange={e => setEditData({...editData, description: e.target.value})}
                    className="w-full h-32 bg-neutral-900 border border-dark-border rounded-xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>
            </form>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Badge className="bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 rounded-lg px-3 py-1">
                    {business.category}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-widest border-l border-dark-border pl-3">
                    <Star className="w-3.5 h-3.5 fill-brand text-brand" />
                    <span className="text-white">{business.rating}</span>
                    <span className="text-neutral-600">({business.reviewCount})</span>
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mt-2">{business.name}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-500 font-medium pb-8 border-b border-dark-border">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand" />
                {business.address}, {business.city}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand" />
                Open until 8:00 PM
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-brand" />
                {business.description || "About Us"}
              </div>
            </div>
          </>
        )}

        {/* Services List */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Available Services</h2>
            <div className="flex items-center gap-4">
              <div className="text-xs font-bold text-neutral-600 uppercase tracking-widest">{services.length} options</div>
              {isOwner && (
                <Button 
                  size="sm" 
                  className="bg-brand text-black hover:bg-brand/90 font-bold rounded-xl"
                  onClick={() => setShowAddService(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Service
                </Button>
              )}
            </div>
          </div>

          {showAddService && (
            <Card className="bg-dark-surface border-brand/30 border-2 shadow-2xl p-6 rounded-[32px] animate-in fade-in slide-in-from-top-4 duration-300">
              <form onSubmit={handleAddService} className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-white uppercase tracking-widest text-sm">Create New Service</h3>
                  <button type="button" onClick={() => setShowAddService(false)} className="text-neutral-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Service Name</Label>
                    <Input 
                      required
                      placeholder="e.g. Deluxe Polish"
                      className="h-12 bg-neutral-900 border-dark-border rounded-xl"
                      value={newService.name}
                      onChange={e => setNewService({...newService, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Price ($)</Label>
                    <Input 
                      required
                      type="number"
                      placeholder="45"
                      className="h-12 bg-neutral-900 border-dark-border rounded-xl"
                      value={newService.price}
                      onChange={e => setNewService({...newService, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Duration (Min)</Label>
                    <Input 
                      required
                      type="number"
                      placeholder="30"
                      className="h-12 bg-neutral-900 border-dark-border rounded-xl"
                      value={newService.duration}
                      onChange={e => setNewService({...newService, duration: e.target.value})}
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={addingService}
                  className="bg-brand text-black font-black w-fit px-8 rounded-xl h-12 ml-auto"
                >
                  {addingService ? "Adding..." : "Save Service"}
                </Button>
              </form>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div 
                key={service.id} 
                className={`group cursor-pointer p-5 rounded-[32px] transition-all border flex justify-between items-center ${
                  selectedService?.id === service.id 
                    ? 'bg-brand/5 border-brand shadow-lg shadow-brand/10 translate-y-[-2px]' 
                    : 'bg-dark-surface border-dark-border hover:border-neutral-600 active:scale-[0.98]'
                }`}
                onClick={() => setSelectedService(service)}
              >
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-lg text-white group-hover:text-brand transition-colors">{service.name}</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {service.duration} min
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className={`font-black text-xl ${selectedService?.id === service.id ? 'text-brand' : 'text-white'}`}>
                    ${service.price}
                  </div>
                  <div className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border transition-all ${
                    selectedService?.id === service.id 
                    ? 'bg-brand text-black border-brand' 
                    : 'bg-neutral-900 text-neutral-500 border-dark-border group-hover:text-white group-hover:border-neutral-600'
                  }`}>
                    {selectedService?.id === service.id ? 'Selected' : 'Select'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Booking Interface */}
        {selectedService && (
          <div className="flex flex-col gap-8 pt-8 border-t border-dark-border mt-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-brand" />
                Schedule Invitation
              </h2>
              <p className="text-sm text-neutral-500 font-medium ml-9">Select your preferred date and time for {selectedService.name}</p>
            </div>
            
            <div className="bg-dark-surface p-8 rounded-[40px] border border-dark-border flex flex-col lg:flex-row gap-12 items-center lg:items-start justify-center shadow-xl">
              <div className="bg-neutral-900 p-4 rounded-3xl border border-dark-border shadow-inner">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="bg-transparent text-white"
                />
              </div>
              <div className="flex flex-col gap-6 w-full">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em]">Available Slots</span>
                  <span className="text-xs font-bold text-brand">{format(selectedDate || new Date(), 'MMMM d, yyyy')}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {times.map((time) => (
                    <button
                      key={time}
                      className={`h-14 rounded-2xl font-bold transition-all border ${
                        selectedTime === time 
                          ? 'bg-brand text-black border-brand shadow-lg shadow-brand/20' 
                          : 'bg-neutral-900 text-neutral-400 border-dark-border hover:border-neutral-700 hover:text-white'
                      }`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 max-w-6xl mx-auto px-4 pb-8 z-50">
              <div className="bg-neutral-900 border border-dark-border backdrop-blur-xl p-4 sm:p-6 rounded-[32px] flex items-center justify-between shadow-2xl ring-1 ring-white/5 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">Selected Service</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                    <span className="text-[10px] text-brand font-bold uppercase">{selectedService.name}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">${selectedService.price}</span>
                    <span className="text-neutral-500 text-sm font-medium">/ service</span>
                  </div>
                </div>
                <Button 
                  className="h-14 sm:h-16 px-12 bg-brand text-black rounded-2xl font-black text-lg hover:scale-[1.03] active:scale-[0.98] transition-all shadow-xl shadow-brand/20 disabled:opacity-30 disabled:hover:scale-100"
                  disabled={!selectedTime || bookingLoading}
                  onClick={handleBooking}
                >
                  {bookingLoading ? 'Securing Slot...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
            <div className="h-32"></div> {/* Spacer for sticky footer */}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessProfile;
