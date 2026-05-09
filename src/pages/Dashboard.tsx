import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { Button } from '../components/ui/button';
import { Plus, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, Database, Store, Settings, Users, ArrowUpRight, BarChart3, Search } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, getDoc, doc, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Booking, Business, Service, UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { seedSampleData } from '../lib/seed';
import { Input } from '../components/ui/input';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { cn } from '../lib/utils';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isProvider, isAdmin } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, businesses: 0, bookings: 0 });
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        
        if (isAdmin) {
          // Fetch System Stats
          const usersSnap = await getDocs(collection(db, 'users')).catch(e => handleFirestoreError(e, OperationType.LIST, 'users'));
          const bizSnap = await getDocs(collection(db, 'businesses')).catch(e => handleFirestoreError(e, OperationType.LIST, 'businesses'));
          const bookingsSnap = await getDocs(collection(db, 'bookings')).catch(e => handleFirestoreError(e, OperationType.LIST, 'bookings'));
          
          if (usersSnap && bizSnap && bookingsSnap) {
            setStats({
              users: usersSnap.size,
              businesses: bizSnap.size,
              bookings: bookingsSnap.size
            });

            // Fetch recent users
            const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            setAllUsers(usersList);
          }

          // Fetch recent bookings
          const qRecentBookings = query(collection(db, 'bookings'), orderBy('startTime', 'desc'), limit(10));
          const snapRecent = await getDocs(qRecentBookings).catch(e => handleFirestoreError(e, OperationType.LIST, 'bookings'));
          if (snapRecent) {
            const bookingData = await Promise.all(snapRecent.docs.map(async (d) => {
              const data = d.data() as Booking;
              const bizDoc = await getDoc(doc(db, 'businesses', data.businessId)).catch(e => handleFirestoreError(e, OperationType.GET, `businesses/${data.businessId}`));
              const svcDoc = await getDoc(doc(db, 'businesses', data.businessId, 'services', data.serviceId)).catch(e => handleFirestoreError(e, OperationType.GET, `businesses/${data.businessId}/services/${data.serviceId}`));
              return {
                id: d.id,
                ...data,
                businessName: (bizDoc && bizDoc.exists()) ? bizDoc.data().name : 'Unknown Business',
                serviceName: (svcDoc && svcDoc.exists()) ? svcDoc.data().name : 'Unknown Service'
              };
            }));
            setBookings(bookingData);
          }

        } else if (isProvider) {
          // Fetch Provider's Businesses
          const qBiz = query(collection(db, 'businesses'), where('ownerId', '==', user.uid));
          const snapshotBiz = await getDocs(qBiz).catch(e => handleFirestoreError(e, OperationType.LIST, 'businesses'));
          if (snapshotBiz) {
            const bizData = await Promise.all(snapshotBiz.docs.map(async (d) => {
              const servicesSnap = await getDocs(collection(db, 'businesses', d.id, 'services')).catch(e => handleFirestoreError(e, OperationType.LIST, `businesses/${d.id}/services`));
              return {
                id: d.id,
                ...d.data(),
                servicesCount: servicesSnap ? servicesSnap.size : 0
              };
            }));
            setBusinesses(bizData);
          }

          // Fetch Bookings for all my businesses
          const qBookings = query(
            collection(db, 'bookings'), 
            where('businessOwnerId', '==', user.uid),
            orderBy('startTime', 'desc')
          );
          const snapshotBookings = await getDocs(qBookings).catch(e => handleFirestoreError(e, OperationType.LIST, 'bookings'));
          if (snapshotBookings) {
            const bookingData = await Promise.all(snapshotBookings.docs.map(async (d) => {
              const data = d.data() as Booking;
              const bizDoc = await getDoc(doc(db, 'businesses', data.businessId)).catch(e => handleFirestoreError(e, OperationType.GET, `businesses/${data.businessId}`));
              const svcDoc = await getDoc(doc(db, 'businesses', data.businessId, 'services', data.serviceId)).catch(e => handleFirestoreError(e, OperationType.GET, `businesses/${data.businessId}/services/${data.serviceId}`));
              return {
                id: d.id,
                ...data,
                businessName: (bizDoc && bizDoc.exists()) ? bizDoc.data().name : 'Unknown Business',
                serviceName: (svcDoc && svcDoc.exists()) ? svcDoc.data().name : 'Unknown Service'
              };
            }));
            setBookings(bookingData);
          }

        } else {
          // Client View
          const qBookings = query(
            collection(db, 'bookings'), 
            where('clientId', '==', user.uid),
            orderBy('startTime', 'desc')
          );
          const snapshotBookings = await getDocs(qBookings).catch(e => handleFirestoreError(e, OperationType.LIST, 'bookings'));
          if (snapshotBookings) {
            const bookingData = await Promise.all(snapshotBookings.docs.map(async (d) => {
              const data = d.data() as Booking;
              const bizDoc = await getDoc(doc(db, 'businesses', data.businessId)).catch(e => handleFirestoreError(e, OperationType.GET, `businesses/${data.businessId}`));
              const svcDoc = await getDoc(doc(db, 'businesses', data.businessId, 'services', data.serviceId)).catch(e => handleFirestoreError(e, OperationType.GET, `businesses/${data.businessId}/services/${data.serviceId}`));
              return {
                id: d.id,
                ...data,
                businessName: (bizDoc && bizDoc.exists()) ? bizDoc.data().name : 'Unknown Business',
                serviceName: (svcDoc && svcDoc.exists()) ? svcDoc.data().name : 'Unknown Service'
              };
            }));
            setBookings(bookingData);
          }
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isProvider, isAdmin]);

  const handleUpdateStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { 
        status, 
        updatedAt: serverTimestamp() 
      });
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
      toast.success(`Booking ${status} successfully`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `bookings/${bookingId}`);
    }
  };

  const handleSeed = async () => {
    const ok = await seedSampleData();
    if (ok) {
      toast.success("Sample data seeded! Refresh home page.");
    } else {
      toast.error("Seeding failed.");
    }
  };

  if (!user && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-neutral-500">Please sign in to view your dashboard.</p>
        <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-500 font-medium animate-pulse">Synchronizing Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 flex flex-col gap-8 bg-dark-bg min-h-screen text-neutral-200">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <Badge className="w-fit bg-brand/10 text-brand border-brand/20 mb-2 rounded-lg font-black uppercase tracking-widest text-[9px] px-3">
            {profile?.role.toUpperCase() || 'CLIENT'} WORKSPACE
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
            Welcome, {profile?.displayName?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-neutral-500 font-medium mt-1">Here is what is happening today.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button variant="outline" className="bg-neutral-900 border-dark-border rounded-xl h-11 px-6 font-bold" onClick={handleSeed}>
              <Database className="w-4 h-4 mr-2 text-brand" />
              Seed System
            </Button>
          )}
          {isProvider && (
            <Button className="bg-brand text-black hover:bg-brand-light rounded-xl h-11 px-6 font-black shadow-lg shadow-brand/20" onClick={() => navigate('/add-business')}>
              <Plus className="w-5 h-5 mr-1" />
              List Business
            </Button>
          )}
          {!isProvider && !isAdmin && (
             <Button variant="outline" className="bg-neutral-900 border-dark-border rounded-xl h-11 px-6 font-bold" onClick={() => navigate('/')}>
              <Search className="w-4 h-4 mr-2 text-brand" />
              Book Service
            </Button>
          )}
        </div>
      </div>

      {/* ADMIN VIEW */}
      {isAdmin && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-400' },
              { label: 'Verified Partners', value: stats.businesses, icon: Store, color: 'text-emerald-400' },
              { label: 'Appointments Booked', value: stats.bookings, icon: CalendarIcon, color: 'text-brand' },
            ].map((stat, i) => (
              <Card key={i} className="bg-dark-surface border-dark-border rounded-[24px]">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{stat.label}</span>
                    <span className="text-3xl font-black text-white">{stat.value}</span>
                  </div>
                  <stat.icon className="w-10 h-10 opacity-20 text-brand" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User List */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-brand" />
                Active Users
              </h2>
              <div className="bg-dark-surface rounded-[32px] border border-dark-border overflow-hidden">
                <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {allUsers.length > 0 ? (
                    allUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/50 hover:bg-neutral-800/80 transition-all border border-transparent hover:border-dark-border group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand/5 border border-brand/10 flex items-center justify-center text-brand font-black">
                            {u.displayName?.[0] || u.email[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white leading-none">{u.displayName}</p>
                            <p className="text-[10px] text-neutral-500 font-medium mt-1">{u.email}</p>
                          </div>
                        </div>
                        <Badge className="rounded-lg text-[9px] font-black px-2 bg-brand/10 text-brand border-brand/10">
                          {u.role?.toUpperCase() || 'USER'}
                        </Badge>
                      </div>
                    ))
                  ) : <div className="p-8 text-center text-neutral-600">No users found.</div>}
                </div>
              </div>
            </section>

            {/* Recent Global Bookings */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand" />
                System Activity
              </h2>
              <div className="bg-dark-surface rounded-[32px] border border-dark-border overflow-hidden p-6 gap-4 flex flex-col">
                {bookings.slice(0, 5).map(b => (
                   <div key={b.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/30 border border-dark-border/50">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-bold text-white">{b.businessName}</p>
                        <p className="text-[10px] text-neutral-500">{b.serviceName} • ${b.totalPrice}</p>
                      </div>
                      <Badge className="bg-neutral-800 text-[9px]">{b.status}</Badge>
                   </div>
                ))}
                <Button variant="link" className="text-brand text-xs">View all platform bookings</Button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* PROVIDER VIEW */}
      {isProvider && !isAdmin && (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500">
          <section className="flex flex-col gap-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Store className="w-6 h-6 text-brand" />
              Manage Businesses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.length > 0 ? (
                businesses.map((biz) => (
                  <Card key={biz.id} className="bg-dark-surface rounded-[32px] border-dark-border overflow-hidden group hover:border-brand/40 transition-all shadow-xl">
                    <CardContent className="p-0">
                      <div className="h-32 relative overflow-hidden">
                        <img src={biz.bannerImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60" alt={biz.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-surface to-transparent"></div>
                      </div>
                      <div className="p-6 flex flex-col gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-brand uppercase tracking-widest">{biz.category}</span>
                          <h3 className="text-xl font-black text-white group-hover:text-brand transition-colors">{biz.name}</h3>
                        </div>
                        <div className="flex items-center justify-between border-t border-dark-border pt-4">
                          <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">{biz.servicesCount} services</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="bg-neutral-900 border border-dark-border hover:border-brand text-white text-xs font-bold rounded-xl h-9"
                            onClick={() => navigate(`/biz/${biz.id}`)}
                          >
                            Settings
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full bg-dark-surface rounded-[32px] border-dashed border-dark-border/50 p-12 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-brand/5 border-2 border-dashed border-brand/20 rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-lg font-black text-white">No active listings</h3>
                  <p className="text-sm text-neutral-500 max-w-xs">Start earning by listing your professional services on the platform.</p>
                  <Button className="bg-brand text-black font-black mt-2" onClick={() => navigate('/add-business')}>
                    Get Started
                  </Button>
                </Card>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-brand" />
              Incoming Requests
            </h2>
            <div className="flex flex-col gap-3">
              {bookings.filter(b => b.status === 'pending').length > 0 ? (
                bookings.filter(b => b.status === 'pending').map((booking) => (
                  <div key={booking.id} className="bg-dark-surface p-6 rounded-[24px] border border-dark-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-brand/30 transition-all translate-y-0 hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center border border-dark-border shadow-inner">
                        <CalendarIcon className="w-6 h-6 text-neutral-500" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-lg font-black text-white">{booking.serviceName}</h4>
                        <div className="flex items-center gap-4 mt-2">
                           <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                             <Clock className="w-3.5 h-3.5" />
                             {format(new Date(booking.startTime), 'MMM d, HH:mm')}
                           </div>
                           <div className="text-xs font-black text-brand">${booking.totalPrice}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        className="flex-1 sm:flex-none h-11 px-6 rounded-xl border-dark-border hover:bg-neutral-800 font-bold"
                        onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                      >
                        Decline
                      </Button>
                      <Button 
                        className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-bold"
                        onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-neutral-600 bg-neutral-900/50 rounded-[32px] border border-dark-border">
                  No pending requests to show.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* CLIENT VIEW */}
      {!isAdmin && !isProvider && (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500">
          <section className="flex flex-col gap-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-brand" />
              Your Appointments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <Card key={booking.id} className="bg-dark-surface border-dark-border rounded-[24px] overflow-hidden group hover:border-brand/40 transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center border border-dark-border">
                           <CalendarIcon className="w-5 h-5 text-neutral-500" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <h4 className="font-black text-white">{booking.businessName}</h4>
                          <p className="text-xs text-neutral-400 font-medium">{booking.serviceName}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge className={cn(
                              "text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md",
                              booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                              booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                            )}>
                              {booking.status.toUpperCase()}
                            </Badge>
                            <span className="text-[10px] text-neutral-600 font-bold uppercase">{format(new Date(booking.startTime), 'MMM d • HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <span className="text-lg font-black text-white">${booking.totalPrice}</span>
                         {booking.status === 'confirmed' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-20 px-8 text-center flex flex-col items-center gap-6 bg-dark-surface rounded-[40px] border border-dark-border">
                  <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center border border-dark-border shadow-inner">
                    <CalendarIcon className="w-8 h-8 text-neutral-700" />
                  </div>
                  <div className="flex flex-col gap-2 max-w-xs">
                    <h3 className="text-xl font-black text-white">No Appointments Yet</h3>
                    <p className="text-sm text-neutral-500 font-medium">Ready for a transformation? Browse top-rated services and book your first session.</p>
                  </div>
                  <Button onClick={() => navigate('/')} className="bg-brand text-black font-black px-10 h-14 rounded-2xl shadow-xl shadow-brand/10">
                    Find Services
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
