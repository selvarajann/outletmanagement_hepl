import { useState, useRef } from "react";
import { GetProducts, DeleteProduct, UpdateProduct, CreateProduct, ImportProducts, UploadProductImage, ExportProducts, GetProductTemplate } from "../services/ProductService";
import { Box, CircularProgress, Typography, Grid, Skeleton } from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import InfoCard from "../components/shared/InfoCard";
import { toast } from "react-toastify";
import ProductTable from "../components/Products/ProductTable";
import ProductForm from "../components/Products/ProductForm";
import ProductFilter from "../components/Products/ProductFilter";
import TablePagination from "../components/shared/TablePagination";
import PageHeader from "../components/shared/PageHeader";
import ViewDialog, { ViewRow } from "../components/shared/ViewDialog";
import ImportExportBar from "../components/shared/ImportExportBar";
import { C } from "../theme/colors";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DebouncedSearchInput from "../components/common/DebouncedSearchInput";

const emptyForm = { name: "", productCode: "", divisionId: "", uimPrice: "", mrp: "", sellingPrice: "", purchasePrice: "" };
const emptyFilters = { keyword: "", divisionId: "", minSellingPrice: "", maxSellingPrice: "", minPurchasePrice: "", maxPurchasePrice: "" };

const validate = (form) => {
  const e = {};
  if (!form.name.trim()) e.name = "Product name is required";
  else if (/\d/.test(form.name)) e.name = "Numbers are not allowed in product name";
  else if (form.name.trim().length < 2) e.name = "Must be at least 2 characters";
  if (!form.productCode.trim()) e.productCode = "Product code is required";
  else if (!/^[A-Za-z0-9_-]+$/.test(form.productCode)) e.productCode = "Only letters, numbers, - and _ allowed";
  if (!form.divisionId) e.divisionId = "Division is required";
  if (form.uimPrice === "" || isNaN(form.uimPrice) || Number(form.uimPrice) < 0) e.uimPrice = "Valid UIM price required";
  if (form.mrp === "" || isNaN(form.mrp) || Number(form.mrp) < 0) e.mrp = "Valid MRP required";
  if (form.sellingPrice === "" || isNaN(form.sellingPrice) || Number(form.sellingPrice) < 0) e.sellingPrice = "Valid selling price required";
  if (form.purchasePrice === "" || isNaN(form.purchasePrice) || Number(form.purchasePrice) < 0) e.purchasePrice = "Valid purchase price required";
  return e;
};

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function Product() {
  const queryClient = useQueryClient();
  const searchSignalRef = useRef(null);

  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  // 1. Fetching Data with React Query
  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['products', page, filters],
    queryFn: async ({ signal }) => {
      // Use the signal from useQuery (which handles cancellation automatically when keys change)
      // and merge with our explicit search signal if provided.
      const abortSignal = searchSignalRef.current || signal;
      const params = { page, size: 10, ...filters };
      // Strip empty filters
      Object.keys(params).forEach(k => {
        if (params[k] === "" || params[k] === null || params[k] === undefined) delete params[k];
      });
      const res = await GetProducts(params, abortSignal);
      return { rows: res.products, totalPages: res.totalPages };
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const products = data?.rows || [];
  const totalPages = data?.totalPages || 0;

  // 2. Mutations
  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (selectedId) {
        return await UpdateProduct(selectedId, payload);
      } else {
        return await CreateProduct(payload);
      }
    },
    onSuccess: () => {
      toast.success(selectedId ? "Product updated!" : "Product created!");
      handleClose();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      const res = err.response?.data;
      if (res?.data && typeof res.data === "object") setErrors(res.data);
      else toast.error(res?.message || "Operation failed");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => DeleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted!");
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleSearch = (keyword, signal) => {
    searchSignalRef.current = signal;
    handleFilterChange({ ...filters, keyword });
  };

  const handleOpen = (product = null) => {
    if (product) { setForm({ ...product, divisionId: product.divisionId || "" }); setSelectedId(product.id); }
    else { setForm(emptyForm); setSelectedId(null); }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setForm(emptyForm); setErrors({}); setSelectedId(null); };

  const handleSubmit = async () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    const payload = { name: form.name, productCode: form.productCode, divisionId: Number(form.divisionId), uimPrice: Number(form.uimPrice), mrp: Number(form.mrp), sellingPrice: Number(form.sellingPrice), purchasePrice: Number(form.purchasePrice) };
    mutation.mutate(payload);
  };

  const handleDelete = (id) => deleteMutation.mutate(id);

  const handleImageUpload = async (product, file) => {
    try {
      await UploadProductImage(product.id, file);
      toast.success("Image uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload image");
    }
  };

  const totalSelling = products.reduce((s, p) => s + (p.sellingPrice || 0), 0);
  const totalPurchase = products.reduce((s, p) => s + (p.purchasePrice || 0), 0);

  const cards = [
    { title: "Total Products",       value: loading ? "—" : products.length,              icon: <Inventory2Icon          />, color: C.blue    },
    { title: "Total Selling Value",  value: loading ? "—" : fmt(totalSelling),            icon: <TrendingUpIcon          />, color: C.teal    },
    { title: "Total Purchase Cost",  value: loading ? "—" : fmt(totalPurchase),           icon: <AccountBalanceWalletIcon/>, color: C.amber   },
    { title: "Gross Profit",         value: loading ? "—" : fmt(totalSelling - totalPurchase), icon: <ShowChartIcon      />, color: C.emerald },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Products" subtitle="Manage your product catalog" onAdd={() => handleOpen()} addLabel="Add Product" />
      <ImportExportBar
        entity="Products"
        exportRows={products}
        onExport={async (format) => {
          try {
            const blob = await ExportProducts(filters, format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `products_export.${format === "excel" ? "xlsx" : "csv"}`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (err) {
            toast.error("Failed to export products");
          }
        }}
        onTemplate={async (format) => {
          try {
            const blob = await GetProductTemplate(format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `products_template.${format === "excel" ? "xlsx" : "csv"}`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (err) {
            toast.error("Failed to download template");
          }
        }}
        onImport={(file) => ImportProducts(file)}
        onImportDone={() => { queryClient.invalidateQueries(['products']); toast.success("Import complete — table refreshed."); }}
        centerContent={<ProductFilter filters={filters} onChange={handleFilterChange} onSearch={handleSearch} />}
      />
      <Grid container spacing={2.5} mb={3}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} lg={3} key={c.title}>
            {loading ? <Skeleton variant="rounded" height={82} sx={{ borderRadius: 3 }} /> : <InfoCard {...c} />}
          </Grid>
        ))}
      </Grid>
      {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} sx={{ color: C.blue }} /></Box>}
      {!loading && <ProductTable products={products} onEdit={handleOpen} onDelete={handleDelete} onView={setViewItem} onImageUpload={handleImageUpload} />}
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ProductForm open={open} form={form} setForm={setForm} errors={errors} setErrors={setErrors} selectedId={selectedId} onClose={handleClose} onSubmit={handleSubmit} loading={mutation.isPending} />

      <ViewDialog open={!!viewItem} onClose={() => setViewItem(null)} title="Product Details">
        {viewItem && (
          <>
            <ViewRow label="Name" value={viewItem.name} />
            <ViewRow label="Product Code" value={viewItem.productCode} />
            <ViewRow label="Division" value={viewItem.divisionName} />
            <ViewRow label="UIM Price" value={<Typography sx={{ fontWeight: 700, color: C.slate }}>{fmt(viewItem.uimPrice ?? 0)}</Typography>} />
            <ViewRow label="MRP" value={<Typography sx={{ fontWeight: 700, color: C.slate }}>{fmt(viewItem.mrp ?? 0)}</Typography>} />
            <ViewRow label="Selling Price" value={<Typography sx={{ fontWeight: 700, color: C.emerald }}>{fmt(viewItem.sellingPrice ?? 0)}</Typography>} />
            <ViewRow label="Purchase Price" value={<Typography sx={{ fontWeight: 700, color: C.amber }}>{fmt(viewItem.purchasePrice ?? 0)}</Typography>} />
          </>
        )}
      </ViewDialog>
    </Box>
  );
}
