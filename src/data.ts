export interface TimeCapsuleData {
  entryNo: string;
  catalogNo: string;
  title: string;
  timeOfMark: string;
  recoveryStamp: string;
  completionStamp: string;
  tonalAxis: string;
  tempoPulse: string;
  runtime: string;
  masterControl: string;
  publishingControl: string;
  origin: string;
  thirdPartyAssets: string;
  clearanceStatus: string;
  deliverableAssets: string[];
  recoveryStatus: string;
  archivist: string;
}

export interface Fragment {
  id: string; // e.g., "00:50"
  name: string;
  timestamp: string; // e.g., "00:50 AM"
  classification: string;
  observation: string;
  duration: string;
  description: string;
  isExclusive: boolean;
  frequency: number; // For synth generation
  synthType: "drone" | "keys" | "bell" | "noise" | "pulse";
  bpm: number;
  audioUrl?: string;
  previewAudioUrl?: string;
  licenseOverrides?: {
    [templateId: string]: {
      enabled?: boolean;
      priceOverride?: number;
      overrides?: Partial<Record<string, any>>;
    };
  };
  tonalSignature?: string;
  recoveryState?: string;
  fullRecoveryDate?: string;
  archivist?: string;
  mp3Preview?: string;
  timeCapsule?: TimeCapsuleData;
}

export const FRAGMENT_CANONICAL_NAMES: Record<string, string> = {
  "07:15": "07:15 AM",
  "0715": "07:15 AM",
  "7:15": "07:15 AM",
  "715": "07:15 AM",
  "12:50": "12:50 AM",
  "1250": "12:50 AM",
  "00:50": "12:50 AM",
  "0050": "12:50 AM",
  "07:46": "07:46 AM",
  "0746": "07:46 AM",
  "7:46": "07:46 AM",
  "746": "07:46 AM",
  "02:17": "02:17 AM",
  "0217": "02:17 AM",
  "2:17": "02:17 AM",
  "217": "02:17 AM",
  "05:58": "05:58 AM",
  "0558": "05:58 AM",
  "5:58": "05:58 AM",
  "558": "05:58 AM",
  "03:33": "03:33 AM",
  "0333": "03:33 AM",
  "3:33": "03:33 AM",
  "333": "03:33 AM",
  "09:41": "9:41 PM",
  "0941": "9:41 PM",
  "9:41": "9:41 PM",
  "941": "9:41 PM",
  "10:00": "10:00 PM",
  "1000": "10:00 PM",
  "10:14": "10:14 PM",
  "1014": "10:14 PM",
  "11:11": "11:11 PM",
  "1111": "11:11 PM",
  "11:28": "11:28 PM",
  "1128": "11:28 PM",
  "11:28-alt": "11:28 PM",
  "11:59": "11:59 PM",
  "1159": "11:59 PM"
};

export function getFragmentTimeName(input: any): string {
  if (!input) return "Recovered Fragment";
  if (typeof input === "object") {
    if (input.timestamp && (input.timestamp.includes("AM") || input.timestamp.includes("PM"))) {
      return input.timestamp;
    }
    const id = String(input.id || "").trim();
    if (FRAGMENT_CANONICAL_NAMES[id]) return FRAGMENT_CANONICAL_NAMES[id];
    const rawName = String(input.name || input.song || input.title || "").trim();
    if (rawName.includes("AM") || rawName.includes("PM")) return rawName;
    const cleanId = id.replace(/[^0-9]/g, "");
    if (cleanId && FRAGMENT_CANONICAL_NAMES[cleanId]) return FRAGMENT_CANONICAL_NAMES[cleanId];
  }
  const str = String(input).trim();
  if (FRAGMENT_CANONICAL_NAMES[str]) return FRAGMENT_CANONICAL_NAMES[str];
  const clean = str.replace(/[^0-9]/g, "");
  if (clean && FRAGMENT_CANONICAL_NAMES[clean]) return FRAGMENT_CANONICAL_NAMES[clean];
  
  // Legacy aliases replacement
  const upper = str.toUpperCase();
  if (upper.includes("BANDIT")) return "07:46 AM";
  if (upper.includes("OCTANE")) return "03:33 AM";
  if (upper.includes("HARDSTONE")) return "11:28 PM";
  if (upper.includes("KRYPTONITE")) return "02:17 AM";
  if (upper.includes("SIREN") || upper.includes("TORE UP")) return "05:58 AM";
  if (upper.includes("WATER") || upper.includes("SUBMERGED")) return "12:50 AM";
  if (upper.includes("BLACKOUT") || upper.includes("DEVIANT")) return "11:59 PM";
  if (upper.includes("RESTLESS")) return "10:14 PM";

  return str;
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  time: string;
  excerpt: string;
  content: string;
}

