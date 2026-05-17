/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search, User, ShoppingBag, Menu, X, ArrowRight, 
  MapPin, Clock, Heart, ShoppingCart, 
  Instagram, Facebook, Twitter, Youtube,
  Gift, Star, CreditCard, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useInView, animate } from 'motion/react';
import Lenis from 'lenis';
import TextReveal from './components/TextReveal';
import ScrollProgress from './components/ScrollProgress';
import Preloader from './components/Preloader';

// --- Types ---

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number | null;
  isNew: boolean;
  isOnSale: boolean;
  image: string;
  imagePlaceholderColor: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Store {
  id: number;
  branchName: string;
  address: string;
  openingHours: string;
  mapsUrl: string;
}

// --- Components ---

const LoadingSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-4 animate-pulse">
        <div className="aspect-[3/4] bg-sm-border rounded-sm" />
        <div className="h-4 bg-sm-border w-1/3" />
        <div className="h-6 bg-sm-border w-2/3" />
        <div className="h-4 bg-sm-border w-1/4" />
      </div>
    ))}
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="py-20 text-center space-y-4">
    <p className="font-serif text-2xl text-sm-ink">{message}</p>
    <button 
      onClick={() => window.location.reload()}
      className="px-6 py-2 border border-sm-ink text-sm uppercase tracking-widest hover:bg-sm-ink hover:text-sm-bg transition-colors"
    >
      Retry Connection
    </button>
  </div>
);

const CATEGORY_IMAGES: Record<string, string> = {
  Women:  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80',
  Men:    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&q=80',
  Kids:   'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=80',
  Toys:   'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=1200&q=80',
  Home:   'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80',
  Beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80',
};

