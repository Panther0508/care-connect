import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  AlertTriangle,
  Activity,
  Heart,
  Bandage,
  X,
  ChevronRight,
  Shield
} from "lucide-react";

interface FirstAidEntry {
  id: string;
  tag: string;
  title: string;
  steps: string[];
  icon?: React.ReactNode;
}

const FIRST_AID_DATA: FirstAidEntry[] = [
  {
    id: "cpr",
    tag: "Emergency",
    title: "CPR (Cardiopulmonary Resuscitation)",
    steps: [
      "Check responsiveness: tap and shout.",
      "Call emergency services immediately.",
      "Place hands in center of chest, one on top of the other.",
      "Push hard, at least 2 inches deep, at 100-120 compressions per minute.",
      "Give 30 compressions, then 2 rescue breaths if trained.",
      "Continue until help arrives or person breathes on their own."
    ],
    icon: <Heart className="text-red-500" />
  },
  {
    id: "bleeding",
    tag: "Injury",
    title: "Heavy Bleeding",
    steps: [
      "Apply firm, direct pressure on wound with clean cloth or dressing.",
      "If blood soaks through, add more layers; do NOT remove original dressing.",
      "Elevate wound above heart level if possible.",
      "If life-threatening and pressure fails, apply tourniquet 2 inches above wound (as last resort).",
      "Call emergency services immediately."
    ],
    icon: <AlertTriangle className="text-amber-500" />
  },
  {
    id: "choking",
    tag: "Emergency",
    title: "Choking (Adult)",
    steps: [
      "Encourage coughing if partial airway obstruction.",
      "If cannot breathe, stand behind and wrap arms around waist.",
      "Make fist with one hand above navel, thumb side in, grasp fist with other hand.",
      "Quick upward thrusts (Heimlich) until object expelled.",
      "If unconscious, lower to ground, call emergency services, start CPR."
    ],
    icon: <AlertTriangle className="text-red-500" />
  },
  {
    id: "burns",
    tag: "Injury",
    title: "Burns (Thermal)",
    steps: [
      "Cool burn under cool (not cold) running water for 10-20 minutes.",
      "Do NOT apply ice, butter, toothpaste, or ointments.",
      "Cover with clean, non-stick cloth or loose bandage.",
      "Do NOT pop blisters.",
      "Seek medical care for large, deep, or facial burns."
    ],
    icon: <Packets className="text-orange-500" />
  },
  {
    id: "fracture",
    tag: "Injury",
    title: "Suspected Fracture",
    steps: [
      "Do NOT move the injured limb if possible.",
      "Immobilize with splint or padded board.",
      "Apply ice pack wrapped in cloth to reduce swelling.",
      "Seek medical attention immediately."
    ],
    icon: <Shield className="text-blue-500" />
  },
  {
    id: "poison",
    tag: "Emergency",
    title: "Poisoning / Overdose",
    steps: [
      "Call emergency services immediately.",
      "If person is unconscious, place in recovery position.",
      "Do NOT induce vomiting unless directed by poison control.",
      "If conscious, ask what was taken and how much.",
      "Keep sample of substance for medical team."
    ],
    icon: <AlertTriangle className="text-purple-500" />
  },
  {
    id: "stroke",
    tag: "Emergency",
    title: "Stroke (FAST)",
    steps: [
      "F - Face: Ask to smile. Does one side droop?",
      "A - Arms: Ask to raise both arms. Does one drift down?",
      "S - Speech: Ask to repeat a phrase. Is it slurred or strange?",
      "T - Time: Call emergency services immediately if any sign present.",
      "Note time of symptom onset â€” critical for treatment."
    ],
    icon: <Heart className="text-teal-500" />
  },
  {
    id: "heart-attack",
    tag: "Emergency",
    title: "Heart Attack",
    steps: [
      "Call emergency services immediately.",
      "Chew and swallow aspirin (300-325mg) if not allergic and not contraindicated.",
      "Loosen tight clothing.",
      "If person becomes unconscious, begin CPR.",
      "Do NOT leave person alone."
    ],
    icon: <Heart className="text-red-600" />
  },
  {
    id: "snakebite",
    tag: "Bite",
    title: "Snake Bite",
    steps: [
      "Call emergency services immediately.",
      "Keep victim still and calm to slow venom spread.",
      "Keep affected limb immobilized and at or slightly below heart level.",
      "Remove tight jewelry/items; swelling will occur.",
      "Do NOT apply tourniquet, cut wound, or attempt to suck venom.",
      "Note snake appearance if safe, but do not endanger yourself."
    ],
    icon: <AlertTriangle className="text-green-600" />
  },
  {
    id: "hypothermia",
    tag: "Environmental",
    title: "Hypothermia (Cold Exposure)",
    steps: [
      "Move person to warm, dry location.",
      "Remove wet clothing.",
      "Warm core first: chest, neck, head, groin with blankets.",
      "Provide warm, sweet drinks if conscious and able to swallow.",
      "Do NOT use direct heat (heating pads, hot water).",
      "Seek medical help immediately for moderate/severe cases."
    ],
    icon: <Packets className="text-blue-400" />
  },
  {
    id: "diabetic-emergency",
    tag: "Medical",
    title: "Diabetic Emergency (Hypo/Hyper)",
    steps: [
      "If conscious and able to swallow: give sugary drink or glucose tablets for hypoglycemia.",
      "If unconscious or seizing: do NOT give anything by mouth; place in recovery position.",
      "Call emergency services if condition does not improve quickly.",
      "Check for medical ID bracelet.",
      "If insulin is available and person is hyperglycemic but conscious, administer as prescribed."
    ],
    icon: <FirstAidKit className="text-amber-600" />
  },
  {
    id: "seizure",
    tag: "Neurological",
    title: "Seizure",
    steps: [
      "Do NOT restrain the person.",
      "Clear area of hard or sharp objects.",
      "Do NOT put anything in their mouth.",
      "Time the seizure; note type of movements.",
      "After seizure stops, place in recovery position.",
      "Call emergency services if first seizure, lasts >5 min, or multiple seizures."
    ],
    icon: <AlertTriangle className="text-indigo-500" />
  }
];

