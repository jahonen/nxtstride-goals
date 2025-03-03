// src/components/Manager/TeamView.jsx
import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, query, getDocs, orderBy, where 
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, Container, Typography, Paper, Button,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Alert
} from '@mui/material';

export default function TeamView() {
  const { userRole } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Only managers can access this page
    if (userRole !== 'manager' && userRole !== 'admin') {
      setError('You do not have permission to access this page');
      setLoading(false);
      return;
    }
    
    async function fetchTeamReviews() {
      try {
        // Get all reviews that have been submitted
        const reviewsQuery = query(
          collection(db, 'reviews'),
          orderBy('updatedAt', 'desc')
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsList = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setReviews(reviewsList);
        setLoading(false);
      } catch (err) {
        setError('Failed to load team reviews: ' + err.message);
        setLoading(false);
      }
    }
    
    fetchTeamReviews();
  }, [userRole]);
  
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
  
  // Get review status
  function getReviewStatus(review) {
    if (!review) return { label: 'Unknown', color: 'default' };
    
    if (review.status === 'completed') {
      return { label: 'Completed', color: 'success' };
    }
    
    if (review.managerFeedback) {
      return { label: 'Manager Reviewed', color: 'success' };
    }
    
    const peerFeedbackCount = review.peerFeedback ? review.peerFeedback.length : 0;
    const totalPeerReviewers = review.peerReviewers ? review.peerReviewers.length : 0;
    
    if (peerFeedbackCount === totalPeerReviewers) {
      return { label: 'Ready for Manager', color: 'warning' };
    } else if (peerFeedbackCount > 0) {
      return { label: `Peer Review (${peerFeedbackCount}/${totalPeerReviewers})`, color: 'info' };
    } else {
      return { label: 'Self-Review Only', color: 'primary' };
    }
  }
  
  if (loading) {
    return <Container><Typography>Loading...</Typography></Container>;
  }
  
  if (userRole !== 'manager' && userRole !== 'admin') {
    return (
      <Container>
        <Alert severity="error">You do not have permission to access this page</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Team Reviews
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage team member performance reviews
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Review Cycle</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No reviews found.
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => {
                  const status = getReviewStatus(review);
                  
                  return (
                    <TableRow key={review.id}>
                      <TableCell>{review.userName || 'Unknown'}</TableCell>
                      <TableCell>{review.cycleName || review.cycleId}</TableCell>
                      <TableCell>{formatDate(review.createdAt)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={status.label} 
                          color={status.color} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          component={RouterLink}
                          to={`/summary/${review.id}`}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          View
                        </Button>
                        
                        {status.label === 'Ready for Manager' && (
                          <Button
                            component={RouterLink}
                            to={`/manager-review/${review.id}`}
                            variant="contained"
                            size="small"
                            color="primary"
                          >
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}