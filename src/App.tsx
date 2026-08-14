import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ArrowUpRight, Package, Vault, Mail, Download, ChevronRight } from "lucide-react";

// Components Imports
import WelcomeScreen from "./components/WelcomeScreen";
import SignalTowerSection from "./components/SignalTowerSection";
import AudioControllerWidget from "./components/AudioControllerWidget";
import { transitionAmbient, preloadAllAudio, stopAudio } from "./audio";
import OwlClock from "./components/OwlClock";
import FragmentDetailPage from "./components/FragmentDetailPage";
import CheckoutPage from "./components/CheckoutPage";
import TransmissionsOverlay from "./components/TransmissionsOverlay";
import MockPaypalCheckout from "./components/MockPaypalCheckout";
import DocumentDashboard from "./components/DocumentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import TermsOfUsePage from "./components/TermsOfUsePage";
import PrivacyPolicyPage from "./components/PrivacyPolicyPage";
import CookiePolicyPage from "./components/CookiePolicyPage";
import RefundPolicyPage from "./components/RefundPolicyPage";
import LicenseVerificationPage from "./components/LicenseVerificationPage";
import AcceptableUsePage from "./components/AcceptableUsePage";
import ContactPage from "./components/ContactPage";
import FragmentClearanceGuidePage from "./components/FragmentClearanceGuidePage";
import FragmentLicensingSchedulePage from "./components/FragmentLicensingSchedulePage";
import AboutArchivePage from "./components/AboutArchivePage";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { Fragment } from "./data";


