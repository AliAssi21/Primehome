import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Navbar } from "@/components/layout/Navbar";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";
import NotFound from "@/pages/not-found";

// Customer pages
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Account from "@/pages/Account";
import Wishlist from "@/pages/Wishlist";
import CategoryProducts from "@/pages/CategoryProducts";

// Admin pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminSettings from "@/pages/admin/AdminSettings";

// Configure the generated API client to use the customer auth token
setAuthTokenGetter(() => getToken());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60000,
    },
  },
});

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAdminAuth();
  if (isLoading) return null;
  if (!admin) return <Redirect to="/admin/login" />;
  return <>{children}</>;
}

function AdminRoutes() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        {() => (
          <AdminGuard>
            <AdminLayout>
              <Switch>
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/orders" component={AdminOrders} />
                <Route path="/admin/products" component={AdminProducts} />
                <Route path="/admin/customers" component={AdminCustomers} />
                <Route path="/admin/coupons" component={AdminCoupons} />
                <Route path="/admin/settings" component={AdminSettings} />
                <Route component={NotFound} />
              </Switch>
            </AdminLayout>
          </AdminGuard>
        )}
      </Route>
    </Switch>
  );
}

function StorefrontRoutes() {
  return (
    <>
      <Navbar />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/products" component={Products} />
          <Route path="/products/:id" component={ProductDetail} />
          <Route path="/categories/:slug" component={CategoryProducts} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/account" component={Account} />
          <Route path="/account/orders" component={Account} />
          <Route path="/wishlist" component={Wishlist} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/:rest*">
        {() => (
          <AdminGuard>
            <AdminLayout>
              <Switch>
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/orders" component={AdminOrders} />
                <Route path="/admin/products" component={AdminProducts} />
                <Route path="/admin/customers" component={AdminCustomers} />
                <Route path="/admin/coupons" component={AdminCoupons} />
                <Route path="/admin/settings" component={AdminSettings} />
              </Switch>
            </AdminLayout>
          </AdminGuard>
        )}
      </Route>
      <Route>
        {() => <StorefrontRoutes />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <CartProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </CartProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
