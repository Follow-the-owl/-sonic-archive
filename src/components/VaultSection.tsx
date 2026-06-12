import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, ShieldAlert, Key, Unlock, Send, CheckCircle, FileCode, Play, Square } from "lucide-react";
import { playFragment, stopAudio, registerAudioCallback, getActiveId } from "../audio";
import { FRAGMENTS, Fragment } from "../data";

export default function VaultSection() {
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockedFragment, setUnlockedFragment] = useState<Fragment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeSignal, setActiveSignal] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPurpose, setFormPurpose] = useState("Private Licensing");
  const [formMessage, setFormMessage] = useState("");

  const validCodes = {
    "0333": "03:33", // The Watch Hour
    "1111": "11:11", // The Wish Hour
    "0050": "00:50", // The Threshold
    "0217": "02:17", // The Discovery Hour
    "0558": "05:58"  // Before Sunrise
  };

  useEffect(() => {
    setActiveSignal(getActiveId());
    registerAudioCallback((isPlaying, id) => {
      setActiveSignal(id);
    });
  }, []);

  const handleKeyPress = (num: string) => {
    if (passcode.length < 4) {
      const nextCode = passcode + num;
      setPasscode(nextCode);
      
      // Auto-validate once 4 characters are entered
      if (nextCode.length === 4) {
        validateCode(nextCode);
      }
    }
  };

  const validateCode = (code: string) => {
    const matchedId = (validCodes as any)[code];
    if (matchedId) {
      const found = FRAGMENTS.find(f => f.id === code || (code === "1111" && f.id === "11-11") || f.id === "11:11" || f.id.replace(':', '') === code);
      const actualFragment = found || FRAGMENTS.find(f => f.id === "07:44" || f.id === "11:11" || f.id === "03:33" || f.isExclusive);
      
      if (actualFragment) {
        setUnlockedFragment(actualFragment);
        setIsUnlocked(true);
        // Play audio directly upon unlock sequence success
        playFragment(actualFragment.id, actualFragment.frequency, actualFragment.synthType);
      }
    } else {
      // Trigger short error shake then clear
      setTimeout(() => {
        setPasscode("");
      }, 700);
    }
  };

  const handleClear = () => {
    setPasscode("");
    setIsUnlocked(false);
    setUnlockedFragment(null);
    stopAudio();
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;

    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      // Clear values
      setFormName("");
      setFormEmail("");
      setFormMessage("");
    }, 1500);
  };

  const handleTogglePlay = () => {
    if (unlockedFragment) {
      if (activeSignal === unlockedFragment.id) {
        stopAudio();
      } else {
        playFragment(unlockedFragment.id, unlockedFragment.frequency, unlockedFragment.synthType);
      }
    }
  };

  return (
    <div id="section-vault" className="max-w-6xl mx-auto py-12 px-4 md:px-8 space-y-16">
      {/* Narrative Section Header */}
      <div className="text-center space-y-4">
        <span className="text-[10px] tracking-[0.5em] font-mono text-gold-muted uppercase block">
          LOCATION V // THE VAULT
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-light tracking-[0.1em] text-zinc-100">
          THE VAULT
        </h2>
        <p className="text-zinc-500 font-sans text-xs max-w-lg mx-auto leading-relaxed">
          Not every fragment belongs to the public archive. Some remain locked behind the owl’s sentinel gate. Exclusive commissions and film licensing files can be unlocked here.
        </p>
        <div className="h-[1px] w-12 bg-gold-muted/30 mx-auto mt-6" />
      </div>

      <div className="grid md:grid-cols-12 gap-12 items-start">
        {/* Left column: Security Padlock Codebreaker */}
        <div className="md:col-span-5 bg-zinc-950 border border-zinc-900 p-8 rounded-sm space-y-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-[9px] font-mono text-zinc-650 tracking-[0.2em] block">
              SECURE STATION PORTAL
            </span>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Key size={14} className="text-gold-muted" />
              <h3 className="text-lg font-mono text-zinc-300 uppercase tracking-widest">
                CIPHER MACHINE
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500 font-sans font-light">
              Enter any 4-digit sentinel time coordinate (e.g. 0333, 1111, 0050) to unlock locked audio segments in real-time.
            </p>
          </div>

          {/* Locked/Unlocked Console View screen */}
          <div className="border border-zinc-900 bg-black p-4 rounded-sm font-mono text-center relative overflow-hidden min-h-[96px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {!isUnlocked ? (
                <motion.div
                  key="locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  <span className="text-[10px] text-red-500/70 uppercase tracking-[0.3em] font-bold block animate-pulse">
                    ⚠️ SECURE GATE LOCKDOWNS
                  </span>
                  <div className="text-2xl tracking-[0.4em] text-zinc-400 font-bold">
                    {passcode.padEnd(4, "*")}
                  </div>
                  <span className="text-[9px] text-zinc-600 block">
                    {passcode.length === 4 ? "VALIDATING INDEX..." : "AWAITING TIME DESIGNATION..."}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="unlocked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2 flex flex-col items-center"
                >
                  <span className="text-[9px] text-gold-muted uppercase tracking-[0.3em] font-semibold flex items-center gap-1.5">
                    <Unlock size={10} /> LOCK RELEASED // COORD {passcode}
                  </span>
                  <span className="text-sm text-zinc-300 uppercase block truncate max-w-xs font-serif italic text-gold-muted">
                    {unlockedFragment?.name}
                  </span>
                  
                  {/* Live synthesizer controller for the newly unlocked track */}
                  <div className="flex items-center gap-2 pt-1.5 justify-center">
                    <button
                      id="vault-play-unlocked"
                      onClick={handleTogglePlay}
                      className="px-4 py-1.5 bg-gold-muted text-black text-[9px] font-mono rounded-sm transition-all flex items-center gap-1.5 uppercase cursor-pointer"
                    >
                      {activeSignal === unlockedFragment?.id ? (
                        <>
                          <Square size={9} className="fill-current text-black" />
                          <span>MUTE SIGNAL</span>
                        </>
                      ) : (
                        <>
                          <Play size={9} className="fill-current text-black" />
                          <span>PLAY CLASSIFIED</span>
                        </>
                      )}
                    </button>
                    <button
                      id="vault-relock-btn"
                      onClick={handleClear}
                      className="px-2 py-1.5 border border-zinc-800 hover:border-zinc-700 text-[9px] text-zinc-400 font-mono rounded-sm cursor-pointer"
                    >
                      RELOCK
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Physical Button Cipher Layout */}
          {!isUnlocked && (
            <div className="grid grid-cols-3 gap-3 font-mono">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  id={`cipher-key-${num}`}
                  key={num}
                  onClick={() => handleKeyPress(num.toString())}
                  className="py-3 bg-zinc-900/60 border border-zinc-900 text-zinc-400 hover:text-gold-muted hover:border-gold-muted rounded-sm text-sm cursor-pointer transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                id="cipher-key-clear"
                onClick={handleClear}
                className="py-3 bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-600 hover:text-red-400 rounded-sm cursor-pointer hover:border-red-950/45 transition-colors uppercase tracking-widest"
              >
                Clear
              </button>
              <button
                id="cipher-key-0"
                onClick={() => handleKeyPress("0")}
                className="py-3 bg-zinc-900/60 border border-zinc-900 text-zinc-400 hover:text-gold-muted hover:border-gold-muted rounded-sm text-sm cursor-pointer transition-colors"
              >
                0
              </button>
              <div className="flex items-center justify-center text-[10px] text-zinc-700 font-mono select-none">
                SECURE
              </div>
            </div>
          )}
        </div>

        {/* Right column: Vault Commission Requests */}
        <div className="md:col-span-7 space-y-8">
          <div className="space-y-3">
            <span className="text-[10px] tracking-[0.3em] font-mono text-zinc-500 uppercase block">
              ACCESS PORTAL CLASSIFICATION
            </span>
            <h3 className="text-3xl font-serif text-zinc-100 font-light">
              Classified Commissions & Scores
            </h3>
            <p className="text-zinc-400 text-xs font-sans leading-relaxed font-light">
              For exclusive compositions, custom soundtrack design, branding scores, unreleased access, and serious film/television scoring inquiries, you may request formal credential passkeys.
            </p>
          </div>

          {/* Capabilities Grid */}
          <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="border border-zinc-900 p-4 rounded-sm bg-zinc-950/10 space-y-1">
              <span className="text-gold-muted uppercase tracking-wider block">Exclusive Fragment</span>
              <span className="text-[10px] text-zinc-500 font-sans font-light">Private licensing of registered archives.</span>
            </div>
            <div className="border border-zinc-900 p-4 rounded-sm bg-zinc-950/10 space-y-1">
              <span className="text-gold-muted uppercase tracking-wider block">Custom Composition</span>
              <span className="text-[10px] text-zinc-500 font-sans font-light">Bespoke thematic arrangements made in the midnight hour.</span>
            </div>
            <div className="border border-zinc-900 p-4 rounded-sm bg-zinc-950/10 space-y-1">
              <span className="text-gold-muted uppercase tracking-wider block">Film / Brand Scoring</span>
              <span className="text-[10px] text-zinc-500 font-sans font-light">Cinematic beds crafted specifically for film/narrative media.</span>
            </div>
            <div className="border border-zinc-900 p-4 rounded-sm bg-zinc-950/10 space-y-1">
              <span className="text-gold-muted uppercase tracking-wider block">Unreleased Access</span>
              <span className="text-[10px] text-zinc-500 font-sans font-light">Exclusive entry into private drive drawers.</span>
            </div>
          </div>

          {/* Form */}
          <div className="border border-zinc-900 bg-zinc-950/40 p-6 md:p-8 rounded-sm space-y-6">
            <h4 className="text-sm font-mono uppercase tracking-[0.2em] text-zinc-300 flex items-center gap-2">
              <FileCode size={13} className="text-gold-muted" />
              <span>REQUEST VAULT CREDENTIALS</span>
            </h4>

            {submitSuccess ? (
              <motion.div
                id="vault-success-block"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center text-center space-y-3 rounded-sm"
              >
                <CheckCircle size={28} className="text-gold-muted" />
                <span className="text-xs font-mono text-zinc-200 uppercase tracking-widest">
                  TRANSMISSION COMPLETED
                </span>
                <p className="text-[11px] text-zinc-500 max-w-xs font-sans font-light">
                  The sentinel has recorded your coordinate interest. A dark private passkey proposal will be delivered if approved.
                </p>
                <button
                  id="vault-request-another"
                  onClick={() => setSubmitSuccess(false)}
                  className="text-[10px] font-mono text-gold-muted hover:underline uppercase tracking-widest pt-2 cursor-pointer"
                >
                  Send another request
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4 font-mono text-[11px]">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-wider">IDENTIFIER Name</label>
                    <input
                      id="vault-form-name"
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-sm text-zinc-300 outline-none focus:border-gold-muted"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-wider">SECURE EMAIL ADDRESS</label>
                    <input
                      id="vault-form-email"
                      type="email"
                      required
                      placeholder="name@server.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-sm text-zinc-300 outline-none focus:border-gold-muted"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase tracking-wider">PURPOSE OF TRANSMISSION</label>
                  <select
                    id="vault-form-purpose"
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-sm text-zinc-400 outline-none focus:border-gold-muted cursor-pointer"
                  >
                    <option value="Private Licensing">Private Fragment Licensing</option>
                    <option value="Custom Composition">Bespoke Soundtrack Score</option>
                    <option value="Unreleased access">Secret Vault Key Request</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase tracking-wider">ADDITIONAL SIGNAL NOTES</label>
                  <textarea
                    id="vault-form-message"
                    rows={3}
                    placeholder="Provide cinematic details of the assignment or license..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-sm text-zinc-300 outline-none focus:border-gold-muted font-mono"
                  />
                </div>

                <button
                  id="submit-vault-request"
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-gold-muted text-zinc-300 hover:text-gold-muted font-bold tracking-[0.3em] uppercase rounded-sm cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">TRANSMITTING SIGNAL...</span>
                  ) : (
                    <>
                      <Send size={11} />
                      <span>REQUEST VAULT ACCESS</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
