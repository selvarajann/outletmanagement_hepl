import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Box, CircularProgress } from "@mui/material";

// Lazy load components
const DashBoardLayout = lazy(() => import("../layouts/DashBoardLayout"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Product = lazy(() => import("../pages/Product"));
const Outlet = lazy(() => import("../pages/Outlet"));
const Location = lazy(() => import("../pages/Location"));
const Division = lazy(() => import("../pages/Division"));
const Login = lazy(() => import("../pages/Login"));
const StockOrder = lazy(() => import("../pages/StockOrder"));
const Batch = lazy(() => import("../pages/Batch"));
const Stock = lazy(() => import("../pages/Stock"));
const UserManagement = lazy(() => import("../pages/UserManagement"));
const POSSales = lazy(() => import("../pages/POSSales"));
const ImpersonationManagement = lazy(() => import("../pages/ImpersonationManagement"));

import ProtectedRoute from "./ProtectedRoutes";

const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashBoardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Everyone can access Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Products and Stock accessible by all roles */}
          <Route path="products" element={<Product />} />
          <Route path="stock" element={<Stock />} />

          {/* Super Admin Only */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
            <Route path="locations" element={<Location />} />
            <Route path="divisions" element={<Division />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="admin/impersonation" element={<ImpersonationManagement />} />
          </Route>

          {/* Super Admin & Outlet Manager */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "OUTLET_MANAGER"]} />}>
            <Route path="outlets" element={<Outlet />} />
          </Route>

          {/* Super Admin, Outlet Manager, Inventory Manager */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "OUTLET_MANAGER", "INVENTORY_MANAGER"]} />}>
            <Route path="stock-orders" element={<StockOrder />} />
            <Route path="batches" element={<Batch />} />
          </Route>

          {/* Sales Operator Only */}
          <Route element={<ProtectedRoute allowedRoles={["SALES_OPERATOR"]} />}>
            <Route path="pos" element={<POSSales />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
