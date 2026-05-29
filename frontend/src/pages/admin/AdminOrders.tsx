import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  address: string;
  city: string;
  deliveryArea: string | null;
  notes: string | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  couponCode: string | null;
  items: Array<{ productName: string; quantity: number; price: number; subtotal: number }>;
  createdAt: string;
}

interface OrdersResponse {
  items: Order[];
  total: number;
}

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (statusFilter && statusFilter !== "all") queryParams.set("status", statusFilter);
  queryParams.set("page", String(page));
  queryParams.set("limit", "15");

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ["admin", "orders", queryParams.toString()],
    queryFn: () => apiRequest("GET", `/orders?${queryParams.toString()}`, undefined, getAdminToken() || undefined),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest<Order>("PATCH", `/orders/${id}/status`, { status }, getAdminToken() || undefined),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({ title: "Order status updated" });
      if (data) {
        setSelectedOrder(data);
      }
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const totalPages = data ? Math.ceil(data.total / 15) : 0;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm">{data?.total ?? 0} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search order #..." className="pl-9 rounded-xl" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground p-3 pl-5">Order</th>
                <th className="text-left font-medium text-muted-foreground p-3">Customer</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden md:table-cell">Date</th>
                <th className="text-left font-medium text-muted-foreground p-3">Status</th>
                <th className="text-left font-medium text-muted-foreground p-3">Total</th>
                <th className="text-left font-medium text-muted-foreground p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} className="border-b animate-pulse">
                    {Array(6).fill(0).map((_, j) => <td key={j} className="p-3"><div className="h-4 bg-muted rounded w-full" /></td>)}
                  </tr>
                ))
              ) : data?.items.map((order) => (
                <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 pl-5 font-mono font-medium text-xs">{order.orderNumber}</td>
                  <td className="p-3">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">
                    {new Date(order.createdAt).toLocaleDateString("en-LB")}
                  </td>
                  <td className="p-3">
                    <Badge className={`text-xs ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="p-3 font-semibold">${order.total.toFixed(2)}</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} className="rounded-xl text-xs">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.items.length === 0 && !isLoading && (
            <div className="text-center py-10 text-muted-foreground">No orders found</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-mono">{selectedOrder.orderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Phone</p>
                  <p className="font-medium">{selectedOrder.customerPhone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs mb-0.5">Address</p>
                  <p>{selectedOrder.address}, {selectedOrder.city}{selectedOrder.deliveryArea ? `, ${selectedOrder.deliveryArea}` : ""}</p>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs mb-0.5">Notes</p>
                    <p>{selectedOrder.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Payment</p>
                  <p>
                    {selectedOrder.paymentMethod === "cash_on_delivery"
                      ? "Cash on Delivery"
                      : selectedOrder.paymentMethod === "whish_money"
                      ? "Whish Money"
                      : "WhatsApp"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Date</p>
                  <p>{new Date(selectedOrder.createdAt).toLocaleString("en-LB")}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="font-medium mb-2">Items</p>
                {(selectedOrder.items as Array<{ productName: string; quantity: number; price: number; subtotal: number }>).map((item, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span>{item.productName} × {item.quantity}</span>
                    <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${selectedOrder.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>${selectedOrder.deliveryFee.toFixed(2)}</span></div>
                {selectedOrder.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({selectedOrder.couponCode})</span><span>-${selectedOrder.discount.toFixed(2)}</span></div>}
                <div className="flex justify-between font-semibold text-base"><span>Total</span><span>${selectedOrder.total.toFixed(2)}</span></div>
              </div>
              <Separator />
              <div>
                <p className="font-medium mb-2">Update Status</p>
                <Select
                  value={selectedOrder.status}
                  disabled={updateStatus.isPending}
                  onValueChange={(status) => {
                    updateStatus.mutate({ id: selectedOrder.id, status });
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    {updateStatus.isPending ? "Updating..." : <SelectValue />}
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
