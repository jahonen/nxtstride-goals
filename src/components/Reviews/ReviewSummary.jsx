// src/components/Reviews/ReviewSummary.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, Container, Paper, Typography, Grid, Card, CardContent,
  Divider, CircularProgress, Alert, Button, Avatar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';

export default function ReviewSummary() {
  const { reviewId } = useParams();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [review, setReview] = useState(null);
  const [cycle, setCycle] = useState(null);
  
  useEffect(() => {
    async function loadReviewData() {
      try {
        // Load the review
        const reviewRef = doc(db, 'reviews', reviewId);
        const reviewSnap = await getDoc(reviewRef);
        
        if (!reviewSnap.exists()) {
          setError('Review not found');
          setLoading(false);
          return;
        }
        
        const reviewData = reviewSnap.data();
        
        // Check if current user has permission to view this review
        const isOwner = reviewData.userId === currentUser.uid;
        const isReviewer = reviewData.peerReviewers.includes(currentUser.uid);
        const isManager = userRole === 'manager' || userRole === 'admin';
        
        if (!isOwner && !isReviewer && !isManager) {
          setError('You do not have permission to view this review');
          setLoading(false);
          return;
        }
        
        setReview({
          id: reviewSnap.id,
          ...reviewData
        });
        
        // Get the cycle information
        if (reviewData.cycleId) {
          const cycleRef = doc(db, 'reviewCycles', reviewData.cycleId);
          const cycleSnap = await getDoc(cycleRef);
          
          if (cycleSnap.exists()) {
            setCycle({
              id: cycleSnap.id,
              ...cycleSnap.data()
            });
          }
        }
        
      } catch (err) {
        setError('Failed to load review: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (currentUser && reviewId) {
      loadReviewData();
    }
  }, [currentUser, reviewId, userRole]);
  
  // Calculate average scores
  const calculateAverages = () => {
    if (!review || !review.peerFeedback || review.peerFeedback.length === 0) {
      return {
        autonomy: review?.autonomyScore || 0,
        mastery: review?.masteryScore || 0,
        purpose: review?.purposeScore || 0
      };
    }
    
    const autonomySum = review.peerFeedback.reduce((sum, feedback) => sum + (feedback.autonomyScore || 0), 0);
    const masterySum = review.peerFeedback.reduce((sum, feedback) => sum + (feedback.masteryScore || 0), 0);
    const purposeSum = review.peerFeedback.reduce((sum, feedback) => sum + (feedback.purposeScore || 0), 0);
    
    return {
      autonomy: (autonomySum / review.peerFeedback.length).toFixed(1),
      mastery: (masterySum / review.peerFeedback.length).toFixed(1),
      purpose: (purposeSum / review.peerFeedback.length).toFixed(1)
    };
  };
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }
  
  const averageScores = calculateAverages();
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Performance Review Summary
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Employee:</strong> {review?.userName || 'N/A'}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Review Cycle:</strong> {cycle?.name || review?.cycleName || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Submitted:</strong> {formatDate(review?.createdAt)}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Status:</strong> {review?.status || 'Submitted'}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Score Summary */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Score Summary
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Autonomy</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
                  <Typography variant="h3" color="primary">{averageScores.autonomy}</Typography>
                  <Typography variant="body2" sx={{ ml: 1 }}>/4</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Self: {review?.autonomyScore || 'N/A'}</Typography>
                  <Typography variant="body2">
                    Peers: {(review?.peerFeedback?.length > 0 ? 
                      (review.peerFeedback.reduce((sum, f) => sum + (f.autonomyScore || 0), 0) / 
                      review.peerFeedback.length).toFixed(1) : 'N/A')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Mastery</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
                  <Typography variant="h3" color="primary">{averageScores.mastery}</Typography>
                  <Typography variant="body2" sx={{ ml: 1 }}>/4</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Self: {review?.masteryScore || 'N/A'}</Typography>
                  <Typography variant="body2">
                    Peers: {(review?.peerFeedback?.length > 0 ? 
                      (review.peerFeedback.reduce((sum, f) => sum + (f.masteryScore || 0), 0) / 
                      review.peerFeedback.length).toFixed(1) : 'N/A')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Purpose</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
                  <Typography variant="h3" color="primary">{averageScores.purpose}</Typography>
                  <Typography variant="body2" sx={{ ml: 1 }}>/4</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Self: {review?.purposeScore || 'N/A'}</Typography>
                  <Typography variant="body2">
                    Peers: {(review?.peerFeedback?.length > 0 ? 
                      (review.peerFeedback.reduce((sum, f) => sum + (f.purposeScore || 0), 0) / 
                      review.peerFeedback.length).toFixed(1) : 'N/A')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Self-Assessment */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1 }} /> Self-Assessment
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Autonomy</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {review?.autonomyText || 'No assessment provided'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Mastery</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {review?.masteryText || 'No assessment provided'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Purpose</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {review?.purposeText || 'No assessment provided'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
        
        {/* Peer Feedback */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <PeopleIcon sx={{ mr: 1 }} /> Peer Feedback
          </Typography>
          
          {!review?.peerFeedback || review.peerFeedback.length === 0 ? (
            <Alert severity="info">No peer feedback has been submitted yet.</Alert>
          ) : (
            review.peerFeedback.map((feedback, index) => (
              <Card key={index} sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      {feedback.reviewerName?.charAt(0) || 'P'}
                    </Avatar>
                    <Typography variant="subtitle1">
                      {feedback.reviewerName || 'Peer Reviewer'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        Autonomy: {feedback.autonomyScore}/4
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feedback.autonomyText || 'No feedback provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        Mastery: {feedback.masteryScore}/4
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feedback.masteryText || 'No feedback provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        Purpose: {feedback.purposeScore}/4
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feedback.purposeText || 'No feedback provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
        {review.managerFeedback && (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
      <AdminPanelSettingsIcon sx={{ mr: 1 }} /> Manager Feedback
    </Typography>
    
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
            {review.managerFeedback.managerName?.charAt(0) || 'M'}
          </Avatar>
          <Typography variant="subtitle1">
            {review.managerFeedback.managerName || 'Manager'}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Autonomy: {review.managerFeedback.autonomyScore}/4
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {review.managerFeedback.autonomyText || 'No feedback provided'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Mastery: {review.managerFeedback.masteryScore}/4
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {review.managerFeedback.masteryText || 'No feedback provided'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Purpose: {review.managerFeedback.purposeScore}/4
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {review.managerFeedback.purposeText || 'No feedback provided'}
            </Typography>
          </Grid>
        </Grid>
        
        {review.managerFeedback.summaryFeedback && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Overall Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {review.managerFeedback.summaryFeedback}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  </Box>
)}
      </Paper>
    </Container>
  );
}