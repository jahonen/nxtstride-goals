// src/components/Reviews/ManagerReview.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  doc, getDoc, updateDoc, Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, Button, Container, Paper, Typography,
  TextField, Slider, Grid, Alert, Card, CardContent,
  CircularProgress, Divider, Avatar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function ManagerReview() {
  const { reviewId } = useParams();
  const { currentUser, userRole } = useAuth();
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
  const [summaryFeedback, setSummaryFeedback] = useState('');
  
  // Character limits
  const charLimit = 500;
  
  useEffect(() => {
    async function loadReviewData() {
      try {
        // Check if user is a manager
        if (userRole !== 'manager' && userRole !== 'admin') {
          setError('You do not have permission to access this page');
          setLoading(false);
          return;
        }
        
        // Load the review
        const reviewRef = doc(db, 'reviews', reviewId);
        const reviewSnap = await getDoc(reviewRef);
        
        if (!reviewSnap.exists()) {
          setError('Review not found');
          setLoading(false);
          return;
        }
        
        const reviewData = reviewSnap.data();
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
        
        // Pre-fill form with existing manager feedback if it exists
        if (reviewData.managerFeedback) {
          setAutonomyText(reviewData.managerFeedback.autonomyText || '');
          setMasteryText(reviewData.managerFeedback.masteryText || '');
          setPurposeText(reviewData.managerFeedback.purposeText || '');
          setAutonomyScore(reviewData.managerFeedback.autonomyScore || 3);
          setMasteryScore(reviewData.managerFeedback.masteryScore || 3);
          setPurposeScore(reviewData.managerFeedback.purposeScore || 3);
          setSummaryFeedback(reviewData.managerFeedback.summaryFeedback || '');
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
  }, [currentUser, reviewId, userRole]);
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      
      const managerFeedback = {
        managerId: currentUser.uid,
        managerName: currentUser.displayName,
        autonomyText,
        masteryText,
        purposeText,
        autonomyScore,
        masteryScore,
        purposeScore,
        summaryFeedback,
        submittedAt: Timestamp.now()
      };
      
      const reviewRef = doc(db, 'reviews', reviewId);
      
      await updateDoc(reviewRef, {
        managerFeedback,
        status: 'completed',
        updatedAt: Timestamp.now()
      });
      
      setSuccess('Manager feedback submitted successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError('Failed to submit feedback: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }
  
  // Calculate average peer scores
  const calculatePeerAverages = () => {
    if (!review || !review.peerFeedback || review.peerFeedback.length === 0) {
      return {
        autonomy: 0,
        mastery: 0,
        purpose: 0
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
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error === 'You do not have permission to access this page') {
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
  
  const peerAverages = calculatePeerAverages();
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Manager Review for {review?.userName || 'Employee'}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {cycle?.name || review?.cycleName || 'Review Cycle'}
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {/* Assessment Summary */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Assessment Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} /> Self-Assessment
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">Autonomy: {review?.autonomyScore || 'N/A'}/4</Typography>
                    <Typography variant="body2">Mastery: {review?.masteryScore || 'N/A'}/4</Typography>
                    <Typography variant="body2">Purpose: {review?.purposeScore || 'N/A'}/4</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PeopleIcon sx={{ mr: 1 }} /> Peer Feedback
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Autonomy: {review?.peerFeedback?.length ? peerAverages.autonomy : 'N/A'}/4
                    </Typography>
                    <Typography variant="body2">
                      Mastery: {review?.peerFeedback?.length ? peerAverages.mastery : 'N/A'}/4
                    </Typography>
                    <Typography variant="body2">
                      Purpose: {review?.peerFeedback?.length ? peerAverages.purpose : 'N/A'}/4
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AdminPanelSettingsIcon sx={{ mr: 1 }} /> Your Assessment
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">Autonomy: {autonomyScore}/4</Typography>
                    <Typography variant="body2">Mastery: {masteryScore}/4</Typography>
                    <Typography variant="body2">Purpose: {purposeScore}/4</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
        </Box>
        
        {/* Detailed Review Sections */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1, fontSize: 20 }} /> Self-Assessment
                  </Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mt: 1 }}>Autonomy:</Typography>
                    <Typography variant="body2" color="text.secondary">{review?.autonomyText || 'No assessment provided'}</Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mt: 1 }}>Mastery:</Typography>
                    <Typography variant="body2" color="text.secondary">{review?.masteryText || 'No assessment provided'}</Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mt: 1 }}>Purpose:</Typography>
                    <Typography variant="body2" color="text.secondary">{review?.purposeText || 'No assessment provided'}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon sx={{ mr: 1, fontSize: 20 }} /> Peer Feedback
                  </Typography>
                  
                  {!review?.peerFeedback || review.peerFeedback.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No peer feedback has been submitted yet.</Typography>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mt: 1 }}>Autonomy:</Typography>
                      {review.peerFeedback.map((feedback, index) => (
                        <Typography key={index} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          "{feedback.autonomyText || 'No feedback'}"
                        </Typography>
                      ))}
                      
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mt: 1 }}>Mastery:</Typography>
                      {review.peerFeedback.map((feedback, index) => (
                        <Typography key={index} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          "{feedback.masteryText || 'No feedback'}"
                        </Typography>
                      ))}
                      
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mt: 1 }}>Purpose:</Typography>
                      {review.peerFeedback.map((feedback, index) => (
                        <Typography key={index} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          "{feedback.purposeText || 'No feedback'}"
                        </Typography>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
        
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Your Manager Feedback
          </Typography>
          
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
            
            {/* Overall Summary */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Overall Summary</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Provide an overall summary of the employee's performance and any key points for development.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="Provide a summary of performance and development areas..."
                    value={summaryFeedback}
                    onChange={(e) => setSummaryFeedback(e.target.value)}
                    sx={{ mb: 2 }}
                  />
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
                {submitting ? <CircularProgress size={24} /> : 'Submit Manager Feedback'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}