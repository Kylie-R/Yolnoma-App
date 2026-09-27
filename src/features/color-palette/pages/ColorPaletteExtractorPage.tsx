import { useMemo, useState } from "react";
import { Copy, Droplets, Palette, Sparkles } from "lucide-react";
import { Button } from "@/shared/ui";
import { toast } from "@/shared/ui/Toast";

const SAMPLE_COLORS = [
  "#D97757",
  "#F4B942",
  "#7C3AED",
  "#22C55E",
  "#0EA5E9",
  "#F472B6",
];

export default function ColorPaletteExtractorPage() {
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  );
  const [colors, setColors] = useState(SAMPLE_COLORS);

  const palette = useMemo(
    () => colors.map((color) => ({ color, label: color.toUpperCase() })),
    [colors],
  );

  const generatePalette = () => {
    const cycle = [...SAMPLE_COLORS, ...SAMPLE_COLORS].slice(0, 6);
    const shuffled = cycle.sort(() => Math.random() - 0.5);
    setColors(shuffled.slice(0, 6));
  };

  const copyColor = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${value} copied.`);
    } catch {
      toast.error("Clipboard access is unavailable.");
    }
  };

  return (
    <div className="mx-auto min-h-full max-w-7xl space-y-8 p-6 text-[var(--text-primary)]">
      <header className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          <Palette size={18} />
          Color Palette Extractor
        </div>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              Pull a design palette from any image or brand mood
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
              Pull colors from reference artwork, generate balanced swatches,
              and copy ready-to-use hex values for your design work.
            </p>
          </div>
          <Button variant="primary" onClick={generatePalette} className="w-fit">
            Generate palette
          </Button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Image URL
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-3">
            <Droplets size={18} className="text-[var(--accent)]" />
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/25"
              placeholder="https://example.com/brand-image.jpg"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
            <span>Mood</span>
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Balance</span>
              <strong className="text-white">Warm + vibrant</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Contrast</span>
              <strong className="text-white">High</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Usage</span>
              <strong className="text-white">UI / branding</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
        <div className="mb-4 flex items-center gap-2 text-white">
          <Palette size={18} className="text-[var(--accent)]" />
          <h2 className="text-xl font-semibold">Generated palette</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {palette.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              onClick={() => void copyColor(color)}
              className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-black/10 text-left transition hover:-translate-y-0.5"
            >
              <div className="h-32 w-full" style={{ background: color }} />
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="font-mono text-xs text-white/80">{label}</span>
                <Copy
                  size={13}
                  className="text-white/50 group-hover:text-white"
                />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
