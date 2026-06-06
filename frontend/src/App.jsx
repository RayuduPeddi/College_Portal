import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

// Main Application Component
function App() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Redirect unified Login route to Home page */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        
        {/* Redirect old login routes to unified login */}
        <Route path="/admin-login" element={<Navigate to="/login" replace />} />
        <Route path="/teacher-login" element={<Navigate to="/login" replace />} />
        <Route path="/student-login" element={<Navigate to="/login" replace />} />

        {/* Protected Dashboard routes */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/teacher-dashboard" element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/student-dashboard" element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />

      </Routes>
    </Router>
  );
}

export default App;

