// src/components/Admin/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, Container, Typography, Paper, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Alert, IconButton, Grid, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

export default function AdminPanel() {
  const { userRole } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('add'); // 'add' or 'edit'
  const [currentCycle, setCurrentCycle] = useState(null);
  
  // Form state
  const [cycleName, setCycleName] = useState('');
  const [cycleType, setCycleType] = useState('quarterly');
  const [selfReviewDueDate, setSelfReviewDueDate] = useState('');
  const [peerReviewDueDate, setPeerReviewDueDate] = useState('');
  
  useEffect(() => {
    // Only admin/manager can access this page
    if (userRole !== 'manager' && userRole !== 'admin') {
      setError('You do not have permission to access this page');
      setLoading(false);
      return;
    }
    
    fetchCycles();
  }, [userRole]);
  
  async function fetchCycles() {
    try {
      const cyclesQuery = query(
        collection(db, 'reviewCycles'),
        orderBy('createdAt', 'desc')
      );
      
      const cyclesSnapshot = await getDocs(cyclesQuery);
      const cyclesList = cyclesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCycles(cyclesList);
      setLoading(false);
    } catch (err) {
      setError('Failed to load review cycles: ' + err.message);
      setLoading(false);
    }
  }
  
  function handleOpenAddDialog() {
    setDialogType('add');
    resetForm();
    setOpenDialog(true);
  }
  
  function handleOpenEditDialog(cycle) {
    setDialogType('edit');
    setCurrentCycle(cycle);
    
    // Populate form with cycle data
    setCycleName(cycle.name);
    setCycleType(cycle.type || 'quarterly');
    
    // Format dates for the text field
    if (cycle.selfReviewDue) {
      const selfDate = cycle.selfReviewDue.toDate();
      setSelfReviewDueDate(selfDate.toISOString().split('T')[0]);
    }
    
    if (cycle.peerReviewDue) {
      const peerDate = cycle.peerReviewDue.toDate();
      setPeerReviewDueDate(peerDate.toISOString().split('T')[0]);
    }
    
    setOpenDialog(true);
  }
  
  function resetForm() {
    setCycleName('');
    setCycleType('quarterly');
    
    // Set default dates
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    setSelfReviewDueDate(today.toISOString().split('T')[0]);
    setPeerReviewDueDate(nextMonth.toISOString().split('T')[0]);
    
    setCurrentCycle(null);
  }
  
  function handleCloseDialog() {
    setOpenDialog(false);
    resetForm();
  }
  
  async function handleSubmit() {
    if (!cycleName) {
      setError('Please enter a cycle name');
      return;
    }
    
    if (!selfReviewDueDate || !peerReviewDueDate) {
      setError('Please enter both due dates');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Convert string dates to timestamps
      const selfReviewDate = new Date(selfReviewDueDate);
      const peerReviewDate = new Date(peerReviewDueDate);
      
      if (dialogType === 'add') {
        // Add new cycle
        await addDoc(collection(db, 'reviewCycles'), {
          name: cycleName,
          type: cycleType,
          selfReviewDue: Timestamp.fromDate(selfReviewDate),
          peerReviewDue: Timestamp.fromDate(peerReviewDate),
          status: 'active',
          createdAt: Timestamp.now()
        });
        
        setSuccess('Review cycle created successfully');
      } else {
        // Update existing cycle
        await updateDoc(doc(db, 'reviewCycles', currentCycle.id), {
          name: cycleName,
          type: cycleType,
          selfReviewDue: Timestamp.fromDate(selfReviewDate),
          peerReviewDue: Timestamp.fromDate(peerReviewDate),
          updatedAt: Timestamp.now()
        });
        
        setSuccess('Review cycle updated successfully');
      }
      
      handleCloseDialog();
      fetchCycles();
    } catch (err) {
      setError('Failed to save review cycle: ' + err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleDeleteCycle(cycleId) {
    if (!confirm('Are you sure you want to delete this review cycle? This will delete all associated reviews.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await deleteDoc(doc(db, 'reviewCycles', cycleId));
      
      // Note: In a production app, you might want to also delete all reviews
      // associated with this cycle or mark them as inactive
      
      setSuccess('Review cycle deleted successfully');
      fetchCycles();
    } catch (err) {
      setError('Failed to delete review cycle: ' + err.message);
    } finally {
      setLoading(false);
    }
  }
  
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
  
  if (loading && cycles.length === 0) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Review Cycles
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpenAddDialog}
        >
          Create New Cycle
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cycle Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Self-Review Due</TableCell>
                <TableCell>Peer Review Due</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cycles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No review cycles found. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                cycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell>{cycle.name}</TableCell>
                    <TableCell>{cycle.type || 'quarterly'}</TableCell>
                    <TableCell>{formatDate(cycle.selfReviewDue)}</TableCell>
                    <TableCell>{formatDate(cycle.peerReviewDue)}</TableCell>
                    <TableCell>{cycle.status || 'active'}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenEditDialog(cycle)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteCycle(cycle.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'add' ? 'Create New Review Cycle' : 'Edit Review Cycle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cycle Name"
                variant="outlined"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                required
                placeholder="e.g. Q1 2023"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Cycle Type</InputLabel>
                <Select
                  value={cycleType}
                  label="Cycle Type"
                  onChange={(e) => setCycleType(e.target.value)}
                >
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="annual">Annual</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Self-Review Due Date"
                type="date"
                value={selfReviewDueDate}
                onChange={(e) => setSelfReviewDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Peer Review Due Date"
                type="date"
                value={peerReviewDueDate}
                onChange={(e) => setPeerReviewDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {dialogType === 'add' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}