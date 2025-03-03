// src/components/Dashboard/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, query, where, getDocs, orderBy, Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Box, Button, Container, Typography,
  Paper, Grid, Card, CardContent, CardActions,
  List, ListItem, ListItemIcon, ListItemText,
  Divider, Alert, Chip, Avatar, Tab, Tabs
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import Reminders from './Reminders';

export default function Dashboard() {
  const { currentUser, userRole } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCycles, setActiveCycles] = useState([]);
  const [selfReviews, setSelfReviews] = useState([]);
  const [peerReviews, setPeerReviews] = useState([]);
  const [completedReviews, setCompletedReviews] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch active review cycles
        const cyclesQuery = query(
          collection(db, 'reviewCycles'),
          where('status', '==', 'active'),
          orderBy('selfReviewDue', 'desc')
        );
        
        const cyclesSnapshot = await getDocs(cyclesQuery);
        const cyclesList = cyclesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setActiveCycles(cyclesList);
        
        // Fetch self-reviews by this user
        const selfReviewsQuery = query(
          collection(db, 'reviews'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const selfReviewsSnapshot = await getDocs(selfReviewsQuery);
        const selfReviewsList = selfReviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setSelfReviews(selfReviewsList);
        
        // Fetch peer reviews assigned to this user
        const peerReviewsQuery = query(
          collection(db, 'reviews'),
          where('peerReviewers', 'array-contains', currentUser.uid)
        );
        
        const peerReviewsSnapshot = await getDocs(peerReviewsQuery);
        const peerReviewsList = peerReviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter out already completed peer reviews
        const pendingPeerReviews = peerReviewsList.filter(review => {
          // Check if this user has already submitted feedback
          if (!review.peerFeedback) return true;
          
          return !review.peerFeedback.some(
            feedback => feedback.reviewerId === currentUser.uid
          );
        });
        
        // Get completed peer reviews
        const completed = peerReviewsList.filter(review => {
          if (!review.peerFeedback) return false;
          
          return review.peerFeedback.some(
            feedback => feedback.reviewerId === currentUser.uid
          );
        });
        
        setPeerReviews(pendingPeerReviews);
        setCompletedReviews(completed);
        
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

  // Format date for display
  function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  }
  
  // Check if a due date is approaching (within 7 days)
  function isApproaching(timestamp) {
    if (!timestamp) return false;
    try {
      const dueDate = timestamp.toDate();
      const now = new Date();
      const diffTime = dueDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    } catch (e) {
      return false;
    }
  }
  
  // Check if a due date is overdue
  function isOverdue(timestamp) {
    if (!timestamp) return false;
    try {
      const dueDate = timestamp.toDate();
      const now = new Date();
      return dueDate < now;
    } catch (e) {
      return false;
    }
  }
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {currentUser?.displayName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your performance reviews and feedback here.
        </Typography>
      </Box>

      <Reminders />
      
      <Grid container spacing={4}>
        {/* Active Review Cycles */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <EventIcon sx={{ mr: 1 }} /> Active Review Cycles
            </Typography>
            
            {loading ? (
              <Typography>Loading...</Typography>
            ) : activeCycles.length === 0 ? (
              <Typography>There are no active review cycles at the moment.</Typography>
            ) : (
              <Box>
                {activeCycles.map((cycle) => (
                  <Card key={cycle.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="h6" component="div">
                        {cycle.name}
                      </Typography>
                      
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" 
                          sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          Self-Review Due: {formatDate(cycle.selfReviewDue)}
                          {isOverdue(cycle.selfReviewDue) && (
                            <Chip 
                              label="Overdue" 
                              size="small" 
                              color="error" 
                              sx={{ ml: 1 }} 
                            />
                          )}
                          {isApproaching(cycle.selfReviewDue) && !isOverdue(cycle.selfReviewDue) && (
                            <Chip 
                              label="Soon" 
                              size="small" 
                              color="warning" 
                              sx={{ ml: 1 }} 
                            />
                          )}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary"
                          sx={{ display: 'flex', alignItems: 'center' }}>
                          Peer Review Due: {formatDate(cycle.peerReviewDue)}
                          {isOverdue(cycle.peerReviewDue) && (
                            <Chip 
                              label="Overdue" 
                              size="small" 
                              color="error" 
                              sx={{ ml: 1 }} 
                            />
                          )}
                          {isApproaching(cycle.peerReviewDue) && !isOverdue(cycle.peerReviewDue) && (
                            <Chip 
                              label="Soon" 
                              size="small"
                              color="warning" 
                              sx={{ ml: 1 }} 
                            />
                          )}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <Button 
                        size="small" 
                        component={RouterLink}
                        to={`/review/${cycle.id}`}
                      >
                        {selfReviews.some(r => r.cycleId === cycle.id) ? 'View' : 'Start'} Self-Review
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Pending Tasks */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssignmentIcon sx={{ mr: 1 }} /> My Reviews
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="review tabs">
                <Tab 
                  icon={<PersonIcon />} 
                  label="Self Reviews" 
                  id="tab-0" 
                  aria-controls="tabpanel-0" 
                />
                <Tab 
                  icon={<PeopleIcon />} 
                  label={`Peer Reviews (${peerReviews.length})`} 
                  id="tab-1" 
                  aria-controls="tabpanel-1" 
                />
                <Tab 
                  icon={<CheckCircleIcon />} 
                  label="Completed" 
                  id="tab-2"
                  aria-controls="tabpanel-2" 
                />
              </Tabs>
            </Box>
            
            <Box
              role="tabpanel"
              hidden={tabValue !== 0}
              id="tabpanel-0"
              aria-labelledby="tab-0"
            >
              {tabValue === 0 && (
                loading ? (
                  <Typography>Loading...</Typography>
                ) : selfReviews.length === 0 ? (
                  <Alert severity="info">
                    You have not submitted any self-reviews yet. When there's an active review cycle, 
                    you can complete your self-review from the Active Review Cycles section.
                  </Alert>
                ) : (
                  <List>
                    {selfReviews.map((review) => (
                      <ListItem 
                        key={review.id}
                        sx={{ 
                          border: '1px solid #e0e0e0', 
                          borderRadius: 1, 
                          mb: 1 
                        }}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={`Self-Review: ${review.cycleName || review.cycleId}`}
                          secondary={`Submitted: ${formatDate(review.createdAt)}`}
                        />
                        <Button 
                          component={RouterLink}
                          to={`/summary/${review.id}`}
                          variant="outlined"
                          size="small"
                        >
                          View Summary
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                )
              )}
            </Box>
            
            <Box
              role="tabpanel"
              hidden={tabValue !== 1}
              id="tabpanel-1"
              aria-labelledby="tab-1"
            >
              {tabValue === 1 && (
                loading ? (
                  <Typography>Loading...</Typography>
                ) : peerReviews.length === 0 ? (
                  <Alert severity="info">
                    You don't have any pending peer reviews at the moment.
                  </Alert>
                ) : (
                  <List>
                    {peerReviews.map((review) => (
                      <ListItem 
                        key={review.id}
                        sx={{ 
                          border: '1px solid #e0e0e0', 
                          borderRadius: 1, 
                          mb: 1 
                        }}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <PeopleIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={`Review ${review.userName || 'a colleague'}`}
                          secondary={`Cycle: ${review.cycleName || review.cycleId}`}
                        />
                        <Button 
                          component={RouterLink}
                          to={`/peer-review/${review.id}`}
                          variant="contained"
                          size="small"
                        >
                          Provide Feedback
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                )
              )}
            </Box>
            
            <Box
              role="tabpanel"
              hidden={tabValue !== 2}
              id="tabpanel-2"
              aria-labelledby="tab-2"
            >
              {tabValue === 2 && (
                loading ? (
                  <Typography>Loading...</Typography>
                ) : completedReviews.length === 0 ? (
                  <Alert severity="info">
                    You have not completed any peer reviews yet.
                  </Alert>
                ) : (
                  <List>
                    {completedReviews.map((review) => (
                      <ListItem 
                        key={review.id}
                        sx={{ 
                          border: '1px solid #e0e0e0', 
                          borderRadius: 1, 
                          mb: 1 
                        }}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <CheckCircleIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={`Reviewed ${review.userName || 'a colleague'}`}
                          secondary={`Cycle: ${review.cycleName || review.cycleId}`}
                        />
                        <Button 
                          component={RouterLink}
                          to={`/summary/${review.id}`}
                          variant="outlined"
                          size="small"
                        >
                          View Summary
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                )
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}