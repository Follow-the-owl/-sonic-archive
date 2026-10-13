import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, X, ZoomIn, Info, HelpCircle } from "lucide-react";
import { OBSERVATORY_IMAGES, ObservatoryMedia } from "../data";

export default function ObservatorySection() {
  const [activeMedia, setActiveMedia] = useState<ObservatoryMedia | null>(null);

  return (
    <div id="section-observatory" className="max-w-6xl mx-auto py-12 px-4 md:px-8 space-y-16">
      {/* Narrative Section Header */}
      <div className="text-center space-y-4">
        <span className="text-[10px] tracking-[0.5em] font-mono text-gold-muted uppercase block">
          LOCATION IV // THE OBSERVATORY
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-light tracking-[0.1em] text-zinc-100">
          THE OBSERVATORY
        </h2>
        <p className="font-serif text-zinc-500 italic text-sm">
          "Sound becomes image."
        </p>
        <div className="h-[1px] w-12 bg-gold-muted/30 mx-auto mt-6" />
      </div>

      {/* Atmospheric Manifesto */}
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs md:text-sm text-zinc-400 font-sans font-light leading-relaxed">
          The observatory is a visual record of the environments where the fragments reside. These are not promotional press images. They are light shadows—silent monitors of empty rooms, moonlit canopies, and rain-swept blacktops designed to reinforce the auditory state.
        </p>
      </div>

      {/* Imagery Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {OBSERVATORY_IMAGES.map((media, idx) => (
          <motion.div
            id={`obs-item-${media.id}`}
            key={media.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: idx * 0.1 }}
            className="group relative h-80 bg-zinc-950 border border-zinc-900 rounded-sm overflow-hidden flex flex-col justify-between"
          >
            {/* Visual still */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={media.imageUrl}
                alt={media.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-1000 ease-out fill-current grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-black via-transparent to-transparent opacity-80" />
            </div>

            {/* Top coordinate header */}
            <div className="relative z-10 p-4 flex items-center justify-between text-[8px] font-mono tracking-widest text-zinc-500">
              <span>IMAGE_COORD_RE_{media.id}</span>
              <span className="text-gold-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                ACTIVE
              </span>
            </div>

            {/* Bottom metadata */}
            <div className="relative z-10 p-5 space-y-2">
              <h4 className="text-lg font-serif text-zinc-200 tracking-wide">
                {media.title}
              </h4>
              <p className="text-[11px] text-zinc-500 font-sans font-light truncate">
                {media.description}
              </p>

              {/* Expand trigger bar */}
              <button
                id={`expand-obs-${media.id}`}
                onClick={() => setActiveMedia(media)}
                className="pt-2 flex items-center gap-1.5 text-[9px] font-mono text-gold-muted uppercase tracking-widest cursor-pointer opacity-80 hover:opacity-100 transition-opacity text-left"
              >
                <ZoomIn size={10} />
                <span>EXPAND SPECIMEN</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {activeMedia && (
          <motion.div
            id="obs-lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 z-50 overflow-hidden"
          >
            {/* Nav Header */}
            <div className="w-full max-w-5xl flex items-center justify-between font-mono text-[10px] text-zinc-500 mb-4 select-none">
              <span>FOLLOW THE OWL VISUAL FIELD REGISTER // SPECIMEN_{activeMedia.id}</span>
              <button
                id="close-obs-lightbox"
                onClick={() => setActiveMedia(null)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
                <span>CLOSE</span>
              </button>
            </div>

            {/* Large Projected Content */}
            <div className="relative max-w-5xl w-full flex-1 flex items-center justify-center overflow-hidden border border-zinc-900 bg-zinc-950/40 rounded-sm">
              <img
                src={activeMedia.imageUrl}
                alt={activeMedia.title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] max-w-full object-contain grayscale"
              />
            </div>

            {/* Caption Block */}
            <div className="w-full max-w-3xl text-center mt-6 space-y-2 select-none">
              <h3 className="text-2xl font-serif text-zinc-200">{activeMedia.title}</h3>
              <p className="text-xs text-zinc-500 font-sans font-light tracking-wide">
                {activeMedia.description}
              </p>
              <span className="text-[9px] font-mono text-gold-muted/50 uppercase tracking-[0.2em] block">
                IMAGE RECORD SECURED BY THE OWL Sentinel ON THE EAST COOP CHANNEL
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
