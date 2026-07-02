import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GetOutlets, DeleteOutlet, UpdateOutlet, CreateOutlet } from "../services/OutletService";
import { invalidateMaster } from "../hooks/useMasterData";
import { Box, CircularProgress, Chip, Typography, Grid, Skeleton } from "@mui/material";
import StoreIcon from "@mui/icons-material/Store";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CategoryIcon from "@mui/icons-material/Category";
import PersonIcon from "@mui/icons-material/Person";
import InfoCard from "../components/shared/InfoCard";
import { toast } from "react-toastify";
import OutletTable from "../components/Outlets/OutletTable";
import OutletForm from "../components/Outlets/OutletForm";
import OutletFilter from "../components/Outlets/OutletFilter";
import TablePagination from "../components/shared/TablePagination";
import PageHeader from "../components/shared/PageHeader";
import ViewDialog, { ViewRow } from "../components/shared/ViewDialog";
import { C } from "../theme/colors";
import usePaginatedFetch from "../hooks/usePaginatedFetch";

const emptyForm = { outletName: "", locationId: "", outletType: "", ownerName: "", address: "", divisionIds: [], productIds: [] };
const emptyFilters = { keyword: "", locationId: "", divisionId: "", outletType: "" };

const validateOutlet = (form) => {
  const e = {};
  if (!form.outletName.trim()) e.outletName = "Outlet name is required";
  else if (/\d/.test(form.outletName)) e.outletName = "Numbers are not allowed in outlet name";
  else if (form.outletName.trim().length < 2) e.outletName = "Must be at least 2 characters";
  if (!form.locationId) e.locationId = "Location is required";
  if (!form.outletType) e.outletType = "Outlet type is required";
  if (!form.ownerName.trim()) e.ownerName = "Owner name is required";
  else if (/\d/.test(form.ownerName)) e.ownerName = "Numbers are not allowed in owner name";
  if (!form.address.trim()) e.address = "Address is required";
  else if (form.address.trim().length < 5) e.address = "Address must be at least 5 characters";
  if (!form.divisionIds.length) e.divisionIds = "Select at least one division";
  return e;
};

const fetchOutlets = async ({ page, size, keyword, locationId, divisionId, outletType }, signal) => {
  const res = await GetOutlets({ page, size, keyword: keyword || undefined, locationId: locationId || undefined, divisionId: divisionId || undefined, outletType: outletType || undefined }, signal);
  return { rows: res.outlets, totalPages: res.totalPages };
};

export default function Outlet() {
  const debounceTimer = useRef(null);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(emptyFilters);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const { rows: outlets, totalPages, loading, refetch } = usePaginatedFetch(fetchOutlets, { page, filters: debouncedFilters }, "outlets");

  const abortRef = useRef(null);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { if (page !== 0) setPage(0); setDebouncedFilters(newFilters); }, 500);
  }, [page]);

  const handleOpen = (outlet = null) => {
    if (outlet) {
      setForm({ outletName: outlet.outletName, locationId: outlet.locationId || "", outletType: outlet.outletType, ownerName: outlet.ownerName, address: outlet.address, divisionIds: outlet.divisions?.map((d) => d.id) || [], productIds: outlet.divisions?.flatMap((d) => d.products?.map((p) => p.id) || []) || [] });
      setSelectedId(outlet.id);
    } else { setForm(emptyForm); setSelectedId(null); }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setForm(emptyForm); setErrors({}); setSelectedId(null); };

  const handleSubmit = async (payload) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    try {
      if (selectedId) { await UpdateOutlet(selectedId, payload); toast.success("Outlet updated!"); }
      else { await CreateOutlet(payload); toast.success("Outlet created!"); }
      handleClose(); refetch(); invalidateMaster(queryClient, "outlets");
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
      await DeleteOutlet(id); toast.success("Outlet deleted!"); refetch(); invalidateMaster(queryClient, "outlets");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete outlet");
    }
  };

  const typeCount = outlets.reduce((acc, o) => { acc[o.outletType] = (acc[o.outletType] || 0) + 1; return acc; }, {});
  const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const uniqueLocations = [...new Set(outlets.map((o) => o.locationName).filter(Boolean))].length;

  const cards = [
    { title: "Total Outlets",      value: loading ? "—" : outlets.length,                                                                       icon: <StoreIcon       />, color: C.blue    },
    { title: "Unique Locations",   value: loading ? "—" : uniqueLocations,                                                                      icon: <LocationOnIcon  />, color: C.amber   },
    { title: "Top Outlet Type",    value: loading ? "—" : topType,                                                                              icon: <CategoryIcon    />, color: C.teal    },
    { title: "Owners Registered",  value: loading ? "—" : [...new Set(outlets.map((o) => o.ownerName).filter(Boolean))].length,                  icon: <PersonIcon      />, color: C.emerald },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Outlets" subtitle="Manage your outlet network" onAdd={() => handleOpen()} addLabel="Add Outlet" />
      <Grid container spacing={2.5} mb={3}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} lg={3} key={c.title}>
            {loading ? <Skeleton variant="rounded" height={82} sx={{ borderRadius: 3 }} /> : <InfoCard {...c} />}
          </Grid>
        ))}
      </Grid>
      <OutletFilter filters={filters} onChange={handleFilterChange} />
      {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} sx={{ color: C.blue }} /></Box>}
      {!loading && <OutletTable outlets={outlets} onEdit={handleOpen} onDelete={handleDelete} onView={setViewItem} />}
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <OutletForm open={open} form={form} setForm={setForm} errors={errors} setErrors={setErrors} selectedId={selectedId} onClose={handleClose} onSubmit={handleSubmit} />

      <ViewDialog open={!!viewItem} onClose={() => setViewItem(null)} title="Outlet Details" maxWidth="md">
        {viewItem && (
          <>
            <ViewRow label="Outlet Name" value={viewItem.outletName} />
            <ViewRow label="Outlet Code" value={viewItem.outletCode} />
            <ViewRow label="Type"        value={viewItem.outletType} />
            <ViewRow label="Owner"       value={viewItem.ownerName} />
            <ViewRow label="Location"    value={viewItem.locationName} />
            <ViewRow label="Address"     value={viewItem.address} />
            <ViewRow label="Divisions"   value={
              viewItem.divisions?.length > 0
                ? <Box display="flex" flexWrap="wrap" gap={0.5}>{viewItem.divisions.map((d) => <Chip key={d.id} label={d.name} size="small" sx={{ backgroundColor: C.emeraldLight, color: C.emerald, fontWeight: 600, fontSize: 11 }} />)}</Box>
                : "No divisions"
            } />
            <ViewRow label="Products" value={
              viewItem.divisions?.some((d) => d.products?.length > 0) ? (
                <Box display="flex" flexDirection="column" gap={1.5} width="100%">
                  {viewItem.divisions.filter((d) => d.products?.length > 0).map((d) => (
                    <Box key={d.id}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5 }}>
                        {d.name}
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {d.products.map((p) => (
                          <Chip
                            key={p.id}
                            label={`${p.name}${p.productCode ? ` (${p.productCode})` : ""}`}
                            size="small"
                            sx={{ backgroundColor: C.blueLight, color: C.blue, fontWeight: 600, fontSize: 11, borderRadius: 1 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : "No products"
            } />
          </>
        )}
      </ViewDialog>
    </Box>
  );
}
