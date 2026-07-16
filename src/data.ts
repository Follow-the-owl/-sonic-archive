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
    hour: "00:50",
    name: "DEEP IN THE WATER",
    description: "The separation threshold between heavy thoughts and deep sleep. Mimics slow, submerged keys.",
  },
  {
    hour: "02:17",
    name: "KRYPTONITE CORED",
    description: "Lost copper shortwave signals found accidentally under the stone-cold Houston peaks.",
  },
  {
    hour: "03:33",
    name: "OCTANE NIGHT SHIFT",
    description: "The watch hour where the chronicle owl is awake and industrial engines rumble in the dark.",
  },
  {
    hour: "05:58",
    name: "TORE UP BEFORE DAWN",
    description: "Evolving synthesizer siren pads layered with cold 05:58 AM sunrise drone elements.",
  },
  {
    hour: "10:00",
    name: "LOMON RECOVERY",
    description: "Tonal Signature: E♭ Major. Pulse: 100 BPM. Recovery State: Fully Recovered. Full Recovery: 2025.07.14. Archivist: Lomon.",
  },
  {
    hour: "11:11",
    name: "LAST LAUGH ECHOES",
    description: "Rare celestial fragments decaying inside vintage tape reels. Hopeful and decaying.",
  }
];

export const FRAGMENTS: Fragment[] = [
  {
    id: "00:50",
    name: "DEEP IN THE WATER",
    timestamp: "00:50 AM",
    classification: "THRESHOLD COIL",
    observation: "Registered in a submerged concrete chamber with heavy hydrostatic filters.",
    duration: "4:12",
    description: "A slow, breathing analog sub-drone layered with tape dust and a recurring minor two-note theme, capturing the dark wet highway energy of Don't Care deep-space records.",
    isExclusive: false,
    frequency: 110, // A2 (deep drone)
    synthType: "drone",
    bpm: 78,
    licenseOverrides: {
      access: {
        priceOverride: 75,
        overrides: {
          subtitle: "PROMO RATE: For testing deep concepts."
        }
      }
    }
  },
  {
    id: "07:46",
    name: "BANDIT",
    timestamp: "07:46 AM",
    classification: "MOONLIT RUN",
    observation: "Traced on empty Houston freeways. Motorcycle exhaust heat waves visible.",
    duration: "3:50",
    description: "A hyper-distorted analog tape-loop pulse that sounds like tires peeling on cold concrete. Brutal, rhythmic, and high-contrast.",
    isExclusive: true,
    frequency: 329.63, // E4
    synthType: "pulse",
    bpm: 160,
    licenseOverrides: {
      access: { enabled: false },
      release: { enabled: false },
      commercial: { enabled: false },
      sync: { enabled: false },
      exclusive: {
        priceOverride: 3200,
        overrides: {
          subtitle: "PREMIUM BANDIT EXCLUSIVE ACQUISITION"
        }
      }
    }
  },
  {
    id: "02:17",
    name: "KRYPTONITE",
    timestamp: "02:17 AM",
    classification: "DISCOVERY FREQ",
    observation: "Captured on an old copper shortwave receiver under radio tower shadows.",
    duration: "6:04",
    description: "Faint glass-like piano notes suspended in a vast cavern of pitch-shifted delays. Captures the eerie, neon green energy of kryptonite elements.",
    isExclusive: false,
    frequency: 293.66, // D4 (glass harp tone)
    synthType: "keys",
    bpm: 92
  },
  {
    id: "05:58",
    name: "TORE UP",
    timestamp: "05:58 AM",
    classification: "SUNRISE SIREN",
    observation: "Triggered as the eastern sky changed from black velvet to radioactive neon-orange.",
    duration: "7:20",
    description: "An evolving, majestic low-bass drone with wave-shaping sirens and warm tape saturation that builds slowly, introducing high-pitch string overtones.",
    isExclusive: false,
    frequency: 146.83, // D3 (warm swell)
    synthType: "pulse",
    bpm: 128
  },
  {
    id: "03:33",
    name: "OCTANE",
    timestamp: "03:33 AM",
    classification: "WATCH CORE",
    observation: "The watch-owl guide is fully alert. Low-frequency exhaust vibrations recorded.",
    duration: "5:45",
    description: "High-energy, industrial-trap sub-bass synthetic grit combined with isolated hollow metal bell strikes. Mastered at 03:33 AM in cold vacuum chambers.",
    isExclusive: false,
    frequency: 220, // A3 (haunting bell)
    synthType: "bell",
    bpm: 140
  },
  {
    id: "10:14",
    name: "GLOCK",
    timestamp: "10:14 PM",
    classification: "RESTLESS COID",
    observation: "Dynamic chamber echoes registered during heavy storm conditions.",
    duration: "4:32",
    description: "A dark ambient sub-harmonic landscape reflecting security chambers and chrome steel finishes, with freezing atmospheric high air frequencies.",
    isExclusive: false,
    frequency: 98.0, // G2
    synthType: "drone",
    bpm: 120
  },
  {
    id: "11:28",
    name: "HARDSTONE NATIONAL",
    timestamp: "11:28 PM",
    classification: "CHRONO ANTHEM",
    observation: "Simultaneous signal broadcasted to all active members of the watch.",
    duration: "5:00",
    description: "A heavy, majestic ambient motorcycle synth-chorus spanning miles of empty asphalt. Cinematic, grand, and forever bound to the asphalt.",
    isExclusive: true,
    frequency: 196.0, // G3
    synthType: "drone",
    bpm: 120
  },
  {
    id: "11:59",
    name: "LAST LAUGH",
    timestamp: "11:59 PM",
    classification: "DEVIANT KEYS",
    observation: "Recorded during a temporary electrical blackout across the main signal tower.",
    duration: "8:11",
    description: "A beautiful, decaying celestial chord sequence played on vintage magnetic tape reels that breaks down and reforms, mimicking the final melodic fade out.",
    isExclusive: true,
    frequency: 440, // A4
    synthType: "keys",
    bpm: 105
  },
  {
    id: "11:28-alt",
    name: "LAST LAUGH ECHOES",
    timestamp: "11:28 PM",
    classification: "SHADOW HARMONY",
    observation: "Eerie low-RPM engine hum detected from the local Hardstone MC clubhouse.",
    duration: "5:10",
    description: "Saturated analog tape-static pulsing like a dark motorcycle rev, layered with a warning-buzz major fifth chord. Raw and heavy.",
    isExclusive: false,
    frequency: 164.81, // E3
    synthType: "noise",
    bpm: 85
  },
  {
    id: "10:00",
    name: "LOMON RECOVERY",
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
    mp3Preview: "https://res.cloudinary.com/dqg8pcmvz/video/upload/v1784165475/10_00_PM.mp3_cbjsq6.mp3"
  }
];

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
    title: "Houston at 03:33 // Octane Sessions",
    date: "June 11, 2026",
    time: "03:33 AM",
    excerpt: "At this hour, the street belongs to the riders. We recorded the hum of custom twin-cylinders bleeding into the synthesizers.",
    content: "At exactly 03:33 AM, the sound field behaves differently. The humid Texas night air absorbs high frequencies, leaving only the dark sub-bass of the earth and the slow, heavy resonance of distant motor exhausts. To record 'OCTANE' under these conditions is to capture a city at its rawest. The chronicle owl sits perched upon the signal tower, guiding the frequency gatekeepers. These frequencies are not composed; they are dug out of the concrete."
  },
  {
    id: "journal-02",
    title: "Tore Up: The Dawn Sirens",
    date: "May 28, 2026",
    time: "05:58 AM",
    excerpt: "The exact moment the night dissolves and turns into fire. We recorded the sirens in the cold morning twilight.",
    content: "When the sky transitions from absolute black velvet to a bruised, smoky orange, a physical vibration shifts. The temperature drops rapidly. The highway is empty except for the heavy fog and the distant neon flashes. This is 'TORE UP'. The synths generated here carry a shivering, crystalline friction. It is the sound of absolute momentum before the sun rises."
  },
  {
    id: "journal-03",
    title: "Biker Leather & Tape Hiss",
    date: "April 14, 2026",
    time: "02:11 AM",
    excerpt: "Modern streaming is hyper-compressed. We prefer the raw scratch of leather on asphalt, documented on vintage reels.",
    content: "We reject the hyper-sterile, flat digital world. The Hardstone aesthetic is built on texture—the heavy grain of vintage leather, the heat off a raw steel engine, the warm pitch flutter of magnetic tape. In the gaps of 'DEEP IN THE WATER', we left three seconds of absolute black static. It forces you to hear your own breathing, your own space. Contemplation is the ultimate luxury."
  },
  {
    id: "journal-04",
    title: "Chasing the Kryptonite Glow",
    date: "March 03, 2026",
    time: "11:50 PM",
    excerpt: "The owl watcher doesn't sleep. It knows that true colors are only seen in complete darkness under the neon.",
    content: "People fear the dark, but in our reserve, darkness is where the real signal begins. Our custom equipment has been calibrated to pick up the faint, eerie hum we call the 'Kryptonite Glow'. It is a frequency that vibrates at the base of the throat, mimicking the electric energy of nocturnal cities. To hear it, you must switch your interface to raw, dim your headlights, and let the sound do the navigation."
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
    title: "HARDSTONE RUN 04:00",
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
    title: "DEEP WATER SOUND CHAMBER",
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
