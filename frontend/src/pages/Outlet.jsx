import { useEffect, useState } from "react";
import { GetOutlets, DeleteOutlet, UpdateOutlet, CreateOutlet } from "../services/OutletService";
import { Box } from "@mui/material";
import { toast } from "react-toastify";
import OutletTable from "../components/Outlets/OutletTable";
import OutletForm from "../components/Outlets/OutletForm";
import OutletFilter from "../components/Outlets/OutletFilter";
import OutletPagination from "../components/Outlets/OutletPagination";
import PageHeader from "../components/shared/PageHeader";
import { C } from "../theme/colors";

const emptyForm = { outletName: "", locationId: "", outletType: "", ownerName: "", address: "", divisionIds: [], productIds: [] };
const emptyFilters = { keyword: "", locationId: "", divisionId: "", outletType: "" };

export default function Outlet() {
  const [outlets, setOutlets] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  const fetchOutlets = async () => {
    try {
      const params = {
        page, size: 10,
        keyword: filters.keyword || undefined,
        locationId: filters.locationId || undefined,
        divisionId: filters.divisionId || undefined,
        outletType: filters.outletType || undefined,
      };
      const res = await GetOutlets(params);
      setOutlets(res.outlets);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load outlets");
    }
  };

  useEffect(() => { fetchOutlets(); }, [page, filters]);

  const handleFilterChange = (newFilters) => { setPage(0); setFilters(newFilters); };

  const handleOpen = (outlet = null) => {
    if (outlet) {
      setForm({
        outletName: outlet.outletName, locationId: outlet.locationId || "",
        outletType: outlet.outletType, ownerName: outlet.ownerName, address: outlet.address,
        divisionIds: outlet.divisions?.map((d) => d.id) || [],
        productIds: outlet.divisions?.flatMap((d) => d.products?.map((p) => p.id) || []) || [],
      });
      setSelectedId(outlet.id);
    } else {
      setForm(emptyForm);
      setSelectedId(null);
    }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setForm(emptyForm); setErrors({}); setSelectedId(null); };

  const handleSubmit = async (payload) => {
    try {
      if (selectedId) { await UpdateOutlet(selectedId, payload); toast.success("Outlet updated!"); }
      else { await CreateOutlet(payload); toast.success("Outlet created!"); }
      handleClose(); fetchOutlets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this outlet?")) return;
    try {
      await DeleteOutlet(id);
      toast.success("Outlet deleted!");
      fetchOutlets();
    } catch {
      toast.error("Failed to delete outlet");
    }
  };

  return (
    <Box sx={{ backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Outlets" subtitle="Manage your outlet network" onAdd={() => handleOpen()} addLabel="Add Outlet" />
      <OutletFilter filters={filters} onChange={handleFilterChange} />
      <OutletTable outlets={outlets} onEdit={handleOpen} onDelete={handleDelete} />
      <OutletPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <OutletForm open={open} form={form} setForm={setForm} errors={errors} setErrors={setErrors}
        selectedId={selectedId} onClose={handleClose} onSubmit={handleSubmit} />
    </Box>
  );
}
