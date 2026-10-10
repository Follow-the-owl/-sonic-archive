import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Mail, Send, CheckCircle2, Building2, MapPin, ShieldCheck, 
  Clock, MessageSquare, FileText, Server, RefreshCw, Radio, Inbox, 
  Terminal, ExternalLink, AlertTriangle, ChevronDown, ChevronUp, Key
} from "lucide-react";

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
  const [showEmailConsole, setShowEmailConsole] = useState(false);
  const [consoleTab, setConsoleTab] = useState<"overview" | "inbound" | "outbound" | "guide">("overview");
  const [emailLogs, setEmailLogs] = useState<{ inbound: any[]; outbound: any[]; config: any } | null>(null);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);
  const [simulatedInbound, setSimulatedInbound] = useState({
    from: "collaborator@studio.com",
    to: "collaboration@theowlclock.io",
    subject: "Co-Release & Stem Clearance Inquiry",
    text: "Greetings, We are producing a track aligned to your 03:21 PM fragment and would like to coordinate co-production terms."
  });
  const [inboundSimLoading, setInboundSimLoading] = useState(false);
  const [inboundSimResult, setInboundSimResult] = useState<string | null>(null);

  const fetchEmailLogs = async () => {
    try {
      const [inboxRes, outboxRes, configRes] = await Promise.all([
        fetch("/api/emails/inbox").then(r => r.json()).catch(() => ({ emails: [] })),
        fetch("/api/emails/outbox").then(r => r.json()).catch(() => ({ emails: [] })),
        fetch("/api/emails/config").then(r => r.json()).catch(() => ({}))
      ]);
      setEmailLogs({
        inbound: inboxRes.emails || [],
        outbound: outboxRes.emails || [],
        config: configRes || {}
      });
    } catch {
      // ignore
    }
  };

  const handleTestPing = async () => {
    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const res = await fetch("/api/emails/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: formData.email || "soluwatist@gmail.com" })
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailResult(`Success: Ping dispatched via ${data.provider} to ${data.target}`);
        await fetchEmailLogs();
      } else {
        setTestEmailResult(`Notice: ${data.error || "Failed to trigger ping"}`);
      }
    } catch (err: any) {
      setTestEmailResult(`Error: ${err.message}`);
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleSimulateInbound = async () => {
    setInboundSimLoading(true);
    setInboundSimResult(null);
    try {
      const res = await fetch("/api/emails/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simulatedInbound)
      });
      const data = await res.json();
      if (data.success) {
        setInboundSimResult(`Inbound message received & cataloged successfully (ID: ${data.email?.id || "saved"})`);
        await fetchEmailLogs();
      } else {
        setInboundSimResult(`Notice: ${data.error || "Failed to record message"}`);
      }
    } catch (err: any) {
      setInboundSimResult(`Error: ${err.message}`);
    } finally {
      setInboundSimLoading(false);
    }
  };

  useEffect(() => {
    if (showEmailConsole) {
      fetchEmailLogs();
    }
  }, [showEmailConsole]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    const generatedRef = `TRM-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const resp = await fetch("/api/emails/send-transmission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          department: formData.department,
          subject: formData.subject,
          message: formData.message,
          transmissionId: generatedRef
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (data.transmissionRef) {
        setTransmissionId(data.transmissionRef);
      } else {
        setTransmissionId(generatedRef);
      }
    } catch (err) {
      console.warn("Backend transmission fallback:", err);
      setTransmissionId(generatedRef);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }

    // If this is a licensing/clearance transmission, automatically register into admin clearance ledger
    if (typeof window !== "undefined") {
      try {
        const isClearance = formData.department.toLowerCase().includes("licens") || 
                            formData.subject.toLowerCase().includes("clearance") ||
                            formData.message.toLowerCase().includes("clearance") ||
                            formData.message.toLowerCase().includes("license");
        
        if (isClearance) {
          const rawSaved = localStorage.getItem("lomon_admin_clearance_requests");
          const currentList = rawSaved ? JSON.parse(rawSaved) : [];
          const newRecord = {
            ref: `CLR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            fragmentId: "10:00",
            fragmentName: formData.subject ? formData.subject.toUpperCase() : "GENERAL CLEARANCE INQUIRY",
            clientId: `LOC-CLT-${Math.floor(1000 + Math.random() * 9000)}`,
            clientName: formData.name,
            clientEmail: formData.email,
            requestedLicense: "Custom Rights Clearance Petition",
            status: "NEW",
            paymentStatus: "PAYMENT PENDING",
            feeAmount: 1000,
            date: new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }),
            projectDescription: formData.message,
            historyLog: [
              {
                date: `${new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC`,
                author: "CLIENT",
                message: "Public clearance transmission petition submitted via portal."
              }
            ]
          };
          localStorage.setItem("lomon_admin_clearance_requests", JSON.stringify([newRecord, ...currentList]));
        }
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="contact-page min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Main Container */}
      <div className="max-w-[850px] mx-auto space-y-10 text-left">
        
        {/* Navigation Bar */}
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
            <Mail size={14} className="text-zinc-300 shrink-0" />
            <span className="break-words">SYSTEM TRANSMISSIONS • CONTACT</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-4 border-b border-zinc-900/80 pb-8 text-left">
          <div className="space-y-1 text-left">
            <span className="text-[11px] font-display font-bold tracking-[0.2em] sm:tracking-[0.25em] text-zinc-400 uppercase block text-left break-words">
              LOMON LLC • OFFICIAL COMMUNICATIONS
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-[0.12em] sm:tracking-[0.18em] uppercase leading-tight text-left break-words">
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
              <a href="mailto:contact@theowlclock.io" className="text-[12px] font-bold text-white uppercase tracking-wider hover:text-zinc-300 transition-colors block">
                contact@theowlclock.io
              </a>
              <p className="text-[11px] text-zinc-400 font-mono">Encrypted Archival Desk</p>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-900/80 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase flex items-start gap-2 break-words">
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

              {formData.department.includes("Collab") && (
                <div className="p-4 bg-zinc-900/60 border border-[#D9D6CA]/30 rounded-sm space-y-2 text-left">
                  <div className="flex items-center justify-between text-zinc-200 text-[11px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <FileText size={14} className="text-[#D9D6CA]" />
                      <span>PRODUCER &amp; CREATIVE COLLABORATION PROTOCOL</span>
                    </span>
                    <span className="text-[#D9D6CA] font-mono text-[10px]">collaboration@theowlclock.io</span>
                  </div>
                  <p className="text-[11.5px] text-zinc-300 leading-relaxed font-mono">
                    All collaboration transmissions are delivered directly to <span className="text-[#D9D6CA] font-bold">collaboration@theowlclock.io</span> and notified instantly to our A&amp;R / Rights desk. Include your streaming links, proposed cue alignment, and split proposals.
                  </p>
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
                    <span>SENDING MESSAGE...</span>
                  ) : (
                    <>
                      <span>SEND MESSAGE</span>
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
          <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-start gap-2 break-words">
            <Building2 size={14} className="text-zinc-400" />
            <span>DIRECTORY &amp; COMMUNICATIONS PURPOSE</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] leading-relaxed font-mono">
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold uppercase tracking-wider block text-[11px]">GENERAL INQUIRIES</span>
                <a href="mailto:contact@theowlclock.io" className="text-[10.5px] text-zinc-400 hover:text-white underline tracking-tight">contact@theowlclock.io</a>
              </div>
              <p className="text-zinc-400 text-[11.5px]">
                Questions regarding the story, philosophy, mission, and public archive of The Owl Clock.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold uppercase tracking-wider block text-[11px]">LICENSING &amp; CLEARANCE</span>
                <a href="mailto:licensing@theowlclock.io" className="text-[10.5px] text-zinc-400 hover:text-white underline tracking-tight">licensing@theowlclock.io</a>
              </div>
              <p className="text-zinc-400 text-[11.5px]">
                Requesting commercial clearance, synchronization permissions, master rights, or custom composition usage.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold uppercase tracking-wider block text-[11px]">CREATIVE &amp; PRODUCER COLLABORATIONS</span>
                <a href="mailto:collaboration@theowlclock.io" className="text-[10.5px] text-[#D9D6CA] hover:text-white underline tracking-tight font-bold">collaboration@theowlclock.io</a>
              </div>
              <p className="text-zinc-400 text-[11.5px]">
                Co-productions, featured artist recordings, bespoke cue developments, and shared master agreements (TOC-PCOL).
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold uppercase tracking-wider block text-[11px]">TECHNICAL SUPPORT</span>
                <a href="mailto:support@theowlclock.io" className="text-[10.5px] text-zinc-400 hover:text-white underline tracking-tight">support@theowlclock.io</a>
              </div>
              <p className="text-zinc-400 text-[11.5px]">
                Assistance with license certificate verification, digital download stems, transaction records, or account access.
              </p>
            </div>
          </div>
        </div>

        {/* Resend Email & Transmission Protocol Console */}
        <div className="space-y-4 pt-6 border-t border-zinc-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <Server size={14} className="text-[#D9D6CA]" />
                <span className="text-[12px] font-bold text-white uppercase tracking-wider font-mono">
                  RESEND EMAIL &amp; TRANSMISSION CONSOLE
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Inspect inbound &amp; outbound email queues, test live Gmail dispatch, and verify Resend configuration.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowEmailConsole(!showEmailConsole);
                if (!showEmailConsole) fetchEmailLogs();
              }}
              className="inline-flex items-center gap-2 text-[10.5px] font-mono font-bold tracking-widest text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3.5 py-2 rounded-sm uppercase transition-colors cursor-pointer"
            >
              <Terminal size={13} className="text-[#D9D6CA]" />
              <span>{showEmailConsole ? "HIDE CONSOLE" : "OPEN EMAIL CONSOLE"}</span>
              {showEmailConsole ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {showEmailConsole && (
            <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-sm space-y-6 text-left animate-fadeIn">
              {/* Header Status Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] font-mono">
                <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-sm">
                  <span className="text-zinc-500 block text-[9.5px] uppercase tracking-wider">COLLABORATION EMAIL</span>
                  <span className="text-[#D9D6CA] font-bold text-[11.5px] break-all">collaboration@theowlclock.io</span>
                  <span className="text-[9.5px] text-zinc-400 block pt-0.5">Primary A&amp;R / Co-Op Desk</span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-sm">
                  <span className="text-zinc-500 block text-[9.5px] uppercase tracking-wider">GMAIL FORWARDING</span>
                  <span className="text-white font-bold text-[11.5px] break-all">soluwatist@gmail.com</span>
                  <span className="text-[9.5px] text-emerald-400 block pt-0.5">&bull; Instant Notifications</span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-sm">
                  <span className="text-zinc-500 block text-[9.5px] uppercase tracking-wider">DOMAIN IDENTITY</span>
                  <span className="text-white font-bold text-[11.5px]">theowlclock.io</span>
                  <span className="text-[9.5px] text-zinc-400 block pt-0.5">Aligned to .io Architecture</span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-sm">
                  <span className="text-zinc-500 block text-[9.5px] uppercase tracking-wider">INBOUND WEBHOOK</span>
                  <span className="text-white font-bold text-[11.5px] break-all">/api/webhooks/resend-inbound</span>
                  <span className="text-[9.5px] text-zinc-400 block pt-0.5">Receives incoming transmissions</span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setConsoleTab("overview")}
                    className={`px-3 py-1.5 text-[10.5px] font-mono font-bold uppercase tracking-wider rounded-sm transition-colors ${
                      consoleTab === "overview" 
                        ? "bg-zinc-800 text-white border border-zinc-600" 
                        : "text-zinc-400 hover:text-white bg-transparent"
                    }`}
                  >
                    Quick Dispatch &amp; Ping
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsoleTab("inbound")}
                    className={`px-3 py-1.5 text-[10.5px] font-mono font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1.5 ${
                      consoleTab === "inbound" 
                        ? "bg-zinc-800 text-white border border-zinc-600" 
                        : "text-zinc-400 hover:text-white bg-transparent"
                    }`}
                  >
                    <Inbox size={12} />
                    <span>Inbound Inbox ({emailLogs?.inbound?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsoleTab("outbound")}
                    className={`px-3 py-1.5 text-[10.5px] font-mono font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1.5 ${
                      consoleTab === "outbound" 
                        ? "bg-zinc-800 text-white border border-zinc-600" 
                        : "text-zinc-400 hover:text-white bg-transparent"
                    }`}
                  >
                    <Send size={12} />
                    <span>Outbound Outbox ({emailLogs?.outbound?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsoleTab("guide")}
                    className={`px-3 py-1.5 text-[10.5px] font-mono font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1.5 ${
                      consoleTab === "guide" 
                        ? "bg-zinc-800 text-white border border-zinc-600" 
                        : "text-zinc-400 hover:text-white bg-transparent"
                    }`}
                  >
                    <Key size={12} />
                    <span>Resend Setup Guide</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={fetchEmailLogs}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors"
                  title="Refresh logs"
                >
                  <RefreshCw size={11} />
                  <span>REFRESH</span>
                </button>
              </div>

              {/* TAB 1: OVERVIEW & TEST ACTIONS */}
              {consoleTab === "overview" && (
                <div className="space-y-6">
                  {/* Test Ping */}
                  <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                        <Radio size={13} className="text-emerald-400 animate-pulse" />
                        <span>TEST EMAIL DISPATCH (PING GMAIL / RESEND)</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">Live Delivery Check</span>
                    </div>
                    <p className="text-[11.5px] text-zinc-400 font-mono leading-relaxed">
                      Dispatches a cryptographic handshake test email through your active Resend pipeline or SMTP fallback to verify live reception in your Gmail inbox (<strong className="text-zinc-200">soluwatist@gmail.com</strong>).
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="email"
                        defaultValue="soluwatist@gmail.com"
                        id="test-ping-target"
                        placeholder="Target email (default: soluwatist@gmail.com)"
                        className="flex-1 bg-black border border-zinc-800 rounded-sm px-3 py-2 text-[11px] font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                      <button
                        type="button"
                        disabled={testEmailLoading}
                        onClick={() => {
                          const inputEl = document.getElementById("test-ping-target") as HTMLInputElement;
                          const targetVal = inputEl?.value?.trim() || "soluwatist@gmail.com";
                          setTestEmailLoading(true);
                          setTestEmailResult(null);
                          fetch("/api/emails/test", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ to: targetVal })
                          })
                            .then(r => r.json())
                            .then(data => {
                              if (data.success) {
                                setTestEmailResult(`Success: Dispatched test handshake to ${data.target} via provider: ${data.provider}`);
                                fetchEmailLogs();
                              } else {
                                setTestEmailResult(`Notice: ${data.error || "Failed to trigger ping"}`);
                              }
                            })
                            .catch(err => setTestEmailResult(`Error: ${err.message}`))
                            .finally(() => setTestEmailLoading(false));
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 font-mono font-bold text-[10.5px] tracking-wider px-4 py-2 rounded-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {testEmailLoading ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                        <span>DISPATCH TEST PING</span>
                      </button>
                    </div>

                    {testEmailResult && (
                      <div className="p-2.5 bg-zinc-900 border border-zinc-700/60 rounded-sm text-[11px] font-mono text-emerald-400">
                        {testEmailResult}
                      </div>
                    )}
                  </div>

                  {/* Simulate Inbound Message */}
                  <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                        <Inbox size={13} className="text-[#D9D6CA]" />
                        <span>TEST INBOUND RECEPTION (RECEIVE EMAIL)</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">Inbound Relay Simulator</span>
                    </div>
                    <p className="text-[11.5px] text-zinc-400 font-mono leading-relaxed">
                      Simulate or trigger an inbound message arriving at <strong className="text-zinc-200">collaboration@theowlclock.io</strong> to verify inbound parsing, classification, and MongoDB/in-memory cataloging.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block pb-1">SENDER EMAIL</label>
                        <input
                          type="email"
                          value={simulatedInbound.from}
                          onChange={e => setSimulatedInbound({ ...simulatedInbound, from: e.target.value })}
                          className="w-full bg-black border border-zinc-800 rounded-sm px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block pb-1">RECIPIENT ALIAS</label>
                        <input
                          type="email"
                          value={simulatedInbound.to}
                          onChange={e => setSimulatedInbound({ ...simulatedInbound, to: e.target.value })}
                          className="w-full bg-black border border-zinc-800 rounded-sm px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-zinc-500 uppercase block pb-1">SUBJECT LINE</label>
                        <input
                          type="text"
                          value={simulatedInbound.subject}
                          onChange={e => setSimulatedInbound({ ...simulatedInbound, subject: e.target.value })}
                          className="w-full bg-black border border-zinc-800 rounded-sm px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-zinc-500 uppercase block pb-1">MESSAGE BODY</label>
                        <textarea
                          rows={2}
                          value={simulatedInbound.text}
                          onChange={e => setSimulatedInbound({ ...simulatedInbound, text: e.target.value })}
                          className="w-full bg-black border border-zinc-800 rounded-sm px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        disabled={inboundSimLoading}
                        onClick={handleSimulateInbound}
                        className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-bold text-[10.5px] tracking-wider px-4 py-2 rounded-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {inboundSimLoading ? <RefreshCw size={12} className="animate-spin" /> : <Inbox size={12} />}
                        <span>INGEST INBOUND TEST EMAIL</span>
                      </button>

                      {inboundSimResult && (
                        <span className="text-[11px] font-mono text-emerald-400">
                          {inboundSimResult}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INBOUND INBOX */}
              {consoleTab === "inbound" && (
                <div className="space-y-3 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>RECEIVED INBOUND TRANSMISSIONS</span>
                    <span>Total: {emailLogs?.inbound?.length || 0} messages</span>
                  </div>

                  {!emailLogs?.inbound || emailLogs.inbound.length === 0 ? (
                    <div className="p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-sm text-center text-zinc-500 text-[12px]">
                      No inbound transmissions received yet. Test one above or configure Resend Inbound Webhook.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {emailLogs.inbound.map((item: any, idx: number) => (
                        <div key={item.id || idx} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-sm space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#D9D6CA] font-bold">FROM: {item.from}</span>
                            <span className="text-zinc-500">{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="text-[11.5px] text-white font-bold">
                            {item.subject}
                          </div>
                          <div className="flex items-center gap-2 text-[9.5px] text-zinc-400">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">TO: {Array.isArray(item.to) ? item.to.join(", ") : item.to}</span>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400">CATEGORY: {item.category || "inbound"}</span>
                            <span className="text-zinc-500">ID: {item.id}</span>
                          </div>
                          {item.text && (
                            <p className="text-[11px] text-zinc-300 bg-black/60 p-2 rounded-sm border border-zinc-900 whitespace-pre-wrap mt-1">
                              {item.text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: OUTBOUND OUTBOX */}
              {consoleTab === "outbound" && (
                <div className="space-y-3 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>DISPATCHED OUTBOUND TRANSMISSIONS</span>
                    <span>Total: {emailLogs?.outbound?.length || 0} messages</span>
                  </div>

                  {!emailLogs?.outbound || emailLogs.outbound.length === 0 ? (
                    <div className="p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-sm text-center text-zinc-500 text-[12px]">
                      No outbound transmissions logged yet. Use the Contact form or Checkout to trigger dispatches.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {emailLogs.outbound.map((item: any, idx: number) => (
                        <div key={item.id || idx} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-sm space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-white font-bold">TO: {Array.isArray(item.to) ? item.to.join(", ") : item.to}</span>
                            <span className="text-zinc-500">{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="text-[11.5px] text-[#D9D6CA] font-bold">
                            {item.subject}
                          </div>
                          <div className="flex items-center gap-2 text-[9.5px]">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">PROVIDER: {item.provider?.toUpperCase()}</span>
                            <span className={`px-1.5 py-0.5 rounded ${item.status === "sent" ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50" : "bg-amber-950 text-amber-400 border border-amber-800/50"}`}>
                              STATUS: {item.status?.toUpperCase()}
                            </span>
                            <span className="text-zinc-500">ID: {item.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SETUP GUIDE */}
              {consoleTab === "guide" && (
                <div className="space-y-4 font-mono text-[11.5px] text-zinc-300 leading-relaxed">
                  <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-sm space-y-2">
                    <h4 className="text-white font-bold uppercase text-[12px] flex items-center gap-2">
                      <Key size={13} className="text-[#D9D6CA]" />
                      <span>WHAT DO I NEED TO USE RESEND FOR THE OWL CLOCK?</span>
                    </h4>
                    <p className="text-zinc-400">
                      To send and receive emails across your production domain <strong className="text-white">theowlclock.io</strong> and route all alerts into your Gmail (<strong className="text-white">soluwatist@gmail.com</strong>), follow this 4-step checklist:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-zinc-900/20 border border-zinc-800 rounded-sm space-y-1">
                      <span className="text-white font-bold text-[11px] block">1. CREATE A RESEND ACCOUNT &amp; GET YOUR API KEY</span>
                      <p className="text-zinc-400 text-[11px]">
                        Visit <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-[#D9D6CA] underline">resend.com</a> &rarr; Sign Up &rarr; Navigate to <strong>API Keys</strong> &rarr; Create an API key with <em>Full Access</em>. It will look like <code className="text-zinc-200">re_123456789...</code>.
                      </p>
                      <p className="text-zinc-400 text-[11px]">
                        Set this in your environment variables: <code className="text-emerald-400">RESEND_API_KEY=re_your_api_key</code>.
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-900/20 border border-zinc-800 rounded-sm space-y-1">
                      <span className="text-white font-bold text-[11px] block">2. VERIFY YOUR DOMAIN (theowlclock.io)</span>
                      <p className="text-zinc-400 text-[11px]">
                        In Resend dashboard &rarr; <strong>Domains</strong> &rarr; Add Domain: <strong className="text-white">theowlclock.io</strong>. Resend will provide DNS records:
                      </p>
                      <ul className="list-disc list-inside text-zinc-400 text-[10.5px] space-y-1 pt-1">
                        <li><strong>SPF TXT Record:</strong> Host: <code className="text-zinc-200">@</code>, Value: <code className="text-zinc-200">v=spf1 include:resend.com ~all</code></li>
                        <li><strong>DKIM TXT Record:</strong> Host: <code className="text-zinc-200">resend._domainkey</code>, Value: provided by Resend</li>
                        <li><strong>MX Records:</strong> Pointing to Resend receiving mail exchangers</li>
                      </ul>
                      <p className="text-zinc-400 text-[11px] pt-1">
                        Once verified, set <code className="text-emerald-400">RESEND_DOMAIN_VERIFIED=true</code>.
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-900/20 border border-zinc-800 rounded-sm space-y-1">
                      <span className="text-white font-bold text-[11px] block">3. CONFIGURE INBOUND WEBHOOK (RECEIVE EMAILS)</span>
                      <p className="text-zinc-400 text-[11px]">
                        To receive incoming emails sent to <code className="text-zinc-200">contact@theowlclock.io</code> or <code className="text-[#D9D6CA]">collaboration@theowlclock.io</code>:
                      </p>
                      <p className="text-zinc-400 text-[11px]">
                        In Resend dashboard &rarr; <strong>Webhooks</strong> &rarr; Add Webhook &rarr; Set Endpoint URL to:
                      </p>
                      <div className="p-2 bg-black border border-zinc-800 rounded text-emerald-400 text-[11px] break-all">
                        https://theowlclock.io/api/webhooks/resend-inbound
                      </div>
                      <p className="text-zinc-400 text-[10.5px] pt-1">
                        Select events: <code className="text-zinc-200">email.received</code>. Every email sent to your domain will be parsed and registered automatically!
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-900/20 border border-zinc-800 rounded-sm space-y-1">
                      <span className="text-white font-bold text-[11px] block">4. COLLABORATION EMAIL &amp; GMAIL NOTIFICATIONS</span>
                      <p className="text-zinc-400 text-[11px]">
                        The official collaboration email is: <strong className="text-[#D9D6CA]">collaboration@theowlclock.io</strong>.
                      </p>
                      <p className="text-zinc-400 text-[11px]">
                        Every collaboration submission and client transmission automatically dispatches a prioritized copy to your Gmail at <strong className="text-white">soluwatist@gmail.com</strong> with direct Reply-To functionality.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="border-t border-zinc-900/80 pt-6 text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-left">
          <span className="text-left">LOMON LLC • ATLANTA, GEORGIA</span>
          <span className="text-left">© 2026 LOMON LLC • ALL RIGHTS RESERVED</span>
        </div>

      </div>
    </div>
  );
}
