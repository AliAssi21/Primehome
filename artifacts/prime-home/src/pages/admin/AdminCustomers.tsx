import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Ban, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  banned: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

interface CustomersResponse {
  items: Customer[];
  total: number;
}

export default function AdminCustomers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  queryParams.set("page", String(page));

  const { data, isLoading } = useQuery<CustomersResponse>({
    queryKey: ["admin", "customers", queryParams.toString()],
    queryFn: () => apiRequest("GET", `/admin/customers?${queryParams.toString()}`, undefined, getAdminToken() || undefined),
  });

  const toggleBan = useMutation({
    mutationFn: ({ id, banned }: { id: number; banned: boolean }) =>
      apiRequest("PATCH", `/admin/customers/${id}`, { banned }, getAdminToken() || undefined),
    onSuccess: (_, { banned }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      toast({ title: banned ? "Customer banned" : "Customer unbanned" });
    },
    onError: () => toast({ title: "Action failed", variant: "destructive" }),
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-muted-foreground text-sm">{data?.total ?? 0} registered customers</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search customers..." className="pl-9 rounded-xl" />
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground p-3 pl-5">Customer</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden md:table-cell">Phone</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden lg:table-cell">Joined</th>
                <th className="text-left font-medium text-muted-foreground p-3">Orders</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden md:table-cell">Total Spent</th>
                <th className="text-left font-medium text-muted-foreground p-3">Status</th>
                <th className="text-left font-medium text-muted-foreground p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} className="border-b animate-pulse">
                    {Array(7).fill(0).map((_, j) => <td key={j} className="p-3"><div className="h-4 bg-muted rounded" /></td>)}
                  </tr>
                ))
              ) : data?.items.map((c) => (
                <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 pl-5">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">{c.phone ?? "—"}</td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs">{new Date(c.createdAt).toLocaleDateString("en-LB")}</td>
                  <td className="p-3 font-medium">{c.orderCount}</td>
                  <td className="p-3 hidden md:table-cell font-medium">${c.totalSpent.toFixed(2)}</td>
                  <td className="p-3">
                    {c.banned
                      ? <Badge className="bg-red-100 text-red-800 text-xs">Banned</Badge>
                      : <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-xl text-xs gap-1 ${c.banned ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}`}
                      onClick={() => toggleBan.mutate({ id: c.id, banned: !c.banned })}
                    >
                      {c.banned ? <><CheckCircle className="h-3.5 w-3.5" /> Unban</> : <><Ban className="h-3.5 w-3.5" /> Ban</>}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.items.length === 0 && !isLoading && (
            <div className="text-center py-10 text-muted-foreground">No customers found</div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
