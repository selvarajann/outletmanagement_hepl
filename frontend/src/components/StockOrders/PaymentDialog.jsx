import React from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import FormDialog from "../shared/FormDialog";
import { C } from "../../theme/colors";

export default function PaymentDialog({ open, order, onClose, onConfirm, loading }) {
  if (!order) return null;
  const amount = order.totalAmount || 0;
  // Generate a mock QR code via an external API based on the order code and amount
  const qrData = `PAY: ${order.orderCode} AMT: INR ${amount}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

  return (
    <FormDialog
      open={open}
      title="Complete Payment"
      submitLabel="Confirm Payment"
      onClose={onClose}
      onSubmit={() => onConfirm(order.id)}
      maxWidth="sm"
      loading={loading}
    >
      <Box sx={{ textAlign: "center", py: 2 }}>
        <PaymentIcon sx={{ fontSize: 40, color: C.teal, mb: 1 }} />
        <Typography variant="h6" fontWeight={700} sx={{ color: C.slate }}>
          Order {order.orderCode}
        </Typography>
        <Typography variant="body2" sx={{ color: C.slate, mb: 2 }}>
          Please scan the QR code below using your payment app to settle the balance.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ 
            bgcolor: order?.paymentStatus === "PAID" ? C.emeraldLight : C.redLight, 
            color: order?.paymentStatus === "PAID" ? C.emerald : C.red,
            px: 1.5, py: 0.5, borderRadius: 1, fontSize: 12, fontWeight: 700 
          }}>
            STATUS: {order?.paymentStatus || "UNPAID"}
          </Box>
          <Box sx={{ 
            bgcolor: C.blueLight, color: C.blue,
            px: 1.5, py: 0.5, borderRadius: 1, fontSize: 12, fontWeight: 700 
          }}>
            METHOD: ONLINE
          </Box>
        </Box>

        <Box sx={{
          display: "inline-block", p: 2, bgcolor: "white", borderRadius: 3, 
          border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
        }}>
          <img src={qrUrl} alt="QR Code" width={180} height={180} />
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={2}>
            <QrCodeScannerIcon sx={{ color: C.slate, fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: C.slate }}>
              Scan to Pay
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: C.emeraldLight, borderRadius: 2, border: `1px solid ${C.emeraldMid}` }}>
          <Typography variant="body2" sx={{ color: C.emerald, fontWeight: 600 }}>Amount Due</Typography>
          <Typography variant="h4" sx={{ color: C.emerald, fontWeight: 800 }}>
            ₹{Number(amount).toLocaleString("en-IN")}
          </Typography>
        </Box>
      </Box>
    </FormDialog>
  );
}
