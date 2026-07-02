import { useState, useEffect } from "react";
import { C } from "../theme/colors";
import { Box, Button, Chip } from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
import api from "../config/axiosInstance";
import PageHeader from "../components/shared/PageHeader";
import EnterpriseTable from "../components/shared/EnterpriseTable";

const SystemReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports?size=50&sort=generatedAt,desc");
      if (res.data && res.data.content) {
        setReports(res.data.content);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case "EXPIRY": return "warning";
      case "DEAD_LETTER": return "error";
      case "RECONCILIATION": return "info";
      case "AUDIT": return "success";
      default: return "default";
    }
  };

  const columns = [
    { key: "generatedAt", label: "Generated At", render: (row) => new Date(row.generatedAt).toLocaleString() },
    { key: "reportType", label: "Type", render: (row) => <Chip size="small" label={row.reportType} color={getReportTypeColor(row.reportType)} sx={{ fontWeight: 600 }} /> },
    { key: "fileName", label: "File Name" },
    { key: "actions", label: "Actions", align: "right", render: (row) => (
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          href={`http://localhost:8080${row.fileUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Download
        </Button>
    )},
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader 
        title="System Reports" 
        subtitle="Download generated reports and exports" 
      />
      <EnterpriseTable
        data={reports}
        columns={columns}
        emptyMessage="No reports generated yet."
      />
    </Box>
  );
};

export default SystemReports;
