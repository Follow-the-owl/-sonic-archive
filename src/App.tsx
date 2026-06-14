import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ArrowUpRight, ShoppingBag } from "lucide-react";

// Components Imports
import WelcomeScreen from "./components/WelcomeScreen";
import ObservatorySection from "./components/ObservatorySection";
import MidnightJournalSection from "./components/MidnightJournalSection";
import SignalTowerSection from "./components/SignalTowerSection";
import AudioControllerWidget from "./components/AudioControllerWidget";
import { transitionAmbient, playOwlResonance } from "./audio";
import OwlClock from "./components/OwlClock";


type NavigationTab =
  | "The Owl Clock"
  | "The Observatory"
  | "The Midnight Journal"
  | "The Signal Tower";

export default function App() {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavigationTab>("The Owl Clock");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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
          // STEP 2: Main Website Architecture with Guide Navigation
          <motion.div
            key="main-archive-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="flex flex-col min-h-screen justify-between relative z-10"
          >
            {/* Header / Guide Navigation segment */}
            <header id="site-header" className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-zinc-900 px-4 md:px-8 py-5">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Brand Logo & guide state */}
                <div 
                  id="brand" 
                  onClick={() => setActiveTab("The Owl Clock")}
                  className="cursor-pointer space-y-1 group relative select-none"
                >
                  <div className="absolute inset-0 blur-[3px] opacity-25 scale-y-105 group-hover:opacity-40 transition-opacity text-white font-display text-lg tracking-[0.25em]">
                    UNKNOWN
                  </div>
                  <h1 className="text-lg tracking-[0.25em] font-display font-bold text-white group-hover:text-gold-muted transition-colors uppercase leading-none">
                    UNKNOWN
                  </h1>
                  <span className="text-[8px] tracking-[0.3em] uppercase font-mono text-zinc-500 block leading-none">
                    SONIC ARCHIVE
                  </span>
                </div>

                {/* Desktop Menu Guide Navbar - completely flat brutalist tab elements */}
                <nav id="desktop-nav" className="hidden lg:flex items-center gap-1.5">
                  {tabsList.map((tab) => {
                    const isSelected = activeTab === tab;
                    return (
                      <button
                        id={`nav-item-${tab.replace(/\s+/g, '-').toLowerCase()}`}
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-2 text-[10px] font-mono uppercase tracking-[0.22em] transition-all duration-300 rounded-none relative flex items-center gap-1.5 cursor-pointer border ${
                          isSelected 
                            ? "text-black bg-[#D9D6CA] border-[#D9D6CA] font-bold" 
                            : "text-zinc-400 border-transparent hover:text-white hover:border-zinc-800"
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

                {/* Mobile Menu & Auxiliary Controls */}
                <div className="flex items-center gap-3">
                  {/* Visual trigger to go back to welcome screen config / merch */}
                  <button 
                    onClick={() => setHasEntered(false)}
                    className="flex lg:flex items-center gap-1 border border-zinc-900 bg-neutral-950 px-3 py-1.5 text-[9px] uppercase tracking-widest text-[#D9D6CA] hover:border-[#D9D6CA] transition-colors cursor-pointer rounded-none"
                    title="View Physical Media & Shop"
                  >
                    <ShoppingBag size={11} />
                    <span className="hidden sm:inline">MEDIA & BAG</span>
                  </button>

                  <div className="lg:hidden">
                    <button
                      id="mobile-menu-toggle"
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="p-2 border border-zinc-900 bg-neutral-950 text-[#D9D6CA] hover:text-white cursor-pointer rounded-none"
                    >
                      {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Drawer Navigation overlay */}
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    id="mobile-nav-panel"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-full left-0 right-0 bg-black border-b border-zinc-900 p-6 flex flex-col gap-2.5 lg:hidden shadow-2xl z-50"
                  >
                    {tabsList.map((tab) => {
                      const isSelected = activeTab === tab;
                      return (
                        <button
                          id={`mob-nav-item-${tab.replace(/\s+/g, '-').toLowerCase()}`}
                          key={tab}
                          onClick={() => {
                            setActiveTab(tab);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.25em] border rounded-none flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-[#D9D6CA] text-black font-semibold border-[#D9D6CA]"
                              : "bg-transparent text-neutral-500 border-transparent hover:border-zinc-900 hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isSelected && <span>🦉</span>}
                            <span>{tab}</span>
                          </span>
                          {isSelected && <span className="text-[9px] text-black font-bold">[ ACTIVE ]</span>}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </header>

            {/* Active Content Stage */}
            <main id="stage" className="flex-grow py-8 md:py-16 relative px-4 bg-black">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeTab === "The Owl Clock" && (
                    <OwlClock />
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

            {/* Audio Widget stays globally pinned to control playing state */}
            <AudioControllerWidget />

            {/* STEP 11: Minimal Footer */}
            <footer id="site-footer" className="bg-[#020202] border-t border-zinc-900 py-16 px-4 md:px-8 mt-12 select-none">
              <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-10">
                
                {/* Left logo identity column */}
                <div id="footer-branding" className="md:col-span-5 space-y-4 text-center md:text-left">
                  <div className="relative group inline-block select-none cursor-pointer" onClick={() => {
                    setActiveTab("The Owl Clock");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}>
                    <div className="absolute inset-0 blur-[2px] opacity-20 text-white font-display text-xl tracking-[0.25em]">UNKNOWN</div>
                    <h3 className="text-xl font-display font-bold tracking-[0.25em] text-white uppercase leading-none">
                      UNKNOWN
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-zinc-400 font-sans tracking-wide font-light">
                      A Cinematic Sonic Archive
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                      Guarded By The Owl
                    </p>
                  </div>
                  <button 
                    id="footer-owl-motive" 
                    onClick={playOwlResonance}
                    className="text-[10px] font-mono text-zinc-500 hover:text-white hover:border-[#D9D6CA] tracking-[0.3em] uppercase flex items-center justify-center md:justify-start gap-2 pt-2 transition-colors cursor-pointer border border-zinc-900 bg-neutral-950 px-3.5 py-2 rounded-none max-w-fit mx-auto md:mx-0 duration-300"
                    title="Emit Sentinel Call"
                  >
                    <span>🦉 Follow the Owl</span>
                  </button>
                </div>

                {/* Right Links Directory */}
                <div className="md:col-span-7 grid grid-cols-2 gap-8 text-[10px] font-mono text-center sm:text-left">
                  {/* Local Directory */}
                  <div className="space-y-4">
                    <span className="text-neutral-600 uppercase tracking-widest block font-bold">ARCHIVE SECTIONS</span>
                    <ul className="space-y-2 uppercase tracking-wide text-zinc-500">
                      <li>
                        <button onClick={() => setActiveTab("The Owl Clock")} className="hover:text-[#D9D6CA] cursor-pointer transition-colors">THE OWL CLOCK</button>
                      </li>
                      <li>
                        <button onClick={() => setActiveTab("The Observatory")} className="hover:text-[#D9D6CA] cursor-pointer transition-colors">THE OBSERVATORY</button>
                      </li>
                      <li>
                        <button onClick={() => setActiveTab("The Midnight Journal")} className="hover:text-[#D9D6CA] cursor-pointer transition-colors">MIDNIGHT JOURNAL</button>
                      </li>
                      <li>
                        <button onClick={() => setActiveTab("The Signal Tower")} className="hover:text-[#D9D6CA] cursor-pointer transition-colors">SIGNAL TOWER</button>
                      </li>
                    </ul>
                  </div>

                  {/* External socials / links directory */}
                  <div className="space-y-4 col-span-2 sm:col-span-1">
                    <span className="text-neutral-600 uppercase tracking-widest block font-bold">CONNECTIONS</span>
                    <ul className="space-y-2 tracking-widest text-neutral-400 flex flex-col items-center sm:items-start text-zinc-500">
                      <li>
                        <a 
                          id="link-tiktok"
                          href="https://tiktok.com" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:text-[#D9D6CA] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>TIKTOK</span>
                          <ArrowUpRight size={10} className="text-neutral-800" />
                        </a>
                      </li>
                      <li>
                        <a 
                          id="link-instagram"
                          href="https://instagram.com" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:text-[#D9D6CA] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>INSTAGRAM</span>
                          <ArrowUpRight size={10} className="text-neutral-800" />
                        </a>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* Bottom Copyright stamp */}
              <div className="max-w-6xl mx-auto border-t border-zinc-950 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[9px] text-zinc-700">
                <span>© {new Date().getFullYear()} UNKNOWN. ALL CHRONOLOGIES SECURED.</span>
                <span className="tracking-[0.14em]">OWNERSHIP LICENSES GUARDED BY THE SENTINEL OWLS</span>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
