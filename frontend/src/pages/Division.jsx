import { useState, useEffect, useRef } from "react";
import { GetDivisions, DeleteDivision, UpdateDivision, CreateDivision, ImportDivisions, ExportDivisions, GetDivisionTemplate } from "../services/DivisionService";
import { Box, CircularProgress, Chip, Grid, Skeleton } from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoCard from "../components/shared/InfoCard";
import { toast } from "react-toastify";
import DivisionTable from "../components/Divisions/DivisionTable";
import DivisionForm from "../components/Divisions/DivisionForm";
import DivisionFilter from "../components/Divisions/DivisionFilter";
import TablePagination from "../components/shared/TablePagination";
import PageHeader from "../components/shared/PageHeader";
import ViewDialog, { ViewRow } from "../components/shared/ViewDialog";
import ImportExportBar from "../components/shared/ImportExportBar";
import { C } from "../theme/colors";
import usePaginatedFetch from "../hooks/usePaginatedFetch";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateMaster } from "../hooks/useMasterData";

const emptyForm = { name: "", productIds: [] };
const emptyFilters = { keyword: "", hasProducts: "" };

const validate = (form) => {
  const e = {};
  if (!form.name.trim()) e.name = "Division name is required";
  else if (/\d/.test(form.name)) e.name = "Numbers are not allowed in division name";
  else if (form.name.trim().length < 2) e.name = "Must be at least 2 characters";
  return e;
};

const fetchDivisions = async ({ page, size, keyword, hasProducts }, signal) => {
  const res = await GetDivisions({ page, size, keyword: keyword || undefined, hasProducts: hasProducts !== "" ? hasProducts : undefined }, signal);
  return { rows: res.divisions, totalPages: res.totalPages };
};

export default function Division() {
  const abortRef = useRef(null);
  const debounceTimer = useRef(null);
  const queryClient = useQueryClient();
  useEffect(() => () => { abortRef.current?.abort(); clearTimeout(debounceTimer.current); }, []);

  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(emptyFilters);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const { rows: divisions, totalPages, loading, refetch } = usePaginatedFetch(fetchDivisions, { page, filters: debouncedFilters });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { if (page !== 0) setPage(0); setDebouncedFilters(newFilters); }, 500);
  };

  const handleOpen = (division = null) => {
    if (division) { setForm({ name: division.name, productIds: division.products?.map((p) => p.id) || [] }); setSelectedId(division.id); }
    else { setForm(emptyForm); setSelectedId(null); }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setForm(emptyForm); setErrors({}); setSelectedId(null); };

  const handleSubmit = async () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    try {
      if (selectedId) { await UpdateDivision(selectedId, form, signal); toast.success("Division updated!"); }
      else { await CreateDivision(form, signal); toast.success("Division created!"); }
      handleClose(); refetch(); invalidateMaster(queryClient, "divisions");
    } catch (err) {
      if (err.name === "AbortError" || err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      const res = err.response?.data;
      if (res?.data && typeof res.data === "object") setErrors(res.data);
      else toast.error(res?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    try {
      await DeleteDivision(id, signal); toast.success("Division deleted!"); refetch(); invalidateMaster(queryClient, "divisions");
    } catch (err) {
      if (err.name === "AbortError" || err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      toast.error(err.response?.data?.message || "Failed to delete division");
    }
  };

  const totalProducts = divisions.reduce((s, d) => s + (d.products?.length || 0), 0);
  const withProducts = divisions.filter((d) => d.products?.length > 0).length;

  const cards = [
    { title: "Total Divisions", value: loading ? "—" : divisions.length,              icon: <CategoryIcon    />, color: C.blue    },
    { title: "Total Products",  value: loading ? "—" : totalProducts,                 icon: <Inventory2Icon  />, color: C.teal    },
    { title: "Active Divisions",value: loading ? "—" : withProducts,                  icon: <CheckCircleIcon />, color: C.emerald },
    { title: "Empty Divisions", value: loading ? "—" : divisions.length - withProducts,icon: <CategoryIcon   />, color: C.amber   },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Divisions" subtitle="Manage product divisions" onAdd={() => handleOpen()} addLabel="Add Division" />
      <ImportExportBar
        entity="Divisions"
        exportRows={divisions}
        onExport={async (format) => {
          try {
            const blob = await ExportDivisions(debouncedFilters, format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `divisions_export.${format === "excel" ? "xlsx" : "csv"}`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (err) {
            toast.error("Failed to export divisions");
          }
        }}
        onTemplate={async (format) => {
          try {
            const blob = await GetDivisionTemplate(format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `divisions_template.${format === "excel" ? "xlsx" : "csv"}`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (err) {
            toast.error("Failed to download template");
          }
        }}
        onImport={(file) => ImportDivisions(file)}
        onImportDone={() => { refetch(); invalidateMaster(queryClient, "divisions"); toast.success("Import complete — table refreshed."); }}
        centerContent={<DivisionFilter filters={filters} onChange={handleFilterChange} />}
      />
      <Grid container spacing={2.5} mb={3}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} lg={3} key={c.title}>
            {loading ? <Skeleton variant="rounded" height={82} sx={{ borderRadius: 3 }} /> : <InfoCard {...c} />}
          </Grid>
        ))}
      </Grid>
      {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} sx={{ color: C.blue }} /></Box>}
      {!loading && <DivisionTable divisions={divisions} onEdit={handleOpen} onDelete={handleDelete} onView={setViewItem} />}
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <DivisionForm open={open} form={form} setForm={setForm} errors={errors} setErrors={setErrors} selectedId={selectedId} onClose={handleClose} onSubmit={handleSubmit} />

      <ViewDialog open={!!viewItem} onClose={() => setViewItem(null)} title="Division Details">
        {viewItem && (
          <>
            <ViewRow label="Name"          value={viewItem.name} />
            <ViewRow label="Total Products" value={viewItem.products?.length ?? 0} />
            <ViewRow label="Products"      value={
              viewItem.products?.length > 0
                ? <Box display="flex" flexWrap="wrap" gap={0.5}>{viewItem.products.map((p) => <Chip key={p.id} label={p.name} size="small" sx={{ backgroundColor: C.blueLight, color: C.blue, fontWeight: 600, fontSize: 11 }} />)}</Box>
                : "No products"
            } />
          </>
        )}
      </ViewDialog>
    </Box>
  );
}
