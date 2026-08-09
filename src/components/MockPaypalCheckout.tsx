import React, { useState, useEffect } from "react";
import { ShieldCheck, Check, Lock } from "lucide-react";

export default function MockPaypalCheckout() {
  const [params, setParams] = useState({
    token: "",
    reference: "",
    amount: "150.00",
    email: "guest@lomon.local"
  });

  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token") || searchParams.get("orderID") || `SANDBOX-LMN-PP-${Date.now()}`;
    const reference = searchParams.get("reference") || token;
    const amount = searchParams.get("amount") || "150.00";
    const email = searchParams.get("email") || "guest@lomon.local";

    setParams({ token, reference, amount, email });
  }, []);

  const amountUsd = parseFloat(params.amount) || 150;

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      setCompleted(true);
      setTimeout(() => {
        window.location.href = `/api/paypal/return?token=${encodeURIComponent(params.token)}&PayerID=MOCK-PAYER-888`;
      }, 1000);
    }, 1200);
  };

  const handleCancel = () => {
    window.location.href = "/checkout?status=cancel";
  };

  return (
    <div className="min-h-screen bg-[#001c64] text-white flex flex-col justify-between font-sans selection:bg-[#0070ba]/30">
      
      {/* Top Banner */}
      <div className="bg-[#001447] text-blue-200 text-[11px] py-2.5 px-4 text-center border-b border-blue-900/50 flex items-center justify-center gap-1.5 font-medium tracking-wide">
        <ShieldCheck size={14} className="text-[#00d2ff]" />
        <span>PAYPAL SANDBOX TESTING ENVIRONMENT — NO REAL FUNDS REQUIRED</span>
      </div>

      {/* Main Container */}
      <div className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[480px] bg-white text-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 flex flex-col">
          
          {/* Header Panel */}
          <div className="bg-[#f5f7fa] p-6 sm:p-8 border-b border-zinc-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-2xl tracking-tighter text-[#003087] italic font-sans">
                  Pay<span className="text-[#0070ba]">Pal</span>
                </span>
                <span className="text-[9px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  SANDBOX
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-sans mt-1">
                Purchasing digital licenses from <strong className="text-zinc-800">LOMON LLC</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block">Total Price</span>
              <span className="text-2xl font-black text-[#003087]">
                ${amountUsd.toFixed(2)} <span className="text-xs font-normal text-zinc-500">USD</span>
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 text-left">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                Order Reference
              </span>
              <span className="font-mono text-xs text-blue-900 font-bold block truncate">
                {params.reference}
              </span>
              <span className="text-[11px] text-zinc-600 block mt-2">
                Account: <strong className="text-zinc-900">{params.email}</strong>
              </span>
            </div>

            {completed ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <Check size={28} />
                </div>
                <h3 className="font-extrabold text-base text-zinc-800">Payment Authorized!</h3>
                <p className="text-xs text-zinc-500">Redirecting to LOMON Archive Covenant Registry...</p>
              </div>
            ) : (
              <form onSubmit={handleApprove} className="space-y-4 text-left">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider block">
                    PayPal Sandbox Balance
                  </label>
                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700">PayPal Preferred Account Balance</span>
                    <span className="font-bold text-emerald-700">$5,000.00 USD</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-sm py-3.5 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                        <span>Authorizing with PayPal...</span>
                      </>
                    ) : (
                      <span>Complete Purchase with PayPal</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full text-zinc-500 hover:text-zinc-800 text-xs py-2 text-center font-medium cursor-pointer block transition-colors"
                  >
                    Cancel and return to LOMON LLC
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-200 text-center text-[10px] text-zinc-400 flex items-center justify-between font-mono">
            <div className="flex items-center gap-1">
              <Lock size={12} className="text-zinc-400" />
              <span>256-Bit Encrypted Connection</span>
            </div>
            <span>PayPal, Inc. © 2026</span>
          </div>

        </div>
      </div>

    </div>
  );
}
