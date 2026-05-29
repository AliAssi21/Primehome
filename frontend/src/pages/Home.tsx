import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Shield, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, getImageUrl } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
  categoryName: string | null;
  onSale: boolean;
  featured: boolean;
  bestSeller: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  description: string | null;
}

interface FeaturedResponse {
  featured: Product[];
  bestSellers: Product[];
}

function ProductCard({ product }: { product: Product }) {
  const displayPrice = product.salePrice ?? product.price;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group"
    >
      <Link href={`/products/${product.id}`}>
        <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4] mb-3">
          {product.images[0] ? (
            <img
              src={getImageUrl(product.images[0])}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
              <span className="text-4xl">🏠</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-1">
            {product.onSale && <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">SALE</Badge>}
            {product.bestSeller && <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-xs">BEST SELLER</Badge>}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{product.categoryName}</p>
          <h3 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors">{product.name}</h3>
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

export default function Home() {
  const { data: featuredData } = useQuery<FeaturedResponse>({
    queryKey: ["products", "featured"],
    queryFn: () => apiRequest("GET", "/products/featured"),
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiRequest("GET", "/categories"),
  });

  const { data: saleProducts } = useQuery<Product[]>({
    queryKey: ["products", "flash-sale"],
    queryFn: () => apiRequest("GET", "/products/flash-sale"),
  });

  const { data: settings } = useQuery<{ announcementText: string | null; announcementActive: boolean }>({
    queryKey: ["settings"],
    queryFn: () => apiRequest("GET", "/settings"),
  });

  const featured = featuredData?.featured ?? [];
  const bestSellers = featuredData?.bestSellers ?? [];

  return (
    <div className="min-h-screen">
      {/* Announcement Banner */}
      {settings?.announcementActive && settings.announcementText && (
        <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
          {settings.announcementText}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950">
        <div className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&auto=format')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >

            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-[1.1] mb-6">
              Elevate Your
              <span className="block text-amber-400">Living Space</span>
            </h1>
            <p className="text-lg text-stone-300 mb-8 leading-relaxed">
              Curated luxury home products delivered across Lebanon. From statement furniture to elegant decor — make every room a masterpiece.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 rounded-full">
                <Link href="/products">Shop Collection</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full">
                <Link href="/categories">Browse Categories</Link>
              </Button>
            </div>
          </motion.div>
        </div>
        {/* Decorative gradient bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="py-20 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-3">Shop by Room</h2>
            <p className="text-muted-foreground">Discover collections crafted for every corner of your home</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/categories/${cat.slug}`}>
                  <div className="group relative overflow-hidden rounded-2xl aspect-square cursor-pointer">
                    {cat.imageUrl ? (
                      <img src={getImageUrl(cat.imageUrl)} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-100 to-stone-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <p className="font-semibold text-sm text-center leading-tight">{cat.name}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-12"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">Featured Pieces</h2>
                <p className="text-muted-foreground">Hand-picked by our design team</p>
              </div>
              <Button asChild variant="ghost" className="hidden md:flex gap-2 text-primary">
                <Link href="/products?featured=true">View All <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featured.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/products?featured=true">View All Featured</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Sale Banner */}
      {saleProducts && saleProducts.length > 0 && (
        <section className="py-20 bg-gradient-to-r from-red-50 to-amber-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-12"
            >
              <div>
                <Badge className="mb-3 bg-red-500 text-white hover:bg-red-600">LIMITED TIME</Badge>
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">Flash Sale</h2>
                <p className="text-muted-foreground">Up to 40% off on selected items</p>
              </div>
              <Button asChild variant="ghost" className="hidden md:flex gap-2 text-red-600">
                <Link href="/products?onSale=true">View All <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {saleProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-20 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-amber-600">Customer Favorites</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold">Best Sellers</h2>
            </div>
            <Button asChild variant="ghost" className="hidden md:flex gap-2 text-primary">
              <Link href="/products?sort=popular">View All <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bestSellers.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Why Us Section */}
      <section className="py-20 bg-stone-900 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-3">The Prime Promise</h2>
            <p className="text-stone-400">Every order backed by our commitment to excellence</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Shield, title: "Quality Guaranteed", desc: "Every product is carefully sourced and inspected. We stand by what we sell." },
              { icon: Truck, title: "Reliable Delivery", desc: "Carefully packaged and delivered directly to your doorstep across Lebanon." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/20 mb-6">
                  <item.icon className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-stone-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-stone-100">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Ready to Transform Your Home?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Join thousands of Lebanese homes that have chosen Prime Home for their interior needs.
            </p>
            <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-10 font-semibold text-base">
              <Link href="/products">Start Shopping</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-serif text-xl font-bold text-white mb-4">Prime Home</h3>
              <p className="text-sm leading-relaxed">Luxury home products for the modern Lebanese home. Curated with care, delivered with love.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/products?featured=true" className="hover:text-white transition-colors">Featured</Link></li>
                <li><Link href="/products?onSale=true" className="hover:text-white transition-colors">Sale</Link></li>
                <li><Link href="/products?sort=popular" className="hover:text-white transition-colors">Best Sellers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link href="/account/orders" className="hover:text-white transition-colors">My Orders</Link></li>
                <li><Link href="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-8 text-center text-xs">
            <p>© {new Date().getFullYear()} Prime Home LB. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
