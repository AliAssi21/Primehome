import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Truck, CreditCard, Banknote, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, getImageUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface OrderResponse {
  id: number;
  orderNumber: string;
  total: number;
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const couponCode = new URLSearchParams(searchParams).get("coupon") || "";
  const { cart, clearCart } = useCartContext();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: settings } = useQuery<any>({
    queryKey: ["settings"],
    queryFn: () => apiRequest("GET", "/settings"),
  });

  const [form, setForm] = useState({
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: "",
    address: "",
    city: "",
    deliveryArea: "",
    notes: "",
    paymentMethod: "cash_on_delivery" as "cash_on_delivery" | "whish_money",
  });

  const getWhatsAppLink = () => {
    if (!orderPlaced) return "";
    const whatsappNum = settings?.whatsappNumber?.replace(/[^0-9]/g, "") || "96170000000";
    const text = `Hello! I just placed order #${orderPlaced.orderNumber} for a total of $${orderPlaced.total.toFixed(2)} on PrimeHome. I selected payment via Whish Money. Please provide the Whish transfer details so I can send the receipt. Thank you!`;
    return `https://wa.me/${whatsappNum}?text=${encodeURIComponent(text)}`;
  };
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<OrderResponse | null>(null);

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const deliveryFee = cart?.deliveryFee ?? 5;
  const total = subtotal + deliveryFee;

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast({ title: "Your cart is empty", variant: "destructive" });
      return;
    }
    setIsPlacingOrder(true);
    try {
      const orderItems = items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
      const payload = {
        ...form,
        items: orderItems,
        couponCode: couponCode || undefined,
      };
      const order = await apiRequest<OrderResponse>("POST", "/orders", payload, getToken() || undefined);
      setOrderPlaced(order);
      await clearCart();
    } catch (err: unknown) {
      toast({ title: "Order failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-3">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-2">Thank you for shopping with Prime Home.</p>
          <p className="text-muted-foreground mb-2">Order number: <span className="font-semibold text-foreground">{orderPlaced.orderNumber}</span></p>
          <p className="text-muted-foreground mb-4">Total: <span className="font-semibold text-foreground">${orderPlaced.total.toFixed(2)}</span></p>
          {form.paymentMethod === "whish_money" ? (
            <div className="bg-[#25D366]/5 border border-[#25D366]/20 rounded-2xl p-5 mb-8 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366]/10 text-2xl">💸</div>
              <h3 className="font-semibold text-sm">Whish Money Instructions</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                To complete your order, please click the button below to message us on WhatsApp. We will provide our Whish Money transfer details and confirm your order as soon as we receive the transfer receipt.
              </p>
              <Button asChild className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-semibold gap-2 border-0 shadow-sm">
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                  💬 Pay & Contact via WhatsApp
                </a>
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground mb-8">We have received your order and will process it shortly.</p>
          )}
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline" className="rounded-full">
              <Link href={user ? "/account/orders" : "/"}>View Orders</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-serif font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
            {/* Contact Info */}
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" /> Delivery Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.customerEmail} onChange={(e) => setField("customerEmail", e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={form.customerPhone} onChange={(e) => setField("customerPhone", e.target.value)} required placeholder="+961 70 000 000" className="rounded-xl" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Address *</Label>
                  <Input value={form.address} onChange={(e) => setField("address", e.target.value)} required placeholder="Street, Building, Floor" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" value={form.city} onChange={(e) => setField("city", e.target.value)} required placeholder="Beirut" className="rounded-xl" />
                  <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                    Delivery in Beirut is $5.00. Outside Beirut it depends on the distance.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Area / Region</Label>
                  <Input value={form.deliveryArea} onChange={(e) => setField("deliveryArea", e.target.value)} placeholder="Hamra, Ashrafieh..." className="rounded-xl" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Order Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Any special requests?" className="rounded-xl resize-none" rows={3} />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Payment Method
              </h2>
              <RadioGroup value={form.paymentMethod} onValueChange={(v) => setField("paymentMethod", v)} className="space-y-3">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.paymentMethod === "cash_on_delivery" ? "border-primary bg-primary/5" : ""}`}>
                  <RadioGroupItem value="cash_on_delivery" id="cod" />
                  <Banknote className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.paymentMethod === "whish_money" ? "border-primary bg-primary/5" : ""}`}>
                  <RadioGroupItem value="whish_money" id="whish_money" />
                  <span className="text-lg">💸</span>
                  <div>
                    <p className="font-medium text-sm">Whish Money</p>
                    <p className="text-xs text-muted-foreground">Transfer via Whish Money and send us receipt on WhatsApp</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <Button type="submit" size="lg" className="w-full rounded-xl font-semibold" disabled={isPlacingOrder || items.length === 0}>
              {isPlacingOrder ? "Placing Order..." : `Place Order · $${total.toFixed(2)}`}
            </Button>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border bg-card p-6 sticky top-20">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.imageUrl ? (
                        <img src={getImageUrl(item.imageUrl)} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🏠</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">${((item.salePrice ?? item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <Separator className="mb-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{deliveryFee === 0 ? <span className="text-green-600">Free</span> : `$${deliveryFee.toFixed(2)}`}</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
