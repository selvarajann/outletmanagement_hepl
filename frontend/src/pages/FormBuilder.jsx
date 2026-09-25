import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel, Paper, IconButton } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SaveIcon from '@mui/icons-material/Save';
import api from '../config/axiosInstance';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { C } from '../theme/colors';
import GlobalLoader from '../components/common/GlobalLoader';

const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: '📝' },
  { type: 'number', label: 'Number Input', icon: '🔢' },
  { type: 'select', label: 'Dropdown', icon: '🔽' },
  { type: 'date', label: 'Date Picker', icon: '📅' },
  { type: 'checkbox', label: 'Checkbox', icon: '✅' },
  { type: 'textarea', label: 'Text Area', icon: '📃' },
  { type: 'rating', label: 'Rating', icon: '⭐' }
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const FormBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formConfig, setFormConfig] = useState({
    name: '',
    description: '',
    category: 'CUSTOM'
  });
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const loadForm = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/api/v1/forms/${id}`);
          const data = res.data.data;
          setFormConfig({
            name: data.name,
            description: data.description,
            category: data.category
          });
          setFields(data.fieldsJson ? JSON.parse(data.fieldsJson) : []);
        } catch (err) {
          toast.error('Failed to load form');
          navigate('/admin/forms');
        } finally {
          setLoading(false);
        }
      };
      loadForm();
    }
  }, [id, navigate]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    const sourceDroppable = result.source.droppableId;
    const destDroppable = result.destination.droppableId;

    // Moving within canvas
    if (sourceDroppable === 'canvas' && destDroppable === 'canvas') {
      const newFields = Array.from(fields);
      const [reorderedItem] = newFields.splice(sourceIndex, 1);
      newFields.splice(destIndex, 0, reorderedItem);
      setFields(newFields);
      return;
    }

    // Dragging from palette to canvas
    if (sourceDroppable === 'palette' && destDroppable === 'canvas') {
      const fieldType = fieldTypes[sourceIndex].type;
      const newField = {
        id: generateId(),
        type: fieldType,
        label: `New ${fieldTypes[sourceIndex].label}`,
        required: false,
        placeholder: '',
        options: fieldType === 'select' ? 'Option 1,Option 2' : ''
      };
      const newFields = Array.from(fields);
      newFields.splice(destIndex, 0, newField);
      setFields(newFields);
      setSelectedFieldId(newField.id);
    }
  };

  const updateSelectedField = (key, value) => {
    setFields(fields.map(f => f.id === selectedFieldId ? { ...f, [key]: value } : f));
  };

  const removeField = (id, e) => {
    e.stopPropagation();
    setFields(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const handleSave = async () => {
    if (!formConfig.name.trim()) {
      toast.error('Form name is required');
      return;
    }
    if (fields.length === 0) {
      toast.error('Add at least one field');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formConfig,
        fieldsJson: JSON.stringify(fields),
        active: true
      };
      
      if (id) {
        await api.put(`/api/v1/forms/${id}`, payload);
        toast.success('Form updated successfully!');
      } else {
        await api.post('/api/v1/forms', payload);
        toast.success('Form created successfully!');
      }
      navigate('/admin/forms');
    } catch (err) {
      const serverMsg = err.response?.data?.message || 'Failed to create form';
      toast.error(serverMsg);
      console.error("Server Error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {loading && <GlobalLoader />}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: C.slate }}>
          Form Builder
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ bgcolor: C.blue, '&:hover': { bgcolor: C.blueHover } }}
        >
          Save Form
        </Button>
      </Box>

      {/* Form Settings Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, borderRadius: 2 }}>
        <TextField 
          label="Form Name" 
          variant="outlined" 
          size="small"
          fullWidth
          value={formConfig.name}
          onChange={e => setFormConfig({...formConfig, name: e.target.value})}
        />
        <TextField 
          label="Description" 
          variant="outlined" 
          size="small"
          fullWidth
          value={formConfig.description}
          onChange={e => setFormConfig({...formConfig, description: e.target.value})}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={formConfig.category}
            label="Category"
            onChange={e => setFormConfig({...formConfig, category: e.target.value})}
          >
            <MenuItem value="STOCK_AUDIT">Stock Audit</MenuItem>
            <MenuItem value="OUTLET_SURVEY">Outlet Survey</MenuItem>
            <MenuItem value="CUSTOM">Custom</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
          
          {/* Palette */}
          <Paper sx={{ width: 250, p: 2, borderRadius: 2, overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, color: C.slate }}>Components</Typography>
            <Droppable droppableId="palette" isDropDisabled={true}>
              {(provided) => (
                <Box ref={provided.innerRef} {...provided.droppableProps}>
                  {fieldTypes.map((item, index) => (
                    <Draggable key={item.type} draggableId={`palette-${item.type}`} index={index}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            bgcolor: snapshot.isDragging ? C.blueLight : C.grayBackground,
                            border: `1px solid ${C.grayBorder}`,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'grab'
                          }}
                        >
                          <Typography>{item.icon}</Typography>
                          <Typography variant="body2">{item.label}</Typography>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Paper>

          {/* Canvas */}
          <Paper sx={{ flex: 1, p: 3, borderRadius: 2, bgcolor: C.grayBackground, overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, color: C.slate }}>Canvas</Typography>
            <Droppable droppableId="canvas">
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    minHeight: 400,
                    p: 2,
                    bgcolor: snapshot.isDraggingOver ? 'rgba(37, 99, 235, 0.05)' : 'white',
                    borderRadius: 2,
                    border: `2px dashed ${snapshot.isDraggingOver ? C.blue : C.grayBorder}`,
                  }}
                >
                  {fields.length === 0 && !snapshot.isDraggingOver && (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color="textSecondary">Drag components here</Typography>
                    </Box>
                  )}
                  {fields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          onClick={() => setSelectedFieldId(field.id)}
                          sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: 'white',
                            border: `2px solid ${selectedFieldId === field.id ? C.blue : C.grayBorder}`,
                            borderRadius: 1,
                            boxShadow: snapshot.isDragging ? 3 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                          }}
                        >
                          <Box {...provided.dragHandleProps} sx={{ color: C.slate, cursor: 'grab' }}>
                            <DragIndicatorIcon />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" color="textSecondary">{field.type.toUpperCase()}</Typography>
                            <Typography variant="body1">{field.label} {field.required && '*'}</Typography>
                          </Box>
                          <IconButton onClick={(e) => removeField(field.id, e)} color="error" size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Paper>

          {/* Properties Panel */}
          <Paper sx={{ width: 300, p: 2, borderRadius: 2, overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, color: C.slate }}>Properties</Typography>
            {selectedField ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Label"
                  value={selectedField.label}
                  onChange={(e) => updateSelectedField('label', e.target.value)}
                  size="small"
                  fullWidth
                />
                
                {['text', 'number', 'textarea'].includes(selectedField.type) && (
                  <TextField
                    label="Placeholder"
                    value={selectedField.placeholder || ''}
                    onChange={(e) => updateSelectedField('placeholder', e.target.value)}
                    size="small"
                    fullWidth
                  />
                )}

                {selectedField.type === 'select' && (
                  <TextField
                    label="Options (comma separated)"
                    value={selectedField.options || ''}
                    onChange={(e) => updateSelectedField('options', e.target.value)}
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                  />
                )}

                <FormControl size="small">
                  <InputLabel>Required</InputLabel>
                  <Select
                    value={selectedField.required ? 'yes' : 'no'}
                    label="Required"
                    onChange={(e) => updateSelectedField('required', e.target.value === 'yes')}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            ) : (
              <Typography color="textSecondary" variant="body2">
                Select a field on the canvas to edit its properties.
              </Typography>
            )}
          </Paper>

        </Box>
      </DragDropContext>
    </Box>
  );
};

export default FormBuilder;
