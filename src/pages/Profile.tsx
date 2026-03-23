import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, updateProfile } from 'firebase/auth';
import { toast } from 'sonner';
import { User, Mail, Briefcase, Shield, KeyRound, Camera, Save, UserCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const demoUserStr = localStorage.getItem('hr_pulse_demo_user');
    const demoUser = demoUserStr ? JSON.parse(demoUserStr) : null;

    if (!auth.currentUser && !demoUser) return;

    if (demoUser && !auth.currentUser) {
      setUser(demoUser);
      setName(demoUser.name);
      setDepartment(demoUser.department || '');
      setProfilePic(demoUser.profilePic || '');
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      const docSnap = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        setUser(userData);
        setName(userData.name);
        setDepartment(userData.department || '');
        setProfilePic(userData.profilePic || '');
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name,
        department,
        profilePic
      });
      await updateProfile(auth.currentUser, { displayName: name, photoURL: profilePic });
      toast.success('Profile updated successfully');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (!auth.currentUser) return;

    setSubmitting(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading profile...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-zinc-900">My Profile</h1>
        <p className="text-zinc-500 font-medium">Manage your personal information and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-[2rem] bg-orange-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                {profilePic ? (
                  <img src={profilePic} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-orange-300" />
                )}
              </div>
              <button className="absolute bottom-[-10px] right-[-10px] p-3 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 transition-all shadow-lg">
                <Camera size={18} />
              </button>
            </div>
            <h2 className="text-xl font-black text-zinc-900">{name}</h2>
            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mt-1">@{user?.username}</p>
            <div className="mt-8 pt-8 border-t border-zinc-50 space-y-4 text-left">
              <div className="flex items-center gap-3 text-zinc-500">
                <Mail size={18} />
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <Briefcase size={18} />
                <span className="text-sm font-medium">{department || 'General'}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <Shield size={18} />
                <span className="text-sm font-medium capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
            <h3 className="text-lg font-black text-zinc-900 mb-8 flex items-center gap-2">
              <UserCircle size={20} className="text-orange-500" />
              General Information
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Profile Picture URL</label>
                <input
                  type="url"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-medium"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={20} />
                Save Changes
              </button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
            <h3 className="text-lg font-black text-zinc-900 mb-8 flex items-center gap-2">
              <KeyRound size={20} className="text-orange-500" />
              Security Settings
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-100 flex items-center gap-2 disabled:opacity-50"
              >
                <KeyRound size={20} />
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
