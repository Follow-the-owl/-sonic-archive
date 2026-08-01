import React, { useEffect } from "react";
import { ArrowLeft, ShieldCheck, Mail, Lock, ExternalLink } from "lucide-react";

interface TermsOfUsePageProps {
  onBack?: () => void;
}

export default function TermsOfUsePage({ onBack }: TermsOfUsePageProps) {
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
    <div className="min-h-screen bg-black text-[#D9D6CA] font-mono selection:bg-[#D6C291]/30 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Container - Max Width 850px as requested for clean, highly readable layout */}
      <div className="max-w-[850px] mx-auto space-y-10 text-left">
        
        {/* Top Header / Navigation Bar */}
        <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={handleReturn}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-zinc-400 hover:text-white transition-colors uppercase cursor-pointer group border border-zinc-900 bg-zinc-950 px-3.5 py-2 rounded-sm w-fit"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform text-[#D6C291]" />
            <span>RETURN TO PREVIOUS PAGE</span>
          </button>

          <div className="flex items-center gap-2 text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-[#D6C291]" />
            <span>ARCHIVE PROTOCOL 01 // LEGAL GOVERNANCE</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-4 border-b border-zinc-900/80 pb-8">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#D6C291] uppercase block">
              LOMON LLC • LEGAL PROTOCOLS
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-[0.15em] uppercase leading-tight">
              TERMS OF USE
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono text-zinc-400 border-t border-zinc-900/50 pt-4">
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Effective Date:</span>
              <span className="text-[#D9D6CA]">July 28, 2026</span>
            </div>
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Last Updated:</span>
              <span className="text-[#D9D6CA]">July 28, 2026</span>
            </div>
          </div>

          <p className="text-[12px] leading-relaxed text-zinc-300 font-sans pt-2">
            These Terms of Use govern access to and use of <strong className="text-white">theowlclock.com</strong>, its archived audio fragments, licensing services, clearance systems, metadata, documentation, downloads, communications, and related features.
          </p>

          <div className="p-4 bg-zinc-950 border border-zinc-900 text-[11px] text-zinc-400 font-mono leading-relaxed space-y-1.5 rounded-sm">
            <p>
              The Owl Clock is owned and operated by <strong className="text-white">LOMON LLC</strong>, a Georgia limited liability company. In these Terms, “LOMON,” “The Owl Clock,” “we,” “us,” and “our” refer to LOMON LLC.
            </p>
            <p className="text-[#D6C291] font-bold pt-1">
              By accessing the website, submitting a clearance request, purchasing a license, downloading materials, or otherwise using The Owl Clock, you agree to these Terms. Do not use The Owl Clock if you do not agree to these Terms.
            </p>
          </div>
        </div>

        {/* Legal Text Body */}
        <div className="space-y-10 text-[12.5px] leading-relaxed font-sans text-zinc-300">

          {/* 1. DEFINITIONS */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-center gap-2">
              <span className="text-[#D6C291]">1.</span> DEFINITIONS
            </h2>
            <p>For purposes of these Terms:</p>
            <ul className="space-y-2.5 pl-4 border-l-2 border-zinc-850 font-mono text-[11.5px] text-zinc-300">
              <li>
                <strong className="text-white uppercase">“Archive”</strong> means The Owl Clock website, systems, interfaces, databases, records, services, and related infrastructure.
              </li>
              <li>
                <strong className="text-white uppercase">“Fragment”</strong> means any musical composition, instrumental, beat, master recording, stem, loop, sample, preview, alternate version, or related audio work presented through the Archive.
              </li>
              <li>
                <strong className="text-white uppercase">“Archive Material”</strong> means all material made available through the Archive, including Fragments, audio previews, stems, artwork, graphics, photographs, waveforms, videos, text, metadata, documents, symbols, designs, software, and website elements.
              </li>
              <li>
                <strong className="text-white uppercase">“Metadata”</strong> includes titles, timestamps, producer information, writer information, publisher information, ownership records, BPM, musical key, duration, recovery date, version information, copyright notices, ISRCs, ISWCs, IPI or CAE numbers, and other identifying information.
              </li>
              <li>
                <strong className="text-white uppercase">“License”</strong> means written authorization issued by LOMON LLC permitting specified use of a Fragment.
              </li>
              <li>
                <strong className="text-white uppercase">“Licensee”</strong> means the individual or organization receiving rights under a License.
              </li>
              <li>
                <strong className="text-white uppercase">“User”</strong> means any person or organization accessing or using the Archive.
              </li>
            </ul>
          </section>

          {/* 2. ELIGIBILITY */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">2.</span> ELIGIBILITY
            </h2>
            <p>
              You must be at least eighteen (18) years old, or the legal age of majority where you live, to purchase a License or enter into a binding agreement through the Archive.
            </p>
            <p>
              Anyone below the legal age of majority may use the Archive only with the involvement and authorization of a parent or legal guardian. The Archive is not directed toward children under thirteen (13) years old.
            </p>
            <p>
              When using the Archive on behalf of a company, artist, label, publisher, agency, production company, or other organization, you represent and warrant that you have full legal authority to act for and legally bind that organization.
            </p>
          </section>

          {/* 3. OWNERSHIP OF THE ARCHIVE */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">3.</span> OWNERSHIP OF THE ARCHIVE
            </h2>
            <p>
              Unless expressly stated otherwise in writing, LOMON LLC or its authorized licensors own all rights, title, and interest in and to the Archive and Archive Material. These rights include, but are not limited to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] text-zinc-400 py-2">
              <div className="bg-zinc-950 p-2.5 border border-zinc-900">• Musical compositions &amp; master recordings</div>
              <div className="bg-zinc-950 p-2.5 border border-zinc-900">• Audio previews, stems &amp; alternate mixes</div>
              <div className="bg-zinc-950 p-2.5 border border-zinc-900">• Artwork, visual materials &amp; waveforms</div>
              <div className="bg-zinc-950 p-2.5 border border-zinc-900">• Logos, brand identifiers &amp; trademarks</div>
              <div className="bg-zinc-950 p-2.5 border border-zinc-900">• Website design, layout &amp; documentation</div>
              <div className="bg-zinc-950 p-2.5 border border-zinc-900">• Metadata, recovery logs &amp; software systems</div>
            </div>
            <p>
              Accessing, previewing, purchasing, licensing, or downloading Archive Material does not transfer ownership. All rights not expressly granted through a written License executed by LOMON LLC are strictly reserved.
            </p>
          </section>

          {/* 4. LIMITED ACCESS TO THE ARCHIVE */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">4.</span> LIMITED ACCESS TO THE ARCHIVE
            </h2>
            <p>
              LOMON LLC grants you a limited, revocable, non-exclusive, non-transferable right to access the Archive for lawful purposes, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>Listening to authorized audio previews</li>
              <li>Reviewing available Fragment metadata and documentation</li>
              <li>Evaluating a Fragment for a potential commercial or artistic project</li>
              <li>Submitting clearance requests</li>
              <li>Purchasing an available License</li>
              <li>Accessing media files delivered under an executed License</li>
            </ul>
            <p className="text-zinc-400 font-mono text-[11px] bg-zinc-950 p-3 border border-zinc-900 mt-2">
              NOTICE: This limited access does not authorize you to reproduce, release, distribute, monetize, synchronize, sample, remix, adapt, publicly perform, register, resell, sublicense, or otherwise exploit any Fragment without an executed License.
            </p>
          </section>

          {/* 5. AUDIO PREVIEWS */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">5.</span> AUDIO PREVIEWS
            </h2>
            <p>
              Audio previews provided through the Archive are furnished solely for private evaluation. Unless expressly authorized in writing by LOMON LLC, you strictly MAY NOT:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>Download, rip, extract, capture, or record any audio preview</li>
              <li>Upload a preview to another website, streaming service, or storage platform</li>
              <li>Add vocals, instruments, effects, or other sound elements to a preview for public release</li>
              <li>Use a preview in any song, video, podcast, livestream, advertisement, film, television program, video game, live performance, or social-media post</li>
              <li>Monetize or commercially exploit a preview on any digital platform</li>
              <li>Present or credit a preview as your own original composition or master recording</li>
              <li>Distribute a preview privately or publicly to third parties</li>
              <li>Use a preview to obtain distribution, financing, label approval, placement, or investment as though you control the underlying rights</li>
            </ul>
            <p className="text-zinc-400 italic">
              Watermarks, producer tags, reduced quality, shortened duration, or other technical preview limitations do not create permission to use the underlying Fragment.
            </p>
          </section>

          {/* 6. LICENSES */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">6.</span> LICENSES &amp; RIGHTS ARRANGEMENTS
            </h2>
            <p>
              Archive Material may be commercially or publicly used only under a valid License issued or approved in writing by LOMON LLC. Available licensing structures include:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px] my-3">
              <div className="p-3 bg-zinc-950 border border-zinc-900">
                <span className="text-white font-bold block mb-1">Archive Access License</span>
                <span className="text-zinc-400">Songwriting, demos, rehearsals, and private creative development ($150).</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900">
                <span className="text-white font-bold block mb-1">Commercial Release License</span>
                <span className="text-zinc-400">Approved commercial releases on digital music platforms ($500).</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900">
                <span className="text-white font-bold block mb-1">Commercial Exploitation License</span>
                <span className="text-zinc-400">Professional releases, monetized content, live performances, and campaigns ($1,000).</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900">
                <span className="text-white font-bold block mb-1">Sync &amp; Master License</span>
                <span className="text-zinc-400">Film, TV, advertising, brand campaigns, games, and broadcast media (Custom Proposal).</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900">
                <span className="text-white font-bold block mb-1">Exclusive Archive Acquisition</span>
                <span className="text-zinc-400">Exclusive control and permanent removal from future public licensing ($5,000).</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900">
                <span className="text-white font-bold block mb-1">Producer Collaboration</span>
                <span className="text-zinc-400">Selected custom projects evaluated without upfront fee under split sheet agreements.</span>
              </div>
            </div>
            <p>
              Each License establishes its own authorized uses, media, territory, duration, distribution limits, streaming caps, revenue/royalty split, composition ownership, master ownership, credit requirements, Content ID restrictions, exclusivity, and reporting schedules. You are responsible for reviewing and retaining the executed License prior to exploitation.
            </p>
          </section>

          {/* 7. ORDER OF CONTROL */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">7.</span> ORDER OF CONTROL
            </h2>
            <p>
              These Terms govern general access to and use of the Archive. A specific License agreement governs the authorized use of the Fragment identified in that License.
            </p>
            <p>
              Where a specific executed License directly conflicts with these Terms regarding the use of that Fragment, the specific executed License shall control.
            </p>
            <p className="text-zinc-400 font-mono text-[11px]">
              Website descriptions, social-media posts, advertisements, informal conversations, direct messages, emails, invoices, file names, verbal statements, or draft documents do NOT modify or expand a License unless explicitly incorporated into a written agreement signed by LOMON LLC.
            </p>
          </section>

          {/* 8. NO TRANSFER OF OWNERSHIP */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">8.</span> NO TRANSFER OF OWNERSHIP
            </h2>
            <p>
              Unless an executed written agreement expressly states otherwise in clear, unambiguous terms:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>Purchasing a License does not transfer copyright ownership</li>
              <li>Purchasing a download does not transfer publishing rights</li>
              <li>Purchasing a download does not transfer ownership of the master recording</li>
              <li>Purchasing access does not transfer ownership of the composition</li>
              <li>Receiving stems does not transfer ownership of individual sound elements</li>
              <li>Creating a new derivative recording from a Fragment does not eliminate LOMON LLC’s underlying copyright rights</li>
              <li>Paying a licensing fee does not create trademark, administrative, or registration rights beyond those expressly granted in writing</li>
            </ul>
            <p>
              Ownership of any composition or master recording may be transferred ONLY through a formal written agreement executed by an authorized officer of LOMON LLC.
            </p>
          </section>

          {/* 9. PROHIBITED USES & RESTRICTIONS */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">9.</span> PROHIBITED USES &amp; AI RESTRICTIONS
            </h2>
            <p>Users are strictly prohibited from:</p>
            <ul className="space-y-2 pl-4 border-l-2 border-red-900/50 font-mono text-[11px] text-zinc-300">
              <li>
                <strong className="text-white uppercase">Artificial Intelligence &amp; Machine Learning Ingestion:</strong> Using any Fragment or Archive Material for training, fine-tuning, machine learning dataset compilation, generative audio model synthesis, or algorithmic voice/sound cloning.
              </li>
              <li>
                <strong className="text-white uppercase">Content ID Registration:</strong> Enrolling any un-cleared Fragment, preview, or non-exclusive derivative work into YouTube Content ID, Meta Rights Manager, Spotify Loudr, or any digital fingerprinting system without explicit written authorization from LOMON LLC.
              </li>
              <li>
                <strong className="text-white uppercase">Copyright &amp; Trademark Misrepresentation:</strong> Registering the composition or master recording with the U.S. Copyright Office or foreign IP offices listing yourself as sole author/owner without split sheet approval.
              </li>
              <li>
                <strong className="text-white uppercase">Illegal or Defamatory Use:</strong> Associating Archive Material with hate speech, illegal activities, pornography, or defamatory content.
              </li>
            </ul>
          </section>

          {/* 10. CLEARANCE REQUESTS */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">10.</span> CLEARANCE REQUESTS &amp; APPROVAL
            </h2>
            <p>
              Submitting a clearance request through the Archive or Transmissions portal does not grant licensing rights. Rights are granted only upon execution of a formal License agreement and receipt of full payment.
            </p>
            <p>
              You represent that all details submitted in a clearance request (including artist name, project scope, distribution channels, and budget) are accurate. LOMON LLC reserves the absolute right to accept, negotiate, or decline any clearance request in its sole discretion.
            </p>
          </section>

          {/* 11. INTELLECTUAL PROPERTY & METADATA */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">11.</span> INTELLECTUAL PROPERTY &amp; METADATA
            </h2>
            <p>
              All Metadata attached to Fragments, downloadable packages, digital certificates, and documentation is proprietary to LOMON LLC. Removing, altering, or falsifying ISRCs, ISWCs, producer tags, or copyright notices embedded within delivered files is strictly prohibited and constitutes a breach of contract.
            </p>
          </section>

          {/* 12. FEES & PAYMENTS */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">12.</span> FEES &amp; PAYMENTS
            </h2>
            <p>
              All prices displayed on the website are quoted in United States Dollars (USD) unless specified otherwise. Payments are processed through authorized payment gateways (including Paystack and credit card processors). You agree to provide valid payment information and authorize LOMON LLC to charge the designated payment method.
            </p>
          </section>

          {/* 13. REFUNDS & CANCELLATION */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">13.</span> REFUNDS &amp; CANCELLATION
            </h2>
            <p>
              Due to the immediate digital delivery of intellectual property, sound files, and contractual documentation, <strong className="text-white">all sales, license fees, and clearance payments are final and non-refundable</strong> once files or certificates have been dispatched or made accessible.
            </p>
            <p className="text-zinc-400 font-mono text-[11px]">
              Exceptions are granted only if a delivered file is corrupted or technically defective, and our technical support team is unable to provide a functional replacement file within fourteen (14) days of written notice.
            </p>
          </section>

          {/* 14. DISCLAIMER OF WARRANTIES */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">14.</span> DISCLAIMER OF WARRANTIES
            </h2>
            <p className="uppercase font-mono text-[11px] text-zinc-400 leading-relaxed bg-zinc-950 p-4 border border-zinc-900">
              THE ARCHIVE AND ARCHIVE MATERIAL ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. LOMON LLC DOES NOT WARRANT THAT ACCESS WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
            </p>
          </section>

          {/* 15. LIMITATION OF LIABILITY */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">15.</span> LIMITATION OF LIABILITY
            </h2>
            <p className="uppercase font-mono text-[11px] text-zinc-400 leading-relaxed bg-zinc-950 p-4 border border-zinc-900">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LOMON LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE ARCHIVE. IN NO EVENT SHALL LOMON LLC’S AGGREGATE LIABILITY EXCEED THE GREATER OF ONE HUNDRED USD ($100) OR THE TOTAL AMOUNT PAID BY YOU TO LOMON LLC IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* 16. INDEMNIFICATION */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">16.</span> INDEMNIFICATION
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless LOMON LLC, its members, managers, officers, employees, agents, licensors, and successors from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or unauthorized use of any Fragment.
            </p>
          </section>

          {/* 17. TERMINATION */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">17.</span> TERMINATION
            </h2>
            <p>
              LOMON LLC reserves the right to suspend or terminate your access to the Archive, or revoke any granted License, immediately upon written notice in the event of your material breach of these Terms, non-payment, or unauthorized commercial exploitation.
            </p>
          </section>

          {/* 18. GOVERNING LAW & JURISDICTION */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">18.</span> GOVERNING LAW &amp; JURISDICTION
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the <strong className="text-white">State of Georgia, United States of America</strong>, without regard to its conflict of law principles.
            </p>
            <p>
              Any legal action, suit, or proceeding arising out of or relating to these Terms or the Archive shall be brought exclusively in the state or federal courts located in <strong className="text-white">Fulton County, Atlanta, Georgia</strong>, and you irrevocably consent to the personal jurisdiction and venue of such courts.
            </p>
          </section>

          {/* 19. MODIFICATIONS */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">19.</span> MODIFICATIONS TO TERMS
            </h2>
            <p>
              LOMON LLC reserves the right to update or modify these Terms at any time by posting the revised version on the Archive with an updated Effective Date. Your continued use of the Archive following any such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          {/* 20. CONTACT INFORMATION */}
          <section className="space-y-4 pt-2">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#D6C291]">20.</span> CONTACT INFORMATION &amp; PUBLISHING ADMINISTRATION
            </h2>
            <p>
              If you have any questions, clearance inquiries, or rights administration requests regarding these Terms of Use, please contact LOMON LLC at:
            </p>

            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-sm font-mono text-[11.5px] space-y-3 text-left">
              <div className="text-white font-bold text-[13px] tracking-wider uppercase">
                LOMON LLC
              </div>
              <div className="text-zinc-400 uppercase tracking-widest text-[10px]">
                Publishing • Rights Management • Licensing
              </div>
              <div className="text-zinc-500">
                Atlanta, Georgia, United States
              </div>

              <div className="pt-3 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center gap-4 text-[11px]">
                <a
                  href="mailto:licensing@theowlclock.com"
                  className="inline-flex items-center gap-2 text-[#D6C291] hover:text-white transition-colors cursor-pointer"
                >
                  <Mail size={13} />
                  <span>licensing@theowlclock.com</span>
                </a>
                <a
                  href="mailto:clearance@theowlclock.com"
                  className="inline-flex items-center gap-2 text-[#D6C291] hover:text-white transition-colors cursor-pointer"
                >
                  <Mail size={13} />
                  <span>clearance@theowlclock.com</span>
                </a>
                <a
                  href="mailto:contact@lomonllc.com"
                  className="inline-flex items-center gap-2 text-[#D6C291] hover:text-white transition-colors cursor-pointer"
                >
                  <Mail size={13} />
                  <span>contact@lomonllc.com</span>
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Action / Return to Archive */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-zinc-500">
          <div>
            © 2026 LOMON LLC • All Rights Reserved.
          </div>
          <button
            onClick={handleReturn}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-[#D6C291] hover:text-white transition-colors uppercase cursor-pointer bg-transparent border border-zinc-800 hover:border-[#D6C291] px-4 py-2 rounded-sm"
          >
            <span>← RETURN TO PREVIOUS PAGE</span>
          </button>
        </div>

      </div>
    </div>
  );
}
