import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { Search, ShoppingBag, User, Heart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { cart } = useCartContext();

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
                <Link href="/categories/living" className="text-lg font-serif">Living Room</Link>
                <Link href="/categories/bedroom" className="text-lg font-serif">Bedroom</Link>
                <Link href="/categories/decor" className="text-lg font-serif">Decor</Link>
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
          <Link href="/categories/living" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/categories/living" ? "text-primary" : "text-muted-foreground"}`}>
            Living
          </Link>
          <Link href="/categories/bedroom" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/categories/bedroom" ? "text-primary" : "text-muted-foreground"}`}>
            Bedroom
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          
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
