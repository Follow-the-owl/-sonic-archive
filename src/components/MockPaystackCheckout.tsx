import React, { useState, useEffect } from "react";
import { CreditCard, Building, Phone, ShieldCheck, Check, ArrowLeft, Lock } from "lucide-react";

export default function MockPaystackCheckout() {
  const [params, setParams] = useState({
    reference: "",
    amount: "150.00",
    email: "guest@lomon.local"
  });

  const [method, setMethod] = useState<"card" | "bank" | "transfer">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  const [processing, setProcessing] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setParams({
      reference: searchParams.get("reference") || `LMN-PS-${Date.now()}`,
      amount: searchParams.get("amount") || "150.00",
      email: searchParams.get("email") || "guest@lomon.local"
    });
  }, []);

  const amountUsd = parseFloat(params.amount) || 150;
  const amountNgn = amountUsd * 1500;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setOtpStep(true);
    }, 1200);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter a valid verification code.");
      return;
    }
    setProcessing(true);
    setError("");

    // Mimic official callback redirection
    setTimeout(() => {
      window.location.href = `/api/paystack/callback?reference=${encodeURIComponent(params.reference)}`;
    }, 1000);
  };

  const handleCancel = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-zinc-800 flex flex-col justify-between font-sans selection:bg-[#39cd74]/20 selection:text-zinc-900">
      
      {/* Top Warning Banner highlighting that this is a safe, sandboxed simulation */}
      <div className="bg-[#1c2833] text-zinc-300 text-[11px] py-2 px-4 text-center border-b border-zinc-750 flex items-center justify-center gap-1.5 font-medium tracking-wide">
        <ShieldCheck size={14} className="text-[#39cd74]" />
        <span>SECURE SANDBOX ENVIRONMENT — NO REAL MONEY WILL BE CHARGED</span>
      </div>

      {/* Main Content Card Container */}
      <div className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[540px] bg-white rounded-xl shadow-xl overflow-hidden border border-zinc-200 flex flex-col">
          
          {/* Paystack Header Panel */}
          <div className="bg-[#0c1926] text-white p-6 sm:p-8 flex justify-between items-start border-b border-zinc-850">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#39cd74] inline-block animate-pulse" />
                <span className="font-extrabold text-base tracking-[0.2em] uppercase font-sans">
                  paystack
                </span>
                <span className="text-[9px] bg-zinc-800 text-zinc-400 font-mono px-1.5 py-0.5 rounded tracking-wider uppercase">
                  TEST MODE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono mt-1.5">
                Secured transaction for {params.email}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Amount to Pay</span>
              <span className="text-xl sm:text-2xl font-black text-[#39cd74] block mt-0.5">
                NGN {amountNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-zinc-500 block">
                (equivalent to ${amountUsd.toFixed(2)} USD)
              </span>
            </div>
          </div>

          {/* Payment Methods Frame */}
          <div className="flex flex-col sm:flex-row min-h-[300px]">
            
            {/* Payment Method sidebar */}
            <div className="sm:w-1/3 bg-[#f8fafc] border-r border-zinc-150 py-4 flex sm:flex-col gap-1 px-2 sm:px-0">
              <button
                type="button"
                onClick={() => !otpStep && setMethod("card")}
                disabled={otpStep}
                className={`w-full text-left py-3 px-5 text-xs font-bold flex items-center gap-2.5 transition-all ${otpStep ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${method === "card" && !otpStep ? "bg-white text-[#39cd74] border-l-4 border-[#39cd74] shadow-sm" : "text-zinc-650 hover:bg-zinc-100"}`}
              >
                <CreditCard size={14} className={method === "card" ? "text-[#39cd74]" : "text-zinc-400"} />
                <span>Card</span>
              </button>
              
              <button
                type="button"
                onClick={() => !otpStep && setMethod("bank")}
                disabled={otpStep}
                className={`w-full text-left py-3 px-5 text-xs font-bold flex items-center gap-2.5 transition-all ${otpStep ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${method === "bank" && !otpStep ? "bg-white text-[#39cd74] border-l-4 border-[#39cd74] shadow-sm" : "text-zinc-650 hover:bg-zinc-100"}`}
              >
                <Building size={14} className={method === "bank" ? "text-[#39cd74]" : "text-zinc-400"} />
                <span>Bank</span>
              </button>

              <button
                type="button"
                onClick={() => !otpStep && setMethod("transfer")}
                disabled={otpStep}
                className={`w-full text-left py-3 px-5 text-xs font-bold flex items-center gap-2.5 transition-all ${otpStep ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${method === "transfer" && !otpStep ? "bg-white text-[#39cd74] border-l-4 border-[#39cd74] shadow-sm" : "text-zinc-650 hover:bg-zinc-100"}`}
              >
                <Phone size={14} className={method === "transfer" ? "text-[#39cd74]" : "text-zinc-400"} />
                <span>Transfer</span>
              </button>
            </div>

            {/* Input fields / OTP views */}
            <div className="flex-grow p-6 sm:p-8 flex flex-col justify-between">
              {!otpStep ? (
                <div className="space-y-5 text-left h-full flex flex-col justify-between">
                  {method === "card" && (
                    <form onSubmit={handlePay} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                          Card Number
                        </label>
                        <input 
                          type="text"
                          required
                          placeholder="4012  0000  1111  2222"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                          maxLength={19}
                          className="w-full bg-[#fcfcfc] border border-zinc-200 focus:border-[#39cd74] rounded-lg py-3 px-4 text-sm text-zinc-800 outline-none transition-all placeholder:text-zinc-300 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                            Card Expiry
                          </label>
                          <input 
                            type="text"
                            required
                            placeholder="MM / YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            maxLength={5}
                            className="w-full bg-[#fcfcfc] border border-zinc-200 focus:border-[#39cd74] rounded-lg py-3 px-4 text-sm text-zinc-800 outline-none transition-all text-center placeholder:text-zinc-300 font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                            CVV
                          </label>
                          <input 
                            type="password"
                            required
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            maxLength={3}
                            className="w-full bg-[#fcfcfc] border border-zinc-200 focus:border-[#39cd74] rounded-lg py-3 px-4 text-sm text-zinc-800 outline-none transition-all text-center placeholder:text-zinc-300 font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 bg-[#39cd74] hover:bg-[#2fa85e] text-white font-extrabold text-sm tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer mt-6 shadow-md"
                      >
                        {processing ? (
                          <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          <span>Authorize & Pay NGN {amountNgn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        )}
                      </button>
                    </form>
                  )}

                  {method !== "card" && (
                    <div className="space-y-4 py-6 text-center flex flex-col justify-center items-center">
                      <p className="text-zinc-500 text-xs max-w-xs leading-relaxed">
                        To continue simulated test payments seamlessly, please proceed using the Credit Card tab to input sandbox credentials.
                      </p>
                      <button
                        onClick={() => setMethod("card")}
                        className="text-[#39cd74] hover:underline text-xs font-bold cursor-pointer transition-colors"
                      >
                        Return to Credit Card
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5 text-left h-full flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                      Simulation Verification Requested
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Enter any 6-digit simulated One-Time PIN (OTP) to clear secure mechanical license contract parameters.
                    </p>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 text-red-600 text-xs p-3 rounded-md border border-red-100 font-medium">
                        {error}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                        Simulated Token Code
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="1 2 3 4 5 6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        className="w-full bg-[#fcfcfc] border border-zinc-200 focus:border-[#39cd74] rounded-lg py-3 px-4 text-lg text-zinc-850 outline-none text-center tracking-[0.5em] font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={processing}
                      className="w-full py-3.5 bg-[#39cd74] hover:bg-[#2fa85e] text-white font-extrabold text-sm tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4"
                    >
                      {processing ? (
                        <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <span>Verify & Complete Transaction</span>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Secure footer indicators */}
              <div className="pt-4 mt-6 border-t border-zinc-150 flex items-center justify-center gap-2 text-zinc-400 text-[10.5px]">
                <Lock size={12} className="text-zinc-300" />
                <span className="font-medium">Secured by Paystack. Custom mechanical token validation.</span>
              </div>
            </div>

          </div>

          {/* Cancel button */}
          <div className="bg-[#f8fafc] py-3.5 px-6 border-t border-zinc-200 text-center">
            <button 
              onClick={handleCancel}
              className="text-zinc-500 hover:text-zinc-800 text-[11px] font-bold tracking-wider uppercase transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Cancel Payment & Return to App</span>
            </button>
          </div>

        </div>
      </div>

      {/* Footer credits */}
      <footer className="py-6 text-center text-[10px] text-zinc-400 font-mono tracking-wider">
        LOMON SECURE INTEGRATION GATEWAY • PAYSTACK SANDBOX PROXY • © 2026
      </footer>

    </div>
  );
}
