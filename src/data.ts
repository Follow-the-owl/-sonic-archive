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
    name: "The Threshold",
    description: "The first opening into the archive. Echoing thresholds between sleep and waking.",
  },
  {
    hour: "02:17",
    name: "The Discovery Hour",
    description: "Sounds found by accident. Lost melodies, strange resonances, and faint signals.",
  },
  {
    hour: "03:33",
    name: "The Watch Hour",
    description: "The hour where the owl is fully awake and the world is completely quiet.",
  },
  {
    hour: "05:58",
    name: "Before Sunrise",
    description: "The final darkness before dawn. Cold winds, static layers, and growing light.",
  },
  {
    hour: "11:11",
    name: "The Wish Hour",
    description: "Rare fragments from another dimension. Hopeful, strange, and almost unreal.",
  }
];

export const FRAGMENTS: Fragment[] = [
  {
    id: "00:50",
    name: "The Threshold",
    timestamp: "12:50 AM",
    classification: "The Threshold",
    observation: "Recording registered in a cold, unoccupied concrete chamber.",
    duration: "4:12",
    description: "A slow, breathing analog sub-drone layered with tape dust and a recurring minor two-note theme. It marks the separation between active thoughts and deep sleep.",
    isExclusive: false,
    frequency: 110, // A2 (deep drone)
    synthType: "drone"
  },
  {
    id: "02:17",
    name: "The Discovery Hour",
    timestamp: "02:17 AM",
    classification: "Discovery Hour",
    observation: "Captured accidentally while tuning an old copper-wire shortwave receiver.",
    duration: "6:04",
    description: "Faint glass-like piano notes suspended in a vast cavern of reverb and granular delays. Ideal for moments when words are inadequate.",
    isExclusive: false,
    frequency: 293.66, // D4 (glass harp tone)
    synthType: "keys"
  },
  {
    id: "03:33",
    name: "The Watch Hour",
    timestamp: "03:33 AM",
    classification: "The Watch Hour",
    observation: "The guide is fully alert. Shadows on the wall remained perfectly still.",
    duration: "5:45",
    description: "An isolated, hollow glass bell that sounds every few breaths, wrapped in rich, low warmth and the sound of very distant nocturnal trees.",
    isExclusive: false,
    frequency: 220, // A3 (haunting bell)
    synthType: "bell"
  },
  {
    id: "05:58",
    name: "Before Sunrise",
    timestamp: "05:58 AM",
    classification: "Before Sunrise",
    observation: "Captured in the exact moment the eastern sky turned from black to smoke-gray.",
    duration: "7:20",
    description: "An evolving, majestic low drone with warm tape saturation that builds slowly, introducing high-pitch string-like overtones as daylight approaches.",
    isExclusive: false,
    frequency: 146.83, // D3 (warm swell)
    synthType: "pulse"
  },
  {
    id: "07:44",
    name: "Moonlit Shadow",
    timestamp: "11:11 PM",
    classification: "Moonlit",
    observation: "Traced on an empty salt-flat. Moonlight was direct and clinical.",
    duration: "3:50",
    description: "A gentle pulse that sounds like water hitting cold marble. Extremely sparse and rhythmic.",
    isExclusive: true,
    frequency: 329.63, // E4
    synthType: "pulse"
  },
  {
    id: "09:05",
    name: "Warm Static Memory",
    timestamp: "01:05 AM",
    classification: "Warm Static",
    observation: "Faint humming heard beneath the roots of an old oak tree.",
    duration: "5:10",
    description: "Analog tape static pulsing like a slow heartbeat, layered with a comforting yet mysterious major fifth chord.",
    isExclusive: false,
    frequency: 164.81, // E3
    synthType: "noise"
  },
  {
    id: "10:40",
    name: "The Restless Pines",
    timestamp: "03:33 AM",
    classification: "Restless",
    observation: "A persistent rustle detected through custom hydrophones in the reservoir.",
    duration: "4:32",
    description: "A dark ambient soundscape detailing the dense weight of the night forest, with heavy sub-bass and shivering high air sounds.",
    isExclusive: false,
    frequency: 98.0, // G2
    synthType: "drone"
  },
  {
    id: "11:11",
    name: "The Wish Hour (Unreal)",
    timestamp: "11:11 AM",
    classification: "Forgotten",
    observation: "Anomalous sound field recorded when all equipment was powered down.",
    duration: "8:11",
    description: "A stunning, hopeful chord sequence played on an ancient tape loop machine that breaks down and reforms continually in the dark.",
    isExclusive: true,
    frequency: 440, // A4
    synthType: "keys"
  },
  {
    id: "12:00",
    name: "Distant Echoes",
    timestamp: "12:00 AM",
    classification: "Distant",
    observation: "Registered during a meteor shower with high electrostatic activity.",
    duration: "5:00",
    description: "Long, echoing strings that span miles of simulated space. Minimal, timeless, and completely isolated.",
    isExclusive: true,
    frequency: 196.0, // G3
    synthType: "drone"
  }
];

