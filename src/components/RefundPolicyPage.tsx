import React, { useEffect } from "react";
import { ArrowLeft, RefreshCw, Mail } from "lucide-react";
import DocumentScrollControls from "./DocumentScrollControls";

interface RefundPolicyPageProps {
  onBack?: () => void;
}

export default function RefundPolicyPage({ onBack }: RefundPolicyPageProps) {
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

  return (
    <div className="refund-page min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Container - Max Width 850px for clean, highly readable layout */}
      <div className="max-w-[850px] mx-auto space-y-10 text-left">
        
        {/* Top Header / Navigation Bar */}
        <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
          <button
            onClick={handleReturn}
            className="inline-flex items-center justify-center text-[11px] font-bold tracking-[0.2em] text-zinc-400 hover:text-white transition-colors uppercase cursor-pointer group border border-zinc-900 bg-zinc-950 px-3.5 py-2 rounded-sm w-fit"
            title="Return"
            aria-label="Return"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-zinc-300" />
          </button>

          <div className="flex items-center gap-2 text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest text-left break-words">
            <RefreshCw size={14} className="text-zinc-300 shrink-0" />
            <span className="break-words">REFUND POLICY</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-4 border-b border-zinc-900/80 pb-8 text-left">
          <div className="space-y-1 text-left">
            <span className="text-[11px] font-display font-bold tracking-[0.2em] sm:tracking-[0.25em] text-zinc-400 uppercase block text-left break-words">
              LOMON LLC
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-[0.12em] sm:tracking-[0.18em] uppercase leading-tight text-left break-words">
              REFUND POLICY
            </h1>
          </div>

          <div className="flex flex-wrap items-start sm:items-center gap-x-6 gap-y-2 text-[11px] font-mono text-zinc-400 border-t border-zinc-900/50 pt-4 text-left">
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Effective Date:</span>
              <span className="text-zinc-200">July 29, 2026</span>
            </div>
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Last Updated:</span>
              <span className="text-zinc-200">July 29, 2026</span>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-zinc-300 pt-2">
            This Refund Policy explains when refunds, cancellations, credits, exchanges, and payment disputes may apply to purchases made through <strong className="text-white">theowlclock.com</strong>.
          </p>

          <div className="p-4 bg-zinc-950 border border-zinc-900 text-[11.5px] text-zinc-400 leading-relaxed space-y-2 rounded-sm">
            <p>
              This Policy applies to all products and services offered by <strong className="text-white">LOMON LLC</strong>, operating as <strong className="text-white">The Owl Clock</strong>, including digital licenses, audio fragments, downloads, clearance services, publishing services, rights administration, and related transactions.
            </p>
            <p className="text-zinc-200 font-medium pt-1">
              This Refund Policy forms part of our Terms of Use.
            </p>
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-10 text-[13px] leading-relaxed text-zinc-300">

          {/* 1. Digital Products */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">1.</span> DIGITAL PRODUCTS
            </h2>
            <p>The Owl Clock primarily distributes digital products and services. These may include:</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-4 text-zinc-300 text-[12px] list-disc marker:text-zinc-500">
              <li>Audio Fragments</li>
              <li>Beat Licenses</li>
              <li>Master Licenses</li>
              <li>Sync Licenses</li>
              <li>Rights Administration</li>
              <li>Publishing Services</li>
              <li>Metadata Services</li>
              <li>Ownership Verification</li>
              <li>License Documents</li>
              <li>Digital Downloads</li>
              <li>Stems</li>
              <li>WAV Files</li>
              <li>MP3 Files</li>
              <li>Digital Documentation</li>
            </ul>
            <p className="text-zinc-400 text-[12px] pt-2">
              Because these products are delivered electronically, different refund rules apply than those for physical goods.
            </p>
          </section>

          {/* 2. General Policy */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">2.</span> GENERAL POLICY
            </h2>
            <p>Unless otherwise required by law or expressly approved in writing by LOMON LLC:</p>
            <div className="p-4 bg-zinc-950 border border-zinc-900 text-center rounded-sm">
              <strong className="text-white text-base tracking-widest font-mono uppercase">ALL SALES ARE FINAL.</strong>
            </div>
            <p className="text-zinc-400 text-[12px]">
              Once any digital product, License, download, access credential, or service has been delivered or made available, the purchase is generally non-refundable.
            </p>
          </section>

          {/* 3. Orders Eligible for Cancellation */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">3.</span> ORDERS ELIGIBLE FOR CANCELLATION
            </h2>
            <p>An order may be cancelled if:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>payment has been submitted;</li>
              <li>no License has been issued;</li>
              <li>no files have been delivered;</li>
              <li>no clearance review has begun;</li>
              <li>no rights administration has started; and</li>
              <li>no custom work has commenced.</li>
            </ul>
            <p className="text-zinc-400 text-[12px] pt-1">
              Approved cancellations will generally be refunded using the original payment method.
            </p>
          </section>

          {/* 4. Orders That Cannot Be Refunded */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">4.</span> ORDERS THAT CANNOT BE REFUNDED
            </h2>
            <p>Refunds will generally not be provided after:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12px] text-zinc-300 marker:text-zinc-500">
              <li>a License has been issued;</li>
              <li>download access has been provided;</li>
              <li>files have been delivered;</li>
              <li>stems have been released;</li>
              <li>a custom License has been prepared;</li>
              <li>rights administration has begun;</li>
              <li>publishing work has begun;</li>
              <li>metadata work has begun;</li>
              <li>ownership verification has begun;</li>
              <li>a custom agreement has been drafted;</li>
              <li>a clearance review has started; or</li>
              <li>a service has been substantially performed.</li>
            </ul>
          </section>

          {/* 5. Duplicate Purchases */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">5.</span> DUPLICATE PURCHASES
            </h2>
            <p>
              If you accidentally purchase the same License or product more than once, contact us immediately.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              If we verify that the duplicate purchase was made unintentionally and no additional rights were granted, we may:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>issue a refund;</li>
              <li>issue store credit; or</li>
              <li>consolidate the purchase into a single transaction.</li>
            </ul>
          </section>

          {/* 6. Incorrect Delivery */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">6.</span> INCORRECT DELIVERY
            </h2>
            <p>If you receive:</p>
            <ul className="grid grid-cols-2 gap-1 pl-5 list-disc text-[12px] text-zinc-300 marker:text-zinc-500">
              <li>the wrong Fragment;</li>
              <li>the wrong License;</li>
              <li>the wrong file format;</li>
              <li>corrupted files;</li>
              <li>incomplete downloads; or</li>
              <li>inaccessible files,</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              please notify us as soon as reasonably possible. Where appropriate, we may:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>resend the correct files;</li>
              <li>repair the delivery;</li>
              <li>replace corrupted files;</li>
              <li>issue corrected documentation; or</li>
              <li>provide another reasonable solution.</li>
            </ul>
          </section>

          {/* 7. Technical Problems */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">7.</span> TECHNICAL PROBLEMS
            </h2>
            <p>
              If a technical problem prevents you from accessing purchased materials, we will make reasonable efforts to resolve the issue. This may include:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>providing a new download link;</li>
              <li>replacing damaged files;</li>
              <li>correcting delivery errors;</li>
              <li>issuing updated documentation; or</li>
              <li>providing alternative delivery methods.</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 italic pt-1">
              Technical support does not automatically entitle a purchaser to a refund.
            </p>
          </section>

          {/* 8. License Revocation */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">8.</span> LICENSE REVOCATION
            </h2>
            <p>
              If a License is suspended or terminated because the Licensee:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12px] text-zinc-300 marker:text-zinc-500">
              <li>violated the Terms of Use;</li>
              <li>violated the License Agreement;</li>
              <li>submitted fraudulent information;</li>
              <li>made false ownership claims;</li>
              <li>failed to complete payment;</li>
              <li>initiated an improper chargeback;</li>
              <li>infringed intellectual-property rights; or</li>
              <li>otherwise materially breached an agreement,</li>
            </ul>
            <p className="text-[12.5px] text-zinc-200 font-medium pt-1">
              the Licensee is generally not entitled to a refund.
            </p>
          </section>

          {/* 9. Chargebacks */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">9.</span> CHARGEBACKS
            </h2>
            <p>Before initiating a chargeback, please contact us so we have an opportunity to resolve the issue.</p>
            <p className="text-[12.5px] text-zinc-400">Improper chargebacks may result in:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>suspension of the associated License;</li>
              <li>account restrictions;</li>
              <li>cancellation of future purchases;</li>
              <li>removal of download access;</li>
              <li>suspension of rights administration; and</li>
              <li>legal enforcement where appropriate.</li>
            </ul>
            <p className="text-[12px] text-zinc-400 pt-1 italic">
              Nothing in this section limits any right you may have under applicable law.
            </p>
          </section>

          {/* 10. Fraud Prevention */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">10.</span> FRAUD PREVENTION
            </h2>
            <p>LOMON LLC reserves the right to delay, refuse, cancel, or refund transactions where we reasonably believe:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>payment fraud has occurred;</li>
              <li>stolen payment methods were used;</li>
              <li>identity information is inaccurate;</li>
              <li>unauthorized purchases were attempted;</li>
              <li>transaction information is inconsistent; or</li>
              <li>the purchase creates a significant security or legal risk.</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              Where appropriate, additional identity verification may be requested before completing an order.
            </p>
          </section>

          {/* 11. Pricing Errors */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">11.</span> PRICING ERRORS
            </h2>
            <p>Despite reasonable efforts, pricing or availability errors may occasionally occur.</p>
            <p className="text-[12.5px] text-zinc-400">If an obvious pricing error is identified before a transaction is completed, LOMON LLC may:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>cancel the transaction;</li>
              <li>decline the order;</li>
              <li>request confirmation before processing; or</li>
              <li>issue a refund if payment has already been collected.</li>
            </ul>
          </section>

          {/* 12. Exclusive Licenses */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">12.</span> EXCLUSIVE LICENSES
            </h2>
            <p>Exclusive Acquisitions require significant administrative review.</p>
            <p className="text-[12.5px] text-zinc-200 font-medium">
              Once an Exclusive License or Exclusive Acquisition Agreement has been executed, it is generally non-refundable, except where otherwise required by law or expressly agreed in writing.
            </p>
          </section>

          {/* 13. Custom Services */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">13.</span> CUSTOM SERVICES
            </h2>
            <p>Refunds are generally unavailable for custom services that have already begun. These services may include:</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1 pl-5 list-disc text-[12px] text-zinc-300 marker:text-zinc-500">
              <li>Rights Administration</li>
              <li>Publishing Administration</li>
              <li>Metadata Preparation</li>
              <li>Ownership Verification</li>
              <li>Custom Licensing</li>
              <li>Clearance Consultation</li>
              <li>Split Documentation</li>
              <li>Archive Documentation</li>
              <li>Custom Legal Documents</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              Where work has only been partially completed, LOMON LLC may determine, in its sole discretion, whether a partial refund is appropriate.
            </p>
          </section>

          {/* 14. Promotional Sales */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">14.</span> PROMOTIONAL SALES
            </h2>
            <p>Unless expressly stated otherwise, the following remain subject to this Refund Policy:</p>
            <ul className="grid grid-cols-2 gap-1 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>promotional pricing;</li>
              <li>discounted purchases;</li>
              <li>limited-time offers;</li>
              <li>coupon purchases;</li>
              <li>bundle pricing; and</li>
              <li>special campaigns</li>
            </ul>
          </section>

          {/* 15. Store Credit */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">15.</span> STORE CREDIT
            </h2>
            <p>Where appropriate, LOMON LLC may choose to provide store credit, account credit, replacement products, or substitute services instead of issuing a monetary refund.</p>
            <p className="text-[12.5px] text-zinc-400">
              The decision to issue store credit instead of a refund remains at the discretion of LOMON LLC unless otherwise required by applicable law.
            </p>
          </section>

          {/* 16. Taxes and Processing Fees */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">16.</span> TAXES AND PROCESSING FEES
            </h2>
            <p>
              Taxes, payment-processing fees, currency-conversion fees, banking charges, or similar third-party costs may not be refundable.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              Refunds, where approved, generally apply only to the amount actually received by LOMON LLC.
            </p>
          </section>

          {/* 17. How to Request a Refund */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">17.</span> HOW TO REQUEST A REFUND
            </h2>
            <p>Refund requests should be submitted as soon as possible. Please include:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>your full name;</li>
              <li>email address;</li>
              <li>order number;</li>
              <li>transaction date;</li>
              <li>Fragment or License purchased;</li>
              <li>reason for the request; and</li>
              <li>any supporting documentation.</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">Refund requests should be sent to:</p>
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm w-fit font-mono text-[12px]">
              <a href="mailto:licensing@theowlclock.com" className="text-zinc-200 hover:text-white underline">
                licensing@theowlclock.com
              </a>
            </div>
          </section>

          {/* 18. Review Process */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">18.</span> REVIEW PROCESS
            </h2>
            <p>Each request is reviewed individually.</p>
            <p className="text-[12.5px] text-zinc-400">
              Depending on the circumstances, we may request additional information before making a decision. Submitting a refund request does not guarantee approval.
            </p>
          </section>

          {/* 19. Processing Approved Refunds */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">19.</span> PROCESSING APPROVED REFUNDS
            </h2>
            <p>
              If a refund is approved, it will generally be issued using the original payment method whenever reasonably possible.
            </p>
            <p className="text-[12.5px] text-zinc-400">Processing times depend on:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>the payment provider;</li>
              <li>the financial institution;</li>
              <li>banking systems; and</li>
              <li>payment-network processing times.</li>
            </ul>
            <p className="text-[12px] text-zinc-400 pt-1 italic">
              LOMON LLC cannot control the processing time of third-party financial institutions.
            </p>
          </section>

          {/* 20. Changes to This Refund Policy */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">20.</span> CHANGES TO THIS REFUND POLICY
            </h2>
            <p>
              LOMON LLC may update this Refund Policy from time to time. Updated versions will display a revised Last Updated date.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              The version in effect at the time of the applicable purchase generally governs that transaction unless otherwise required by law.
            </p>
          </section>

          {/* 21. Contact */}
          <section className="space-y-4 pt-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">21.</span> CONTACT
            </h2>
            <p>Questions regarding this Refund Policy may be directed to:</p>
            
            <div className="bg-zinc-950 p-6 border border-zinc-850 rounded-sm space-y-3 text-[12px]">
              <div className="space-y-1">
                <p className="font-bold text-white uppercase tracking-widest text-[13px]">LOMON LLC</p>
                <p className="text-zinc-400">Operating The Owl Clock</p>
                <p className="text-zinc-400">Licensing Department</p>
              </div>

              <div className="pt-2 border-t border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <a
                  href="mailto:licensing@theowlclock.com"
                  className="inline-flex items-center gap-2 text-zinc-200 hover:text-white transition-colors cursor-pointer font-mono font-bold"
                >
                  <Mail size={13} className="text-zinc-400" />
                  <span>licensing@theowlclock.com</span>
                </a>
                <a
                  href="https://theowlclock.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-white font-mono text-[11px]"
                >
                  theowlclock.com
                </a>
              </div>
            </div>
          </section>

        </div>

        {/* Return Button at Bottom */}
        <div className="pt-6 flex justify-start text-left">
          <button
            onClick={handleReturn}
            className="inline-flex items-center justify-center text-[11px] font-bold tracking-[0.2em] text-zinc-300 hover:text-white transition-colors uppercase cursor-pointer bg-transparent border border-zinc-800 hover:border-zinc-500 px-4 py-2 rounded-sm group"
            title="Return"
            aria-label="Return"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-zinc-300" />
          </button>
        </div>

        {/* Footer Info Banner */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-zinc-500 font-mono gap-4 text-left">
          <p className="text-left">© 2026 LOMON LLC. All rights reserved.</p>
          <p className="uppercase tracking-widest text-zinc-600 text-left">REFUND POLICY</p>
        </div>

        <DocumentScrollControls />
      </div>
    </div>
  );
}
