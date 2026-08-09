import React, { useState, useEffect } from "react";
import { ArrowLeft, Mail, Send, CheckCircle2, Building2, MapPin, ShieldCheck, Clock, MessageSquare, FileText, Sparkles } from "lucide-react";

interface ContactPageProps {
  onBack?: () => void;
  onRequestClearance?: () => void;
  initialDepartment?: string;
  initialSubject?: string;
}

export default function ContactPage({ 
  onBack, 
  onRequestClearance,
  initialDepartment = "General Inquiries",
  initialSubject = ""
}: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: initialDepartment,
    subject: initialSubject,
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [transmissionId, setTransmissionId] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTransmissionId(`TRM-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 1200);
  };

  return (
    <div className="contact-page min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Main Container */}
      <div className="max-w-[850px] mx-auto space-y-10 text-left">
        
        {/* Navigation Bar */}
        <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={handleReturn}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-zinc-400 hover:text-white transition-colors uppercase cursor-pointer group border border-zinc-900 bg-zinc-950 px-3.5 py-2 rounded-sm w-fit"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform text-zinc-300" />
            <span>RETURN TO PREVIOUS PAGE</span>
          </button>

          <div className="flex items-center gap-2 text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest">
            <Mail size={14} className="text-zinc-300" />
            <span>SYSTEM TRANSMISSIONS • CONTACT</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-4 border-b border-zinc-900/80 pb-8">
          <div className="space-y-1">
            <span className="text-[11px] font-display font-bold tracking-[0.25em] text-zinc-400 uppercase block">
              LOMON LLC • OFFICIAL COMMUNICATIONS
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-[0.18em] uppercase leading-tight">
              CONTACT &amp; TRANSMISSIONS
            </h1>
          </div>

          <p className="text-[13px] leading-relaxed text-zinc-300 pt-2">
            Direct channel for general inquiries, licensing requests, creative collaborations, technical support, and official business communications with <strong className="text-white">The Owl Clock</strong> archive.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
            <div className="p-3.5 bg-zinc-950 border border-zinc-900/80 rounded-sm space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">ADMINISTRATION</span>
              <p className="text-[12px] font-bold text-white uppercase tracking-wider">LOMON LLC</p>
              <p className="text-[11px] text-zinc-400 font-mono">Atlanta, Georgia, USA</p>
            </div>
            <div className="p-3.5 bg-zinc-950 border border-zinc-900/80 rounded-sm space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">RESPONSE DISPATCH</span>
              <p className="text-[12px] font-bold text-white uppercase tracking-wider">24 – 48 HOURS</p>
              <p className="text-[11px] text-zinc-400 font-mono">Priority Licensing &amp; Rights</p>
            </div>
            <div className="p-3.5 bg-zinc-950 border border-zinc-900/80 rounded-sm space-y-1 sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">DIRECT EMAIL</span>
              <p className="text-[12px] font-bold text-white uppercase tracking-wider">vault@lomon.llc</p>
              <p className="text-[11px] text-zinc-400 font-mono">Encrypted Archival Desk</p>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-900/80 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <MessageSquare size={16} className="text-zinc-400" />
              <span>DISPATCH TRANSMISSION</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">SECURE CHANNEL</span>
          </div>

          {isSubmitted ? (
            <div className="p-8 bg-zinc-950 border border-zinc-800/80 rounded-sm space-y-5 text-center my-6">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 tracking-[0.2em] uppercase block">TRANSMISSION CONFIRMED</span>
                <h3 className="text-xl font-bold text-white tracking-wider uppercase">TRANSMISSION DISPATCHED</h3>
                <p className="text-[12.5px] text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Your message has been safely logged in the LOMON transmission register. An archivist will review your transmission shortly.
                </p>
              </div>

              <div className="p-3 bg-zinc-900/60 border border-zinc-800/50 rounded-sm max-w-xs mx-auto text-center font-mono text-[11px] text-zinc-400">
                <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">TRANSMISSION REF ID</span>
                <span className="text-white font-bold">{transmissionId}</span>
              </div>

              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: "", email: "", department: "General Inquiries", subject: "", message: "" });
                }}
                className="inline-flex items-center gap-2 text-[11px] font-mono font-bold tracking-widest text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-2.5 rounded-sm uppercase transition-colors cursor-pointer"
              >
                DISPATCH ANOTHER TRANSMISSION
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 bg-zinc-950/60 border border-zinc-900 p-6 rounded-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                    FULL NAME / ENTITY *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Alex Mercer / Apex Records"
                    className="w-full bg-black border border-zinc-800 rounded-sm px-3.5 py-2.5 text-[12px] font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., alex@domain.com"
                    className="w-full bg-black border border-zinc-800 rounded-sm px-3.5 py-2.5 text-[12px] font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                    DEPARTMENT / INTENT
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-sm px-3 py-2.5 text-[12px] font-mono text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="General Inquiries">General Inquiries</option>
                    <option value="Fragment Licensing">Fragment Licensing &amp; Clearance</option>
                    <option value="Collaborations">Creative Collaborations</option>
                    <option value="Technical Support">Technical &amp; Download Support</option>
                    <option value="Business Communications">Business &amp; Royalty Administration</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                    SUBJECT
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your transmission"
                    className="w-full bg-black border border-zinc-800 rounded-sm px-3.5 py-2.5 text-[12px] font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>

              {(formData.department.includes("Licensing") || formData.department.includes("Clearance")) && (
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-sm space-y-2 text-left">
                  <div className="flex items-center gap-2 text-zinc-200 text-[11px] font-bold uppercase tracking-wider">
                    <FileText size={14} className="text-zinc-400" />
                    <span>FRAGMENT CLEARANCE PROTOCOL CHECKLIST</span>
                  </div>
                  <p className="text-[11.5px] text-zinc-300 leading-relaxed">
                    To expedite fragment clearance and synchronization requests, please include the following in your transmission:
                  </p>
                  <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside font-mono pt-1">
                    <li><strong className="text-zinc-200">Fragment ID / Timestamp:</strong> e.g., Timestamp 03:15 or Composition Fragment Title</li>
                    <li><strong className="text-zinc-200">Artist / Company Name:</strong> Entity requesting rights clearance</li>
                    <li><strong className="text-zinc-200">Project Title &amp; Scope:</strong> Upcoming release, film, album, or campaign title</li>
                    <li><strong className="text-zinc-200">Intended Commercial Use:</strong> Streaming, Sync, Master, Sampling, or Broadcasting</li>
                    <li><strong className="text-zinc-200">Requested License Tier:</strong> Archive Access ($150), Commercial Release ($500), Commercial Exploitation ($1,000), or Exclusive Acquisition ($5,000)</li>
                  </ul>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                  TRANSMISSION DETAILS / MESSAGE *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide detailed instructions, project scope, fragment timestamps, or general inquiry details..."
                  className="w-full bg-black border border-zinc-800 rounded-sm px-3.5 py-2.5 text-[12px] font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <span className="text-[10px] font-mono text-zinc-500">
                  * Required fields for system verification.
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-[11px] font-mono font-bold tracking-[0.2em] bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-sm uppercase transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>DISPATCHING CIPHER...</span>
                  ) : (
                    <>
                      <span>TRANSMIT MESSAGE</span>
                      <Send size={12} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Directory & Purpose Summary */}
        <div className="space-y-6 pt-6 border-t border-zinc-900">
          <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <Building2 size={14} className="text-zinc-400" />
            <span>DIRECTORY &amp; COMMUNICATIONS PURPOSE</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] leading-relaxed font-mono">
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-2">
              <span className="text-white font-bold uppercase tracking-wider block text-[11px]">GENERAL INQUIRIES</span>
              <p className="text-zinc-400 text-[11.5px]">
                Questions regarding the story, philosophy, mission, and public archive of The Owl Clock.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-2">
              <span className="text-white font-bold uppercase tracking-wider block text-[11px]">LICENSING &amp; CLEARANCE</span>
              <p className="text-zinc-400 text-[11.5px]">
                Requesting commercial clearance, synchronization permissions, master rights, or custom composition usage.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-2">
              <span className="text-white font-bold uppercase tracking-wider block text-[11px]">COLLABORATIONS</span>
              <p className="text-zinc-400 text-[11.5px]">
                Artistic co-creations, bespoke sound design, custom score restoration, and archival publishing proposals.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-2">
              <span className="text-white font-bold uppercase tracking-wider block text-[11px]">TECHNICAL SUPPORT</span>
              <p className="text-zinc-400 text-[11.5px]">
                Assistance with license certificate verification, digital download stems, transaction records, or account access.
              </p>
            </div>
          </div>
        </div>

        {/* Legal & Ownership Footer Note */}
        <div className="border-t border-zinc-900/80 pt-6 text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>LOMON LLC • ATLANTA, GEORGIA</span>
          <span>© 2026 LOMON LLC • ALL RIGHTS RESERVED</span>
        </div>

      </div>
    </div>
  );
}
