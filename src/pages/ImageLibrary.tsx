import { motion } from "framer-motion";
import { Image, Search, Filter } from "lucide-react";

const CATEGORIES = [
  { id: "conditions", name: "Conditions", icons: ["🫀", "🫁", "🧠", "🦴", "👁️"] },
  { id: "medications", name: "Medications", icons: ["💊", "💉", "🩹", "💊", "🧪"] },
  { id: "procedures", name: "Procedures", icons: ["🩺", "🏥", "🚑", "🔬", "🩻"] },
  { id: "emotions", name: "Emotions", icons: ["😊", "😢", "😰", "😤", "😴"] },
];

export default function ImageLibrary() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [search, setSearch] = useState("");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Image Library</h1>
        <p className="text-slate-400 text-sm">Healthicons and assets for CHW interfaces</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons..."
          className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "bg-slate-800/40 text-slate-300 border border-transparent"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Icon grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {CATEGORIES
          .find((c) => c.id === activeCategory)
          ?.icons.map((icon, idx) => (
            <button
              key={idx}
              className="aspect-square flex items-center justify-center text-3xl rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-teal-500/30 transition-all"
            >
              {icon}
            </button>
          ))}
      </div>

      <p className="text-xs text-slate-500 text-center mt-4">
        All icons are from Healthicons (CC0 license) and ready for use in CHW interfaces.
      </p>
    </motion.div>
  );
}
