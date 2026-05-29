import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Heart, ChevronLeft, Minus, Plus, Star, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, getImageUrl } from "@/lib/api";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  images: string[];
  categoryName: string | null;
  categoryId: number | null;
  stock: number;
  sku: string | null;
  onSale: boolean;
  featured: boolean;
  bestSeller: boolean;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { addToCart } = useCartContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: () => apiRequest("GET", `/products/${id}`),
    enabled: !!id,
  });

  const { data: related } = useQuery<Product[]>({
    queryKey: ["product", id, "related"],
    queryFn: () => apiRequest("GET", `/products/${id}/related`),
    enabled: !!id,
  });

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      toast({ title: "Added to cart!", description: `${quantity}× ${product.name}` });
    } catch {
      toast({ title: "Sign in to add items to cart", variant: "destructive" });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setIsBuyingNow(true);
    try {
      await addToCart(product.id, quantity);
      navigate("/checkout");
    } catch {
      toast({ title: "Sign in to continue", variant: "destructive" });
      setIsBuyingNow(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      toast({ title: "Sign in to save to wishlist", variant: "destructive" });
      return;
    }
    try {
      if (isInWishlist) {
        await apiRequest("DELETE", `/wishlist/${id}`, undefined, getToken() || undefined);
        setIsInWishlist(false);
        toast({ title: "Removed from wishlist" });
      } else {
        await apiRequest("POST", `/wishlist/${id}`, undefined, getToken() || undefined);
        setIsInWishlist(true);
        toast({ title: "Added to wishlist" });
      }
    } catch {
      toast({ title: "Error updating wishlist", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-muted rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-24 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">😕</p>
        <h2 className="text-2xl font-semibold mb-4">Product not found</h2>
        <Button asChild variant="outline"><Link href="/products">Back to Shop</Link></Button>
      </div>
    );
  }

  const displayPrice = product.salePrice ?? product.price;
  const discount = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">Products</Link>
          {product.categoryName && (
            <>
              <span>/</span>
              <span>{product.categoryName}</span>
            </>
          )}
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
              {product.images[selectedImage] ? (
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🏠</div>
              )}
              {discount && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 text-white hover:bg-red-600 font-semibold text-sm">-{discount}%</Badge>
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === i ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
            <div className="mb-2">
              <p className="text-sm text-muted-foreground mb-1">{product.categoryName}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight">{product.name}</h1>
            </div>

            <div className="flex items-baseline gap-3 my-4">
              <span className="text-3xl font-bold text-primary">${displayPrice.toFixed(2)}</span>
              {product.salePrice && (
                <span className="text-xl text-muted-foreground line-through">${product.price.toFixed(2)}</span>
              )}
              {discount && <Badge className="bg-red-500 text-white hover:bg-red-600">Save {discount}%</Badge>}
            </div>

            <div className="flex items-center gap-2 mb-4">
              {product.bestSeller && <Badge variant="secondary" className="bg-amber-100 text-amber-800">⭐ Best Seller</Badge>}
              {product.onSale && <Badge variant="secondary" className="bg-red-100 text-red-800">🔥 On Sale</Badge>}
              <Badge variant={product.stock > 0 ? "secondary" : "destructive"} className={product.stock > 5 ? "bg-green-100 text-green-800" : product.stock > 0 ? "bg-amber-100 text-amber-800" : ""}>
                {product.stock > 5 ? "In Stock" : product.stock > 0 ? `Only ${product.stock} left` : "Out of Stock"}
              </Badge>
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            )}

            {product.sku && (
              <p className="text-xs text-muted-foreground mb-6">SKU: {product.sku}</p>
            )}

            <Separator className="mb-6" />

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border rounded-full overflow-hidden">
                <button
                  className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-medium min-w-[2.5rem] text-center">{quantity}</span>
                <button
                  className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                className="flex-1 rounded-full font-semibold"
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isAddingToCart}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button variant="outline" size="icon" className="rounded-full shrink-0" onClick={handleWishlist}>
                <Heart className={`h-5 w-5 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-full mb-6"
              disabled={product.stock === 0 || isBuyingNow}
              onClick={handleBuyNow}
            >
              {isBuyingNow ? "Adding to cart..." : "Buy Now"}
            </Button>

            {/* Benefits */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Truck className="h-4 w-4 text-primary shrink-0" />
                <span>Fast delivery across Lebanon.</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <span>Quality guaranteed. 7-day easy returns.</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {related && related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-serif font-bold mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group">
                  <Link href={`/products/${p.id}`}>
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-3">
                      {p.images[0] ? (
                        <img src={getImageUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🏠</div>
                      )}
                    </div>
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">{p.name}</h3>
                    <p className="text-sm font-semibold text-primary mt-1">${(p.salePrice ?? p.price).toFixed(2)}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
