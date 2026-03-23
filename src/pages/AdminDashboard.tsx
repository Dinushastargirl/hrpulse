import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, onSnapshot, updateDoc, doc, deleteDoc, 
  orderBy, getDocs, addDoc, serverTimestamp, Timestamp, where, setDoc 
} from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, FileText, CheckCircle, XCircle, AlertTriangle, 
  Search, Plus, Trash2, UserPlus, Mail, Briefcase, 
  TrendingUp, Clock, Calendar as CalendarIcon
} from 'lucide-react';
import { LeaveRequest, UserProfile } from '../types';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'employees'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/admin/leaves') setActiveTab('requests');
    else if (location.pathname === '/admin/employees') setActiveTab('employees');
    else setActiveTab('overview');
  }, [location.pathname]);

  const handleTabChange = (tab: 'overview' | 'requests' | 'employees') => {
    if (tab === 'overview') navigate('/admin');
    else if (tab === 'requests') navigate('/admin/leaves');
    else navigate('/admin/employees');
  };
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Employee Form
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpUsername, setNewEmpUsername] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const demoUserStr = localStorage.getItem('hr_pulse_demo_user');
    const demoUser = demoUserStr ? JSON.parse(demoUserStr) : null;

    if (!db && !demoUser) return; // Should not happen if db is initialized

    if (demoUser) {
      setRequests([]);
      setEmployees([demoUser]);
      setLoading(false);
      return;
    }

    const qRequests = query(collection(db, 'leaveRequests'), orderBy('createdAt', 'desc'));
    const unsubRequests = onSnapshot(qRequests, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })) as LeaveRequest[]);
    });

    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setEmployees(snap.docs.map(d => d.data() as UserProfile));
      setLoading(false);
    });

    return () => {
      unsubRequests();
      unsubUsers();
    };
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const email = newEmpEmail || `${newEmpUsername}@hrpulse.com`;
      const mockUid = `user_${Date.now()}`;
      await setDoc(doc(db, 'users', email), {
        uid: mockUid,
        username: newEmpUsername,
        name: newEmpName,
        email: email,
        department: newEmpDept,
        role: 'employee',
        leaveBalance: 24,
        mustResetPassword: true,
        createdAt: serverTimestamp(),
      });
      toast.success('Employee added! Temporary password: 123456');
      setIsAddModalOpen(false);
      setNewEmpName('');
      setNewEmpUsername('');
      setNewEmpEmail('');
      setNewEmpDept('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await updateDoc(doc(db, 'leaveRequests', id), { status });
      toast.success(`Request ${status.toLowerCase()} successfully`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteEmployee = async (uid: string) => {
    if (!confirm('Are you sure you want to remove this employee?')) return;
    try {
      // Find doc with this uid
      const q = query(collection(db, 'users'), where('uid', '==', uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await deleteDoc(doc(db, 'users', snap.docs[0].id));
        toast.success('Employee removed');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const stats = [
    { label: 'Total Employees', value: employees.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Leaves', value: requests.filter(r => r.status === 'Pending').length, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved Today', value: requests.filter(r => r.status === 'Approved').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Urgent Cases', value: requests.filter(r => r.isUrgent).length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const chartData = [
    { name: 'Jan', count: 4 },
    { name: 'Feb', count: 7 },
    { name: 'Mar', count: employees.length },
  ];

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRequests = requests.filter(r => 
    r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.leaveType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Admin Control</h1>
          <p className="text-zinc-500 font-medium">Manage your workforce and operations</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
        >
          <UserPlus size={20} />
          Add Employee
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg)}>
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-zinc-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-zinc-100/50 rounded-2xl w-fit">
        {['overview', 'requests', 'employees'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab as any)}
            className={cn(
              "px-8 py-2.5 rounded-xl text-sm font-bold capitalize transition-all",
              activeTab === tab ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
            <h3 className="text-lg font-black text-zinc-900 mb-8 flex items-center gap-2">
              <TrendingUp size={20} className="text-orange-500" />
              Hiring Growth
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                  <Tooltip cursor={{ fill: '#fff7ed' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#ff8c00" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
            <h3 className="text-lg font-black text-zinc-900 mb-6 flex items-center gap-2">
              <Clock size={20} className="text-orange-500" />
              Recent Activity
            </h3>
            <div className="space-y-6">
              {requests.slice(0, 4).map(req => (
                <div key={req.id} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 font-bold text-xs">
                    {req.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{req.userName}</p>
                    <p className="text-xs text-zinc-500 font-medium">Applied for {req.leaveType}</p>
                    <p className="text-[10px] text-zinc-400 font-bold mt-1">{formatDate(req.createdAt.toDate())}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'requests' || activeTab === 'employees') && (
        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-zinc-900 capitalize">{activeTab} Management</h2>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            {activeTab === 'requests' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50">
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Employee</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Leave Info</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-sm">
                            {request.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{request.userName}</p>
                            {request.isUrgent && <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter">Urgent</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-zinc-900">{request.leaveType}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          {formatDate(request.startDate.toDate())} - {formatDate(request.endDate.toDate())}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          request.status === 'Approved' ? "bg-green-50 text-green-700 border-green-100" :
                          request.status === 'Rejected' ? "bg-red-50 text-red-700 border-red-100" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {request.status}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right space-x-2">
                        {request.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(request.id!, 'Approved')}
                              className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                              title="Approve"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(request.id!, 'Rejected')}
                              className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Reject"
                            >
                              <XCircle size={20} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50">
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Employee</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Username</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Department</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.uid} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm">
                            {employee.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{employee.name}</p>
                            <p className="text-xs text-zinc-400 font-medium">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-zinc-700">@{employee.username}</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {employee.department || 'General'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => deleteEmployee(employee.uid)}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                <h2 className="text-2xl font-black text-zinc-900">Add New Employee</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-xl transition-all">
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleAddEmployee} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Username</label>
                    <input
                      type="text"
                      required
                      value={newEmpUsername}
                      onChange={(e) => setNewEmpUsername(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-medium"
                      placeholder="jdoe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Department</label>
                    <input
                      type="text"
                      required
                      value={newEmpDept}
                      onChange={(e) => setNewEmpDept(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-medium"
                      placeholder="Engineering"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={newEmpEmail}
                    onChange={(e) => setNewEmpEmail(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="jdoe@company.com"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-orange-500 text-white px-6 py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
