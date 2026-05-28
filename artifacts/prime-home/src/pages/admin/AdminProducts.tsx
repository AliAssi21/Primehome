import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  price: number;
  salePrice: number | null;
  stock: number;
  sku: string | null;
  categoryId: number | null;
  categoryName: string | null;
  images: string[];
  featured: boolean;
  bestSeller: boolean;
  onSale: boolean;
  visible: boolean;
  salesCount: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductsResponse {
  items: Product[];
  total: number;
}

const defaultForm = {
  name: "", slug: "", description: "", price: "", salePrice: "", stock: "10", sku: "",
  categoryId: "", images: "", featured: false, bestSeller: false, onSale: false, visible: true,
};

type FormState = typeof defaultForm;

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({ ...defaultForm });

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  queryParams.set("page", String(page));
  queryParams.set("limit", "15");

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["admin", "products", queryParams.toString()],
    queryFn: () => apiRequest("GET", `/products?${queryParams.toString()}&visible=all`, undefined, getAdminToken() || undefined),
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiRequest("GET", "/categories"),
  });

  const setField = (key: keyof FormState, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm({ ...defaultForm });
    setEditProduct(null);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      slug: product.name ? slugify(product.name) : "",
      description: "",
      price: String(product.price),
      salePrice: product.salePrice != null ? String(product.salePrice) : "",
      stock: String(product.stock),
      sku: product.sku ?? "",
      categoryId: product.categoryId ? String(product.categoryId) : "",
      images: product.images.join("\n"),
      featured: product.featured,
      bestSeller: product.bestSeller,
      onSale: product.onSale,
      visible: product.visible,
    });
    setEditProduct(product);
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        featured: form.featured,
        bestSeller: form.bestSeller,
        onSale: form.onSale,
        visible: form.visible,
        images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      };
      if (form.description) payload.description = form.description;
      if (form.salePrice) payload.salePrice = parseFloat(form.salePrice);
      if (form.sku) payload.sku = form.sku;
      if (form.categoryId) payload.categoryId = parseInt(form.categoryId);

      if (editProduct) {
        return apiRequest("PATCH", `/products/${editProduct.id}`, payload, getAdminToken() || undefined);
      } else {
        return apiRequest("POST", "/products", payload, getAdminToken() || undefined);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: editProduct ? "Product updated" : "Product created" });
      setShowForm(false);
    },
    onError: (e: Error) => toast({ title: "Failed to save", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/products/${id}`, undefined, getAdminToken() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast({ title: "Product deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const totalPages = data ? Math.ceil(data.total / 15) : 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">{data?.total ?? 0} total</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." className="pl-9 rounded-xl" />
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground p-3 pl-5">Product</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden md:table-cell">Category</th>
                <th className="text-left font-medium text-muted-foreground p-3">Price</th>
                <th className="text-left font-medium text-muted-foreground p-3">Stock</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden lg:table-cell">Tags</th>
                <th className="text-left font-medium text-muted-foreground p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} className="border-b animate-pulse">
                    {Array(6).fill(0).map((_, j) => <td key={j} className="p-3"><div className="h-4 bg-muted rounded" /></td>)}
                  </tr>
                ))
              ) : data?.items.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                        {p.images[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">🏠</div>}
                      </div>
                      <div>
                        <p className="font-medium line-clamp-1">{p.name}</p>
                        {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">{p.categoryName ?? "—"}</td>
                  <td className="p-3">
                    <div className="font-medium">${p.price.toFixed(2)}</div>
                    {p.salePrice && <div className="text-xs text-red-600">${p.salePrice.toFixed(2)}</div>}
                  </td>
                  <td className="p-3">
                    <span className={`font-medium ${p.stock < 5 ? "text-red-600" : p.stock === 0 ? "text-red-600" : "text-green-600"}`}>{p.stock}</span>
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {!p.visible && <Badge className="bg-gray-100 text-gray-600 text-xs">Hidden</Badge>}
                      {p.featured && <Badge className="bg-blue-100 text-blue-800 text-xs">Featured</Badge>}
                      {p.bestSeller && <Badge className="bg-amber-100 text-amber-800 text-xs">Best Seller</Badge>}
                      {p.onSale && <Badge className="bg-red-100 text-red-800 text-xs">Sale</Badge>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate(p.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.items.length === 0 && !isLoading && (
            <div className="text-center py-10 text-muted-foreground">No products found</div>
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

      {/* Product Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => { setField("name", e.target.value); setField("slug", slugify(e.target.value)); }} required className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Price ($) *</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setField("price", e.target.value)} required className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Sale Price ($)</Label>
                <Input type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => setField("salePrice", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Stock</Label>
                <Input type="number" min="0" value={form.stock} onChange={(e) => setField("stock", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setField("sku", e.target.value)} className="rounded-xl" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => setField("categoryId", v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} className="rounded-xl resize-none" rows={3} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Image URLs (one per line)</Label>
                <Textarea value={form.images} onChange={(e) => setField("images", e.target.value)} className="rounded-xl resize-none font-mono text-xs" rows={3} placeholder="https://..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "featured", label: "Featured" },
                { key: "bestSeller", label: "Best Seller" },
                { key: "onSale", label: "On Sale" },
                { key: "visible", label: "Visible" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl border">
                  <Label className="text-sm cursor-pointer">{label}</Label>
                  <Switch checked={form[key as keyof FormState] as boolean} onCheckedChange={(v) => setField(key as keyof FormState, v)} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 rounded-xl" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editProduct ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
