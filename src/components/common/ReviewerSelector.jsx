// src/components/common/ReviewerSelector.jsx
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, TextField, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, Checkbox, Chip, InputAdornment,
  Typography, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function ReviewerSelector({ selectedReviewers, setSelectedReviewers, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== currentUserId); // Exclude current user
        
        setUsers(userList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, [currentUserId]);
  
  const filteredUsers = users.filter(user => {
    const fullName = user.displayName || '';
    const email = user.email || '';
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower);
  });
  
  const handleToggleUser = (userId) => {
    if (selectedReviewers.includes(userId)) {
      // Remove user
      setSelectedReviewers(selectedReviewers.filter(id => id !== userId));
    } else {
      // Add user, but limit to 2 total
      if (selectedReviewers.length < 2) {
        setSelectedReviewers([...selectedReviewers, userId]);
      } else {
        // Replace the first user in the array
        setSelectedReviewers([selectedReviewers[1], userId]);
      }
    }
  };
  
  // Get user names for display
  const getSelectedUserNames = () => {
    return selectedReviewers.map(userId => {
      const user = users.find(u => u.id === userId);
      return user ? user.displayName : 'Unknown User';
    });
  };
  
  if (loading) {
    return <Box>Loading users...</Box>;
  }
  
  return (
    <Box>
      {/* Selected users display */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Selected Reviewers:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {getSelectedUserNames().length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No reviewers selected
            </Typography>
          ) : (
            getSelectedUserNames().map((name, index) => (
              <Chip key={index} label={name} color="primary" />
            ))
          )}
        </Box>
      </Box>
      
      {/* Search input */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by name or email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      
      {/* User list */}
      <Paper variant="outlined" sx={{ maxHeight: '300px', overflow: 'auto' }}>
        <List sx={{ padding: 0 }}>
          {filteredUsers.length === 0 ? (
            <ListItem>
              <ListItemText primary="No users found" />
            </ListItem>
          ) : (
            filteredUsers.map((user) => (
              <ListItem
                key={user.id}
                button
                onClick={() => handleToggleUser(user.id)}
                selected={selectedReviewers.includes(user.id)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(66, 133, 244, 0.08)',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={user.photoURL} alt={user.displayName}>
                    {user.displayName?.charAt(0) || user.email?.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={user.displayName || '(No name)'}
                  secondary={user.email} 
                />
                <Checkbox 
                  edge="end"
                  checked={selectedReviewers.includes(user.id)}
                  tabIndex={-1}
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
}