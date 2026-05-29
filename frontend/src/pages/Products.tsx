import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Search, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { apiRequest, getImageUrl } from "@/lib/api";
import { useCartContext } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
  categoryName: string | null;
  categoryId: number | null;
  onSale: boolean;
  featured: boolean;
  bestSeller: boolean;
  stock: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCartContext();
  const { toast } = useToast();
  const displayPrice = product.salePrice ?? product.price;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart(product.id, 1);
      toast({ title: "Added to cart", description: product.name });
    } catch {
      toast({ title: "Sign in to add items", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Link href={`/products/${product.id}`}>
        <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4] mb-3">
          {product.images[0] ? (
            <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center text-4xl">🏠</div>
          )}
          <div className="absolute top-3 left-3 flex gap-1">
            {product.onSale && <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">SALE</Badge>}
            {product.bestSeller && <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-xs">TOP</Badge>}
          </div>
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Out of Stock</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              className="w-full bg-white text-stone-900 hover:bg-amber-50 rounded-full text-xs font-semibold"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              Add to Cart
            </Button>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{product.categoryName}</p>
          <h3 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-semibold text-primary">${displayPrice.toFixed(2)}</span>
            {product.salePrice && (
              <span className="text-xs text-muted-foreground line-through">${product.price.toFixed(2)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Products() {
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);

  const [search, setSearch] = useState(params.get("search") || "");
  const [categoryId, setCategoryId] = useState<string>(params.get("categoryId") || "");
  const [sort, setSort] = useState(params.get("sort") || "newest");
  const [maxPrice, setMaxPrice] = useState(2000);
  const [tempMaxPrice, setTempMaxPrice] = useState(2000);
  const [page, setPage] = useState(1);
  const [onSale, setOnSale] = useState(params.get("onSale") === "true");
  const [featured, setFeatured] = useState(params.get("featured") === "true");

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiRequest("GET", "/categories"),
  });

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (categoryId) queryParams.set("categoryId", categoryId);
  if (sort && sort !== "newest") queryParams.set("sort", sort);
  if (maxPrice < 2000) queryParams.set("maxPrice", String(maxPrice));
  if (onSale) queryParams.set("onSale", "true");
  if (featured) queryParams.set("featured", "true");
  queryParams.set("page", String(page));
  queryParams.set("limit", "12");

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["products", queryParams.toString()],
    queryFn: () => apiRequest("GET", `/products?${queryParams.toString()}`),
  });

  const totalPages = data ? Math.ceil(data.total / 12) : 0;

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3 text-sm">Category</h3>
        <div className="space-y-2">
          <button
            onClick={() => { setCategoryId(""); setPage(1); }}
            className={`block text-sm w-full text-left py-1 transition-colors ${!categoryId ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            All Categories
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategoryId(String(cat.id)); setPage(1); }}
              className={`block text-sm w-full text-left py-1 transition-colors ${categoryId === String(cat.id) ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm">Max Price</h3>
        <Slider
          min={10} max={2000} step={10}
          value={[tempMaxPrice]}
          onValueChange={(v) => setTempMaxPrice(v[0])}
          onValueCommit={(v) => { setMaxPrice(v[0]); setPage(1); }}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$10</span>
          <span>${tempMaxPrice}</span>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold mb-3 text-sm">Filter</h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={onSale} onChange={(e) => { setOnSale(e.target.checked); setPage(1); }} className="rounded" />
          On Sale
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={featured} onChange={(e) => { setFeatured(e.target.checked); setPage(1); }} className="rounded" />
          Featured
        </label>
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={() => { setCategoryId(""); setMaxPrice(2000); setTempMaxPrice(2000); setOnSale(false); setFeatured(false); setSearch(""); setSort("newest"); setPage(1); }}>
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">All Products</h1>
          <p className="text-muted-foreground">Discover our curated collection of luxury home items</p>
        </div>

        {/* Search + Sort Bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search products..."
              className="pl-9 rounded-full"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-40 rounded-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden rounded-full shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterPanel />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-56 shrink-0">
            <FilterPanel />
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {Array(9).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-muted rounded-xl mb-3" />
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : data?.items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🔍</p>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-5">{data?.total} product{data?.total !== 1 ? "s" : ""}</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Button key={p} variant={page === p ? "default" : "outline"} size="sm" onClick={() => setPage(p)}>{p}</Button>
                    ))}
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
