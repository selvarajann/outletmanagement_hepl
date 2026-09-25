import React from "react";
import { Chip, Button, IconButton, Typography, Box } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { C } from "../../theme/colors";
import EnterpriseTable from "../shared/EnterpriseTable";

export default function IMSOrderTable({ orders, onDispatch, onView }) {
  const columns = [
    { label: "Order Code", render: (order) => <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{order.orderCode}</Typography> },
    { label: "Outlet", render: (order) => <Typography sx={{ fontSize: 13 }}>{order.outletName}</Typography> },
    { label: "Requested Date", render: (order) => <Typography sx={{ fontSize: 13 }}>{order.requestedDate}</Typography> },
    { label: "Status", render: (order) => (
        <Chip
          label={order.status}
          size="small"
          sx={{
            backgroundColor: order.status === "PENDING" ? "#fff7ed" : "#ecfdf5",
            color: order.status === "PENDING" ? "#9a3412" : "#047857",
            fontWeight: 700,
          }}
        />
      )
    },
    { label: "Actions", align: "right", render: (order) => (
        <Box display="flex" justifyContent="flex-end">
          <IconButton size="small" onClick={() => onView(order)} sx={{ color: C.blue, mr: 1 }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {order.status === "PENDING" && (
            <Button
              variant="contained"
              size="small"
              startIcon={<LocalShippingIcon />}
              onClick={() => onDispatch(order)}
              sx={{ backgroundColor: C.emerald, "&:hover": { backgroundColor: "#059669" } }}
            >
              Dispatch
            </Button>
          )}
        </Box>
      )
    }
  ];

  return <EnterpriseTable columns={columns} data={orders} emptyMessage="No orders found." />;
}
