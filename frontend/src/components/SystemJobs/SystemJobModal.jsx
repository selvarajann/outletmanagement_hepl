import React, { useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Typography } from "@mui/material";
import { useForm, Controller } from "react-hook-form";

const AVAILABLE_TASKS = [
  { key: "DAILY_SALES_REPORT", label: "Daily Sales Report" },
  { key: "REMOVE_EXPIRED_QUARANTINE", label: "Remove Expired Items from Quarantine" }
];

const SystemJobModal = ({ open, onClose, onSave, isPending, initialData }) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      jobName: "",
      description: "",
      cronExpression: "",
      taskKey: "",
      status: "ACTIVE"
    }
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({ jobName: "", description: "", cronExpression: "", taskKey: "", status: "ACTIVE" });
      }
    }
  }, [open, initialData, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? "Edit Cron Job" : "Add Cron Job"}</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={3} pt={1}>
          <Controller
            name="jobName"
            control={control}
            rules={{ required: "Job Name is required" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Job Name"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                fullWidth
                multiline
                rows={2}
              />
            )}
          />

          <Controller
            name="taskKey"
            control={control}
            rules={{ required: "Task Logic is required" }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>Backend Task Logic</InputLabel>
                <Select {...field} label="Backend Task Logic">
                  {AVAILABLE_TASKS.map(task => (
                    <MenuItem key={task.key} value={task.key}>{task.label} ({task.key})</MenuItem>
                  ))}
                </Select>
                {fieldState.error && <Typography variant="caption" color="error" sx={{mt:0.5, ml:2}}>{fieldState.error.message}</Typography>}
              </FormControl>
            )}
          />

          <Controller
            name="cronExpression"
            control={control}
            rules={{ required: "Cron Expression is required" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Cron Expression"
                fullWidth
                placeholder="e.g., 0 0 * * *"
                error={!!fieldState.error}
                helperText={fieldState.error?.message || "Standard Spring cron format (second minute hour day month weekday)"}
              />
            )}
          />

          {initialData && (
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select {...field} label="Status">
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="DISABLED">Disabled</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          )}

        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit(onSave)} 
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save Job"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SystemJobModal;
