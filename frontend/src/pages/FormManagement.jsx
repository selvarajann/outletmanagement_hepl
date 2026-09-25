import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton } from '@mui/material';
import api from '../config/axiosInstance';
import { toast } from 'react-toastify';
import { C } from '../theme/colors';

const FormManagement = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);

  const fetchForms = async () => {
    try {
      const response = await api.get('/api/v1/forms');
      setForms(response.data.data || []);
    } catch (err) {
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setFormToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!formToDelete) return;
    
    try {
      await api.delete(`/api/v1/forms/${formToDelete}`);
      toast.success('Form deleted successfully');
      fetchForms();
    } catch (err) {
      toast.error('Failed to delete form');
    } finally {
      setDeleteDialogOpen(false);
      setFormToDelete(null);
    }
  };

  const handleCloseDialog = () => {
    setDeleteDialogOpen(false);
    setFormToDelete(null);
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Form Name', flex: 1 },
    { field: 'category', headerName: 'Category', width: 150 },
    { 
      field: 'active', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Active' : 'Inactive'} 
          color={params.value ? 'success' : 'default'} 
          size="small" 
        />
      )
    },
    { field: 'createdAt', headerName: 'Created At', width: 200, valueFormatter: (params) => new Date(params?.value).toLocaleString() },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 350,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<VisibilityIcon />}
            onClick={() => navigate(`/forms/${params.row.id}`)}
          >
            View
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<FormatListBulletedIcon />}
            sx={{ bgcolor: C.blue, '&:hover': { bgcolor: C.blueHover } }}
            onClick={() => navigate(`/forms/${params.row.id}/responses`)}
          >
            Responses
          </Button>
          <IconButton 
            size="small" 
            color="primary"
            onClick={() => navigate(`/form-builder/${params.row.id}`)}
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            size="small" 
            color="error"
            onClick={() => handleDeleteClick(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: C.slate }}>
          Form Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/form-builder')}
          sx={{ bgcolor: C.blue, '&:hover': { bgcolor: C.blueHover } }}
        >
          Create New Form
        </Button>
      </Box>

      <Paper sx={{ flex: 1, width: '100%', minWidth: 0, height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DataGrid
          rows={forms}
          columns={columns}
          loading={loading}
          disableSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': { borderColor: C.grayBorder },
            '& .MuiDataGrid-columnHeaders': { bgcolor: C.grayBackground, borderBottom: `1px solid ${C.grayBorder}` },
          }}
        />
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Form?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this form? This action cannot be undone and will also delete any responses associated with it.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormManagement;
