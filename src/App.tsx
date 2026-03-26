import React, { useState, useEffect, ErrorInfo, ReactNode } from 'react';
import { ShoppingBag, Menu, X, Instagram, Facebook, MapPin, Phone, Search, User, LogOut, Shield, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRODUCTS } from './constants';
import { Product, CartItem, Order, Subscription, UserProfile } from './types';
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  getDoc, 
  setDoc,
  getDocFromServer,
  Timestamp
} from 'firebase/firestore';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

const ErrorBoundary = ({ children }: ErrorBoundaryProps) => {
  return <>{children}</>;
};

// --- Components ---

const AdminDashboard = ({ onClose }: { onClose: () => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'subscriptions'>('orders');

  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const subsQuery = query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'));

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubSubs = onSnapshot(subsQuery, (snapshot) => {
      setSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'subscriptions'));

    return () => {
      unsubOrders();
      unsubSubs();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-brand-cream overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-serif italic">Admin Dashboard</h2>
          <button onClick={onClose} className="p-2 luxury-border rounded-full hover:bg-brand-ink hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex space-x-8 mb-8 border-b border-brand-ink/10">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`pb-4 text-xs uppercase tracking-widest font-bold border-b-2 transition-colors ${activeTab === 'orders' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-brand-ink/40'}`}
          >
            Orders ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-4 text-xs uppercase tracking-widest font-bold border-b-2 transition-colors ${activeTab === 'subscriptions' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-brand-ink/40'}`}
          >
            Subscribers ({subscriptions.length})
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 luxury-border">
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-ink/40 mb-1">Order ID: {order.id}</p>
                    <h3 className="text-xl font-serif">{order.customerName}</h3>
                    <p className="text-sm text-brand-ink/60">{order.customerEmail} | {order.customerPhone}</p>
                  </div>
                  <div className="text-right mt-4 md:mt-0">
                    <p className="text-lg font-serif mb-1">{order.total} ETB</p>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="border-t border-brand-ink/5 pt-4">
                  <p className="text-[10px] uppercase tracking-widest text-brand-ink/40 mb-2">Items</p>
                  <ul className="space-y-1">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="text-sm flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{item.price * item.quantity} ETB</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-[10px] text-right text-brand-ink/40 mt-4">
                  Placed on: {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white luxury-border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-brand-cream/50 border-b border-brand-ink/10">
                <tr>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Subscribed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-ink/5">
                {subscriptions.map(sub => (
                  <tr key={sub.id}>
                    <td className="px-6 py-4 text-sm">{sub.email}</td>
                    <td className="px-6 py-4 text-sm text-brand-ink/60">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          // Create default profile for new users
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: firebaseUser.email === 'elbetheldaniel8@gmail.com' ? 'admin' : 'customer',
            displayName: firebaseUser.displayName || ''
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
      }
      setIsAuthReady(true);
    });

    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscriptionStatus('loading');
    try {
      await addDoc(collection(db, 'subscriptions'), {
        email: newsletterEmail,
        createdAt: new Date().toISOString()
      });
      setSubscriptionStatus('success');
      setNewsletterEmail('');
      setTimeout(() => setSubscriptionStatus('idle'), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'subscriptions');
      setSubscriptionStatus('error');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStatus('loading');
    try {
      const order: Order = {
        customerName: checkoutForm.name,
        customerEmail: checkoutForm.email,
        customerPhone: checkoutForm.phone,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: cartTotal,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'orders'), order);
      setCheckoutStatus('success');
      setCart([]);
      setTimeout(() => {
        setIsCheckoutOpen(false);
        setCheckoutStatus('idle');
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      setCheckoutStatus('error');
    }
  };

  const filteredProducts = PRODUCTS.filter(p => 
    (selectedCategory === 'All' || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-brand-cream/80 backdrop-blur-md border-b border-brand-ink/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center md:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>

              <div className="hidden md:flex space-x-8">
                <a href="#collections" className="nav-link">Collections</a>
                <a href="#shop" className="nav-link">Shop</a>
                <a href="#about" className="nav-link">Our Story</a>
              </div>

              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl sm:text-3xl font-serif tracking-tighter uppercase italic">
                  Elu's Perfume
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center luxury-border rounded-full px-3 py-1 bg-white/50">
                  <Search size={14} className="text-brand-ink/40 mr-2" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="bg-transparent border-none focus:ring-0 text-xs w-24 lg:w-40 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {isAuthReady && (
                  <div className="flex items-center space-x-2">
                    {user ? (
                      <div className="flex items-center space-x-4">
                        {userProfile?.role === 'admin' && (
                          <button 
                            onClick={() => setIsAdminOpen(true)}
                            className="p-2 hover:text-brand-gold transition-colors"
                            title="Admin Dashboard"
                          >
                            <Shield size={20} />
                          </button>
                        )}
                        <button 
                          onClick={handleLogout}
                          className="p-2 hover:text-brand-gold transition-colors"
                          title="Logout"
                        >
                          <LogOut size={20} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={handleLogin}
                        className="p-2 hover:text-brand-gold transition-colors"
                        title="Login"
                      >
                        <User size={20} />
                      </button>
                    )}
                  </div>
                )}

                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 hover:text-brand-gold transition-colors"
                >
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-brand-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Admin Dashboard */}
        <AnimatePresence>
          {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-40 bg-brand-cream pt-24 px-6 md:hidden"
            >
              <div className="flex flex-col space-y-8 text-center">
                <a href="#collections" onClick={() => setIsMenuOpen(false)} className="text-2xl font-serif italic">Collections</a>
                <a href="#shop" onClick={() => setIsMenuOpen(false)} className="text-2xl font-serif italic">Shop</a>
                <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-2xl font-serif italic">Our Story</a>
                <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-2xl font-serif italic">Contact</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Sidebar */}
        <AnimatePresence>
          {isCartOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCartOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl p-8 flex flex-col"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-serif italic">Your Bag</h2>
                  <button onClick={() => setIsCartOpen(false)}><X size={24} /></button>
                </div>

                <div className="flex-grow overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-20 text-brand-ink/40">
                      <p className="font-serif italic mb-4">Your bag is empty</p>
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="text-xs uppercase tracking-widest underline"
                      >
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {cart.map(item => (
                        <div key={item.id} className="flex space-x-4 border-b border-brand-ink/5 pb-6">
                          <img src={item.image} alt={item.name} className="w-20 h-24 object-cover" />
                          <div className="flex-grow">
                            <h3 className="font-serif text-lg">{item.name}</h3>
                            <p className="text-xs text-brand-ink/60 mb-2">{item.brand}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{item.quantity} × {item.price} ETB</span>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-[10px] uppercase tracking-widest text-red-500"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="pt-8 border-t border-brand-ink/10">
                    <div className="flex justify-between items-center mb-6">
                      <span className="uppercase tracking-widest text-xs">Total</span>
                      <span className="text-xl font-serif">{cartTotal} ETB</span>
                    </div>
                    <button 
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsCheckoutOpen(true);
                      }}
                      className="w-full luxury-button"
                    >
                      Checkout
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Checkout Modal */}
        <AnimatePresence>
          {isCheckoutOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCheckoutOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white w-full max-w-lg p-8 luxury-border shadow-2xl"
              >
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="absolute top-4 right-4"
                >
                  <X size={20} />
                </button>

                {checkoutStatus === 'success' ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="mx-auto text-green-500 mb-4" size={48} />
                    <h2 className="text-3xl font-serif italic mb-4">Order Received</h2>
                    <p className="text-sm text-brand-ink/60">
                      Thank you for choosing Elu's Perfume. We'll contact you shortly to confirm your delivery in Addis Ababa.
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-serif italic mb-8">Complete Your Order</h2>
                    <form onSubmit={handleCheckout} className="space-y-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Full Name</label>
                        <input 
                          required
                          type="text" 
                          className="w-full bg-brand-cream/50 border border-brand-ink/10 px-4 py-3 text-sm outline-none focus:border-brand-gold"
                          value={checkoutForm.name}
                          onChange={(e) => setCheckoutForm({...checkoutForm, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Email</label>
                          <input 
                            required
                            type="email" 
                            className="w-full bg-brand-cream/50 border border-brand-ink/10 px-4 py-3 text-sm outline-none focus:border-brand-gold"
                            value={checkoutForm.email}
                            onChange={(e) => setCheckoutForm({...checkoutForm, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Phone</label>
                          <input 
                            required
                            type="tel" 
                            placeholder="+251..."
                            className="w-full bg-brand-cream/50 border border-brand-ink/10 px-4 py-3 text-sm outline-none focus:border-brand-gold"
                            value={checkoutForm.phone}
                            onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="pt-4">
                        <div className="flex justify-between items-center mb-6">
                          <span className="uppercase tracking-widest text-xs">Total Amount</span>
                          <span className="text-xl font-serif">{cartTotal} ETB</span>
                        </div>
                        <button 
                          disabled={checkoutStatus === 'loading'}
                          className="w-full luxury-button disabled:opacity-50"
                        >
                          {checkoutStatus === 'loading' ? 'Processing...' : 'Place Order'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main className="flex-grow pt-20">
          {/* Hero Section */}
          <section className="relative h-[80vh] flex items-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=2000" 
                alt="Luxury Perfume" 
                className="w-full h-full object-cover brightness-75"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <p className="uppercase tracking-[0.3em] text-xs mb-4 font-semibold">Addis Ababa Boutique</p>
                <h2 className="text-5xl md:text-8xl font-serif italic mb-8 leading-tight">
                  The Essence of <br /> Elegance
                </h2>
                <a href="#shop" className="luxury-button bg-white text-brand-ink hover:bg-brand-gold hover:text-white inline-block">
                  Explore Collection
                </a>
              </motion.div>
            </div>
          </section>

          {/* Categories / Collections */}
          <section id="collections" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-serif italic mb-4">Our Collections</h2>
                <div className="w-24 h-px bg-brand-gold mx-auto"></div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {['Floral', 'Woody', 'Oriental', 'Fresh'].map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? 'All' : cat)}
                    className={`relative h-64 group overflow-hidden ${selectedCategory === cat ? 'ring-2 ring-brand-gold ring-offset-2' : ''}`}
                  >
                    <img 
                      src={`https://images.unsplash.com/photo-${cat === 'Floral' ? '1490750967868-88aa4486c946' : cat === 'Woody' ? '1541643600914-78b084683601' : cat === 'Oriental' ? '1592945403244-b3fbafd7f539' : '1594035910387-fea47794261f'}?auto=format&fit=crop&q=80&w=600`}
                      alt={cat}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-75"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-2xl font-serif italic">{cat}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Product Grid */}
          <section id="shop" className="py-24 bg-brand-cream">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 space-y-4 md:space-y-0">
                <div>
                  <h2 className="text-4xl font-serif italic">Signature Scents</h2>
                  <p className="text-brand-ink/60 text-sm mt-2">Hand-selected fragrances for the discerning individual.</p>
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => setSelectedCategory('All')}
                    className={`text-[10px] uppercase tracking-widest pb-1 border-b ${selectedCategory === 'All' ? 'border-brand-gold text-brand-gold' : 'border-transparent'}`}
                  >
                    All
                  </button>
                  {['Floral', 'Woody', 'Oriental', 'Fresh'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[10px] uppercase tracking-widest pb-1 border-b ${selectedCategory === cat ? 'border-brand-gold text-brand-gold' : 'border-transparent'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {filteredProducts.map((product) => (
                  <motion.div 
                    layout
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden mb-6 bg-white">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      <button 
                        onClick={() => addToCart(product)}
                        className="absolute bottom-0 left-0 w-full bg-brand-ink text-white py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 uppercase tracking-widest text-[10px] font-bold"
                      >
                        Add to Bag
                      </button>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-brand-ink/40 mb-1">{product.brand}</p>
                      <h3 className="text-xl font-serif mb-2">{product.name}</h3>
                      <p className="text-sm font-medium">{product.price} ETB</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="relative">
                  <div className="aspect-[4/5] luxury-border p-4">
                    <img 
                      src="https://images.unsplash.com/photo-1557170334-a9632e77c6e4?auto=format&fit=crop&q=80&w=800" 
                      alt="Boutique Interior" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-48 h-48 luxury-border bg-brand-cream p-4 hidden md:block">
                    <img 
                      src="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=400" 
                      alt="Perfume Detail" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div>
                  <p className="uppercase tracking-[0.3em] text-[10px] mb-4 font-semibold text-brand-gold">Our Heritage</p>
                  <h2 className="text-4xl md:text-5xl font-serif italic mb-8 leading-tight">
                    Crafting Memories in the Heart of Addis
                  </h2>
                  <div className="space-y-6 text-brand-ink/70 leading-relaxed">
                    <p>
                      Elu's Perfume was born from a passion for the olfactory arts and a deep love for the vibrant culture of Ethiopia. Located in the bustling heart of Addis Ababa, our boutique is a sanctuary for those who seek more than just a scent.
                    </p>
                    <p>
                      We believe that a fragrance is a silent language, a way to express your most intimate self without saying a word. Our signature collection is inspired by the diverse landscapes of Ethiopia—from the misty highlands to the sun-drenched valleys.
                    </p>
                    <p>
                      Each bottle at Elu's is a testament to quality and craftsmanship, sourced from the finest ingredients and curated with an unwavering eye for detail.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Newsletter */}
          <section className="py-24 bg-brand-ink text-white">
            <div className="max-w-3xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-serif italic mb-6">Join the Inner Circle</h2>
              <p className="text-white/60 mb-10 text-sm leading-relaxed">
                Subscribe to receive updates on new arrivals, exclusive events in Addis Ababa, and the art of fragrance.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
                <input 
                  required
                  type="email" 
                  placeholder="Your email address" 
                  className="flex-grow bg-transparent border border-white/20 px-6 py-3 text-sm outline-none focus:border-brand-gold transition-colors"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <button 
                  disabled={subscriptionStatus === 'loading'}
                  className="luxury-button bg-white text-brand-ink hover:bg-brand-gold hover:text-white disabled:opacity-50"
                >
                  {subscriptionStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              {subscriptionStatus === 'success' && (
                <p className="text-brand-gold text-xs mt-4 uppercase tracking-widest">Thank you for subscribing!</p>
              )}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer id="contact" className="bg-brand-cream pt-20 pb-10 border-t border-brand-ink/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
              <div>
                <h3 className="text-xl font-serif italic mb-6">Elu's Perfume</h3>
                <p className="text-sm text-brand-ink/60 leading-relaxed mb-6">
                  Redefining luxury fragrance in Ethiopia. Visit our boutique for a personalized scent consultation.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="p-2 luxury-border rounded-full hover:bg-brand-ink hover:text-white transition-colors">
                    <Instagram size={16} />
                  </a>
                  <a href="#" className="p-2 luxury-border rounded-full hover:bg-brand-ink hover:text-white transition-colors">
                    <Facebook size={16} />
                  </a>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Visit Us</h4>
                <ul className="space-y-4 text-sm text-brand-ink/60">
                  <li className="flex items-start">
                    <MapPin size={16} className="mr-3 mt-1 flex-shrink-0 text-brand-gold" />
                    <span>Bole Road, Near Edna Mall<br />Addis Ababa, Ethiopia</span>
                  </li>
                  <li className="flex items-center">
                    <Phone size={16} className="mr-3 flex-shrink-0 text-brand-gold" />
                    <span>+251 911 000 000</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Quick Links</h4>
                <ul className="space-y-3 text-sm text-brand-ink/60">
                  <li><a href="#shop" className="hover:text-brand-gold transition-colors">Shop All</a></li>
                  <li><a href="#collections" className="hover:text-brand-gold transition-colors">Collections</a></li>
                  <li><a href="#about" className="hover:text-brand-gold transition-colors">Our Story</a></li>
                  <li><a href="#" className="hover:text-brand-gold transition-colors">Shipping & Returns</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Boutique Hours</h4>
                <ul className="space-y-3 text-sm text-brand-ink/60">
                  <li className="flex justify-between">
                    <span>Mon - Sat</span>
                    <span>9:00 AM - 8:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday</span>
                    <span>10:00 AM - 6:00 PM</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-brand-ink/5 text-center">
              <p className="text-[10px] uppercase tracking-widest text-brand-ink/40">
                &copy; {new Date().getFullYear()} Elu's Perfume. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
