import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, query, where, getDocs, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn, ShieldCheck, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Fake login for demo purposes
    if (username === 'admin' && password === '1234') {
      localStorage.setItem('hr_pulse_demo_user', JSON.stringify({
        uid: 'demo-admin-uid',
        name: 'Demo Admin',
        username: 'admin',
        email: 'admin@hrpulse.com',
        role: 'admin',
        leaveBalance: 30,
        createdAt: new Date().toISOString()
      }));
      toast.success('Welcome back (Demo Admin)!');
      navigate('/dashboard');
      setLoading(false);
      return;
    }

    if (username === 'employee' && password === '4321') {
      localStorage.setItem('hr_pulse_demo_user', JSON.stringify({
        uid: 'demo-employee-uid',
        name: 'Demo Employee',
        username: 'employee',
        email: 'employee@hrpulse.com',
        role: 'employee',
        leaveBalance: 24,
        createdAt: new Date().toISOString()
      }));
      toast.success('Welcome back (Demo Employee)!');
      navigate('/dashboard');
      setLoading(false);
      return;
    }

    // Map username to email convention
    const email = username.includes('@') ? username : `${username}@hrpulse.com`;

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Try to find user profile by UID first
      let docRef = doc(db, 'users', user.uid);
      let docSnap = await getDoc(docRef);
      
      // If not found by UID, try by email (for newly created employees)
      if (!docSnap.exists()) {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnap = await getDocs(q);
        
        if (!querySnap.empty) {
          const userData = querySnap.docs[0].data();
          // Migrate to UID-based doc
          await setDoc(docRef, {
            ...userData,
            uid: user.uid
          });
          // Delete the old doc if it had a different ID
          if (querySnap.docs[0].id !== user.uid) {
            await deleteDoc(doc(db, 'users', querySnap.docs[0].id));
          }
          docSnap = await getDoc(docRef);
        }
      }

      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.mustResetPassword) {
          toast.info('Please reset your temporary password');
          navigate('/reset-password');
        } else {
          toast.success('Welcome back!');
          navigate('/dashboard');
        }
      } else {
        // Handle pre-created admins if doc doesn't exist yet (first time)
        if (email === 'admin@hrpulse.com' || email === 'admin01@hrpulse.com') {
          await updateDoc(docRef, {
            uid: user.uid,
            username: username,
            name: username === 'admin' ? 'Super Admin' : 'Admin 01',
            email: email,
            role: 'admin',
            leaveBalance: 30,
            createdAt: new Date()
          });
          navigate('/dashboard');
        } else {
          toast.error('User profile not found');
        }
      }
    } catch (error: any) {
      toast.error('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="flex justify-center mb-10">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-200">
              <ShieldCheck size={36} />
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-center text-zinc-900 mb-2">HR</h1>
          <p className="text-zinc-500 text-center mb-10 font-medium">Enterprise Management Portal</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-medium"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-orange-100 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-b-white rounded-full animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              Sign In
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-50 text-center">
            <p className="text-xs text-zinc-400 font-medium">
              Protected by Enterprise Security. <br/>
              Contact HR if you've lost your access.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
