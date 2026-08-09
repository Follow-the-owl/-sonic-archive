import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface DocumentScrollControlsProps {
  containerRef?: React.RefObject<HTMLElement | null>;
}

export default function DocumentScrollControls({ containerRef }: DocumentScrollControlsProps) {
  const scrollToTop = () => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToBottom = () => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
    } else {
      window.scrollTo({
        top: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
        behavior: "smooth"
      });
    }
  };

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-1.5 p-1.5 bg-zinc-950/95 backdrop-blur-md border border-zinc-800/90 rounded-md shadow-2xl transition-all duration-300"
      aria-label="Document Navigation Controls"
    >
      <button
        type="button"
        onClick={scrollToTop}
        title="Scroll to Top"
        className="flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-500 rounded-sm transition-all cursor-pointer group shadow-sm"
      >
        <ArrowUp size={13} className="group-hover:-translate-y-0.5 transition-transform text-zinc-300" />
        <span className="hidden sm:inline">TOP</span>
      </button>

      <div className="h-[1px] bg-zinc-850 w-full" />

      <button
        type="button"
        onClick={scrollToBottom}
        title="Scroll to End of Document"
        className="flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-500 rounded-sm transition-all cursor-pointer group shadow-sm"
      >
        <ArrowDown size={13} className="group-hover:translate-y-0.5 transition-transform text-zinc-300" />
        <span className="hidden sm:inline">END</span>
      </button>
    </div>
  );
}
