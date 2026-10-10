import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ArrowUpRight, ChevronRight, Trash2, Mail, Phone, MapPin, 
  Building, CreditCard, ShieldCheck, ChevronDown, Check, Info,
  FileText, Download, Copy, CheckCircle2, Scale, ExternalLink,
  Package, Clock
} from "lucide-react";
import { CartItem } from "../App";
import { DEFAULT_LICENSE_TEMPLATES, PAYPAL_HOSTED_PLANS } from "../licenses";
import { 
  openOrDownloadLicenseAgreement, 
  downloadBeatZipPackage,
  generateFullAgreementText,
  getScheduleAData,
  getScheduleBData,
  getLegalArticlesForTier,
  normalizeTierId,
  resolveLicenseeAddress,
  LicenseAgreementData 
} from "../lib/licenseAgreements";
import { markFragmentExclusivelyAcquired, isFragmentExclusivelyAcquired } from "../lib/fragmentService";
import { getFragmentTimeName } from "../data";

interface CheckoutPageProps {
  cart: CartItem[];
  onRemoveItem: (id: string) => void;
  onClose: () => void;
  onClearCart: () => void;
  isLoggedIn: boolean;
  currentUserEmail: string;
  authToken: string | null;
  onLoginSuccess: (email: string, token: string) => void;
  initialStep?: "cart" | "auth" | "billing" | "paypal" | "success";
  emailPreviewUrl?: string;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenRefunds?: () => void;
  onOpenLicenseAgreement?: () => void;
  onOpenDashboard?: () => void;
}

type CheckoutStep = "cart" | "auth" | "billing" | "paypal" | "success";

