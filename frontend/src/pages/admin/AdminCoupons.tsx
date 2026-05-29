import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

const defaultForm = {
  code: "", type: "percentage" as "percentage" | "fixed", value: "", minOrderAmount: "",
  maxUses: "", expiresAt: "", active: true,
};

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["admin", "coupons"],
    queryFn: () => apiRequest("GET", "/coupons", undefined, getAdminToken() || undefined),
  });

  const setField = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        active: form.active,
      };
      if (form.minOrderAmount) payload.minOrderAmount = parseFloat(form.minOrderAmount);
      if (form.maxUses) payload.maxUses = parseInt(form.maxUses);
      if (form.expiresAt) payload.expiresAt = form.expiresAt;
      return apiRequest("POST", "/coupons", payload, getAdminToken() || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast({ title: "Coupon created" });
      setShowForm(false);
      setForm({ ...defaultForm });
    },
    onError: (e: Error) => toast({ title: "Failed to create", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/coupons/${id}`, undefined, getAdminToken() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast({ title: "Coupon deleted" });
    },
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-muted-foreground text-sm">{coupons?.length ?? 0} coupons</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground p-3 pl-5">Code</th>
                <th className="text-left font-medium text-muted-foreground p-3">Discount</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden md:table-cell">Min Order</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden md:table-cell">Uses</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden lg:table-cell">Expires</th>
                <th className="text-left font-medium text-muted-foreground p-3">Status</th>
                <th className="text-left font-medium text-muted-foreground p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b animate-pulse">
                    {Array(7).fill(0).map((_, j) => <td key={j} className="p-3"><div className="h-4 bg-muted rounded" /></td>)}
                  </tr>
                ))
              ) : coupons?.map((c) => (
                <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 pl-5">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-bold">{c.code}</span>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-primary">
                    {c.type === "percentage" ? `${c.value}%` : `$${c.value.toFixed(2)}`}
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{c.minOrderAmount ? `$${c.minOrderAmount}` : "—"}</td>
                  <td className="p-3 hidden md:table-cell">
                    {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-LB") : "Never"}
                  </td>
                  <td className="p-3">
                    <Badge className={c.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                      {c.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                      onClick={() => { if (confirm("Delete this coupon?")) deleteMutation.mutate(c.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons?.length === 0 && !isLoading && (
            <div className="text-center py-10 text-muted-foreground">No coupons yet</div>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Code *</Label>
              <Input value={form.code} onChange={(e) => setField("code", e.target.value.toUpperCase())} required placeholder="SAVE20" className="rounded-xl font-mono uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Value *</Label>
                <Input type="number" step="0.01" min="0" value={form.value} onChange={(e) => setField("value", e.target.value)} required placeholder={form.type === "percentage" ? "10" : "5.00"} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min Order ($)</Label>
                <Input type="number" step="0.01" min="0" value={form.minOrderAmount} onChange={(e) => setField("minOrderAmount", e.target.value)} placeholder="30.00" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Max Uses</Label>
                <Input type="number" min="1" value={form.maxUses} onChange={(e) => setField("maxUses", e.target.value)} placeholder="100" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expires At</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => setField("expiresAt", e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 rounded-xl" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Coupon"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
