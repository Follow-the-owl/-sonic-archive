import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, X, ShieldCheck, Check, Settings, ChevronRight } from "lucide-react";

interface CookieConsentBannerProps {
  onOpenCookiePolicy: () => void;
  onOpenPrivacyPolicy: () => void;
}

export default function CookieConsentBanner({
  onOpenCookiePolicy,
  onOpenPrivacyPolicy,
}: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const [preferences, setPreferences] = useState({
    essential: true,
    functional: true,
    analytics: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lomon_cookie_consent");
      if (!saved) {
        // Small delay so user sees entrance smoothly
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error("Failed to check cookie consent state:", e);
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(
        "lomon_cookie_consent",
        JSON.stringify({
          status: "accepted_all",
          essential: true,
          functional: true,
          analytics: true,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error(e);
    }
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem(
        "lomon_cookie_consent",
        JSON.stringify({
          status: "essential_only",
          essential: true,
          functional: false,
          analytics: false,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error(e);
    }
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    try {
      localStorage.setItem(
        "lomon_cookie_consent",
        JSON.stringify({
          status: "custom",
          ...preferences,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error(e);
    }
    setShowSettingsModal(false);
    setIsVisible(false);
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && !showSettingsModal && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="terms-page fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-[540px] z-[9990] bg-black/95 backdrop-blur-md border border-zinc-800 p-5 rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.85)] text-left select-none"
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-900 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-sm bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
                  <Cookie size={13} className="text-zinc-300" />
                </div>
                <span className="font-display text-[11px] font-bold tracking-[0.2em] text-zinc-300 uppercase">
                  COOKIE & PRIVACY NOTICE
                </span>
              </div>
              <button
                onClick={handleEssentialOnly}
                className="text-zinc-500 hover:text-white p-1 transition-colors cursor-pointer"
                title="Dismiss with essential cookies only"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-[12px] text-zinc-300 leading-relaxed font-sans mb-4">
              The Owl Clock uses cookies and local storage tokens to preserve active WebAudio playback loops, cache crate items, and verify clearance licenses. You may review our{" "}
              <button
                onClick={onOpenCookiePolicy}
                className="text-white hover:underline font-bold cursor-pointer"
              >
                Cookie Policy
              </button>{" "}
              and{" "}
              <button
                onClick={onOpenPrivacyPolicy}
                className="text-white hover:underline font-bold cursor-pointer"
              >
                Privacy Policy
              </button>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-initial bg-white hover:bg-zinc-200 text-black font-mono font-bold text-[10.5px] uppercase tracking-widest px-4 py-2.5 rounded-sm transition-all cursor-pointer shadow-md text-center"
                >
                  ACCEPT ALL
                </button>
                <button
                  onClick={handleEssentialOnly}
                  className="flex-1 sm:flex-initial bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono font-bold text-[10.5px] uppercase tracking-widest px-3.5 py-2.5 rounded-sm border border-zinc-800 transition-all cursor-pointer text-center"
                >
                  ESSENTIAL ONLY
                </button>
              </div>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-full sm:w-auto text-[10px] font-mono text-zinc-400 hover:text-white uppercase tracking-wider flex items-center justify-center gap-1 py-1 cursor-pointer transition-colors"
              >
                <Settings size={12} className="text-zinc-400" />
                <span>PREFERENCES</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="terms-page fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black border border-zinc-800 p-6 rounded-sm w-full max-w-lg text-left space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-2">
                  <Cookie size={16} className="text-zinc-300" />
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-[0.15em]">
                    COOKIE PREFERENCES
                  </h3>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3.5 text-[12px] text-zinc-300">
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white uppercase">ESSENTIAL COOKIES</p>
                    <p className="text-[11px] text-zinc-400">Audio engine state, cart tokens, security.</p>
                  </div>
                  <span className="text-[9.5px] font-mono text-white font-bold uppercase bg-zinc-900 px-2 py-1 border border-zinc-800">
                    REQUIRED
                  </span>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white uppercase">FUNCTIONAL COOKIES</p>
                    <p className="text-[11px] text-zinc-400">Audio volume memory & portal preferences.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                    className="w-4 h-4 accent-white cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white uppercase">ANALYTICS COOKIES</p>
                    <p className="text-[11px] text-zinc-400">Archive traffic & playback performance monitoring.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="w-4 h-4 accent-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                <button
                  onClick={onOpenCookiePolicy}
                  className="text-[11px] text-zinc-300 hover:text-white underline font-mono uppercase"
                >
                  VIEW FULL COOKIE POLICY →
                </button>
                <button
                  onClick={handleSaveCustom}
                  className="bg-white hover:bg-zinc-200 text-black font-mono font-bold text-[11px] uppercase tracking-widest px-4 py-2 rounded-sm cursor-pointer"
                >
                  SAVE CHOICE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
