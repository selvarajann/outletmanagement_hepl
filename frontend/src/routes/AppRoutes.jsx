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
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const StockOrder = lazy(() => import("../pages/StockOrder"));
const Batch = lazy(() => import("../pages/Batch"));
const Stock = lazy(() => import("../pages/Stock"));
const WarehouseProduct = lazy(() => import("../pages/WarehouseProduct"));
const UserManagement = lazy(() => import("../pages/UserManagement"));
const POSSales = lazy(() => import("../pages/POSSales"));
const ImpersonationManagement = lazy(() => import("../pages/ImpersonationManagement"));
const StockReturn = lazy(() => import("../pages/StockReturn"));
const StockReturnDetails = lazy(() => import("../pages/StockReturnDetails"));
const AnalyticsDashboard = lazy(() => import("../pages/AnalyticsDashboard"));
const DeadLetterManager = lazy(() => import("../pages/DeadLetterManager"));
const ReconciliationDashboard = lazy(() => import("../pages/ReconciliationDashboard"));
const Shipments = lazy(() => import("../pages/Shipments"));
const AuditLogs = lazy(() => import("../pages/AuditLogs"));
const SystemJobs = lazy(() => import("../pages/SystemJobs"));
const IMSOrders = lazy(() => import("../pages/IMSOrders"));
const FormBuilder = lazy(() => import("../pages/FormBuilder"));
const FormRenderer = lazy(() => import("../pages/FormRenderer"));
const FormResponses = lazy(() => import("../pages/FormResponses"));
const FormManagement = lazy(() => import("../pages/FormManagement"));

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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashBoardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Everyone except INVENTORY_MANAGER can access Dashboard, Products, Stock */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "OUTLET_MANAGER", "SALES_OPERATOR"]} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Product />} />
            <Route path="stock" element={<Stock />} />
            <Route path="forms/:id" element={<FormRenderer />} />
          </Route>

          {/* Analytics accessible by all core roles */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "OUTLET_MANAGER", "INVENTORY_MANAGER", "SALES_OPERATOR"]} />}>
            <Route path="analytics" element={<AnalyticsDashboard />} />
          </Route>

          {/* Super Admin Only */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
            <Route path="locations" element={<Location />} />
            <Route path="divisions" element={<Division />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="admin/impersonation" element={<ImpersonationManagement />} />
            <Route path="system/dead-letters" element={<DeadLetterManager />} />
            <Route path="admin/audit-logs" element={<AuditLogs />} />
            <Route path="admin/forms" element={<FormManagement />} />
            <Route path="system/jobs" element={<SystemJobs />} />
            <Route path="form-builder" element={<FormBuilder />} />
            <Route path="form-builder/:id" element={<FormBuilder />} />
            <Route path="forms/:id/responses" element={<FormResponses />} />
          </Route>

          {/* Super Admin & Outlet Manager */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "OUTLET_MANAGER"]} />}>
            <Route path="outlets" element={<Outlet />} />
          </Route>

          {/* Super Admin, Outlet Manager */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "OUTLET_MANAGER"]} />}>
            <Route path="stock-orders" element={<StockOrder />} />
            <Route path="batches" element={<Batch />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="stock-returns" element={<StockReturn />} />
            <Route path="stock-returns/:id" element={<StockReturnDetails />} />
            <Route path="inventory/reconciliation" element={<ReconciliationDashboard />} />
          </Route>

          {/* Inventory Manager Only */}
          <Route element={<ProtectedRoute allowedRoles={["INVENTORY_MANAGER"]} />}>
            <Route path="warehouse-products" element={<WarehouseProduct />} />
            <Route path="ims-orders" element={<IMSOrders />} />
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
