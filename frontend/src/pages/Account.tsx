import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { User, Package, Heart, LogOut, ChevronRight, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ productName: string; quantity: number; price: number }>;
}

interface OrdersResponse {
  items: Order[];
  total: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Account() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Weak password",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await apiRequest("PATCH", "/auth/me/change-password", {
        currentPassword,
        newPassword,
      });
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Could not update password. Please check your current password.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const { data: ordersData } = useQuery<OrdersResponse>({
    queryKey: ["orders", "mine"],
    queryFn: () => apiRequest("GET", "/orders", undefined, getToken() || undefined),
    enabled: !!user,
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">Sign in to view your account</h2>
          <Button asChild className="rounded-full mt-4">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold">My Account</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-muted rounded-xl p-1 w-fit">
          {[
            { id: "orders" as const, label: "Orders", icon: Package },
            { id: "profile" as const, label: "Profile", icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {!ordersData?.items.length ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6">Time to start shopping!</p>
                <Button asChild className="rounded-full"><Link href="/products">Browse Products</Link></Button>
              </div>
            ) : (
              <div className="space-y-4">
                {ordersData.items.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border bg-card p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-LB", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <p className="text-sm font-semibold mt-1">${order.total.toFixed(2)}</p>
                      </div>
                    </div>
                    <Separator className="mb-4" />
                    <div className="space-y-1">
                      {(order.items as { productName: string; quantity: number; price: number }[]).slice(0, 3).map((item, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {item.productName} × {item.quantity}
                        </p>
                      ))}
                      {(order.items as unknown[]).length > 3 && (
                        <p className="text-sm text-muted-foreground">+{(order.items as unknown[]).length - 3} more items</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between pt-2">
                <Link href="/wishlist" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Heart className="h-4 w-4" /> View Wishlist
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="text-lg font-serif font-semibold mb-2 flex items-center gap-2">
                <Key className="h-5 w-5 text-muted-foreground" /> Security & Password
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Update your account password. Make sure to choose a strong password.
              </p>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isUpdatingPassword} className="h-11 rounded-xl font-semibold mt-2">
                  {isUpdatingPassword ? "Updating password..." : "Update Password"}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
