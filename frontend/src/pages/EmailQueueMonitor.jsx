import { useState, useEffect } from "react";
import { C } from "../theme/colors";
import { Box, Typography, Chip, Grid } from "@mui/material";
import { Email as EmailIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon, AccessTime as AccessTimeIcon } from "@mui/icons-material";
import api from "../config/axiosInstance";
import PageHeader from "../components/shared/PageHeader";
import InfoCard from "../components/shared/InfoCard";
import EnterpriseTable from "../components/shared/EnterpriseTable";

const EmailQueueMonitor = () => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ pending: 0, sent: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [queueRes, statsRes] = await Promise.all([
        api.get("/emails/queue?size=50&sort=createdAt,desc"),
        api.get("/emails/queue/stats")
      ]);
      
      if (queueRes.data && queueRes.data.content) {
        setQueue(queueRes.data.content);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch email queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      key: "status", 
      label: "Status", 
      render: (row) => (
        <Chip 
          size="small" 
          label={row.status} 
          color={row.status === "SENT" ? "success" : row.status === "FAILED" ? "error" : "warning"} 
          sx={{ fontWeight: 600 }} 
        />
      )
    },
    { key: "toAddress", label: "To Address", render: (row) => <Typography sx={{ color: "#334155", fontWeight: 500, fontSize: "13px" }}>{row.toAddress}</Typography> },
    { key: "subject", label: "Subject" },
    { key: "createdAt", label: "Created At", render: (row) => new Date(row.createdAt).toLocaleString() },
    { 
      key: "sentAt", 
      label: "Sent At / Error", 
      render: (row) => (
        <Typography sx={{ color: "#64748b", fontSize: "13px", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {row.status === "SENT" ? (row.sentAt ? new Date(row.sentAt).toLocaleString() : "-") : row.errorReason || "-"}
        </Typography>
      )
    }
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader 
        title="Email Queue Monitor" 
        subtitle="Track background email sending jobs" 
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <InfoCard title="Pending" value={stats.pending} icon={<AccessTimeIcon />} color={C.amber} />
        </Grid>
        <Grid item xs={12} md={4}>
          <InfoCard title="Sent" value={stats.sent} icon={<CheckCircleIcon />} color={C.emerald} />
        </Grid>
        <Grid item xs={12} md={4}>
          <InfoCard title="Failed" value={stats.failed} icon={<ErrorIcon />} color={C.red} />
        </Grid>
      </Grid>
      
      <EnterpriseTable
        data={queue}
        columns={columns}
        emptyMessage="No emails in queue."
      />
    </Box>
  );
};

export default EmailQueueMonitor;
