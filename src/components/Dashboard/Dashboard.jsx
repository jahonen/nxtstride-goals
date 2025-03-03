// src/components/Dashboard/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, query, where, getDocs, orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  AppBar, Box, Button, Container, Toolbar, Typography,
  Paper, Grid, Card, CardContent, CardActions,
  List, ListItem, ListItemIcon, ListItemText,
  Divider, Alert, Link
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser, userRole, logout } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCycles, setActiveCycles] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch active review cycles
        const cyclesQuery = query(
          collection(db, 'reviewCycles'),
          where('status', '==', 'active'),
          orderBy('selfReviewDue')
        );
        
        const cyclesSnapshot = await getDocs(cyclesQuery);
        const cyclesList = cyclesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setActiveCycles(cyclesList);
        
        // Fetch pending reviews for this user
        const today = new Date();
        
        // Self-reviews that need to be completed
        const selfReviewsQuery = query(
          collection(db, 'reviews'),
          where('userId', '==', currentUser.uid),
        );
        
        const selfReviewsSnapshot = await getDocs(selfReviewsQuery);
        const selfReviewsList = selfReviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'self'
        }));
        
        // Peer reviews assigned to this user
        const peerReviewsQuery = query(
          collection(db, 'reviews'),
          where('peerReviewers', 'array-contains', currentUser.uid)
        );
        
        const peerReviewsSnapshot = await getDocs(peerReviewsQuery);
        const peerReviewsList = peerReviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'peer'
        }));
        
        // Combine all pending reviews
        setPendingReviews([...selfReviewsList, ...peerReviewsList]);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data: ' + err.message);
        setLoading(false);
      }
    }
    
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      setError('Failed to log out');
    }
  }
  
  // Format date for display
  function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleDateString();
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            NxtStride Goals
          </Typography>
          {userRole === 'manager' && (
            <Button 
              color="inherit" 
              startIcon={<AdminPanelSettingsIcon />}
              component={RouterLink}
              to="/admin"
              sx={{ mr: 2 }}
            >
              Admin
            </Button>
          )}
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      
      <Container sx={{ mt: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome, {currentUser?.displayName}
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {/* Action Items */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 1 }} /> Action Items
              </Typography>
              
              {loading ? (
                <Typography>Loading...</Typography>
              ) : pendingReviews.length === 0 ? (
                <Typography>You don't have any pending reviews at the moment.</Typography>
              ) : (
                <List>
                  {pendingReviews.map((review) => (
                    <ListItem 
                      key={review.id}
                      component={RouterLink}
                      to={review.type === 'self' 
                        ? `/review/${review.cycleId}` 
                        : `/peer-review/${review.id}`
                      }
                      button
                    >
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={review.type === 'self' 
                          ? `Complete your self-review for ${review.cycleName || review.cycleId}` 
                          : `Provide peer feedback for ${review.userName || 'a colleague'}`
                        }
                        secondary={review.status || 'Pending'}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
          
          {/* Active Review Cycles */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon sx={{ mr: 1 }} /> Active Review Cycles
              </Typography>
              
              {loading ? (
                <Typography>Loading...</Typography>
              ) : activeCycles.length === 0 ? (
                <Typography>There are no active review cycles at the moment.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {activeCycles.map((cycle) => (
                    <Grid item xs={12} key={cycle.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {cycle.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Self-Review Due: {formatDate(cycle.selfReviewDue)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Peer Review Due: {formatDate(cycle.peerReviewDue)}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            component={RouterLink}
                            to={`/review/${cycle.id}`}
                          >
                            Go to Self-Review
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}