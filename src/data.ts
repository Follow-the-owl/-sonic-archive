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
  isSold?: boolean;
  exclusiveAcquired?: boolean;
  exclusiveBuyer?: string;
  soldAt?: string;
  availability?: "available" | "sold" | "reserved";
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
  key?: string;
  recoveryState?: string;
  fullRecoveryDate?: string;
  archivist?: string;
  mp3Preview?: string;
  wavMaster?: string;
  wavUrl?: string;
  stemsZip?: string;
  zipUrl?: string;
  timeCapsule?: TimeCapsuleData;
}

export const FRAGMENT_CANONICAL_NAMES: Record<string, string> = {
  "11:11": "11:11 PM",
  "1111": "11:11 PM",
  "11:11 PM": "11:11 PM",
  "10:00": "10:00 PM",
  "1000": "10:00 PM",
  "10:00 PM": "10:00 PM",
  "09:41": "09:41 PM",
  "0941": "09:41 PM",
  "9:41": "09:41 PM",
  "941": "09:41 PM",
  "9:41 PM": "09:41 PM",
  "09:41 PM": "09:41 PM",
  "01:16": "01:16 AM",
  "0116": "01:16 AM",
  "1:16": "01:16 AM",
  "116": "01:16 AM",
  "1:16 AM": "01:16 AM",
  "01:16 AM": "01:16 AM",
  "1:16 PM": "01:16 AM",
  "01:16 PM": "01:16 AM",
  "03:21": "03:21 PM",
  "0321": "03:21 PM",
  "3:21": "03:21 PM",
  "321": "03:21 PM",
  "3:21 PM": "03:21 PM",
  "03:21 PM": "03:21 PM"
};

export function normalizeFragmentId(id: string | number | undefined): string {
  if (!id) return "11:11";
  const str = String(id).trim();
  if (str.includes(":")) {
    const parts = str.split(":");
    const h = parts[0].padStart(2, "0");
    const m = parts[1].replace(/[^0-9]/g, "").padStart(2, "0");
    return `${h}:${m}`;
  }
  const digits = str.replace(/[^0-9]/g, "");
  if (digits.length === 3) {
    return `0${digits[0]}:${digits.slice(1)}`;
  }
  if (digits.length === 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }
  return str;
}

