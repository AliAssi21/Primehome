import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { Search, ShoppingBag, User, Heart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

interface Category {
  id: number;
  name: string;
  slug: string;
}

export function Navbar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { cart } = useCartContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiRequest("GET", "/categories"),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearch(false);
    }
  };

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Mobile Menu */}
        <div className="md:hidden flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-serif">Home</Link>
                <Link href="/products" className="text-lg font-serif">Shop All</Link>
                {categories?.map((cat) => (
                  <Link key={cat.id} href={`/categories/${cat.slug}`} className="text-lg font-serif">
                    {cat.name}
                  </Link>
                ))}
                <Link href="/track-order" className="text-lg font-serif text-primary">Track Order</Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold tracking-tight text-primary">Prime Home</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/products" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/products" ? "text-primary" : "text-muted-foreground"}`}>
            Shop All
          </Link>
          {categories?.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className={`text-sm font-medium transition-colors hover:text-primary ${location === `/categories/${cat.slug}` ? "text-primary" : "text-muted-foreground"}`}
            >
              {cat.name}
            </Link>
          ))}
          <Link href="/track-order" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/track-order" ? "text-primary" : "text-muted-foreground"}`}>
            Track Order
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 160, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mr-1"
                >
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-[160px] rounded-full text-xs pl-3 pr-8 bg-muted border-0 focus-visible:ring-1"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                if (showSearch && searchQuery.trim()) {
                  navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchQuery("");
                  setShowSearch(false);
                } else {
                  setShowSearch(!showSearch);
                }
              }}
              className="relative z-10"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
          
          <Link href={user ? "/wishlist" : "/login"}>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Heart className="h-5 w-5" />
              <span className="sr-only">Wishlist</span>
            </Button>
          </Link>

          <Link href={user ? "/account" : "/login"}>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </Link>
        </div>

      </div>
    </header>
  );
}
