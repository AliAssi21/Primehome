import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, getImageUrl } from "@/lib/api";
import { useCartContext } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

interface Product {
  id: number;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[];
  categoryName: string | null;
  onSale: boolean;
  featured: boolean;
  bestSeller: boolean;
  stock: number;
}

interface ProductsResponse {
  items: Product[];
  total: number;
}

export default function CategoryProducts() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCartContext();
  const { toast } = useToast();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiRequest("GET", "/categories"),
  });

  const category = categories?.find((c) => c.slug === slug);

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["products", "category", category?.id],
    queryFn: () => apiRequest("GET", `/products?categoryId=${category!.id}&limit=24`),
    enabled: !!category?.id,
  });

  const handleAddToCart = async (e: React.MouseEvent, productId: number, name: string) => {
    e.preventDefault();
    try {
      await addToCart(productId, 1);
      toast({ title: "Added to cart", description: name });
    } catch {
      toast({ title: "Sign in to add items", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Category Hero */}
      <div className="relative h-56 md:h-72 overflow-hidden bg-stone-900">
        {category?.imageUrl && (
          <img src={getImageUrl(category.imageUrl)} alt={category.name} className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">{category?.name ?? slug}</h1>
          {category?.description && <p className="text-stone-300 text-lg">{category.description}</p>}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">Products</Link>
          <span>/</span>
          <span className="text-foreground">{category?.name ?? slug}</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i}>
                <div className="aspect-[3/4] bg-muted rounded-xl mb-3" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🏠</p>
            <h3 className="text-xl font-semibold mb-2">No products in this category yet</h3>
            <Button asChild variant="outline" className="mt-4 rounded-full">
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">{data.total} product{data.total !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {data.items.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group"
                >
                  <Link href={`/products/${product.id}`}>
                    <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4] mb-3">
                      {product.images[0] ? (
                        <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-1">
                        {product.onSale && <Badge className="bg-red-500 text-white text-xs">SALE</Badge>}
                        {product.bestSeller && <Badge className="bg-amber-600 text-white text-xs">TOP</Badge>}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          className="w-full bg-white text-stone-900 hover:bg-amber-50 rounded-full text-xs font-semibold"
                          onClick={(e) => handleAddToCart(e, product.id, product.name)}
                          disabled={product.stock === 0}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-semibold text-primary">${(product.salePrice ?? product.price).toFixed(2)}</span>
                      {product.salePrice && <span className="text-xs text-muted-foreground line-through">${product.price.toFixed(2)}</span>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
