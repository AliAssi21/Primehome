import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Navbar } from "@/components/layout/Navbar";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { setAuthTokenGetter } from "../api-client";
import { getToken } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
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
import TrackOrder from "@/pages/TrackOrder";

// Admin pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminCategories from "@/pages/admin/AdminCategories";

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
          <Route path="/track-order" component={TrackOrder} />
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
      
      {/* Admin Routes */}
      <Route path="/admin">
        {() => <AdminGuard><AdminLayout><AdminDashboard /></AdminLayout></AdminGuard>}
      </Route>
      <Route path="/admin/orders">
        {() => <AdminGuard><AdminLayout><AdminOrders /></AdminLayout></AdminGuard>}
      </Route>
      <Route path="/admin/products">
        {() => <AdminGuard><AdminLayout><AdminProducts /></AdminLayout></AdminGuard>}
      </Route>
      <Route path="/admin/customers">
        {() => <AdminGuard><AdminLayout><AdminCustomers /></AdminLayout></AdminGuard>}
      </Route>
      <Route path="/admin/coupons">
        {() => <AdminGuard><AdminLayout><AdminCoupons /></AdminLayout></AdminGuard>}
      </Route>
      <Route path="/admin/categories">
        {() => <AdminGuard><AdminLayout><AdminCategories /></AdminLayout></AdminGuard>}
      </Route>
      <Route path="/admin/settings">
        {() => <AdminGuard><AdminLayout><AdminSettings /></AdminLayout></AdminGuard>}
      </Route>

      <Route>
        {() => <StorefrontRoutes />}
      </Route>
    </Switch>
  );
}

function FaviconManager() {
  const { data: settings } = useQuery<any>({
    queryKey: ["settings"],
    queryFn: () => apiRequest("GET", "/settings"),
  });

  useEffect(() => {
    if (settings?.logoUrl) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = settings.logoUrl;
        link.removeAttribute("type");
      }
    }
  }, [settings]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <CartProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <FaviconManager />
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
