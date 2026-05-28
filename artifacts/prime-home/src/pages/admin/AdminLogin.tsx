import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface LoginResponse {
  token: string;
  user: { id: number; name: string; email: string; role: string };
}

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { login } = useAdminAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiRequest<LoginResponse>("POST", "/auth/login", { email, password });
      if (res.user.role !== "admin") {
        toast({ title: "Access denied", description: "Admin access required", variant: "destructive" });
        return;
      }
      login(res.token, res.user as Parameters<typeof login>[1]);
      navigate("/admin");
    } catch (err: unknown) {
      toast({ title: "Invalid credentials", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 mb-4">
            <Lock className="h-6 w-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">Admin Portal</h1>
          <p className="text-stone-400 text-sm mt-1">Prime Home LB Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-stone-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-stone-900 border-stone-700 text-white placeholder:text-stone-500 rounded-xl h-11"
              placeholder="admin@primehome.lb"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-stone-300">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-stone-900 border-stone-700 text-white placeholder:text-stone-500 rounded-xl h-11 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In to Admin"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