export function getFragmentTimeName(input: any): string {
  if (!input) return "11:11 PM";
  let target = "";
  if (typeof input === "object") {
    if (input.timestamp && (String(input.timestamp).includes("AM") || String(input.timestamp).includes("PM"))) {
      target = String(input.timestamp).trim();
    } else if (input.fragmentTimestamp && (String(input.fragmentTimestamp).includes("AM") || String(input.fragmentTimestamp).includes("PM"))) {
      target = String(input.fragmentTimestamp).trim();
    } else if (input.name && (String(input.name).includes("AM") || String(input.name).includes("PM"))) {
      target = String(input.name).trim();
    } else {
      target = String(input.fragmentTimestamp || input.timestamp || input.name || input.id || input.song || "").trim();
    }
  } else {
    target = String(input).trim();
  }

  if (FRAGMENT_CANONICAL_NAMES[target]) return FRAGMENT_CANONICAL_NAMES[target];
  const cleanNum = target.replace(/[^0-9]/g, "");
  if (cleanNum && FRAGMENT_CANONICAL_NAMES[cleanNum]) return FRAGMENT_CANONICAL_NAMES[cleanNum];

  // Try standard colon format e.g. "7:19", "07:19", "7:19 PM", "07:19 AM", "12:00"
  const colonMatch = target.match(/(0?[0-9]|1[0-9]|2[0-3]):([0-5]\d)\s*(AM|PM)?/i);
  if (colonMatch) {
    let rawH = parseInt(colonMatch[1], 10);
    const rawM = String(colonMatch[2]).padStart(2, "0");
    let ampm: "AM" | "PM" = colonMatch[3] 
      ? (colonMatch[3].toUpperCase() === "AM" ? "AM" : "PM")
      : (target.toUpperCase().includes("AM") ? "AM" : (target.toUpperCase().includes("PM") ? "PM" : (rawH >= 1 && rawH < 6 ? "AM" : "PM")));
    
    let hour12 = rawH;
    if (rawH === 0) hour12 = 12;
    else if (rawH > 12) hour12 = rawH % 12 === 0 ? 12 : rawH % 12;
    
    return `${hour12}:${rawM} ${ampm}`;
  }

  // Try digit sequence e.g. "719", "0719", "1111", "1000", "0941", "0321", "0116"
  const digitMatch = target.match(/(?:LOC-?|COMP-?|TC-?)?(\d{1,2})(\d{2})\s*(AM|PM)?/i);
  if (digitMatch) {
    let rawH = parseInt(digitMatch[1], 10);
    const rawM = String(digitMatch[2]).padStart(2, "0");
    let ampm: "AM" | "PM" = digitMatch[3]
      ? (digitMatch[3].toUpperCase() === "AM" ? "AM" : "PM")
      : (target.toUpperCase().includes("AM") ? "AM" : (target.toUpperCase().includes("PM") ? "PM" : (rawH >= 1 && rawH < 6 ? "AM" : "PM")));

    let hour12 = rawH;
    if (rawH === 0) hour12 = 12;
    else if (rawH > 12) hour12 = rawH % 12 === 0 ? 12 : rawH % 12;

    if (hour12 >= 1 && hour12 <= 12 && parseInt(rawM, 10) >= 0 && parseInt(rawM, 10) < 60) {
      return `${hour12}:${rawM} ${ampm}`;
    }
  }

  // Legacy aliases replacement
  const upper = target.toUpperCase();
  if (upper.includes("BANDIT")) return "07:46 AM";
  if (upper.includes("OCTANE")) return "03:33 AM";
  if (upper.includes("HARDSTONE")) return "11:28 PM";
  if (upper.includes("KRYPTONITE")) return "02:17 AM";
  if (upper.includes("SIREN") || upper.includes("TORE UP")) return "05:58 AM";
  if (upper.includes("WATER") || upper.includes("SUBMERGED")) return "12:50 AM";
  if (upper.includes("BLACKOUT") || upper.includes("DEVIANT")) return "11:59 PM";
  if (upper.includes("RESTLESS")) return "10:14 PM";

  // Strict fallback: fragment name MUST ALWAYS be a valid timestamp
  return "11:11 PM";
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
    hour: "10:00",
    name: "10:00 PM",
    description: "TIME OF MARK: 10:00 PM. RECOVERY STAMP: MAY 14, 2025. COMPLETION STAMP: JUL 14, 2025. RECOVERY STATUS: FULLY RECOVERED.",
  },
  {
    hour: "11:11",
    name: "11:11 PM",
    description: "TIME OF MARK: 11:11 PM. RECOVERY STAMP: AUG 01, 2026. COMPLETION STAMP: OCT 07, 2026. RECOVERY STATUS: FULLY RECOVERED.",
  },
  {
    hour: "01:16",
    name: "01:16 AM",
    description: "TIME OF MARK: 01:16 AM. RECOVERY STAMP: NOV 04, 2025. COMPLETION STAMP: SEP 05, 2026. RECOVERY STATUS: FULLY RECOVERED.",
  },
  {
    hour: "03:21",
    name: "03:21 PM",
    description: "TIME OF MARK: 03:21 PM. RECOVERY STAMP: NOV 06, 2025. COMPLETION STAMP: JAN 13, 2026. RECOVERY STATUS: FULLY RECOVERED.",
  },
  {
    hour: "09:41",
    name: "09:41 PM",
    description: "TIME OF MARK: 09:41 PM. RECOVERY STAMP: MAY 19, 2026. COMPLETION STAMP: AUG 08, 2026. RECOVERY STATUS: FULLY RECOVERED.",
  }
];

