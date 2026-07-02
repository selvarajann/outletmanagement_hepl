import { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent, TextField, InputAdornment, Chip,
  FormControl, InputLabel, Select, MenuItem, Button, IconButton, Divider, Paper
} from "@mui/material";
import { Search as SearchIcon, Add as AddIcon, Remove as RemoveIcon, Delete as DeleteIcon, ShoppingCart as CartIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
import { useOutlets } from "../hooks/useMasterData";
import { GetStockByOutlet } from "../services/StockService";
import { ProcessSale } from "../services/SaleService";
import { C } from "../theme/colors";
import PageHeader from "../components/shared/PageHeader";

const POSSales = () => {
  const { outlets } = useOutlets();
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [stockItems, setStockItems] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!selectedOutlet && outlets.length > 0) {
      setSelectedOutlet(String(outlets[0].id));
    }
  }, [outlets, selectedOutlet]);

  useEffect(() => {
    if (!selectedOutlet) {
      setStockItems([]);
      setCart([]);
      return;
    }
    fetchStock(selectedOutlet);
  }, [selectedOutlet]);

  const fetchStock = async (outletId) => {
    try {
      const data = await GetStockByOutlet(outletId);
      // Filter out items with no stock
      setStockItems(data.filter(item => item.quantity > 0));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch stock");
    }
  };

  const filteredItems = stockItems.filter(item =>
    item.productName.toLowerCase().includes(search.toLowerCase()) ||
    (item.productCode && item.productCode.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddToCart = (item) => {
    const existing = cart.find(c => c.productId === item.productId);
    if (existing) {
      if (existing.quantity >= item.quantity) {
        toast.warn(`Only ${item.quantity} in stock`);
        return;
      }
      setCart(cart.map(c => c.productId === item.productId ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const handleUpdateCartQty = (productId, delta) => {
    setCart(cart.map(c => {
      if (c.productId === productId) {
        const stockItem = stockItems.find(s => s.productId === productId);
        const newQty = c.quantity + delta;
        if (newQty < 1) return c; // don't go below 1, use remove instead
        if (stockItem && newQty > stockItem.quantity) {
          toast.warn(`Only ${stockItem.quantity} in stock`);
          return c;
        }
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(c => c.productId !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * (item.sellingPrice || 0)), 0);

  const handleProcessSale = async () => {
    if (cart.length === 0) return;
    if (!selectedOutlet) {
      toast.error("Please select an outlet");
      return;
    }

    setProcessing(true);
    try {
      const request = {
        outletId: parseInt(selectedOutlet),
        items: cart.map(c => ({
          productId: c.productId,
          quantity: c.quantity,
          unitPrice: c.sellingPrice
        }))
      };

      await ProcessSale(request);
      toast.success("Sale completed successfully! FEFO deduction applied.");
      setCart([]);
      fetchStock(selectedOutlet); // Refresh stock
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process sale");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <PageHeader 
          title="Point of Sale" 
          subtitle="Process sales with automatic FEFO stock deduction" 
        />
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ width: 250, bgcolor: "white", borderRadius: 1 }}>
            <InputLabel>Select Outlet</InputLabel>
            <Select
              value={selectedOutlet}
              label="Select Outlet"
              onChange={(e) => setSelectedOutlet(e.target.value)}
            >
              {outlets.map((o) => (
                <MenuItem key={o.id} value={String(o.id)}>{o.outletName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 300, bgcolor: "white", borderRadius: 1 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            }}
          />
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0 }}>
        {/* Products Grid */}
        <Grid item xs={12} md={8} sx={{ height: "100%", overflowY: "auto", pr: 1 }}>
          {!selectedOutlet ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%" bgcolor="white" borderRadius={3} border={`1px dashed ${C.border}`}>
              <Typography color="textSecondary">Please select an outlet to view available stock</Typography>
            </Box>
          ) : filteredItems.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%" bgcolor="white" borderRadius={3} border={`1px dashed ${C.border}`}>
              <Typography color="textSecondary">No products in stock</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredItems.map(p => (
                <Grid item xs={12} sm={6} lg={4} key={p.productId}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      cursor: "pointer", 
                      transition: "all 0.2s",
                      border: `1px solid ${C.border}`,
                      "&:hover": { borderColor: C.blue, transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }
                    }}
                    onClick={() => handleAddToCart(p)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap title={p.productName} sx={{ color: C.navy, mb: 0.5 }}>
                        {p.productName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block" mb={1.5}>
                        {p.productCode}
                      </Typography>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontSize: 16, fontWeight: 800, color: C.blue }}>
                          ₹{(p.sellingPrice || 0).toLocaleString()}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={`Stock: ${p.quantity}`} 
                          sx={{ 
                            fontSize: 10, 
                            fontWeight: 700, 
                            backgroundColor: p.quantity > 10 ? C.emeraldLight : C.amberLight, 
                            color: p.quantity > 10 ? C.emerald : C.amber 
                          }} 
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Cart */}
        <Grid item xs={12} md={4} sx={{ height: "100%" }}>
          <Paper sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 3, border: `1px solid ${C.border}`, overflow: "hidden" }} elevation={0}>
            <Box sx={{ p: 2, backgroundColor: C.navy, color: "white", display: "flex", alignItems: "center", gap: 1 }}>
              <CartIcon fontSize="small" />
              <Typography fontWeight={700}>Current Sale</Typography>
            </Box>
            
            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, backgroundColor: C.surface }}>
              {cart.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography color="textSecondary" variant="body2">Cart is empty</Typography>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {cart.map((item) => (
                    <Box key={item.productId} sx={{ p: 1.5, backgroundColor: "white", borderRadius: 2, border: `1px solid ${C.border}` }}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ maxWidth: "70%" }}>{item.productName}</Typography>
                        <Typography variant="subtitle2" fontWeight={700} color={C.blue}>
                          ₹{(item.quantity * item.sellingPrice).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="textSecondary">
                          ₹{item.sellingPrice?.toLocaleString()} each
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconButton size="small" onClick={() => handleUpdateCartQty(item.productId, -1)} sx={{ bgcolor: C.slateLight }}>
                            <RemoveIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <Typography variant="body2" fontWeight={700} sx={{ minWidth: 20, textAlign: "center" }}>
                            {item.quantity}
                          </Typography>
                          <IconButton size="small" onClick={() => handleUpdateCartQty(item.productId, 1)} sx={{ bgcolor: C.slateLight }}>
                            <AddIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleRemoveFromCart(item.productId)} sx={{ color: C.red, ml: 1 }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            
            <Box sx={{ p: 3, backgroundColor: "white", borderTop: `1px solid ${C.border}` }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="textSecondary" fontWeight={600}>Total Items</Typography>
                <Typography variant="body2" fontWeight={700}>{cart.reduce((sum, item) => sum + item.quantity, 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h6" fontWeight={800} color={C.navy}>Total</Typography>
                <Typography variant="h6" fontWeight={800} color={C.blue}>₹{cartTotal.toLocaleString()}</Typography>
              </Box>
              
              <Button 
                fullWidth 
                variant="contained" 
                size="large"
                disabled={cart.length === 0 || processing}
                onClick={handleProcessSale}
                sx={{ 
                  borderRadius: 2, 
                  py: 1.5,
                  backgroundColor: C.emerald,
                  "&:hover": { backgroundColor: C.emerald },
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 16
                }}
              >
                {processing ? "Processing..." : "Complete Sale"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default POSSales;
