import { useEffect, useState } from "react";
import { GetLocations, DeleteLocation, UpdateLocation, CreateLocation } from "../services/LocationService";
import { Box } from "@mui/material";
import { toast } from "react-toastify";
import LocationTable from "../components/Locations/LocationTable";
import LocationForm from "../components/Locations/LocationForm";
import LocationFilter from "../components/Locations/LocationFilter";
import LocationPagination from "../components/Locations/LocationPagination";
import PageHeader from "../components/shared/PageHeader";
import { C } from "../theme/colors";

const emptyForm = { name: "" };
const emptyFilters = { keyword: "" };

const validate = (form) => {
  const e = {};
  if (!form.name.trim()) e.name = "Location name is required";
  return e;
};

export default function Location() {
  const [locations, setLocations] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  const fetchLocations = async () => {
    try {
      const res = await GetLocations({ page, size: 10, keyword: filters.keyword || undefined });
      setLocations(res.locations);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load locations");
    }
  };

  useEffect(() => { fetchLocations(); }, [page, filters]);

  const handleFilterChange = (newFilters) => { setPage(0); setFilters(newFilters); };

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
    try {
      if (selectedId) { await UpdateLocation(selectedId, form); toast.success("Location updated!"); }
      else { await CreateLocation(form); toast.success("Location created!"); }
      handleClose(); fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this location?")) return;
    try {
      await DeleteLocation(id);
      toast.success("Location deleted!");
      fetchLocations();
    } catch {
      toast.error("Failed to delete location");
    }
  };

  return (
    <Box sx={{ backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Locations" subtitle="Manage outlet locations" onAdd={() => handleOpen()} addLabel="Add Location" />
      <LocationFilter filters={filters} onChange={handleFilterChange} />
      <LocationTable locations={locations} onEdit={handleOpen} onDelete={handleDelete} />
      <LocationPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <LocationForm open={open} form={form} setForm={setForm} errors={errors} selectedId={selectedId} onClose={handleClose} onSubmit={handleSubmit} />
    </Box>
  );
}
