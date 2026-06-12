import React, { useState } from "react";
import { motion } from "motion/react";
import { Radio, Send, CheckCircle, Mail, MapPin } from "lucide-react";

export default function SignalTowerSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    purpose: "Collaboration",
    interest: "",
    budget: "",
    message: ""
  });

  const [isTransmitting, setIsTransmitting] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsTransmitting(true);
    // Simulate transmission delay
    setTimeout(() => {
      setIsTransmitting(false);
      setHasSent(true);
      setFormData({
        name: "",
        email: "",
        location: "",
        purpose: "Collaboration",
        interest: "",
        budget: "",
        message: ""
      });
    }, 1800);
  };

  return (
    <div id="section-signal-tower" className="max-w-4xl mx-auto py-12 px-4 md:px-8 space-y-16">
      {/* Narrative Section Header */}
      <div className="text-center space-y-4">
        <span className="text-[10px] tracking-[0.5em] font-mono text-gold-muted uppercase block">
          LOCATION VII // THE SIGNAL TOWER
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-light tracking-[0.1em] text-zinc-100">
          The Signal Tower
        </h2>
        <p className="font-serif text-zinc-500 italic text-sm">
          "Send a signal to the archive."
        </p>
        <div className="h-[1px] w-12 bg-gold-muted/30 mx-auto mt-6" />
      </div>

      <div className="grid md:grid-cols-12 gap-12 items-start">
        {/* Left Side: Diagnostic Contact Info */}
        <div className="md:col-span-4 space-y-6 text-zinc-400 font-sans font-light">
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-gold-muted block tracking-widest uppercase">
              // TELECOMM SPECIFICATION
            </span>
            <p className="text-xs leading-relaxed">
              Signals dispatched here are logged automatically onto the sentinel’s terminal. Frequencies are reviewed twice daily during the hours nobody remembers.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-900/60 text-xs font-mono">
            {/* Real Mail link */}
            <div className="space-y-1">
              <span className="text-zinc-650 block uppercase tracking-wider">DIRECT INBOX:</span>
              <a
                id="tower-email"
                href="mailto:Unknownnarchive@gmail.com"
                className="text-zinc-200 hover:text-gold-muted flex items-center gap-1.5 transition-colors"
              >
                <Mail size={12} className="text-gold-muted/60" />
                <span>Unknownnarchive@gmail.com</span>
              </a>
            </div>

            {/* Geographical coordinates */}
            <div className="space-y-1 pt-2">
              <span className="text-zinc-650 block uppercase tracking-wider">PRIMARY TRANSMITTER:</span>
              <span className="cursor-default text-zinc-300 flex items-center gap-1.5">
                <MapPin size={12} className="text-gold-muted/60" />
                <span>LAT 53.33 / LON -0.50</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Elegant Form Console */}
        <div className="md:col-span-8">
          <div className="border border-zinc-900 bg-zinc-950/40 p-6 md:p-8 rounded-sm space-y-6 relative">
            {/* Interactive Pulse Icon */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 font-mono text-[8px] text-zinc-600 bg-zinc-950 px-2 py-1 border border-zinc-900 rounded-sm">
              <Radio size={10} className={`${isTransmitting ? "animate-pulse text-gold-muted" : "text-zinc-700"}`} />
              <span>{isTransmitting ? "TRANSMITTING..." : "TOWER IDLE"}</span>
            </div>

            <h3 className="text-sm font-mono tracking-widest uppercase text-zinc-300 flex items-center gap-2 mb-2">
              📡 DISPATCH HARMONIC SIGNAL
            </h3>

            {hasSent ? (
              <motion.div
                id="signal-success-block"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-zinc-800 bg-zinc-950/80 p-8 rounded-sm text-center flex flex-col items-center justify-center space-y-4"
              >
                <CheckCircle size={32} className="text-gold-muted" />
                <span className="text-xs font-mono text-zinc-100 uppercase tracking-[0.25em]">
                  SIGNAL SENT SUCCESSFULLY
                </span>
                <p className="text-[11px] text-zinc-500 font-sans font-light max-w-sm leading-relaxed">
                  Your transmission coordinates have bypassed our lowpass filter modules. The owl has marked your signal. We will establish contact with your server shortly.
                </p>
                <button
                  id="signal-retransmit"
                  onClick={() => setHasSent(false)}
                  className="text-[10px] font-mono text-gold-muted hover:underline uppercase tracking-widest pt-2 cursor-pointer"
                >
                  TRANSMIT NEW SIGNAL
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-[11px]">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-widest">Your Name *</label>
                    <input
                      id="signal-name"
                      type="text"
                      required
                      placeholder="ENTER IDENTIFIER..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-sm text-zinc-300 outline-none focus:border-gold-muted placeholder:text-zinc-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-widest">Email Address *</label>
                    <input
                      id="signal-email"
                      type="email"
                      required
                      placeholder="ENTER DESTINATION..."
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-sm text-zinc-300 outline-none focus:border-gold-muted placeholder:text-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-widest">Physical Location</label>
                    <input
                      id="signal-location"
                      type="text"
                      placeholder="E.G., TOKYO, REYJAVIK..."
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-sm text-zinc-300 outline-none focus:border-gold-muted placeholder:text-zinc-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-widest">Purpose Of Signal</label>
                    <select
                      id="signal-purpose"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-sm text-zinc-400 outline-none focus:border-gold-muted cursor-pointer"
                    >
                      <option value="Collaboration">Collaboration Inquiries</option>
                      <option value="Licensing">Private Licensing Proposal</option>
                      <option value="Film Scoring">Film / Media Scoring Project</option>
                      <option value="Coaching">Sonic Architecture Advisory</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-widest">Fragment / Project Interest</label>
                    <input
                      id="signal-interest"
                      type="text"
                      placeholder="E.G., FRAGMENT 03:33..."
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-sm text-zinc-300 outline-none focus:border-gold-muted placeholder:text-zinc-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-widest">Est. Allocation Budget ($)</label>
                    <input
                      id="signal-budget"
                      type="text"
                      placeholder="SPECIFY COORD METERS..."
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-sm text-zinc-300 outline-none focus:border-gold-muted placeholder:text-zinc-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase tracking-widest">Your Message / Core Frequencies *</label>
                  <textarea
                    id="signal-message"
                    required
                    rows={4}
                    placeholder="Input transmission details..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-sm text-zinc-300 outline-none focus:border-gold-muted placeholder:text-zinc-800 font-mono"
                  />
                </div>

                {/* Submit button */}
                <button
                  id="dispatch-signal-btn"
                  disabled={isTransmitting}
                  type="submit"
                  className="w-full py-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-gold-muted text-zinc-300 hover:text-gold-muted transition-colors font-bold tracking-[0.4em] uppercase rounded-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={11} />
                  <span>{isTransmitting ? "TRANSMITTING SIGNAL..." : "SEND SIGNAL"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
