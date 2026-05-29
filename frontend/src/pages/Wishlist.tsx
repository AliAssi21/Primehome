import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[];
  categoryName: string | null;
  onSale: boolean;
  stock: number;
}

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCartContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery<Product[]>({
    queryKey: ["wishlist"],
    queryFn: () => apiRequest("GET", "/wishlist", undefined, getToken() || undefined),
    enabled: !!user,
  });

  const removeFromWishlist = async (productId: number) => {
    try {
      await apiRequest("DELETE", `/wishlist/${productId}`, undefined, getToken() || undefined);
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({ title: "Removed from wishlist" });
    } catch {
      toast({ title: "Failed to remove", variant: "destructive" });
    }
  };

  const handleAddToCart = async (productId: number, name: string) => {
    try {
      await addToCart(productId, 1);
      toast({ title: "Added to cart", description: name });
    } catch {
      toast({ title: "Failed to add to cart", variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">Sign in to view your wishlist</h2>
          <Button asChild className="rounded-full mt-4">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="aspect-[3/4] bg-muted rounded-xl mb-3" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold">My Wishlist</h1>
            <p className="text-muted-foreground">{wishlist?.length ?? 0} saved item{wishlist?.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {!wishlist?.length ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <Heart className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-serif font-bold mb-3">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8">Save items you love and shop them later</p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/products">Browse Products</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {wishlist.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative"
              >
                <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4] mb-3">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>
                  )}
                  {product.onSale && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 text-white hover:bg-red-600 text-xs">SALE</Badge>
                    </div>
                  )}
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-red-50 transition-colors"
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      className="w-full bg-white text-stone-900 hover:bg-amber-50 rounded-full text-xs font-semibold"
                      onClick={() => handleAddToCart(product.id, product.name)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                      {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                  </div>
                </div>
                <Link href={`/products/${product.id}`}>
                  <p className="text-xs text-muted-foreground mb-0.5">{product.categoryName}</p>
                  <h3 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-semibold text-primary">${(product.salePrice ?? product.price).toFixed(2)}</span>
                    {product.salePrice && <span className="text-xs text-muted-foreground line-through">${product.price.toFixed(2)}</span>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