type NavigationTab =
  | "The Owl Clock"
  | "Signal tower";

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

  const [infoOverlay, setInfoOverlay] = useState<{ title: string; subtitle: string; body: string; type?: string } | null>(null);
  const [showTermsPage, setShowTermsPage] = useState<boolean>(() => typeof window !== "undefined" && window.location.pathname === "/terms");
  const [showPrivacyPage, setShowPrivacyPage] = useState<boolean>(() => typeof window !== "undefined" && window.location.pathname === "/privacy");
  const [showCookiePage, setShowCookiePage] = useState<boolean>(() => typeof window !== "undefined" && window.location.pathname === "/cookies");
  const [showRefundPage, setShowRefundPage] = useState<boolean>(() => typeof window !== "undefined" && (window.location.pathname === "/refunds" || window.location.pathname === "/refund-policy"));
  const [showAcceptableUsePage, setShowAcceptableUsePage] = useState<boolean>(() => typeof window !== "undefined" && (window.location.pathname === "/acceptable-use" || window.location.pathname === "/acceptable-use-policy"));
  const [showVerificationPage, setShowVerificationPage] = useState<boolean>(() => typeof window !== "undefined" && (window.location.pathname.startsWith("/verify") || window.location.pathname.startsWith("/license-verification")));
  const [showContactPage, setShowContactPage] = useState<boolean>(() => typeof window !== "undefined" && (window.location.pathname === "/contact" || window.location.pathname === "/contact-us"));
  const [showClearanceGuidePage, setShowClearanceGuidePage] = useState<boolean>(() => typeof window !== "undefined" && (window.location.pathname === "/clearance-guide" || window.location.pathname === "/fragment-clearance-guide"));
  const [showLicensingSchedulePage, setShowLicensingSchedulePage] = useState<boolean>(() => typeof window !== "undefined" && (window.location.pathname === "/licensing-schedule" || window.location.pathname === "/pricing" || window.location.pathname === "/fragment-licensing-schedule"));
  const [showAboutPage, setShowAboutPage] = useState<boolean>(() => typeof window !== "undefined" && (window.location.pathname === "/about" || window.location.pathname === "/about-the-archive"));
  const [verificationLicenseNumber, setVerificationLicenseNumber] = useState<string>("");
  const [contactInitialDept, setContactInitialDept] = useState<string>("General Inquiries");
  const [contactInitialSubj, setContactInitialSubj] = useState<string>("");

  useEffect(() => {
    const handlePopState = () => {
      setShowTermsPage(window.location.pathname === "/terms");
      setShowPrivacyPage(window.location.pathname === "/privacy");
      setShowCookiePage(window.location.pathname === "/cookies");
      setShowRefundPage(window.location.pathname === "/refunds" || window.location.pathname === "/refund-policy");
      setShowAcceptableUsePage(window.location.pathname === "/acceptable-use" || window.location.pathname === "/acceptable-use-policy");
      setShowVerificationPage(window.location.pathname.startsWith("/verify") || window.location.pathname.startsWith("/license-verification"));
      setShowContactPage(window.location.pathname === "/contact" || window.location.pathname === "/contact-us");
      setShowClearanceGuidePage(window.location.pathname === "/clearance-guide" || window.location.pathname === "/fragment-clearance-guide");
      setShowLicensingSchedulePage(window.location.pathname === "/licensing-schedule" || window.location.pathname === "/pricing" || window.location.pathname === "/fragment-licensing-schedule");
      setShowAboutPage(window.location.pathname === "/about" || window.location.pathname === "/about-the-archive");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleOpenVerification = (num: string = "") => {
    setMobileMenuOpen(false);
    setInfoOverlay(null);
    setVerificationLicenseNumber(num);
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/license-verification")) {
      window.history.pushState({ verify: true }, "", "/license-verification");
    }
    setShowVerificationPage(true);
  };

  const handleBackFromVerification = () => {
    setShowVerificationPage(false);
    if (typeof window !== "undefined" && (window.location.pathname.startsWith("/verify") || window.location.pathname.startsWith("/license-verification"))) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState({}, "", "/");
      }
    }
  };

  const handleOpenTerms = () => {
    setMobileMenuOpen(false);
    setInfoOverlay(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/terms") {
      window.history.pushState({ terms: true }, "", "/terms");
    }
    setShowTermsPage(true);
  };

  const handleBackFromTerms = () => {
    setShowTermsPage(false);
    if (typeof window !== "undefined" && window.location.pathname === "/terms") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState({}, "", "/");
      }
    }
  };

  const handleOpenPrivacy = () => {
    setMobileMenuOpen(false);
    setInfoOverlay(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/privacy") {
      window.history.pushState({ privacy: true }, "", "/privacy");
    }
    setShowPrivacyPage(true);
  };

  const handleBackFromPrivacy = () => {
    setShowPrivacyPage(false);
    if (typeof window !== "undefined" && window.location.pathname === "/privacy") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState({}, "", "/");
      }
    }
  };

  const handleOpenCookies = () => {
    setMobileMenuOpen(false);
    setInfoOverlay(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/cookies") {
      window.history.pushState({ cookies: true }, "", "/cookies");
    }
    setShowCookiePage(true);
  };

  const handleBackFromCookies = () => {
    setShowCookiePage(false);
    if (typeof window !== "undefined" && window.location.pathname === "/cookies") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState({}, "", "/");
      }
    }
  };

  const handleOpenRefunds = () => {
    setMobileMenuOpen(false);
    setInfoOverlay(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/refunds") {
      window.history.pushState({ refunds: true }, "", "/refunds");
    }
    setShowRefundPage(true);
  };

  const handleBackFromRefunds = () => {
    setShowRefundPage(false);
    if (typeof window !== "undefined" && (window.location.pathname === "/refunds" || window.location.pathname === "/refund-policy")) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState({}, "", "/");
      }
    }
  };

  const handleOpenAcceptableUse = () => {
    setMobileMenuOpen(false);
    setInfoOverlay(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/acceptable-use") {
      window.history.pushState({ acceptableUse: true }, "", "/acceptable-use");
    }
    setShowAcceptableUsePage(true);
  };

  const handleBackFromAcceptableUse = () => {
    setShowAcceptableUsePage(false);
    if (typeof window !== "undefined" && (window.location.pathname === "/acceptable-use" || window.location.pathname === "/acceptable-use-policy")) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState({}, "", "/");
      }
    }
  };

  const handleOpenContact = (dept: string = "General Inquiries", subj: string = "") => {
    setMobileMenuOpen(false);
    setInfoOverlay(null);
    setContactInitialDept(dept);
    setContactInitialSubj(subj);
    if (typeof window !== "undefined" && window.location.pathname !== "/contact") {
      window.history.pushState({ contact: true }, "", "/contact");
    }
    setShowContactPage(true);
  };

  const handleOpenOwlClock = () => {
    setMobileMenuOpen(false);
    setInfoOverlay(null);
    setShowTermsPage(false);
    setShowPrivacyPage(false);
    setShowCookiePage(false);
    setShowRefundPage(false);
    setShowAcceptableUsePage(false);
    setShowVerificationPage(false);
    setShowContactPage(false);
    setShowClearanceGuidePage(false);
    setShowLicensingSchedulePage(false);
    setShowAboutPage(false);
    setSelectedFragment(null);
    setCheckoutActive(false);
    setActiveTab("The Owl Clock");
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackFromContact = () => {
    setShowContactPage(false);
    if (typeof window !== "undefined" && (window.location.pathname === "/contact" || window.location.pathname === "/contact-us")) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState({}, "", "/");
      }
    }
  };

  const handleOpenClearanceGuide = () => {
    setMobileMenuOpen(false);
    setInfoOverlay(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/clearance-guide") {
      window.history.pushState({ clearanceGuide: true }, "", "/clearance-guide");
    }
    setShowClearanceGuidePage(true);
  };

  const handleBackFromClearanceGuide = () => {
    setShowClearanceGuidePage(false);
    if (typeof window !== "undefined" && (window.location.pathname === "/clearance-guide" || window.location.pathname === "/fragment-clearance-guide")) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState({}, "", "/");
      }
    }
  };

  const handleOpenLicensingSchedule = () => {
    setMobileMenuOpen(false);
    setInfoOverlay(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/licensing-schedule") {
      window.history.pushState({ licensingSchedule: true }, "", "/licensing-schedule");
    }
    setShowLicensingSchedulePage(true);
  };

  const handleBackFromLicensingSchedule = () => {
    setShowLicensingSchedulePage(false);
    if (typeof window !== "undefined" && (window.location.pathname === "/licensing-schedule" || window.location.pathname === "/pricing" || window.location.pathname === "/fragment-licensing-schedule")) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState({}, "", "/");
      }
    }
  };

  const handleOpenAbout = () => {
    setMobileMenuOpen(false);
    setInfoOverlay(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/about") {
      window.history.pushState({ about: true }, "", "/about");
    }
    setShowAboutPage(true);
  };

  const handleBackFromAbout = () => {
    setShowAboutPage(false);
    if (typeof window !== "undefined" && (window.location.pathname === "/about" || window.location.pathname === "/about-the-archive")) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState({}, "", "/");
      }
    }
  };
  const [mobileFooterExpanded, setMobileFooterExpanded] = useState<Record<string, boolean>>({
    ARCHIVE: false,
    CLEARANCE: false,
    ABOUT: false,
    LEGAL: false,
    TRANSMISSIONS: false
  });

  // Preload fragment audio files in the background on initial mount to eliminate glitches
  useEffect(() => {
    preloadAllAudio();
  }, []);

  // Auto-scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // Ensure complete silence whenever on The Owl Clock tab or leaving a fragment
  useEffect(() => {
    if (activeTab === "The Owl Clock" && !selectedFragment) {
      stopAudio();
    }
  }, [activeTab, selectedFragment]);

  // Transition ambient background loops smoothly as the client moves between sections
  useEffect(() => {
    if (hasEntered) {
      if (activeTab === "The Owl Clock") {
        stopAudio();
      }
      transitionAmbient(activeTab);
    }
  }, [activeTab, hasEntered]);

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

      // Clear the crate
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

  // Auto-authenticate session on mount
  useEffect(() => {
    const token = localStorage.getItem("lomon_auth_token");
    if (token) {
      fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error("API route unavailable");
        return res.json();
      })
      .then(data => {
        if (data && data.success) {
          setIsLoggedIn(true);
          setAuthToken(token);
          setCurrentUserEmail(data.email);
          setCheckoutEmail(data.email);
          fetchUserData(token);
        } else {
          localStorage.removeItem("lomon_auth_token");
        }
      })
      .catch(() => {
        // Fallback to local storage credentials if API node is client-only
        const savedEmail = localStorage.getItem("lomon_user_email") || "client@archive.internal";
        setIsLoggedIn(true);
        setAuthToken(token);
        setCurrentUserEmail(savedEmail);
        setCheckoutEmail(savedEmail);
        fetchUserData(token);
      });
    }
  }, []);

  const isMockCheckout = typeof window !== "undefined" && (window.location.pathname === "/mock-paypal-checkout" || window.location.pathname === "/mock-paystack-checkout");

  if (isMockCheckout) {
    return <MockPaypalCheckout />;
  }

  if (showTermsPage) {
    return (
      <TermsOfUsePage 
        onBack={handleBackFromTerms} 
      />
    );
  }

  if (showPrivacyPage) {
    return (
      <PrivacyPolicyPage 
        onBack={handleBackFromPrivacy}
        onOpenCookies={handleOpenCookies}
      />
    );
  }

  if (showCookiePage) {
    return (
      <CookiePolicyPage 
        onBack={handleBackFromCookies}
        onOpenPrivacy={handleOpenPrivacy}
      />
    );
  }

  if (showRefundPage) {
    return (
      <RefundPolicyPage 
        onBack={handleBackFromRefunds}
      />
    );
  }

  if (showAcceptableUsePage) {
    return (
      <AcceptableUsePage 
        onBack={handleBackFromAcceptableUse}
      />
    );
  }

  if (showVerificationPage) {
    return (
      <LicenseVerificationPage 
        initialLicenseNumber={verificationLicenseNumber}
        onBack={handleBackFromVerification}
      />
    );
  }

  if (showContactPage) {
    return (
      <ContactPage 
        onBack={handleBackFromContact}
        initialDepartment={contactInitialDept}
        initialSubject={contactInitialSubj}
      />
    );
  }

  if (showClearanceGuidePage) {
    return (
      <FragmentClearanceGuidePage 
        onBack={handleBackFromClearanceGuide}
        onRequestClearance={() => {
          handleBackFromClearanceGuide();
          handleLinkClick("Request Clearance", "CLEARANCE DEP", "request-clearance");
        }}
        onContact={handleOpenContact}
      />
    );
  }

  if (showLicensingSchedulePage) {
    return (
      <FragmentLicensingSchedulePage 
        onBack={handleBackFromLicensingSchedule}
        onRequestClearance={(licenseId?: string) => {
          handleBackFromLicensingSchedule();
          handleOpenContact("Fragment Licensing", licenseId ? `Clearance Request for ${licenseId.toUpperCase()} Tier` : "Fragment Clearance Request & Collaboration");
        }}
        onContact={handleOpenContact}
      />
    );
  }

  if (showAboutPage) {
    return (
      <AboutArchivePage 
        onBack={handleBackFromAbout}
        onRequestClearance={() => {
          handleBackFromAbout();
          handleLinkClick("Request Clearance", "CLEARANCE DEP", "request-clearance");
        }}
        onContact={handleOpenContact}
      />
    );
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

  function fetchUserData(token: string) {
    fetch("/api/user/data", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error("API route unavailable");
      return res.json();
    })
    .then(data => {
      if (data && data.success) {
        setUserLicenses(data.licenses || []);
        setUserRequests(data.requests || []);
        setUserEmailLogs(data.emailLogs || []);
      } else {
        loadFallbackUserData();
      }
    })
    .catch(() => {
      loadFallbackUserData();
    });
  }

  function loadFallbackUserData() {
    try {
      const savedLicenses = localStorage.getItem("lomon_user_licenses");
      if (savedLicenses) {
        const parsed = JSON.parse(savedLicenses);
        if (Array.isArray(parsed)) setUserLicenses(parsed);
      }
      const savedRequests = localStorage.getItem("lomon_user_requests");
      if (savedRequests) {
        const parsed = JSON.parse(savedRequests);
        if (Array.isArray(parsed)) setUserRequests(parsed);
      }
    } catch (_err) {
      // Silent catch
    }
  }

  const handleLoginSuccess = (email: string, token: string) => {
    localStorage.setItem("lomon_auth_token", token);
    localStorage.setItem("lomon_user_email", email);
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
      }).catch(() => {
        // Silent catch for client mode
      });
    }
    localStorage.removeItem("lomon_auth_token");
    localStorage.removeItem("lomon_user_email");
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

  const tabsList: NavigationTab[] = [
    "The Owl Clock",
    "Signal tower"
  ];

  const toggleMobileFooterSection = (section: string) => {
    setMobileFooterExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLinkClick = (title: string = "", subtitle: string = "TRANSMISSION", type: string = "") => {
    setMobileMenuOpen(false);
    const safeTitle = (title || "").toLowerCase();
    const safeType = (type || "").toLowerCase();
    if (type === "terms" || title === "Terms" || safeTitle === "terms of use") {
      handleOpenTerms();
      return;
    }
    if (type === "privacy" || title === "Privacy" || safeTitle === "privacy policy") {
      handleOpenPrivacy();
      return;
    }
    if (type === "cookies" || title === "Cookies" || safeTitle === "cookie policy") {
      handleOpenCookies();
      return;
    }
    if (type === "refunds" || type === "refund-policy" || title === "Refunds" || safeTitle === "refund policy") {
      handleOpenRefunds();
      return;
    }
    if (type === "acceptable-use" || safeType === "acceptable-use" || title === "Acceptable Use" || safeTitle === "acceptable use" || safeTitle === "acceptable use policy") {
      handleOpenAcceptableUse();
      return;
    }
    if (type === "license-verification" || type === "verification" || title === "License Verification" || safeTitle === "license verification") {
      handleOpenVerification();
      return;
    }
    if (type === "contact" || title === "Contact" || safeTitle === "contact" || safeTitle === "contact us") {
      handleOpenContact();
      return;
    }
    if (type === "request-clearance" || safeType === "request-clearance" || title === "Request Clearance" || safeTitle === "request clearance") {
      handleOpenContact("Fragment Licensing", "Fragment Clearance Request & Collaboration");
      return;
    }
    if (type === "recovered-fragments" || safeType === "recovered-fragments" || title === "Recovered Fragments" || safeTitle === "recovered fragments" || safeTitle === "composition archive" || title === "Composition Archive") {
      handleOpenOwlClock();
      return;
    }
    if (type === "clearance-guide" || safeType === "clearance-guide" || title === "Fragment Clearance Guide" || safeTitle === "fragment clearance guide" || safeTitle === "clearance guide") {
      handleOpenClearanceGuide();
      return;
    }
    if (type === "licensing-schedule" || safeType === "licensing-schedule" || type === "pricing" || safeType === "pricing" || title === "Fragment Licensing Schedule" || safeTitle === "fragment licensing schedule" || safeTitle === "licensing schedule" || safeTitle === "pricing") {
      handleOpenLicensingSchedule();
      return;
    }
    if (type === "about" || safeType === "about" || title === "About the Archive" || safeTitle === "about the archive" || safeTitle === "about") {
      handleOpenAbout();
      return;
    }
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
                            className="text-[11px] inline-block"
                          >
                            🦉
                          </span>
                        )}
                        <span>{tab}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Right Column: Collection / Crate + Archive Access */}
                <div className="flex items-center gap-2 xl:gap-3 shrink-0">
                  {/* Collection / Crate button */}
                  <button 
                    onClick={() => {
                      setCartOpen(!cartOpen);
                    }}
                    className={`flex items-center gap-1 xl:gap-1.5 border px-2 xl:px-3 py-1.5 text-[8.5px] xl:text-[9px] uppercase tracking-wider xl:tracking-widest transition-colors cursor-pointer rounded-none select-none whitespace-nowrap ${
                      cartOpen 
                        ? "border-[#D9D6CA] bg-zinc-950 text-white font-bold" 
                        : "border-zinc-900 bg-neutral-950 text-[#D9D6CA] hover:border-[#D9D6CA]"
                    }`}
                    title="View Cart"
                  >
                    <Package size={11} className={cart.length > 0 ? "text-[#D9D6CA]" : ""} />
                    <span>CART ({cart.length})</span>
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
                                  {(currentUserEmail || "").toLowerCase()}
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
                              {((currentUserEmail || "").toLowerCase() === "evianaconcepts1@gmail.com" || (currentUserEmail || "").toLowerCase() === "admin@system.local") && (
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

                {/* Right: User / Login, Cart & Menu Icon */}
                <div className="flex items-center gap-1.5">
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        setInfoOverlay({
                          title: "My Licenses",
                          subtitle: "ACCOUNT DEP",
                          body: "",
                          type: "my-licenses"
                        });
                      }}
                      className="flex items-center gap-1 border border-zinc-900 bg-neutral-950 text-[#D9D6CA] hover:border-[#D9D6CA] px-2 py-1 text-[9px] uppercase tracking-wider transition-colors cursor-pointer rounded-none select-none"
                      title="My Dashboard"
                    >
                      <UserAvatar email={currentUserEmail} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setInfoOverlay({ title: "CONNECT TERMINAL", subtitle: "AUTH GATEWAY", body: "", type: "login" })}
                      className="border border-zinc-900 bg-neutral-950 text-[#D9D6CA] hover:border-[#D9D6CA] hover:text-white px-2 py-1.5 text-[8.5px] uppercase tracking-wider transition-colors cursor-pointer rounded-none select-none whitespace-nowrap"
                    >
                      <span>LOGIN</span>
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      setCheckoutActive(true);
                      setCartOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-1 border border-zinc-900 bg-neutral-950 text-[#D9D6CA] hover:border-[#D9D6CA] px-2 py-1.5 text-[9px] uppercase tracking-widest transition-colors cursor-pointer rounded-none select-none"
                  >
                    <Package size={11} className={cart.length > 0 ? "text-[#D9D6CA]" : ""} />
                    <span>CART ({cart.length})</span>
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
                    animate={{ opacity: 1, height: "85vh" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-full left-0 right-0 bg-black border-b border-zinc-900 flex flex-col lg:hidden shadow-2xl z-50 overflow-y-auto"
                  >
                    <div className="p-6 pb-24 space-y-6 select-none">
                      {/* Section 0: ACCOUNT / TERMINAL GATEWAY */}
                      <div className="space-y-3 bg-neutral-950/80 border border-zinc-900 p-3.5">
                        <span className="text-[9px] tracking-[0.25em] text-[#D9D6CA] font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          TERMINAL GATEWAY
                        </span>
                        {isLoggedIn ? (
                          <div className="space-y-2.5 font-mono text-[11px] text-left">
                            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                              <div className="flex items-center gap-2 truncate">
                                <UserAvatar email={currentUserEmail} />
                                <span className="text-zinc-300 font-bold truncate text-[10px]">
                                  {(currentUserEmail || "").toLowerCase()}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  handleLogout();
                                  setMobileMenuOpen(false);
                                }}
                                className="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold cursor-pointer transition-colors"
                              >
                                LOGOUT
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5 pt-1">
                              <button
                                onClick={() => {
                                  setInfoOverlay({
                                    title: "My Licenses",
                                    subtitle: "ACCOUNT DEP",
                                    body: "",
                                    type: "my-licenses"
                                  });
                                  setMobileMenuOpen(false);
                                }}
                                className="text-left text-[#D9D6CA] hover:text-white uppercase font-bold text-[10.5px] py-1 flex items-center justify-between"
                              >
                                <span>* My Dashboard</span>
                                <span>→</span>
                              </button>

                              {((currentUserEmail || "").toLowerCase() === "evianaconcepts1@gmail.com" || (currentUserEmail || "").toLowerCase() === "admin@system.local") && (
                                <button
                                  onClick={() => {
                                    setAdminViewActive(true);
                                    setMobileMenuOpen(false);
                                  }}
                                  className="text-left text-[#D9D6CA] hover:text-white uppercase font-bold text-[10.5px] py-1 flex items-center justify-between"
                                >
                                  <span>* Admin Dashboard</span>
                                  <span>→</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  handleLinkClick("My Licenses", "ACCOUNT DEP", "my-licenses");
                                  setMobileMenuOpen(false);
                                }}
                                className="text-left text-zinc-400 hover:text-white uppercase text-[10px] py-0.5"
                              >
                                • My Licenses
                              </button>
                              <button
                                onClick={() => {
                                  handleLinkClick("My Certificates", "ACCOUNT DEP", "my-certificates");
                                  setMobileMenuOpen(false);
                                }}
                                className="text-left text-zinc-400 hover:text-white uppercase text-[10px] py-0.5"
                              >
                                • My Certificates
                              </button>
                              <button
                                onClick={() => {
                                  handleLinkClick("My Downloads", "ACCOUNT DEP", "my-downloads");
                                  setMobileMenuOpen(false);
                                }}
                                className="text-left text-zinc-400 hover:text-white uppercase text-[10px] py-0.5"
                              >
                                • My Downloads
                              </button>
                              <button
                                onClick={() => {
                                  handleLinkClick("My Requests", "ACCOUNT DEP", "my-requests");
                                  setMobileMenuOpen(false);
                                }}
                                className="text-left text-zinc-400 hover:text-white uppercase text-[10px] py-0.5"
                              >
                                • My Requests
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-left">
                            <p className="text-[10px] text-zinc-500 font-mono">Access your archive licenses & downloads.</p>
                            <button
                              onClick={() => {
                                setInfoOverlay({ title: "CONNECT TERMINAL", subtitle: "AUTH GATEWAY", body: "", type: "login" });
                                setMobileMenuOpen(false);
                              }}
                              className="w-full border border-zinc-800 bg-neutral-900 hover:border-[#D9D6CA] text-[#D9D6CA] hover:text-white font-mono text-[10.5px] font-bold uppercase tracking-wider py-2 transition-colors cursor-pointer"
                            >
                              CONNECT TERMINAL (LOGIN)
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Section Nav: MAIN NAVIGATION */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-[#D9D6CA] font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          NAVIGATION
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setActiveTab("The Owl Clock");
                              setSelectedFragment(null);
                              setCheckoutActive(false);
                              setMobileMenuOpen(false);
                            }}
                            className={`text-left font-mono text-[11px] uppercase tracking-wider py-1 cursor-pointer flex items-center justify-between ${
                              activeTab === "The Owl Clock" && !selectedFragment && !checkoutActive ? "text-white font-bold" : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            <span>* The Owl Clock</span>
                            {activeTab === "The Owl Clock" && !selectedFragment && !checkoutActive && <span className="text-[9px] text-[#D9D6CA]">[ ACTIVE ]</span>}
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab("Signal tower");
                              setSelectedFragment(null);
                              setCheckoutActive(false);
                              setMobileMenuOpen(false);
                            }}
                            className={`text-left font-mono text-[11px] uppercase tracking-wider py-1 cursor-pointer flex items-center justify-between ${
                              activeTab === "Signal tower" && !selectedFragment && !checkoutActive ? "text-white font-bold" : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            <span>* Signal Tower</span>
                            {activeTab === "Signal tower" && !selectedFragment && !checkoutActive && <span className="text-[9px] text-[#D9D6CA]">[ ACTIVE ]</span>}
                          </button>
                          <button
                            onClick={() => {
                              setCheckoutActive(true);
                              setMobileMenuOpen(false);
                            }}
                            className={`text-left font-mono text-[11px] uppercase tracking-wider py-1 cursor-pointer flex items-center justify-between ${
                              checkoutActive ? "text-white font-bold" : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            <span>* Cart / Checkout ({cart.length})</span>
                            {checkoutActive && <span className="text-[9px] text-[#D9D6CA]">[ ACTIVE ]</span>}
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-zinc-900 pt-1" />

                      {/* Section 1: ARCHIVE */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-[#D9D6CA] font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          ARCHIVE
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setSelectedFragment(null);
                              setCheckoutActive(false);
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Recovered Fragments
                          </button>
                          <button
                            onClick={() => {
                              handleOpenVerification();
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * License Verification
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-zinc-900 pt-1" />

                      {/* Section 2: CLEARANCE */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-[#D9D6CA] font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          CLEARANCE
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              handleLinkClick("Request Clearance", "CLEARANCE DEP", "request-clearance");
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Request Clearance
                          </button>
                          <button
                            onClick={() => {
                              handleOpenClearanceGuide();
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Fragment Clearance Guide
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-zinc-900 pt-1" />

                      {/* Section 3: ABOUT */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-[#D9D6CA] font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          ABOUT
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              handleOpenAbout();
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * About the Archive
                          </button>
                          <button
                            onClick={() => {
                              handleOpenContact();
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Contact
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-zinc-900 pt-1" />

                      {/* Section 4: LEGAL */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-[#D9D6CA] font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          LEGAL
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              handleOpenTerms();
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Terms of Use
                          </button>
                          <button
                            onClick={() => {
                              handleOpenPrivacy();
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Privacy Policy
                          </button>
                          <button
                            onClick={() => {
                              handleOpenCookies();
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Cookie Policy
                          </button>
                          <button
                            onClick={() => {
                              handleOpenRefunds();
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Refund Policy
                          </button>
                          <button
                            onClick={() => {
                              handleOpenAcceptableUse();
                              setMobileMenuOpen(false);
                            }}
                            className="text-left font-mono text-[11px] uppercase tracking-wider py-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            * Acceptable Use Policy
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-zinc-900 pt-1" />

                      {/* Section 5: TRANSMISSIONS */}
                      <div className="space-y-3">
                        <span className="text-[10px] tracking-[0.25em] text-[#D9D6CA] font-bold block uppercase border-b border-zinc-900 pb-1 text-left">
                          TRANSMISSIONS
                        </span>
                        <div className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                          <a 
                            href="https://www.instagram.com/theowlclock?igsh=YnFqOTRxajB2Ymdw" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-white py-1 flex items-center justify-between"
                          >
                            <span>* Instagram</span>
                            <span className="text-zinc-600 text-[9px]">↗</span>
                          </a>
                          <a 
                            href="https://www.tiktok.com/@theowlclock?_r=1&_t=ZT-97pM43i63Fm" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-white py-1 flex items-center justify-between"
                          >
                            <span>* TikTok</span>
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
                onOpenTerms={handleOpenTerms}
                onOpenPrivacy={handleOpenPrivacy}
                onOpenRefunds={handleOpenRefunds}
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
                    : selectedFragment
                    ? "py-1 sm:py-4"
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
                    {activeTab === "Signal tower" && (
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
              <footer id="site-footer" className="bg-black py-6 md:py-16 px-4 md:px-8 select-none flex flex-col">
                {/* Upper line decoration */}
                <div className="flex items-center justify-center gap-3 w-full max-w-7xl mx-auto opacity-25 mb-4 md:mb-12">
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
                          onClick={handleOpenOwlClock}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          Recovered Fragments
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => handleOpenVerification()}
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
                      <li>
                        <button 
                          onClick={() => handleLinkClick("Request Clearance", "CLEARANCE DEP", "request-clearance")}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          Request Clearance
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => handleOpenClearanceGuide()}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          Fragment Clearance Guide
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 3: ABOUT */}
                  <div className="space-y-4">
                    <h5 className="text-[11px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase">
                      ABOUT
                    </h5>
                    <ul className="space-y-2.5 text-[10.5px] text-zinc-400 font-mono">
                      <li>
                        <button 
                          onClick={() => handleOpenAbout()}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          About the Archive
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => handleOpenContact()}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          Contact
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 4: LEGAL */}
                  <div className="space-y-4">
                    <h5 className="text-[11px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase">
                      LEGAL
                    </h5>
                    <ul className="space-y-2.5 text-[10.5px] text-zinc-400 font-mono">
                      {[
                        { name: "Terms of Use", action: handleOpenTerms },
                        { name: "Privacy Policy", action: handleOpenPrivacy },
                        { name: "Cookie Policy", action: handleOpenCookies },
                        { name: "Refund Policy", action: handleOpenRefunds },
                        { name: "Acceptable Use Policy", action: handleOpenAcceptableUse }
                      ].map((item) => (
                        <li key={item.name}>
                          <button 
                            onClick={item.action}
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
                      <li>
                        <a 
                          href="https://www.instagram.com/theowlclock?igsh=YnFqOTRxajB2Ymdw" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer uppercase"
                        >
                          <span>Instagram</span>
                          <span className="text-zinc-600 text-[9px]">↗</span>
                        </a>
                      </li>
                      <li>
                        <a 
                          href="https://www.tiktok.com/@theowlclock?_r=1&_t=ZT-97pM43i63Fm" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer uppercase"
                        >
                          <span>TikTok</span>
                          <span className="text-zinc-600 text-[9px]">↗</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* 2. MOBILE FOOTER STRUCTURE (Accordion-style for screens smaller than md) */}
                <div className="md:hidden flex flex-col w-full max-w-md mx-auto mb-6 md:mb-12 border-t border-zinc-900 divide-y divide-zinc-900">
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
                          onClick={handleOpenOwlClock}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          * Recovered Fragments
                        </button>
                        <button 
                          onClick={() => handleOpenVerification()}
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
                        <button 
                          onClick={() => handleLinkClick("Request Clearance", "CLEARANCE DEP", "request-clearance")}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          * Request Clearance
                        </button>
                        <button 
                          onClick={() => handleOpenClearanceGuide()}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          * Fragment Clearance Guide
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 3: ABOUT */}
                  <div className="py-3">
                    <button 
                      onClick={() => toggleMobileFooterSection("ABOUT")}
                      className="w-full flex justify-between items-center text-[10.5px] tracking-[0.2em] font-bold text-[#D9D6CA] uppercase font-mono py-1.5"
                    >
                      <span>ABOUT</span>
                      <span className="text-xs text-zinc-500">{mobileFooterExpanded.ABOUT ? "−" : "+"}</span>
                    </button>
                    {mobileFooterExpanded.ABOUT && (
                      <div className="pt-2.5 pb-2 pl-3 flex flex-col gap-2.5 text-[10px] text-zinc-400 font-mono text-left">
                        <button 
                          onClick={() => handleOpenAbout()}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          * About the Archive
                        </button>
                        <button 
                          onClick={() => handleOpenContact()}
                          className="hover:text-white transition-colors cursor-pointer text-left block"
                        >
                          * Contact
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 4: LEGAL */}
                  <div className="py-3">
                    <button 
                      onClick={() => toggleMobileFooterSection("LEGAL")}
                      className="w-full flex justify-between items-center text-[10.5px] tracking-[0.2em] font-bold text-[#D9D6CA] uppercase font-mono py-1.5"
                    >
                      <span>LEGAL</span>
                      <span className="text-xs text-zinc-500">{mobileFooterExpanded.LEGAL ? "−" : "+"}</span>
                    </button>
                    {mobileFooterExpanded.LEGAL && (
                      <div className="pt-2.5 pb-2 pl-3 flex flex-col gap-2.5 text-[10px] text-zinc-400 font-mono text-left">
                        {[
                          { name: "Terms of Use", action: handleOpenTerms },
                          { name: "Privacy Policy", action: handleOpenPrivacy },
                          { name: "Cookie Policy", action: handleOpenCookies },
                          { name: "Refund Policy", action: handleOpenRefunds },
                          { name: "Acceptable Use Policy", action: handleOpenAcceptableUse }
                        ].map((item) => (
                          <button 
                            key={item.name}
                            onClick={item.action}
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
                        <a 
                          href="https://www.instagram.com/theowlclock?igsh=YnFqOTRxajB2Ymdw" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer uppercase"
                        >
                          <span>* Instagram</span>
                          <span className="text-zinc-600 text-[9px]">↗</span>
                        </a>
                        <a 
                          href="https://www.tiktok.com/@theowlclock?_r=1&_t=ZT-97pM43i63Fm" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer uppercase"
                        >
                          <span>* TikTok</span>
                          <span className="text-zinc-600 text-[9px]">↗</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM FOOTER LINE */}
                <div className="text-center font-mono space-y-2.5 tracking-[0.2em] max-w-4xl mx-auto w-full border-t border-zinc-950 pt-10 pb-6">
                  <div className="space-y-1">
                    <h6 className="text-[#D9D6CA] font-bold text-[11px] uppercase tracking-[0.3em]">
                      THE OWL CLOCK
                    </h6>
                    <p className="text-zinc-500 text-[9px] uppercase tracking-widest">
                      Publishing • Rights Management • Licensing
                    </p>
                    <p className="text-zinc-500 text-[9px] uppercase tracking-widest">
                      Atlanta, Georgia
                    </p>
                    <p className="text-zinc-600 text-[8.5px] pt-3 uppercase">
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
                  id="crate-dropdown"
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
              onOpenTerms={handleOpenTerms}
              onOpenPrivacy={handleOpenPrivacy}
              onOpenCookies={handleOpenCookies}
              onOpenRefunds={handleOpenRefunds}
              onOpenAcceptableUse={handleOpenAcceptableUse}
            />

            {/* Cookie Consent Banner */}
            <CookieConsentBanner
              onOpenCookiePolicy={handleOpenCookies}
              onOpenPrivacyPolicy={handleOpenPrivacy}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
