import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import { AdminPage } from "./pages/AdminPage";
import { AuthPage } from "./pages/AuthPage";
import { CartPage } from "./pages/CartPage";
import { CatalogPage } from "./pages/CatalogPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OrdersPage } from "./pages/OrdersPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { VehiclesPage } from "./pages/VehiclesPage";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-4 text-sm font-semibold shadow-sm">
        Loading Ride254
      </div>
    </div>
  );
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Layout />;
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }
  return children;
}

function CustomerRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={user?.role === "ADMIN" ? <Navigate to="/admin" replace /> : <DashboardPage />} />
        <Route
          path="/catalog"
          element={
            <CustomerRoute>
              <CatalogPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <CustomerRoute>
              <ProductDetailPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <CustomerRoute>
              <CartPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <CustomerRoute>
              <VehiclesPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <CustomerRoute>
              <OrdersPage />
            </CustomerRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}
