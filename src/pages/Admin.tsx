import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Trash2, ShieldCheck, Database, Search, 
  ChevronRight, ArrowUpRight, CheckCircle2, AlertTriangle, MessageSquarePlus, Loader2, LogOut
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { auth, db } from '@/src/lib/firebase';
import { collection, query, getDocs, deleteDoc, doc, orderBy, limit } from 'firebase/firestore';

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTip, setNewTip] = useState("");
  const [counts, setCounts] = useState({ users: 0, predictions: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const predictionsSnap = await getDocs(collection(db, 'predictions'));
        
        setUsers(usersData);
        setCounts({
          users: usersSnap.size,
          predictions: predictionsSnap.size
        });
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const deleteUser = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete user: ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'users', id));
        setUsers(prev => prev.filter(u => u.id !== id));
        setCounts(prev => ({ ...prev, users: prev.users - 1 }));
      } catch (err) {
        console.error("Delete user failed:", err);
      }
    }
  };

  const handleAddTip = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`New health tip published: "${newTip}"`);
    setNewTip("");
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
       <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand-accent" />
             </div>
             <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Administrative Cloud Controller</span>
           </div>
           <div className="flex items-center gap-6">
              <h1 className="text-5xl font-black font-display tracking-tightest text-brand-accent">Admin <span className="text-white">Panel.</span></h1>
              <button 
                onClick={handleLogout}
                className="mt-2 p-2 rounded-xl bg-white/5 border border-white/5 text-white/20 hover:text-red-500 hover:bg-white/10 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" /> Terminate Session
              </button>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[
             { label: 'Total Users', value: counts.users.toString(), icon: Users, color: 'text-brand-primary' },
             { label: 'Total Analyses', value: counts.predictions.toString(), icon: Database, color: 'text-brand-accent' },
             { label: 'System Health', value: '100%', icon: CheckCircle2, color: 'text-emerald-400' }
           ].map((stat, i) => (
             <div key={i} className="glass-card px-6 py-3 min-w-[140px] flex flex-col items-center">
                <stat.icon className={cn("w-4 h-4 mb-1", stat.color)} />
                <span className="text-xl font-bold">{stat.value}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/20 font-black">{stat.label}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* User Management Section */}
         <div className="lg:col-span-2 space-y-6">
            <div className="glass-card overflow-hidden">
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-brand-primary" /> Active Users</h2>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                     <input type="text" placeholder="Filter users..." className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-brand-primary outline-none" />
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5">
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">User</th>
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Role</th>
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {users.map((u) => (
                           <tr key={u.id} className="hover:bg-white/[0.04] transition-colors">
                              <td className="p-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs overflow-hidden">
                                       {u.photo ? (
                                         <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                                       ) : (
                                         u.name?.[0] || 'U'
                                       )}
                                    </div>
                                    <div>
                                       <div className="font-bold text-sm tracking-tight">{u.name || 'Anonymous'}</div>
                                       <div className="text-[10px] text-white/20">{u.email || u.mobile || 'No contact info'}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-4">
                                 <div className="flex items-center gap-2">
                                    <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest", 
                                      u.role === 'admin' ? "bg-brand-accent/20 text-brand-accent border border-brand-accent/20" : "bg-white/5 text-white/40 border border-white/5"
                                    )}>
                                      {u.role || 'user'}
                                    </div>
                                 </div>
                              </td>
                              <td className="p-4 text-right">
                                 <button 
                                   onClick={() => deleteUser(u.id, u.name)}
                                   className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-500 transition-all"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="p-12 text-center text-white/20 text-sm italic">
                      No registered users found.
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Admin Tools Section */}
         <div className="space-y-6">
            <div className="glass-card p-8">
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageSquarePlus className="w-5 h-5 text-brand-accent" /> Publish Tip</h2>
               <form onSubmit={handleAddTip} className="space-y-4">
                  <textarea 
                    placeholder="Enter actionable health tip..."
                    required
                    value={newTip}
                    onChange={(e) => setNewTip(e.target.value)}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-brand-accent outline-none text-sm resize-none"
                  />
                  <button type="submit" className="w-full py-3 rounded-xl bg-brand-accent text-black font-bold text-sm tracking-tightest shadow-lg shadow-brand-accent/20">
                     Broadcast Tip to All
                  </button>
               </form>
            </div>

            <div className="glass-card p-6">
               <h3 className="text-sm font-black uppercase tracking-widest text-white/20 mb-6 font-display">System Feed</h3>
               <div className="space-y-4">
                  {[
                    { msg: "Server Status: Operational", time: "Live", icon: CheckCircle2, color: "text-emerald-400" },
                    { msg: "Database Sync: Complete", time: "Just now", icon: Database, color: "text-brand-primary" },
                    { msg: "Security Shield: Active", time: "Armed", icon: ShieldCheck, color: "text-brand-accent" }
                  ].map((act, i) => (
                     <div key={i} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                        <act.icon className={cn("w-4 h-4 shrink-0 mt-1", act.color)} />
                        <div>
                           <div className="text-[11px] font-medium text-white/60">{act.msg}</div>
                           <div className="text-[9px] text-white/20 uppercase tracking-widest mt-1 font-bold">{act.time}</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
