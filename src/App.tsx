import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ArrowUpRight, ShoppingBag, Vault, Mail, Download, ChevronRight } from "lucide-react";

// Components Imports
import WelcomeScreen from "./components/WelcomeScreen";
import ObservatorySection from "./components/ObservatorySection";
import MidnightJournalSection from "./components/MidnightJournalSection";
import SignalTowerSection from "./components/SignalTowerSection";
import AudioControllerWidget from "./components/AudioControllerWidget";
import { transitionAmbient, playOwlResonance } from "./audio";
import OwlClock from "./components/OwlClock";
import FragmentDetailPage from "./components/FragmentDetailPage";
import CheckoutPage from "./components/CheckoutPage";
import TransmissionsOverlay from "./components/TransmissionsOverlay";
import MockPaystackCheckout from "./components/MockPaystackCheckout";
import DocumentDashboard from "./components/DocumentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { Fragment } from "./data";


type NavigationTab =
  | "The Owl Clock"
  | "The Observatory"
  | "The Midnight Journal"
  | "The Signal Tower";

export interface CartItem {
  id: string; // `${fragmentId}-${tierId}`
  fragmentId: string;
  name: string;
  timestamp: string;
  artwork: string;
  tierId: string;
  tierTitle: string;
  price: string;
}

function UserAvatar({ email }: { email: string }) {
  const hash = React.useMemo(() => {
    let h = 0;
    const str = email || "guest";
    for (let i = 0; i < str.length; i++) {
      h = str.charCodeAt(i) + ((h << 5) - h);
    }
    return Math.abs(h);
  }, [email]);

  // Curated list of deep, mysterious backgrounds
  const gradients = [
    ["from-[#1d120a] to-[#2e1d11]", "#D6C291"], // Ochre / Amber
    ["from-[#0c1618] to-[#1a2d30]", "#00E676"], // Teal / Green
    ["from-[#100b14] to-[#1f1629]", "#c084fc"], // Amethyst
    ["from-[#150f0f] to-[#2c1c1c]", "#f87171"], // Crimson
    ["from-[#0d131a] to-[#182635]", "#60a5fa"], // Cobalt
    ["from-[#161712] to-[#2a2c22]", "#a3e635"], // Lime/Olive
    ["from-[#1c1c1c] to-[#383838]", "#D9D6CA"], // Monochromatic Platinum
  ];

  const [bgGradient, accentColor] = gradients[hash % gradients.length];
  const patternType = hash % 4;

  return (
    <div className={`w-5 h-5 rounded-[4px] bg-gradient-to-br ${bgGradient} border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
      {/* Dynamic SVG procedural glyphs based on patternType */}
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="1.5">
        {patternType === 0 && (
          <>
            <path d="M12 2L22 12L12 22L2 12Z" stroke={accentColor} />
            <path d="M12 6L18 12L12 18L6 12Z" stroke={accentColor} className="opacity-60" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" className="text-white" />
          </>
        )}
        {patternType === 1 && (
          <>
            <circle cx="12" cy="12" r="8" stroke={accentColor} />
            <path d="M12 2V22M2 12H22" stroke={accentColor} className="opacity-55" />
            <rect x="9.5" y="9.5" width="5" height="5" stroke="currentColor" className="text-white" />
          </>
        )}
        {patternType === 2 && (
          <>
            <path d="M12 3L21 19H3Z" stroke={accentColor} />
            <path d="M12 21L3 5H21Z" stroke={accentColor} className="opacity-40" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" className="text-white" />
          </>
        )}
        {patternType === 3 && (
          <>
            <circle cx="12" cy="12" r="6" stroke={accentColor} strokeDasharray="3 3" />
            <path d="M5 12h14" stroke={accentColor} />
            <path d="M12 5v14" stroke={accentColor} />
            <circle cx="12" cy="12" r="3" stroke="currentColor" className="text-white" />
          </>
        )}
      </svg>
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}

export default function App() {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [adminViewActive, setAdminViewActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavigationTab>("The Owl Clock");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);

  // Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [userLicenses, setUserLicenses] = useState<any[]>([]);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [userEmailLogs, setUserEmailLogs] = useState<any[]>([]);

  // Cart States
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("lomon_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse lomon_cart from localStorage", e);
    }
    return [];
  });
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [checkoutActive, setCheckoutActive] = useState<boolean>(false);
  const [checkoutEmail, setCheckoutEmail] = useState<string>("evianaconcepts1@gmail.com");
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("lomon_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment_success") === "true") {
      const token = params.get("auth_token");
      const email = params.get("email");
      const previewUrl = params.get("email_preview_url");

      if (token) {
        localStorage.setItem("lomon_auth_token", token);
        setIsLoggedIn(true);
        setAuthToken(token);
        setCurrentUserEmail(email || "");
        setCheckoutEmail(email || "");
        fetchUserData(token);
      }
      if (previewUrl) {
        setEmailPreviewUrl(previewUrl);
      }

      // Clear URL search params without triggering reload
      window.history.replaceState({}, document.title, "/");
      setHasEntered(true);

      // Clear the media cart
      setCart([]);
      localStorage.removeItem("lomon_cart");

      // Close checkout screens and automatically slide open the secure licenses dashboard
      setCheckoutActive(false);
      setCheckoutSuccess(false);
      setInfoOverlay({
        title: "My Licenses",
        subtitle: "ACCOUNT DEP",
        body: "",
        type: "my-licenses"
      });
    }
  }, []);

  const isMockCheckout = typeof window !== "undefined" && window.location.pathname === "/mock-paystack-checkout";

  if (isMockCheckout) {
    return <MockPaystackCheckout />;
  }

  const isAdminDashboard = typeof window !== "undefined" && window.location.pathname === "/AdminDashboard";

  if (isAdminDashboard || adminViewActive) {
    return (
      <div className="min-h-screen bg-[#020202] text-zinc-100 p-6 select-text font-mono flex flex-col justify-between">
        <div className="max-w-7xl w-full mx-auto space-y-6 flex-grow">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">
                SYSTEM ADMINISTRATIVE PORTAL //
              </span>
              <span className="text-[10px] text-emerald-400 font-extrabold tracking-widest uppercase animate-pulse">
                SECURE CONSOLE ACTIVE
              </span>
            </div>
            <button 
              onClick={() => {
                if (isAdminDashboard) {
                  window.location.href = "/";
                } else {
                  setAdminViewActive(false);
                }
              }}
              className="text-[10px] text-zinc-500 hover:text-white transition-colors uppercase font-bold tracking-wider cursor-pointer bg-transparent border-none"
            >
              ← BACK TO MAIN APPMENU
            </button>
          </div>
          <AdminDashboard
            currentUserEmail={currentUserEmail || "evianaconcepts1@gmail.com"}
            onClose={() => {
              if (isAdminDashboard) {
                window.location.href = "/";
              } else {
                setAdminViewActive(false);
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Auto-authenticate session on mount
  useEffect(() => {
    const token = localStorage.getItem("lomon_auth_token");
    if (token) {
      fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsLoggedIn(true);
          setAuthToken(token);
          setCurrentUserEmail(data.email);
          setCheckoutEmail(data.email);
          fetchUserData(token);
        } else {
          localStorage.removeItem("lomon_auth_token");
        }
      })
      .catch(err => {
        console.error("Auto-session check failed:", err);
      });
    }
  }, []);

  const fetchUserData = (token: string) => {
    fetch("/api/user/data", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setUserLicenses(data.licenses || []);
        setUserRequests(data.requests || []);
        setUserEmailLogs(data.emailLogs || []);
      }
    })
    .catch(err => console.error("Error fetching user credentials:", err));
  };

  const handleLoginSuccess = (email: string, token: string) => {
    localStorage.setItem("lomon_auth_token", token);
    setIsLoggedIn(true);
    setAuthToken(token);
    setCurrentUserEmail(email);
    setCheckoutEmail(email);
    fetchUserData(token);
  };

  const handleLogout = () => {
    if (authToken) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      }).catch(err => console.error("Logout request failed:", err));
    }
    localStorage.removeItem("lomon_auth_token");
    setIsLoggedIn(false);
    setAuthToken(null);
    setCurrentUserEmail("");
    setUserLicenses([]);
    setUserRequests([]);
  };

  const handleAddToCart = (fragment: Fragment, tierId: string, tierTitle: string, price: string) => {
    const itemId = `${fragment.id}-${tierId}`;
    if (cart.some((item) => item.id === itemId)) {
      if (window.innerWidth < 768) {
        setCheckoutActive(true);
        setCartOpen(false);
      } else {
        setCartOpen(true);
      }
      return;
    }

    const newItem: CartItem = {
      id: itemId,
      fragmentId: fragment.id,
      name: fragment.name,
      timestamp: fragment.timestamp,
      artwork: "https://res.cloudinary.com/dwtqn39as/image/upload/v1781452328/5870632527817543574_omdcor.jpg",
      tierId,
      tierTitle,
      price,
    };

    setCart((prev) => [...prev, newItem]);
    if (window.innerWidth < 768) {
      setCheckoutActive(true);
      setCartOpen(false);
    } else {
      setCartOpen(true);
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutEmail) return;

    setIsProcessingCheckout(true);
    setTimeout(() => {
      setIsProcessingCheckout(false);
      setCheckoutSuccess(true);
    }, 1500);
  };

  const handleCloseCheckout = () => {
    setCart([]);
    setCheckoutActive(false);
    setCheckoutSuccess(false);
    setCartOpen(false);
  };

  // Auto-scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // Transition ambient background loops smoothly as the client moves between sections
  useEffect(() => {
    if (hasEntered) {
      transitionAmbient(activeTab);
    }
  }, [activeTab, hasEntered]);

  const tabsList: NavigationTab[] = [
    "The Owl Clock",
    "The Observatory",
    "The Midnight Journal",
    "The Signal Tower"
  ];

  const [infoOverlay, setInfoOverlay] = useState<{ title: string; subtitle: string; body: string; type?: string } | null>(null);
  const [mobileFooterExpanded, setMobileFooterExpanded] = useState<Record<string, boolean>>({
    ARCHIVE: false,
    CLEARANCE: false,
    SYSTEM: false,
    PROTOCOLS: false,
    TRANSMISSIONS: false
  });

  const toggleMobileFooterSection = (section: string) => {
    setMobileFooterExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLinkClick = (title: string, subtitle: string = "TRANSMISSION", type: string = "") => {
    setMobileMenuOpen(false);
    setInfoOverlay({
      title,
      subtitle,
      body: `ACCESS TO "${title}" IS CURRENTLY UNREACHABLE OR DEMANDS HIGHER CRYPTOGRAPHIC CLEARANCE. CONTACT TRANSMISSIONS ADMIN.`,
      type: type || title
    });
  };

  return (
    <div id="unknown-app-canvas" className="min-h-screen bg-black text-[#d1d1d1] font-mono relative overflow-x-hidden selection:bg-gold-muted/30 selection:text-white">
      {/* 1. Global Film Grain effect overlay */}
      <div id="ambient-grain" className="film-grain" />

      {/* 2. Premium Radial Glow Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

      <AnimatePresence mode="wait">
        {!hasEntered ? (
          // STEP 1: Enter the Portal Welcome Screen
          <motion.div
            key="welcome-portal-view"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <WelcomeScreen onEnter={() => setHasEntered(true)} />
          </motion.div>
        ) : (
          // STEP 2: Main Website Architecture with Guide Navigation (always contains global Header/Cart)
          <motion.div
            key="main-archive-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="flex flex-col min-h-screen justify-between relative z-10"
          >
            {/* Header / Guide Navigation segment */}
            <header id="site-header" className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-zinc-900 px-4 lg:px-6 xl:px-8 py-4 xl:py-5">
              {/* Desktop Header: Flexible, responsive row layout (Left, Center, Right) */}
              <div className="max-w-7xl mx-auto hidden lg:flex items-center justify-between gap-4">
                {/* Left Column: Brand Logo */}
                <div 
                  id="brand" 
                  onClick={() => {
                    setHasEntered(false);
                    setSelectedFragment(null);
                    setCheckoutActive(false);
                    setActiveTab("The Owl Clock");
                  }}
                  className="cursor-pointer space-y-0.5 xl:space-y-1 group relative select-none shrink-0"
                >
                  <div className="absolute inset-0 blur-[3px] opacity-25 scale-y-105 group-hover:opacity-40 transition-opacity text-white font-display text-xs xl:text-lg tracking-[0.2em] xl:tracking-[0.25em]">
                    THE OWL CLOCK
                  </div>
                  <h1 className="text-xs xl:text-lg tracking-[0.2em] xl:tracking-[0.25em] font-display font-bold text-white group-hover:text-gold-muted transition-colors uppercase leading-none">
                    THE OWL CLOCK
                  </h1>
                  <span className="text-[7px] xl:text-[8px] tracking-[0.25em] xl:tracking-[0.3em] uppercase font-mono text-zinc-500 block leading-none">
                    SONIC ARCHIVE
                  </span>
                </div>

                {/* Center Column: Minimal Desktop Navigation tabs with whitespace-nowrap and adaptive scaling */}
                <nav id="desktop-nav" className="flex items-center gap-1 xl:gap-2 shrink">
                  {tabsList.map((tab) => {
                    const isSelected = activeTab === tab && !selectedFragment && !checkoutActive;
                    return (
                      <button
                        id={`nav-item-${tab.replace(/\s+/g, '-').toLowerCase()}`}
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab);
                          setSelectedFragment(null);
                          setCheckoutActive(false);
                        }}
                        className={`px-2 xl:px-3 py-1.5 xl:py-2 text-[8.5px] xl:text-[10px] font-mono uppercase tracking-[0.1em] xl:tracking-[0.22em] transition-all duration-300 rounded-none relative flex items-center gap-1 xl:gap-1.5 cursor-pointer border whitespace-nowrap ${
                          isSelected 
                            ? "text-white bg-transparent border-white font-bold" 
                            : "text-zinc-400 border-transparent hover:text-white hover:border-white/20"
                        }`}
                      >
                        {isSelected && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              playOwlResonance();
                            }}
                            className="text-[11px] animate-pulse hover:scale-130 inline-block transition-transform cursor-pointer"
                            title="Hear Sentinel Voice"
                          >
                            🦉
                          </span>
                        )}
                        <span>{tab}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Right Column: Collection / Media Bag + Archive Access */}
                <div className="flex items-center gap-2 xl:gap-3 shrink-0">
                  {/* Collection / Media Bag button */}
                  <button 
                    onClick={() => {
                      setCartOpen(!cartOpen);
                    }}
                    className={`flex items-center gap-1 xl:gap-1.5 border px-2 xl:px-3 py-1.5 text-[8.5px] xl:text-[9px] uppercase tracking-wider xl:tracking-widest transition-colors cursor-pointer rounded-none select-none whitespace-nowrap ${
                      cartOpen 
                        ? "border-[#D9D6CA] bg-zinc-950 text-white font-bold" 
                        : "border-zinc-900 bg-neutral-950 text-[#D9D6CA] hover:border-[#D9D6CA]"
                    }`}
                    title="View Media Bag"
                  >
                    <ShoppingBag size={11} className={cart.length > 0 ? "text-[#D9D6CA]" : ""} />
                    <span>MEDIA BAG ({cart.length})</span>
                  </button>

                   {isLoggedIn ? (
                    <div className="relative z-50">
                      {/* Interactive Avatar Button */}
                      <button 
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className="flex items-center gap-2 border border-zinc-900 hover:border-[#D9D6CA] bg-neutral-950 px-2 py-1.5 transition-colors cursor-pointer rounded-none select-none"
                        title="Open User Terminal Menu"
                      >
                        <UserAvatar email={currentUserEmail} />
                        <span className="text-[7px] text-zinc-500">▼</span>
                      </button>

                      <AnimatePresence>
                        {profileDropdownOpen && (
                          <>
                            {/* Backdrop invisible helper to close on outside click */}
                            <div 
                              className="fixed inset-0 z-40 bg-transparent cursor-default" 
                              onClick={() => setProfileDropdownOpen(false)} 
                            />
                            
                            {/* Dropdown Panel */}
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 mt-2 w-64 bg-[#0a0a0a] border border-zinc-900 rounded-none shadow-[0_10px_30px_rgba(0,0,0,0.95)] p-4 text-left font-mono z-50 space-y-3"
                            >
                              {/* Email Display */}
                              <div className="space-y-1 select-text">
                                <span className="text-[7.5px] tracking-[0.25em] text-zinc-500 font-bold block uppercase">
                                  TERMINAL GATEWAY
                                </span>
                                <span className="text-[10px] text-zinc-300 font-bold break-all block">
                                  {currentUserEmail.toLowerCase()}
                                </span>
                              </div>

                              {/* Demarcation line */}
                              <div className="h-[1px] bg-zinc-900 w-full" />

                              {/* Navigation Link to Dashboard (My Licenses) */}
                              <div>
                                <button
                                  onClick={() => {
                                    setProfileDropdownOpen(false);
                                    setInfoOverlay({
                                      title: "My Licenses",
                                      subtitle: "ACCOUNT DEP",
                                      body: "",
                                      type: "my-licenses"
                                    });
                                  }}
                                  className="w-full text-left text-[9.5px] text-[#D9D6CA] hover:text-white uppercase transition-colors flex items-center justify-between cursor-pointer py-1 font-bold tracking-wider"
                                >
                                  <span>My Dashboard</span>
                                  <span className="text-zinc-600 font-bold">→</span>
                                </button>
                              </div>

                              {/* Demarcation line */}
                              <div className="h-[1px] bg-zinc-900 w-full" />

                              {/* Administrative Console Link */}
                              {(currentUserEmail.toLowerCase() === "evianaconcepts1@gmail.com" || currentUserEmail.toLowerCase() === "admin@system.local") && (
                                <>
                                  <div>
                                    <button
                                      onClick={() => {
                                        setProfileDropdownOpen(false);
                                        setAdminViewActive(true);
                                      }}
                                      className="w-full text-left text-[9.5px] text-[#D9D6CA] hover:text-white uppercase transition-colors flex items-center justify-between cursor-pointer py-1 font-bold tracking-wider"
                                    >
                                      <span>Admin Dashboard</span>
                                      <span className="text-zinc-600 font-bold">→</span>
                                    </button>
                                  </div>

                                  {/* Demarcation line */}
                                  <div className="h-[1px] bg-zinc-900 w-full" />
                                </>
                              )}

                              {/* Logout Link with Normal Text */}
                              <div>
                                <button 
                                  onClick={() => {
                                    setProfileDropdownOpen(false);
                                    handleLogout();
                                  }}
                                  className="w-full text-left text-[11px] text-zinc-400 hover:text-red-400 transition-colors cursor-pointer py-1 font-sans font-normal normal-case block"
                                >
                                  Logout
                                </button>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setInfoOverlay({ title: "CONNECT TERMINAL", subtitle: "AUTH GATEWAY", body: "", type: "login" })}
                      className="border border-zinc-900 bg-neutral-950 text-[#D9D6CA] hover:border-[#D9D6CA] hover:text-white px-2 xl:px-3 py-1.5 text-[8.5px] xl:text-[9px] uppercase tracking-wider xl:tracking-widest transition-colors cursor-pointer rounded-none select-none whitespace-nowrap"
                    >
                      <span>CONNECT TERMINAL</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Header (Left and Right flex layout) */}
              <div className="max-w-7xl mx-auto flex lg:hidden items-center justify-between w-full">
                {/* Left: Brand logo */}
                <div 
                  id="brand-mobile" 
                  onClick={() => {
                    setHasEntered(false);
                    setSelectedFragment(null);
                    setCheckoutActive(false);
                    setActiveTab("The Owl Clock");
                  }}
                  className="cursor-pointer space-y-1 select-none"
                >
                  <h1 className="text-sm tracking-[0.25em] font-display font-bold text-white uppercase leading-none">
                    THE OWL CLOCK
                  </h1>
                  <span className="text-[8px] tracking-[0.3em] uppercase font-mono text-zinc-500 block leading-none">
                    SONIC ARCHIVE
                  </span>
                </div>

                {/* Right: Collection / Media Bag & Menu Icon */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCheckoutActive(true);
                      setCartOpen(false);
                    }}
                    className="flex items-center gap-1 border border-zinc-900 bg-neutral-950 text-[#D9D6CA] hover:border-[#D9D6CA] px-2.5 py-1.5 text-[9px] uppercase tracking-widest transition-colors cursor-pointer rounded-none select-none"
                  >
                    <ShoppingBag size={11} className={cart.length > 0 ? "text-[#D9D6CA]" : ""} />
                    <span>MEDIA BAG ({cart.length})</span>
                  </button>

                  <button
                    id="mobile-menu-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-1.5 border border-zinc-900 bg-neutral-950 text-[#D9D6CA] hover:text-white cursor-pointer rounded-none"
                  >
                    {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
                  </button>
                </div>
              </div>

              {/* Mobile Drawer Navigation overlay */}
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    id="mobile-nav-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "80vh" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-full left-0 right-0 bg-black border-b border-zinc-900 flex flex-col lg:hidden shadow-2xl z-50 overflow-y-auto"
                  >
                    <div className="p-6 pb-24 space-y-8 select-none">
                      {/* Section 1: ARCHIVE */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          ARCHIVE
                        </span>
                        <div className="flex flex-col gap-2">
                          {[
                            { name: "The Owl Clock", tab: "The Owl Clock" as NavigationTab },
                            { name: "The Observatory", tab: "The Observatory" as NavigationTab },
                            { name: "The Midnight Journal", tab: "The Midnight Journal" as NavigationTab },
                            { name: "The Signal Tower", tab: "The Signal Tower" as NavigationTab }
                          ].map((item) => {
                            const isSelected = activeTab === item.tab && !selectedFragment && !checkoutActive;
                            return (
                              <button
                                key={item.name}
                                onClick={() => {
                                  setActiveTab(item.tab);
                                  setSelectedFragment(null);
                                  setCheckoutActive(false);
                                  setMobileMenuOpen(false);
                                }}
                                className={`text-left font-mono text-[11px] uppercase tracking-wider py-1.5 cursor-pointer flex items-center justify-between ${
                                  isSelected ? "text-white font-bold" : "text-zinc-400 hover:text-white"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  {isSelected && <span className="text-xs">🦉</span>}
                                  <span>{item.name}</span>
                                </span>
                                {isSelected && <span className="text-[8px] bg-zinc-900 px-1.5 py-0.5 text-zinc-400">[ ACTIVE ]</span>}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => {
                              setActiveTab("The Owl Clock");
                              setSelectedFragment(null);
                              setCheckoutActive(false);
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Recovered Fragments
                          </button>
                        </div>
                      </div>

                      {/* Section 2: CLEARANCE */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          CLEARANCE
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleLinkClick("Request Clearance", "CLEARANCE DEP", "request-clearance")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Request Clearance
                          </button>
                          <button
                            onClick={() => handleLinkClick("License Verification", "CLEARANCE DEP", "license-verification")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * License Verification
                          </button>
                          <button
                            onClick={() => {
                              setCheckoutActive(true);
                              setMobileMenuOpen(false);
                            }}
                            className={`text-left font-mono text-[11px] uppercase tracking-wider py-1 cursor-pointer ${
                              checkoutActive ? "text-white font-bold" : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            * Media Bag
                          </button>
                        </div>
                      </div>

                      {/* Section 3: RIGHTS CENTER */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          RIGHTS CENTER
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleLinkClick("Publishing", "RIGHTS DEP", "publishing")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Publishing
                          </button>
                          <button
                            onClick={() => handleLinkClick("Metadata", "RIGHTS DEP", "metadata")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Metadata
                          </button>
                          <button
                            onClick={() => handleLinkClick("Ownership Verification", "RIGHTS DEP", "ownership")}
                             className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Ownership Verification
                          </button>
                          <button
                            onClick={() => handleLinkClick("Royalty Administration", "RIGHTS DEP", "royalty")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Royalty Administration
                          </button>
                          <button
                            onClick={() => handleLinkClick("Rights Administration", "RIGHTS DEP", "rights")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Rights Administration
                          </button>
                        </div>
                      </div>

                      {/* Section 4: ACCOUNT */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          ACCOUNT
                        </span>
                        <div className="flex flex-col gap-2">
                          {isLoggedIn ? (
                            <div className="text-left py-1 text-[11px] font-mono flex items-center justify-between border-b border-zinc-950 pb-1.5 gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <UserAvatar email={currentUserEmail} />
                                <span className="text-zinc-400 font-bold truncate">{currentUserEmail.toUpperCase()}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  handleLogout();
                                  setMobileMenuOpen(false);
                                }}
                                className="text-zinc-400 hover:text-white font-sans text-[10px] font-medium uppercase cursor-pointer transition-colors whitespace-nowrap"
                              >
                                LOGOUT
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setInfoOverlay({ title: "CONNECT TERMINAL", subtitle: "AUTH GATEWAY", body: "", type: "login" });
                              }}
                              className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-[#D9D6CA] font-bold hover:text-white cursor-pointer"
                            >
                              * CONNECT TERMINAL (LOGIN)
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setHasEntered(false);
                              setMobileMenuOpen(false);
                              setSelectedFragment(null);
                              setCheckoutActive(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Archive Access
                          </button>
                          <button
                            onClick={() => handleLinkClick("My Licenses", "ACCOUNT DEP", "my-licenses")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * My Licenses
                          </button>
                          <button
                            onClick={() => handleLinkClick("My Certificates", "ACCOUNT DEP", "my-certificates")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * My Certificates
                          </button>
                          <button
                            onClick={() => handleLinkClick("My Downloads", "ACCOUNT DEP", "my-downloads")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * My Downloads
                          </button>
                          <button
                            onClick={() => handleLinkClick("My Requests", "ACCOUNT DEP", "my-requests")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * My Requests
                          </button>
                        </div>
                      </div>

                      {/* Section 5: SYSTEM */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          SYSTEM
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleLinkClick("About the Archive", "SYSTEM DEP", "about")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * About the Archive
                          </button>
                          <button
                            onClick={() => handleLinkClick("Enterprise", "SYSTEM DEP", "enterprise")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Enterprise
                          </button>
                          <button
                            onClick={() => handleLinkClick("Support", "SYSTEM DEP", "support")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Support
                          </button>
                          <button
                            onClick={() => handleLinkClick("Contact", "SYSTEM DEP", "contact")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Contact
                          </button>
                        </div>
                      </div>

                      {/* Section 6: PROTOCOLS */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          PROTOCOLS
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleLinkClick("Terms", "PROTOCOLS DEP", "terms")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Terms
                          </button>
                          <button
                            onClick={() => handleLinkClick("Privacy", "PROTOCOLS DEP", "privacy")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Privacy
                          </button>
                          <button
                            onClick={() => handleLinkClick("Cookies", "PROTOCOLS DEP", "cookies")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Cookies
                          </button>
                          <button
                            onClick={() => handleLinkClick("Refunds", "PROTOCOLS DEP", "refunds")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Refunds
                          </button>
                          <button
                            onClick={() => handleLinkClick("Acceptable Use", "PROTOCOLS DEP", "acceptable-use")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Acceptable Use
                          </button>
                        </div>
                      </div>

                      {/* Section 7: TRANSMISSIONS */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          TRANSMISSIONS
                        </span>
                        <div className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                          <a 
                            href="https://instagram.com" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-white py-1 flex items-center justify-between"
                          >
                            <span>* Instagram</span>
                            <span className="text-zinc-600 text-[9px]">↗</span>
                          </a>
                          <a 
                            href="https://tiktok.com" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-white py-1 flex items-center justify-between"
                          >
                            <span>* TikTok</span>
                            <span className="text-zinc-600 text-[9px]">↗</span>
                          </a>
                          <a 
                            href="https://youtube.com" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-white py-1 flex items-center justify-between"
                          >
                            <span>* YouTube</span>
                            <span className="text-zinc-600 text-[9px]">↗</span>
                          </a>
                          <a 
                            href="mailto:vault@credentials.local" 
                            className="hover:text-white py-1 flex items-center justify-between"
                          >
                            <span>* Signal</span>
                            <span className="text-zinc-600 text-[9px]">↗</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </header>

            {/* Active Content Stage */}
            {checkoutActive ? (
              <CheckoutPage
                cart={cart}
                onRemoveItem={handleRemoveFromCart}
                onClose={handleCloseCheckout}
                onClearCart={() => {
                  setCart([]);
                  localStorage.removeItem("lomon_cart");
                }}
                isLoggedIn={isLoggedIn}
                currentUserEmail={currentUserEmail}
                authToken={authToken}
                onLoginSuccess={handleLoginSuccess}
                initialStep={checkoutSuccess ? "success" : "cart"}
                emailPreviewUrl={emailPreviewUrl}
              />
            ) : selectedFragment ? (
              <FragmentDetailPage 
                fragment={selectedFragment} 
                onBack={() => {
                  setSelectedFragment(null);
                  window.scrollTo({ top: 0, behavior: "instant" });
                }} 
                onAddToCart={handleAddToCart}
              />
            ) : (
              <main 
                id="stage" 
                className={`flex-grow relative px-4 bg-black transition-all duration-300 ${
                  activeTab === "The Owl Clock" && !selectedFragment && !checkoutActive
                    ? "py-2 sm:py-4 h-[calc(100vh-84px)] lg:h-[calc(100vh-92px)] overflow-hidden flex flex-col justify-center items-center"
                    : "py-8 lg:py-16"
                }`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={activeTab === "The Owl Clock" && !selectedFragment && !checkoutActive ? "w-full h-full flex flex-col justify-center items-center min-h-0" : ""}
                  >
                    {activeTab === "The Owl Clock" && (
                      <OwlClock 
                        onSelectFragment={(frag) => setSelectedFragment(frag)} 
                        onAddToCart={handleAddToCart}
                      />
                    )}
                    {activeTab === "The Observatory" && (
                      <ObservatorySection />
                    )}
                    {activeTab === "The Midnight Journal" && (
                      <MidnightJournalSection />
                    )}
                    {activeTab === "The Signal Tower" && (
                      <SignalTowerSection />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            )}

            {/* Audio Widget stays globally pinned to control playing state except on the Owl Clock page or fragment detail page */}
            {activeTab !== "The Owl Clock" && !selectedFragment && <AudioControllerWidget />}

            {/* STEP 11: Minimal Footer */}
            {!(activeTab === "The Owl Clock" && !selectedFragment && !checkoutActive) && (
              <footer id="site-footer" className="bg-black py-16 px-4 md:px-8 select-none flex flex-col">
                {/* Upper line decoration */}
                <div className="flex items-center justify-center gap-3 w-full max-w-7xl mx-auto opacity-25 mb-12">
                  <div className="h-[1px] flex-grow bg-zinc-650" />
                  <div className="h-[1px] w-5 bg-zinc-450" />
                  <div className="h-[1px] flex-grow bg-zinc-650" />
                </div>

                {/* 1. DESKTOP FOOTER STRUCTURE (Shown on md and up) */}
                <div className="hidden md:grid grid-cols-5 gap-8 max-w-7xl w-full mx-auto text-left mb-16">
                  {/* Column 1: ARCHIVE */}
                  <div className="space-y-4">
                    <h5 className="text-[11px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase">
                      ARCHIVE
                    </h5>
                    <ul className="space-y-2.5 text-[10.5px] text-zinc-400 font-mono">
                      <li>
                        <button 
                          onClick={() => {
                            setActiveTab("The Owl Clock");
                            setSelectedFragment(null);
                            setCheckoutActive(false);
                          }}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          Recovered Fragments
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => {
                            setActiveTab("The Observatory");
                            setSelectedFragment(null);
                            setCheckoutActive(false);
                          }}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          Composition Archive
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => handleLinkClick("License Verification", "CLEARANCE DEP", "license-verification")}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          License Verification
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: CLEARANCE */}
                  <div className="space-y-4">
                    <h5 className="text-[11px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase">
                      CLEARANCE
                    </h5>
                    <ul className="space-y-2.5 text-[10.5px] text-zinc-400 font-mono">
                      {[
                        { name: "Request Clearance", slug: "request-clearance" },
                        { name: "Publishing", slug: "publishing" },
                        { name: "Metadata", slug: "metadata" },
                        { name: "Ownership Verification", slug: "ownership" },
                        { name: "Royalty Administration", slug: "royalty" },
                        { name: "Rights Administration", slug: "rights" }
                      ].map((item) => (
                        <li key={item.name}>
                          <button 
                            onClick={() => handleLinkClick(item.name, "CLEARANCE DEP", item.slug)}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: SYSTEM */}
                  <div className="space-y-4">
                    <h5 className="text-[11px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase">
                      SYSTEM
                    </h5>
                    <ul className="space-y-2.5 text-[10.5px] text-zinc-400 font-mono">
                      {[
                        { name: "About the Archive", slug: "about" },
                        { name: "Enterprise", slug: "enterprise" },
                        { name: "Support", slug: "support" },
                        { name: "Contact", slug: "contact" }
                      ].map((item) => (
                        <li key={item.name}>
                          <button 
                            onClick={() => handleLinkClick(item.name, "SYSTEM DEP", item.slug)}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 4: PROTOCOLS */}
                  <div className="space-y-4">
                    <h5 className="text-[11px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase">
                      PROTOCOLS
                    </h5>
                    <ul className="space-y-2.5 text-[10.5px] text-zinc-400 font-mono">
                      {[
                        { name: "Terms", slug: "terms" },
                        { name: "Privacy", slug: "privacy" },
                        { name: "Cookies", slug: "cookies" },
                        { name: "Refunds", slug: "refunds" },
                        { name: "Acceptable Use", slug: "acceptable-use" }
                      ].map((item) => (
                        <li key={item.name}>
                          <button 
                            onClick={() => handleLinkClick(item.name, "PROTOCOLS DEP", item.slug)}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 5: TRANSMISSIONS */}
                  <div className="space-y-4">
                    <h5 className="text-[11px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase">
                      TRANSMISSIONS
                    </h5>
                    <ul className="space-y-2.5 text-[10.5px] text-zinc-400 font-mono">
                      {[
                        { name: "Instagram", url: "https://instagram.com" },
                        { name: "TikTok", url: "https://tiktok.com" },
                        { name: "YouTube", url: "https://youtube.com" },
                        { name: "Signal", url: "mailto:vault@credentials.local" }
                      ].map((link) => (
                        <li key={link.name}>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer uppercase"
                          >
                            <span>{link.name}</span>
                            <span className="text-zinc-600 text-[9px]">↗</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 2. MOBILE FOOTER STRUCTURE (Accordion-style for screens smaller than md) */}
                <div className="md:hidden flex flex-col w-full max-w-md mx-auto mb-12 border-t border-zinc-900 divide-y divide-zinc-900">
                  {/* ACCORDION 1: ARCHIVE */}
                  <div className="py-3">
                    <button 
                      onClick={() => toggleMobileFooterSection("ARCHIVE")}
                      className="w-full flex justify-between items-center text-[10.5px] tracking-[0.2em] font-bold text-[#D9D6CA] uppercase font-mono py-1.5"
                    >
                      <span>ARCHIVE</span>
                      <span className="text-xs text-zinc-500">{mobileFooterExpanded.ARCHIVE ? "−" : "+"}</span>
                    </button>
                    {mobileFooterExpanded.ARCHIVE && (
                      <div className="pt-2.5 pb-2 pl-3 flex flex-col gap-2.5 text-[10px] text-zinc-400 font-mono text-left">
                        <button 
                          onClick={() => {
                            setActiveTab("The Owl Clock");
                            setSelectedFragment(null);
                            setCheckoutActive(false);
                          }}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          * Recovered Fragments
                        </button>
                        <button 
                          onClick={() => {
                            setActiveTab("The Observatory");
                            setSelectedFragment(null);
                            setCheckoutActive(false);
                          }}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          * Composition Archive
                        </button>
                        <button 
                          onClick={() => handleLinkClick("License Verification", "CLEARANCE DEP", "license-verification")}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          * License Verification
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 2: CLEARANCE */}
                  <div className="py-3">
                    <button 
                      onClick={() => toggleMobileFooterSection("CLEARANCE")}
                      className="w-full flex justify-between items-center text-[10.5px] tracking-[0.2em] font-bold text-[#D9D6CA] uppercase font-mono py-1.5"
                    >
                      <span>CLEARANCE</span>
                      <span className="text-xs text-zinc-500">{mobileFooterExpanded.CLEARANCE ? "−" : "+"}</span>
                    </button>
                    {mobileFooterExpanded.CLEARANCE && (
                      <div className="pt-2.5 pb-2 pl-3 flex flex-col gap-2.5 text-[10px] text-zinc-400 font-mono text-left">
                        {[
                          { name: "Request Clearance", slug: "request-clearance" },
                          { name: "Publishing", slug: "publishing" },
                          { name: "Metadata", slug: "metadata" },
                          { name: "Ownership Verification", slug: "ownership" },
                          { name: "Royalty Administration", slug: "royalty" },
                          { name: "Rights Administration", slug: "rights" }
                        ].map((item) => (
                          <button 
                            key={item.name}
                            onClick={() => handleLinkClick(item.name, "CLEARANCE DEP", item.slug)}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            * {item.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 3: SYSTEM */}
                  <div className="py-3">
                    <button 
                      onClick={() => toggleMobileFooterSection("SYSTEM")}
                      className="w-full flex justify-between items-center text-[10.5px] tracking-[0.2em] font-bold text-[#D9D6CA] uppercase font-mono py-1.5"
                    >
                      <span>SYSTEM</span>
                      <span className="text-xs text-zinc-500">{mobileFooterExpanded.SYSTEM ? "−" : "+"}</span>
                    </button>
                    {mobileFooterExpanded.SYSTEM && (
                      <div className="pt-2.5 pb-2 pl-3 flex flex-col gap-2.5 text-[10px] text-zinc-400 font-mono text-left">
                        {[
                          { name: "About the Archive", slug: "about" },
                          { name: "Enterprise", slug: "enterprise" },
                          { name: "Support", slug: "support" },
                          { name: "Contact", slug: "contact" }
                        ].map((item) => (
                          <button 
                            key={item.name}
                            onClick={() => handleLinkClick(item.name, "SYSTEM DEP", item.slug)}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            * {item.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 4: PROTOCOLS */}
                  <div className="py-3">
                    <button 
                      onClick={() => toggleMobileFooterSection("PROTOCOLS")}
                      className="w-full flex justify-between items-center text-[10.5px] tracking-[0.2em] font-bold text-[#D9D6CA] uppercase font-mono py-1.5"
                    >
                      <span>PROTOCOLS</span>
                      <span className="text-xs text-zinc-500">{mobileFooterExpanded.PROTOCOLS ? "−" : "+"}</span>
                    </button>
                    {mobileFooterExpanded.PROTOCOLS && (
                      <div className="pt-2.5 pb-2 pl-3 flex flex-col gap-2.5 text-[10px] text-zinc-400 font-mono text-left">
                        {[
                          { name: "Terms", slug: "terms" },
                          { name: "Privacy", slug: "privacy" },
                          { name: "Cookies", slug: "cookies" },
                          { name: "Refunds", slug: "refunds" },
                          { name: "Acceptable Use", slug: "acceptable-use" }
                        ].map((item) => (
                          <button 
                            key={item.name}
                            onClick={() => handleLinkClick(item.name, "PROTOCOLS DEP", item.slug)}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            * {item.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 5: TRANSMISSIONS */}
                  <div className="py-3">
                    <button 
                      onClick={() => toggleMobileFooterSection("TRANSMISSIONS")}
                      className="w-full flex justify-between items-center text-[10.5px] tracking-[0.2em] font-bold text-[#D9D6CA] uppercase font-mono py-1.5"
                    >
                      <span>TRANSMISSIONS</span>
                      <span className="text-xs text-zinc-500">{mobileFooterExpanded.TRANSMISSIONS ? "−" : "+"}</span>
                    </button>
                    {mobileFooterExpanded.TRANSMISSIONS && (
                      <div className="pt-2.5 pb-2 pl-3 flex flex-col gap-2.5 text-[10px] text-zinc-400 font-mono text-left">
                        {[
                          { name: "Instagram", url: "https://instagram.com" },
                          { name: "TikTok", url: "https://tiktok.com" },
                          { name: "YouTube", url: "https://youtube.com" },
                          { name: "Signal", url: "mailto:vault@credentials.local" }
                        ].map((link) => (
                          <a 
                            key={link.name}
                            href={link.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer uppercase"
                          >
                            <span>* {link.name}</span>
                            <span className="text-zinc-600 text-[9px]">↗</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM FOOTER LINE */}
                <div className="text-center font-mono space-y-4 tracking-[0.2em] max-w-4xl mx-auto w-full border-t border-zinc-950 pt-10 pb-6">
                  {/* Desktop bottom line with multi-column text */}
                  <div className="hidden sm:block space-y-2">
                    <h6 className="text-[#D9D6CA] font-bold text-[11px] uppercase tracking-[0.3em]">
                      LOMON LLC
                    </h6>
                    <p className="text-zinc-500 text-[9px] uppercase">
                      Publishing • Rights Management • Licensing
                    </p>
                    <p className="text-zinc-600 text-[8.5px] uppercase">
                      Atlanta, Georgia
                    </p>
                    <p className="text-[#8e8d85] text-[8.5px] font-bold uppercase tracking-[0.25em]">
                      RESTRICTED
                    </p>
                    <p className="text-zinc-600 text-[8.5px] pt-4 uppercase">
                      © 2026 LOMON LLC
                    </p>
                  </div>

                  {/* Mobile bottom line with stacked texts */}
                  <div className="sm:hidden space-y-2">
                    <h6 className="text-[#D9D6CA] font-bold text-[10px] uppercase tracking-[0.25em]">
                      LOMON LLC
                    </h6>
                    <p className="text-zinc-500 text-[8.5px] uppercase">
                      Publishing • Rights Management • Licensing
                    </p>
                    <p className="text-zinc-500 text-[8.5px] uppercase">
                      Atlanta, Georgia
                    </p>
                    <p className="text-[#8e8d85] text-[8.5px] font-bold uppercase tracking-[0.25em]">
                      RESTRICTED
                    </p>
                    <p className="text-zinc-600 text-[8px] pt-2 uppercase">
                      © 2026 LOMON LLC
                    </p>
                  </div>
                </div>
              </footer>
            )}

            {/* Cart Popover Dropdown (Matches user mockup design exactly) */}
            <AnimatePresence>
              {cartOpen && typeof window !== "undefined" && window.innerWidth >= 768 && (
                <motion.div
                  id="media-bag-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-24 right-4 md:right-8 z-50 w-full max-w-[360px] bg-[#050505] border border-zinc-900 text-white shadow-2xl p-5 font-mono select-none"
                >
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                      YOUR MEDIA BAG ({cart.length}):
                    </h4>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-zinc-650 text-[10px] uppercase tracking-widest">
                      YOUR VAULT IS EMPTY
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 max-h-[260px] overflow-y-auto mb-5 pr-1 scrollbar-thin">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 border-b border-zinc-950/40 pb-3">
                            <div className="w-12 h-12 bg-zinc-950 border border-zinc-900 overflow-hidden shrink-0 rounded-sm">
                              <img
                                src={item.artwork}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover opacity-80"
                              />
                            </div>
                            <div className="flex-grow min-w-0 flex flex-col justify-center text-left pl-1">
                              <h5 className="text-white font-bold text-[11px] truncate leading-tight">
                                {item.name}
                              </h5>
                              <span className="text-zinc-500 text-[9px] font-mono tracking-widest mt-1 uppercase">
                                TRACK — {item.tierTitle}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-zinc-300 font-sans font-bold text-[11.5px]">{item.price}</span>
                              <button
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="text-zinc-600 hover:text-red-400 p-1 cursor-pointer transition-colors"
                                title="Remove item"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 pt-1">
                        <button
                          onClick={() => {
                            setCheckoutActive(true);
                            setCartOpen(false);
                          }}
                          className="w-full bg-white hover:bg-zinc-200 text-black font-mono font-bold text-[10px] tracking-widest py-3.5 px-4 flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.15)] rounded-sm cursor-pointer"
                        >
                          <span>CONTINUE TO SECURE GATEWAY →</span>
                        </button>

                        <button
                          onClick={() => setCartOpen(false)}
                          className="w-full text-zinc-500 hover:text-white font-mono text-[9px] tracking-widest uppercase text-center cursor-pointer py-1 block transition-colors"
                        >
                          CONTINUE SHOPPING &gt;
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {/* Cinematic Secure Transmission Overlay */}
            <TransmissionsOverlay
              isOpen={!!infoOverlay}
              onClose={() => setInfoOverlay(null)}
              title={infoOverlay?.title || ""}
              subtitle={infoOverlay?.subtitle || ""}
              type={infoOverlay?.type || ""}
              isLoggedIn={isLoggedIn}
              currentUserEmail={currentUserEmail}
              onLoginSuccess={handleLoginSuccess}
              userLicenses={userLicenses}
              userRequests={userRequests}
              userEmailLogs={userEmailLogs}
              onRefreshData={() => authToken && fetchUserData(authToken)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
