import React, { useEffect } from "react";
import { ArrowLeft, ShieldAlert, Mail } from "lucide-react";
import DocumentScrollControls from "./DocumentScrollControls";

interface AcceptableUsePageProps {
  onBack?: () => void;
}

export default function AcceptableUsePage({ onBack }: AcceptableUsePageProps) {
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
    <div className="acceptable-use-page min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
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
            <ShieldAlert size={14} className="text-zinc-300 shrink-0" />
            <span className="break-words">ACCEPTABLE USE POLICY</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-4 border-b border-zinc-900/80 pb-8 text-left">
          <div className="space-y-1 text-left">
            <span className="text-[11px] font-display font-bold tracking-[0.2em] sm:tracking-[0.25em] text-zinc-400 uppercase block text-left break-words">
              LOMON LLC
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-[0.12em] sm:tracking-[0.18em] uppercase leading-tight text-left break-words">
              ACCEPTABLE USE POLICY
            </h1>
          </div>

          <div className="flex flex-wrap items-start sm:items-center gap-x-6 gap-y-2 text-[11px] font-mono text-zinc-400 border-t border-zinc-900/50 pt-4 text-left">
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Effective Date:</span>
              <span className="text-zinc-200">August 7, 2026</span>
            </div>
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Last Updated:</span>
              <span className="text-zinc-200">August 7, 2026</span>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-zinc-300 pt-2">
            This Acceptable Use Policy explains the standards that apply when accessing or using <strong className="text-white">theowlclock.com</strong>, its Archive, licensing systems, clearance services, downloads, metadata, documentation, and related services operated by <strong className="text-white">LOMON LLC</strong>.
          </p>

          <div className="p-4 bg-zinc-950 border border-zinc-900 text-[11.5px] text-zinc-400 leading-relaxed rounded-sm">
            This Policy forms part of our Terms of Use. By using The Owl Clock, you agree to comply with this Policy.
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-10 text-[13px] leading-relaxed text-zinc-300">

          {/* 1. Purpose */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">1.</span> PURPOSE
            </h2>
            <p>The Owl Clock exists to preserve, license, and administer original musical works and their associated rights.</p>
            <p className="text-zinc-400 text-[12px]">This Policy is intended to protect:</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-4 text-zinc-300 text-[12px] list-disc marker:text-zinc-500">
              <li>The Archive</li>
              <li>Archive Material</li>
              <li>Rights holders</li>
              <li>Licensees</li>
              <li>Contributors</li>
              <li>Website users</li>
              <li>Intellectual property</li>
              <li>Metadata integrity</li>
              <li>Licensing systems</li>
              <li>Digital infrastructure</li>
            </ul>
          </section>

          {/* 2. Lawful Use */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">2.</span> LAWFUL USE
            </h2>
            <p>You may use the Archive only for lawful purposes.</p>
            <p className="text-zinc-400 text-[12px]">You agree not to use the Archive in a manner that:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Violates applicable law</li>
              <li>Infringes another person’s rights</li>
              <li>Circumvents a License</li>
              <li>Damages the Archive</li>
              <li>Interferes with another User’s access</li>
              <li>Compromises security</li>
              <li>Misrepresents ownership</li>
              <li>Creates fraudulent records</li>
            </ul>
          </section>

          {/* 3. Respect for Intellectual Property */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">3.</span> RESPECT FOR INTELLECTUAL PROPERTY
            </h2>
            <p>You may not:</p>
            <ul className="space-y-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Claim ownership of Archive Material that you do not own.</li>
              <li>Copy or distribute Fragments without authorization.</li>
              <li>Upload Archive Material to another platform without permission.</li>
              <li>Remove ownership notices.</li>
              <li>Remove producer credits.</li>
              <li>Remove copyright notices.</li>
              <li>Misrepresent writers, publishers, producers, or owners.</li>
              <li>Register rights you have not been granted.</li>
            </ul>
            <p className="p-3 bg-zinc-950 border border-zinc-900 text-[12px] text-zinc-300 rounded-sm font-medium mt-3">
              Every Fragment remains protected by applicable copyright and contractual rights.
            </p>
          </section>

          {/* 4. Licensing Compliance */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">4.</span> LICENSING COMPLIANCE
            </h2>
            <p>You must use every Fragment exactly as permitted under the applicable License.</p>
            <p className="text-zinc-400 text-[12px]">You may not:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Exceed License limits.</li>
              <li>Ignore territorial restrictions.</li>
              <li>Ignore duration limits.</li>
              <li>Ignore distribution limits.</li>
              <li>Ignore revenue limitations.</li>
              <li>Ignore exclusivity provisions.</li>
              <li>Transfer a License without written approval.</li>
              <li>Grant sublicenses unless expressly authorized.</li>
            </ul>
          </section>

          {/* 5. Metadata Integrity */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">5.</span> METADATA INTEGRITY
            </h2>
            <p className="font-mono text-zinc-200 text-[12px] uppercase tracking-wider">Metadata is part of the Archive.</p>
            <p className="text-zinc-400 text-[12px]">You may not:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Remove metadata.</li>
              <li>Alter ownership records.</li>
              <li>Change producer information.</li>
              <li>Change writer information.</li>
              <li>Change publisher information.</li>
              <li>Falsify timestamps.</li>
              <li>Replace archival identifiers.</li>
              <li>Submit inaccurate registrations.</li>
              <li>Create duplicate ownership claims.</li>
              <li>Interfere with royalty reporting.</li>
            </ul>
          </section>

          {/* 6. Archive Integrity */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">6.</span> ARCHIVE INTEGRITY
            </h2>
            <p>Users must preserve the integrity of every archived Fragment.</p>
            <p className="text-zinc-400 text-[12px]">You may not:</p>
            <ul className="space-y-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Present a Fragment as an original work that you created.</li>
              <li>Remove identifying Archive information.</li>
              <li>Repackage Archive Material for resale.</li>
              <li>Create a competing archive using Archive Material.</li>
              <li>Represent Archive Material as public domain.</li>
              <li>Mislead others regarding ownership.</li>
            </ul>
          </section>

          {/* 7. Artificial Intelligence */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">7.</span> ARTIFICIAL INTELLIGENCE
            </h2>
            <p>
              Unless expressly authorized in writing by LOMON LLC, Archive Material may not be used to:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12px] text-zinc-300 marker:text-zinc-500">
              <li>Train artificial-intelligence systems.</li>
              <li>Train machine-learning models.</li>
              <li>Create datasets.</li>
              <li>Fine-tune generative models.</li>
              <li>Develop music-generation systems.</li>
              <li>Clone production styles.</li>
              <li>Create embeddings.</li>
              <li>Build reference libraries.</li>
              <li>Generate synthetic derivatives.</li>
              <li>Perform model evaluation.</li>
              <li>Improve commercial AI products.</li>
            </ul>
            <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-sm mt-3">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">This restriction applies to:</p>
              <ul className="grid grid-cols-3 sm:grid-cols-3 gap-1.5 pl-4 list-disc text-[11.5px] text-zinc-300 marker:text-zinc-500 font-mono">
                <li>Audio</li>
                <li>Stems</li>
                <li>Artwork</li>
                <li>Metadata</li>
                <li>Documentation</li>
                <li>Waveforms</li>
                <li>Website text</li>
                <li>Visual assets</li>
                <li>Recovery records</li>
              </ul>
            </div>
          </section>

          {/* 8. Automated Access */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">8.</span> AUTOMATED ACCESS
            </h2>
            <p>You may not use automated systems to access or collect Archive Material.</p>
            <p className="text-zinc-400 text-[12px]">Prohibited activities include:</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pl-5 list-disc text-[12px] text-zinc-300 marker:text-zinc-500">
              <li>Scraping</li>
              <li>Crawling</li>
              <li>Data mining</li>
              <li>Bulk downloading</li>
              <li>Automated indexing</li>
              <li>Mirroring</li>
              <li>Dataset creation</li>
              <li>Automated collection</li>
              <li>Unauthorized API usage</li>
              <li>Browser automation</li>
              <li>Bots</li>
              <li>Scripts</li>
              <li>Artificial traffic generation</li>
            </ul>
            <p className="text-[12px] text-zinc-400 italic pt-1">
              Written authorization is required before conducting any automated activity involving the Archive.
            </p>
          </section>

          {/* 9. Security */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">9.</span> SECURITY
            </h2>
            <p>You may not:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Attempt unauthorized access.</li>
              <li>Probe the Archive for vulnerabilities.</li>
              <li>Circumvent security systems.</li>
              <li>Disable security measures.</li>
              <li>Introduce malware.</li>
              <li>Upload malicious software.</li>
              <li>Attempt denial-of-service attacks.</li>
              <li>Interfere with servers.</li>
              <li>Disrupt website operations.</li>
              <li>Attempt privilege escalation.</li>
            </ul>
          </section>

          {/* 10. Accounts */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">10.</span> ACCOUNTS
            </h2>
            <p>Where accounts are available, you agree to:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>Provide accurate information.</li>
              <li>Protect your password.</li>
              <li>Protect your login credentials.</li>
              <li>Notify us of suspected unauthorized access.</li>
              <li>Maintain current account information.</li>
            </ul>
            <p className="text-zinc-400 text-[12px] pt-2">You may not:</p>
            <ul className="grid grid-cols-2 gap-1 pl-5 list-disc text-[12px] text-zinc-300 marker:text-zinc-500">
              <li>Share accounts.</li>
              <li>Sell accounts.</li>
              <li>Transfer accounts.</li>
              <li>Create fraudulent accounts.</li>
              <li>Impersonate another User.</li>
            </ul>
          </section>

          {/* 11. Payments */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">11.</span> PAYMENTS
            </h2>
            <p>You may not:</p>
            <ul className="space-y-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Use stolen payment methods.</li>
              <li>Submit fraudulent payment information.</li>
              <li>Reverse legitimate payments after receiving licensed materials.</li>
              <li>Circumvent payment systems.</li>
              <li>Misrepresent billing information.</li>
            </ul>
            <p className="text-[12px] text-zinc-400 italic pt-1">
              Improper payment activity may result in suspension or termination of Licenses.
            </p>
          </section>

          {/* 12. Content Identification Systems */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">12.</span> CONTENT IDENTIFICATION SYSTEMS
            </h2>
            <p>Unless expressly authorized by your License, you may not:</p>
            <ul className="space-y-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Register Archive Material with YouTube Content ID.</li>
              <li>Register Archive Material with Meta Rights Manager.</li>
              <li>Register Archive Material with automated fingerprinting systems.</li>
              <li>Register Archive Material in your own name.</li>
              <li>Issue takedown notices against LOMON LLC.</li>
              <li>Issue ownership claims against authorized Licensees.</li>
              <li>Create conflicting content-identification claims.</li>
            </ul>
          </section>

          {/* 13. User Communications */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">13.</span> USER COMMUNICATIONS
            </h2>
            <p>You may not use the Archive to:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Harass others.</li>
              <li>Threaten others.</li>
              <li>Defame others.</li>
              <li>Submit false complaints.</li>
              <li>Impersonate another person.</li>
              <li>Submit fraudulent ownership claims.</li>
              <li>Abuse support services.</li>
              <li>Interfere with rights-administration processes.</li>
            </ul>
          </section>

          {/* 14. Submitted Materials */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">14.</span> SUBMITTED MATERIALS
            </h2>
            <p>When submitting materials to the Archive, you represent that:</p>
            <ul className="space-y-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>You own the submitted material or have authority to provide it.</li>
              <li>The submission is accurate.</li>
              <li>The submission does not knowingly violate another person’s rights.</li>
              <li>The submission does not contain malicious software.</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              LOMON LLC may reject or remove submissions that violate this Policy.
            </p>
          </section>

          {/* 15. Prohibited Commercial Activity */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">15.</span> PROHIBITED COMMERCIAL ACTIVITY
            </h2>
            <p>Without written authorization, you may not:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Resell Archive Material.</li>
              <li>Redistribute purchased files.</li>
              <li>Operate a competing marketplace using Archive Material.</li>
              <li>Offer Archive Material as stock music.</li>
              <li>Include Archive Material in subscription libraries.</li>
              <li>Include Archive Material in sample packs.</li>
              <li>Include Archive Material in preset packs.</li>
              <li>Include Archive Material in downloadable collections.</li>
            </ul>
          </section>

          {/* 16. Fraud and Misrepresentation */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">16.</span> FRAUD AND MISREPRESENTATION
            </h2>
            <p>You may not knowingly:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Misrepresent your identity.</li>
              <li>Misrepresent ownership.</li>
              <li>Submit forged documentation.</li>
              <li>Submit false copyright notices.</li>
              <li>Submit false License information.</li>
              <li>Submit false payment information.</li>
              <li>Submit false publishing information.</li>
              <li>Submit false royalty information.</li>
            </ul>
          </section>

          {/* 17. Enforcement */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">17.</span> ENFORCEMENT
            </h2>
            <p>If we reasonably believe this Policy has been violated, LOMON LLC may:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5 list-disc text-[12.5px] text-zinc-300 marker:text-zinc-500">
              <li>Remove content.</li>
              <li>Suspend downloads.</li>
              <li>Suspend Licenses.</li>
              <li>Restrict account access.</li>
              <li>Cancel transactions.</li>
              <li>Terminate accounts.</li>
              <li>Remove website access.</li>
              <li>Reject future purchases.</li>
              <li>Investigate suspected violations.</li>
              <li>Cooperate with law enforcement where appropriate.</li>
              <li>Pursue available legal remedies.</li>
            </ul>
            <p className="text-[12.5px] text-zinc-400 pt-1">
              The response taken will depend on the nature and seriousness of the violation.
            </p>
          </section>

          {/* 18. Reporting Violations */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">18.</span> REPORTING VIOLATIONS
            </h2>
            <p>Suspected violations of this Policy may be reported to:</p>
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm w-fit font-mono text-[12px] my-2">
              <a href="mailto:licensing@theowlclock.com" className="text-zinc-200 hover:text-white underline">
                licensing@theowlclock.com
              </a>
            </div>
            <p className="text-[12.5px] text-zinc-400">Please include:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[12.5px] marker:text-zinc-500">
              <li>Your name.</li>
              <li>Your contact information.</li>
              <li>A description of the suspected violation.</li>
              <li>Supporting evidence, if available.</li>
            </ul>
            <p className="text-[12px] text-zinc-400 italic pt-1">
              Knowingly submitting false reports may itself violate this Policy.
            </p>
          </section>

          {/* 19. Changes to This Policy */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">19.</span> CHANGES TO THIS POLICY
            </h2>
            <p>
              LOMON LLC may update this Acceptable Use Policy from time to time.
            </p>
            <p className="text-[12.5px] text-zinc-400">
              Updated versions will display a revised Last Updated date.
            </p>
            <p className="text-[12.5px] text-zinc-300 pt-1">
              Continued use of the Archive after an updated Policy becomes effective constitutes acceptance of the revised Policy.
            </p>
          </section>

          {/* 20. Contact */}
          <section className="space-y-4 pt-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
              <span className="text-zinc-400">20.</span> CONTACT
            </h2>
            <p>Questions regarding this Acceptable Use Policy may be directed to:</p>
            
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
          <p className="uppercase tracking-widest text-zinc-600 text-left">ACCEPTABLE USE POLICY</p>
        </div>

        <DocumentScrollControls />
      </div>
    </div>
  );
}
