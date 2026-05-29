import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface RegisterResponse {
  token: string;
  user: { id: number; name: string; email: string; role: string };
}

export default function Register() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiRequest<RegisterResponse>("POST", "/auth/register", { name, email, password, phone: phone || undefined });
      login(res.token, res.user as Parameters<typeof login>[1]);
      toast({ title: "Account created!", description: `Welcome to Prime Home, ${res.user.name}!` });
      navigate("/");
    } catch (err: unknown) {
      toast({ title: "Registration failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&auto=format"
          alt="Beautiful bedroom"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/60 to-transparent" />
        <div className="absolute bottom-12 left-12 text-white">
          <h2 className="font-serif text-4xl font-bold mb-3">Join Prime Home</h2>
          <p className="text-stone-300 text-lg">Discover luxury for every room</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <Link href="/" className="font-serif text-2xl font-bold text-primary mb-6 block">Prime Home</Link>
            <h1 className="text-3xl font-serif font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">Join Prime Home for an elevated shopping experience</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" placeholder="+961 70 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl h-11 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl font-semibold" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
