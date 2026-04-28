import { useEffect, useState } from "react";
import { GetProducts, DeleteProduct, UpdateProduct, CreateProduct } from "../services/ProductService";
import { Box } from "@mui/material";
import { toast } from "react-toastify";
import ProductTable from "../components/Products/ProductTable";
import ProductForm from "../components/Products/ProductForm";
import ProductFilter from "../components/Products/ProductFilter";
import ProductPagination from "../components/Products/ProductPagination";
import PageHeader from "../components/shared/PageHeader";
import { C } from "../theme/colors";

const emptyForm = { name: "", productCode: "", divisionId: "", uimPrice: "", mrp: "", sellingPrice: "", purchasePrice: "" };
const emptyFilters = { keyword: "", divisionId: "", minSellingPrice: "", maxSellingPrice: "", minPurchasePrice: "", maxPurchasePrice: "" };

const validate = (form) => {
  const e = {};
  if (!form.name.trim()) e.name = "Product name is required";
  if (!form.productCode.trim()) e.productCode = "Product code is required";
  if (!form.divisionId) e.divisionId = "Division is required";
  if (form.uimPrice === "" || isNaN(form.uimPrice)) e.uimPrice = "Valid UIM price required";
  if (form.mrp === "" || isNaN(form.mrp)) e.mrp = "Valid MRP required";
  if (form.sellingPrice === "" || isNaN(form.sellingPrice)) e.sellingPrice = "Valid selling price required";
  if (form.purchasePrice === "" || isNaN(form.purchasePrice)) e.purchasePrice = "Valid purchase price required";
  return e;
};

export default function Product() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  const fetchProducts = async () => {
    try {
      const params = {
        page, size: 10,
        keyword: filters.keyword || undefined,
        divisionId: filters.divisionId || undefined,
        minSellingPrice: filters.minSellingPrice || undefined,
        maxSellingPrice: filters.maxSellingPrice || undefined,
        minPurchasePrice: filters.minPurchasePrice || undefined,
        maxPurchasePrice: filters.maxPurchasePrice || undefined,
      };
      const res = await GetProducts(params);
      setProducts(res.products);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load products");
    }
  };

  useEffect(() => { fetchProducts(); }, [page, filters]);

  const handleFilterChange = (newFilters) => { setPage(0); setFilters(newFilters); };

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
    const payload = {
      name: form.name, productCode: form.productCode,
      divisionId: Number(form.divisionId),
      uimPrice: Number(form.uimPrice), mrp: Number(form.mrp),
      sellingPrice: Number(form.sellingPrice), purchasePrice: Number(form.purchasePrice),
    };
    try {
      if (selectedId) { await UpdateProduct(selectedId, payload); toast.success("Product updated!"); }
      else { await CreateProduct(payload); toast.success("Product created!"); }
      handleClose(); fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await DeleteProduct(id);
      toast.success("Product deleted!");
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <Box sx={{ backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Products" subtitle="Manage your product catalog" onAdd={() => handleOpen()} addLabel="Add Product" />
      <ProductFilter filters={filters} onChange={handleFilterChange} />
      <ProductTable products={products} onEdit={handleOpen} onDelete={handleDelete} />
      <ProductPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ProductForm open={open} form={form} setForm={setForm} errors={errors} selectedId={selectedId} onClose={handleClose} onSubmit={handleSubmit} />
    </Box>
  );
}
