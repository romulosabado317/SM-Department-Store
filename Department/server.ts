import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Data Models & Seed Data ---

  const categories = [
    { id: 1, name: "Women", description: "Elegant apparel and accessories for women.", icon: "ShoppingBag" },
    { id: 2, name: "Men", description: "Sharp styles and casual wear for men.", icon: "ChevronRight" },
    { id: 3, name: "Kids", description: "Playful and comfortable apparel for children.", icon: "Baby" },
    { id: 4, name: "Home", description: "Curated essentials for a beautiful space.", icon: "Home" },
    { id: 5, name: "Beauty", description: "Premium skincare and cosmetics.", icon: "Sparkles" },
    { id: 6, name: "Toys", description: "Timeless play for all generations.", icon: "Bot" }
  ];

  const brands = [
    { id: 1, name: "Plains & Prints" },
    { id: 2, name: "Penshoppe" },
    { id: 3, name: "Bench" },
    { id: 4, name: "Regatta" },
    { id: 5, name: "Carbon" },
    { id: 6, name: "Miniso" },
    { id: 7, name: "Aesop" },
    { id: 8, name: "Muji" },
    { id: 9, name: "Hot Wheels" }
  ];

  const stores = [
    { 
      id: 1, 
      branchName: "SM Mall of Asia", 
      address: "Seaside Blvd, Pasay, 1300 Metro Manila", 
      openingHours: "10:00 AM - 10:00 PM", 
      mapsUrl: "https://maps.google.com/?q=SM+Mall+of+Asia" 
    },
    { 
      id: 2, 
      branchName: "SM Megamall", 
      address: "EDSA cor. Doña Julia Vargas Ave., Ortigas Center, Mandaluyong", 
      openingHours: "10:00 AM - 10:00 PM", 
      mapsUrl: "https://maps.google.com/?q=SM+Megamall" 
    },
    { 
      id: 3, 
      branchName: "SM North EDSA", 
      address: "North Avenue cor. EDSA, Quezon City, 1100 Metro Manila", 
      openingHours: "10:00 AM - 9:00 PM", 
      mapsUrl: "https://maps.google.com/?q=SM+North+EDSA" 
    }
  ];

  const products = [
    // Women
    { id: 1, name: "Silk Wrap Dress", brand: "Plains & Prints", category: "Women", price: 3450, originalPrice: 4500, isNew: false, isOnSale: true, imagePlaceholderColor: "#E8E4DF", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop" },
    { id: 2, name: "Tailored Linen Blazer", brand: "Regatta", category: "Women", price: 2800, originalPrice: null, isNew: true, isOnSale: false, imagePlaceholderColor: "#F0EDE8", image: "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?q=80&w=800&auto=format&fit=crop" },
    { id: 3, name: "Premium Leather Tote", brand: "Carbon", category: "Women", price: 5200, originalPrice: null, isNew: false, isOnSale: false, imagePlaceholderColor: "#D1CBC4", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop" },
    { id: 13, name: "Silk Charmeuse Scarf", brand: "Plains & Prints", category: "Women", price: 1250, originalPrice: null, isNew: true, isOnSale: false, imagePlaceholderColor: "#E2DCD5", image: "https://images.unsplash.com/photo-1601924921557-45e6ecd0a0e7?q=80&w=800&auto=format&fit=crop" },
    // Men
    { id: 4, name: "Classic Oxford Shirt", brand: "Bench", category: "Men", price: 1200, originalPrice: 1500, isNew: false, isOnSale: true, imagePlaceholderColor: "#C8C2BC", image: "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?q=80&w=800&auto=format&fit=crop" },
    { id: 5, name: "Slim Fit Chinos", brand: "Penshoppe", category: "Men", price: 999, originalPrice: null, isNew: true, isOnSale: false, imagePlaceholderColor: "#E2DCD5", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=800&auto=format&fit=crop" },
    { id: 6, name: "Performance Tech Tee", brand: "Bench", category: "Men", price: 750, originalPrice: null, isNew: true, isOnSale: false, imagePlaceholderColor: "#CBC4BC", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop" },
    { id: 14, name: "Wool Blend Overcoat", brand: "Regatta", category: "Men", price: 5800, originalPrice: 7200, isNew: false, isOnSale: true, imagePlaceholderColor: "#F0EDE8", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop" },
    // Kids
    { id: 7, name: "Graphic Print Hoodie", brand: "Penshoppe", category: "Kids", price: 850, originalPrice: null, isNew: true, isOnSale: false, imagePlaceholderColor: "#E8E4DF", image: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?q=80&w=800&auto=format&fit=crop" },
    { id: 8, name: "Cotton Twill Shorts", brand: "Regatta", category: "Kids", price: 650, originalPrice: 850, isNew: false, isOnSale: true, imagePlaceholderColor: "#F4F1EE", image: "https://images.unsplash.com/photo-1519457431-75731d5b847b?q=80&w=800&auto=format&fit=crop" },
    { id: 15, name: "Pinafore Denim Dress", brand: "Bench", category: "Kids", price: 1100, originalPrice: null, isNew: true, isOnSale: false, imagePlaceholderColor: "#D1CBC4", image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=800&auto=format&fit=crop" },
    // Home
    { id: 9, name: "Minimalist Table Lamp", brand: "Miniso", category: "Home", price: 799, originalPrice: null, isNew: false, isOnSale: false, imagePlaceholderColor: "#E8E4DF", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop" },
    { id: 10, name: "Scented Soy Candle", brand: "Miniso", category: "Home", price: 450, originalPrice: null, isNew: false, isOnSale: false, imagePlaceholderColor: "#F0EDE8", image: "https://images.unsplash.com/photo-1603006905521-2f71d87e0974?q=80&w=800&auto=format&fit=crop" },
    { id: 16, name: "Ceramic Tea Set", brand: "Muji", category: "Home", price: 2450, originalPrice: null, isNew: true, isOnSale: false, imagePlaceholderColor: "#E2DCD5", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800&auto=format&fit=crop" },
    // Beauty
    { id: 11, name: "Hydrating Face Serum", brand: "Aesop", category: "Beauty", price: 3250, originalPrice: null, isNew: true, isOnSale: false, imagePlaceholderColor: "#E2DCD5", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop" },
    { id: 12, name: "Velvet Matte Lipstick", brand: "Bench Beauty", category: "Beauty", price: 399, originalPrice: null, isNew: false, isOnSale: false, imagePlaceholderColor: "#D1CBC4", image: "https://images.unsplash.com/photo-1586776977607-310e9c725c37?q=80&w=800&auto=format&fit=crop" },
    { id: 17, name: "Hand Balms Trio", brand: "Aesop", category: "Beauty", price: 2100, originalPrice: null, isNew: false, isOnSale: false, imagePlaceholderColor: "#F0EDE8", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop" },
    // Toys - Hot Wheels Collection
    { id: 18, name: "Hot Wheels '67 Camaro", brand: "Hot Wheels", category: "Toys", price: 529, originalPrice: 629, isNew: true, isOnSale: true, imagePlaceholderColor: "#2d2d2d", image: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=800&auto=format&fit=crop" },
    { id: 19, name: "Hot Wheels '70 Chevelle SS", brand: "Hot Wheels", category: "Toys", price: 579, originalPrice: null, isNew: true, isOnSale: false, imagePlaceholderColor: "#1a1a1a", image: "https://images.unsplash.com/photo-1532330393533-443990a51d10?q=80&w=800&auto=format&fit=crop" },
    { id: 20, name: "Hot Wheels Monster Truck", brand: "Hot Wheels", category: "Toys", price: 949, originalPrice: 1049, isNew: false, isOnSale: true, imagePlaceholderColor: "#3d3d3d", image: "https://images.unsplash.com/photo-1558981403-c5f9799868fb?q=80&w=800&auto=format&fit=crop" },
    { id: 21, name: "Hot Wheels Twin Mill", brand: "Hot Wheels", category: "Toys", price: 499, originalPrice: null, isNew: true, isOnSale: false, imagePlaceholderColor: "#222", image: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?q=80&w=800&auto=format&fit=crop" },
    { id: 22, name: "Hot Wheels Bone Shaker", brand: "Hot Wheels", category: "Toys", price: 599, originalPrice: 799, isNew: false, isOnSale: true, imagePlaceholderColor: "#333", image: "https://images.unsplash.com/photo-1590333746430-6677f5080061?q=80&w=800&auto=format&fit=crop" }
  ];

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/products", (req, res) => {
    const { category, onSale, isNew } = req.query;
    let filtered = [...products];

    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
    }
    if (onSale === 'true') {
      filtered = filtered.filter(p => p.isOnSale);
    }
    if (isNew === 'true') {
      filtered = filtered.filter(p => p.isNew);
    }

    res.json(filtered);
  });

  app.get("/api/products/:id", (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  });

  app.get("/api/categories", (req, res) => {
    res.json(categories);
  });

  app.get("/api/brands", (req, res) => {
    res.json(brands);
  });

  app.get("/api/stores", (req, res) => {
    res.json(stores);
  });

  // --- Vite & Production Setup ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SM Department Store API running on port ${PORT}`);
    console.log(`🔗 Local access: http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Error: Port ${PORT} is already in use. Please close the other application or use a different port.`);
    } else {
      console.error('❌ Server error:', err);
    }
  });
}

startServer().catch(err => {
  console.error("❌ Failed to start server:", err);
});