export const FRAGMENTS: Fragment[] = [
  {
    id: "10:00",
    name: "10:00 PM",
    timestamp: "10:00 PM",
    classification: "RECOVERY STATE",
    observation: "TIME OF MARK: 10:00 PM. KEY SIGNATURE: Eb Major. TEMPO: 100 BPM. RECOVERY STAMP: MAY 14, 2025. COMPLETION STAMP: JUL 14, 2025.",
    duration: "06:15",
    description: "A majestic, fully recovered 10:00 PM transmission carrying a pure Eb Major chord sequence vibrating at 100 BPM. Archivist entry compiled and co-signed under Lomon's protocols.",
    isExclusive: false,
    frequency: 311.13, // Eb4
    synthType: "keys",
    bpm: 100,
    tonalSignature: "Eb Major",
    recoveryState: "Fully Recovered",
    fullRecoveryDate: "MAY 14, 2025",
    archivist: "LOMON",
    mp3Preview: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/10%3B00%20PM%20%20(1).mp3",
    audioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/10%3B00%20PM%20%20(1).mp3",
    previewAudioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/10%3B00%20PM%20%20(1).mp3",
    wavMaster: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/10%3B00%20PM%20%20(1).wav",
    wavUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/10%3B00%20PM%20%20(1).wav",
    stemsZip: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/01_Archive%20(2).zip",
    zipUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/01_Archive%20(2).zip",
    timeCapsule: {
      entryNo: "1000",
      catalogNo: "TOC-1000-B",
      title: "10:00 PM",
      timeOfMark: "10:00 PM",
      recoveryStamp: "MAY 14, 2025",
      completionStamp: "JUL 14, 2025",
      tonalAxis: "EB MAJOR",
      tempoPulse: "100 BPM",
      runtime: "06:15",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "HIGH-RES WAV MASTER | 24-BIT / 48KHZ",
        "REFERENCE MP3 | 320 KBPS",
        "UNCOMPRESSED INSTRUMENTAL MASTER",
        "COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  },
  {
    id: "11:11",
    name: "11:11 PM",
    timestamp: "11:11 PM",
    classification: "RECOVERY STATE",
    observation: "TIME OF MARK: 11:11 PM. KEY SIGNATURE: B minor. TEMPO: 125 BPM. RECOVERY STAMP: AUG 01, 2026. COMPLETION STAMP: OCT 07, 2026.",
    duration: "05:44",
    description: "Time Capsule Entry 1111. High-fidelity recovered tape fragment carrying a B minor tonal axis at 125 BPM. Fully cleared deliverable suite co-signed under Lomon's protocols.",
    isExclusive: false,
    frequency: 493.88,
    synthType: "keys",
    bpm: 125,
    tonalSignature: "B minor",
    recoveryState: "Fully Recovered",
    fullRecoveryDate: "AUG 01, 2026",
    archivist: "LOMON",
    mp3Preview: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/11%3B11%20PM_F%201.mp3",
    audioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/11%3B11%20PM_F%201.mp3",
    previewAudioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/11%3B11%20PM_F%201.mp3",
    wavMaster: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/11%3B11%20PM_F%201.wav",
    wavUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/11%3B11%20PM_F%201.wav",
    stemsZip: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/01_Archive%20(2).zip",
    zipUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/01_Archive%20(2).zip",
    timeCapsule: {
      entryNo: "1111",
      catalogNo: "TOC-1111-B",
      title: "11:11 PM",
      timeOfMark: "11:11 PM",
      recoveryStamp: "AUG 01, 2026",
      completionStamp: "OCT 07, 2026",
      tonalAxis: "B MINOR",
      tempoPulse: "125 BPM",
      runtime: "05:44",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "HIGH-RES WAV MASTER | 24-BIT / 48KHZ",
        "REFERENCE MP3 | 320 KBPS",
        "UNCOMPRESSED INSTRUMENTAL MASTER",
        "COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  },
  {
    id: "01:16",
    name: "01:16 AM",
    timestamp: "01:16 AM",
    classification: "RECOVERY STATE",
    observation: "TIME OF MARK: 01:16 AM. KEY SIGNATURE: G Major. TEMPO: 104 BPM. RECOVERY STAMP: NOV 04, 2025. COMPLETION STAMP: SEP 05, 2026.",
    duration: "05:44",
    description: "Rare celestial nocturnal tape reel fragment captured at 01:16 AM carrying a G Major harmonic decay vibrating at 104 BPM. Co-signed under Lomon's protocols.",
    isExclusive: false,
    frequency: 196.00, // G3
    synthType: "keys",
    bpm: 104,
    tonalSignature: "G Major",
    recoveryState: "Fully Recovered",
    fullRecoveryDate: "NOV 04, 2025",
    archivist: "LOMON",
    mp3Preview: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/1%3B16%20AM_A2%20(1).mp3",
    audioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/1%3B16%20AM_A2%20(1).mp3",
    previewAudioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/1%3B16%20AM_A2%20(1).mp3",
    wavMaster: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/1%3B16%20AM_A2%20(1).wav",
    wavUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/1%3B16%20AM_A2%20(1).wav",
    stemsZip: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/Archive%20(8).zip",
    zipUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/Archive%20(8).zip",
    timeCapsule: {
      entryNo: "0116",
      catalogNo: "TOC-0116-G",
      title: "01:16 AM",
      timeOfMark: "01:16 AM",
      recoveryStamp: "NOV 04, 2025",
      completionStamp: "SEP 05, 2026",
      tonalAxis: "G MAJOR",
      tempoPulse: "104 BPM",
      runtime: "05:44",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "HIGH-RES WAV MASTER | 24-BIT / 48KHZ",
        "REFERENCE MP3 | 320 KBPS",
        "UNCOMPRESSED INSTRUMENTAL MASTER",
        "COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  },
  {
    id: "03:21",
    name: "03:21 PM",
    timestamp: "03:21 PM",
    classification: "RECOVERY STATE",
    observation: "TIME OF MARK: 03:21 PM. KEY SIGNATURE: F# Major. TEMPO: 100 BPM. RECOVERY STAMP: NOV 06, 2025. COMPLETION STAMP: JAN 13, 2026.",
    duration: "03:21",
    description: "Time Capsule Entry 0321. High-fidelity recovered tape fragment carrying an F# Major tonal axis at 100 BPM. Fully cleared deliverable suite co-signed under Lomon's protocols.",
    isExclusive: false,
    frequency: 369.99, // F#4
    synthType: "keys",
    bpm: 100,
    tonalSignature: "F# major",
    recoveryState: "Fully Recovered",
    fullRecoveryDate: "NOV 06, 2025",
    archivist: "LOMON",
    mp3Preview: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).mp3",
    audioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).mp3",
    previewAudioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).mp3",
    wavMaster: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).wav",
    wavUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).wav",
    stemsZip: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/Archive%20(7).zip",
    zipUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/Archive%20(7).zip",
    timeCapsule: {
      entryNo: "0321",
      catalogNo: "TOC-0321-FS",
      title: "03:21 PM",
      timeOfMark: "03:21 PM",
      recoveryStamp: "NOV 06, 2025",
      completionStamp: "JAN 13, 2026",
      tonalAxis: "F# MAJOR",
      tempoPulse: "100 BPM",
      runtime: "03:21",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "HIGH-RES WAV MASTER | 24-BIT / 48KHZ",
        "REFERENCE MP3 | 320 KBPS",
        "UNCOMPRESSED INSTRUMENTAL MASTER",
        "COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  },
  {
    id: "09:41",
    name: "09:41 PM",
    timestamp: "09:41 PM",
    classification: "RECOVERY STATE",
    observation: "TIME OF MARK: 09:41 PM. KEY SIGNATURE: B Major. TEMPO: 103 BPM. RECOVERY STAMP: MAY 19, 2026. COMPLETION STAMP: AUG 08, 2026.",
    duration: "03:06",
    description: "Time Capsule Entry 0941. High-fidelity recovered tape fragment carrying a B Major tonal axis at 103 BPM. Fully cleared deliverable suite co-signed under Lomon's protocols.",
    isExclusive: false,
    frequency: 246.94, // B3 pitch
    synthType: "keys",
    bpm: 103,
    tonalSignature: "B Major",
    recoveryState: "Fully Recovered",
    fullRecoveryDate: "MAY 19, 2026",
    archivist: "LOMON",
    mp3Preview: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/9%3B41%20PM%20(1).mp3",
    audioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/9%3B41%20PM%20(1).mp3",
    previewAudioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/9%3B41%20PM%20(1).mp3",
    wavMaster: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/9%3B41%20PM.wav",
    wavUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/9%3B41%20PM.wav",
    stemsZip: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/Archive%20(9).zip",
    zipUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/Archive%20(9).zip",
    timeCapsule: {
      entryNo: "0941",
      catalogNo: "TOC-0941-B",
      title: "09:41 PM",
      timeOfMark: "09:41 PM",
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
        "HIGH-RES WAV MASTER | 24-BIT / 48KHZ",
        "REFERENCE MP3 | 320 KBPS",
        "UNCOMPRESSED INSTRUMENTAL MASTER",
        "COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  }
];

export const CANONICAL_TIME_CAPSULES: Record<string, TimeCapsuleData> = {
  "10:00": {
    entryNo: "1000",
    catalogNo: "TOC-1000-B",
    title: "10:00 PM",
    timeOfMark: "10:00 PM",
    recoveryStamp: "MAY 14, 2025",
    completionStamp: "JUL 14, 2025",
    tonalAxis: "EB MAJOR",
    tempoPulse: "100 BPM",
    runtime: "06:15",
    masterControl: "100% LOMON / THE OWL CLOCK",
    publishingControl: "100% LOMON / THE OWL CLOCK",
    origin: "100% ORIGINAL",
    thirdPartyAssets: "NONE",
    clearanceStatus: "FULLY CLEARED",
    deliverableAssets: [
      "HIGH-RES WAV MASTER | 24-BIT / 48KHZ",
      "REFERENCE MP3 | 320 KBPS",
      "UNCOMPRESSED INSTRUMENTAL MASTER",
      "COMPLETE STEM / TRACKOUT SUITE"
    ],
    recoveryStatus: "FULLY RECOVERED",
    archivist: "LOMON"
  },
  "11:11": {
    entryNo: "1111",
    catalogNo: "TOC-1111-B",
    title: "11:11 PM",
    timeOfMark: "11:11 PM",
    recoveryStamp: "AUG 01, 2026",
    completionStamp: "OCT 07, 2026",
    tonalAxis: "B MINOR",
    tempoPulse: "125 BPM",
    runtime: "05:44",
    masterControl: "100% LOMON / THE OWL CLOCK",
    publishingControl: "100% LOMON / THE OWL CLOCK",
    origin: "100% ORIGINAL",
    thirdPartyAssets: "NONE",
    clearanceStatus: "FULLY CLEARED",
    deliverableAssets: [
      "HIGH-RES WAV MASTER | 24-BIT / 48KHZ",
      "REFERENCE MP3 | 320 KBPS",
      "UNCOMPRESSED INSTRUMENTAL MASTER",
      "COMPLETE STEM / TRACKOUT SUITE"
    ],
    recoveryStatus: "FULLY RECOVERED",
    archivist: "LOMON"
  },
  "01:16": {
    entryNo: "0116",
    catalogNo: "TOC-0116-G",
    title: "01:16 AM",
    timeOfMark: "01:16 AM",
    recoveryStamp: "NOV 04, 2025",
    completionStamp: "SEP 05, 2026",
    tonalAxis: "G MAJOR",
    tempoPulse: "104 BPM",
    runtime: "05:44",
    masterControl: "100% LOMON / THE OWL CLOCK",
    publishingControl: "100% LOMON / THE OWL CLOCK",
    origin: "100% ORIGINAL",
    thirdPartyAssets: "NONE",
    clearanceStatus: "FULLY CLEARED",
    deliverableAssets: [
      "HIGH-RES WAV MASTER | 24-BIT / 48KHZ",
      "REFERENCE MP3 | 320 KBPS",
      "UNCOMPRESSED INSTRUMENTAL MASTER",
      "COMPLETE STEM / TRACKOUT SUITE"
    ],
    recoveryStatus: "FULLY RECOVERED",
    archivist: "LOMON"
  },
  "03:21": {
    entryNo: "0321",
    catalogNo: "TOC-0321-FS",
    title: "03:21 PM",
    timeOfMark: "03:21 PM",
    recoveryStamp: "NOV 06, 2025",
    completionStamp: "JAN 13, 2026",
    tonalAxis: "F# MAJOR",
    tempoPulse: "100 BPM",
    runtime: "03:21",
    masterControl: "100% LOMON / THE OWL CLOCK",
    publishingControl: "100% LOMON / THE OWL CLOCK",
    origin: "100% ORIGINAL",
    thirdPartyAssets: "NONE",
    clearanceStatus: "FULLY CLEARED",
    deliverableAssets: [
      "HIGH-RES WAV MASTER | 24-BIT / 48KHZ",
      "REFERENCE MP3 | 320 KBPS",
      "UNCOMPRESSED INSTRUMENTAL MASTER",
      "COMPLETE STEM / TRACKOUT SUITE"
    ],
    recoveryStatus: "FULLY RECOVERED",
    archivist: "LOMON"
  },
  "09:41": {
    entryNo: "0941",
    catalogNo: "TOC-0941-B",
    title: "09:41 PM",
    timeOfMark: "09:41 PM",
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
      "HIGH-RES WAV MASTER | 24-BIT / 48KHZ",
      "REFERENCE MP3 | 320 KBPS",
      "UNCOMPRESSED INSTRUMENTAL MASTER",
      "COMPLETE STEM / TRACKOUT SUITE"
    ],
    recoveryStatus: "FULLY RECOVERED",
    archivist: "LOMON"
  }
};

// Aliases
CANONICAL_TIME_CAPSULES["3:21"] = CANONICAL_TIME_CAPSULES["03:21"];
CANONICAL_TIME_CAPSULES["321"] = CANONICAL_TIME_CAPSULES["03:21"];
CANONICAL_TIME_CAPSULES["0321"] = CANONICAL_TIME_CAPSULES["03:21"];
CANONICAL_TIME_CAPSULES["9:41"] = CANONICAL_TIME_CAPSULES["09:41"];
CANONICAL_TIME_CAPSULES["941"] = CANONICAL_TIME_CAPSULES["09:41"];
CANONICAL_TIME_CAPSULES["0941"] = CANONICAL_TIME_CAPSULES["09:41"];
CANONICAL_TIME_CAPSULES["1:16"] = CANONICAL_TIME_CAPSULES["01:16"];
CANONICAL_TIME_CAPSULES["116"] = CANONICAL_TIME_CAPSULES["01:16"];
CANONICAL_TIME_CAPSULES["0116"] = CANONICAL_TIME_CAPSULES["01:16"];
CANONICAL_TIME_CAPSULES["1000"] = CANONICAL_TIME_CAPSULES["10:00"];
CANONICAL_TIME_CAPSULES["1111"] = CANONICAL_TIME_CAPSULES["11:11"];
CANONICAL_TIME_CAPSULES["LOC-COMP-1000"] = CANONICAL_TIME_CAPSULES["10:00"];
CANONICAL_TIME_CAPSULES["LOC-COMP-1111"] = CANONICAL_TIME_CAPSULES["11:11"];
CANONICAL_TIME_CAPSULES["LOC-COMP-0116"] = CANONICAL_TIME_CAPSULES["01:16"];
CANONICAL_TIME_CAPSULES["LOC-COMP-0321"] = CANONICAL_TIME_CAPSULES["03:21"];
CANONICAL_TIME_CAPSULES["LOC-COMP-0941"] = CANONICAL_TIME_CAPSULES["09:41"];

export const CANONICAL_TONAL_SIGNATURES: Record<string, string> = {
  "10:00": "Eb Major",
  "11:11": "B minor",
  "01:16": "G Major",
  "03:21": "F# major",
  "09:41": "B Major"
};

// Aliases for Tonal Signatures
CANONICAL_TONAL_SIGNATURES["1000"] = "Eb Major";
CANONICAL_TONAL_SIGNATURES["10:00 PM"] = "Eb Major";
CANONICAL_TONAL_SIGNATURES["1111"] = "B minor";
CANONICAL_TONAL_SIGNATURES["11:11 PM"] = "B minor";
CANONICAL_TONAL_SIGNATURES["0116"] = "G Major";
CANONICAL_TONAL_SIGNATURES["1:16"] = "G Major";
CANONICAL_TONAL_SIGNATURES["116"] = "G Major";
CANONICAL_TONAL_SIGNATURES["01:16 AM"] = "G Major";
CANONICAL_TONAL_SIGNATURES["0321"] = "F# major";
CANONICAL_TONAL_SIGNATURES["3:21"] = "F# major";
CANONICAL_TONAL_SIGNATURES["321"] = "F# major";
CANONICAL_TONAL_SIGNATURES["03:21 PM"] = "F# major";
CANONICAL_TONAL_SIGNATURES["0941"] = "B Major";
CANONICAL_TONAL_SIGNATURES["9:41"] = "B Major";
CANONICAL_TONAL_SIGNATURES["941"] = "B Major";
CANONICAL_TONAL_SIGNATURES["09:41 PM"] = "B Major";

export function getTonalSignatureForFragment(fragmentOrId: any): string {
  if (!fragmentOrId) return "Eb Major";
  if (typeof fragmentOrId === "object" && fragmentOrId.tonalSignature) {
    return fragmentOrId.tonalSignature;
  }
  const rawId = typeof fragmentOrId === "string" 
    ? fragmentOrId 
    : (fragmentOrId?.id || fragmentOrId?.name || fragmentOrId?.timestamp || "");
  const normId = normalizeFragmentId(rawId);
  return CANONICAL_TONAL_SIGNATURES[normId] || CANONICAL_TONAL_SIGNATURES[rawId] || "Eb Major";
}

export function getTimeCapsuleForFragment(fragment: Fragment | string): TimeCapsuleData {
  const rawId = typeof fragment === "string" 
    ? fragment 
    : (fragment?.id || fragment?.name || (fragment as any)?.compositionId || "");
  const normId = normalizeFragmentId(rawId);

  // ALWAYS enforce canonical sonic identifier for all 5 authorized beats
  if (CANONICAL_TIME_CAPSULES[normId]) {
    return CANONICAL_TIME_CAPSULES[normId];
  }
  const cleanDigits = rawId.replace(/[^0-9]/g, "");
  if (cleanDigits && CANONICAL_TIME_CAPSULES[cleanDigits]) {
    return CANONICAL_TIME_CAPSULES[cleanDigits];
  }
  if (CANONICAL_TIME_CAPSULES[rawId]) {
    return CANONICAL_TIME_CAPSULES[rawId];
  }

  if (typeof fragment === "object" && fragment.timeCapsule) {
    return fragment.timeCapsule;
  }

  return CANONICAL_TIME_CAPSULES["10:00"];
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