const TAGS = ["All", "Emergency", "Injury", "Bite", "Environmental", "Medical", "Neurological"];

export default function FirstAidPage() {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [selectedEntry, setSelectedEntry] = useState<FirstAidEntry | null>(null);

  const filtered = useMemo(() => {
    return FIRST_AID_DATA.filter(entry => {
      const matchesSearch = entry.title.toLowerCase().includes(search.toLowerCase()) ||
        entry.steps.some(s => s.toLowerCase().includes(search.toLowerCase()));
      const matchesTag = selectedTag === "All" || entry.tag === selectedTag;
      return matchesSearch && matchesTag;
    });
  }, [search, selectedTag]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 p-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FirstAidKit className="text-teal-400" />
          First Aid
        </h1>
        <p className="text-slate-400 text-sm">Emergency guidance at your fingertips</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search first aid procedures..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/30 rounded-xl text-sm text-slate-200 placeholder:text-slate-500"
        />
      </div>

      {/* Tag Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedTag === tag
                ? "bg-teal-500 text-white"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/60"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* List or Detail */}
      {selectedEntry ? (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <button
            onClick={() => setSelectedEntry(null)}
            className="mb-3 text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            <ChevronRight size={16} className="rotate-180" />
            Back to list
          </button>
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-xl bg-slate-700/50 mt-1">
                {selectedEntry.icon}
              </div>
              <div>
                <span className="text-xs text-teal-400 font-medium uppercase tracking-wide">{selectedEntry.tag}</span>
                <h2 className="text-lg font-bold text-white mt-1">{selectedEntry.title}</h2>
              </div>
            </div>
            <ol className="space-y-3">
              {selectedEntry.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-slate-300 text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-200 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                If the situation is life-threatening, call emergency services immediately. This guide does not replace professional medical care.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
              <Search size={40} className="mx-auto text-slate-600 mb-2" />
              <p className="text-slate-400">No procedures found</p>
              <p className="text-slate-500 text-sm">Try a different search term</p>
            </div>
          ) : (
            filtered.map((entry, idx) => (
              <motion.button
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedEntry(entry)}
                className="w-full text-left bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 hover:border-teal-500/40 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-teal-500/20 transition-colors">
                    {entry.icon || <FirstAidKit className="text-slate-400 group-hover:text-teal-400" size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-teal-400 font-medium uppercase tracking-wide">{entry.tag}</span>
                      <ChevronRight size={16} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                    </div>
                    <h3 className="text-slate-200 font-semibold mt-1">{entry.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{entry.steps.length} steps</p>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}
