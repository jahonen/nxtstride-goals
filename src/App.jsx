import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import SelfReview from './components/Reviews/SelfReview';
import AdminPanel from './components/Admin/AdminPanel';
import Navbar from './components/common/Navbar';
import PeerReview from './components/Reviews/PeerReview';

function App() {
  const theme = createTheme({
    palette: {
      primary: {
        main: '#4285F4', // Google blue
      },
      secondary: {
        main: '#34A853', // Google green
      },
    },
  });

  // Component to wrap all private pages with common elements
  const PrivateLayout = ({ children }) => (
    <>
      <Navbar />
      {children}
    </>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <PrivateLayout>
                    <Dashboard />
                  </PrivateLayout>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/review/:cycleId" 
              element={
                <PrivateRoute>
                  <PrivateLayout>
                    <SelfReview />
                  </PrivateLayout>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <PrivateRoute>
                  <PrivateLayout>
                    <AdminPanel />
                  </PrivateLayout>
                </PrivateRoute>
              } 
            />

            <Route 
              path="/peer-review/:reviewId" 
              element={
                <PrivateRoute>
                  <PrivateLayout>
                    <PeerReview />
                  </PrivateLayout>
                </PrivateRoute>
              } 
            />
            
            {/* Redirect all other routes to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;