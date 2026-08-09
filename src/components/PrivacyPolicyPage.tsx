import React, { useEffect } from "react";
import { ArrowLeft, ShieldCheck, Mail, Cookie } from "lucide-react";
import DocumentScrollControls from "./DocumentScrollControls";

interface PrivacyPolicyPageProps {
  onBack?: () => void;
  onOpenCookies?: () => void;
}

export default function PrivacyPolicyPage({ onBack, onOpenCookies }: PrivacyPolicyPageProps) {
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
    <div className="privacy-page min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Container - Max Width 850px for clean, highly readable layout */}
      <div className="max-w-[850px] mx-auto space-y-10 text-left">
        
        {/* Top Header / Navigation Bar */}
        <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={handleReturn}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-zinc-400 hover:text-white transition-colors uppercase cursor-pointer group border border-zinc-900 bg-zinc-950 px-3.5 py-2 rounded-sm w-fit"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform text-zinc-300" />
            <span>RETURN TO PREVIOUS PAGE</span>
          </button>

          <div className="flex items-center gap-2 text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-zinc-300" />
            <span>PRIVACY POLICY</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-4 border-b border-zinc-900/80 pb-8">
          <div className="space-y-1">
            <span className="text-[11px] font-display font-bold tracking-[0.25em] text-zinc-400 uppercase block">
              LOMON LLC • PRIVACY POLICY
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-[0.18em] uppercase leading-tight">
              PRIVACY POLICY
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono text-zinc-400 border-t border-zinc-900/50 pt-4">
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
            This Privacy Policy explains how <strong className="text-white">LOMON LLC</strong>, operating as <strong className="text-white">The Owl Clock</strong>, collects, uses, stores, discloses, and protects personal information when you access or use <strong className="text-white">theowlclock.com</strong>, submit a clearance request, purchase a License, communicate with us, or otherwise interact with the Archive.
          </p>

          <div className="p-4 bg-zinc-950 border border-zinc-900 text-[11.5px] text-zinc-400 leading-relaxed space-y-2 rounded-sm">
            <p>
              In this Privacy Policy, “LOMON,” “The Owl Clock,” “we,” “us,” and “our” refer to LOMON LLC.
            </p>
            <p className="text-zinc-200 font-medium pt-1">
              By using The Owl Clock, you acknowledge the practices described in this Privacy Policy.
            </p>
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-10 text-[13px] leading-relaxed text-zinc-300">

          {/* 1. Scope of This Privacy Policy */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase text-left flex items-center gap-2">
              <span className="text-zinc-400">1.</span> SCOPE OF THIS PRIVACY POLICY
            </h2>
            <p>This Privacy Policy applies to personal information collected through:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 text-zinc-300 text-[12px] list-disc marker:text-zinc-500">
              <li>The Owl Clock website</li>
              <li>User accounts</li>
              <li>Clearance-request forms</li>
              <li>License purchases</li>
              <li>Contact and support forms</li>
              <li>Ownership-verification submissions</li>
              <li>Publishing and rights-administration services</li>
              <li>Email communications</li>
              <li>Archive-related transactions</li>
              <li>Other services operated by LOMON LLC</li>
            </ul>
            <p className="text-zinc-400 text-[12px] pt-2">
              This Privacy Policy does not govern websites, platforms, applications, or services operated independently by third parties.
            </p>
          </section>

          {/* 2. Personal Information We Collect */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">2.</span> PERSONAL INFORMATION WE COLLECT
            </h2>
            <p>The information we collect depends on how you interact with the Archive. We may collect the following categories of personal information.</p>

            <div className="space-y-4 pl-2">
              <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">Contact Information</h3>
                <p className="text-[12px] text-zinc-400 mb-1">This may include:</p>
                <ul className="list-disc pl-5 text-[12px] text-zinc-300 space-y-1 marker:text-zinc-500">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Telephone number</li>
                  <li>Mailing address</li>
                  <li>Country or region</li>
                  <li>Preferred method of communication</li>
                </ul>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">Professional and Business Information</h3>
                <p className="text-[12px] text-zinc-400 mb-1">This may include:</p>
                <ul className="list-disc pl-5 text-[12px] text-zinc-300 space-y-1 marker:text-zinc-500">
                  <li>Artist or professional name</li>
                  <li>Company name</li>
                  <li>Record label</li>
                  <li>Publisher</li>
                  <li>Management company</li>
                  <li>Production company</li>
                  <li>Distributor</li>
                  <li>Performing-rights organization</li>
                  <li>Professional role</li>
                  <li>Website</li>
                  <li>Social-media accounts</li>
                  <li>Business contact information</li>
                </ul>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">Licensing and Clearance Information</h3>
                <p className="text-[12px] text-zinc-400 mb-1">This may include:</p>
                <ul className="list-disc pl-5 text-[12px] text-zinc-300 space-y-1 marker:text-zinc-500">
                  <li>Fragment requested</li>
                  <li>Intended use</li>
                  <li>Project title</li>
                  <li>Artist name</li>
                  <li>Release date</li>
                  <li>Distribution plans</li>
                  <li>Territory</li>
                  <li>Media format</li>
                  <li>Estimated audience or distribution</li>
                  <li>Requested License type</li>
                  <li>Exclusivity request</li>
                  <li>Project budget</li>
                  <li>Clearance history</li>
                  <li>License status</li>
                  <li>Communications relating to the request</li>
                </ul>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">Ownership and Rights Information</h3>
                <p className="text-[12px] text-zinc-400 mb-1">This may include:</p>
                <ul className="list-disc pl-5 text-[12px] text-zinc-300 space-y-1 marker:text-zinc-500">
                  <li>Legal and professional names of writers, producers, artists, and rights holders</li>
                  <li>Copyright ownership</li>
                  <li>Master ownership</li>
                  <li>Composition ownership</li>
                  <li>Writer and publisher shares</li>
                  <li>IPI or CAE numbers</li>
                  <li>ISRCs</li>
                  <li>ISWCs</li>
                  <li>Performing-rights organization information</li>
                  <li>Publisher information</li>
                  <li>Split sheets</li>
                  <li>Contributor agreements</li>
                  <li>Rights-administration information</li>
                  <li>Royalty information</li>
                  <li>Clearance documentation</li>
                  <li>Ownership-verification records</li>
                </ul>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm space-y-2">
                <h3 className="font-bold text-white uppercase text-[12px]">Transaction Information</h3>
                <p className="text-[12px] text-zinc-400">This may include:</p>
                <ul className="list-disc pl-5 text-[12px] text-zinc-300 space-y-1 marker:text-zinc-500">
                  <li>Products, Licenses, or services purchased</li>
                  <li>Transaction date</li>
                  <li>Amount paid</li>
                  <li>Currency</li>
                  <li>Billing name and address</li>
                  <li>Payment status</li>
                  <li>Refund or chargeback information</li>
                  <li>Invoice information</li>
                  <li>Transaction identifiers</li>
                </ul>
                <p className="text-[11.5px] text-zinc-400 italic pt-1 border-t border-zinc-900">
                  Payments may be processed by third-party payment providers. We generally do not receive or store complete payment-card numbers, card security codes, or complete banking credentials.
                </p>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">Account Information</h3>
                <p className="text-[12px] text-zinc-400 mb-1">Where account functionality is available, we may collect:</p>
                <ul className="list-disc pl-5 text-[12px] text-zinc-300 space-y-1 marker:text-zinc-500">
                  <li>Username</li>
                  <li>Email address</li>
                  <li>Encrypted or securely processed login credentials</li>
                  <li>Account preferences</li>
                  <li>Account activity</li>
                  <li>Download history</li>
                  <li>License history</li>
                  <li>Saved requests</li>
                  <li>Account-security information</li>
                </ul>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">Communications</h3>
                <p className="text-[12px] text-zinc-400 mb-1">We may collect information contained in:</p>
                <ul className="list-disc pl-5 text-[12px] text-zinc-300 space-y-1 marker:text-zinc-500">
                  <li>Emails</li>
                  <li>Contact forms</li>
                  <li>Support requests</li>
                  <li>Clearance discussions</li>
                  <li>License negotiations</li>
                  <li>Direct communications</li>
                  <li>Complaints</li>
                  <li>Copyright notices</li>
                  <li>Feedback</li>
                  <li>Other correspondence</li>
                </ul>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm space-y-2">
                <h3 className="font-bold text-white uppercase text-[12px]">Submitted Materials</h3>
                <p className="text-[12px] text-zinc-400">You may voluntarily provide materials such as:</p>
                <ul className="list-disc pl-5 text-[12px] text-zinc-300 space-y-1 marker:text-zinc-500">
                  <li>Audio recordings</li>
                  <li>Musical compositions</li>
                  <li>Videos</li>
                  <li>Artwork</li>
                  <li>Project files</li>
                  <li>Split sheets</li>
                  <li>Agreements</li>
                  <li>Identification documents</li>
                  <li>Corporate documents</li>
                  <li>Ownership evidence</li>
                  <li>Release information</li>
                  <li>Other supporting materials</li>
                </ul>
                <p className="text-[11.5px] text-zinc-400 font-mono pt-1">
                  Do not submit sensitive or confidential material unless it is reasonably necessary for the requested service.
                </p>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">Technical and Usage Information</h3>
                <p className="text-[12px] text-zinc-400 mb-1">When you access the Archive, certain information may be collected automatically, including:</p>
                <ul className="list-disc pl-5 text-[12px] text-zinc-300 space-y-1 marker:text-zinc-500">
                  <li>Internet Protocol address</li>
                  <li>Browser type</li>
                  <li>Device type</li>
                  <li>Operating system</li>
                  <li>Language settings</li>
                  <li>Approximate location derived from an IP address</li>
                  <li>Referring website</li>
                  <li>Pages viewed</li>
                  <li>Links selected</li>
                  <li>Date and time of access</li>
                  <li>Session duration</li>
                  <li>Website interactions</li>
                  <li>Error and performance data</li>
                  <li>Cookie and similar-technology identifiers</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. How We Collect Information */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">3.</span> HOW WE COLLECT INFORMATION
            </h2>
            <p>We may collect personal information:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>Directly from you</li>
              <li>Through website forms</li>
              <li>During account creation</li>
              <li>During checkout</li>
              <li>When you request clearance</li>
              <li>When you purchase or receive a License</li>
              <li>When you submit ownership or rights documentation</li>
              <li>When you contact us</li>
              <li>Through cookies and similar technologies</li>
              <li>From payment processors and service providers</li>
              <li>From distributors, publishers, labels, administrators, representatives, or collaborators acting in connection with your request</li>
              <li>From publicly available sources where reasonably necessary to verify rights, credits, ownership, or professional information</li>
            </ul>
          </section>

          {/* 4. How We Use Personal Information */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">4.</span> HOW WE USE PERSONAL INFORMATION
            </h2>
            <p>We may use personal information to:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-zinc-300 text-[12px] pl-4 list-disc marker:text-zinc-500">
              <li>Operate and maintain the Archive</li>
              <li>Provide website features</li>
              <li>Create and manage accounts</li>
              <li>Process clearance requests</li>
              <li>Evaluate proposed uses of Fragments</li>
              <li>Prepare, issue, and administer Licenses</li>
              <li>Deliver authorized materials</li>
              <li>Process transactions</li>
              <li>Send receipts and transaction confirmations</li>
              <li>Respond to questions and support requests</li>
              <li>Verify identity, authority, ownership, and rights</li>
              <li>Maintain metadata and archival records</li>
              <li>Administer composition, publishing, master, and royalty information</li>
              <li>Maintain licensing and transaction history</li>
              <li>Communicate about requests, purchases, agreements, or services</li>
              <li>Prevent fraud, unauthorized access, and misuse</li>
              <li>Investigate suspected violations</li>
              <li>Enforce the Terms of Use, Licenses, and other agreements</li>
              <li>Resolve ownership or content-identification conflicts</li>
              <li>Protect LOMON LLC, Users, Licensees, and rights holders</li>
              <li>Improve website performance and user experience</li>
              <li>Understand how the Archive is accessed and used</li>
              <li>Maintain technical security</li>
              <li>Comply with legal, accounting, tax, reporting, and recordkeeping obligations</li>
              <li>Establish, exercise, or defend legal claims</li>
              <li>Carry out other purposes disclosed when information is collected</li>
            </ul>
          </section>

          {/* 5. Legal Bases for Processing */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">5.</span> LEGAL BASES FOR PROCESSING
            </h2>
            <p>Where applicable law requires a legal basis, we may process personal information because:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>Processing is necessary to perform or prepare a contract with you</li>
              <li>Processing is necessary to complete a transaction</li>
              <li>You have provided consent</li>
              <li>Processing is necessary to comply with a legal obligation</li>
              <li>Processing is necessary for our legitimate business interests</li>
              <li>Processing is necessary to establish, exercise, or defend legal rights</li>
              <li>Processing is necessary to prevent fraud, abuse, or security threats</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-2">
              Our legitimate interests may include operating the Archive, administering rights, maintaining accurate records, responding to requests, protecting intellectual property, improving services, preventing misuse, and supporting business operations.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              Where processing is based on consent, you may withdraw that consent at any time. Withdrawal does not affect processing lawfully completed before consent was withdrawn.
            </p>
          </section>

          {/* 6. Clearance and Ownership Verification */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">6.</span> CLEARANCE AND OWNERSHIP VERIFICATION
            </h2>
            <p>
              Information submitted for clearance, licensing, publishing, metadata, ownership verification, or rights administration may be used to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>Confirm the identity and authority of the requesting party</li>
              <li>Review the intended use of a Fragment</li>
              <li>Determine whether rights are available</li>
              <li>Identify relevant writers, producers, publishers, labels, and master owners</li>
              <li>Verify ownership claims</li>
              <li>Compare submitted information with existing Archive records</li>
              <li>Identify conflicting registrations or claims</li>
              <li>Prepare License documentation</li>
              <li>Maintain evidence of authorization</li>
              <li>Administer credits, royalties, and ownership information</li>
              <li>Communicate with relevant rights holders or representatives</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              Where necessary, submitted information may be shared with parties involved in the applicable composition, master recording, License, claim, or transaction.
            </p>
          </section>

          {/* 7. Payments */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">7.</span> PAYMENTS
            </h2>
            <p>Payments may be processed by independent payment providers.</p>
            <p className="text-[12.5px] text-zinc-400">Payment providers may collect information such as:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>Name</li>
              <li>Billing address</li>
              <li>Payment-card information</li>
              <li>Bank or payment-account information</li>
              <li>Transaction details</li>
              <li>Device and fraud-prevention information</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              Their collection and use of personal information are governed by their own privacy policies.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              LOMON LLC may receive limited transaction information, such as payment status, billing name, transaction identifier, amount, date, and the last digits of a payment card.
            </p>
            <p className="text-[12.5px] text-zinc-200 font-medium">
              We do not intentionally store complete payment-card numbers or card security codes on our own systems.
            </p>
          </section>

          {/* 8. Cookies and Similar Technologies */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">8.</span> COOKIES AND SIMILAR TECHNOLOGIES
            </h2>
            <p>The Archive may use cookies, pixels, local storage, log files, and similar technologies to:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 list-disc pl-5 text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Operate essential website features</li>
              <li>Maintain sessions</li>
              <li>Remember preferences</li>
              <li>Protect accounts</li>
              <li>Prevent fraud</li>
              <li>Process transactions</li>
              <li>Measure website traffic</li>
              <li>Understand website usage</li>
              <li>Diagnose technical problems</li>
              <li>Improve performance</li>
              <li>Support communications or marketing where permitted</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-2">
              Some technologies are necessary for the website to function. Others may be optional and subject to your consent where required. Additional information appears in the separate Cookie Policy.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              You may control certain cookies through the cookie settings made available on the website or through your browser settings. Disabling cookies may affect the operation of some features.
            </p>
            {onOpenCookies && (
              <button
                onClick={onOpenCookies}
                className="mt-2 inline-flex items-center gap-2 text-[11px] font-bold text-zinc-300 hover:text-white uppercase tracking-wider underline cursor-pointer"
              >
                <Cookie size={13} />
                <span>REVIEW & CONFIGURE COOKIE PREFERENCES</span>
              </button>
            )}
          </section>

          {/* 9. Analytics */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">9.</span> ANALYTICS
            </h2>
            <p>We may use analytics providers to understand how visitors interact with the Archive.</p>
            <p className="text-[12.5px] text-zinc-400">Analytics information may include:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Pages viewed</li>
              <li>Session duration</li>
              <li>Referral source</li>
              <li>General geographic region</li>
              <li>Browser and device information</li>
              <li>Website interactions</li>
              <li>Performance and error data</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              We use this information to maintain, secure, analyze, and improve the Archive. Where required, non-essential analytics technologies will be activated only after the appropriate consent has been obtained.
            </p>
          </section>

          {/* 10. Marketing Communications */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">10.</span> MARKETING COMMUNICATIONS
            </h2>
            <p>Where permitted, we may send communications relating to:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>New Fragments</li>
              <li>Archive releases</li>
              <li>Licensing opportunities</li>
              <li>Service updates</li>
              <li>Announcements</li>
              <li>Events</li>
              <li>Relevant LOMON LLC offerings</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              You may unsubscribe from promotional emails by using the unsubscribe option included in the message or by contacting us.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              You may continue to receive non-promotional communications relating to purchases, Licenses, clearance requests, account security, legal notices, transactions, support requests, or rights administration.
            </p>
          </section>

          {/* 11. How We Disclose Personal Information */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">11.</span> HOW WE DISCLOSE PERSONAL INFORMATION
            </h2>
            <p>We may disclose personal information to the following categories of recipients.</p>

            <div className="space-y-3 pl-2">
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">Service Providers</h3>
                <p className="text-[12px] text-zinc-300">
                  We may engage service providers that assist with website hosting, cloud storage, payment processing, email delivery, customer support, analytics, security, fraud prevention, accounting, legal services, document execution, file delivery, and technical maintenance. Service providers may access personal information only as reasonably necessary to provide services to us and subject to applicable contractual or legal obligations.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">Rights Holders and Project Participants</h3>
                <p className="text-[12px] text-zinc-300">
                  Where necessary for licensing, clearance, ownership verification, publishing, royalty administration, or dispute resolution, we may disclose relevant information to writers, producers, artists, publishers, record labels, master owners, managers, attorneys, administrators, distributors, collection societies, performing-rights organizations, mechanical-rights organizations, and other authorized representatives.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">Business Transactions</h3>
                <p className="text-[12px] text-zinc-300">
                  Personal information may be disclosed in connection with a proposed or completed merger, acquisition, financing, reorganization, sale of assets, transfer of the Archive, or change in ownership or control. Any recipient will be expected to handle personal information in accordance with applicable law.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">Legal and Protective Purposes</h3>
                <p className="text-[12px] text-zinc-300">
                  We may disclose personal information where we reasonably believe disclosure is necessary to comply with law, respond to a subpoena, court order, or lawful government request, enforce agreements, investigate fraud or misuse, protect intellectual property, protect the security of the Archive, prevent harm, establish, exercise, or defend legal claims, or protect the rights of LOMON LLC or another party.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1">
                <h3 className="font-bold text-white uppercase text-[12px]">With Your Direction or Consent</h3>
                <p className="text-[12px] text-zinc-300">
                  We may disclose information when you request, direct, authorize, or consent to the disclosure.
                </p>
              </div>
            </div>
          </section>

          {/* 12. Sale and Sharing of Personal Information */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">12.</span> SALE AND SHARING OF PERSONAL INFORMATION
            </h2>
            <p>LOMON LLC does not sell personal information in exchange for money.</p>
            <p className="text-[12.5px] text-zinc-400">
              Some privacy laws may define certain disclosures involving advertising, analytics, or cross-context behavioral advertising as a “sale” or “sharing,” even when no money is exchanged. Where such laws apply, eligible Users may request to opt out of applicable sale, sharing, or targeted-advertising activities.
            </p>
            <p className="text-[12.5px] text-zinc-200 font-medium">
              We do not knowingly sell or share the personal information of children under sixteen years old for targeted advertising.
            </p>
          </section>

          {/* 13. Data Retention */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">13.</span> DATA RETENTION
            </h2>
            <p>
              We retain personal information only for as long as reasonably necessary for the purposes described in this Privacy Policy.
            </p>
            <p className="text-[12.5px] text-zinc-400">Retention periods may depend on:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>The nature of the information</li>
              <li>The purpose for which it was collected</li>
              <li>The duration of an account or business relationship</li>
              <li>License and contractual requirements</li>
              <li>Ownership and royalty-administration needs</li>
              <li>Fraud-prevention requirements</li>
              <li>Tax, accounting, and legal obligations</li>
              <li>Applicable limitation periods</li>
              <li>Pending disputes or claims</li>
              <li>Security and enforcement needs</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              Certain License, transaction, ownership, metadata, acceptance, and rights-administration records may be retained for an extended period because they may be necessary to verify authorization, ownership, credits, royalty obligations, or historical licensing activity.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              When information is no longer reasonably necessary, we may delete, anonymize, or securely dispose of it.
            </p>
          </section>

          {/* 14. Data Security */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">14.</span> DATA SECURITY
            </h2>
            <p>
              We use reasonable administrative, technical, and organizational measures designed to protect personal information against unauthorized access, unlawful use, loss, theft, alteration, destruction, or improper disclosure.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              These measures may include access controls, secure hosting, restricted permissions, authentication procedures, encryption where appropriate, monitoring, backups, and vendor-management practices. No system, transmission method, or storage service can be guaranteed to be completely secure.
            </p>
            <p className="text-[12.5px] text-zinc-200">
              You are responsible for protecting your account credentials, devices, files, and communications. Report suspected unauthorized account activity to <a href="mailto:licensing@theowlclock.com" className="text-white underline">licensing@theowlclock.com</a>.
            </p>
          </section>

          {/* 15. International Data Transfers */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">15.</span> INTERNATIONAL DATA TRANSFERS
            </h2>
            <p>LOMON LLC is based in the United States.</p>
            <p className="text-[12.5px] text-zinc-400">
              If you access the Archive from another country, your personal information may be transferred to, stored in, or processed in the United States or another location where our service providers operate. Privacy and data-protection laws in those locations may differ from the laws where you live.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              Where required by applicable law, we will use appropriate safeguards for international transfers of personal information.
            </p>
          </section>

          {/* 16. Your Privacy Rights */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">16.</span> YOUR PRIVACY RIGHTS
            </h2>
            <p>Depending on where you live and subject to applicable law, you may have the right to:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Request confirmation that we process your personal information</li>
              <li>Request access to your personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of certain information</li>
              <li>Request restriction of certain processing</li>
              <li>Object to certain processing</li>
              <li>Request a portable copy of certain information</li>
              <li>Withdraw consent</li>
              <li>Opt out of certain marketing communications</li>
              <li>Opt out of certain targeted advertising, sale, or sharing activities</li>
              <li>Appeal a decision concerning a privacy request</li>
              <li>Submit a complaint to an applicable data-protection authority</li>
              <li>Receive equal service and pricing when exercising protected privacy rights</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              These rights are not absolute. A request may be denied or limited where retaining or processing information is reasonably necessary to complete a transaction, perform or enforce a contract, maintain License and ownership records, administer rights or royalties, detect or prevent fraud, protect security, exercise or defend legal claims, comply with law, or protect another person’s rights.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              Privacy laws in California and the European Economic Area provide qualifying individuals with rights concerning access, correction, deletion, portability, objection, and certain uses or disclosures of personal information.
            </p>
          </section>

          {/* 17. Submitting a Privacy Request */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">17.</span> SUBMITTING A PRIVACY REQUEST
            </h2>
            <p>To submit a privacy request, contact:</p>
            <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-sm font-mono text-[12px] space-y-1">
              <p className="text-white font-bold">LOMON LLC PRIVACY DEPARTMENT</p>
              <a href="mailto:licensing@theowlclock.com" className="text-zinc-200 hover:text-white underline block">
                licensing@theowlclock.com
              </a>
            </div>
            <p className="text-[12.5px] text-zinc-400 pt-1">Your request should include:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>Your full name</li>
              <li>The email address associated with your interaction or account</li>
              <li>The privacy right you wish to exercise</li>
              <li>Sufficient information to identify the relevant records</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              We may take reasonable steps to verify your identity before completing a request. Where permitted, an authorized agent may submit a request on your behalf. We may require evidence that the agent has authority to act for you and may request direct identity confirmation from you. We will respond within the period required by applicable law.
            </p>
          </section>

          {/* 18. Children’s Privacy */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">18.</span> CHILDREN’S PRIVACY
            </h2>
            <p>The Archive is not directed toward children under thirteen years old.</p>
            <p className="text-[12.5px] text-zinc-400">
              We do not knowingly request or collect personal information directly from children under thirteen. A person under the legal age of majority may purchase a License or enter into an agreement only with the involvement and authorization of a parent or legal guardian.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              If we learn that personal information was collected directly from a child under thirteen without appropriate authorization, we will take reasonable steps to delete it. A parent or legal guardian who believes a child has submitted personal information may contact <a href="mailto:licensing@theowlclock.com" className="text-white underline">licensing@theowlclock.com</a>.
            </p>
            <p className="text-[12.5px] text-zinc-400 italic">
              United States federal children’s privacy requirements apply to child-directed online services and to general-audience services that knowingly collect personal information from children under thirteen.
            </p>
          </section>

          {/* 19. Third-Party Websites and Platforms */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">19.</span> THIRD-PARTY WEBSITES AND PLATFORMS
            </h2>
            <p>The Archive may contain links to or integrations with third-party websites and services, including:</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Payment providers</li>
              <li>Social-media platforms</li>
              <li>Streaming platforms</li>
              <li>Distributors</li>
              <li>Cloud-storage services</li>
              <li>Electronic-signature providers</li>
              <li>Analytics services</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              We do not control the privacy practices of independent third parties. You should review the privacy policy of each third-party service before providing personal information or using that service.
            </p>
          </section>

          {/* 20. Automated Decision-Making */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">20.</span> AUTOMATED DECISION-MAKING
            </h2>
            <p>
              LOMON LLC does not intend to make decisions producing legal or similarly significant effects solely through automated processing without meaningful human involvement.
            </p>
            <p className="text-[12.5px] text-zinc-400">We may use automated tools for:</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Security monitoring</li>
              <li>Fraud detection</li>
              <li>Spam prevention</li>
              <li>Website analytics</li>
              <li>Technical performance</li>
              <li>Transaction screening</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              Where applicable law provides rights relating to automated decision-making, eligible Users may contact us for additional information.
            </p>
          </section>

          {/* 21. Do Not Track and Privacy Signals */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">21.</span> DO NOT TRACK AND PRIVACY SIGNALS
            </h2>
            <p>Some browsers allow Users to send “Do Not Track” signals.</p>
            <p className="text-[12.5px] text-zinc-400">
              Because there is no universally accepted standard governing all Do Not Track signals, the Archive may not respond to every such signal. Where required by applicable law and supported by our systems, we may recognize legally valid browser-based opt-out preference signals.
            </p>
          </section>

          {/* 22. Copyright and Legal Submissions */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">22.</span> COPYRIGHT AND LEGAL SUBMISSIONS
            </h2>
            <p>
              Information contained in copyright complaints, ownership disputes, takedown requests, counter-notices, or other legal submissions may be used and disclosed as necessary to investigate the matter, contact relevant parties, verify authority, respond to the complaint, comply with law, resolve the dispute, maintain evidence, and enforce rights.
            </p>
            <p className="text-[12.5px] text-zinc-200 font-medium">
              Do not submit a legal notice containing information you are not authorized to disclose.
            </p>
          </section>

          {/* 23. Changes to This Privacy Policy */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">23.</span> CHANGES TO THIS PRIVACY POLICY
            </h2>
            <p>LOMON LLC may update this Privacy Policy to reflect changes in:</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Archive operations</li>
              <li>Information practices</li>
              <li>Available services</li>
              <li>Technology</li>
              <li>Service providers</li>
              <li>Security procedures</li>
              <li>Legal requirements</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              The updated Privacy Policy will display a revised “Last Updated” date. Where required, we may provide additional notice of material changes.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              Continued use of the Archive after an updated Privacy Policy becomes effective constitutes acknowledgment of the revised policy.
            </p>
          </section>

          {/* 24. Contact */}
          <section className="space-y-4 pt-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-zinc-400">24.</span> CONTACT
            </h2>
            <p>Questions, requests, or concerns regarding this Privacy Policy may be directed to:</p>
            
            <div className="bg-zinc-950 p-6 border border-zinc-850 rounded-sm space-y-3 text-[12px]">
              <div className="space-y-1">
                <p className="font-bold text-white uppercase tracking-widest text-[13px]">LOMON LLC</p>
                <p className="text-zinc-400">Operating The Owl Clock</p>
                <p className="text-zinc-400">Privacy Department</p>
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
        <div className="pt-6 flex justify-start">
          <button
            onClick={handleReturn}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-zinc-300 hover:text-white transition-colors uppercase cursor-pointer bg-transparent border border-zinc-800 hover:border-zinc-500 px-4 py-2 rounded-sm"
          >
            <span>← RETURN TO PREVIOUS PAGE</span>
          </button>
        </div>

        {/* Footer Info Banner */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row justify-between items-center text-[11px] text-zinc-500 font-mono gap-4">
          <p>© 2026 LOMON LLC. All rights reserved.</p>
          <p className="uppercase tracking-widest text-zinc-600">PRIVACY POLICY</p>
        </div>

        <DocumentScrollControls />
      </div>
    </div>
  );
}
