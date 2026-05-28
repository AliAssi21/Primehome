import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CouponResponse {
  valid: boolean;
  discount: number;
  message: string | null;
}

export default function Cart() {
  const { cart, updateCartItem, removeFromCart, isLoading } = useCartContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await apiRequest<CouponResponse>("POST", "/coupons/validate", {
        code: coupon,
        orderAmount: cart?.subtotal ?? 0,
      });
      if (res.valid) {
        setCouponDiscount(res.discount);
        setCouponCode(coupon.toUpperCase());
        toast({ title: `Coupon applied! You save $${res.discount.toFixed(2)}` });
      } else {
        toast({ title: res.message || "Invalid coupon", variant: "destructive" });
      }
    } catch {
      toast({ title: "Could not validate coupon", variant: "destructive" });
    } finally {
      setValidatingCoupon(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">Sign in to view your cart</h2>
          <p className="text-muted-foreground mb-6">Your cart items will be saved when you sign in</p>
          <Button asChild className="rounded-full">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const deliveryFee = cart?.deliveryFee ?? 5;
  const total = subtotal + deliveryFee - couponDiscount;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-serif font-bold mb-3">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Explore our collection and find something you love</p>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif font-bold mb-8">Shopping Cart <span className="text-muted-foreground text-lg font-sans font-normal">({items.length} {items.length === 1 ? "item" : "items"})</span></h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className="flex gap-4 p-4 rounded-2xl border bg-card"
                >
                  <Link href={`/products/${item.productId}`}>
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.productId}`}>
                      <h3 className="font-medium leading-snug hover:text-primary transition-colors line-clamp-2">{item.productName}</h3>
                    </Link>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-semibold text-primary">${(item.salePrice ?? item.price).toFixed(2)}</span>
                      {item.salePrice && <span className="text-xs text-muted-foreground line-through">${item.price.toFixed(2)}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border rounded-full overflow-hidden">
                        <button
                          className="px-2.5 py-1 hover:bg-muted transition-colors disabled:opacity-40"
                          onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 py-1 font-medium text-sm">{item.quantity}</span>
                        <button
                          className="px-2.5 py-1 hover:bg-muted transition-colors disabled:opacity-40"
                          onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border bg-card p-6 sticky top-20">
              <h2 className="text-xl font-serif font-semibold mb-5">Order Summary</h2>
              
              {/* Coupon */}
              <div className="mb-5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    className="rounded-xl uppercase"
                  />
                  <Button variant="outline" size="sm" onClick={applyCoupon} disabled={validatingCoupon} className="shrink-0 rounded-xl">
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                {couponCode && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-green-100 text-green-800">{couponCode} applied!</Badge>
                    <button onClick={() => { setCouponCode(null); setCouponDiscount(0); setCoupon(""); }} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                  </div>
                )}
              </div>

              <Separator className="mb-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{deliveryFee === 0 ? <span className="text-green-600 font-medium">Free</span> : `$${deliveryFee.toFixed(2)}`}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${couponDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold text-lg mb-6">
                <span>Total</span>
                <span>${Math.max(0, total).toFixed(2)}</span>
              </div>

              <Button asChild size="lg" className="w-full rounded-xl font-semibold">
                <Link href={`/checkout${couponCode ? `?coupon=${couponCode}` : ""}`}>
                  Checkout <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3">Free delivery on orders over $50</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
