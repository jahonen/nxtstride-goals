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
import ReviewSummary from './components/Reviews/ReviewSummary';
import ManagerReview from './components/Reviews/ManagerReview';
import TeamView from './components/Manager/TeamView';
import AnalyticsDashboard from './components/Manager/AnalyticsDashboard';

import './styles/main.css';

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
      <div className="main-container">
        {children}
      </div>
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

            <Route 
              path="/summary/:reviewId" 
              element={
                <PrivateRoute>
                  <PrivateLayout>
                    <ReviewSummary />
                  </PrivateLayout>
                </PrivateRoute>
              } 
            />

            <Route 
              path="/manager-review/:reviewId" 
              element={
                <PrivateRoute>
                  <PrivateLayout>
                    <ManagerReview />
                  </PrivateLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/team" 
              element={
                <PrivateRoute>
                  <PrivateLayout>
                    <TeamView />
                  </PrivateLayout>
                </PrivateRoute>
              } 
            />

            <Route 
              path="/analytics" 
              element={
                <PrivateRoute>
                  <PrivateLayout>
                    <AnalyticsDashboard />
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