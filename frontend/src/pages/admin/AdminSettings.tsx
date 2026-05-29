import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Store, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, API_BASE, getImageUrl } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Settings {
  storeName: string;
  logoUrl: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;
  email: string | null;
  address: string | null;
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  currency: string;
  announcementText: string | null;
  announcementActive: boolean;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => apiRequest("GET", "/settings"),
  });

  const [form, setForm] = useState({
    storeName: "", logoUrl: "", whatsappNumber: "", instagramUrl: "",
    email: "", address: "", deliveryFee: "5", freeDeliveryThreshold: "",
    currency: "USD", announcementText: "", announcementActive: false,
  });

  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const token = getAdminToken();

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setField("logoUrl", data.url);
      toast({ title: "Logo uploaded successfully" });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "An error occurred during file upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (data) {
      setForm({
        storeName: data.storeName,
        logoUrl: data.logoUrl ?? "",
        whatsappNumber: data.whatsappNumber ?? "",
        instagramUrl: data.instagramUrl ?? "",
        email: data.email ?? "",
        address: data.address ?? "",
        deliveryFee: String(data.deliveryFee),
        freeDeliveryThreshold: data.freeDeliveryThreshold ? String(data.freeDeliveryThreshold) : "",
        currency: data.currency,
        announcementText: data.announcementText ?? "",
        announcementActive: data.announcementActive,
      });
    }
  }, [data]);

  const setField = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        storeName: form.storeName,
        deliveryFee: parseFloat(form.deliveryFee) || 5,
        currency: form.currency,
        announcementActive: form.announcementActive,
      };
      if (form.logoUrl) payload.logoUrl = form.logoUrl;
      if (form.whatsappNumber) payload.whatsappNumber = form.whatsappNumber;
      if (form.instagramUrl) payload.instagramUrl = form.instagramUrl;
      if (form.email) payload.email = form.email;
      if (form.address) payload.address = form.address;
      if (form.freeDeliveryThreshold) payload.freeDeliveryThreshold = parseFloat(form.freeDeliveryThreshold);
      if (form.announcementText) payload.announcementText = form.announcementText;
      return apiRequest("PATCH", "/settings", payload, getAdminToken() || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (e: Error) => toast({ title: "Failed to save", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Store Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your store configuration</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} className="rounded-xl gap-2" disabled={saveMutation.isPending}>
          <Save className="h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" /> Store Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Store Name</Label>
              <Input value={form.storeName} onChange={(e) => setField("storeName", e.target.value)} className="rounded-xl" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Store Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {form.logoUrl ? (
                    <img src={getImageUrl(form.logoUrl)} alt="Store logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🏠</span>
                  )}
                </div>
                
                <label className="flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors text-sm font-semibold">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span>Upload Logo</span>
                    </>
                  )}
                </label>
              </div>
              
              <Input
                value={form.logoUrl}
                onChange={(e) => setField("logoUrl", e.target.value)}
                placeholder="Or enter logo URL manually..."
                className="rounded-xl mt-1.5 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="info@store.lb" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp Number</Label>
              <Input value={form.whatsappNumber} onChange={(e) => setField("whatsappNumber", e.target.value)} placeholder="+96170000000" className="rounded-xl" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Instagram URL</Label>
              <Input value={form.instagramUrl} onChange={(e) => setField("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." className="rounded-xl" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="Beirut, Lebanon" className="rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Delivery Fee ($)</Label>
              <Input type="number" step="0.5" min="0" value={form.deliveryFee} onChange={(e) => setField("deliveryFee", e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Free Delivery Threshold ($)</Label>
              <Input type="number" step="5" min="0" value={form.freeDeliveryThreshold} onChange={(e) => setField("freeDeliveryThreshold", e.target.value)} placeholder="50" className="rounded-xl" />
              <p className="text-xs text-muted-foreground">Leave empty to always charge delivery</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Announcement Banner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Show Announcement</p>
              <p className="text-xs text-muted-foreground">Display banner at the top of the store</p>
            </div>
            <Switch checked={form.announcementActive} onCheckedChange={(v) => setField("announcementActive", v)} />
          </div>
          <div className="space-y-1.5">
            <Label>Announcement Text</Label>
            <Input
              value={form.announcementText}
              onChange={(e) => setField("announcementText", e.target.value)}
              placeholder="Free delivery on orders over $50!"
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
