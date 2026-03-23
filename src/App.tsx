import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CalendarPage from './pages/Calendar';
import ResetPassword from './pages/ResetPassword';
import Attendance from './pages/Attendance';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/employees" element={<AdminDashboard />} />
          <Route path="/admin/leaves" element={<AdminDashboard />} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
