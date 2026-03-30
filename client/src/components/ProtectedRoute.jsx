import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, userType }) => {
  const userToken = localStorage.getItem('token');
  const providerToken = localStorage.getItem('providerToken');
  const storedUserType = localStorage.getItem('userType');

  // Check if user is logged in
  if (userType === 'user') {
    if (!userToken || storedUserType !== 'user') {
      return <Navigate to="/login" />;
    }
  }
  
  // Check if provider is logged in
  if (userType === 'provider') {
    if (!providerToken || storedUserType !== 'provider') {
      return <Navigate to="/login" />;
    }
  }

  return children;
};

export default ProtectedRoute;