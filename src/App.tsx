import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ArrowUpRight } from "lucide-react";

// Components Imports
import WelcomeScreen from "./components/WelcomeScreen";
import IntroductionSection from "./components/IntroductionSection";
import FeaturedSection from "./components/FeaturedSection";
import DeepArchiveSection from "./components/DeepArchiveSection";
import ObservatorySection from "./components/ObservatorySection";
import VaultSection from "./components/VaultSection";
import MidnightJournalSection from "./components/MidnightJournalSection";
import SignalTowerSection from "./components/SignalTowerSection";
import AudioControllerWidget from "./components/AudioControllerWidget";
import { transitionAmbient, playOwlResonance } from "./audio";


type NavigationTab =
  | "The Nest"
  | "The Flight Path"
  | "The Forest"
  | "The Observatory"
  | "The Vault"
  | "The Midnight Journal"
  | "The Signal Tower";

export default function App() {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavigationTab>("The Nest");
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
    "The Nest",
    "The Flight Path",
    "The Forest",
    "The Observatory",
    "The Vault",
    "The Midnight Journal",
    "The Signal Tower"
  ];

  return (
    <div id="unknown-app-canvas" className="min-h-screen bg-dark-black text-[#d1d1d1] font-sans relative overflow-x-hidden selection:bg-gold-muted/30 selection:text-white">
      {/* 1. Global Film Grain effect overlay */}
      <div id="ambient-grain" className="film-grain" />

      {/* 2. Premium Radial Glow Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.4)_100%)]" />

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
            <header id="site-header" className="sticky top-0 z-40 bg-dark-black/90 backdrop-blur-md border-b border-dark-smoke/60 px-4 md:px-8 py-5">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Brand Logo & guide state */}
                <div 
                  id="brand" 
                  onClick={() => setActiveTab("The Nest")}
                  className="cursor-pointer space-y-0.5 group"
                >
                  <h1 className="text-xl tracking-[0.3em] font-serif text-white group-hover:text-gold-muted transition-colors uppercase font-medium">
                    UNKNOWN
                  </h1>
                  <span className="text-[9px] tracking-[0.2em] uppercase font-mono text-zinc-500 block">
                    SONIC ARCHIVE
                  </span>
                </div>

                {/* Desktop Menu Guide Navbar */}
                <nav id="desktop-nav" className="hidden lg:flex items-center gap-1 xl:gap-2">
                  {tabsList.map((tab) => {
                    const isSelected = activeTab === tab;
                    return (
                      <button
                        id={`nav-item-${tab.replace(/\s+/g, '-').toLowerCase()}`}
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] transition-all duration-300 rounded-sm relative flex items-center gap-1.5 cursor-pointer ${
                          isSelected 
                            ? "text-gold-muted bg-dark-smoke/80" 
                            : "text-zinc-400 hover:text-white"
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

                {/* Mobile Menu Toggle Button */}
                <div className="lg:hidden">
                  <button
                    id="mobile-menu-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
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
                    className="absolute top-full left-0 right-0 bg-neutral-950 border-b border-neutral-900 p-6 flex flex-col gap-3 lg:hidden shadow-2xl"
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
                          className={`w-full text-left py-3 px-4 font-mono text-xs uppercase tracking-[0.25em] border rounded-sm flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-neutral-900 text-gold-muted border-neutral-800"
                              : "bg-transparent text-neutral-500 border-transparent hover:border-neutral-900 hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isSelected && <span>🦉</span>}
                            <span>{tab}</span>
                          </span>
                          {isSelected && <span className="text-[10px] text-zinc-600">[ CURRENT ]</span>}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </header>

            {/* Active Content Stage */}
            <main id="stage" className="flex-grow py-12 md:py-20 relative px-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeTab === "The Nest" && (
                    <IntroductionSection 
                      onFollowOwl={() => setActiveTab("The Flight Path")} 
                    />
                  )}
                  {activeTab === "The Flight Path" && (
                    <FeaturedSection />
                  )}
                  {activeTab === "The Forest" && (
                    <DeepArchiveSection 
                      onRequestVaultAccess={() => setActiveTab("The Vault")} 
                    />
                  )}
                  {activeTab === "The Observatory" && (
                    <ObservatorySection />
                  )}
                  {activeTab === "The Vault" && (
                    <VaultSection />
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
            <footer id="site-footer" className="bg-[#050505] border-t border-dark-smoke/60 py-16 px-4 md:px-8 mt-12 select-none">
              <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-10">
                
                {/* Left logo identity column */}
                <div id="footer-branding" className="md:col-span-5 space-y-4 text-center md:text-left">
                  <h3 className="text-xl font-serif tracking-[0.25em] text-white">
                    UNKNOWN
                  </h3>
                  <div className="space-y-1.5">
                    <p className="text-xs text-zinc-400 font-sans tracking-wide font-light">
                      A Cinematic Sonic Archive
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono tracking-wider uppercase">
                      Guarded By The Owl
                    </p>
                  </div>
                  <button 
                    id="footer-owl-motive" 
                    onClick={playOwlResonance}
                    className="text-[11px] font-mono text-zinc-500 hover:text-gold-muted tracking-[0.3em] uppercase flex items-center justify-center md:justify-start gap-2 pt-2 transition-colors cursor-pointer border border-transparent hover:border-dark-smoke bg-transparent hover:bg-neutral-950 px-3 py-1.5 rounded-sm max-w-fit mx-auto md:mx-0 duration-300"
                    title="Emit Sentinel Call"
                  >
                    <span>🦉 Follow the Owl</span>
                  </button>
                </div>

                {/* Right Links Directory */}
                <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-[11px] font-mono text-center sm:text-left">
                  {/* Local Directory */}
                  <div className="space-y-4">
                    <span className="text-neutral-600 uppercase tracking-widest block font-medium">ARCHIVE</span>
                    <ul className="space-y-2 uppercase tracking-wide text-neutral-400">
                      <li>
                        <button onClick={() => setActiveTab("The Forest")} className="hover:text-gold-muted cursor-pointer transition-colors">THE FOREST</button>
                      </li>
                      <li>
                        <button onClick={() => setActiveTab("The Nest")} className="hover:text-gold-muted cursor-pointer transition-colors">THE NEST</button>
                      </li>
                      <li>
                        <button onClick={() => setActiveTab("The Flight Path")} className="hover:text-gold-muted cursor-pointer transition-colors">FLIGHT PATH</button>
                      </li>
                    </ul>
                  </div>

                  {/* Private Access */}
                  <div className="space-y-4">
                    <span className="text-neutral-600 uppercase tracking-widest block font-medium">SECURE DECK</span>
                    <ul className="space-y-2 uppercase tracking-wide text-neutral-400">
                      <li>
                        <button onClick={() => setActiveTab("The Vault")} className="hover:text-gold-muted cursor-pointer transition-colors">THE VAULT</button>
                      </li>
                      <li>
                        <button onClick={() => setActiveTab("The Signal Tower")} className="hover:text-gold-muted cursor-pointer transition-colors">SIGNAL TOWER</button>
                      </li>
                      <li>
                        <button onClick={() => setActiveTab("The Midnight Journal")} className="hover:text-gold-muted cursor-pointer transition-colors">JOURNAL</button>
                      </li>
                    </ul>
                  </div>

                  {/* External socials / links directory */}
                  <div className="space-y-4 col-span-2 sm:col-span-1">
                    <span className="text-neutral-600 uppercase tracking-widest block font-medium">CONNECTIONS</span>
                    <ul className="space-y-2 tracking-widest text-neutral-400 flex flex-col items-center sm:items-start">
                      <li>
                        <a 
                          id="link-tiktok"
                          href="https://tiktok.com" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:text-gold-muted transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>TIKTOK</span>
                          <ArrowUpRight size={10} className="text-neutral-700" />
                        </a>
                      </li>
                      <li>
                        <a 
                          id="link-instagram"
                          href="https://instagram.com" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:text-gold-muted transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>INSTAGRAM</span>
                          <ArrowUpRight size={10} className="text-neutral-700" />
                        </a>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* Bottom Copyright stamp */}
              <div className="max-w-6xl mx-auto border-t border-dark-smoke/60 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[9px] text-zinc-650">
                <span>© {new Date().getFullYear()} UNKNOWN. ALL CHRONOLOGIES SECURED.</span>
                <span className="tracking-[0.15em]">OWNERSHIP LICENSES GUARDED BY THE SENTINEL OWLS</span>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
