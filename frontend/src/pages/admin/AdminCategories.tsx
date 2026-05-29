import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, FolderOpen, Loader2, Upload, X, Tag, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
  createdAt: string;
}

const defaultForm = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
};

type FormState = typeof defaultForm;

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [uploading, setUploading] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  const setField = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["admin", "categories"],
    queryFn: () => apiRequest("GET", "/categories", undefined, getAdminToken() || undefined),
  });

  const filtered = (categories ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ ...defaultForm });
    setEditCategory(null);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      imageUrl: cat.imageUrl ?? "",
    });
    setEditCategory(cat);
    setShowForm(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const token = getAdminToken();
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setField("imageUrl", data.url);
      toast({ title: "Image uploaded successfully" });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    setField("imageUrl", manualUrl.trim());
    setManualUrl("");
    toast({ title: "Image URL set" });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        slug: form.slug || slugify(form.name),
      };
      if (form.description) payload.description = form.description;
      if (form.imageUrl) payload.imageUrl = form.imageUrl;

      if (editCategory) {
        return apiRequest("PATCH", `/categories/${editCategory.id}`, payload, getAdminToken() || undefined);
      } else {
        return apiRequest("POST", "/categories", payload, getAdminToken() || undefined);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: editCategory ? "Category updated" : "Category created" });
      setShowForm(false);
    },
    onError: (e: Error) =>
      toast({ title: "Failed to save", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/categories/${id}`, undefined, getAdminToken() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category deleted" });
      setDeleteTarget(null);
    },
    onError: (e: Error) =>
      toast({ title: "Cannot delete category", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} total</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground p-3 pl-5">Category</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden md:table-cell">Slug</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden lg:table-cell">Description</th>
                <th className="text-left font-medium text-muted-foreground p-3">Products</th>
                <th className="text-left font-medium text-muted-foreground p-3 hidden md:table-cell">Created</th>
                <th className="text-left font-medium text-muted-foreground p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="border-b animate-pulse">
                        {Array(6)
                          .fill(0)
                          .map((_, j) => (
                            <td key={j} className="p-3">
                              <div className="h-4 bg-muted rounded" />
                            </td>
                          ))}
                      </tr>
                    ))
                : filtered.map((cat) => (
                    <tr key={cat.id} className="border-b hover:bg-muted/30 transition-colors">
                      {/* Name + image */}
                      <td className="p-3 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                            {cat.imageUrl ? (
                              <img
                                src={cat.imageUrl}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <FolderOpen className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <p className="font-medium line-clamp-1">{cat.name}</p>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="p-3 hidden md:table-cell">
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          {cat.slug}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs max-w-xs">
                        <span className="line-clamp-2">{cat.description ?? "—"}</span>
                      </td>

                      {/* Product count */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{cat.productCount}</span>
                        </div>
                      </td>

                      {/* Created at */}
                      <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">
                        {new Date(cat.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => openEdit(cat)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setDeleteTarget(cat)}
                            disabled={cat.productCount > 0}
                            title={cat.productCount > 0 ? `Cannot delete — ${cat.productCount} product(s) still in this category` : "Delete category"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No categories found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  setField("name", e.target.value);
                  setField("slug", slugify(e.target.value));
                }}
                required
                className="rounded-xl"
                placeholder="e.g. Living Room"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setField("slug", e.target.value)}
                className="rounded-xl font-mono text-sm"
                placeholder="auto-generated from name"
              />
              <p className="text-xs text-muted-foreground">
                Used in URL: /categories/<strong>{form.slug || "slug"}</strong>
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
                placeholder="Short description for this category..."
              />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Category Image</Label>

              {/* Preview */}
              {form.imageUrl && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border bg-muted">
                  <img
                    src={form.imageUrl}
                    alt="Category preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setField("imageUrl", "")}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Upload area */}
              {!form.imageUrl && (
                <label className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer bg-muted/20 group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
                        Click to upload image
                      </span>
                    </>
                  )}
                </label>
              )}

              {/* Manual URL */}
              <div className="flex gap-2">
                <Input
                  placeholder="Or enter image URL..."
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddManualUrl();
                    }
                  }}
                  className="rounded-xl flex-1 text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddManualUrl}
                  className="rounded-xl px-4 text-xs font-semibold"
                >
                  Set URL
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 rounded-xl" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editCategory ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
            </p>
            {deleteTarget && deleteTarget.productCount > 0 ? (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Deletion blocked</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This category has <strong>{deleteTarget.productCount} product(s)</strong> assigned to it.
                    Reassign or remove all products first, then you can delete this category.
                  </p>
                </div>
              </div>
            ) : null}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDeleteTarget(null)}
              >
                {deleteTarget && deleteTarget.productCount > 0 ? "Close" : "Cancel"}
              </Button>
              {(!deleteTarget || deleteTarget.productCount === 0) && (
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
