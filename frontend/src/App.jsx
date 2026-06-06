import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import useHistoryBack from './hooks/useHistoryBack';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

const AppRoutes = () => {
  useHistoryBack();

  return (
    <Routes>
      {/* Unified login page - all users login here, routed by JWT role */}
      <Route path="/" element={<Home />} />

      {/* Redirect old login routes to unified login */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/admin-login" element={<Navigate to="/" replace />} />
      <Route path="/teacher-login" element={<Navigate to="/" replace />} />
      <Route path="/student-login" element={<Navigate to="/" replace />} />

      {/* Protected Dashboard routes */}
      <Route path="/admin-dashboard/:tab?" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/teacher-dashboard/:tab?" element={
        <ProtectedRoute requiredRole="teacher">
          <TeacherDashboard />
        </ProtectedRoute>
      } />

      <Route path="/student-dashboard/:tab?" element={
        <ProtectedRoute requiredRole="student">
          <StudentDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;