function CounterAnimation({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2.5, ease: [0.22, 1, 0.36, 1] });
    }
  }, [isInView]);

  return <span ref={ref}><motion.span>{rounded}</motion.span>{suffix}</span>;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  
  const [activeTab, setActiveTab] = useState('All');
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<{id: number, message: string}[]>([]);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<{ email: string; uid: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreloading, setIsPreloading] = useState(true);

  const productsRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const lenisRef = useRef<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const scrollToProducts = () => {
    if (lenisRef.current && productsRef.current) {
      lenisRef.current.scrollTo(productsRef.current, { offset: -80 });
    } else {
      productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- Auth Logic (Mocked for Local Use) ---

  useEffect(() => {
    const savedUser = localStorage.getItem('sm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    const savedCart = localStorage.getItem('sm_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    
    const savedWishlist = localStorage.getItem('sm_wishlist');
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  }, []);

  // Sync Data to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('sm_cart', JSON.stringify(cartItems));
      localStorage.setItem('sm_wishlist', JSON.stringify(wishlist));
    }
  }, [cartItems, wishlist, user]);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleSignOut = async () => {
    localStorage.removeItem('sm_user');
    setUser(null);
    setCartItems([]);
    setWishlist([]);
  };

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 900));
      const mockUser = { email: 'patron@sm.com.ph', uid: 'google_123' };
      localStorage.setItem('sm_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setIsAuthModalOpen(false);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setIsAuthLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 900));
      const mockUser = { email, uid: 'local_' + Date.now() };
      localStorage.setItem('sm_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setIsAuthModalOpen(false);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // --- Data Fetching (Using Local Express API) ---

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [pRes, cRes, bRes, sRes] = await Promise.all([
        fetch('/api/products?isNew=true'),
        fetch('/api/categories'),
        fetch('/api/brands'),
        fetch('/api/stores')
      ]);

      if (!pRes.ok || !cRes.ok || !bRes.ok || !sRes.ok) throw new Error('API request failed');

      const [pData, cData, bData, sData] = await Promise.all([
        pRes.json(),
        cRes.json(),
        bRes.json(),
        sRes.json()
      ]);

      setProducts(pData);
      setCategories(cData);
      setBrands(bData);
      setStores(sData);
    } catch (err) {
      console.error('Initial fetch failed:', err);
      setError('Connection to backend failed. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFilteredProducts = useCallback(async (category: string) => {
    if (category === 'All') {
      return fetchData();
    }
    
    try {
      setLoading(true);
      const res = await fetch(`/api/products?category=${category}`);
      if (!res.ok) throw new Error('Filter fetch failed');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Filter fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (activeTab === 'All') {
      fetchData();
    } else {
      fetchFilteredProducts(activeTab);
    }
  }, [activeTab, fetchFilteredProducts, fetchData]);

  // --- Countdown Logic ---

  const saleEndDate = new Date('2026-06-30T23:59:59');
  const calcTimeLeft = () => {
    const diff = saleEndDate.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft());

  const filteredProductsBySearch = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
  }, [cartItems]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to bag`);
    setIsCartOpen(true);
  };

  const toggleWishlist = (productId: number) => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('Sign in to save items to your wishlist');
      return;
    }
    setWishlist(prev => {
      const isIncluded = prev.includes(productId);
      if (isIncluded) {
        showToast('Removed from wishlist');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Saved to wishlist');
        return [...prev, productId];
      }
    });
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cartItems]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;
    let raf: number;
    const tick = (time: number) => { lenis.raf(time); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroTextY = useTransform(heroProgress, [0, 1], ['0%', '-25%']);
  const heroOpacity = useTransform(heroProgress, [0, 0.65], [1, 0]);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen selection:bg-sm-accent selection:text-sm-bg selection:bg-opacity-90">
      {isPreloading && <Preloader onComplete={() => setIsPreloading(false)} />}
      <ScrollProgress />
      {/* 1. NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-700 ${
        isScrolled ? 'bg-sm-bg/90 backdrop-blur-xl border-b border-sm-border py-4' : 'bg-transparent py-10'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <button onClick={() => setIsMenuOpen(true)} className={`lg:hidden p-1 transition-colors duration-500 ${isScrolled ? 'text-sm-ink' : 'text-white'}`}>
              <Menu size={24} strokeWidth={1.5} />
            </button>

            {/* SM Logo */}
            <div className="flex flex-col items-center leading-none cursor-pointer select-none group">
              <span className={`font-sans font-black text-4xl md:text-5xl tracking-[-0.05em] transition-colors duration-500 group-hover:text-sm-accent ${isScrolled ? 'text-sm-ink' : 'text-white'}`}>
                SM
              </span>
              <span className={`text-[8px] uppercase tracking-[0.35em] font-bold transition-colors duration-500 ${isScrolled ? 'text-sm-ink/40' : 'text-white/50'}`}>
                Department Store
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-10">
              {['Women', 'Men', 'Kids', 'Toys', 'Home', 'Beauty', 'Sale'].map((link) => (
                <button
                  key={link}
                  onClick={() => {
                    setActiveTab(link === 'Sale' ? 'All' : link);
                    scrollToProducts();
                  }}
                  className={`text-[11px] uppercase tracking-[0.25rem] transition-all duration-300 font-bold relative group ${
                    link === 'Sale'
                      ? 'text-rose-400'
                      : isScrolled
                        ? 'text-sm-ink/60 hover:text-sm-ink'
                        : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link}
                  <span className={`absolute -bottom-2 left-0 h-px bg-sm-accent transition-all duration-500 ${activeTab === link ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 md:gap-10">
            <div className={`hidden md:flex items-center rounded-full px-4 py-2 group transition-all ${isScrolled ? 'bg-sm-ink/5 focus-within:bg-sm-ink/10' : 'bg-white/10 focus-within:bg-white/20'}`}>
              <Search size={16} strokeWidth={1.5} className={isScrolled ? 'text-sm-ink/40' : 'text-white/50'} />
              <input
                type="text"
                placeholder="Search..."
                className={`bg-transparent border-none outline-none text-[11px] uppercase tracking-widest pl-3 w-32 transition-colors ${isScrolled ? 'placeholder:text-sm-ink/20 text-sm-ink' : 'placeholder:text-white/30 text-white'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
              <div className="relative group/user">
                <div
                  onClick={() => user ? null : setIsAuthModalOpen(true)}
                  className="group flex items-center gap-3 cursor-pointer"
                >
                  <div className="relative">
                    <User size={20} strokeWidth={1.2} className={`group-hover:text-sm-accent group-hover:scale-110 transition-all duration-300 ${isScrolled ? 'text-sm-ink' : 'text-white'}`} />
                    {user && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sm-accent rounded-full border-2 border-sm-bg shadow-sm" />}
                  </div>
                  {user && <span className={`hidden lg:block text-[9px] uppercase tracking-[0.2em] font-black ${isScrolled ? 'text-sm-ink/40' : 'text-white/50'}`}>{user.email.split('@')[0]}</span>}
                </div>

                {user && (
                  <div className="absolute top-full right-0 mt-4 w-64 bg-sm-bg border border-sm-border shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/user:opacity-100 group-hover/user:translate-y-0 group-hover/user:pointer-events-auto transition-all duration-500 z-[100]">
                    <div className="p-6 border-b border-sm-border flex items-center gap-4">
                      <div className="w-10 h-10 bg-sm-hover flex items-center justify-center font-serif text-xl italic">{user.email[0].toUpperCase()}</div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-black text-sm-ink truncate max-w-[140px]">{user.email}</p>
                        <p className="text-[9px] uppercase tracking-widest text-sm-ink/30">Regular Patron</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-1">
                      <button className="w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-sm-ink/60 hover:text-sm-ink hover:bg-sm-hover transition-all flex items-center gap-3">
                        <User size={14} strokeWidth={1.5} /> My Profile
                      </button>
                      <button className="w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-sm-ink/60 hover:text-sm-ink hover:bg-sm-hover transition-all flex items-center gap-3">
                        <ShoppingBag size={14} strokeWidth={1.5} /> Orders
                      </button>
                      <button
                        className="w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-sm-ink/60 hover:text-sm-ink hover:bg-sm-hover transition-all flex items-center gap-3"
                      >
                        <Heart size={14} strokeWidth={1.5} /> Saved Items ({wishlist.length})
                      </button>
                    </div>
                    <div className="p-4 bg-sm-hover">
                      <button 
                        onClick={handleSignOut}
                        className="w-full py-3 bg-sm-ink text-sm-bg text-[10px] uppercase tracking-widest font-black hover:bg-rose-900 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

            <div
              onClick={() => setIsCartOpen(true)}
              className="relative cursor-pointer group"
            >
              <ShoppingBag size={20} strokeWidth={1.2} className={`group-hover:text-sm-accent group-hover:scale-110 transition-all duration-300 ${isScrolled ? 'text-sm-ink' : 'text-white'}`} />
              <span className={`absolute -top-1.5 -right-1.5 text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black ${isScrolled ? 'bg-sm-ink text-sm-bg' : 'bg-white text-sm-ink'}`}>
                {cartCount}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-[55] bg-sm-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 100 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md z-[60] bg-sm-bg shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-sm-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ShoppingCart size={20} strokeWidth={1.5} />
                  <h2 className="text-[11px] uppercase tracking-[0.4em] font-black">Your Shopping Bag</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="hover:rotate-90 transition-transform duration-500">
                  <X size={24} strokeWidth={1} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-8 bg-sm-hover rounded-full">
                      <ShoppingBag size={48} strokeWidth={0.5} className="text-sm-ink/20" />
                    </div>
                    <div className="space-y-2">
                       <p className="font-serif text-2xl italic text-sm-ink/40">Your bag is empty.</p>
                       <p className="text-[10px] uppercase tracking-[0.2em] text-sm-ink/20 font-bold">Discover our new arrivals</p>
                    </div>
                    <button 
                      onClick={() => {setIsCartOpen(false); setActiveTab('All');}}
                      className="px-8 py-4 bg-sm-ink text-sm-bg text-[10px] uppercase tracking-[0.3em] font-black hover:bg-sm-accent transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={item.id} 
                      className="flex gap-6 group"
                    >
                      <div className="w-24 aspect-[3/4] bg-sm-hover overflow-hidden border border-sm-border flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" style={{ backgroundColor: item.imagePlaceholderColor }} />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-sm-ink/30 font-black">{item.brand}</p>
                            <button onClick={() => removeFromCart(item.id)} className="text-sm-ink/20 hover:text-rose-600">
                              <X size={14} />
                            </button>
                          </div>
                          <h4 className="font-serif text-lg leading-tight group-hover:text-sm-accent transition-colors">{item.name}</h4>
                          <p className="text-xs font-bold tracking-tight">₱{item.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center border border-sm-border bg-white shadow-sm">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 hover:bg-sm-hover transition-colors font-mono text-xs">-</button>
                            <span className="px-4 py-1 text-[10px] font-black border-x border-sm-border min-w-[40px] text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 hover:bg-sm-hover transition-colors font-mono text-xs">+</button>
                          </div>
                          <div className="w-1.5 h-1.5 bg-sm-accent/20 rounded-full" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-8 bg-sm-hover space-y-6">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-sm-ink/30">Total Estimate</p>
                    <p className="text-3xl font-serif">₱{cartTotal.toLocaleString()}</p>
                  </div>
                  <button className="w-full py-6 bg-sm-ink text-sm-bg text-[11px] uppercase tracking-[0.4em] font-black flex items-center justify-center gap-3 group hover:bg-sm-accent transition-all duration-500 overflow-hidden relative">
                    <span className="relative z-10 flex items-center gap-3">
                      Secure Checkout <ArrowRight size={16} className="transform group-hover:translate-x-2 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-sm-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </button>
                  <p className="text-center text-[9px] uppercase tracking-[0.2em] font-bold text-sm-ink/20">Complimentary Philippine shipping on all orders</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* AUTH MODAL */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAuthModalOpen(false); setAuthError(null); }}
              className="fixed inset-0 z-[70] bg-sm-ink/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[75] bg-sm-bg p-12 shadow-2xl border border-sm-border"
            >
              <button
                onClick={() => { setIsAuthModalOpen(false); setAuthError(null); }}
                className="absolute top-8 right-8 text-sm-ink/20 hover:text-sm-ink transition-colors"
              >
                <X size={24} />
              </button>

              <div className="space-y-10">
                <div className="text-center space-y-4">
                  <div className="flex flex-col items-center leading-none">
                    <span className="font-serif text-4xl tracking-tighter">SM</span>
                    <span className="text-[8px] uppercase tracking-[0.3em] font-sans font-bold text-sm-ink/40">Patron Account</span>
                  </div>
                  <h2 className="font-serif text-3xl italic">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                </div>

                <form className="space-y-6" onSubmit={handleEmailAuth}>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-sm-ink/30 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="PATRON@ADDRESS.COM"
                      className="w-full bg-sm-hover border border-sm-border p-4 outline-none focus:border-sm-accent transition-colors text-xs tracking-widest font-bold uppercase placeholder:text-sm-ink/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-sm-ink/30 ml-1">Password</label>
                    <input 
                      type="password" 
                      name="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-sm-hover border border-sm-border p-4 outline-none focus:border-sm-accent transition-colors text-xs tracking-widest font-bold uppercase placeholder:text-sm-ink/10"
                    />
                  </div>

                  {authError && <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider text-center">{authError}</p>}

                  <button 
                    type="submit" 
                    disabled={isAuthLoading}
                    className="w-full py-5 bg-sm-ink text-sm-bg text-[10px] uppercase tracking-[0.4em] font-black group relative overflow-hidden active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <span className="relative z-10">
                      {isAuthLoading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-1.5 h-1.5 bg-sm-bg rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1.5 h-1.5 bg-sm-bg rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1.5 h-1.5 bg-sm-bg rounded-full animate-bounce" />
                        </div>
                      ) : (
                        authMode === 'login' ? 'Sign In' : 'Create Account'
                      )}
                    </span>
                    {!isAuthLoading && <div className="absolute inset-0 bg-sm-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />}
                  </button>

                  <div className="relative py-4 flex items-center gap-4">
                    <div className="flex-1 h-px bg-sm-border" />
                    <span className="text-[9px] uppercase tracking-widest font-bold text-sm-ink/20">or</span>
                    <div className="flex-1 h-px bg-sm-border" />
                  </div>

                  <button
                    type="button"
                    disabled={isAuthLoading}
                    onClick={handleGoogleSignIn}
                    className="w-full py-5 border border-sm-border text-sm-ink text-[10px] uppercase tracking-[0.4em] font-black group relative overflow-hidden active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>{isAuthLoading ? 'Please Wait' : 'Continue with Google'}</span>
                  </button>

                </form>

                <div className="text-center space-y-4 pt-4">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-sm-ink/30 italic">
                    {authMode === 'login' ? "Don't have an account yet?" : "Already a regular patron?"}
                  </p>
                  <button
                    onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(null); }}
                    className="text-[10px] uppercase tracking-[0.3em] font-black text-sm-accent border-b border-sm-accent/20 pb-1 hover:border-sm-accent transition-all"
                  >
                    {authMode === 'login' ? 'Request Enrollment' : 'Sign In Instead'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[55] bg-sm-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 100 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm z-[60] bg-sm-bg p-12 flex flex-col shadow-2xl"
            >
              <button onClick={() => setIsMenuOpen(false)} className="self-end p-2 mb-16 hover:rotate-90 transition-transform duration-500">
                <X size={32} strokeWidth={1} />
              </button>
              <div className="flex flex-col gap-10">
                {['Women', 'Men', 'Kids', 'Toys', 'Home', 'Beauty', 'Sale'].map((link, i) => (
                  <motion.a 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    key={link} 
                    href="#arrivals"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveTab(link === 'Sale' ? 'All' : link);
                      scrollToProducts();
                    }}
                    className="font-serif text-5xl hover:text-sm-accent transition-all duration-500 hover:translate-x-4"
                  >
                    {link}
                  </motion.a>
                ))}
              </div>
              <div className="mt-auto pt-12 border-t border-sm-border space-y-6">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-sm-ink/30">Support</p>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-widest text-sm-ink/60">
                  <a href="#">Contact</a>
                  <a href="#">Stores</a>
                  <a href="#">Shipping</a>
                  <a href="#">Privacy</a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main>
        {/* 2. HERO SECTION — Full-screen cinematic */}
        <section ref={heroRef} className="relative h-screen overflow-hidden">

          {/* Full-bleed local video background */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/video/hero.mp4" type="video/mp4" />
          </video>

          {/* Layered gradients for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

          {/* Top-right tag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 1 }}
            className="absolute top-10 right-10 md:top-20 md:right-16 z-10 flex items-center gap-3"
          >
            <div className="w-6 h-px bg-sm-accent/60" />
            <span className="text-[9px] uppercase tracking-[0.5em] text-white/40 font-black">Collection 2026</span>
          </motion.div>

          {/* Main text — bottom left */}
          <motion.div
            style={{ y: heroTextY, opacity: heroOpacity }}
            className="absolute inset-x-0 bottom-0 z-10 p-10 md:p-16 lg:p-24 space-y-8"
          >
            {/* Headline */}
            <div className="overflow-hidden">
              {['The New', 'Standard.'].map((line, i) => (
                <div key={line} className="overflow-hidden">
                  <motion.h1
                    initial={{ y: '105%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1.1, delay: 0.75 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="block font-serif text-[14vw] md:text-[9vw] leading-[0.88] tracking-tight text-white"
                  >
                    {line}
                  </motion.h1>
                </div>
              ))}
            </div>

            {/* Divider + description + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col md:flex-row md:items-end gap-8 md:gap-16 pt-2"
            >
              <p className="text-white/40 text-[11px] uppercase tracking-[0.3em] font-bold max-w-xs leading-loose">
                High-end retail craftsmanship brought to the heart of Manila.
              </p>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => { setActiveTab('Women'); scrollToProducts(); }}
                  className="group relative px-10 py-5 bg-white text-black uppercase tracking-[0.25em] text-[10px] font-black overflow-hidden"
                >
                  <span className="relative z-10 group-hover:text-white transition-colors duration-500">Shop Now</span>
                  <div className="absolute inset-0 bg-sm-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                </button>
                <button
                  onClick={() => { setActiveTab('All'); scrollToProducts(); }}
                  className="flex items-center gap-3 text-white/50 text-[10px] uppercase tracking-[0.35em] font-black hover:text-white transition-colors duration-300"
                >
                  Explore All <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll indicator — right side vertical */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1.5 }}
            className="absolute bottom-12 right-10 md:right-16 flex flex-col items-center gap-4 pointer-events-none z-10"
          >
            <motion.div
              animate={{ scaleY: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-px h-16 bg-gradient-to-b from-white/40 to-transparent origin-top"
            />
            <span className="text-[8px] uppercase tracking-[0.4em] text-white/20 font-black" style={{ writingMode: 'vertical-rl' }}>Scroll</span>
          </motion.div>
        </section>

        {/* 3. FEATURED CATEGORIES — Editorial Image Grid */}
        <section className="bg-sm-ink">
          {/* Section label */}
          <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-10 flex items-end justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-px bg-sm-accent" />
              <span className="text-sm-accent text-[11px] uppercase tracking-[0.4em] font-black">Browse The House</span>
            </div>
            <span className="text-white/20 text-[10px] uppercase tracking-[0.4em] font-black hidden md:block">Shop by Category</span>
          </div>

          {/* Top row — two tall featured cards */}
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ height: '70vh' }}>
            {categories.slice(0, 2).map((category, i) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                onClick={() => { setActiveTab(category.name); scrollToProducts(); }}
                className="relative overflow-hidden cursor-pointer group border-r border-white/5 last:border-r-0"
              >
                <img
                  src={CATEGORY_IMAGES[category.name]}
                  alt={category.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 space-y-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] font-black">{category.description}</p>
                  <div className="flex items-end justify-between">
                    <h3 className="font-serif text-5xl md:text-7xl text-white tracking-tight leading-none group-hover:text-sm-accent transition-colors duration-500">
                      {category.name}
                    </h3>
                    <div className="mb-1 p-3 border border-white/20 rounded-full group-hover:bg-sm-accent group-hover:border-sm-accent transition-all duration-300">
                      <ArrowRight size={18} strokeWidth={1.5} className="text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom row — four smaller cards */}
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ height: '42vh' }}>
            {categories.slice(2).map((category, i) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                onClick={() => { setActiveTab(category.name); scrollToProducts(); }}
                className="relative overflow-hidden cursor-pointer group border-t border-white/5 border-r border-white/5 last:border-r-0"
              >
                <img
                  src={CATEGORY_IMAGES[category.name]}
                  alt={category.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <h3 className="font-serif text-3xl md:text-4xl text-white tracking-tight leading-none group-hover:text-sm-accent transition-colors duration-500">
                    {category.name}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 4. PROMOTIONAL BANNER */}
        <section className="bg-sm-ink py-24 px-6 md:px-12 relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-full opacity-[0.02] pointer-events-none flex items-center justify-center">
            <span className="font-serif text-[40rem] select-none">SM</span>
          </div>
          
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
            <div className="space-y-6 text-center lg:text-left max-w-xl">
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <div className="w-8 h-[1px] bg-sm-accent" />
                <span className="text-sm-accent text-[11px] uppercase tracking-[0.4em] font-black">Limited Event</span>
              </div>
              <TextReveal>
                <h2 className="font-serif text-5xl md:text-7xl text-sm-bg leading-none tracking-tight">The Mid-Year<br/>Statement.</h2>
              </TextReveal>
              <p className="text-sm-bg/40 uppercase tracking-[0.25em] text-[11px] font-bold">Uncompromising value. Up to 70% off luxury ready-to-wear.</p>
            </div>
            
            <div className="flex gap-6 md:gap-12">
              {[
                { label: 'Days', val: timeLeft.days },
                { label: 'Hours', val: timeLeft.hours },
                { label: 'Mins', val: timeLeft.minutes },
                { label: 'Secs', val: timeLeft.seconds }
              ].map(unit => (
                <div key={unit.label} className="flex flex-col items-center bg-white/5 border border-white/10 px-6 py-8 backdrop-blur-md rounded-sm min-w-[100px]">
                  <span className="font-serif text-4xl md:text-6xl text-sm-bg mb-2">{unit.val.toString().padStart(2, '0')}</span>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-sm-bg/30 font-black">{unit.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setActiveTab('All'); scrollToProducts(); }}
              className="group relative px-12 py-6 bg-sm-accent text-sm-bg uppercase tracking-[0.3em] text-[11px] font-black overflow-hidden"
            >
              <span className="relative z-10">Discover The Sale</span>
              <div className="absolute inset-0 bg-sm-ink translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            </button>
          </div>
        </section>

        {/* 5. NEW ARRIVALS */}
        <section id="arrivals" ref={productsRef} className="py-32 md:py-48 px-6 md:px-12 max-w-7xl mx-auto space-y-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-sm-border pb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-[1px] bg-sm-accent" />
                <span className="text-sm-accent text-[11px] uppercase tracking-[0.4em] font-black">Seasonal Edit</span>
              </div>
              <TextReveal>
                <h2 className="font-serif text-6xl md:text-8xl text-sm-ink tracking-tight">
                  {activeTab === 'All' ? 'The New Standard.' : `${activeTab} Collection.`}
                </h2>
              </TextReveal>
            </div>
            
            <div className="flex flex-wrap gap-10">
              {['All', 'Women', 'Men', 'Kids', 'Toys', 'Home', 'Beauty'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-1 text-[11px] uppercase tracking-[0.3em] font-bold transition-all relative ${
                    activeTab === tab ? 'text-sm-ink' : 'text-sm-ink/30 hover:text-sm-ink'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="tab-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sm-accent" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
              <AnimatePresence mode="popLayout">
                {filteredProductsBySearch.map((product, i) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.6,
                      delay: (i % 4) * 0.1,
                      layout: { duration: 0.4, ease: "easeOut" }
                    }}
                    key={product.id} 
                    className="group"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-sm-hover mb-8 border border-sm-border transition-all duration-700 hover:border-sm-accent/30">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out group-hover:scale-110 group-hover:rotate-1"
                        />
                      ) : (
                        <div 
                          className="absolute inset-0 transition-all duration-1000 ease-out group-hover:scale-110 group-hover:rotate-1"
                          style={{ backgroundColor: product.imagePlaceholderColor }}
                        />
                      )}
                      
                      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                        {product.isOnSale && (
                          <span className="bg-sm-ink text-sm-bg px-3 py-1.5 text-[9px] uppercase font-black tracking-[0.2em] backdrop-blur-md">Sale</span>
                        )}
                        {product.isNew && (
                          <span className="bg-sm-accent text-sm-bg px-3 py-1.5 text-[9px] uppercase font-black tracking-[0.2em] backdrop-blur-md">New</span>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-sm-ink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="absolute bottom-6 left-6 right-6 py-4 bg-sm-bg text-sm-ink text-[10px] uppercase tracking-[0.2em] font-black opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 flex items-center justify-center gap-3 active:scale-95 shadow-xl"
                      >
                        <ShoppingBag size={14} strokeWidth={2} /> Add to Bag
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        className={`absolute top-6 right-6 p-3 rounded-full transition-all duration-500 -translate-y-4 group-hover:translate-y-0 ${
                          wishlist.includes(product.id) ? 'bg-sm-accent text-sm-bg opacity-100' : 'bg-white/80 backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-sm-accent hover:text-sm-bg'
                        }`}
                      >
                        <Heart size={16} strokeWidth={1.5} fill={wishlist.includes(product.id) ? "currentColor" : "none"} />
                      </button>

                    </div>

                  <div className="space-y-4 px-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-sm-ink/30 font-black">{product.brand}</p>
                        <h3 className="font-serif text-2xl text-sm-ink group-hover:text-sm-accent transition-colors duration-500">{product.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 border-t border-sm-border/40 pt-4">
                      <span className="text-sm font-bold tracking-tight">₱{product.price.toLocaleString()}</span>
                      {product.originalPrice && (
                        <span className="text-[11px] text-sm-ink/30 line-through font-medium italic">₱{product.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          )}

          {filteredProductsBySearch.length === 0 && !loading && (
            <div className="py-40 text-center space-y-10 border border-sm-border bg-sm-hover/20">
              <div className="space-y-4">
                <h3 className="text-3xl md:text-5xl font-serif italic text-sm-ink/40 leading-tight">No garments match<br/>your criteria.</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-sm-ink/20">Try adjusting your search or category</p>
              </div>
              <button 
                onClick={() => {setSearchQuery(''); setActiveTab('All');}}
                className="group relative px-12 py-5 bg-sm-ink text-sm-bg uppercase tracking-[0.4em] text-[10px] font-black overflow-hidden"
              >
                <span className="relative z-10">Clear Selections</span>
                <div className="absolute inset-0 bg-sm-accent -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
              </button>
            </div>
          )}
        </section>

        {/* 6. BRANDS (Marquee Refinement) */}
        <section className="py-24 bg-sm-bg border-y border-sm-border overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...brands, ...brands, ...brands].map((brand, i) => (
              <div key={i} className="flex items-center gap-16 px-16 group cursor-default">
                <span className="font-serif text-4xl md:text-7xl text-sm-ink/10 group-hover:text-sm-ink transition-all duration-700 ease-out hover:scale-110 tracking-tighter">
                  {brand.name}
                </span>
                <div className="w-3 h-3 rounded-full bg-sm-accent opacity-20" />
              </div>
            ))}
          </div>
        </section>

        {/* 6.5 SM LEGACY — Heritage & Story */}
        <section className="bg-sm-ink text-sm-bg overflow-hidden">
          {/* Ghost background text */}
          <div className="absolute pointer-events-none select-none opacity-[0.02] font-black text-[30vw] text-white leading-none overflow-hidden" style={{ right: '-5vw' }}>SM</div>

          <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 relative z-10">

            {/* Header */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-end pb-20 border-b border-white/10 mb-20">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-px bg-sm-accent" />
                  <span className="text-sm-accent text-[11px] uppercase tracking-[0.4em] font-black">Philippine Institution</span>
                </div>
                <TextReveal>
                  <h2 className="font-serif text-5xl md:text-7xl leading-none tracking-tight">A Legacy Built<br/>on Filipino Trust.</h2>
                </TextReveal>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-white/40 text-[13px] leading-relaxed tracking-wider"
              >
                In 1958, Henry Sy Sr. opened a modest shoe store on Carriedo Street in Quiapo, Manila. What started as a single shopfront became the Philippines' most trusted retail institution — SM Department Store. Today, SM stands as a symbol of Filipino aspiration, quality, and community.
              </motion.p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/10">
              {[
                { value: 70, suffix: '+', label: 'Flagship Stores', sub: 'Across Luzon, Visayas & Mindanao' },
                { value: 1958, suffix: '', label: 'Founded in Manila', sub: 'By Henry Sy Sr. on Carriedo St.' },
                { value: 500, suffix: '+', label: 'Premium Brands', sub: 'Local and international labels' },
                { value: 10, suffix: 'M+', label: 'SM Advantage Members', sub: 'The Philippines\' largest loyalty program' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="px-8 md:px-12 py-14 group hover:bg-white/5 transition-colors duration-500 cursor-default"
                >
                  <div className="font-serif text-5xl md:text-6xl text-sm-bg mb-3 tracking-tight">
                    <CounterAnimation value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.4em] font-black text-sm-bg/50 mb-2">{stat.label}</p>
                  <div className="h-px bg-white/10 mb-3 w-0 group-hover:w-full transition-all duration-700" />
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold leading-relaxed">{stat.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Timeline milestones */}
            <div className="mt-20 pt-16 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { year: '1958', event: 'Henry Sy Sr. opens the first ShoeMart on Carriedo St., Quiapo, Manila' },
                { year: '1985', event: 'SM North EDSA opens — the very first SM Shopping Mall in the Philippines' },
                { year: '2006', event: 'SM Mall of Asia opens in Pasay, one of the largest malls in Asia' },
                { year: 'Today', event: '70+ department stores spanning every major city across the archipelago' },
              ].map((milestone, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                  className="space-y-4"
                >
                  <span className="font-serif text-3xl text-sm-accent">{milestone.year}</span>
                  <div className="w-full h-px bg-white/10" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold leading-loose">{milestone.event}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 6.6 SM EXPERIENCE — Department Showcase */}
        <section className="bg-sm-bg">
          <div className="max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-12">
            <div className="flex items-end justify-between mb-16">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-px bg-sm-accent" />
                  <span className="text-sm-accent text-[11px] uppercase tracking-[0.4em] font-black">Inside SM</span>
                </div>
                <TextReveal>
                  <h2 className="font-serif text-5xl md:text-6xl text-sm-ink tracking-tight">The SM Experience.</h2>
                </TextReveal>
              </div>
              <p className="hidden md:block text-[10px] uppercase tracking-[0.3em] font-black text-sm-ink/20 max-w-xs text-right leading-loose">Every floor tells a story of style, comfort, and Filipino living.</p>
            </div>
          </div>

          {/* Editorial image grid */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: tall feature card */}
            <div className="relative overflow-hidden group cursor-pointer" style={{ height: '75vh' }}>
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=80"
                alt="SM Fashion"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-10 md:p-14 space-y-3">
                <span className="text-[9px] uppercase tracking-[0.5em] font-black text-white/40">01 — Fashion</span>
                <h3 className="font-serif text-4xl md:text-5xl text-white tracking-tight">The Fashion Floor</h3>
                <p className="text-white/50 text-[11px] uppercase tracking-[0.25em] font-bold max-w-xs leading-loose">
                  500+ local and international brands curated for every style and occasion.
                </p>
              </div>
            </div>

            {/* Right: 3 stacked smaller */}
            <div className="grid grid-rows-3" style={{ height: '75vh' }}>
              {[
                {
                  label: '02 — Beauty & Wellness',
                  title: 'Beauty Counter',
                  desc: 'Premium skincare, cosmetics, and fragrance from global houses.',
                  img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&q=80',
                },
                {
                  label: '03 — Home & Living',
                  title: 'Home & Living',
                  desc: 'Furniture, décor, and appliances that elevate everyday life.',
                  img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80',
                },
                {
                  label: '04 — Toys & Hobbies',
                  title: 'Toys & Hobbies',
                  desc: 'The widest selection of toys, games, and collectibles in the Philippines.',
                  img: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=900&q=80',
                },
              ].map((item, i) => (
                <div key={i} className="relative overflow-hidden group cursor-pointer border-t border-white/5">
                  <img
                    src={item.img}
                    alt={item.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-500" />
                  <div className="absolute inset-0 flex items-end p-6 md:p-8">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-[0.5em] font-black text-white/30">{item.label}</span>
                      <h4 className="font-serif text-2xl text-white tracking-tight group-hover:text-sm-accent transition-colors duration-300">{item.title}</h4>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold leading-relaxed hidden md:block">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. STORE LOCATOR (Split Grid) */}
        <section id="stores" className="py-32 md:py-48 px-6 md:px-12 max-w-7xl mx-auto space-y-32">
          <div className="flex flex-col lg:flex-row gap-24 items-start">
            <div className="lg:w-1/3 xl:w-1/4 space-y-10 lg:sticky lg:top-40">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-[1px] bg-sm-accent" />
                  <span className="text-sm-accent text-[11px] uppercase tracking-[0.4em] font-black">Philippine Heritage</span>
                </div>
                <TextReveal>
                  <h2 className="font-serif text-6xl text-sm-ink leading-[0.9] tracking-tight">The Houses of SM.</h2>
                </TextReveal>
              </div>
              <p className="text-sm-ink/50 text-[13px] leading-relaxed font-medium uppercase tracking-wider">
                Discover curated spaces that blend Philippine craftsmanship with international precision. Each flagship house is a testament to the future of retail.
              </p>
              <button className="flex items-center gap-4 text-[11px] border-b border-sm-ink/20 pb-2 uppercase tracking-[0.3em] font-black hover:border-sm-accent transition-all group">
                Global Store Directory
                <ArrowRight size={16} className="transform group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
            
            <div className="lg:w-2/3 xl:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-px bg-sm-border border border-sm-border">
              {stores.map(store => (
                <div key={store.id} className="bg-white p-12 space-y-10 hover:bg-sm-bg transition-all duration-500 group">
                  <div className="flex items-start justify-between">
                    <h3 className="font-serif text-4xl text-sm-ink leading-tight">{store.branchName}</h3>
                    <div className="p-3 bg-sm-ink/5 rounded-full group-hover:bg-sm-accent group-hover:text-sm-bg transition-colors">
                      <MapPin size={20} strokeWidth={1} />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <p className="text-[10px] uppercase tracking-[0.3em] text-sm-ink/30 font-black">Location</p>
                       <p className="text-sm font-medium leading-relaxed">{store.address}</p>
                    </div>
                    <div className="space-y-2 text-sm-ink/50">
                       <p className="text-[10px] uppercase tracking-[0.3em] text-sm-ink/20 font-black">Trading Hours</p>
                       <div className="flex items-center gap-3 font-medium">
                        <Clock size={14} strokeWidth={1.5} />
                        <span className="text-xs">{store.openingHours}</span>
                       </div>
                    </div>
                  </div>
                  
                  <a 
                    href={store.mapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-[11px] uppercase tracking-[0.3em] font-black border-t border-sm-border pt-8 group-hover:text-sm-accent transition-colors"
                  >
                    View On Maps
                    <ChevronRight size={16} className="transform transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              ))}
              <div className="bg-sm-ink p-12 flex flex-col justify-between group cursor-pointer overflow-hidden relative">
                <div className="absolute inset-0 bg-sm-accent translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-in-out" />
                <div className="relative z-10 space-y-6">
                  <h3 className="font-serif text-4xl text-sm-bg group-hover:text-sm-bg transition-colors">More Locations.</h3>
                  <p className="text-sm-bg/40 text-[11px] uppercase tracking-[0.2em] font-bold group-hover:text-sm-bg/60">Exploring the archipelago with 70 flagship stores.</p>
                </div>
                <div className="relative z-10 flex justify-end">
                   <div className="p-6 border border-sm-bg/20 rounded-full group-hover:border-sm-bg/50 transition-colors">
                      <ArrowRight size={32} strokeWidth={1} className="text-sm-bg" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. SM ADVANTAGE CARD */}
        <section className="bg-sm-ink text-sm-bg overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

          {/* Background card visual */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[300px] opacity-[0.04] pointer-events-none hidden lg:block">
            <div className="w-full h-full border-2 border-white rounded-2xl" />
          </div>

          <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 relative z-10">

            {/* Header */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-end border-b border-white/10 pb-20 mb-20">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-px bg-sm-accent" />
                  <span className="text-sm-accent text-[11px] uppercase tracking-[0.4em] font-black">Loyalty Program</span>
                </div>
                <TextReveal>
                  <h2 className="font-serif text-5xl md:text-7xl leading-none tracking-tight">SM Advantage Card</h2>
                </TextReveal>
              </div>
              <div className="space-y-6">
                <p className="text-white/40 text-[13px] leading-relaxed tracking-wider">
                  The SM Advantage Card is the Philippines' largest loyalty program with over 10 million members. Earn points on every purchase across SM Department Store, SM Supermarket, SM Appliances, and more — then redeem them for exclusive rewards.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
                    className="group relative px-10 py-5 bg-sm-accent text-sm-bg uppercase tracking-[0.25em] text-[10px] font-black overflow-hidden"
                  >
                    <span className="relative z-10">Apply Now — Free</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </button>
                  <button className="px-10 py-5 border border-white/20 text-white/60 uppercase tracking-[0.25em] text-[10px] font-black hover:border-white/50 hover:text-white transition-all">
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            {/* Benefits grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
              {[
                {
                  icon: <CreditCard size={28} strokeWidth={1} />,
                  title: 'Earn Points',
                  desc: 'Get 1 point for every ₱200 spent across all SM stores and partner establishments.',
                },
                {
                  icon: <Gift size={28} strokeWidth={1} />,
                  title: 'Redeem Rewards',
                  desc: 'Convert points to SM Gift Certificates, shopping credits, or exclusive merchandise.',
                },
                {
                  icon: <Star size={28} strokeWidth={1} />,
                  title: 'Member Exclusives',
                  desc: 'Early access to sale events, birthday treats, and special member-only promotions.',
                },
                {
                  icon: <Heart size={28} strokeWidth={1} />,
                  title: 'Use Everywhere',
                  desc: 'Valid at SM Department Store, SM Supermarket, SM Appliances, Toy Kingdom & more.',
                },
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="bg-sm-ink p-10 flex flex-col gap-10 hover:bg-white/5 transition-colors duration-300 group"
                >
                  <div className="text-sm-accent">{benefit.icon}</div>
                  <div className="space-y-3">
                    <h4 className="font-serif text-2xl text-white tracking-tight group-hover:text-sm-accent transition-colors duration-300">{benefit.title}</h4>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold leading-relaxed">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom note */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mt-12 text-center text-[10px] uppercase tracking-[0.4em] font-black text-white/15"
            >
              10,000,000+ Members · Free to Join · No Annual Fee
            </motion.p>
          </div>
        </section>
      </main>

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed bottom-12 right-12 z-[200] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-sm-ink text-sm-bg px-8 py-5 text-[10px] uppercase tracking-[0.3em] font-black pointer-events-auto border-l-4 border-sm-accent shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-6 min-w-[280px]"
            >
              <div className="flex-1">{toast.message}</div>
              <div className="w-1 h-8 bg-sm-bg/10 rounded-full overflow-hidden shrink-0">
                <motion.div 
                  initial={{ height: "100%" }}
                  animate={{ height: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="w-full bg-sm-accent"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 9. FOOTER (Brutalist Modern) */}
      <footer className="bg-sm-ink text-sm-bg pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12 border-t border-white/5 pt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-24">
            <div className="lg:col-span-5 space-y-12">
              <div className="flex flex-col leading-none">
                <span className="font-serif text-6xl md:text-8xl tracking-tight leading-[0.8]">SM</span>
                <span className="text-[11px] uppercase tracking-[0.4em] font-black text-sm-bg/20 mt-4 leading-relaxed">Defining Philippine Retail Culture<br/>Through Precision Since 1958.</span>
              </div>
              
              <div className="flex items-center gap-10">
                {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="text-sm-bg/20 hover:text-sm-accent transition-all duration-300 hover:-translate-y-1">
                    <Icon size={24} strokeWidth={1.2} />
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-10">
              <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-sm-bg/30">The House</h5>
              <ul className="space-y-6 text-[11px] uppercase tracking-[0.25em] font-bold text-sm-bg/50">
                {['Our Heritage', 'Career Paths', 'Innovation', 'Ethics', 'Editorial'].map(item => (
                  <li key={item}><a href="#" className="hover:text-sm-bg transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-10">
              <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-sm-bg/30">Patron Care</h5>
              <ul className="space-y-6 text-[11px] uppercase tracking-[0.25em] font-bold text-sm-bg/50">
                {['Logistics', 'Order Trace', 'Private Styling', 'Gift Guide', 'Help Center'].map(item => (
                  <li key={item}><a href="#" className="hover:text-sm-bg transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3 space-y-10">
              <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-sm-bg/30">Journal</h5>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-sm-bg/20 leading-loose">Subscribe to the SM Journal for early invitations and seasonal curations.</p>
              <div className="flex flex-col gap-8">
                <input 
                  type="email" 
                  placeholder="DIGITAL@ADDRESS.COM" 
                  className="bg-transparent border-b border-white/10 py-4 focus:border-sm-accent outline-none transition-colors text-[10px] tracking-widest text-sm-bg font-black uppercase placeholder:text-sm-bg/20"
                />
                <button className="text-[10px] uppercase tracking-[0.5em] font-black text-left hover:text-sm-accent group flex items-center gap-3 transition-colors">
                  Join The Circle
                  <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col md:flex-row gap-4 md:gap-12 items-center text-[9px] uppercase tracking-[0.4em] font-black text-sm-bg/20">
              <p>© 2026 SM Department Store. ALL RIGHTS RESERVED.</p>
              <p className="hidden md:block">MANILA · PASAY · QUEZON CITY</p>
            </div>
            <div className="flex gap-10 text-[9px] uppercase tracking-[0.4em] font-black text-sm-bg/20">
              <a href="#" className="hover:text-sm-accent transition-colors">Privacy</a>
              <a href="#" className="hover:text-sm-accent transition-colors">Terms</a>
              <a href="#" className="hover:text-sm-accent transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