export const ARCHIVE_CATEGORIES = [
  "All",
  "Before Sunrise",
  "The Watch Hour",
  "The Threshold",
  "Discovery Hour",
  "Moonlit",
  "Restless",
  "Forgotten",
  "Distant",
  "Warm Static",
  "Shadow Memory"
];

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: "journal-01",
    title: "Notes from 03:33",
    date: "June 11, 2026",
    time: "03:33 AM",
    excerpt: "At this hour, silence is not empty. It carries the weight of everything that was left unsaid during the daylight.",
    content: "At exactly 03:33 AM, the sound field behaves differently. The atmospheric humidity absorbs high frequencies, leaving only the dark sub-bass of the earth and the slow breathing of the surrounding woods. To record at this hour is to listen to the planet without its occupants. The owl sits on the high antenna of the signal tower, completely motionless, guiding the frequency filters. I've realized that the sounds we capture are not composed; they are merely uncovered."
  },
  {
    id: "journal-02",
    title: "The Sound Before Sunrise",
    date: "May 28, 2026",
    time: "05:58 AM",
    excerpt: "There is a transition point where the night realizes it is ending. The sound captured then is a form of grief.",
    content: "When the sky transitions from absolute velvet to a bruised, smoky blue, a physical shift occurs. The temperature drops by several degrees. Birds are not yet screaming, but the insects have fallen silent. This narrow window of twenty minutes is what we classify as 'Before Sunrise'. The recordings made here have a cold, shimmering quality. It feels like an ending and a beginning fused together in a single static drone. It is the sound of letting go."
  },
  {
    id: "journal-03",
    title: "Why Silence Matters",
    date: "April 14, 2026",
    time: "02:11 AM",
    excerpt: "Modern noise is designed to keep you from remembering. The archive preserves space, not just sound.",
    content: "We are flooded with continuous, hyper-compressed musical content. It is designed to dominate attention, leaving no space for contemplation. The UNKNOWN archive is modeled on a different philosophy: empty space. Between every note inside FRAGMENT 02:17, there is a gulf of digital silence that lasts several seconds. In those gaps, your own breathing and the background hum of your own room become part of the composition. Silence is not the absence of sound; it is the presence of awareness."
  },
  {
    id: "journal-04",
    title: "The Owl and the Night",
    date: "March 03, 2026",
    time: "11:50 PM",
    excerpt: "The watcher does not sleep. It understands that darkness is a security, not a danger.",
    content: "Cultures have long feared the owl as a harbinger. In our archive, the owl is a sentinel. With pupils designed to concentrate the faintest traces of light, the owl sees structure where humans see only void. The sound fragments we label as 'Guarded By The Owl' are those that contain frequency registers too delicate for casual listening. They demand that you close your eyes, dim your screens, and let your auditory senses adapt, just as an owl's eyes adapt to the deep forest canopy."
  },
  {
    id: "journal-05",
    title: "Music for Unnamed Feelings",
    date: "February 19, 2026",
    time: "04:05 AM",
    excerpt: "Can we catalog the exact emotional state of seeing rain hit a window at an empty highway stop?",
    content: "There are specific emotional coordinates that have no names in any language. The feeling of seeing a warm yellow streetlamp reflected on wet asphalt in a town you will never visit again. The feeling of waking up at 4 AM and realizing everyone you love is asleep. We don't write music to express sadness or joy. We archive these specific unnamed feelings. Every fragment is a jar containing a single cold, damp night."
  }
];

export const OBSERVATORY_IMAGES: ObservatoryMedia[] = [
  {
    id: "obs-01",
    title: "The Sentinel",
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80", // Elegant dark owl
    description: "The guide sits on a hemlock branch, waiting for the first signal."
  },
  {
    id: "obs-02",
    title: "Night Road 04:00",
    imageUrl: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80", // Moody road in fog
    description: "A wet highway stretching into the pine canopy. Sound registered at 03:00."
  },
  {
    id: "obs-03",
    title: "The Signal Recipient",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80", // Radio telescope or empty tower in night
    description: "The steel towers standing silent as they probe the empty sky."
  },
  {
    id: "obs-04",
    title: "Nocturnal Chamber",
    imageUrl: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80", // Dark moody empty room
    description: "Where fragments are collected from speakers in complete isolation."
  },
  {
    id: "obs-05",
    title: "Midnight Canopies",
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80", // Foggy pine forest at night/dusk
    description: "The silent breathing of the woods captured in FRAGMENT 10:40."
  },
  {
    id: "obs-06",
    title: "The Watcher's Reflection",
    imageUrl: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=80", // Moody abstract dark clouds/light
    description: "The faint golden rim of light hovering over the horizon."
  }
];
