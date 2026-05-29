import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, MapPin, Phone, Mail, FileText, Calendar, CreditCard, ShoppingBag, ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

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
  items: OrderItem[];
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-purple-100 text-purple-800 border-purple-200",
  shipped: "bg-cyan-100 text-cyan-800 border-cyan-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function TrackOrder() {
  const { toast } = useToast();
  const [orderNumberInput, setOrderNumberInput] = useState("");
  const [verificationType, setVerificationType] = useState<"email" | "phone">("email");
  const [verificationValue, setVerificationValue] = useState("");
  const [searchParams, setSearchParams] = useState<{ orderNumber: string; verificationValue: string; type: "email" | "phone" } | null>(null);

  const { data: order, isLoading, isError, error, refetch } = useQuery<Order>({
    queryKey: ["order-tracking", searchParams],
    queryFn: async () => {
      if (!searchParams) return null as any;
      const { orderNumber, verificationValue, type } = searchParams;
      const query = new URLSearchParams({
        orderNumber,
        [type]: verificationValue,
      }).toString();
      return apiRequest<Order>("GET", `/orders/track?${query}`);
    },
    enabled: !!searchParams,
    retry: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumberInput.trim()) {
      toast({
        title: "Order Number Required",
        description: "Please enter a valid order number.",
        variant: "destructive",
      });
      return;
    }
    if (!verificationValue.trim()) {
      toast({
        title: "Verification Field Required",
        description: `Please enter the ${verificationType} associated with the order.`,
        variant: "destructive",
      });
      return;
    }

    setSearchParams({
      orderNumber: orderNumberInput.trim(),
      verificationValue: verificationValue.trim(),
      type: verificationType,
    });
  };

  const handleClear = () => {
    setSearchParams(null);
    setOrderNumberInput("");
    setVerificationValue("");
  };

  const getStepIndex = (status: string) => {
    return STEPS.indexOf(status.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Link>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-900 mb-3">Track Your Order</h1>
          <p className="text-stone-600 max-w-md mx-auto">
            Enter your order details below to see real-time updates on your delivery and status.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!searchParams || isError ? (
            <motion.div
              key="search-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <Card className="shadow-md border-stone-200">
                <CardHeader>
                  <CardTitle className="font-serif">Find your order</CardTitle>
                  <CardDescription>
                    Provide your order number and either the email or phone number used during checkout.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="orderNumber">Order Number</Label>
                      <div className="relative">
                        <Package className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="orderNumber"
                          placeholder="e.g. PH-LKT5R8"
                          value={orderNumberInput}
                          onChange={(e) => setOrderNumberInput(e.target.value)}
                          className="pl-11 h-12 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Verification Method</Label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationType("email");
                            setVerificationValue("");
                          }}
                          className={`py-2 text-sm font-medium rounded-lg transition-all ${
                            verificationType === "email"
                              ? "bg-white text-stone-950 shadow-sm"
                              : "text-muted-foreground hover:text-stone-900"
                          }`}
                        >
                          Verify with Email
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationType("phone");
                            setVerificationValue("");
                          }}
                          className={`py-2 text-sm font-medium rounded-lg transition-all ${
                            verificationType === "phone"
                              ? "bg-white text-stone-950 shadow-sm"
                              : "text-muted-foreground hover:text-stone-900"
                          }`}
                        >
                          Verify with Phone
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verificationValue">
                        {verificationType === "email" ? "Email Address" : "Phone Number"}
                      </Label>
                      <div className="relative">
                        {verificationType === "email" ? (
                          <Mail className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Phone className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground" />
                        )}
                        <Input
                          id="verificationValue"
                          type={verificationType === "email" ? "email" : "text"}
                          placeholder={verificationType === "email" ? "name@example.com" : "e.g. 70123456"}
                          value={verificationValue}
                          onChange={(e) => setVerificationValue(e.target.value)}
                          className="pl-11 h-12 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    {isError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                        {(error as Error)?.message || "Failed to find order. Please verify details."}
                      </div>
                    )}

                    <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-base shadow-sm" disabled={isLoading}>
                      {isLoading ? "Searching..." : "Track Order"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            order && (
              <motion.div
                key="order-details"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* Order Status summary card */}
                <Card className="shadow-sm border-stone-200">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <CardTitle className="font-serif text-2xl font-bold">{order.orderNumber}</CardTitle>
                        <Badge className={`${STATUS_COLORS[order.status] ?? "bg-stone-100 text-stone-800"} px-2.5 py-1 text-xs border uppercase tracking-wider font-semibold`}>
                          {order.status}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" /> Placed on {new Date(order.createdAt).toLocaleDateString("en-LB", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </CardDescription>
                    </div>
                    <Button onClick={handleClear} variant="outline" className="rounded-xl h-10 px-4">
                      Track Another Order
                    </Button>
                  </CardHeader>

                  <CardContent className="pt-2">
                    {order.status === "cancelled" ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-900">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <h4 className="font-semibold text-sm">Order Cancelled</h4>
                          <p className="text-xs text-red-800 mt-1">This order has been cancelled and is not active.</p>
                        </div>
                      </div>
                    ) : (
                      /* Visual tracking timeline/stepper */
                      <div className="py-6 px-2 sm:px-4">
                        <div className="relative flex justify-between items-center w-full">
                          {/* Stepper connector line background */}
                          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-stone-200 z-0" />
                          
                          {/* Active connector line */}
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 z-0"
                            style={{
                              width: `${(Math.max(0, getStepIndex(order.status)) / (STEPS.length - 1)) * 100}%`,
                            }}
                          />

                          {/* Steps */}
                          {STEPS.map((step, idx) => {
                            const stepIdx = getStepIndex(order.status);
                            const isActive = idx <= stepIdx;
                            const isCurrent = idx === stepIdx;

                            return (
                              <div key={step} className="flex flex-col items-center z-10">
                                <div
                                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 border-2 ${
                                    isActive
                                      ? "bg-primary border-primary text-white"
                                      : "bg-white border-stone-300 text-stone-400"
                                  } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}
                                >
                                  {isActive ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                  ) : (
                                    <Circle className="h-3 w-3 fill-stone-300 stroke-none" />
                                  )}
                                </div>
                                <span className={`text-[10px] sm:text-xs font-semibold capitalize mt-2.5 transition-colors ${
                                  isActive ? "text-stone-900 font-bold" : "text-muted-foreground"
                                }`}>
                                  {step}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Grid detailing shipping vs order items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Delivery and Customer details */}
                  <Card className="shadow-sm border-stone-200">
                    <CardHeader>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-stone-500" /> Delivery Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Customer Name</p>
                        <p className="font-medium text-stone-900">{order.customerName}</p>
                      </div>
                      
                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Phone Number</p>
                          <p className="font-medium text-stone-900">{order.customerPhone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Email</p>
                          <p className="font-medium text-stone-900 truncate">{order.customerEmail || "N/A"}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Shipping Address</p>
                        <p className="font-medium text-stone-900 leading-relaxed">
                          {order.address}, {order.city}
                        </p>
                        {order.deliveryArea && (
                          <p className="text-xs text-muted-foreground mt-1">Area: {order.deliveryArea}</p>
                        )}
                      </div>

                      {order.notes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Delivery Notes</p>
                            <p className="text-stone-700 italic text-xs leading-relaxed bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                              "{order.notes}"
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment Details */}
                  <Card className="shadow-sm border-stone-200">
                    <CardHeader>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-stone-500" /> Payment & Totals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Payment Method</p>
                        <Badge variant="outline" className="font-semibold uppercase tracking-wider text-xs">
                          {order.paymentMethod === "cod" ? "Cash On Delivery (COD)" : order.paymentMethod}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="space-y-2.5">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Delivery Fee</span>
                          <span>{order.deliveryFee === 0 ? "Free" : `$${order.deliveryFee.toFixed(2)}`}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-green-600 font-medium">
                            <span className="flex items-center gap-1.5">Discount {order.couponCode && `(${order.couponCode})`}</span>
                            <span>-${order.discount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between font-bold text-base text-stone-900 pt-1">
                          <span>Grand Total</span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items list */}
                <Card className="shadow-sm border-stone-200">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-stone-500" /> Items in Order
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-stone-200">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 sm:p-5">
                          <div>
                            <p className="font-semibold text-stone-900 text-sm sm:text-base">{item.productName}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ${item.price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <span className="font-bold text-stone-950 text-sm sm:text-base">
                            ${item.subtotal.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
