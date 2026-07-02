import { useRef, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Chip, Divider, CircularProgress, List, ListItem,
  ListItemIcon, ListItemText, Tooltip, alpha, Menu, MenuItem
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ArticleIcon from "@mui/icons-material/Article";
import TableViewIcon from "@mui/icons-material/TableView";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { C } from "../../theme/colors";
import api from "../../config/axiosInstance";

const btnBase = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: 13,
  borderRadius: 2,
  px: 2,
  py: 0.8,
  gap: 0.7,
};

export default function ImportExportBar({
  entity,
  exportRows = [],
  onExport,
  onTemplate,
  onImport,
  onImportDone,
  centerContent = null
}) {
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [result, setResult] = useState(null);

  const [importAnchor, setImportAnchor] = useState(null);
  const [exportAnchor, setExportAnchor] = useState(null);
  const [templateAnchor, setTemplateAnchor] = useState(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleExportCsv = () => { if (onExport) onExport("csv"); setExportAnchor(null); };
  const handleExportExcel = () => { if (onExport) onExport("excel"); setExportAnchor(null); };
  const handleTemplateCsv = () => { if (onTemplate) onTemplate("csv"); setTemplateAnchor(null); };
  const handleTemplateExcel = () => { if (onTemplate) onTemplate("excel"); setTemplateAnchor(null); };

  const openUploadModal = (type) => {
    setUploadType(type);
    setSelectedFile(null);
    setUploadModalOpen(true);
    setImportAnchor(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    if (selectedFile.size > 5 * 1024 * 1024) {
      setResult({ success: false, imported: 0, failed: 0, errors: ["File size exceeds the maximum limit of 5MB."] });
      setResultOpen(true);
      setUploadModalOpen(false);
      return;
    }
    setImporting(true);
    try {
      const res = await onImport(selectedFile);
      setResult(res);
      setResultOpen(true);
      if (res.imported > 0 && onImportDone) onImportDone();
      setUploadModalOpen(false);
    } catch (err) {
      setResult({
        imported: 0,
        skipped: 0,
        errors: [err?.response?.data?.message || "Import failed. Check file format."],
      });
      setResultOpen(true);
      setUploadModalOpen(false);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadFailedExcel = async () => {
    if (!result?.failedFileUrl) return;
    try {
      const res = await api.get(result.failedFileUrl, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "failed_import_rows.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore; user can retry
    }
  };

  return (
    <>
      {/* ── Filters Section ── */}
      {centerContent && (
        <Box sx={{ mb: 2.5 }}>
          {centerContent}
        </Box>
      )}

      {/* ── Bulk Actions Section ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          gap: 2,
          mb: 2.5,
          p: 2,
          backgroundColor: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: "14px",
          boxShadow: "0 1px 3px rgba(15,23,42,0.02)",
        }}
      >
        {/* LEFT */}
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: C.slateMid,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              whiteSpace: "nowrap"
            }}
          >
            Bulk Actions
          </Typography>
          {exportRows.length > 0 && (
            <Chip
              label={`${exportRows.length} visible`}
              size="small"
              sx={{
                fontSize: 10,
                fontWeight: 700,
                height: 20,
                backgroundColor: `${C.blue}15`,
                color: C.blue,
                border: `1px solid ${C.blue}25`,
              }}
            />
          )}
        </Box>

        {/* RIGHT */}
        <Box display="flex" gap={1.5} flexWrap="wrap" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
          <Button
            size="small"
            variant="text"
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => setTemplateAnchor(e.currentTarget)}
            sx={{ ...btnBase, color: C.slate, "&:hover": { backgroundColor: alpha("#64748b", 0.06) } }}
          >
            Template
          </Button>
          <Menu
            anchorEl={templateAnchor}
            open={Boolean(templateAnchor)}
            onClose={() => setTemplateAnchor(null)}
            PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 200, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" } }}
          >
            <MenuItem onClick={handleTemplateCsv} sx={{ fontSize: 13, fontWeight: 500, py: 1.5 }}><ArticleIcon sx={{ fontSize: 18, mr: 1.5, color: C.slate }} /> Download CSV Template</MenuItem>
            <MenuItem onClick={handleTemplateExcel} sx={{ fontSize: 13, fontWeight: 500, py: 1.5 }}><TableViewIcon sx={{ fontSize: 18, mr: 1.5, color: C.slate }} /> Download Excel Template</MenuItem>
          </Menu>

          <Button
            size="small"
            variant="outlined"
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => setExportAnchor(e.currentTarget)}
            disabled={exportRows.length === 0}
            sx={{ ...btnBase, color: C.navy, borderColor: C.border, "&:hover": { borderColor: C.navy, backgroundColor: alpha("#0f172a", 0.04) } }}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={() => setExportAnchor(null)}
            PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 160, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" } }}
          >
            <MenuItem onClick={handleExportCsv} sx={{ fontSize: 13, fontWeight: 500, py: 1.5 }}><FileDownloadIcon sx={{ fontSize: 18, mr: 1.5, color: C.teal }} /> Export CSV</MenuItem>
            <MenuItem onClick={handleExportExcel} sx={{ fontSize: 13, fontWeight: 500, py: 1.5 }}><TableViewIcon sx={{ fontSize: 18, mr: 1.5, color: C.teal }} /> Export Excel</MenuItem>
          </Menu>

          <Button
            size="small"
            variant="contained"
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => setImportAnchor(e.currentTarget)}
            sx={{ ...btnBase, backgroundColor: C.blue, boxShadow: "none", "&:hover": { backgroundColor: C.blueDark, boxShadow: "none" } }}
          >
            Import
          </Button>
          <Menu
            anchorEl={importAnchor}
            open={Boolean(importAnchor)}
            onClose={() => setImportAnchor(null)}
            PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 160, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" } }}
          >
            <MenuItem onClick={() => openUploadModal('csv')} sx={{ fontSize: 13, fontWeight: 500, py: 1.5 }}><UploadFileIcon sx={{ fontSize: 18, mr: 1.5, color: C.blue }} /> Import CSV</MenuItem>
            <MenuItem onClick={() => openUploadModal('excel')} sx={{ fontSize: 13, fontWeight: 500, py: 1.5 }}><UploadFileIcon sx={{ fontSize: 18, mr: 1.5, color: "#107c41" }} /> Import Excel</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* ── Upload Modal (Drag & Drop) ── */}
      <Dialog open={uploadModalOpen} onClose={() => !importing && setUploadModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography fontWeight="800" fontSize={16} color={C.navy}>
            Upload {uploadType === 'csv' ? 'CSV' : 'Excel'}
          </Typography>
          <Button disabled={importing} size="small" onClick={() => setUploadModalOpen(false)} sx={{ minWidth: 0, p: 0.5, color: C.slate }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </Button>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: C.slate, mb: 3 }}>
            Upload your data to bulk import into {entity}. Ensure the file matches the provided template format.
          </Typography>
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: `2px dashed ${isDragOver ? C.blue : C.border}`,
              backgroundColor: isDragOver ? alpha("#2563eb", 0.04) : alpha("#64748b", 0.02),
              borderRadius: 3,
              p: 5,
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              "&:hover": { borderColor: C.blue, backgroundColor: alpha("#2563eb", 0.02) }
            }}
          >
            <input ref={fileInputRef} type="file" accept={uploadType === 'csv' ? ".csv" : ".xlsx, .xls"} style={{ display: "none" }} onChange={handleFileChange} />
            <CloudUploadIcon sx={{ fontSize: 48, color: isDragOver ? C.blue : C.slate, mb: 1.5, opacity: 0.8 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.navy, mb: 0.5 }}>Click or drag file to this area to upload</Typography>
            <Typography sx={{ fontSize: 12, color: C.slate }}>Supports a single {uploadType === 'csv' ? '.csv' : '.xlsx or .xls'} file</Typography>
          </Box>
          {selectedFile && (
            <Box sx={{ mt: 3, p: 2, borderRadius: 2, backgroundColor: alpha("#2563eb", 0.05), border: `1px solid ${alpha("#2563eb", 0.2)}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ArticleIcon sx={{ color: C.blue }} />
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{selectedFile.name}</Typography>
                <Typography sx={{ fontSize: 11, color: C.slate }}>{(selectedFile.size / 1024).toFixed(1)} KB</Typography>
              </Box>
              <Button size="small" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} sx={{ minWidth: 0, p: 0.5, color: C.slate }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setUploadModalOpen(false)} disabled={importing} sx={{ textTransform: "none", color: C.slate, fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleConfirmUpload} disabled={!selectedFile || importing} variant="contained" sx={{ textTransform: "none", backgroundColor: C.blue, fontWeight: 600, borderRadius: 2, px: 3, boxShadow: "none", "&:hover": { backgroundColor: C.blueDark, boxShadow: "none" } }} startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon sx={{ fontSize: 18 }} />}>
            {importing ? "Importing..." : "Start Import"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Import Result Dialog ── */}
      <Dialog open={resultOpen} onClose={() => setResultOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <Box sx={{ px: 3, py: 2, background: `linear-gradient(135deg, ${C.navy} 0%, #1e3a5f 100%)`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography fontWeight="800" fontSize={15} color={C.white}>Import Result — {entity}</Typography>
          <Button size="small" onClick={() => setResultOpen(false)} sx={{ minWidth: 0, p: 0.5, color: C.white, opacity: 0.7 }}><CloseIcon sx={{ fontSize: 18 }} /></Button>
        </Box>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          {result && (
            <>
              <Box display="flex" gap={1.5} mb={2.5} flexWrap="wrap">
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, px: 2, py: 1, borderRadius: 2, backgroundColor: C.emeraldLight, border: `1px solid ${C.emeraldMid}` }}>
                  <CheckCircleOutlineIcon sx={{ color: C.emerald, fontSize: 18 }} />
                  <Box><Typography sx={{ fontSize: 18, fontWeight: 800, color: C.emerald, lineHeight: 1 }}>{result.imported}</Typography><Typography sx={{ fontSize: 10, color: C.emerald, fontWeight: 600 }}>IMPORTED</Typography></Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, px: 2, py: 1, borderRadius: 2, backgroundColor: C.amberLight, border: `1px solid ${C.amberMid}` }}>
                  <SkipNextIcon sx={{ color: C.amber, fontSize: 18 }} />
                  <Box><Typography sx={{ fontSize: 18, fontWeight: 800, color: C.amber, lineHeight: 1 }}>{result.failed || 0}</Typography><Typography sx={{ fontSize: 10, color: C.amber, fontWeight: 600 }}>FAILED</Typography></Box>
                </Box>
                {result.errors?.length > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, px: 2, py: 1, borderRadius: 2, backgroundColor: C.redLight, border: `1px solid ${C.redLight}` }}>
                    <ErrorOutlineIcon sx={{ color: C.red, fontSize: 18 }} />
                    <Box><Typography sx={{ fontSize: 18, fontWeight: 800, color: C.red, lineHeight: 1 }}>{result.errors.length}</Typography><Typography sx={{ fontSize: 10, color: C.red, fontWeight: 600 }}>ISSUES</Typography></Box>
                  </Box>
                )}
              </Box>
              {result.errors?.length > 0 && (
                <>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.7, mb: 1 }}>Row Details</Typography>
                  <Box sx={{ maxHeight: 240, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 2, backgroundColor: C.surface }}>
                    <List dense disablePadding>
                      {result.errors.map((msg, i) => (
                        <ListItem key={i} divider={i < result.errors.length - 1} sx={{ py: 0.8, px: 2 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}><ErrorOutlineIcon sx={{ fontSize: 15, color: C.red }} /></ListItemIcon>
                          <ListItemText primary={msg} primaryTypographyProps={{ fontSize: 12, color: C.navy, fontWeight: 500 }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </>
              )}
              {result.imported > 0 && result.errors?.length === 0 && (
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: C.emeraldLight, border: `1px solid ${C.emeraldMid}`, textAlign: "center" }}>
                  <Typography sx={{ color: C.emerald, fontWeight: 700, fontSize: 13 }}>✓ All rows imported successfully!</Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, display: "flex", justifyContent: result?.failedFileUrl ? "space-between" : "flex-end" }}>
          {result?.failedFileUrl && (
            <Button
              onClick={handleDownloadFailedExcel}
              variant="outlined"
              color="error"
              startIcon={<FileDownloadIcon sx={{ fontSize: 18 }} />}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Download Failed Rows
            </Button>
          )}
          <Button onClick={() => setResultOpen(false)} variant="contained" sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3, backgroundColor: C.blue, boxShadow: "none", "&:hover": { backgroundColor: C.blueDark, boxShadow: "none" } }}>Done</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
