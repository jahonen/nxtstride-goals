// src/components/Dashboard/Reminders.jsx
import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, query, where, getDocs, orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, Typography, Paper, List, ListItem, ListItemIcon, 
  ListItemText, Alert, Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EventIcon from '@mui/icons-material/Event';

export default function Reminders() {
  const { currentUser } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Get active review cycles
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
        
        // Get user's reviews
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('userId', '==', currentUser.uid)
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsList = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Get peer reviews assigned to this user
        const peerReviewsQuery = query(
          collection(db, 'reviews'),
          where('peerReviewers', 'array-contains', currentUser.uid)
        );
        
        const peerReviewsSnapshot = await getDocs(peerReviewsQuery);
        const peerReviewsList = peerReviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Process data to create reminders
        const remindersList = [];
        
        // Check for upcoming self-review deadlines
        cyclesList.forEach(cycle => {
          const hasSubmitted = reviewsList.some(review => review.cycleId === cycle.id);
          
          if (!hasSubmitted && cycle.selfReviewDue) {
            try {
              const dueDate = cycle.selfReviewDue.toDate();
              const now = new Date();
              const diffTime = dueDate - now;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays > 0 && diffDays <= 7) {
                remindersList.push({
                  type: 'self-review',
                  message: `Your self-review for ${cycle.name} is due in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
                  dueDate: dueDate,
                  cycleId: cycle.id,
                  cycleName: cycle.name,
                  priority: diffDays <= 2 ? 'high' : 'medium'
                });
              } else if (diffDays <= 0) {
                remindersList.push({
                  type: 'self-review-overdue',
                  message: `Your self-review for ${cycle.name} is overdue!`,
                  dueDate: dueDate,
                  cycleId: cycle.id,
                  cycleName: cycle.name,
                  priority: 'high'
                });
              }
            } catch (e) {
              console.error('Error processing date:', e);
            }
          }
        });
        
        // Check for pending peer reviews
        peerReviewsList.forEach(review => {
          // Check if this user has already submitted feedback
          const hasSubmitted = review.peerFeedback?.some(
            feedback => feedback.reviewerId === currentUser.uid
          );
          
          if (!hasSubmitted) {
            const cycle = cyclesList.find(c => c.id === review.cycleId);
            if (cycle && cycle.peerReviewDue) {
              try {
                const dueDate = cycle.peerReviewDue.toDate();
                const now = new Date();
                const diffTime = dueDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays > 0 && diffDays <= 7) {
                  remindersList.push({
                    type: 'peer-review',
                    message: `Your peer review for ${review.userName} is due in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
                    dueDate: dueDate,
                    reviewId: review.id,
                    userName: review.userName,
                    priority: diffDays <= 2 ? 'high' : 'medium'
                  });
                } else if (diffDays <= 0) {
                  remindersList.push({
                    type: 'peer-review-overdue',
                    message: `Your peer review for ${review.userName} is overdue!`,
                    dueDate: dueDate,
                    reviewId: review.id,
                    userName: review.userName,
                    priority: 'high'
                  });
                }
              } catch (e) {
                console.error('Error processing date:', e);
              }
            }
          }
        });
        
        // Sort reminders by priority and due date
        remindersList.sort((a, b) => {
          if (a.priority === 'high' && b.priority !== 'high') return -1;
          if (a.priority !== 'high' && b.priority === 'high') return 1;
          return a.dueDate - b.dueDate;
        });
        
        setReminders(remindersList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reminders:', error);
        setLoading(false);
      }
    }
    
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);
  
  if (loading) {
    return null;
  }
  
  if (reminders.length === 0) {
    return null;
  }
  
  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFF9C4' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <NotificationsIcon sx={{ mr: 1, color: '#F57F17' }} />
        <Typography variant="h6">Reminders</Typography>
      </Box>
      
      <List dense>
        {reminders.map((reminder, index) => (
          <ListItem 
            key={index}
            sx={{ 
              py: 0, 
              borderLeft: reminder.priority === 'high' ? '3px solid #F44336' : 'none',
              pl: reminder.priority === 'high' ? 1 : 2
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <EventIcon color={reminder.priority === 'high' ? 'error' : 'primary'} />
            </ListItemIcon>
            <ListItemText 
              primary={reminder.message}
              secondary={`Due: ${reminder.dueDate.toLocaleDateString()}`}
            />
            <Button 
              variant="outlined" 
              size="small"
              component={RouterLink}
              to={reminder.type.includes('self-review') 
                ? `/review/${reminder.cycleId}` 
                : `/peer-review/${reminder.reviewId}`
              }
            >
              {reminder.type.includes('self-review') ? 'Complete Self-Review' : 'Provide Feedback'}
            </Button>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ textAlign: 'center', mt: 1 }}>
        <Alert severity="info" sx={{ display: 'inline-flex' }}>
          In a production app, these reminders would also be sent by email
        </Alert>
      </Box>
    </Paper>
  );
}