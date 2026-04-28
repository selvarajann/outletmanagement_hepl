import { Routes, Route, Navigate } from "react-router-dom";
import DashBoardLayout from "../layouts/DashBoardLayout";
import Dashboard from "../pages/Dashboard";
import Product from "../pages/Product";
import Outlet from "../pages/Outlet";
import Location from "../pages/Location";
import Division from "../pages/Division";
import Login from "../pages/Login";
import ProtectedRoute from "./ProtectedRoutes";

const AppRoutes = () => {
  return (
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
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Product />} />
        <Route path="outlets" element={<Outlet />} />
        <Route path="locations" element={<Location />} />
        <Route path="divisions" element={<Division />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
