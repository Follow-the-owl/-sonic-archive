/**
 * Standardized Genre & Mood Taxonomy for The Owl Clock Archive
 * Clean, single-term & natural phrases without slashes.
 */

export const STANDARDIZED_GENRES: string[] = [
  "Afrobeats",
  "Afro-pop",
  "Afro House",
  "Amapiano",
  "Afro Fusion",
  "Alté",
  "Highlife",
  "Contemporary R&B",
  "Neo-Soul",
  "Soul",
  "Motown",
  "Funk",
  "Boom Bap",
  "Classic Hip-Hop",
  "Trap",
  "Alternative Hip-Hop",
  "Lo-Fi Hip-Hop",
  "Ambient",
  "Downtempo",
  "House",
  "Techno",
  "Drum & Bass",
  "Chillout",
  "Trip-Hop",
  "Alternative Pop",
  "Synth-Pop",
  "Acoustic",
  "Singer-Songwriter",
  "Contemporary Jazz",
  "Jazz Fusion",
  "Cinematic Score",
  "Experimental",
  "Avant-Garde",
  "Afrobeats & African",
  "R&B & Soul",
  "Hip-Hop & Rap",
  "Electronic & Dance",
  "Pop & Contemporary",
  "Jazz & Instrumental"
];

export const STANDARDIZED_MOODS: string[] = [
  "Dark",
  "Atmospheric",
  "Dark Atmospheric",
  "Smooth",
  "Chill",
  "Smooth Chill",
  "Energetic",
  "Uplifting",
  "Energetic Uplifting",
  "Nostalgic",
  "Vintage",
  "Nostalgic Vintage",
  "Minimal",
  "Experimental",
  "Minimal Experimental"
];

/**
 * Filter genre suggestions based on user search text
 * Returns empty if query is empty ("dont list let the user then you bring sugestions")
 */
export function filterGenreSuggestions(query: string, exclude: string[] = []): string[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const excludeSet = new Set(exclude.map(e => e.toLowerCase()));
  return STANDARDIZED_GENRES.filter(g => {
    if (excludeSet.has(g.toLowerCase())) return false;
    return g.toLowerCase().includes(cleanQ);
  });
}

/**
 * Filter mood suggestions based on user search text
 * Returns empty if query is empty
 */
export function filterMoodSuggestions(query: string, exclude: string[] = []): string[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const excludeSet = new Set(exclude.map(e => e.toLowerCase()));
  return STANDARDIZED_MOODS.filter(m => {
    if (excludeSet.has(m.toLowerCase())) return false;
    return m.toLowerCase().includes(cleanQ);
  });
}
