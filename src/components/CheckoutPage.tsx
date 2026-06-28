import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ArrowUpRight, ChevronRight, Trash2, Mail, Phone, MapPin, 
  Building, CreditCard, ShieldCheck, ChevronDown, Check, Info 
} from "lucide-react";
import { CartItem } from "../App";

// Static license terms to show when user clicks "Review License"
const LICENSE_TEMPLATES: Record<string, { title: string; usage: string; streams: string; files: string }> = {
  access: {
    title: "ACCESS LICENSE (MP3 ONLY)",
    usage: "Non-commercial/concept testing releases only. Standard mechanical usage restrictions apply.",
    streams: "Up to 100,000 Streams",
    files: "MP3 Download, Non-exclusive"
  },
  release: {
    title: "RELEASE LICENSE (WAV + MP3)",
    usage: "Professional independent commercial releases. Includes broadcast rights and live performance permissions.",
    streams: "Up to 1,000,000 Streams",
    files: "WAV Download, MP3 Download, Non-exclusive"
  },
  commercial: {
    title: "COMMERCIAL LICENSE (STEMS + MASTER)",
    usage: "Unlimited commercial campaigns, brand integrations, online promotional distribution, and synchronization rights.",
    streams: "Unlimited Streams",
    files: "Full WAV Stems, Uncompressed Master WAV, MP3, Non-exclusive"
  }
};

interface CheckoutPageProps {
  cart: CartItem[];
  onRemoveItem: (id: string) => void;
  onClose: () => void;
  onClearCart: () => void;
}

type CheckoutStep = "cart" | "billing" | "paystack" | "success";

