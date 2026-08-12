import React, { useEffect, useState } from "react";
import { ArrowLeft, Cookie, ShieldCheck, Check, Settings, Info } from "lucide-react";
import DocumentScrollControls from "./DocumentScrollControls";

interface CookiePolicyPageProps {
  onBack?: () => void;
  onOpenPrivacy?: () => void;
}

export default function CookiePolicyPage({ onBack, onOpenPrivacy }: CookiePolicyPageProps) {
  const [consentState, setConsentState] = useState<{
    essential: boolean;
    functional: boolean;
    analytics: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem("lomon_cookie_consent");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === "object" && parsed !== null) {
          return {
            essential: true,
            functional: parsed.functional ?? true,
            analytics: parsed.analytics ?? false,
          };
        }
        if (saved === "accepted_all") return { essential: true, functional: true, analytics: true };
      }
    } catch (e) {
      console.error(e);
    }
    return { essential: true, functional: true, analytics: false };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReturn = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem("lomon_cookie_consent", JSON.stringify({
        status: "custom",
        essential: true,
        functional: consentState.functional,
        analytics: consentState.analytics,
        timestamp: new Date().toISOString()
      }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptAll = () => {
    setConsentState({ essential: true, functional: true, analytics: true });
    try {
      localStorage.setItem("lomon_cookie_consent", JSON.stringify({
        status: "accepted_all",
        essential: true,
        functional: true,
        analytics: true,
        timestamp: new Date().toISOString()
      }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="terms-page min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8">
      {/* Container - Max Width 850px */}
      <div className="max-w-[850px] mx-auto space-y-8 sm:space-y-10 text-left">
        
        {/* Top Header / Navigation Bar */}
        <div className="border-b border-zinc-900 pb-5 sm:pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-left">
          <button
            onClick={handleReturn}
            className="inline-flex items-center justify-center text-[11px] font-bold tracking-[0.2em] text-zinc-400 hover:text-white transition-colors uppercase cursor-pointer group border border-zinc-900 bg-zinc-950 px-3.5 py-2 rounded-sm w-fit"
            title="Return"
            aria-label="Return"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-zinc-300" />
          </button>

          <div className="flex items-center gap-2 text-[9px] sm:text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest text-left break-words">
            <Cookie size={14} className="text-zinc-300 shrink-0" />
            <span className="break-words">COOKIE POLICY</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-4 border-b border-zinc-900/80 pb-6 sm:pb-8 text-left">
          <div className="space-y-1 text-left">
            <span className="text-[10px] sm:text-[11px] font-display font-bold tracking-[0.18em] sm:tracking-[0.25em] text-zinc-400 uppercase block text-left break-words">
              LOMON LLC
            </span>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-[0.08em] sm:tracking-[0.18em] uppercase leading-tight text-left break-words">
              COOKIE POLICY
            </h1>
          </div>

          <div className="flex flex-wrap items-start sm:items-center gap-x-6 gap-y-2 text-[10.5px] sm:text-[11px] font-mono text-zinc-400 border-t border-zinc-900/50 pt-4 text-left">
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Effective Date:</span>
              <span className="text-zinc-200">July 29, 2026</span>
            </div>
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Last Updated:</span>
              <span className="text-zinc-200">July 29, 2026</span>
            </div>
          </div>

          <p className="text-[12.5px] sm:text-[13px] leading-relaxed text-zinc-300 pt-1 sm:pt-2 break-words">
            This Cookie Policy explains how <strong className="text-white">LOMON LLC</strong> uses cookies, local storage, and session identifiers on <strong className="text-white">theowlclock.com</strong> to maintain active audio playback loops, save clearance cart items, remember age portal access, and secure transaction gateways.
          </p>
        </div>

        {/* Cookie Control Dashboard */}
        <div className="p-4 sm:p-6 bg-zinc-950 border border-zinc-850 rounded-sm space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-900 pb-4 gap-2.5">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-zinc-300 shrink-0" />
              <h2 className="text-xs sm:text-base font-bold text-white uppercase tracking-wider break-words">
                MANAGE YOUR COOKIE PREFERENCES
              </h2>
            </div>
            {savedSuccess && (
              <span className="text-[10px] sm:text-[11px] font-mono text-white bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-sm flex items-center gap-1.5 animate-pulse shrink-0">
                <Check size={12} className="text-white" /> PREFERENCES SAVED
              </span>
            )}
          </div>

          <div className="space-y-3.5 sm:space-y-4">
            {/* Category 1: Essential Cookies */}
            <div className="p-3.5 sm:p-4 bg-black/60 border border-zinc-900 rounded-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">[ MANDATORY ]</span>
                  <h3 className="text-[12px] sm:text-[13px] font-bold text-white uppercase break-words">Essential &amp; Security Cookies</h3>
                </div>
                <div className="shrink-0">
                  <span className="text-[9.5px] sm:text-[10px] font-mono bg-zinc-900 text-zinc-400 px-2.5 py-1 rounded-sm border border-zinc-800 uppercase font-bold inline-block">
                    ALWAYS ACTIVE
                  </span>
                </div>
              </div>
              <p className="text-[11.5px] sm:text-[12px] text-zinc-400 leading-relaxed break-words">
                Required for core website mechanics: maintaining audio loops, saving active cart items, verifying clearance tokens, and managing secure gateway authentications. Cannot be disabled.
              </p>
            </div>

            {/* Category 2: Functional Cookies */}
            <div className="p-3.5 sm:p-4 bg-black/60 border border-zinc-900 rounded-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">[ FUNCTIONAL ]</span>
                  <h3 className="text-[12px] sm:text-[13px] font-bold text-white uppercase break-words">Audio &amp; Portal State Memory</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={consentState.functional}
                    onChange={(e) => setConsentState({ ...consentState, functional: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                </label>
              </div>
              <p className="text-[11.5px] sm:text-[12px] text-zinc-400 leading-relaxed break-words">
                Remembers your audio player volume preferences, selected fragment filters, age portal entries, and active tab transitions across sessions.
              </p>
            </div>

            {/* Category 3: Analytics Cookies */}
            <div className="p-3.5 sm:p-4 bg-black/60 border border-zinc-900 rounded-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">[ ANALYTICS ]</span>
                  <h3 className="text-[12px] sm:text-[13px] font-bold text-white uppercase break-words">Performance &amp; Diagnostics</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={consentState.analytics}
                    onChange={(e) => setConsentState({ ...consentState, analytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                </label>
              </div>
              <p className="text-[11.5px] sm:text-[12px] text-zinc-400 leading-relaxed break-words">
                Helps LOMON LLC monitor website load speed, identify broken audio stems, measure fragment popularity, and optimize Archive traffic patterns without personally identifying you.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
            <button
              onClick={handleSavePreferences}
              className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black font-mono font-bold text-[10.5px] sm:text-[11px] uppercase tracking-widest px-4 sm:px-6 py-3 rounded-sm transition-all cursor-pointer shadow-md text-center"
            >
              SAVE PREFERENCES
            </button>
            <button
              onClick={handleAcceptAll}
              className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold text-[10.5px] sm:text-[11px] uppercase tracking-widest px-4 sm:px-6 py-3 rounded-sm border border-zinc-700 transition-all cursor-pointer text-center"
            >
              ACCEPT ALL COOKIES
            </button>
          </div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="space-y-6 sm:space-y-8 text-[12.5px] sm:text-[13px] leading-relaxed text-zinc-300 pt-2 sm:pt-4">

          <section className="space-y-3 border-b border-zinc-900/60 pb-6 text-left">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-start gap-2 break-words">
              <span className="text-zinc-400 shrink-0">1.</span>
              <span>WHAT ARE COOKIES?</span>
            </h2>
            <p className="break-words">
              Cookies are small text files placed on your computer, tablet, or mobile device by websites that you visit. They are widely used to make websites work efficiently, provide secure authentication, and supply reporting data to site administrators.
            </p>
          </section>

          <section className="space-y-3 border-b border-zinc-900/60 pb-6 text-left">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-start gap-2 break-words">
              <span className="text-zinc-400 shrink-0">2.</span>
              <span>HOW THE ARCHIVE USES LOCAL STORAGE &amp; COOKIES</span>
            </h2>
            <p className="break-words">
              The Owl Clock operates a high-fidelity continuous WebAudio engine. To ensure seamless playback without audio glitches during navigation, the Archive stores session keys in browser local storage (<code className="text-zinc-200 font-mono break-all">lomon_cart</code>, <code className="text-zinc-200 font-mono break-all">lomon_cookie_consent</code>, <code className="text-zinc-200 font-mono break-all">lomon_auth_token</code>).
            </p>
          </section>

          <section className="space-y-3 border-b border-zinc-900/60 pb-6 text-left">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-start gap-2 break-words">
              <span className="text-zinc-400 shrink-0">3.</span>
              <span>BROWSER CONTROL &amp; OPT-OUT OPTIONS</span>
            </h2>
            <p className="break-words">
              Most web browsers allow you to control cookies through their browser settings. You can set your browser to reject cookies or notify you when a cookie is placed on your device. Please note that disabling essential cookies may prevent you from adding Fragments to your cart or completing clearance checkouts.
            </p>
          </section>

          <section className="space-y-3 text-left">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-start gap-2 break-words">
              <span className="text-zinc-400 shrink-0">4.</span>
              <span>QUESTIONS &amp; PRIVACY POLICY LINK</span>
            </h2>
            <p className="break-words">
              For additional details on how LOMON LLC protects your personal information, please read our full Privacy Policy.
            </p>
            {onOpenPrivacy && (
              <button
                onClick={onOpenPrivacy}
                className="mt-2 inline-flex items-center gap-2 text-[10.5px] sm:text-[11px] font-bold text-zinc-300 hover:text-white uppercase tracking-wider underline cursor-pointer break-words max-w-full text-left"
              >
                <ShieldCheck size={13} className="shrink-0" />
                <span className="break-words">READ FULL ARCHIVE PRIVACY POLICY →</span>
              </button>
            )}
          </section>

        </div>

        {/* Footer info banner */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-zinc-500 font-mono gap-4 text-left">
          <p className="text-left">© 2026 LOMON LLC. All rights reserved.</p>
          <p className="uppercase tracking-widest text-zinc-600 text-left">COOKIE POLICY</p>
        </div>

        <DocumentScrollControls />
      </div>
    </div>
  );
}
