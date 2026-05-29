import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Package, Users, ShoppingCart, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, getImageUrl } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  revenueToday: number;
  ordersToday: number;
  topProducts: Array<{ productId: number; productName: string; imageUrl: string | null; salesCount: number; revenue: number }>;
  recentOrders: Array<{ id: number; orderNumber: string; status: string; customerName: string; total: number; createdAt: string }>;
}

interface SalesData {
  label: string;
  revenue: number;
  orders: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function StatCard({ title, value, icon: Icon, sub, color }: { title: string; value: string | number; icon: React.ElementType; sub?: string; color?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </div>
            <div className={`p-2.5 rounded-xl ${color ?? "bg-primary/10"}`}>
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => apiRequest("GET", "/admin/stats", undefined, getAdminToken() || undefined),
    refetchInterval: 60000,
  });

  const { data: salesData } = useQuery<SalesData[]>({
    queryKey: ["admin", "stats", "sales", "monthly"],
    queryFn: () => apiRequest("GET", "/admin/stats/sales?period=monthly", undefined, getAdminToken() || undefined),
  });

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
        </div>
        <div className="h-72 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your store performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`} icon={DollarSign} sub={`$${(stats?.revenueToday ?? 0).toFixed(2)} today`} color="bg-green-100" />
        <StatCard title="Total Orders" value={stats?.totalOrders ?? 0} icon={ShoppingCart} sub={`${stats?.ordersToday ?? 0} today`} color="bg-blue-100" />
        <StatCard title="Customers" value={stats?.totalCustomers ?? 0} icon={Users} color="bg-purple-100" />
        <StatCard title="Products" value={stats?.totalProducts ?? 0} icon={Package} color="bg-amber-100" />
      </div>

      {/* Alerts */}
      {((stats?.pendingOrders ?? 0) > 0 || (stats?.lowStockProducts ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(stats?.pendingOrders ?? 0) > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-medium text-amber-900">{stats!.pendingOrders} Pending Orders</p>
                <p className="text-xs text-amber-700">Awaiting confirmation</p>
              </div>
            </div>
          )}
          {(stats?.lowStockProducts ?? 0) > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <p className="font-medium text-red-900">{stats!.lowStockProducts} Low Stock Items</p>
                <p className="text-xs text-red-700">Less than 5 units remaining</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {salesData && salesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#d97706" fill="url(#colorRev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {salesData && salesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Orders per Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        {stats?.topProducts && stats.topProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                      {p.imageUrl ? <img src={getImageUrl(p.imageUrl)} alt={p.productName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">🏠</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.productName}</p>
                      <p className="text-xs text-muted-foreground">{p.salesCount} sold</p>
                    </div>
                    <span className="text-sm font-semibold">${p.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        {stats?.recentOrders && stats.recentOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.customerName}</p>
                    </div>
                    <div className="text-right ml-3">
                      <Badge className={`text-xs ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-800"}`}>
                        {o.status}
                      </Badge>
                      <p className="text-xs font-semibold mt-0.5">${o.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
