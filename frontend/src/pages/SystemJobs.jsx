import React, { useState } from "react";
import { C } from "../theme/colors";
import { Box, Grid, Chip, IconButton } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import PageHeader from "../components/shared/PageHeader";
import InfoCard from "../components/shared/InfoCard";
import EnterpriseTable from "../components/shared/EnterpriseTable";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import SystemJobModal from "../components/SystemJobs/SystemJobModal";
import { GetJobs, CreateJob, UpdateJob, DeleteJob, RunJob } from "../services/SystemJobService";

// Icons
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import BoltIcon from '@mui/icons-material/Bolt';
import BlockIcon from '@mui/icons-material/Block';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const SystemJobs = () => {
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["systemJobs"],
    queryFn: ({ signal }) => GetJobs(signal),
  });

  const createMutation = useMutation({
    mutationFn: CreateJob,
    onSuccess: () => {
      toast.success("Cron Job added successfully");
      queryClient.invalidateQueries(["systemJobs"]);
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add job")
  });

  const updateMutation = useMutation({
    mutationFn: UpdateJob,
    onSuccess: () => {
      toast.success("Cron Job updated successfully");
      queryClient.invalidateQueries(["systemJobs"]);
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update job")
  });

  const deleteMutation = useMutation({
    mutationFn: DeleteJob,
    onSuccess: () => {
      toast.success("Cron Job deleted successfully");
      queryClient.invalidateQueries(["systemJobs"]);
      setDeleteDialogOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete job")
  });

  const runMutation = useMutation({
    mutationFn: RunJob,
    onSuccess: () => {
      toast.success("Job triggered successfully!");
      queryClient.invalidateQueries(["systemJobs"]); // refresh lastExecution time
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to trigger the job.")
  });

  const handleSave = (data) => {
    if (selectedJob) {
      updateMutation.mutate({ id: selectedJob.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleRun = (jobId) => {
    runMutation.mutate(jobId);
  };

  const handleDownload = () => {
    setDownloading(true);
    window.open("http://localhost:8080/api/jobs/daily-sales-report/download", "_blank");
    toast.info("Downloading PDF...");
    setTimeout(() => setDownloading(false), 2000);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  const columns = [
    { key: "id", label: "ID", width: 60 },
    { key: "jobName", label: "JOB NAME", flex: 2 },
    { 
      key: "cronExpression", 
      label: "CRON EXPRESSION", 
      flex: 1,
      render: (row) => (
        <Chip 
          label={row.cronExpression} 
          size="small" 
          sx={{ bgcolor: "#e0e7ff", color: "#4f46e5", fontWeight: 600, fontFamily: "monospace", letterSpacing: "2px" }}
        />
      )
    },
    { 
      key: "status", 
      label: "STATUS", 
      width: 100,
      render: (row) => (
        <Chip 
          label={row.status} 
          size="small" 
          color={row.status === 'ACTIVE' ? 'success' : 'default'}
          sx={{ fontWeight: 600, px: 1 }}
        />
      )
    },
    { key: "lastExecution", label: "LAST EXECUTION", flex: 1, render: (row) => formatDateTime(row.lastExecution) },
    { key: "nextScheduled", label: "NEXT SCHEDULED", flex: 1, render: (row) => formatDateTime(row.nextScheduled) },
    {
      key: "actions",
      label: "ACTIONS",
      width: 140,
      render: (row) => (
        <Box display="flex" gap={0.5}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRun(row.id); }} disabled={runMutation.isPending && runMutation.variables === row.id}>
            <PlayArrowIcon fontSize="small" sx={{ color: C.slate }} />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedJob(row); setModalOpen(true); }}>
            <EditIcon fontSize="small" sx={{ color: C.slate }} />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setJobToDelete(row); setDeleteDialogOpen(true); }}>
            <DeleteIcon fontSize="small" sx={{ color: C.slate }} />
          </IconButton>
        </Box>
      ),
    },
  ];

  const totalTasks = jobs?.length || 0;
  const activeTasks = jobs?.filter(j => j.status === 'ACTIVE').length || 0;
  const disabledTasks = jobs?.filter(j => j.status === 'DISABLED').length || 0;

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader 
        title="Cron Job Management" 
        subtitle="Manage and trigger automated system workflows"
        addLabel="Add Cron Job"
        onAdd={() => { setSelectedJob(null); setModalOpen(true); }}
      />

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <InfoCard title="TOTAL CRON TASKS" value={totalTasks}    icon={<AlarmOnIcon />} color={C.indigo}  />
        </Grid>
        <Grid item xs={12} sm={4}>
          <InfoCard title="ACTIVE SCHEDULES" value={activeTasks}   icon={<BoltIcon    />} color={C.emerald} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <InfoCard title="DISABLED TASKS"   value={disabledTasks} icon={<BlockIcon   />} color={C.amber}   />
        </Grid>
      </Grid>

      <Box height={500}>
        <EnterpriseTable
          data={jobs || []}
          columns={columns}
        />
      </Box>

      <SystemJobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selectedJob}
        onSave={handleSave}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Cron Job"
        content="Are you sure you want to permanently delete this scheduled job?"
        onConfirm={() => deleteMutation.mutate(jobToDelete?.id)}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default SystemJobs;
