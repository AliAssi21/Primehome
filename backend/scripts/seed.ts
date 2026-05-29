import { db, usersTable, categoriesTable, productsTable, settingsTable, couponsTable } from "../db";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("NourP@2000", 10);
  await db.insert(usersTable).ignore().values({
    name: "Admin",
    email: "admin@primehome.lb",
    passwordHash: adminHash,
    phone: "+961 70 000 000",
    role: "admin",
    banned: false,
  });
  console.log("Admin user created: admin@primehome.lb / NourP@2000");

  // Settings
  const existingSettings = await db.select().from(settingsTable).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(settingsTable).values({
      storeName: "Prime Home LB",
      whatsappNumber: "+96170000000",
      instagramUrl: "https://www.instagram.com/primehome.lb",
      email: "info@primehome.lb",
      address: "Beirut, Lebanon",
      deliveryFee: "5.00",
      freeDeliveryThreshold: "50.00",
      currency: "USD",
      announcementText: "Free delivery on orders over $50!",
      announcementActive: true,
    });
    console.log("Settings created");
  }

  // Categories
  const categoryData = [
    { name: "Living Room", slug: "living-room", description: "Elevate your living space", imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format" },
    { name: "Bedroom", slug: "bedroom", description: "Rest in style and comfort", imageUrl: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&auto=format" },
    { name: "Kitchen", slug: "kitchen", description: "Premium kitchen essentials", imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format" },
    { name: "Bathroom", slug: "bathroom", description: "Luxury bathroom accessories", imageUrl: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&auto=format" },
    { name: "Lighting", slug: "lighting", description: "Set the perfect ambiance", imageUrl: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&auto=format" },
    { name: "Decor", slug: "decor", description: "Finishing touches that matter", imageUrl: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&auto=format" },
  ];

  for (const cat of categoryData) {
    await db.insert(categoriesTable).ignore().values(cat);
  }
  console.log("Categories seeded");

  // Get category IDs
  const cats = await db.select().from(categoriesTable);
  const catMap: Record<string, number> = {};
  for (const c of cats) catMap[c.slug] = c.id;

  // Products
  const productData = [
    {
      name: "Luxury Velvet Sofa",
      slug: "luxury-velvet-sofa",
      description: "A stunning three-seat velvet sofa in deep ocean blue. Handcrafted with premium oak legs and high-density foam cushions. Perfect for the modern Lebanese home.",
      price: "899.00",
      salePrice: "749.00",
      stock: 12,
      sku: "SOF-001",
      categoryId: catMap["living-room"],
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format",
        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format",
      ],
      featured: true,
      bestSeller: true,
      onSale: true,
      salesCount: 47,
    },
    {
      name: "Marble Coffee Table",
      slug: "marble-coffee-table",
      description: "Elegant round coffee table with genuine white marble top and brushed gold base. Adds a sophisticated touch to any living room.",
      price: "450.00",
      salePrice: null,
      stock: 8,
      sku: "TBL-001",
      categoryId: catMap["living-room"],
      images: [
        "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&auto=format",
      ],
      featured: true,
      bestSeller: false,
      onSale: false,
      salesCount: 23,
    },
    {
      name: "Premium Linen Bedding Set",
      slug: "premium-linen-bedding-set",
      description: "100% Belgian linen bedding set in warm ivory. Includes duvet cover, two pillow cases, and a flat sheet. Pre-washed for instant comfort.",
      price: "189.00",
      salePrice: "149.00",
      stock: 25,
      sku: "BED-001",
      categoryId: catMap["bedroom"],
      images: [
        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format",
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format",
      ],
      featured: true,
      bestSeller: true,
      onSale: true,
      salesCount: 89,
    },
    {
      name: "Handwoven Wool Rug",
      slug: "handwoven-wool-rug",
      description: "Artisan handwoven wool rug with geometric Moroccan pattern. 2m × 3m. Naturally dyed with rich terracotta and cream tones.",
      price: "320.00",
      salePrice: null,
      stock: 6,
      sku: "RUG-001",
      categoryId: catMap["living-room"],
      images: [
        "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&auto=format",
      ],
      featured: false,
      bestSeller: true,
      onSale: false,
      salesCount: 34,
    },
    {
      name: "Brass Pendant Light",
      slug: "brass-pendant-light",
      description: "Statement brass pendant light with handblown smoked glass globe. Creates warm, ambient lighting. Adjustable cord height up to 2m.",
      price: "275.00",
      salePrice: "220.00",
      stock: 15,
      sku: "LGT-001",
      categoryId: catMap["lighting"],
      images: [
        "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&auto=format",
      ],
      featured: true,
      bestSeller: false,
      onSale: true,
      salesCount: 28,
    },
    {
      name: "Ceramic Dinner Set",
      slug: "ceramic-dinner-set",
      description: "Artisanal ceramic dinner set for 6 in matte sage green. Includes plates, bowls, mugs, and salad plates. Dishwasher safe.",
      price: "210.00",
      salePrice: null,
      stock: 18,
      sku: "KIT-001",
      categoryId: catMap["kitchen"],
      images: [
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format",
      ],
      featured: false,
      bestSeller: true,
      onSale: false,
      salesCount: 56,
    },
    {
      name: "Travertine Candle Holders",
      slug: "travertine-candle-holders",
      description: "Set of 3 natural travertine candle holders in varying heights. Each piece is unique with natural veining. Perfect table centerpiece.",
      price: "85.00",
      salePrice: "65.00",
      stock: 30,
      sku: "DEC-001",
      categoryId: catMap["decor"],
      images: [
        "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&auto=format",
      ],
      featured: false,
      bestSeller: false,
      onSale: true,
      salesCount: 41,
    },
    {
      name: "Luxury Bath Towel Set",
      slug: "luxury-bath-towel-set",
      description: "Egyptian cotton bath towel set in pearl white. 700 GSM. Includes 2 bath towels, 2 hand towels, and 2 face cloths. Ultra-soft and absorbent.",
      price: "120.00",
      salePrice: null,
      stock: 20,
      sku: "BTH-001",
      categoryId: catMap["bathroom"],
      images: [
        "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&auto=format",
      ],
      featured: false,
      bestSeller: true,
      onSale: false,
      salesCount: 72,
    },
    {
      name: "Rattan Accent Chair",
      slug: "rattan-accent-chair",
      description: "Handwoven natural rattan accent chair with plush bouclé cushion. Lightweight yet durable. Brings a warm organic feel to any room.",
      price: "380.00",
      salePrice: null,
      stock: 9,
      sku: "CHR-001",
      categoryId: catMap["living-room"],
      images: [
        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format",
      ],
      featured: true,
      bestSeller: false,
      onSale: false,
      salesCount: 19,
    },
    {
      name: "Linen Blackout Curtains",
      slug: "linen-blackout-curtains",
      description: "Premium linen look blackout curtains in warm sand color. Set of 2 panels 140cm × 260cm. Thermal insulation, reduces noise.",
      price: "145.00",
      salePrice: "115.00",
      stock: 22,
      sku: "CRT-001",
      categoryId: catMap["bedroom"],
      images: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format",
      ],
      featured: false,
      bestSeller: false,
      onSale: true,
      salesCount: 38,
    },
  ];

  for (const product of productData) {
    await db.insert(productsTable).ignore().values(product as typeof product & { images: string[] });
  }
  console.log("Products seeded");

  // Sample coupon
  await db.insert(couponsTable).ignore().values({
    code: "WELCOME10",
    type: "percentage",
    value: "10.00",
    minOrderAmount: "30.00",
    maxUses: 100,
    usedCount: 0,
    active: true,
  });
  console.log("Coupon seeded: WELCOME10");

  console.log("\n=== Seed complete! ===");
  console.log("Admin login: admin@primehome.lb / admin123");
}

seed().catch(console.error).finally(() => process.exit(0));
