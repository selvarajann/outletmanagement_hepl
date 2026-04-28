import { useEffect, useState } from "react";
import { GetDivisions, DeleteDivision, UpdateDivision, CreateDivision } from "../services/DivisionService";
import { Box } from "@mui/material";
import { toast } from "react-toastify";
import DivisionTable from "../components/Divisions/DivisionTable";
import DivisionForm from "../components/Divisions/DivisionForm";
import DivisionFilter from "../components/Divisions/DivisionFilter";
import DivisionPagination from "../components/Divisions/DivisionPagination";
import PageHeader from "../components/shared/PageHeader";
import { C } from "../theme/colors";

const emptyForm = { name: "", productIds: [] };
const emptyFilters = { keyword: "", hasProducts: "" };

const validate = (form) => {
  const e = {};
  if (!form.name.trim()) e.name = "Division name is required";
  return e;
};

export default function Division() {
  const [divisions, setDivisions] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  const fetchDivisions = async () => {
    try {
      const params = {
        page, size: 10,
        keyword: filters.keyword || undefined,
        hasProducts: filters.hasProducts !== "" ? filters.hasProducts : undefined,
      };
      const res = await GetDivisions(params);
      setDivisions(res.divisions);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load divisions");
    }
  };

  useEffect(() => { fetchDivisions(); }, [page, filters]);

  const handleFilterChange = (newFilters) => { setPage(0); setFilters(newFilters); };

  const handleOpen = (division = null) => {
    if (division) {
      setForm({ name: division.name, productIds: division.products?.map((p) => p.id) || [] });
      setSelectedId(division.id);
    } else {
      setForm(emptyForm);
      setSelectedId(null);
    }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setForm(emptyForm); setErrors({}); setSelectedId(null); };

  const handleSubmit = async () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      if (selectedId) { await UpdateDivision(selectedId, form); toast.success("Division updated!"); }
      else { await CreateDivision(form); toast.success("Division created!"); }
      handleClose(); fetchDivisions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this division?")) return;
    try {
      await DeleteDivision(id);
      toast.success("Division deleted!");
      fetchDivisions();
    } catch {
      toast.error("Failed to delete division");
    }
  };

  return (
    <Box sx={{ backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Divisions" subtitle="Manage product divisions" onAdd={() => handleOpen()} addLabel="Add Division" />
      <DivisionFilter filters={filters} onChange={handleFilterChange} />
      <DivisionTable divisions={divisions} onEdit={handleOpen} onDelete={handleDelete} />
      <DivisionPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <DivisionForm open={open} form={form} setForm={setForm} errors={errors} selectedId={selectedId} onClose={handleClose} onSubmit={handleSubmit} />
    </Box>
  );
}
