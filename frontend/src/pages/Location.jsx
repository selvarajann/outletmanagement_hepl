import { useState, useEffect, useRef } from "react";
import { GetLocations, DeleteLocation, UpdateLocation, CreateLocation, ImportLocations, ExportLocations, GetLocationTemplate } from "../services/LocationService";
import { Box, CircularProgress, Grid, Skeleton } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import InfoCard from "../components/shared/InfoCard";
import { toast } from "react-toastify";
import LocationTable from "../components/Locations/LocationTable";
import LocationForm from "../components/Locations/LocationForm";
import LocationFilter from "../components/Locations/LocationFilter";
import TablePagination from "../components/shared/TablePagination";
import PageHeader from "../components/shared/PageHeader";
import ViewDialog, { ViewRow } from "../components/shared/ViewDialog";
import ImportExportBar from "../components/shared/ImportExportBar";
import { C } from "../theme/colors";
import usePaginatedFetch from "../hooks/usePaginatedFetch";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateMaster } from "../hooks/useMasterData";

const emptyForm = { name: "" };
const emptyFilters = { keyword: "" };

const validate = (form) => {
  const e = {};
  if (!form.name.trim()) e.name = "Location name is required";
  else if (/\d/.test(form.name)) e.name = "Numbers are not allowed in location name";
  else if (form.name.trim().length < 2) e.name = "Must be at least 2 characters";
  return e;
};

const fetchLocations = async ({ page, size, keyword }, signal) => {
  const res = await GetLocations({ page, size, keyword: keyword || undefined }, signal);
  return { rows: res.locations, totalPages: res.totalPages };
};

export default function Location() {
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

  const { rows: locations, totalPages, loading, refetch } = usePaginatedFetch(fetchLocations, { page, filters: debouncedFilters });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { if (page !== 0) setPage(0); setDebouncedFilters(newFilters); }, 500);
  };

  const handleOpen = (location = null) => {
    if (location) { setForm({ name: location.name }); setSelectedId(location.id); }
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
      if (selectedId) { await UpdateLocation(selectedId, form, signal); toast.success("Location updated!"); }
      else { await CreateLocation(form, signal); toast.success("Location created!"); }
      handleClose(); refetch(); invalidateMaster(queryClient, "locations");
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
      await DeleteLocation(id, signal); toast.success("Location deleted!"); refetch(); invalidateMaster(queryClient, "locations");
    } catch (err) {
      if (err.name === "AbortError" || err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      toast.error(err.response?.data?.message || "Failed to delete location");
    }
  };

  const cards = [
    { title: "Total Locations",  value: loading ? "—" : locations.length, icon: <LocationOnIcon />, color: C.blue },
    { title: "Filtered Results", value: loading ? "—" : locations.length, icon: <LocationOnIcon />, color: C.teal },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Locations" subtitle="Manage outlet locations" onAdd={() => handleOpen()} addLabel="Add Location" />
      <ImportExportBar
        entity="Locations"
        exportRows={locations}
        onExport={async (format) => {
          try {
            const blob = await ExportLocations(debouncedFilters, format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `locations_export.${format === "excel" ? "xlsx" : "csv"}`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (err) {
            toast.error("Failed to export locations");
          }
        }}
        onTemplate={async (format) => {
          try {
            const blob = await GetLocationTemplate(format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `locations_template.${format === "excel" ? "xlsx" : "csv"}`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (err) {
            toast.error("Failed to download template");
          }
        }}
        onImport={(file) => ImportLocations(file)}
        onImportDone={() => { refetch(); invalidateMaster(queryClient, "locations"); toast.success("Import complete — table refreshed."); }}
        centerContent={<LocationFilter filters={filters} onChange={handleFilterChange} />}
      />
      <Grid container spacing={2.5} mb={3}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} key={c.title}>
            {loading ? <Skeleton variant="rounded" height={82} sx={{ borderRadius: 3 }} /> : <InfoCard {...c} />}
          </Grid>
        ))}
      </Grid>
      {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} sx={{ color: C.blue }} /></Box>}
      {!loading && <LocationTable locations={locations} onEdit={handleOpen} onDelete={handleDelete} onView={setViewItem} />}
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <LocationForm open={open} form={form} setForm={setForm} errors={errors} setErrors={setErrors} selectedId={selectedId} onClose={handleClose} onSubmit={handleSubmit} />

      <ViewDialog open={!!viewItem} onClose={() => setViewItem(null)} title="Location Details">
        {viewItem && (
          <>
            <ViewRow label="Name" value={viewItem.name} />
            <ViewRow label="ID"   value={viewItem.id} />
          </>
        )}
      </ViewDialog>
    </Box>
  );
}
