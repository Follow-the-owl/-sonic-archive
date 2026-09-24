import React, { useState, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import {
  filterGenreSuggestions,
  filterMoodSuggestions
} from "../lib/genreMoodTaxonomy";

interface GenreTaggedSelectProps {
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function GenreTaggedSelect({
  selectedGenres = [],
  onChange,
  label = "GENRES",
  placeholder = "Type to search genres..."
}: GenreTaggedSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggestions appear as user types
  const suggestions = searchQuery.trim()
    ? filterGenreSuggestions(searchQuery, selectedGenres)
    : [];

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchQuery("");
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = (genre: string) => {
    const trimmed = genre.trim();
    if (!trimmed) return;
    const exists = selectedGenres.some(
      g => g.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      onChange([...selectedGenres, trimmed]);
    }
    setSearchQuery("");
    setActiveIndex(-1);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleRemove = (tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(selectedGenres.filter(g => g !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (suggestions.length > 0) {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % suggestions.length);
      }
    } else if (e.key === "ArrowUp") {
      if (suggestions.length > 0) {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else if (searchQuery.trim()) {
        handleSelect(searchQuery.trim());
      }
    } else if (e.key === "Backspace" && !searchQuery && selectedGenres.length > 0) {
      onChange(selectedGenres.slice(0, -1));
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setActiveIndex(-1);
    }
  };

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
          {label}
        </label>
        {selectedGenres.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[9.5px] text-zinc-500 hover:text-zinc-300 font-mono transition-colors cursor-pointer"
          >
            Clear ({selectedGenres.length})
          </button>
        )}
      </div>

      {/* Input container */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="w-full min-h-[40px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-500 rounded p-2 flex flex-wrap items-center gap-1.5 cursor-text transition-colors"
      >
        {/* Render Selected Chips */}
        {selectedGenres.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-1 rounded select-none"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={e => handleRemove(tag, e)}
              className="text-zinc-500 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              title={`Remove ${tag}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}

        {/* Search input field */}
        <div className="flex-1 min-w-[140px] flex items-center gap-1.5">
          <Search size={12} className="text-zinc-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedGenres.length === 0 ? placeholder : "Add more..."}
            className="w-full bg-transparent text-white text-xs placeholder:text-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Suggestions Dropdown (Only appears when user types) */}
      {searchQuery.trim().length > 0 && (
        <div
          onMouseDown={e => {
            // Prevent outside-click and focus loss
            e.stopPropagation();
          }}
          onTouchStart={e => {
            e.stopPropagation();
          }}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-zinc-950 border border-zinc-800 rounded shadow-2xl overflow-hidden max-h-56 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((item, index) => {
                const isHighlighted = index === activeIndex;
                return (
                  <button
                    key={item}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(item);
                    }}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(item);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      isHighlighted
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-zinc-500 flex items-center justify-between">
              <span>No match for &quot;{searchQuery}&quot;</span>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(searchQuery);
                }}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(searchQuery);
                }}
                className="text-zinc-300 hover:text-white underline text-[11px] cursor-pointer"
              >
                Add as tag
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MoodTaggedSelectProps {
  selectedMoods: string[];
  onChange: (moods: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function MoodTaggedSelect({
  selectedMoods = [],
  onChange,
  label = "MOOD",
  placeholder = "Type to search moods..."
}: MoodTaggedSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggestions appear as user types
  const suggestions = searchQuery.trim()
    ? filterMoodSuggestions(searchQuery, selectedMoods)
    : [];

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchQuery("");
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = (mood: string) => {
    const trimmed = mood.trim();
    if (!trimmed) return;
    const exists = selectedMoods.some(
      m => m.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      onChange([...selectedMoods, trimmed]);
    }
    setSearchQuery("");
    setActiveIndex(-1);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleRemove = (tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(selectedMoods.filter(m => m !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (suggestions.length > 0) {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % suggestions.length);
      }
    } else if (e.key === "ArrowUp") {
      if (suggestions.length > 0) {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else if (searchQuery.trim()) {
        handleSelect(searchQuery.trim());
      }
    } else if (e.key === "Backspace" && !searchQuery && selectedMoods.length > 0) {
      onChange(selectedMoods.slice(0, -1));
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setActiveIndex(-1);
    }
  };

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
          {label}
        </label>
        {selectedMoods.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[9.5px] text-zinc-500 hover:text-zinc-300 font-mono transition-colors cursor-pointer"
          >
            Clear ({selectedMoods.length})
          </button>
        )}
      </div>

      {/* Input container */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="w-full min-h-[40px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-500 rounded p-2 flex flex-wrap items-center gap-1.5 cursor-text transition-colors"
      >
        {/* Render Selected Chips */}
        {selectedMoods.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-1 rounded select-none"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={e => handleRemove(tag, e)}
              className="text-zinc-500 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              title={`Remove ${tag}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}

        {/* Search input field */}
        <div className="flex-1 min-w-[140px] flex items-center gap-1.5">
          <Search size={12} className="text-zinc-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedMoods.length === 0 ? placeholder : "Add more..."}
            className="w-full bg-transparent text-white text-xs placeholder:text-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Suggestions Dropdown (Only appears when user types) */}
      {searchQuery.trim().length > 0 && (
        <div
          onMouseDown={e => {
            e.stopPropagation();
          }}
          onTouchStart={e => {
            e.stopPropagation();
          }}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-zinc-950 border border-zinc-800 rounded shadow-2xl overflow-hidden max-h-56 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((item, index) => {
                const isHighlighted = index === activeIndex;
                return (
                  <button
                    key={item}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(item);
                    }}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(item);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      isHighlighted
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-zinc-500 flex items-center justify-between">
              <span>No match for &quot;{searchQuery}&quot;</span>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(searchQuery);
                }}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(searchQuery);
                }}
                className="text-zinc-300 hover:text-white underline text-[11px] cursor-pointer"
              >
                Add as tag
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