export interface ObservatoryMedia {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
}

export const CLOCK_MEANINGS = [
  {
    hour: "07:15",
    name: "07:15 AM",
    description: "Time Capsule Entry 0715. Tonal Axis: C Minor. Tempo / Pulse: 110 BPM. Runtime: 02:49. Recovery Status: FULLY RECOVERED.",
  },
  {
    hour: "09:41",
    name: "9:41 PM",
    description: "Time Capsule Entry 0941. High-fidelity recovered tape fragment carrying a B Major tonal axis at 103 BPM.",
  },
  {
    hour: "10:00",
    name: "10:00 PM",
    description: "Tonal Signature: E♭ Major. Pulse: 100 BPM. Recovery State: Fully Recovered on 2025.07.14. Archivist: Lomon.",
  },
  {
    hour: "11:11",
    name: "11:11 PM",
    description: "Rare celestial fragments decaying inside vintage tape reels with hopeful harmonic decay vibrating at 125 BPM.",
  }
];

export const FRAGMENTS: Fragment[] = [
  {
    id: "07:15",
    name: "07:15 AM",
    timestamp: "07:15 AM",
    classification: "RECOVERY STATE",
    observation: "Time Capsule Entry 0715. Captured August 15, 2026. Tonal Axis: C Minor. Tempo / Pulse: 110 BPM. Runtime: 02:49. Recovery Status: FULLY RECOVERED.",
    duration: "02:49",
    description: "Time Capsule Entry 0715. High-fidelity recovered tape fragment carrying a C Minor tonal axis at 110 BPM. Fully cleared deliverable suite co-signed under Lomon's protocols.",
    isExclusive: false,
    frequency: 261.63,
    synthType: "keys",
    bpm: 110,
    tonalSignature: "C Minor",
    recoveryState: "Fully Recovered",
    fullRecoveryDate: "2026.08.15",
    archivist: "LOMON",
    mp3Preview: "https://res.cloudinary.com/dqg8pcmvz/video/upload/v1786283841/9_41_PM.mp3_exkc1w.mp3",
    timeCapsule: {
      entryNo: "0715",
      catalogNo: "LOC-0715",
      title: "07:15 AM",
      timeOfMark: "07:15:00 AM",
      recoveryStamp: "AUG 15, 2026",
      completionStamp: "AUG 28, 2026",
      tonalAxis: "C MINOR",
      tempoPulse: "110 BPM",
      runtime: "02:49",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "01. HIGH-RES WAV MASTER [ 24-BIT / 48KHZ ]",
        "02. REFERENCE MP3 [ 320 KBPS ]",
        "03. UNCOMPRESSED INSTRUMENTAL MASTER",
        "04. COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  },
  {
    id: "09:41",
    name: "9:41 PM",
    timestamp: "09:41 PM",
    classification: "RECOVERY STATE",
    observation: "Time Capsule Entry 0941. Captured May 19, 2026. Tonal Axis: B Major. Tempo / Pulse: 103 BPM. Runtime: 03:06. Recovery Status: FULLY RECOVERED.",
    duration: "03:06",
    description: "Time Capsule Entry 0941. High-fidelity recovered tape fragment carrying a B Major tonal axis at 103 BPM. Fully cleared deliverable suite co-signed under Lomon's protocols.",
    isExclusive: false,
    frequency: 246.94, // B3 pitch
    synthType: "keys",
    bpm: 103,
    tonalSignature: "B Major",
    recoveryState: "Fully Recovered",
    fullRecoveryDate: "2026.08.08",
    archivist: "LOMON",
    mp3Preview: "https://res.cloudinary.com/dqg8pcmvz/video/upload/v1786283841/9_41_PM.mp3_exkc1w.mp3",
    timeCapsule: {
      entryNo: "0941",
      catalogNo: "TOC-0941-B",
      title: "9:41 PM",
      timeOfMark: "09:41:00 PM",
      recoveryStamp: "MAY 19, 2026",
      completionStamp: "AUG 08, 2026",
      tonalAxis: "B MAJOR",
      tempoPulse: "103 BPM",
      runtime: "03:06",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "01. HIGH-RES WAV MASTER [ 24-BIT / 48KHZ ]",
        "02. REFERENCE MP3 [ 320 KBPS ]",
        "03. UNCOMPRESSED INSTRUMENTAL MASTER",
        "04. COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  },
  {
    id: "10:00",
    name: "10:00 PM",
    timestamp: "10:00 PM",
    classification: "RECOVERY STATE",
    observation: "Tonal Signature: E♭ Major. Pulse: 100 BPM. Recovery State: Fully Recovered on 2025.07.14. Archivist: Lomon.",
    duration: "6:15",
    description: "A majestic, fully recovered 10:00 PM transmission carrying a pure E♭ Major chord sequence vibrating at 100 BPM. Archivist entry compiled and co-signed under Lomon's protocols.",
    isExclusive: false,
    frequency: 311.13, // E♭4
    synthType: "keys",
    bpm: 100,
    tonalSignature: "E♭ Major",
    recoveryState: "Fully Recovered",
    fullRecoveryDate: "2025.07.14",
    archivist: "Lomon",
    mp3Preview: "https://res.cloudinary.com/dqg8pcmvz/video/upload/v1784165475/10_00_PM.mp3_cbjsq6.mp3",
    timeCapsule: {
      entryNo: "1000",
      catalogNo: "TOC-1000-B",
      title: "10:00 PM",
      timeOfMark: "10:00:00 PM",
      recoveryStamp: "MAY 14, 2025",
      completionStamp: "JUL 14, 2025",
      tonalAxis: "E♭ MAJOR",
      tempoPulse: "100 BPM",
      runtime: "06:15",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "01. HIGH-RES WAV MASTER [ 24-BIT / 48KHZ ]",
        "02. REFERENCE MP3 [ 320 KBPS ]",
        "03. UNCOMPRESSED INSTRUMENTAL MASTER",
        "04. COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  },
  {
    id: "11:11",
    name: "11:11 PM",
    timestamp: "11:11 PM",
    classification: "DEVIANT KEYS",
    observation: "Celestial tape reel fragment captured at 11:11 PM under rare alignment.",
    duration: "5:44",
    description: "Rare celestial fragments decaying inside vintage tape reels with hopeful harmonic decay vibrating at 125 BPM.",
    isExclusive: false,
    frequency: 440,
    synthType: "keys",
    bpm: 125,
    tonalSignature: "A Major",
    recoveryState: "Fully Recovered",
    fullRecoveryDate: "2026.08.01",
    archivist: "Lomon",
    mp3Preview: "https://res.cloudinary.com/dqg8pcmvz/video/upload/v1785646485/11_11_PM_With_Tag_2_b9hx24.mp3",
    timeCapsule: {
      entryNo: "1111",
      catalogNo: "TOC-1111-A",
      title: "11:11 PM",
      timeOfMark: "11:11:00 PM",
      recoveryStamp: "JUN 01, 2026",
      completionStamp: "AUG 01, 2026",
      tonalAxis: "A MAJOR",
      tempoPulse: "125 BPM",
      runtime: "05:44",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "01. HIGH-RES WAV MASTER [ 24-BIT / 48KHZ ]",
        "02. REFERENCE MP3 [ 320 KBPS ]",
        "03. UNCOMPRESSED INSTRUMENTAL MASTER",
        "04. COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "SECURED & INDEXED",
      archivist: "LOMON"
    }
  }
];

export function getTimeCapsuleForFragment(fragment: Fragment): TimeCapsuleData {
  if (fragment.timeCapsule) return fragment.timeCapsule;

  const idClean = fragment.id.replace(/[^0-9]/g, "").padStart(4, "0");
  const title = fragment.timestamp || fragment.name || "12:00 AM";
  const catalogNo = `TOC-${idClean}-${fragment.isExclusive ? "EX" : "B"}`;
  const timeOfMark = `${title.split(" ")[0]}:00 ${title.split(" ")[1] || "PM"}`;
  const recoveryStamp = fragment.fullRecoveryDate || "MAY 19, 2026";
  const completionStamp = "AUG 08, 2026";
  const tonalAxis = (fragment.tonalSignature || "CHROMATIC MINOR").toUpperCase();
  const tempoPulse = `${fragment.bpm || 110} BPM`;
  const runtime = fragment.duration ? (fragment.duration.length === 4 ? `0${fragment.duration}` : fragment.duration) : "03:30";

  return {
    entryNo: idClean,
    catalogNo,
    title,
    timeOfMark,
    recoveryStamp,
    completionStamp,
    tonalAxis,
    tempoPulse,
    runtime,
    masterControl: "100% LOMON / THE OWL CLOCK",
    publishingControl: "100% LOMON / THE OWL CLOCK",
    origin: "100% ORIGINAL",
    thirdPartyAssets: "NONE",
    clearanceStatus: "FULLY CLEARED",
    deliverableAssets: [
      "01. HIGH-RES WAV MASTER [ 24-BIT / 48KHZ ]",
      "02. REFERENCE MP3 [ 320 KBPS ]",
      "03. UNCOMPRESSED INSTRUMENTAL MASTER",
      "04. COMPLETE STEM / TRACKOUT SUITE"
    ],
    recoveryStatus: fragment.recoveryState ? fragment.recoveryState.toUpperCase() : "SECURED & INDEXED",
    archivist: (fragment.archivist || "LOMON").toUpperCase()
  };
}

export const ARCHIVE_CATEGORIES = [
  "All",
  "THRESHOLD COIL",
  "DISCOVERY FREQ",
  "WATCH CORE",
  "SUNRISE SIREN",
  "MOONLIT RUN",
  "SHADOW HARMONY",
  "RESTLESS COID",
  "DEVIANT KEYS",
  "CHRONO ANTHEM",
  "RECOVERY STATE"
];

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: "journal-01",
    title: "Houston at 03:33 AM // Midnight Sessions",
    date: "June 11, 2026",
    time: "03:33 AM",
    excerpt: "At this hour, the street belongs to the riders. We recorded the hum of custom twin-cylinders bleeding into the synthesizers.",
    content: "At exactly 03:33 AM, the sound field behaves differently. The humid Texas night air absorbs high frequencies, leaving only the dark sub-bass of the earth and the slow, heavy resonance of distant motor exhausts. To record '03:33 AM' under these conditions is to capture a city at its rawest. The chronicle owl sits perched upon the signal tower, guiding the frequency gatekeepers. These frequencies are not composed; they are dug out of the concrete."
  },
  {
    id: "journal-02",
    title: "05:58 AM: The Dawn Sirens",
    date: "May 28, 2026",
    time: "05:58 AM",
    excerpt: "The exact moment the night dissolves and turns into fire. We recorded the sirens in the cold morning twilight.",
    content: "When the sky transitions from absolute black velvet to a bruised, smoky orange, a physical vibration shifts. The temperature drops rapidly. The highway is empty except for the heavy fog and the distant neon flashes. This is '05:58 AM'. The synths generated here carry a shivering, crystalline friction. It is the sound of absolute momentum before the sun rises."
  },
  {
    id: "journal-03",
    title: "Biker Leather & Tape Hiss",
    date: "April 14, 2026",
    time: "02:11 AM",
    excerpt: "Modern streaming is hyper-compressed. We prefer the raw scratch of leather on asphalt, documented on vintage reels.",
    content: "We reject the hyper-sterile, flat digital world. The physical aesthetic is built on texture—the heavy grain of vintage leather, the heat off a raw steel engine, the warm pitch flutter of magnetic tape. In the gaps of '00:50 AM', we left three seconds of absolute black static. It forces you to hear your own breathing, your own space. Contemplation is the ultimate luxury."
  },
  {
    id: "journal-04",
    title: "Chasing the Kryptonite Glow",
    date: "March 03, 2026",
    time: "11:50 PM",
    excerpt: "The owl watcher doesn't sleep. It knows that true colors are only seen in complete darkness under the neon.",
    content: "People fear the dark, but in our reserve, darkness is where the real signal begins. Our custom equipment has been calibrated to pick up the faint, eerie hum we call the '02:17 AM Glow'. It is a frequency that vibrates at the base of the throat, mimicking the electric energy of nocturnal cities. To hear it, you must switch your interface to raw, dim your headlights, and let the sound do the navigation."
  }
];

export const OBSERVATORY_IMAGES: ObservatoryMedia[] = [
  {
    id: "obs-01",
    title: "THE CHROME SENTINEL",
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80", 
    description: "A dark metallic chronicle owl sitting on chrome handlebars, waiting for the night ignition."
  },
  {
    id: "obs-02",
    title: "NIGHT RUN 04:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80", 
    description: "Headlights slicing through thick fog on an empty high-contrast highway. Sensed at 04:00 AM."
  },
  {
    id: "obs-03",
    title: "THE DEVIANT MAINFRAME",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80", 
    description: "Steel satellite antennas rising above the pine trees, monitoring signals from the Houston core."
  },
  {
    id: "obs-04",
    title: "00:50 AM SOUND CHAMBER",
    imageUrl: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80", 
    description: "The concrete chamber where physical pressings are verified inside complete sensory deprivation."
  },
  {
    id: "obs-05",
    title: "REBEL CANOPIES",
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80", 
    description: "Spooky misty forest backwoods where outlaw radio waves bounce in the dead of winter."
  }
];
