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

export default function App() {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavigationTab>("The Owl Clock");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);

  // Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [checkoutActive, setCheckoutActive] = useState<boolean>(false);
  const [checkoutEmail, setCheckoutEmail] = useState<string>("evianaconcepts1@gmail.com");
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);

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

  const [infoOverlay, setInfoOverlay] = useState<{ title: string; subtitle: string; body: string } | null>(null);
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

  const handleLinkClick = (title: string, subtitle: string = "TRANSMISSION") => {
    setMobileMenuOpen(false);
    setInfoOverlay({
      title,
      subtitle,
      body: `ACCESS TO "${title}" IS CURRENTLY UNREACHABLE OR DEMANDS HIGHER CRYPTOGRAPHIC CLEARANCE. CONTACT TRANSMISSIONS ADMIN.`
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
              {/* Desktop Header: 3 columns layout (Left, Center, Right) */}
              <div className="max-w-7xl mx-auto hidden lg:grid grid-cols-3 items-center">
                {/* Left Column: Brand Logo */}
                <div 
                  id="brand" 
                  onClick={() => {
                    setHasEntered(false);
                    setSelectedFragment(null);
                    setCheckoutActive(false);
                    setActiveTab("The Owl Clock");
                  }}
                  className="cursor-pointer space-y-0.5 xl:space-y-1 group relative select-none justify-self-start"
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

                {/* Center Column: Minimal Desktop Navigation tabs */}
                <nav id="desktop-nav" className="flex items-center gap-1 xl:gap-1.5 justify-self-center">
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
                        className={`px-2 xl:px-3 py-1.5 xl:py-2 text-[9px] xl:text-[10px] font-mono uppercase tracking-[0.12em] xl:tracking-[0.22em] transition-all duration-300 rounded-none relative flex items-center gap-1 xl:gap-1.5 cursor-pointer border ${
                          isSelected 
                            ? "text-black bg-[#D9D6CA] border-[#D9D6CA] font-bold" 
                            : "text-zinc-400 border-transparent hover:text-white hover:border-[#D9D6CA]/20"
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
                <div className="flex items-center gap-2 xl:gap-3 justify-self-end">
                  {/* Collection / Media Bag button */}
                  <button 
                    onClick={() => {
                      setCartOpen(!cartOpen);
                    }}
                    className={`flex items-center gap-1 xl:gap-1.5 border px-2 xl:px-3 py-1.5 text-[8.5px] xl:text-[9px] uppercase tracking-wider xl:tracking-widest transition-colors cursor-pointer rounded-none select-none ${
                      cartOpen 
                        ? "border-[#D9D6CA] bg-zinc-950 text-white font-bold" 
                        : "border-zinc-900 bg-neutral-950 text-[#D9D6CA] hover:border-[#D9D6CA]"
                    }`}
                    title="View Collection"
                  >
                    <ShoppingBag size={11} className={cart.length > 0 ? "text-[#D9D6CA]" : ""} />
                    <span className="hidden xl:inline">COLLECTION / MEDIA BAG ({cart.length})</span>
                    <span className="xl:hidden">BAG ({cart.length})</span>
                  </button>

                  {/* Archive Access button */}
                  <button 
                    onClick={() => {
                      setHasEntered(false);
                      setSelectedFragment(null);
                      setCheckoutActive(false);
                    }}
                    className="border border-zinc-900 bg-neutral-950 text-[#D9D6CA] hover:border-[#D9D6CA] hover:text-white px-2 xl:px-3 py-1.5 text-[8.5px] xl:text-[9px] uppercase tracking-wider xl:tracking-widest transition-colors cursor-pointer rounded-none select-none whitespace-nowrap"
                  >
                    <span className="hidden xl:inline">ARCHIVE ACCESS</span>
                    <span className="xl:hidden">ARCHIVE</span>
                  </button>
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
                    <span>COLLECTION ({cart.length})</span>
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
                        </div>
                      </div>

                      {/* Section 2: CLEARANCE */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          CLEARANCE
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleLinkClick("Request Clearance", "CLEARANCE DEP")}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Request Clearance
                          </button>
                          <button
                            onClick={() => handleLinkClick("License Verification", "CLEARANCE DEP")}
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

                      {/* Section 3: RIGHTS */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          RIGHTS
                        </span>
                        <div className="flex flex-col gap-2">
                          {["Rights Administration", "Publishing", "Ownership", "Metadata", "Royalty Administration"].map((r) => (
                            <button
                              key={r}
                              onClick={() => handleLinkClick(r, "RIGHTS DEP")}
                              className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              * {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Section 4: ACCOUNT */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          ACCOUNT
                        </span>
                        <div className="flex flex-col gap-2">
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
                          {["My Licenses", "My Certificates", "My Downloads"].map((a) => (
                            <button
                              key={a}
                              onClick={() => handleLinkClick(a, "ACCOUNT DEP")}
                              className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              * {a}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Section 5: COMPANY */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          COMPANY
                        </span>
                        <div className="flex flex-col gap-2">
                          {["About", "Enterprise", "Support", "Contact"].map((c) => (
                            <button
                              key={c}
                              onClick={() => handleLinkClick(c, "COMPANY DEP")}
                              className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              * {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Section 6: POLICIES */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          POLICIES
                        </span>
                        <div className="flex flex-col gap-2">
                          {["Terms of Use", "Privacy Policy", "Cookie Policy", "Refund Policy", "Acceptable Use"].map((p) => (
                            <button
                              key={p}
                              onClick={() => handleLinkClick(p, "POLICIES DEP")}
                              className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              * {p}
                            </button>
                          ))}
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
                onClearCart={() => setCart([])}
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
                          onClick={() => handleLinkClick("License Verification", "CLEARANCE DEP")}
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
                      {["Request Clearance", "Publishing", "Metadata", "Ownership Verification", "Royalty Administration", "Rights Administration"].map((item) => (
                        <li key={item}>
                          <button 
                            onClick={() => handleLinkClick(item, "CLEARANCE DEP")}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            {item}
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
                      {["About the Archive", "Enterprise", "Support", "Contact"].map((item) => (
                        <li key={item}>
                          <button 
                            onClick={() => handleLinkClick(item, "SYSTEM DEP")}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            {item}
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
                      {["Terms", "Privacy", "Cookies", "Refunds", "Acceptable Use"].map((item) => (
                        <li key={item}>
                          <button 
                            onClick={() => handleLinkClick(item, "PROTOCOLS DEP")}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            {item}
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
                        { name: "Signal", url: "https://signal.org" }
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
                          onClick={() => handleLinkClick("License Verification", "CLEARANCE DEP")}
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
                        {["Request Clearance", "Publishing", "Metadata", "Ownership Verification", "Royalty Administration", "Rights Administration"].map((item) => (
                          <button 
                            key={item}
                            onClick={() => handleLinkClick(item, "CLEARANCE DEP")}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            * {item}
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
                        {["About the Archive", "Enterprise", "Support", "Contact"].map((item) => (
                          <button 
                            key={item}
                            onClick={() => handleLinkClick(item, "SYSTEM DEP")}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            * {item}
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
                        {["Terms", "Privacy", "Cookies", "Refunds", "Acceptable Use"].map((item) => (
                          <button 
                            key={item}
                            onClick={() => handleLinkClick(item, "PROTOCOLS DEP")}
                            className="hover:text-white transition-colors cursor-pointer text-left block"
                          >
                            * {item}
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
                          { name: "Signal", url: "https://signal.org" }
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
                      Lagos, Nigeria
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
                      Lagos, Nigeria
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
                      YOUR CART ({cart.length}):
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
                          className="w-full bg-[#D9D6CA] hover:bg-white text-black font-mono font-bold text-[10px] tracking-widest py-3.5 px-4 flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(217,214,202,0.15)] rounded-sm cursor-pointer"
                        >
                          <span>PROCEED TO CHECKOUT</span>
                          <ChevronRight size={11} className="text-black" />
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
            <AnimatePresence>
              {infoOverlay && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 select-none font-mono"
                >
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="border border-zinc-850 bg-[#050505] p-6 max-w-md w-full text-left space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative"
                  >
                    <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                      <div className="space-y-1">
                        <span className="text-[8px] tracking-[0.3em] uppercase text-red-500 font-bold block">
                          [ ACCESS RESTRICTED ]
                        </span>
                        <h4 className="text-[#D9D6CA] font-bold text-xs uppercase tracking-widest leading-tight">
                          {infoOverlay.title}
                        </h4>
                      </div>
                      <button 
                        onClick={() => setInfoOverlay(null)} 
                        className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs p-1"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-3.5 py-2">
                      <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase tracking-wider">
                        {infoOverlay.body}
                      </p>
                      
                      <div className="border border-zinc-900 bg-neutral-950 p-2.5 flex items-center gap-2.5">
                        <span className="text-red-500 animate-pulse text-sm shrink-0">⚠️</span>
                        <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest leading-normal">
                          SECURITY PROTOCOL LOMON-44 IS ACTIVE. ATTEMPTS HAVE BEEN LOGGED.
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setInfoOverlay(null)}
                      className="w-full bg-zinc-900 border border-zinc-800 hover:border-[#D9D6CA]/40 hover:text-white text-zinc-300 font-mono text-[9px] tracking-[0.25em] uppercase py-3 transition-all cursor-pointer rounded-none"
                    >
                      DISMISS TRANSMISSION
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