export default function CheckoutPage({ cart, onRemoveItem, onClose, onClearCart }: CheckoutPageProps) {
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [couponChecked, setCouponChecked] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Billing states
  const [isBusiness, setIsBusiness] = useState(false);
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Nwanne");
  const [email, setEmail] = useState("evianaconcepts1@gmail.com");
  const [phone, setPhone] = useState("+234 803 123 4567");
  const [companyName, setCompanyName] = useState("");
  const [streetAddress, setStreetAddress] = useState("12 Broad Street");
  const [aptNumber, setAptNumber] = useState("Suite 4B");
  const [city, setCity] = useState("Lagos");
  const [zipCode, setZipCode] = useState("100001");
  const [country, setCountry] = useState("Nigeria (NG)");
  const [stateProvince, setStateProvince] = useState("Lagos");

  // License review state
  const [reviewLicenseItem, setReviewLicenseItem] = useState<CartItem | null>(null);

  // Paystack mock interface state
  const [paystackMethod, setPaystackMethod] = useState<"card" | "bank" | "transfer" | "ussd">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paystackProcessing, setPaystackProcessing] = useState(false);
  const [paystackOtpStep, setPaystackOtpStep] = useState(false);
  const [paystackOtp, setPaystackOtp] = useState("");

  // Bulk deals dropdown toggle
  const [bulkDealsOpen, setBulkDealsOpen] = useState(false);

  // Calculate totals
  const itemTotal = cart.reduce((sum, item) => {
    const numericPrice = parseFloat(item.price.replace(/[^0-9.]/g, "")) || 0;
    return sum + numericPrice;
  }, 0);

  const subtotal = itemTotal - discount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === "OWL20") {
      setDiscount(itemTotal * 0.20);
      setCouponApplied(true);
    } else if (couponCode.toUpperCase() === "SIGNAL15") {
      setDiscount(itemTotal * 0.15);
      setCouponApplied(true);
    } else {
      alert("Invalid coupon code. Try 'OWL20' for 20% off or 'SIGNAL15' for 15% off.");
    }
  };

  const handleBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !streetAddress || !city || !stateProvince) {
      alert("Please fill in all required fields.");
      return;
    }
    setStep("paystack");
  };

  const handlePaystackPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaystackProcessing(true);
    setTimeout(() => {
      setPaystackProcessing(false);
      setPaystackOtpStep(true);
    }, 1500);
  };

  const handlePaystackOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaystackProcessing(true);
    setTimeout(() => {
      setPaystackProcessing(false);
      setStep("success");
    }, 1500);
  };

  const handleCompleteAll = () => {
    onClearCart();
    onClose();
  };

  return (
    <div className="w-full min-h-screen bg-black text-[#D9D6CA] font-sans py-12 px-4 md:px-8 select-none">
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
              01. MEDIA BAG
            </span>
            <ChevronRight size={10} className="text-zinc-650 shrink-0" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`whitespace-nowrap ${step === "billing" ? "text-[#D9D6CA] font-extrabold" : "text-zinc-500"}`}>
              02. BILLING INFO
            </span>
            <ChevronRight size={10} className="text-zinc-650 shrink-0" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`whitespace-nowrap ${step === "paystack" ? "text-[#D9D6CA] font-extrabold" : "text-zinc-500"}`}>
              03. SECURE GATEWAY
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
                          {cart.map((item) => (
                            <div 
                              key={item.id} 
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-950 pb-4"
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
                                    {item.name}
                                  </h4>
                                  <p className="text-zinc-500 text-[10.5px] mt-1 uppercase tracking-wider font-normal font-sans">
                                    TRACK • {item.tierId === "access" ? "MP3 License (MP3)" : item.tierId === "release" ? "Unlimited License (Track Stems,WAV,MP3)" : "Commercial License (Full WAV Stems,WAV,MP3)"}
                                  </p>
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
                          ))}
                        </div>


                      </div>
                    )}
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

                {/* STEP 3: SECURE GATEWAY PORT (PAYSTACK SIMULATION) */}
                {step === "paystack" && (
                  <motion.div
                    key="paystack-view"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex justify-center py-6"
                  >
                    {/* PAYSTACK POPUP OVERLAY LAYOUT - High Fidelity representation */}
                    <div className="w-full max-w-[480px] bg-white text-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans select-none text-left">
                      
                      {/* Brand Header */}
                      <div className="bg-[#1c2833] text-white p-5 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            {/* Signature Paystack Green circle */}
                            <span className="w-3.5 h-3.5 rounded-full bg-[#39CD74] inline-block animate-pulse" />
                            <span className="font-extrabold text-sm tracking-widest uppercase">
                              paystack
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono mt-1">
                            Secured transaction for {email}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-zinc-400 block uppercase font-mono">Amount to Pay</span>
                          <span className="text-lg font-black font-sans text-[#39CD74]">
                            NGN {(subtotal * 1500).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[9px] text-zinc-500 block">
                            (equivalent to ${subtotal.toFixed(2)} USD)
                          </span>
                        </div>
                      </div>

                      {/* Paystack Panel content */}
                      <div className="flex flex-col sm:flex-row min-h-[280px]">
                        {/* Sidebar tabs for payment methods */}
                        <div className="sm:w-1/3 bg-[#f2f4f4] border-r border-zinc-200 py-4 flex sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible shrink-0 px-2 sm:px-0">
                          <button
                            type="button"
                            onClick={() => setPaystackMethod("card")}
                            className={`w-full text-left py-2.5 px-4 text-xs font-semibold flex items-center gap-2 rounded-none sm:rounded-r-md transition-colors ${paystackMethod === "card" ? "bg-white text-[#39CD74] border-l-4 border-[#39CD74]" : "text-zinc-600 hover:bg-zinc-100"}`}
                          >
                            <CreditCard size={13} />
                            <span>Card</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaystackMethod("bank")}
                            className={`w-full text-left py-2.5 px-4 text-xs font-semibold flex items-center gap-2 rounded-none sm:rounded-r-md transition-colors ${paystackMethod === "bank" ? "bg-white text-[#39CD74] border-l-4 border-[#39CD74]" : "text-zinc-600 hover:bg-zinc-100"}`}
                          >
                            <Building size={13} />
                            <span>Bank</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaystackMethod("transfer")}
                            className={`w-full text-left py-2.5 px-4 text-xs font-semibold flex items-center gap-2 rounded-none sm:rounded-r-md transition-colors ${paystackMethod === "transfer" ? "bg-white text-[#39CD74] border-l-4 border-[#39CD74]" : "text-zinc-600 hover:bg-zinc-100"}`}
                          >
                            <Phone size={13} />
                            <span>Transfer</span>
                          </button>
                        </div>

                        {/* Paystack Main Input Frame */}
                        <div className="flex-grow p-5 sm:p-6 flex flex-col justify-between">
                          <AnimatePresence mode="wait">
                            {!paystackOtpStep ? (
                              <motion.div
                                key="paystack-form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4 text-left"
                              >
                                {paystackMethod === "card" && (
                                  <form onSubmit={handlePaystackPayment} className="space-y-4">
                                    <div className="space-y-1 text-left">
                                      <label className="text-[10px] font-bold uppercase text-zinc-500 block">
                                        Card Number
                                      </label>
                                      <input 
                                        type="text"
                                        required
                                        placeholder="4012  0000  1111  2222"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                                        maxLength={19}
                                        className="w-full bg-[#fcfcfc] border border-zinc-200 rounded-md py-2.5 px-3 text-sm text-zinc-800 outline-none focus:border-[#39CD74]"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1 text-left">
                                        <label className="text-[10px] font-bold uppercase text-zinc-500 block">
                                          Card Expiry
                                        </label>
                                        <input 
                                          type="text"
                                          required
                                          placeholder="MM / YY"
                                          value={cardExpiry}
                                          onChange={(e) => setCardExpiry(e.target.value)}
                                          maxLength={5}
                                          className="w-full bg-[#fcfcfc] border border-zinc-200 rounded-md py-2.5 px-3 text-sm text-zinc-800 outline-none focus:border-[#39CD74] text-center"
                                        />
                                      </div>

                                      <div className="space-y-1 text-left">
                                        <label className="text-[10px] font-bold uppercase text-zinc-500 block">
                                          CVV
                                        </label>
                                        <input 
                                          type="password"
                                          required
                                          placeholder="123"
                                          value={cardCvv}
                                          onChange={(e) => setCardCvv(e.target.value)}
                                          maxLength={3}
                                          className="w-full bg-[#fcfcfc] border border-zinc-200 rounded-md py-2.5 px-3 text-sm text-zinc-800 outline-none focus:border-[#39CD74] text-center"
                                        />
                                      </div>
                                    </div>

                                    <button
                                      type="submit"
                                      disabled={paystackProcessing}
                                      className="w-full py-3 bg-[#39CD74] hover:bg-[#2fa85e] text-white font-bold text-xs tracking-wider rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
                                    >
                                      {paystackProcessing ? (
                                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                      ) : (
                                        <span>Authorize & Pay NGN {(subtotal * 1500).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                      )}
                                    </button>
                                  </form>
                                )}

                                {paystackMethod !== "card" && (
                                  <div className="space-y-4 py-4 text-center">
                                    <p className="text-zinc-500 text-xs">
                                      Paystack Direct Transfer and Bank credentials authorizations are configured. Please proceed with Card validation for secure temporal simulation.
                                    </p>
                                    <button
                                      onClick={() => setPaystackMethod("card")}
                                      className="text-[#39CD74] hover:underline text-xs font-semibold cursor-pointer"
                                    >
                                      Return to Secure Card Payment
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            ) : (
                              <motion.div
                                key="paystack-otp"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4 text-left"
                              >
                                <div className="space-y-2 text-left">
                                  <h4 className="text-sm font-bold text-zinc-800">
                                    Secure One-Time PIN Verified
                                  </h4>
                                  <p className="text-xs text-zinc-500 leading-relaxed">
                                    A simulation validation token has been prompted for your security. Enter any 6-digit credential (e.g., 123456) to clear mechanical contract ownership.
                                  </p>
                                </div>

                                <form onSubmit={handlePaystackOtpSubmit} className="space-y-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-zinc-500 block">
                                      OTP / SECURE TOKEN
                                    </label>
                                    <input 
                                      type="text"
                                      required
                                      placeholder="1 2 3 4 5 6"
                                      value={paystackOtp}
                                      onChange={(e) => setPaystackOtp(e.target.value)}
                                      maxLength={6}
                                      className="w-full bg-[#fcfcfc] border border-zinc-200 rounded-md py-2.5 px-3 text-sm text-zinc-800 outline-none focus:border-[#39CD74] text-center tracking-[0.4em] font-mono"
                                    />
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={paystackProcessing}
                                    className="w-full py-3 bg-[#39CD74] hover:bg-[#2fa85e] text-white font-bold text-xs tracking-wider rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    {paystackProcessing ? (
                                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                    ) : (
                                      <span>Verify & Release Master Contract</span>
                                    )}
                                  </button>
                                </form>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Secure badge */}
                          <div className="pt-4 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-zinc-400 text-[10px]">
                            <ShieldCheck size={12} className="text-[#39CD74]" />
                            <span>Secured by Paystack. Secured Global mechanical metrics.</span>
                          </div>
                        </div>
                      </div>
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
              </div>

              {/* Dynamic button & disclaimer based on current step */}
              <div className="space-y-5 font-sans">
                {step === "cart" && (
                  <button
                    onClick={() => {
                      if (cart.length === 0) {
                        alert("Your cart is empty.");
                        return;
                      }
                      setStep("billing");
                    }}
                    className="w-full bg-[#D9D6CA] hover:bg-white text-black font-sans font-extrabold text-[12px] sm:text-[13px] tracking-widest py-4 flex items-center justify-center transition-colors duration-200 rounded-[4px] cursor-pointer shadow-lg"
                  >
                    PROCEED TO CHECKOUT
                  </button>
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
                    CHOOSE PAYMENT OPTIONS
                  </button>
                )}

                {step === "paystack" && (
                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-[4px] text-[9.5px] text-zinc-500 text-center leading-relaxed">
                    Please authorize the transaction using the secure Paystack checkout gateway to the left.
                  </div>
                )}

                {/* Small details text (Matches screenshot perfectly) */}
                {step === "cart" && (
                  <div className="space-y-4 pt-1 text-center text-[10px] text-zinc-500 leading-relaxed font-sans font-normal">
                    <p>
                      By clicking the button you accept the product(s){" "}
                      <span className="underline cursor-pointer text-zinc-400 hover:text-white">License Agreement(s)</span>,{" "}
                      <span className="underline cursor-pointer text-zinc-400 hover:text-white">Terms of Service</span>,{" "}
                      <span className="underline cursor-pointer text-zinc-400 hover:text-white">Privacy Policy</span> &amp;{" "}
                      <span className="underline cursor-pointer text-zinc-400 hover:text-white">Refund Policy</span>
                    </p>

                    <p>
                      Would you like to keep records of your transaction(s) for future download of your purchased files?{" "}
                      <span className="underline cursor-pointer text-zinc-400 hover:text-white font-semibold">Login</span>
                    </p>

                    <p>
                      Please read our{" "}
                      <span className="underline cursor-pointer text-zinc-400 hover:text-white">Refund Policy</span>.
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
              <span className="text-zinc-500 text-[8px] tracking-wider uppercase block font-extrabold mb-1">
                SECURED CONTRACT RECEIPT
              </span>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-[10.5px] text-zinc-400 py-1 border-b border-zinc-950">
                  <span className="truncate pr-4 font-bold">{item.name} ({item.tierTitle})</span>
                  <span className="text-white shrink-0 font-sans font-bold">{item.price}</span>
                </div>
              ))}
            </div>

            <p className="text-[11.5px] text-zinc-400 font-sans font-light leading-relaxed mb-6">
              All uncompressed master WAV files and professional tracking stems have been deployed to your secure customer terminal. Your license certificate and stem downloads link have been forwarded to <strong className="text-white">{email}</strong>.
            </p>

            <button
              onClick={handleCompleteAll}
              className="text-[11px] font-sans font-extrabold text-black bg-[#D9D6CA] hover:bg-white px-8 py-3.5 tracking-widest uppercase transition-all rounded-[4px] cursor-pointer shadow-lg"
            >
              CLOSE SECURE PORTAL
            </button>
          </motion.div>
        )}
      </div>

      {/* License terms review dialog */}
      <AnimatePresence>
        {reviewLicenseItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-[440px] bg-zinc-950 border border-zinc-900 p-6 rounded-[4px] flex flex-col text-left font-sans"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                <span className="text-[10.5px] font-bold text-[#D9D6CA] tracking-widest uppercase">
                  LICENSE REVIEW — {reviewLicenseItem.name}
                </span>
                <button
                  onClick={() => setReviewLicenseItem(null)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-[10.5px] leading-relaxed">
                <div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block mb-1">CONTRACT LEVEL</span>
                  <p className="text-white font-bold uppercase">{LICENSE_TEMPLATES[reviewLicenseItem.tierId]?.title || "STANDARD UNLIMITED LICENSE"}</p>
                </div>

                <div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block mb-1">CALIBRATED FILES DELIVERED</span>
                  <p className="text-zinc-300 font-sans">{LICENSE_TEMPLATES[reviewLicenseItem.tierId]?.files || "WAV, MP3, Track Stems"}</p>
                </div>

                <div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block mb-1">STREAMING/AUDIENCE RIGHTS</span>
                  <p className="text-[#00E676] font-bold">{LICENSE_TEMPLATES[reviewLicenseItem.tierId]?.streams || "Unlimited Streams"}</p>
                </div>

                <div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block mb-1">VALIDATION TERM SUMMARY</span>
                  <p className="text-zinc-400 font-sans font-light">
                    {LICENSE_TEMPLATES[reviewLicenseItem.tierId]?.usage || "Professional independent mechanical release authorization. Contract validation clears all watermarks, audio tags, and master restrictions."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setReviewLicenseItem(null)}
                className="mt-6 w-full bg-[#D9D6CA] text-black hover:bg-white transition-all font-sans font-bold text-[11px] py-3 tracking-wider uppercase rounded-[4px] cursor-pointer"
              >
                DISMISS TERMS
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
