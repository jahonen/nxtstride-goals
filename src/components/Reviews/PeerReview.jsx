// src/components/Reviews/PeerReview.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, Button, Container, Paper, Typography,
  TextField, Slider, Grid, Alert, Card, CardContent,
  CircularProgress, Divider
} from '@mui/material';

export default function PeerReview() {
  const { reviewId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [review, setReview] = useState(null);
  const [cycle, setCycle] = useState(null);
  
  // Form state
  const [autonomyText, setAutonomyText] = useState('');
  const [masteryText, setMasteryText] = useState('');
  const [purposeText, setPurposeText] = useState('');
  const [autonomyScore, setAutonomyScore] = useState(3);
  const [masteryScore, setMasteryScore] = useState(3);
  const [purposeScore, setPurposeScore] = useState(3);
  
  // Character limits
  const charLimit = 500;
  
  useEffect(() => {
    async function loadReviewData() {
      try {
        // Load the original review
        const reviewRef = doc(db, 'reviews', reviewId);
        const reviewSnap = await getDoc(reviewRef);
        
        if (!reviewSnap.exists()) {
          setError('Review not found');
          setLoading(false);
          return;
        }
        
        const reviewData = reviewSnap.data();
        
        // Check if current user is allowed to review
        if (!reviewData.peerReviewers.includes(currentUser.uid)) {
          setError('You are not authorized to review this submission');
          setLoading(false);
          return;
        }
        
        setReview({
          id: reviewSnap.id,
          ...reviewData
        });
        
        // Get the cycle information
        const cycleRef = doc(db, 'reviewCycles', reviewData.cycleId);
        const cycleSnap = await getDoc(cycleRef);
        
        if (cycleSnap.exists()) {
          setCycle({
            id: cycleSnap.id,
            ...cycleSnap.data()
          });
        }
        
        // Check if this user has already submitted feedback
        if (reviewData.peerFeedback) {
          const myFeedback = reviewData.peerFeedback.find(
            f => f.reviewerId === currentUser.uid
          );
          
          if (myFeedback) {
            // Pre-fill the form with existing feedback
            setAutonomyText(myFeedback.autonomyText || '');
            setMasteryText(myFeedback.masteryText || '');
            setPurposeText(myFeedback.purposeText || '');
            setAutonomyScore(myFeedback.autonomyScore || 3);
            setMasteryScore(myFeedback.masteryScore || 3);
            setPurposeScore(myFeedback.purposeScore || 3);
          }
        }
        
      } catch (err) {
        setError('Failed to load review data: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (currentUser && reviewId) {
      loadReviewData();
    }
  }, [currentUser, reviewId]);
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      
      const feedbackData = {
        reviewerId: currentUser.uid,
        reviewerName: currentUser.displayName,
        reviewerEmail: currentUser.email,
        autonomyText,
        masteryText,
        purposeText,
        autonomyScore,
        masteryScore,
        purposeScore,
        submittedAt: Timestamp.now()
      };
      
      const reviewRef = doc(db, 'reviews', reviewId);
      
      // Check if this user has already submitted feedback
      const reviewSnap = await getDoc(reviewRef);
      const reviewData = reviewSnap.data();
      
      if (reviewData.peerFeedback && 
          reviewData.peerFeedback.some(f => f.reviewerId === currentUser.uid)) {
        // Update existing feedback
        await updateDoc(reviewRef, {
          peerFeedback: reviewData.peerFeedback.map(f => 
            f.reviewerId === currentUser.uid ? feedbackData : f
          ),
          updatedAt: Timestamp.now()
        });
      } else {
        // Add new feedback
        await updateDoc(reviewRef, {
          peerFeedback: arrayUnion(feedbackData),
          updatedAt: Timestamp.now()
        });
      }
      
      setSuccess('Peer feedback submitted successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError('Failed to submit feedback: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error === 'You are not authorized to review this submission') {
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
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Peer Review for {review?.userName || 'Colleague'}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {cycle?.name || review?.cycleId || 'Review Cycle'}
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {/* Self-Assessment Summary */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Self-Assessment Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Autonomy</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {review?.autonomyText || 'No self-assessment provided'}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Self-score: {review?.autonomyScore || 'N/A'}/4
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Mastery</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {review?.masteryText || 'No self-assessment provided'}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Self-score: {review?.masteryScore || 'N/A'}/4
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Purpose</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {review?.purposeText || 'No self-assessment provided'}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Self-score: {review?.purposeScore || 'N/A'}/4
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
        </Box>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Autonomy Section */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Autonomy</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Provide feedback on how this person has demonstrated self-direction and independence.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder="Provide autonomy feedback..."
                    value={autonomyText}
                    onChange={(e) => setAutonomyText(e.target.value)}
                    inputProps={{ maxLength: charLimit }}
                    helperText={`${autonomyText.length}/${charLimit} characters`}
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography gutterBottom>Rating</Typography>
                  <Slider
                    value={autonomyScore}
                    onChange={(e, newValue) => setAutonomyScore(newValue)}
                    step={1}
                    marks
                    min={1}
                    max={4}
                    valueLabelDisplay="on"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">Low alignment</Typography>
                    <Typography variant="caption">Full alignment</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Mastery Section */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Mastery</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Provide feedback on how this person has improved their skills and expertise.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder="Provide mastery feedback..."
                    value={masteryText}
                    onChange={(e) => setMasteryText(e.target.value)}
                    inputProps={{ maxLength: charLimit }}
                    helperText={`${masteryText.length}/${charLimit} characters`}
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography gutterBottom>Rating</Typography>
                  <Slider
                    value={masteryScore}
                    onChange={(e, newValue) => setMasteryScore(newValue)}
                    step={1}
                    marks
                    min={1}
                    max={4}
                    valueLabelDisplay="on"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">Low alignment</Typography>
                    <Typography variant="caption">Full alignment</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Purpose Section */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Purpose</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Provide feedback on how this person's work aligns with the company mission.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder="Provide purpose feedback..."
                    value={purposeText}
                    onChange={(e) => setPurposeText(e.target.value)}
                    inputProps={{ maxLength: charLimit }}
                    helperText={`${purposeText.length}/${charLimit} characters`}
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography gutterBottom>Rating</Typography>
                  <Slider
                    value={purposeScore}
                    onChange={(e, newValue) => setPurposeScore(newValue)}
                    step={1}
                    marks
                    min={1}
                    max={4}
                    valueLabelDisplay="on"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">Low alignment</Typography>
                    <Typography variant="caption">Full alignment</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                type="submit" 
                variant="contained" 
                size="large"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Submit Feedback'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}