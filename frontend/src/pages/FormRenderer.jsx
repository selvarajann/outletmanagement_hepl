import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel, Paper, Checkbox, FormControlLabel, Rating, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import api from '../config/axiosInstance';
import { toast } from 'react-toastify';
import { C } from '../theme/colors';

const FormRenderer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const { control, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await api.get(`/api/v1/forms/${id}`);
        const data = response.data.data;
        data.fields = JSON.parse(data.fieldsJson);
        setSchema(data);
      } catch (error) {
        toast.error('Failed to load form');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchema();
  }, [id]);

  const onSubmit = async (data) => {
    try {
      await api.post(`/api/v1/forms/${id}/submit`, {
        answersJson: JSON.stringify(data)
      });
      toast.success('Form submitted successfully!');
      navigate('/system-reports'); // Or some thank you page
    } catch (error) {
      toast.error('Submission failed');
      console.error(error);
    }
  };

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!schema) return <Typography>Form not found</Typography>;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" sx={{ mb: 1, color: C.slate, fontWeight: 'bold' }}>
          {schema.name}
        </Typography>
        {schema.description && (
          <Typography color="textSecondary" sx={{ mb: 4 }}>
            {schema.description}
          </Typography>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {schema.fields.map(field => (
            <Box key={field.id} sx={{ mb: 3 }}>
              {field.type === 'text' || field.type === 'number' || field.type === 'date' ? (
                <Controller
                  name={field.id}
                  control={control}
                  rules={{ required: field.required ? 'This field is required' : false }}
                  defaultValue=""
                  render={({ field: controllerField }) => (
                    <TextField
                      {...controllerField}
                      fullWidth
                      type={field.type}
                      label={field.label}
                      placeholder={field.placeholder}
                      error={!!errors[field.id]}
                      helperText={errors[field.id]?.message}
                      InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
                    />
                  )}
                />
              ) : field.type === 'textarea' ? (
                <Controller
                  name={field.id}
                  control={control}
                  rules={{ required: field.required ? 'This field is required' : false }}
                  defaultValue=""
                  render={({ field: controllerField }) => (
                    <TextField
                      {...controllerField}
                      fullWidth
                      multiline
                      rows={4}
                      label={field.label}
                      placeholder={field.placeholder}
                      error={!!errors[field.id]}
                      helperText={errors[field.id]?.message}
                    />
                  )}
                />
              ) : field.type === 'select' ? (
                <Controller
                  name={field.id}
                  control={control}
                  rules={{ required: field.required ? 'This field is required' : false }}
                  defaultValue=""
                  render={({ field: controllerField }) => (
                    <FormControl fullWidth error={!!errors[field.id]}>
                      <InputLabel>{field.label}</InputLabel>
                      <Select {...controllerField} label={field.label}>
                        {field.options.split(',').map((opt, i) => (
                          <MenuItem key={i} value={opt.trim()}>{opt.trim()}</MenuItem>
                        ))}
                      </Select>
                      {errors[field.id] && <Typography color="error" variant="caption">{errors[field.id].message}</Typography>}
                    </FormControl>
                  )}
                />
              ) : field.type === 'checkbox' ? (
                <Controller
                  name={field.id}
                  control={control}
                  rules={{ required: field.required ? 'Must be checked' : false }}
                  defaultValue={false}
                  render={({ field: controllerField }) => (
                    <FormControl error={!!errors[field.id]}>
                      <FormControlLabel
                        control={<Checkbox {...controllerField} checked={controllerField.value} />}
                        label={field.label}
                      />
                      {errors[field.id] && <Typography color="error" variant="caption">{errors[field.id].message}</Typography>}
                    </FormControl>
                  )}
                />
              ) : field.type === 'rating' ? (
                <Controller
                  name={field.id}
                  control={control}
                  rules={{ required: field.required ? 'Rating is required' : false }}
                  defaultValue={0}
                  render={({ field: controllerField }) => (
                    <Box>
                      <Typography component="legend">{field.label}</Typography>
                      <Rating
                        name={field.id}
                        value={Number(controllerField.value)}
                        onChange={(event, newValue) => {
                          controllerField.onChange(newValue);
                        }}
                      />
                      {errors[field.id] && <Typography color="error" variant="caption" display="block">{errors[field.id].message}</Typography>}
                    </Box>
                  )}
                />
              ) : null}
            </Box>
          ))}

          <Button 
            type="submit" 
            variant="contained" 
            size="large"
            sx={{ mt: 2, bgcolor: C.blue, '&:hover': { bgcolor: C.blueHover } }}
          >
            Submit Form
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default FormRenderer;
