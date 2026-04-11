import { Navigate } from 'react-router-dom';

// Protects routes by checking if a token exists and if the role matches
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  if (!token || !userString) {
    // If not logged in, redirect to login selection page
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userString);
  
  if (requiredRole && user.role !== requiredRole) {
    // If logged in but wrong role, redirect to their own dashboard
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;
  }

  // If everything checks out, render the allowed component
  return children;
};

export default ProtectedRoute;