export default function CheckoutPage({ 
  cart, 
  onRemoveItem, 
  onClose, 
  onClearCart,
  isLoggedIn,
  currentUserEmail,
  authToken,
  onLoginSuccess,
  initialStep = "cart",
  emailPreviewUrl = "",
  onOpenTerms,
  onOpenPrivacy,
  onOpenRefunds,
  onOpenLicenseAgreement,
  onOpenDashboard
}: CheckoutPageProps) {
  const [step, setStep] = useState<CheckoutStep>(initialStep);

  const handleViewLicenseAgreement = () => {
    if (onOpenLicenseAgreement) {
      onOpenLicenseAgreement();
      return;
    }
    const item = cart[0];
    openOrDownloadLicenseAgreement({
      licenseId: `TOC-LIC-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(100 + Math.random() * 900)}`,
      transactionRef: `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
      purchaseDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      licenseeLegalName: `${firstName} ${lastName}`.trim() || email || currentUserEmail || "Authorized Licensee",
      licenseeEmail: email || currentUserEmail || "guest@lomon.local",
      fragmentTitle: item ? item.name : "Fragment Archive Sample",
      archiveIdentifier: item ? `TOC-${(item.id || item.fragmentId || "FRAG").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001` : "TOC-ARCHIVE-001",
      licenseTierId: item ? item.tierId : "access",
      licenseTierTitle: item ? item.tierTitle : "Archive Access License"
    });
  };
  const [couponChecked, setCouponChecked] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Terms agreement state (MUST NOT be preselected)
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState("");

  // Authentication states
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Billing states
  const getSavedBilling = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("lomon_user_billing");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };
  const savedBilling = getSavedBilling();

  const [isBusiness, setIsBusiness] = useState(false);
  const [firstName, setFirstName] = useState(savedBilling?.firstName || "John");
  const [lastName, setLastName] = useState(savedBilling?.lastName || "Nwanne");
  const [email, setEmail] = useState(currentUserEmail || savedBilling?.email || "evianaconcepts1@gmail.com");
  const [phone, setPhone] = useState(savedBilling?.phone || "+234 803 123 4567");
  const [companyName, setCompanyName] = useState(savedBilling?.companyName || "");
  const [streetAddress, setStreetAddress] = useState(savedBilling?.streetAddress || "12 Broad Street");
  const [aptNumber, setAptNumber] = useState(savedBilling?.aptNumber || "Suite 4B");
  const [city, setCity] = useState(savedBilling?.city || "Lagos");
  const [zipCode, setZipCode] = useState(savedBilling?.zipCode || "100001");
  const [country, setCountry] = useState(savedBilling?.country || "Nigeria (NG)");
  const [stateProvince, setStateProvince] = useState(savedBilling?.stateProvince || "Lagos");

  const currentFullAddress = [streetAddress, aptNumber, city, stateProvince, zipCode, country].filter(Boolean).join(", ") || "12 Broad Street, Suite 4B, Lagos 100001, Nigeria (NG)";

  // License review state
  const [reviewLicenseItem, setReviewLicenseItem] = useState<CartItem | null>(null);
  const [reviewModalTab, setReviewModalTab] = useState<"summary" | "fullText">("summary");
  const [copiedContract, setCopiedContract] = useState(false);

  // PayPal payment interface state
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const [paypalError, setPaypalError] = useState("");
  const [paypalApproveUrl, setPaypalApproveUrl] = useState<string>("");
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [settlementStatus, setSettlementStatus] = useState<"IDLE" | "POLLING" | "SETTLED" | "FAILED">("IDLE");
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Authentication Pre-check: Require active session based on current auth setup before initiating checkout
  useEffect(() => {
    if (!isLoggedIn || !authToken) {
      try {
        sessionStorage.setItem("lomon_saved_cart", JSON.stringify(cart));
      } catch (_e) {}
      if (step !== "auth") {
        setStep("auth");
      }
    }
  }, [isLoggedIn, authToken, step, cart]);

  useEffect(() => {
    fetch("/api/system/status")
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.live === "boolean") {
          setIsLiveMode(data.live);
        }
      })
      .catch(() => {});
  }, []);

  // Bulk deals dropdown toggle
  const [bulkDealsOpen, setBulkDealsOpen] = useState(false);

  // Calculate totals
  const itemTotal = cart.reduce((sum, item) => {
    const numericPrice = parseFloat(item.price.replace(/[^0-9.]/g, "")) || 0;
    return sum + numericPrice;
  }, 0);

  const subtotal = Math.max(0, itemTotal - discount);

  // Dynamically resolve the official PayPal hosted plan for the current cart/item
  const matchedPlan = useMemo(() => {
    const firstItem = cart[0];
    const candidateTier = (firstItem?.tierId || "").toLowerCase();
    const itemPrice = parseFloat(firstItem?.price?.replace(/[^0-9.]/g, "") || "0");
    
    if (candidateTier.includes("exclusive") || candidateTier === "exclusive" || itemPrice >= 4500) {
      return PAYPAL_HOSTED_PLANS["TOC-EAA"];
    }
    if (candidateTier.includes("commercial") || candidateTier.includes("exploit") || itemPrice >= 900) {
      return PAYPAL_HOSTED_PLANS["TOC-CEL"];
    }
    if (candidateTier.includes("release") || itemPrice >= 400) {
      return PAYPAL_HOSTED_PLANS["TOC-CRL"];
    }
    if (candidateTier.includes("sync")) {
      return PAYPAL_HOSTED_PLANS["TOC-SML"];
    }
    if (candidateTier.includes("collab")) {
      return PAYPAL_HOSTED_PLANS["TOC-PCOL"];
    }
    return PAYPAL_HOSTED_PLANS["TOC-AAL"];
  }, [cart]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = (couponCode || "").toUpperCase();
    if (code === "OWL20") {
      setDiscount(itemTotal * 0.20);
      setCouponApplied(true);
    } else if (code === "SIGNAL15") {
      setDiscount(itemTotal * 0.15);
      setCouponApplied(true);
    } else {
      alert("Invalid coupon code. Try 'OWL20' for 20% off or 'SIGNAL15' for 15% off.");
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError("Email and Password are required.");
      return;
    }
    setAuthError("");
    setIsSubmittingAuth(true);

    try {
      const endpoint = isSigningUp ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail.toLowerCase(), password: authPassword })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          onLoginSuccess(data.email, data.token);
          setEmail(data.email);
          setStep("billing");
          return;
        } else if (data && data.error) {
          setAuthError(data.error);
          return;
        }
      }

      // Client-side fallback authentication
      const userEmail = authEmail.toLowerCase();
      const mockToken = "usr_" + Math.random().toString(36).substring(2, 10);
      onLoginSuccess(userEmail, mockToken);
      setEmail(userEmail);
      setStep("billing");
    } catch (_err) {
      const userEmail = authEmail.toLowerCase();
      const mockToken = "usr_" + Math.random().toString(36).substring(2, 10);
      onLoginSuccess(userEmail, mockToken);
      setEmail(userEmail);
      setStep("billing");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !authToken) {
      try {
        sessionStorage.setItem("lomon_saved_cart", JSON.stringify(cart));
      } catch (_e) {}
      setStep("auth");
      return;
    }
    if (!firstName || !lastName || !email || !streetAddress || !city || !stateProvince) {
      alert("Please fill in all required fields.");
      return;
    }
    if (!agreedToTerms) {
      setTermsError("You must read and agree to the Terms of Use and License Agreement before completing your purchase.");
      return;
    }
    setTermsError("");
    setStep("paypal");
  };

  const initiateRedirect = async (e?: React.FormEvent, isUserClick: boolean = false) => {
    if (e) e.preventDefault();
    if (!isLoggedIn || !authToken) {
      try {
        sessionStorage.setItem("lomon_saved_cart", JSON.stringify(cart));
      } catch (_e) {}
      setStep("auth");
      return;
    }
    setPaypalError("");
    setPaypalProcessing(true);

    try {
      const buyerEmail = (email || currentUserEmail || "evianaconcepts1@gmail.com").toLowerCase().trim();
      const legalName = `${firstName} ${lastName}`.trim() || buyerEmail;

      // Save pending purchase details to localStorage for session recovery
      try {
        localStorage.setItem("lomon_pending_purchase", JSON.stringify(cart));
        localStorage.setItem("lomon_pending_email", buyerEmail);
        localStorage.setItem("lomon_user_address", currentFullAddress);
        localStorage.setItem("lomon_user_billing", JSON.stringify({
          firstName, lastName, email: buyerEmail, phone, companyName,
          streetAddress, aptNumber, city, stateProvince, zipCode, country,
          licenseeAddress: currentFullAddress
        }));
      } catch (_e) {}

      // Create order on the backend with verified pricing and active auth token
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          email: buyerEmail,
          licenseeLegalName: legalName,
          billing: { firstName, lastName, streetAddress, city, stateProvince, zipCode, country },
          amount: subtotal,
          couponCode: couponApplied ? couponCode : undefined,
          items: cart.map(item => ({
            fragmentId: item.id,
            name: item.name,
            tierId: item.tierId,
            tierTitle: item.tierTitle,
            price: item.price,
            artwork: item.artwork
          }))
        })
      });

      let initData: any = null;
      const rawText = await response.text();
      try {
        initData = JSON.parse(rawText);
      } catch (_jsonErr) {
        console.warn("[PAYPAL] Non-JSON response received from server:", rawText);
        throw new Error(
          rawText.includes("A server error") || response.status === 504 || response.status === 500
            ? "Server connection error. Please retry your transaction."
            : `Server response error (${response.status}): ${rawText.substring(0, 100)}`
        );
      }

      if (!initData.success) {
        throw new Error(initData.error || "Failed to initialize PayPal transaction with backend.");
      }

      if (initData.orderID) {
        setCurrentOrderId(initData.orderID);
        setSettlementStatus("POLLING");
      }

      if (initData.approveUrl) {
        setPaypalApproveUrl(initData.approveUrl);
        const inIframe = typeof window !== "undefined" && window.self !== window.top;
        if (inIframe) {
          const paymentWindow = window.open(initData.approveUrl, "_blank");
          setPaypalProcessing(false);
          if (!paymentWindow) {
            setPaypalError("Click the PayPal button below to open your payment gateway in a secure tab.");
          }
        } else {
          // On live application, navigate to PayPal portal
          window.location.href = initData.approveUrl;
        }
      } else {
        throw new Error("PayPal authorization URL was not returned by gateway.");
      }
    } catch (err: any) {
      console.error("[PAYPAL] Error during initialization:", err);
      setPaypalProcessing(false);
      setPaypalError(err.message || "Failed to initialize PayPal transaction.");
    }
  };

  // Frontend Polling Logic: Monitor PayPal settlement confirmation from server
  useEffect(() => {
    let isMounted = true;
    let pollTimer: any = null;

    if (step === "paypal" && currentOrderId && settlementStatus === "POLLING") {
      const checkSettlement = async () => {
        try {
          const res = await fetch(`/api/paypal/order-status/${encodeURIComponent(currentOrderId)}`, {
            headers: {
              ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
            }
          });
          if (!res.ok) return;
          const data = await res.json().catch(() => null);

          if (data && data.status === "COMPLETED" && isMounted) {
            setSettlementStatus("SETTLED");

            // Apply server-verified licenses to client store
            const verifiedLicenses = data.licenses || [];
            if (verifiedLicenses.length > 0) {
              const savedRaw = localStorage.getItem("lomon_user_licenses");
              const existing = savedRaw ? JSON.parse(savedRaw) : [];
              const map = new Map();
              existing.forEach((l: any) => map.set(l.id || l.song, l));
              verifiedLicenses.forEach((l: any) => map.set(l.id || l.song, l));
              localStorage.setItem("lomon_user_licenses", JSON.stringify(Array.from(map.values())));
              window.dispatchEvent(new CustomEvent("lomon_licenses_updated"));
              window.dispatchEvent(new CustomEvent("lomon_transaction_recorded", { detail: data.transaction }));
            }

            try {
              sessionStorage.removeItem("lomon_saved_cart");
              localStorage.removeItem("lomon_pending_purchase");
            } catch (_e) {}

            onClearCart();
            setStep("success");
          }
        } catch (_pollErr) {}
      };

      // Run immediate check and then poll server settlement endpoint every 2.5 seconds
      checkSettlement();
      pollTimer = setInterval(checkSettlement, 2500);
    }

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [step, currentOrderId, settlementStatus, authToken, onClearCart]);

  const handleVerifySettlementNow = async () => {
    if (!currentOrderId) return;
    setPaypalProcessing(true);
    setPaypalError("");
    try {
      const res = await fetch(`/api/paypal/order-status/${encodeURIComponent(currentOrderId)}`, {
        headers: {
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        }
      });
      const data = await res.json().catch(() => null);
      if (data && data.status === "COMPLETED") {
        setSettlementStatus("SETTLED");
        const verifiedLicenses = data.licenses || [];
        if (verifiedLicenses.length > 0) {
          const savedRaw = localStorage.getItem("lomon_user_licenses");
          const existing = savedRaw ? JSON.parse(savedRaw) : [];
          const map = new Map();
          existing.forEach((l: any) => map.set(l.id || l.song, l));
          verifiedLicenses.forEach((l: any) => map.set(l.id || l.song, l));
          localStorage.setItem("lomon_user_licenses", JSON.stringify(Array.from(map.values())));
          window.dispatchEvent(new CustomEvent("lomon_licenses_updated"));
          window.dispatchEvent(new CustomEvent("lomon_transaction_recorded", { detail: data.transaction }));
        }
        try {
          sessionStorage.removeItem("lomon_saved_cart");
          localStorage.removeItem("lomon_pending_purchase");
        } catch (_e) {}
        onClearCart();
        setStep("success");
      } else {
        setPaypalError("PayPal settlement confirmation is pending. Please complete transaction on PayPal.");
      }
    } catch (err: any) {
      setPaypalError(err.message || "Failed to confirm settlement with server.");
    } finally {
      setPaypalProcessing(false);
    }
  };

  // Trigger redirect automatically when step changes to 'paypal'
  useEffect(() => {
    if (step === "paypal") {
      initiateRedirect();
    }
  }, [step]);

  // Keep email state updated when currentUserEmail changes (e.g., after callback auto-login)
  useEffect(() => {
    if (currentUserEmail) {
      setEmail(currentUserEmail);
    }
  }, [currentUserEmail]);

  const handleAuthorizeDirectSandbox = async () => {
    setPaypalProcessing(true);
    setPaypalError("");
    try {
      const buyerEmail = (email || currentUserEmail || "evianaconcepts1@gmail.com").toLowerCase().trim();
      const sandboxOrderId = currentOrderId || `SANDBOX-${Date.now()}`;

      localStorage.setItem("lomon_user_address", currentFullAddress);
      localStorage.setItem("lomon_user_billing", JSON.stringify({
        firstName, lastName, email: buyerEmail, phone, companyName,
        streetAddress, aptNumber, city, stateProvince, zipCode, country,
        licenseeAddress: currentFullAddress
      }));

      // Call server /api/paypal/capture-order with verified auth token
      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          orderID: sandboxOrderId,
          billing: { firstName, lastName, streetAddress, aptNumber, city, stateProvince, zipCode, country },
          items: cart.map(item => ({
            fragmentId: item.id,
            name: item.name,
            tierId: item.tierId,
            tierTitle: item.tierTitle,
            price: item.price,
            artwork: item.artwork
          }))
        })
      });

      const data = await response.json().catch(() => null);

      if (data && data.success && data.status === "COMPLETED") {
        setSettlementStatus("SETTLED");
        const verifiedLicenses = data.licenses || [];
        if (verifiedLicenses.length > 0) {
          const savedRaw = localStorage.getItem("lomon_user_licenses");
          const existing = savedRaw ? JSON.parse(savedRaw) : [];
          const map = new Map();
          existing.forEach((l: any) => map.set(l.id || l.song, l));
          verifiedLicenses.forEach((l: any) => map.set(l.id || l.song, l));
          localStorage.setItem("lomon_user_licenses", JSON.stringify(Array.from(map.values())));
          window.dispatchEvent(new CustomEvent("lomon_licenses_updated"));
        }
        try {
          sessionStorage.removeItem("lomon_saved_cart");
          localStorage.removeItem("lomon_pending_purchase");
        } catch (_e) {}
        onClearCart();
        setStep("success");
      } else {
        throw new Error(data?.error || "Could not confirm settlement with server.");
      }
    } catch (err: any) {
      setPaypalError(err.message || "Failed to finalize clearance transaction.");
    } finally {
      setPaypalProcessing(false);
    }
  };

  const handleCompleteAll = () => {
    onClearCart();
    onClose();
  };

  return (
    <div className="checkout-page dashboard-page w-full min-h-screen bg-black text-[#D9D6CA] font-sans py-12 px-4 md:px-8 select-none">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumb Indicator */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-8 border-b border-zinc-950 pb-4">
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={onClose} 
              className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              ARCHIVE
            </button>
            <ChevronRight size={10} className="text-zinc-650 shrink-0" />
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className={`whitespace-nowrap ${step === "cart" ? "text-[#D9D6CA] font-extrabold" : "text-zinc-500"}`}>
              01. CART
            </span>
            <ChevronRight size={10} className="text-zinc-650 shrink-0" />
          </div>

          {!isLoggedIn && (
            <div className="flex items-center gap-2 shrink-0">
              <span className={`whitespace-nowrap ${step === "auth" ? "text-[#D9D6CA] font-extrabold" : "text-zinc-500"}`}>
                02. ACCOUNT ACCESS
              </span>
              <ChevronRight size={10} className="text-zinc-650 shrink-0" />
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <span className={`whitespace-nowrap ${step === "billing" ? "text-[#D9D6CA] font-extrabold" : "text-zinc-500"}`}>
              {isLoggedIn ? "02. BILLING INFO" : "03. BILLING INFO"}
            </span>
            <ChevronRight size={10} className="text-zinc-650 shrink-0" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`whitespace-nowrap ${step === "paypal" ? "text-[#D9D6CA] font-extrabold" : "text-zinc-500"}`}>
              {isLoggedIn ? "03. SECURE GATEWAY" : "04. SECURE GATEWAY"}
            </span>
          </div>
        </div>

        {step !== "success" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* LEFT COLUMN: Stage specific flow */}
            <div className="lg:col-span-8 space-y-8">
              <AnimatePresence mode="wait">
                
                {/* STEP 1: CART VIEW */}
                {step === "cart" && (
                  <motion.div
                    key="cart-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide font-sans">
                        Cart
                      </h1>
                    </div>



                    {/* Cart Items list */}
                    {cart.length === 0 ? (
                      <div className="text-center py-20 border border-zinc-900 border-dashed rounded-sm">
                        <span className="text-zinc-500 uppercase tracking-[0.25em] text-xs font-mono">
                          YOUR MEDIA VAULT IS EMPTY. CHOOSE A SECURED TEMPORAL FRAGMENT FROM THE CLOCK.
                        </span>
                        <button
                          onClick={onClose}
                          className="mt-6 border border-zinc-900 bg-neutral-950 hover:border-white text-white px-5 py-2.5 text-[10px] tracking-widest uppercase block mx-auto transition-all cursor-pointer rounded-[4px]"
                        >
                          Back to Clock
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Table Header Row */}
                        <div className="flex justify-between border-b border-zinc-900 pb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest select-none">
                          <span>PRODUCT</span>
                          <span className="pr-[230px] hidden md:inline">PRICE</span>
                          <span className="md:hidden">PRICE</span>
                        </div>

                        {/* Items */}
                        <div className="space-y-4">
                          {cart.map((item) => {
                            const isAcquiredExclusively = isFragmentExclusivelyAcquired(item.fragmentId || item.id) || isFragmentExclusivelyAcquired(item.name);

                            return (
                            <div 
                              key={item.id} 
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-950 pb-4 ${
                                isAcquiredExclusively ? "opacity-75 bg-red-950/10 p-2 rounded border border-red-900/30" : ""
                              }`}
                            >
                              {/* Left details */}
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="relative w-16 h-16 bg-zinc-950 border border-zinc-900 overflow-hidden rounded-md shrink-0 flex-none group">
                                  <img 
                                    src={item.artwork} 
                                    alt={item.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity"
                                  />
                                  {/* Custom circular Translucent play icon - solid bone/sand circle with black play triangle as in image */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 bg-[#D9D6CA] rounded-full flex items-center justify-center shadow-lg">
                                      <span className="text-black text-[11px] pl-0.5">▶</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-left min-w-0">
                                  <h4 className="text-white font-extrabold text-[15px] tracking-wide leading-tight truncate font-sans">
                                    {`FRAGMENT ${getFragmentTimeName(item.name).replace(/\s*\/\/\s*LOMON CO-SIGN/gi, "").replace(/^FRAGMENT\s*/i, "")} . LOMON CO-SIGN`}
                                  </h4>
                                  <p className="text-zinc-500 text-[10.5px] mt-1 uppercase tracking-wider font-normal font-sans">
                                    TRACK • {
                                      item.tierId === "access" || item.price === "$150" || item.price === "$150.00"
                                        ? "ARCHIVE ACCESS LICENSE [TOC-AAL] (WAV, MP3)"
                                        : item.tierId === "release" || item.price === "$500" || item.price === "$500.00"
                                        ? "COMMERCIAL RELEASE LICENSE [TOC-CRL] (LOSSLESS WAV, MP3)"
                                        : item.tierId === "commercial" || item.price === "$1,000" || item.price === "$1000"
                                        ? "COMMERCIAL EXPLOITATION LICENSE [TOC-CEL] (STEMS, WAV, MP3)"
                                        : item.tierId === "exclusive" || item.price === "$5,000" || item.price === "$5000"
                                        ? "EXCLUSIVE ARCHIVE ACQUISITION [TOC-EAA] (FULL MASTER & STEMS)"
                                        : item.tierId === "sync"
                                        ? "SYNCHRONIZATION & MASTER LICENSE [TOC-SML]"
                                        : item.tierId === "collaboration"
                                        ? "PRODUCER COLLABORATION [TOC-PCOL]"
                                        : "COMMERCIAL LICENSE [TOC-AAL] (WAV, MP3)"
                                    }
                                  </p>
                                  {isAcquiredExclusively && (
                                    <div className="text-red-400 font-mono text-[9px] uppercase tracking-widest mt-1 font-bold">
                                      ⚠ EXCLUSIVELY ACQUIRED — PERMANENTLY RETIRED FROM ARCHIVE
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right details */}
                              <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                                <span className="text-white font-sans font-extrabold text-base sm:text-lg min-w-[80px] text-right">
                                  {item.price}
                                </span>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setReviewLicenseItem(item)}
                                    className="bg-[#D9D6CA] hover:bg-white text-black font-sans font-extrabold text-[10px] uppercase px-4 py-2.5 tracking-widest transition-all rounded-[4px] cursor-pointer"
                                  >
                                    REVIEW LICENSE
                                  </button>
                                  <button
                                    onClick={() => onRemoveItem(item.id)}
                                    className="text-zinc-500 hover:text-white p-2 transition-colors cursor-pointer"
                                    title="Remove item"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>


                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 1.5: ACCOUNT ACCESS AUTH VIEW */}
                {step === "auth" && (
                  <motion.div
                    key="auth-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 max-w-md mx-auto border border-zinc-900 bg-neutral-950/40 p-6 sm:p-8 rounded-[4px]"
                  >
                    <div className="space-y-2 border-b border-zinc-900 pb-4 text-center">
                      <h2 className="text-xl font-extrabold text-white tracking-[0.2em] uppercase font-sans">
                        ACCOUNT ACCESS
                      </h2>
                      <p className="text-zinc-500 text-[10px] tracking-widest uppercase font-mono">
                        Sign in or create an account to complete your order
                      </p>
                    </div>

                    {/* Authentication Pre-check Notice */}
                    <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-[4px] text-left space-y-1">
                      <div className="flex items-center gap-2 text-white font-bold text-[10px] tracking-widest uppercase font-mono">
                        <Lock size={12} className="text-[#00E676]" />
                        <span>AUTHENTICATION REQUIRED BEFORE CHECKOUT</span>
                      </div>
                      <p className="text-zinc-400 text-[10.5px] font-sans leading-relaxed">
                        An active account session is required before checkout. Your cart has been saved in session storage and will automatically resume once signed in.
                      </p>
                    </div>

                    {/* Simple toggle between login and register */}
                    <div className="flex border border-zinc-900 font-mono text-[9px] uppercase tracking-wider rounded-[4px] overflow-hidden">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsSigningUp(false);
                          setAuthError("");
                        }}
                        className={`flex-1 py-2.5 text-center border-r border-zinc-900 cursor-pointer transition-all duration-200 ${!isSigningUp ? "bg-[#D9D6CA] text-black font-extrabold shadow-inner" : "text-zinc-500 hover:text-white bg-black/40"}`}
                      >
                        Sign In
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsSigningUp(true);
                          setAuthError("");
                        }}
                        className={`flex-1 py-2.5 text-center cursor-pointer transition-all duration-200 ${isSigningUp ? "bg-[#D9D6CA] text-black font-extrabold shadow-inner" : "text-zinc-500 hover:text-white bg-black/40"}`}
                      >
                        Sign Up
                      </button>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-4 auth-form">
                      {authError && (
                        <div className="p-3 bg-red-950/10 border border-red-500/20 text-red-400 text-[10px] font-mono uppercase text-center rounded-[2px]">
                          {authError}
                        </div>
                      )}

                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.15em] block">
                          Email Address *
                        </label>
                        <input 
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.15em] block">
                          Password *
                        </label>
                        <input 
                          type="password"
                          required
                          placeholder="••••••••••••"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-350 outline-none focus:border-[#D9D6CA] transition-all font-mono"
                        />
                      </div>

                      <div className="pt-2">
                        <button 
                          type="submit"
                          disabled={isSubmittingAuth}
                          className="w-full bg-[#D9D6CA] text-black hover:bg-white font-sans font-extrabold text-[12px] tracking-widest py-3.5 transition-colors duration-200 rounded-[4px] cursor-pointer shadow-lg uppercase"
                        >
                          {isSubmittingAuth ? "PLEASE WAIT..." : isSigningUp ? "CREATE ACCOUNT" : "SIGN IN"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep("cart")}
                        className="w-full text-zinc-650 hover:text-zinc-450 text-[9px] tracking-widest font-mono uppercase text-center cursor-pointer py-1 block transition-colors mt-2"
                      >
                        &lt; Return to Cart
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 2: BILLING INFORMATION FORM */}
                {step === "billing" && (
                  <motion.div
                    key="billing-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 text-left"
                  >
                    <div className="border-b border-zinc-900 pb-4">
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide">
                        Billing Information
                      </h1>
                    </div>

                    <form onSubmit={handleBillingSubmit} className="space-y-6">
                      
                      {/* Business checkbox */}
                      <label className="flex items-center gap-2.5 cursor-pointer group select-none py-1">
                        <input 
                          type="checkbox"
                          checked={isBusiness}
                          onChange={(e) => setIsBusiness(e.target.checked)}
                          className="w-3.5 h-3.5 rounded-sm border border-zinc-800 bg-neutral-950 accent-[#D9D6CA] cursor-pointer"
                        />
                        <span className="text-[10px] uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
                          I am purchasing as a business
                        </span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-sans text-left">
                        {/* Name */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                            FIRST NAME*
                          </label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. John"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                            LAST NAME*
                          </label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Nwanne"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all"
                          />
                        </div>

                        {/* Contact */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                            E-MAIL ADDRESS*
                          </label>
                          <input 
                            type="email"
                            required
                            placeholder="your.email@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                            PHONE NUMBER
                          </label>
                          <input 
                            type="tel"
                            placeholder="e.g. +234 800 000 0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all"
                          />
                        </div>

                        {/* Optional Company */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                            COMPANY NAME (OPTIONAL)
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. Eviana Concepts Ltd"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all"
                          />
                        </div>

                        {/* Street and Unit */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                            STREET ADDRESS*
                          </label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. 15 Ikoyi Road"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                            APT./UNIT NUMBER
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. Suite 4B"
                            value={aptNumber}
                            onChange={(e) => setAptNumber(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all"
                          />
                        </div>

                        {/* City and Zip */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                            CITY (OR TOWN)*
                          </label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Lagos"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                            ZIP/POSTAL CODE*
                          </label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. 101233"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all"
                          />
                        </div>

                        {/* Country and State */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                            COUNTRY
                          </label>
                          <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all appearance-none"
                          >
                            <option value="Nigeria (NG)">Nigeria (NG)</option>
                            <option value="United States (US)">United States (US)</option>
                            <option value="United Kingdom (GB)">United Kingdom (GB)</option>
                            <option value="Ghana (GH)">Ghana (GH)</option>
                            <option value="South Africa (ZA)">South Africa (ZA)</option>
                            <option value="Kenya (KE)">Kenya (KE)</option>
                            <option value="Canada (CA)">Canada (CA)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                            STATE (OR PROVINCE)*
                          </label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Lagos"
                            value={stateProvince}
                            onChange={(e) => setStateProvince(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-zinc-900 rounded-[4px] py-3 px-4 text-xs text-zinc-300 outline-none focus:border-[#D9D6CA] transition-all"
                          />
                        </div>
                      </div>

                      {/* Submit handle inside form triggers step 3 via state */}
                      <button 
                        type="submit" 
                        id="submit-billing-hidden" 
                        className="hidden" 
                      />
                    </form>
                  </motion.div>
                )}

                {/* STEP 3: SECURE GATEWAY PORT (PAYPAL REDIRECT) */}
                {step === "paypal" && (
                  <motion.div
                    key="paypal-view"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="w-full max-w-[540px] mx-auto bg-[#040404] border border-zinc-900 rounded-md p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-2xl font-mono text-[#D9D6CA]"
                  >
                    {/* Secure connection indicator */}
                    <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                      <div className="absolute inset-0 bg-white/10 rounded-full animate-ping duration-1000" />
                      <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 text-white rounded-full flex items-center justify-center relative">
                        <span className="w-3.5 h-3.5 bg-white rounded-full" />
                      </div>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold tracking-[0.25em] text-[#D9D6CA] uppercase mb-3 font-sans">
                      SECURE CONNECTION TO PAYPAL
                    </h2>

                    <div className="bg-zinc-950/80 border border-zinc-800 rounded-sm p-3.5 text-left w-full mb-5 font-sans space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-mono text-[11px] font-bold tracking-widest uppercase">
                          [{matchedPlan.code}] {matchedPlan.title}
                        </span>
                        <span className="text-[#00E676] font-mono text-[11px] font-bold">
                          {matchedPlan.priceDisplay}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        OFFICIAL PAYPAL HOSTED ID: <span className="text-[#00E676] font-bold">{matchedPlan.hostedId}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                        Securely connects to your official PayPal hosted checkout portal for instant clearance execution.
                      </p>
                    </div>

                    <p className="text-[11.5px] text-zinc-400 font-sans font-light leading-relaxed mb-6 max-w-sm">
                      We are securely routing your session to the official PayPal hosted payment portal to authorize your digital acquisition.
                    </p>

                    {paypalError ? (
                      <div className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] p-4 rounded-sm w-full mb-6 font-sans leading-relaxed">
                        {paypalError}
                      </div>
                    ) : currentOrderId ? (
                      <div className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px] p-3.5 rounded-sm w-full mb-5 space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-wider">Settlement Verification:</span>
                          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-mono text-amber-400 font-bold uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            AWAITING PAYPAL CONFIRMATION
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                          Order <span className="text-white font-mono">{currentOrderId}</span> active. Server is waiting for confirmed PayPal settlement before issuing licenses.
                        </p>
                        <button
                          type="button"
                          onClick={handleVerifySettlementNow}
                          disabled={paypalProcessing}
                          className="w-full text-[10px] font-mono font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 py-2 rounded-[3px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                        >
                          {paypalProcessing ? (
                            <>
                              <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin inline-block" />
                              <span>VERIFYING SETTLEMENT...</span>
                            </>
                          ) : (
                            <span>VERIFY SETTLEMENT NOW ↺</span>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 text-[10.5px] text-zinc-500 font-bold uppercase tracking-widest mb-6 select-none font-mono">
                        <span className="w-2 h-2 rounded-full bg-white inline-block animate-pulse" />
                        <span>ESTABLISHING SECURE PAYPAL HANDSHAKE...</span>
                      </div>
                    )}

                    <div className="w-full space-y-3">
                      {paypalApproveUrl || matchedPlan.url ? (
                        <a
                          href={paypalApproveUrl || matchedPlan.url}
                          target={typeof window !== "undefined" && window.self !== window.top ? "_blank" : "_self"}
                          rel="noopener noreferrer"
                          className="w-full text-[11px] font-sans font-extrabold text-black bg-[#D9D6CA] hover:bg-white py-3.5 tracking-widest uppercase transition-all rounded-[4px] cursor-pointer shadow-lg inline-flex items-center justify-center gap-2"
                        >
                          <span>PAY WITH PAYPAL ({matchedPlan.code} • {matchedPlan.priceDisplay}) ↗</span>
                        </a>
                      ) : (
                        <button
                          onClick={(e) => initiateRedirect(e, true)}
                          disabled={paypalProcessing && !paypalError}
                          className="w-full text-[11px] font-sans font-extrabold text-black bg-[#D9D6CA] hover:bg-white py-3.5 tracking-widest uppercase transition-all rounded-[4px] cursor-pointer shadow-lg inline-flex items-center justify-center gap-2"
                        >
                          {paypalProcessing && !paypalError ? (
                            <>
                              <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin inline-block" />
                              <span>CONNECTING TO PAYPAL...</span>
                            </>
                          ) : (
                            <span>PAY WITH PAYPAL ({matchedPlan.code} • {matchedPlan.priceDisplay}) ↗</span>
                          )}
                        </button>
                      )}

                      {!isLiveMode && (
                        <button
                          type="button"
                          onClick={handleAuthorizeDirectSandbox}
                          disabled={paypalProcessing}
                          className="w-full text-[10.5px] font-mono font-bold text-[#00E676] hover:text-black bg-[#00E676]/10 hover:bg-[#00E676] border border-[#00E676]/40 hover:border-[#00E676] py-3 tracking-wider uppercase transition-all rounded-[4px] cursor-pointer flex items-center justify-center gap-2"
                          title="Authorize instant sandbox clearance transaction for verification"
                        >
                          <ShieldCheck size={14} />
                          <span>AUTHORIZE TRANSACTION (TEST / SANDBOX) →</span>
                        </button>
                      )}

                      <button
                        onClick={() => setStep("billing")}
                        className="w-full text-zinc-500 hover:text-white font-mono text-[9px] tracking-widest uppercase text-center cursor-pointer py-1 block transition-colors"
                      >
                        &lt; Return to Billing Information
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT COLUMN: Order Summary Card (Matches Image 3 perfectly!) */}
            <div className="lg:col-span-4 bg-[#0a0a0a] border border-zinc-900/60 text-left p-6 sm:p-7 font-sans rounded-[4px] select-none shadow-xl space-y-6">
              


              {/* Breakdown lines */}
              <div className="space-y-4 font-sans">
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-zinc-400 font-medium">
                    Item Total
                  </span>
                  <span className="text-zinc-200 font-bold">
                    ${itemTotal.toFixed(2)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm sm:text-base text-[#00E676]">
                    <span className="font-medium">
                      Discount (Coupon)
                    </span>
                    <span className="font-bold">
                      -${discount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Subtotal before taxes in neon green */}
                <div className="flex justify-between items-center border-t border-zinc-900 pt-5 pb-1">
                  <span className="text-[#00E676] text-base font-bold">
                    Subtotal before taxes
                  </span>
                  <span className="text-[#00E676] text-lg sm:text-xl font-black">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Official PayPal Hosted Clearance Badge */}
                <div className="mt-2.5 p-2.5 bg-zinc-950/70 border border-zinc-800 rounded text-left space-y-1">
                  <div className="text-[9.5px] font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center justify-between">
                    <span className="text-[#00E676]">[{matchedPlan.code}]</span>
                    <span className="text-zinc-400 font-mono text-[9px]">ID: {matchedPlan.hostedId}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-sans truncate">
                    {matchedPlan.title} • Live PayPal Checkout
                  </div>
                </div>
              </div>

              {/* Terms agreement checkbox (MUST NOT be preselected) */}
              {(step === "cart" || step === "billing") && (
                <div className="space-y-2 pt-1 border-t border-zinc-900">
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none text-left">
                    <input 
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (e.target.checked) setTermsError("");
                      }}
                      className="w-4 h-4 rounded-[3px] border border-zinc-700 bg-neutral-950 accent-[#D9D6CA] cursor-pointer mt-0.5 shrink-0"
                    />
                    <span className="text-[11px] leading-snug text-zinc-300 group-hover:text-white transition-colors font-sans">
                      I have read and agree to the{" "}
                      <button 
                        type="button" 
                        onClick={onOpenTerms} 
                        className="underline text-[#D6C291] hover:text-white font-semibold cursor-pointer bg-transparent border-0 p-0 inline font-sans"
                      >
                        Terms of Use
                      </button>{" "}
                      and the applicable{" "}
                      <button 
                        type="button" 
                        onClick={handleViewLicenseAgreement} 
                        className="underline text-[#D6C291] hover:text-white font-semibold cursor-pointer bg-transparent border-0 p-0 inline font-sans"
                      >
                        License Agreement
                      </button>.
                    </span>
                  </label>
                  {termsError && (
                    <div className="text-[10.5px] text-red-400 font-mono uppercase bg-red-950/40 border border-red-900/60 p-2.5 rounded-[3px] text-center leading-tight">
                      {termsError}
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic button & disclaimer based on current step */}
              <div className="space-y-5 font-sans">
                {step === "cart" && (
                  <button
                    onClick={() => {
                      if (cart.length === 0) {
                        alert("Your cart is empty.");
                        return;
                      }
                      const hasSoldItem = cart.some(item => isFragmentExclusivelyAcquired(item.fragmentId || item.id) || isFragmentExclusivelyAcquired(item.name));
                      if (hasSoldItem) {
                        setTermsError("One or more fragments in your cart have been exclusively acquired by another client and are permanently retired. Please remove them before proceeding.");
                        return;
                      }
                      if (!agreedToTerms) {
                        setTermsError("You must read and agree to the Terms of Use and License Agreement before proceeding.");
                        return;
                      }
                      setTermsError("");
                      if (isLoggedIn) {
                        setStep("billing");
                      } else {
                        try {
                          sessionStorage.setItem("lomon_saved_cart", JSON.stringify(cart));
                        } catch (_e) {}
                        setStep("auth");
                      }
                    }}
                    className="w-full bg-[#D9D6CA] hover:bg-white text-black font-sans font-extrabold text-[12px] sm:text-[13px] tracking-widest py-4 flex items-center justify-center transition-colors duration-200 rounded-[4px] cursor-pointer shadow-lg"
                  >
                    CONTINUE TO SECURE GATEWAY →
                  </button>
                )}

                {step === "auth" && (
                  <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-[4px] text-[10px] text-zinc-400 text-center leading-relaxed font-mono uppercase tracking-wider">
                    Please sign in to proceed with your license agreement and download.
                  </div>
                )}

                {step === "billing" && (
                  <button
                    onClick={() => {
                      // Programmatically submit the hidden button inside billing form
                      const btn = document.getElementById("submit-billing-hidden");
                      if (btn) btn.click();
                    }}
                    className="w-full bg-[#D9D6CA] hover:bg-white text-black font-sans font-extrabold text-[12px] sm:text-[13px] tracking-widest py-4 flex items-center justify-center transition-colors duration-200 rounded-[4px] cursor-pointer shadow-lg"
                  >
                    PAY NOW
                  </button>
                )}

                {step === "paypal" && (
                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-[4px] text-[9.5px] text-zinc-500 text-center leading-relaxed">
                    Please authorize the transaction using the secure PayPal checkout gateway to the left.
                  </div>
                )}

                {/* Small details text (Matches screenshot perfectly) */}
                {step === "cart" && (
                  <div className="space-y-4 pt-1 text-center text-[10px] text-zinc-500 leading-relaxed font-sans font-normal">
                    <p>
                      By clicking the button you accept the product(s){" "}
                      <button
                        type="button"
                        onClick={handleViewLicenseAgreement}
                        className="underline cursor-pointer text-zinc-400 hover:text-white font-sans bg-transparent border-0 p-0 inline"
                      >
                        License Agreement(s)
                      </button>,{" "}
                      <button
                        type="button"
                        onClick={onOpenTerms}
                        className="underline cursor-pointer text-zinc-400 hover:text-white font-sans bg-transparent border-0 p-0 inline"
                      >
                        Terms of Service
                      </button>,{" "}
                      <button
                        type="button"
                        onClick={onOpenPrivacy}
                        className="underline cursor-pointer text-zinc-400 hover:text-white font-sans bg-transparent border-0 p-0 inline"
                      >
                        Privacy Policy
                      </button> &amp;{" "}
                      <button
                        type="button"
                        onClick={onOpenRefunds}
                        className="underline cursor-pointer text-zinc-400 hover:text-white font-sans bg-transparent border-0 p-0 inline"
                      >
                        Refund Policy
                      </button>
                    </p>

                    <p>
                      Already have Archive Access?{" "}
                      <button
                        type="button"
                        onClick={() => setStep("auth")}
                        className="underline cursor-pointer text-zinc-400 hover:text-white font-semibold font-sans bg-transparent border-0 p-0 inline"
                      >
                        Sign In →
                      </button>
                    </p>

                    <p>
                      Please read our{" "}
                      <button
                        type="button"
                        onClick={onOpenRefunds}
                        className="underline cursor-pointer text-zinc-400 hover:text-white font-sans bg-transparent border-0 p-0 inline"
                      >
                        Refund Policy
                      </button>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS OVERLAY AND MASTERS DOWNLOAD STAGE */}
        {step === "success" && (
          <motion.div
            key="success-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[620px] mx-auto bg-[#040404] border border-zinc-900 rounded-md p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-2xl font-mono text-[#D9D6CA]"
          >
            {/* Elegant success icon check with ripple animation effect */}
            <div className="w-16 h-16 bg-[#00E676]/10 border border-[#00E676]/40 text-[#00E676] rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Check size={28} strokeWidth={3} />
            </div>

            <h2 className="text-base sm:text-lg font-bold tracking-[0.25em] text-[#D9D6CA] uppercase mb-3 font-sans">
              MASTER CONTRACTS &amp; STEMS DISPATCHED
            </h2>

            <div className="space-y-4 max-h-[180px] overflow-y-auto w-full mb-6 border border-zinc-900/50 p-4 bg-zinc-950/20 text-left rounded-sm font-sans">
              <div className="flex items-center justify-between text-zinc-500 text-[8.5px] tracking-wider uppercase font-mono pb-1 border-b border-zinc-900 mb-1">
                <span className="font-extrabold text-zinc-400">SECURED CONTRACT RECEIPT</span>
                <span className="flex items-center gap-1 text-[#00E676] font-bold">
                  <Clock size={10} />
                  <span>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </span>
              </div>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-[10.5px] text-zinc-400 py-1 border-b border-zinc-950">
                  <span className="truncate pr-4 font-bold">{getFragmentTimeName(item.name)} ({item.tierTitle})</span>
                  <span className="text-white shrink-0 font-sans font-bold">{item.price}</span>
                </div>
              ))}
            </div>

            <p className="text-[11.5px] text-zinc-400 font-sans font-light leading-relaxed mb-4">
              All uncompressed master WAV files and professional tracking stems are now available in your account. Your license certificate and download links have been sent to <strong className="text-white">{email}</strong>.
            </p>

            {/* Dynamic Beat ZIP & License Agreement Download Actions */}
            <div className="w-full mb-6 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="border border-zinc-800/90 rounded-md p-3.5 bg-zinc-950/80 text-left space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white uppercase font-sans">
                        {getFragmentTimeName(item.name)}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {item.tierTitle} • <span className="text-[#00E676] font-bold">{item.price}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[9.5px] text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 shrink-0">
                      <Clock size={10} className="text-[#00E676]" />
                      <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {/* Download Beat ZIP Package Button */}
                    <button
                      onClick={() => {
                        downloadBeatZipPackage({
                          recordOrFragment: {
                            ...item,
                            archiveIdentifier: `TOC-${(item.id || item.fragmentId || "FRAG").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001`,
                            compositionId: `TOC-${(item.id || item.fragmentId || "FRAG").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001`,
                            fragmentName: item.name,
                            song: item.name,
                            tierId: item.tierId,
                            type: item.tierTitle,
                            price: item.price,
                            licenseeLegalName: `${firstName} ${lastName}`.trim() || email || currentUserEmail || "Authorized Licensee",
                            licenseeEmail: email || currentUserEmail || "guest@lomon.local",
                            licenseeAddress: currentFullAddress,
                            billingAddress: currentFullAddress,
                            paymentStatus: "Completed via PayPal",
                            purchaseDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                          },
                          licenseData: {
                            licenseId: `TOC-LIC-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(100 + Math.random() * 900)}`,
                            transactionRef: `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
                            purchaseDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
                            licenseeLegalName: `${firstName} ${lastName}`.trim() || email || currentUserEmail || "Authorized Licensee",
                            licenseeEmail: email || currentUserEmail || "guest@lomon.local",
                            licenseeAddress: currentFullAddress,
                            paymentStatus: "Completed via PayPal",
                            fragmentTitle: item.name,
                            archiveIdentifier: `TOC-${(item.id || item.fragmentId || "FRAG").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001`,
                            licenseTierId: item.tierId,
                            licenseTierTitle: item.tierTitle,
                            price: item.price
                          }
                        });
                      }}
                      className="w-full flex items-center justify-center gap-1.5 bg-[#00E676] hover:bg-[#00c853] text-black transition-all text-[10.5px] font-sans font-bold px-3 py-2.5 rounded-[4px] uppercase tracking-wider cursor-pointer shadow-md"
                    >
                      <Package size={13} />
                      <span>DOWNLOAD BEAT (.ZIP)</span>
                    </button>

                    {/* Download Executed Agreement PDF */}
                    <button
                      onClick={() => {
                        openOrDownloadLicenseAgreement({
                          licenseId: `TOC-LIC-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(100 + Math.random() * 900)}`,
                          transactionRef: `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
                          purchaseDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
                          licenseeLegalName: `${firstName} ${lastName}`.trim() || email || currentUserEmail || "Authorized Licensee",
                          licenseeEmail: email || currentUserEmail || "guest@lomon.local",
                          licenseeAddress: currentFullAddress,
                          paymentStatus: "Completed via PayPal",
                          fragmentTitle: item.name,
                          archiveIdentifier: `TOC-${(item.id || item.fragmentId || "FRAG").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001`,
                          licenseTierId: item.tierId,
                          licenseTierTitle: item.tierTitle,
                          price: item.price
                        });
                      }}
                      className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[#D9D6CA] hover:text-white transition-all text-[10.5px] font-sans font-bold px-3 py-2.5 rounded-[4px] uppercase tracking-wider cursor-pointer"
                    >
                      <Download size={13} />
                      <span>LICENSE CONTRACT (PDF)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {emailPreviewUrl && (
              <div className="mb-6 w-full">
                <a 
                  href={emailPreviewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] hover:bg-[#00E676]/20 text-[10.5px] font-sans font-bold px-5 py-3 rounded-[4px] uppercase tracking-wider transition-all cursor-pointer w-full text-center"
                >
                  <Mail size={13} />
                  <span>View Dispatched Email (Sandbox Preview) &rarr;</span>
                </a>
                <p className="text-[9px] text-zinc-500 mt-2 lowercase leading-relaxed font-sans">
                  Click to open the simulated Ethereal Mailbox to inspect the premium HTML email dispatched by our backend system.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              {onOpenDashboard && (
                <button
                  onClick={() => {
                    handleCompleteAll();
                    onOpenDashboard();
                  }}
                  className="w-full sm:w-auto text-[11px] font-mono font-bold text-black bg-[#00E676] hover:bg-[#00c853] px-6 py-3.5 tracking-wider uppercase transition-all rounded-[4px] cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  <span>GO TO CLIENT DASHBOARD →</span>
                </button>
              )}
              <button
                onClick={handleCompleteAll}
                className="w-full sm:w-auto text-[11px] font-mono font-bold text-[#D9D6CA] bg-zinc-900 hover:bg-zinc-800 hover:text-white px-6 py-3.5 tracking-wider uppercase transition-all rounded-[4px] cursor-pointer border border-zinc-800"
              >
                RETURN TO CATALOG
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* License terms review dialog */}
      <AnimatePresence>
        {reviewLicenseItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-[620px] bg-[#0c0c0c] border border-zinc-800 p-5 sm:p-7 rounded-[6px] flex flex-col text-left font-sans shadow-2xl max-h-[90vh]"
            >
              {(() => {
                const normalizedTier = normalizeTierId(reviewLicenseItem.tierId || reviewLicenseItem.price);
                const licenseData: LicenseAgreementData = {
                  licenseId: `TOC-LIC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`,
                  transactionRef: `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
                  purchaseDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
                  licenseeLegalName: `${firstName} ${lastName}`.trim() || email || currentUserEmail || "Authorized Licensee",
                  licenseeEmail: email || currentUserEmail || "licensee@lomon.local",
                  fragmentTitle: reviewLicenseItem.name,
                  archiveIdentifier: `TOC-${(reviewLicenseItem.id || reviewLicenseItem.fragmentId || "FRAG").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001`,
                  licenseTierId: reviewLicenseItem.tierId || normalizedTier,
                  licenseTierTitle: reviewLicenseItem.tierTitle,
                  price: reviewLicenseItem.price
                };

                const schedA = getScheduleAData(licenseData);
                const schedB = getScheduleBData(licenseData);
                const legalTier = getLegalArticlesForTier(normalizedTier);

                const handleCopyFullAgreement = () => {
                  const fullText = generateFullAgreementText(licenseData);
                  navigator.clipboard.writeText(fullText);
                  setCopiedContract(true);
                  setTimeout(() => setCopiedContract(false), 2500);
                };

                const handleOpenPdf = () => {
                  openOrDownloadLicenseAgreement(licenseData);
                };

                return (
                  <>
                    {/* Modal Header */}
                    <div className="flex items-start justify-between border-b border-zinc-800 pb-4 mb-4 gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono font-bold tracking-widest text-[#00E676] uppercase bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-[2px]">
                            {schedA.licenseFee}
                          </span>
                          <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                            EDITION: {schedB.contractVersion}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-sans">
                          {legalTier.agreementTitle}
                        </h3>
                        <p className="text-zinc-400 text-xs font-mono mt-0.5">
                          Fragment: <span className="text-white font-semibold">{reviewLicenseItem.name}</span> • ID: {schedA.archiveIdentifier}
                        </p>
                      </div>
                      <button
                        onClick={() => setReviewLicenseItem(null)}
                        className="text-zinc-400 hover:text-white p-1 rounded transition-colors cursor-pointer text-sm"
                        title="Close review"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-zinc-800 mb-4 text-[11px] font-mono uppercase tracking-wider">
                      <button
                        onClick={() => setReviewModalTab("summary")}
                        className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                          reviewModalTab === "summary"
                            ? "border-[#D9D6CA] text-white"
                            : "border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Contract Schedules (A &amp; B)
                      </button>
                      <button
                        onClick={() => setReviewModalTab("fullText")}
                        className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                          reviewModalTab === "fullText"
                            ? "border-[#D9D6CA] text-white"
                            : "border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Verbatim Legal Articles (1–7)
                      </button>
                    </div>

                    {/* Scrollable Content Body */}
                    <div className="overflow-y-auto pr-1.5 space-y-4 max-h-[50vh] text-xs leading-relaxed">
                      {reviewModalTab === "summary" ? (
                        <div className="space-y-4">
                          {/* Notice Banner */}
                          <div className="p-3 bg-zinc-900/90 border-l-2 border-[#D9D6CA] text-zinc-300 text-[11.5px] rounded-r-[3px] leading-relaxed">
                            <span className="text-white font-bold block mb-1">OFFICIAL NOTICE:</span>
                            {legalTier.importantNotice.map((notice, idx) => (
                              <p key={idx} className="mt-1 first:mt-0">{notice}</p>
                            ))}
                          </div>

                          {/* Schedule A Table */}
                          <div className="border border-zinc-800 rounded-[4px] overflow-hidden bg-zinc-950/60">
                            <div className="bg-zinc-900/80 px-3 py-2 border-b border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 tracking-wider uppercase">
                              SCHEDULE A: TRANSACTION &amp; LICENSED ASSET
                            </div>
                            <div className="divide-y divide-zinc-900 text-[11px]">
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Licensor:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedA.licensor}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">License Tier:</span>
                                <span className="col-span-2 text-[#00E676] font-bold">{schedA.licenseTier}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Delivery Package:</span>
                                <span className="col-span-2 text-zinc-200">{schedA.deliveryPackage}</span>
                              </div>
                              {schedA.catalogStatus && (
                                <div className="grid grid-cols-3 p-2.5">
                                  <span className="text-zinc-500 font-mono">Catalog Status:</span>
                                  <span className="col-span-2 text-zinc-300 font-mono">{schedA.catalogStatus}</span>
                                </div>
                              )}
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Permitted Scope:</span>
                                <div className="col-span-2 space-y-1 text-zinc-300">
                                  {schedA.permittedScope.map((scopeItem, i) => (
                                    <div key={i} className="flex items-start gap-1.5">
                                      <span className="text-[#00E676] font-bold">•</span>
                                      <span>{scopeItem}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Schedule B Table */}
                          <div className="border border-zinc-800 rounded-[4px] overflow-hidden bg-zinc-950/60">
                            <div className="bg-zinc-900/80 px-3 py-2 border-b border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 tracking-wider uppercase">
                              SCHEDULE B: OWNERSHIP, PRO &amp; PUBLISHING SPLITS
                            </div>
                            <div className="divide-y divide-zinc-900 text-[11px]">
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Licensor Legal Entity:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.licensorEntity}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Master Ownership:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.masterOwnership}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Publishing Split:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.publishingShare}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Writer Split:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.writerShare}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Content ID:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.contentIdRegistration}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Exclusivity:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.exclusivity}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Licensor PRO:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.licensorPro}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Licensor Writer &amp; IPI:</span>
                                <span className="col-span-2 text-zinc-200 font-mono text-[10.5px]">
                                  {schedB.licensorWriterName} <span className="text-zinc-400 font-sans">• IPI:</span> <span className="text-[#00E676]">{schedB.licensorWriterIpi}</span>
                                </span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Licensor Publisher &amp; IPI:</span>
                                <span className="col-span-2 text-zinc-200 font-mono text-[10.5px]">
                                  {schedB.licensorPublisherName} <span className="text-zinc-400 font-sans">• IPI:</span> <span className="text-[#00E676]">{schedB.licensorPublisherIpi}</span>
                                </span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Contract Version:</span>
                                <span className="col-span-2 text-zinc-400 font-mono text-[10.5px]">{schedB.contractVersion}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 font-mono text-[11px] text-zinc-300">
                          {legalTier.articles.map((article, aIdx) => (
                            <div key={aIdx} className="border border-zinc-900 p-3.5 bg-zinc-950/70 rounded-[4px] space-y-2">
                              <h4 className="text-white font-bold font-sans tracking-wide text-xs uppercase border-b border-zinc-900 pb-1.5">
                                {article.title}
                              </h4>
                              {article.sections.map((section, sIdx) => (
                                <div key={sIdx} className="space-y-1 pt-1">
                                  <p className="text-[#D9D6CA] font-bold text-[10.5px]">{section.heading}</p>
                                  <p className="text-zinc-400 font-sans text-[11px] leading-relaxed whitespace-pre-line">
                                    {section.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="mt-5 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={handleOpenPdf}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-[10.5px] font-mono font-bold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white px-3.5 py-2.5 rounded-[4px] transition-colors border border-zinc-700 cursor-pointer"
                        >
                          <FileText size={13} />
                          <span>PRINT / SAVE PDF</span>
                        </button>
                        <button
                          onClick={handleCopyFullAgreement}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-[10.5px] font-mono font-bold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white px-3.5 py-2.5 rounded-[4px] transition-colors border border-zinc-700 cursor-pointer"
                        >
                          {copiedContract ? <CheckCircle2 size={13} className="text-[#00E676]" /> : <Copy size={13} />}
                          <span>{copiedContract ? "COPIED TO CLIPBOARD" : "COPY FULL TEXT"}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setReviewLicenseItem(null)}
                        className="w-full sm:w-auto bg-[#D9D6CA] text-black hover:bg-white transition-all font-sans font-bold text-[11px] px-6 py-2.5 tracking-wider uppercase rounded-[4px] cursor-pointer shadow"
                      >
                        DISMISS
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
