import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, Box, Button, Typography, TextField,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, CircularProgress, Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ReceiveShipment, GetShipmentById } from "../../services/ShipmentService";
import { C } from "../../theme/colors";

const ReceiveShipmentModal = ({ open, onClose, shipmentId }) => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [shipmentDetail, setShipmentDetail] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (open && shipmentId) {
      fetchDetails();
    } else {
      setItems([]);
      setNotes("");
      setShipmentDetail(null);
    }
  }, [open, shipmentId]);

  const fetchDetails = async () => {
    try {
      setLoadingDetails(true);
      const data = await GetShipmentById(shipmentId);
      setShipmentDetail(data);
      if (data?.items) {
        setItems(
          data.items.map((item) => ({
            ...item,
            quantityReceived: item.quantityDispatched,
            imsBatchCode: item.imsBatchCode || `BATCH-${item.id}-${Date.now()}`,
          }))
        );
      }
    } catch {
      toast.error("Failed to load shipment details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const receiveMutation = useMutation({
    mutationFn: (payload) => ReceiveShipment(shipmentId, payload),
    onSuccess: () => {
      toast.success("Shipment received & stock updated!");
      queryClient.invalidateQueries(["shipments"]);
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to receive shipment");
    },
  });

  const handleQuantityChange = (id, val) =>
    setItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, quantityReceived: Math.max(0, parseInt(val) || 0) } : item)
    );

  const handleBatchCodeChange = (id, val) =>
    setItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, imsBatchCode: val } : item)
    );

  const handleReceive = () => {
    const payload = {
      notes,
      items: items.map((i) => ({
        id: i.id,
        quantityReceived: i.quantityReceived,
        imsBatchCode: i.imsBatchCode,
      })),
    };
    receiveMutation.mutate(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
          border: `1px solid ${C.border}`,
          boxShadow: "0 24px 64px rgba(15,23,42,0.14)",
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 3.5, py: 2.5,
          borderBottom: `1px solid ${C.border}`,
          bgcolor: C.white,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: "10px",
              bgcolor: `color-mix(in srgb, ${C.teal} 12%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <LocalShippingIcon sx={{ fontSize: 20, color: C.teal }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: C.navy }}>
              Receive Shipment
            </Typography>
            <Typography sx={{ fontSize: 12, color: C.slateMid }}>
              {shipmentDetail
                ? `${shipmentDetail.shipmentCode} · ${shipmentDetail.outletName}`
                : `Shipment #${shipmentId}`}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ borderRadius: "10px", color: C.slateMid, "&:hover": { bgcolor: C.bgMuted } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Body ── */}
      <DialogContent sx={{ p: 0, bgcolor: C.white }}>
        <Box sx={{ px: 3.5, py: 3 }}>
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={30} sx={{ color: C.teal }} />
            </Box>
          ) : items.length === 0 ? (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              No items found for this shipment.
            </Alert>
          ) : (
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Items table */}
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: C.navy, mb: 1.5 }}>
                  Shipment Items
                </Typography>
                <Table
                  size="small"
                  sx={{
                    "& th": {
                      fontWeight: 700, fontSize: 11, textTransform: "uppercase",
                      letterSpacing: "0.5px", color: C.slateMid,
                      bgcolor: C.bgMuted, py: 1.5, borderBottom: `1px solid ${C.border}`,
                    },
                    "& td": { py: 1.5, borderBottom: `1px solid ${C.borderMuted}` },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Dispatched</TableCell>
                      <TableCell align="center">Received Qty</TableCell>
                      <TableCell>IMS Batch Code</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: 13, color: C.navy }}>
                            {item.productName}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: C.slateMid }}>
                            {item.productCode}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.quantityDispatched}
                            size="small"
                            sx={{ fontWeight: 700, bgcolor: C.blueLight, color: C.blue }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantityReceived}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            inputProps={{ min: 0, max: item.quantityDispatched }}
                            sx={{
                              width: 80,
                              "& input": { textAlign: "center", fontWeight: 700, py: 0.6, fontSize: 13 },
                              "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.imsBatchCode}
                            onChange={(e) => handleBatchCodeChange(item.id, e.target.value)}
                            placeholder="Batch code…"
                            sx={{
                              width: "100%",
                              "& input": { fontSize: 12, fontFamily: "monospace" },
                              "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              {/* Notes */}
              <TextField
                label="Receiving Notes (optional)"
                multiline
                rows={3}
                fullWidth
                size="small"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />

              <Alert
                icon={<CheckCircleOutlineIcon fontSize="small" />}
                severity="info"
                sx={{ borderRadius: 2 }}
              >
                Confirming receipt will update the stock inventory and mark this shipment as Received.
              </Alert>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* ── Footer ── */}
      <Box
        sx={{
          px: 3.5, py: 2.5,
          borderTop: `1px solid ${C.border}`,
          bgcolor: C.bgMuted,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <Button
          onClick={onClose}
          disabled={receiveMutation.isPending}
          sx={{
            textTransform: "none", fontWeight: 600, borderRadius: "10px",
            borderColor: C.border, color: C.slateMid,
            border: `1px solid ${C.border}`,
            "&:hover": { borderColor: C.slate, bgcolor: C.white },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleReceive}
          variant="contained"
          disabled={receiveMutation.isPending || loadingDetails || items.length === 0}
          startIcon={
            receiveMutation.isPending
              ? <CircularProgress size={16} sx={{ color: C.bg }} />
              : <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
          }
          sx={{
            textTransform: "none", fontWeight: 700, fontSize: 14,
            borderRadius: "10px", px: 3,
            bgcolor: C.teal, color: C.bg,
            boxShadow: `0 4px 14px color-mix(in srgb, ${C.teal} 30%, transparent)`,
            "&:hover": { bgcolor: C.teal, opacity: 0.9 },
            "&.Mui-disabled": { bgcolor: C.border, color: C.muted },
          }}
        >
          {receiveMutation.isPending ? "Receiving…" : "Confirm Receipt"}
        </Button>
      </Box>
    </Dialog>
  );
};

export default ReceiveShipmentModal;
