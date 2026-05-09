import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { UserProfile } from '../../types';
import { useAuth } from '../../providers/AuthProvider';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Users, Mail, Shield, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

const AdminUsers = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const toggleRole = async (userId: string, currentRole: 'client' | 'business' | 'admin') => {
    const newRole = currentRole === 'client' ? 'business' : 'client';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    }
  };

  if (!isAdmin) return <div className="p-12 text-center">Unauthorized Access</div>;

  return (
    <div className="p-8 flex flex-col gap-8 bg-dark-bg min-h-screen text-neutral-200">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-brand" />
            User Management
          </h1>
          <p className="text-neutral-500 font-medium">Monitor and manage access across the platform.</p>
        </div>
        <Badge className="bg-brand/10 text-brand border-brand/20 px-4 py-1.5 rounded-xl font-bold uppercase tracking-widest text-[10px]">
          {users.length} Total Users
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-brand" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(u => (
            <Card key={u.id} className="bg-dark-surface border-dark-border rounded-[32px] overflow-hidden group hover:border-brand/30 transition-all shadow-xl">
              <CardContent className="p-6 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-dark-border flex items-center justify-center text-brand font-black text-xl shadow-inner">
                      {u.displayName?.[0] || u.email[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-bold text-white leading-none">{u.displayName || 'Anonymous'}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-2 font-medium">
                        <Mail className="w-3 h-3" />
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <Badge className={cn(
                    "text-[9px] font-black tracking-widest px-2 py-1 rounded-lg",
                    u.role === 'admin' ? 'bg-red-500/10 text-red-400' :
                    u.role === 'business' ? 'bg-brand/10 text-brand' : 'bg-blue-500/10 text-blue-400'
                  )}>
                    {u.role?.toUpperCase() || 'CLIENT'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-dark-border/50">
                  {u.role !== 'admin' && (
                    <Button 
                      variant="outline" 
                      className="flex-1 bg-neutral-900 border-dark-border h-11 rounded-xl text-xs font-black shadow-sm"
                      onClick={() => toggleRole(u.id, u.role || 'client')}
                    >
                      {u.role === 'client' ? (
                        <>
                          <Shield className="w-3.5 h-3.5 mr-2 text-brand" />
                          Make Partner
                        </>
                      ) : (
                        <>
                          <Users className="w-3.5 h-3.5 mr-2 text-blue-400" />
                          Mark as Client
                        </>
                      )}
                    </Button>
                  )}
                  {u.role === 'admin' && (
                    <div className="flex-1 flex items-center justify-center text-[10px] font-black text-red-500/50 uppercase tracking-widest gap-2 bg-red-500/5 h-11 rounded-xl border border-red-500/10">
                      <ShieldAlert className="w-4 h-4" />
                      System Protected
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
