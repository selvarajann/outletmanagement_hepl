import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useParams } from 'react-router-dom';
import api from '../config/axiosInstance';
import { toast } from 'react-toastify';
import { C } from '../theme/colors';
import * as XLSX from 'xlsx';
import DownloadIcon from '@mui/icons-material/Download';

const FormResponses = () => {
  const { id } = useParams();
  const [schema, setSchema] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schemaRes, responsesRes] = await Promise.all([
          api.get(`/api/v1/forms/${id}`),
          api.get(`/api/v1/forms/${id}/responses`)
        ]);
        
        const schemaData = schemaRes.data.data;
        schemaData.fields = JSON.parse(schemaData.fieldsJson);
        setSchema(schemaData);
        
        const parsedResponses = responsesRes.data.data.map(r => ({
          ...r,
          ...JSON.parse(r.answersJson)
        }));
        setResponses(parsedResponses);
      } catch (error) {
        toast.error('Failed to load data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleExport = () => {
    if (!schema || responses.length === 0) return;
    
    // Prepare data for export
    const exportData = responses.map(row => {
      const rowData = {
        'Response ID': row.id,
        'Submitted By': row.submittedBy,
        'Submitted At': new Date(row.submittedAt).toLocaleString()
      };
      
      schema.fields.forEach(f => {
        rowData[f.label] = row[f.id] || '';
      });
      
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
    XLSX.writeFile(workbook, `${schema.name.replace(/\s+/g, '_')}_Responses.xlsx`);
  };

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!schema) return <Typography>Form not found</Typography>;

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'submittedBy', headerName: 'Submitted By', width: 150 },
    { field: 'submittedAt', headerName: 'Date', width: 200, valueFormatter: (params) => new Date(params.value).toLocaleString() },
    ...schema.fields.map(f => ({
      field: f.id,
      headerName: f.label,
      width: 150
    }))
  ];

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: C.slate }}>
            {schema.name} Responses
          </Typography>
          <Typography color="textSecondary">
            {responses.length} total submissions
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          sx={{ borderColor: C.blue, color: C.blue }}
        >
          Export to Excel
        </Button>
      </Box>

      <Paper sx={{ flex: 1, width: '100%' }}>
        <DataGrid
          rows={responses}
          columns={columns}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default FormResponses;
