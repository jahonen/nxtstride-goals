// src/components/Reviews/SelfReview.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, doc, getDoc, setDoc, 
  query, where, getDocs, Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, Button, Container, Paper, Typography,
  TextField, Slider, Grid, Alert, Card, CardContent,
  CircularProgress, Divider
} from '@mui/material';
import ReviewerSelector from '../common/ReviewerSelector';

export default function SelfReview() {
  const { cycleId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cycle, setCycle] = useState(null);
  
  // Form state
  const [autonomyText, setAutonomyText] = useState('');
  const [masteryText, setMasteryText] = useState('');
  const [purposeText, setPurposeText] = useState('');
  const [autonomyScore, setAutonomyScore] = useState(3);
  const [masteryScore, setMasteryScore] = useState(3);
  const [purposeScore, setPurposeScore] = useState(3);
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  
  // Character limits
  const charLimit = 500;
  
  useEffect(() => {
    async function loadCycleAndReview() {
      try {
        // Load cycle information
        const cycleRef = doc(db, 'reviewCycles', cycleId);
        const cycleSnap = await getDoc(cycleRef);
        
        if (!cycleSnap.exists()) {
          setError('Review cycle not found');
          setLoading(false);
          return;
        }
        
        setCycle({
          id: cycleSnap.id,
          ...cycleSnap.data()
        });
        
        // Check if user already has a review for this cycle
        const reviewId = `${cycleId}_${currentUser.uid}`;
        const reviewRef = doc(db, 'reviews', reviewId);
        const reviewSnap = await getDoc(reviewRef);
        
        if (reviewSnap.exists()) {
          const reviewData = reviewSnap.data();
          
          // Pre-fill form with existing data
          setAutonomyText(reviewData.autonomyText || '');
          setMasteryText(reviewData.masteryText || '');
          setPurposeText(reviewData.purposeText || '');
          setAutonomyScore(reviewData.autonomyScore || 3);
          setMasteryScore(reviewData.masteryScore || 3);
          setPurposeScore(reviewData.purposeScore || 3);
          
          if (reviewData.peerReviewers) {
            setSelectedReviewers(reviewData.peerReviewers);
          }
        }
        
      } catch (err) {
        setError('Failed to load review data: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (currentUser && cycleId) {
      loadCycleAndReview();
    }
  }, [currentUser, cycleId]);
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (selectedReviewers.length !== 2) {
      setError('Please select exactly 2 peer reviewers');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const reviewId = `${cycleId}_${currentUser.uid}`;
      
      await setDoc(doc(db, 'reviews', reviewId), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        cycleId: cycleId,
        cycleName: cycle.name,
        autonomyText: autonomyText,
        masteryText: masteryText,
        purposeText: purposeText,
        autonomyScore: autonomyScore,
        masteryScore: masteryScore,
        purposeScore: purposeScore,
        peerReviewers: selectedReviewers,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'submitted'
      });
      
      setSuccess('Self-review submitted successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError('Failed to submit review: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }
  
  // For now, just mock the reviewer selection
  // Later we'll implement the actual selector
  function handleSelectReviewers() {
    // Just set some mock data for now
    setSelectedReviewers(['user1', 'user2']);
  }
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Self Review: {cycle?.name || cycleId}
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {/* Instructional Video Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Before You Start: Understanding Autonomy, Mastery, and Purpose
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Watch this short video to better understand the principles of Autonomy, Mastery, and Purpose 
            that form the foundation of our approach to performance and development.
          </Typography>
          <Box sx={{ 
            position: 'relative', 
            paddingBottom: '56.25%', /* 16:9 aspect ratio */
            height: 0,
            overflow: 'hidden',
            maxWidth: '100%',
            marginBottom: 2
          }}>
            <iframe 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0
              }}
              src="https://www.youtube.com/embed/rrkrvAUbU9Y" 
              title="RSA ANIMATE: Drive: The surprising truth about what motivates us"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </Box>
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
                    Describe how you've demonstrated self-direction and independence in your work.
                    Examples include taking initiative on projects, making decisions without constant supervision,
                    or setting your own goals and timelines.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="Describe your autonomy..."
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
                    Describe how you've improved your skills and expertise. Consider what new
                    competencies you've developed, how you've deepened existing skills, or how
                    you've overcome challenges to grow professionally.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="Describe your mastery..."
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
                    Describe how your work aligns with the company mission and your personal goals.
                    Reflect on how your contributions have made a meaningful impact and how you
                    connect your day-to-day work to broader objectives.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="Describe your purpose alignment..."
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
            
            {/* Reviewer Selection */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Select Peer Reviewers</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Select 2 colleagues to provide feedback on your performance.
                  </Typography>
                  
                  {/* For now we'll just simulate reviewer selection with a button */}
                  <ReviewerSelector 
                    selectedReviewers={selectedReviewers}
                    setSelectedReviewers={setSelectedReviewers}
                    currentUserId={currentUser.uid}
                    />
                  
                  {selectedReviewers.length > 0 && (
                    <Typography>
                      {selectedReviewers.length} reviewer(s) selected
                    </Typography>
                  )}
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
                {submitting ? <CircularProgress size={24} /> : 'Submit Self-Review'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}