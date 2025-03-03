// src/components/Manager/AnalyticsDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, query, getDocs, where, orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, Container, Typography, Paper, Grid, Card, CardContent,
  Alert, CircularProgress, Divider
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsDashboard() {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    averageScores: [],
    completionStatus: [],
    dimensionComparison: [],
    categoryCount: []
  });
  
  useEffect(() => {
    // Only managers can access this page
    if (userRole !== 'manager' && userRole !== 'admin') {
      setError('You do not have permission to access this page');
      setLoading(false);
      return;
    }
    
    async function fetchData() {
      try {
        // Get all reviews
        const reviewsQuery = query(
          collection(db, 'reviews'),
          orderBy('createdAt', 'desc')
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsList = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setReviews(reviewsList);
        
        // Process data for analytics
        processAnalytics(reviewsList);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load analytics data: ' + err.message);
        setLoading(false);
      }
    }
    
    fetchData();
  }, [userRole]);
  
  // Process data for various charts and metrics
  function processAnalytics(reviewsList) {
    if (!reviewsList.length) return;
    
    // 1. Calculate average scores for autonomy, mastery, purpose
    const autonomyScores = [];
    const masteryScores = [];
    const purposeScores = [];
    
    reviewsList.forEach(review => {
      // Self scores
      if (review.autonomyScore) autonomyScores.push(review.autonomyScore);
      if (review.masteryScore) masteryScores.push(review.masteryScore);
      if (review.purposeScore) purposeScores.push(review.purposeScore);
      
      // Peer scores
      if (review.peerFeedback && review.peerFeedback.length) {
        review.peerFeedback.forEach(feedback => {
          if (feedback.autonomyScore) autonomyScores.push(feedback.autonomyScore);
          if (feedback.masteryScore) masteryScores.push(feedback.masteryScore);
          if (feedback.purposeScore) purposeScores.push(feedback.purposeScore);
        });
      }
      
      // Manager scores
      if (review.managerFeedback) {
        if (review.managerFeedback.autonomyScore) autonomyScores.push(review.managerFeedback.autonomyScore);
        if (review.managerFeedback.masteryScore) masteryScores.push(review.managerFeedback.masteryScore);
        if (review.managerFeedback.purposeScore) purposeScores.push(review.managerFeedback.purposeScore);
      }
    });
    
    const avgAutonomy = autonomyScores.length ? 
      (autonomyScores.reduce((sum, score) => sum + score, 0) / autonomyScores.length).toFixed(1) : 0;
    
    const avgMastery = masteryScores.length ? 
      (masteryScores.reduce((sum, score) => sum + score, 0) / masteryScores.length).toFixed(1) : 0;
    
    const avgPurpose = purposeScores.length ? 
      (purposeScores.reduce((sum, score) => sum + score, 0) / purposeScores.length).toFixed(1) : 0;
    
    const averageScores = [
      { name: 'Autonomy', score: parseFloat(avgAutonomy) },
      { name: 'Mastery', score: parseFloat(avgMastery) },
      { name: 'Purpose', score: parseFloat(avgPurpose) }
    ];
    
    // 2. Calculate completion status
    const completed = reviewsList.filter(review => 
      review.managerFeedback && review.peerFeedback && review.peerFeedback.length >= 2
    ).length;
    
    const inProgress = reviewsList.filter(review => 
      review.peerFeedback && review.peerFeedback.length > 0 && 
      (!review.managerFeedback || review.peerFeedback.length < 2)
    ).length;
    
    const selfOnly = reviewsList.filter(review => 
      !review.peerFeedback || review.peerFeedback.length === 0
    ).length;
    
    const completionStatus = [
      { name: 'Completed', value: completed },
      { name: 'In Progress', value: inProgress },
      { name: 'Self Only', value: selfOnly }
    ];
    
    // 3. Compare dimensions across different perspectives
    const selfAutonomy = reviewsList.reduce((sum, review) => sum + (review.autonomyScore || 0), 0) / 
      reviewsList.filter(review => review.autonomyScore).length || 0;
    
    const selfMastery = reviewsList.reduce((sum, review) => sum + (review.masteryScore || 0), 0) / 
      reviewsList.filter(review => review.masteryScore).length || 0;
    
    const selfPurpose = reviewsList.reduce((sum, review) => sum + (review.purposeScore || 0), 0) / 
      reviewsList.filter(review => review.purposeScore).length || 0;
    
    // Calculate peer averages
    let peerAutonomyTotal = 0;
    let peerMasteryTotal = 0;
    let peerPurposeTotal = 0;
    let peerFeedbackCount = 0;
    
    reviewsList.forEach(review => {
      if (review.peerFeedback && review.peerFeedback.length) {
        peerFeedbackCount += review.peerFeedback.length;
        review.peerFeedback.forEach(feedback => {
          peerAutonomyTotal += (feedback.autonomyScore || 0);
          peerMasteryTotal += (feedback.masteryScore || 0);
          peerPurposeTotal += (feedback.purposeScore || 0);
        });
      }
    });
    
    const peerAutonomy = peerFeedbackCount ? peerAutonomyTotal / peerFeedbackCount : 0;
    const peerMastery = peerFeedbackCount ? peerMasteryTotal / peerFeedbackCount : 0;
    const peerPurpose = peerFeedbackCount ? peerPurposeTotal / peerFeedbackCount : 0;
    
    // Calculate manager averages
    const managerReviews = reviewsList.filter(review => review.managerFeedback);
    
    const managerAutonomy = managerReviews.length ? 
      managerReviews.reduce((sum, review) => sum + (review.managerFeedback.autonomyScore || 0), 0) / 
      managerReviews.length : 0;
    
    const managerMastery = managerReviews.length ? 
      managerReviews.reduce((sum, review) => sum + (review.managerFeedback.masteryScore || 0), 0) / 
      managerReviews.length : 0;
    
    const managerPurpose = managerReviews.length ? 
      managerReviews.reduce((sum, review) => sum + (review.managerFeedback.purposeScore || 0), 0) / 
      managerReviews.length : 0;
    
    const dimensionComparison = [
      { 
        name: 'Autonomy', 
        Self: parseFloat(selfAutonomy.toFixed(1)), 
        Peer: parseFloat(peerAutonomy.toFixed(1)), 
        Manager: parseFloat(managerAutonomy.toFixed(1))
      },
      { 
        name: 'Mastery', 
        Self: parseFloat(selfMastery.toFixed(1)), 
        Peer: parseFloat(peerMastery.toFixed(1)), 
        Manager: parseFloat(managerMastery.toFixed(1))
      },
      { 
        name: 'Purpose', 
        Self: parseFloat(selfPurpose.toFixed(1)), 
        Peer: parseFloat(peerPurpose.toFixed(1)), 
        Manager: parseFloat(managerPurpose.toFixed(1))
      }
    ];
    
    // Compile all data
    setAnalyticsData({
      averageScores,
      completionStatus,
      dimensionComparison
    });
  }
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Performance Analytics
      </Typography>
      
      <Grid container spacing={3}>
        {/* Summary metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Total Reviews
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {reviews.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Completion Rate
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {reviews.length ? 
                        Math.round((analyticsData.completionStatus.find(s => s.name === 'Completed')?.value || 0) / 
                        reviews.length * 100) : 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Average Rating
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {(analyticsData.averageScores.reduce((sum, item) => sum + item.score, 0) / 
                        analyticsData.averageScores.length).toFixed(1)}/4
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Average scores by dimension */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Average Scores by Dimension
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.averageScores}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 4]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" name="Score" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Completion status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Review Completion Status
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.completionStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.completionStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} reviews`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Dimension comparison */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Dimension Comparison by Perspective
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.dimensionComparison}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 4]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Self" fill="#8884d8" />
                  <Bar dataKey="Peer" fill="#82ca9d" />
                  <Bar dataKey="Manager" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}