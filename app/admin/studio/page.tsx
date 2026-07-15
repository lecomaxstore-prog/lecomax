"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────
type Filters = {
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  blur: number;
  sepia: number;
  grayscale: number;
};

const DEF_FILTERS: Filters = {
  brightness: 1, contrast: 1, saturation: 1,
  hueRotate: 0, blur: 0, sepia: 0, grayscale: 0,
};

type TextLayer = {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  shadow: boolean;
  align: "left" | "center" | "right";
};

// ─── Filter Presets ──────────────────────────────────────────
const PRESETS: { name: string; filters: Partial<Filters> }[] = [
  { name: "Original",    filters: {} },
  { name: "Vivid",       filters: { brightness: 1.1, contrast: 1.3, saturation: 1.7 } },
  { name: "N & B",       filters: { saturation: 0, contrast: 1.25, grayscale: 1 } },
  { name: "Vintage",     filters: { brightness: 1.05, contrast: 0.85, saturation: 0.65, sepia: 0.45, hueRotate: 12 } },
  { name: "Chaud",       filters: { brightness: 1.08, contrast: 1.1, saturation: 1.35, hueRotate: 22, sepia: 0.18 } },
  { name: "Froid",       filters: { brightness: 1.02, saturation: 1.25, hueRotate: 195 } },
  { name: "Doux",        filters: { brightness: 1.22, contrast: 0.78, saturation: 0.55, sepia: 0.12 } },
  { name: "Dramatique",  filters: { brightness: 0.88, contrast: 1.65, saturation: 1.15 } },
  { name: "Soleil",      filters: { brightness: 1.18, contrast: 1.08, saturation: 1.45, hueRotate: 348 } },
];

function buildCssFilter(f: Filters): string {
  return `brightness(${f.brightness}) contrast(${f.contrast}) saturate(${f.saturation}) hue-rotate(${f.hueRotate}deg) blur(${f.blur}px) sepia(${f.sepia}) grayscale(${f.grayscale})`;
}

let _layerId = 0;
const uid = () => `l${++_layerId}_${Date.now()}`;

// ─── Reusable Slider ─────────────────────────────────────────
function Slider({
  label, value, min, max, step, unit = "",
  onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-neutral-600">{label}</span>
        <span className="text-xs text-neutral-400 font-mono tabular-nums">
          {step < 1 ? value.toFixed(2) : Math.round(value)}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 appearance-none bg-neutral-200 rounded-full cursor-pointer accent-black"
      />
    </div>
  );
}

// ─── Photo Editor ─────────────────────────────────────────────
function PhotoEditor() {
  const [src, setSrc] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ ...DEF_FILTERS });
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState("Original");
  const [tool, setTool] = useState<"select" | "text">("select");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedLayer = layers.find(l => l.id === selectedId) ?? null;

  function loadFile(file: File) {
    if (!file.type.startsWith("image/")) { setMsg({ type: "err", text: "Choisissez une image valide." }); return; }
    if (file.size > 20 * 1024 * 1024) { setMsg({ type: "err", text: "L’image dépasse la limite de 20 Mo." }); return; }
    const reader = new FileReader();
    reader.onload = e => { setSrc(e.target?.result as string); setMsg(null); };
    reader.readAsDataURL(file);
  }

  function reset() {
    setSrc(null); setLayers([]); setFilters({ ...DEF_FILTERS });
    setRotation(0); setFlipH(false); setFlipV(false);
    setSelectedId(null); setActivePreset("Original"); setMsg(null);
  }

  function setF(k: keyof Filters, v: number) {
    setFilters(f => ({ ...f, [k]: v }));
    setActivePreset("");
  }

  function applyPreset(name: string) {
    setActivePreset(name);
    const preset = PRESETS.find(p => p.name === name);
    setFilters({ ...DEF_FILTERS, ...(preset?.filters ?? {}) });
  }

  function onCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (tool !== "text") { if ((e.target as HTMLElement).closest("[data-layer]") === null) setSelectedId(null); return; }
    const rect = containerRef.current!.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const newLayer: TextLayer = {
      id: uid(), text: "Votre texte", xPct, yPct,
      fontSize: 28, fontFamily: "Inter, sans-serif",
      color: "#ffffff", bold: true, italic: false, shadow: true, align: "center",
    };
    setLayers(ls => [...ls, newLayer]);
    setSelectedId(newLayer.id);
    setTool("select");
  }

  function startDrag(e: React.PointerEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    const container = containerRef.current!;
    const rect = container.getBoundingClientRect();
    const layer = layers.find(l => l.id === id)!;
    const sx = e.clientX, sy = e.clientY;
    const ox = layer.xPct, oy = layer.yPct;

    function onMove(ev: PointerEvent) {
      const dx = ((ev.clientX - sx) / rect.width) * 100;
      const dy = ((ev.clientY - sy) / rect.height) * 100;
      setLayers(ls => ls.map(l => l.id === id ? { ...l, xPct: ox + dx, yPct: oy + dy } : l));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function updateLayer(patch: Partial<TextLayer>) {
    if (!selectedId) return;
    setLayers(ls => ls.map(l => l.id === selectedId ? { ...l, ...patch } : l));
  }

  async function doExport(format: "jpeg" | "png", toLibrary = false) {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    setSaving(true); setMsg(null);
    try {
      const isRot90 = rotation === 90 || rotation === 270;
      const cw = isRot90 ? img.naturalHeight : img.naturalWidth;
      const ch = isRot90 ? img.naturalWidth : img.naturalHeight;

      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext("2d")!;

      // Draw image with filters + transform
      ctx.save();
      ctx.translate(cw / 2, ch / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.filter = buildCssFilter(filters);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();

      // Draw text layers (scale from display coords to natural resolution)
      const cRect = container.getBoundingClientRect();
      const scaleX = cw / cRect.width;
      const scaleY = ch / cRect.height;

      for (const layer of layers) {
        const ax = (layer.xPct / 100) * cw;
        const ay = (layer.yPct / 100) * ch;
        const scaledFs = layer.fontSize * Math.min(scaleX, scaleY);
        ctx.save();
        ctx.font = `${layer.italic ? "italic " : ""}${layer.bold ? "bold " : ""}${scaledFs}px ${layer.fontFamily}`;
        ctx.fillStyle = layer.color;
        ctx.textAlign = layer.align;
        if (layer.shadow) {
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = scaledFs * 0.35;
          ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
        }
        ctx.fillText(layer.text, ax, ay);
        ctx.restore();
      }

      if (toLibrary) {
        const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), `image/${format}`, 0.95));
        const fd = new FormData();
        fd.append("file", blob, `studio-${Date.now()}.${format === "jpeg" ? "jpg" : "png"}`);
        const r = await fetch("/api/upload-media", { method: "POST", body: fd });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Upload échoué");
        setMsg({ type: "ok", text: "✓ Photo sauvegardée dans la Médiathèque" });
      } else {
        const a = document.createElement("a");
        a.href = canvas.toDataURL(`image/${format}`, 0.95);
        a.download = `lecomax-studio.${format === "jpeg" ? "jpg" : "png"}`;
        a.click();
        setMsg({ type: "ok", text: "✓ Téléchargement démarré" });
      }
    } catch (err: unknown) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur inattendue" });
    }
    setSaving(false);
  }

  // Upload screen
  if (!src) {
    return (
      <div className="mx-auto mt-4 max-w-3xl sm:mt-8">
        <div
          className={`relative cursor-pointer overflow-hidden rounded-[28px] border-2 border-dashed bg-white px-5 py-14 text-center shadow-sm transition-all sm:px-12 sm:py-20 ${dragOver ? "scale-[1.01] border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-400 hover:shadow-md"}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
        >
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-lg"><svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></span>
          <p className="mb-2 mt-5 text-lg font-black sm:text-xl">Ajoutez une image à retoucher</p>
          <p className="mb-6 text-sm text-neutral-400">Glissez votre fichier ici ou cliquez pour le sélectionner</p>
          <div className="inline-flex flex-wrap justify-center gap-2">
            {["JPG", "PNG", "WEBP", "HEIC"].map(t => (
              <span key={t} className="text-xs bg-neutral-100 text-neutral-500 px-2 py-1 rounded-lg font-medium">{t}</span>
            ))}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        </div>
        {msg && <div role="alert" className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{msg.text}</div>}
      </div>
    );
  }

  const filterStr = buildCssFilter(filters);

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:h-[calc(100dvh-180px)] lg:min-h-[640px] lg:flex-row">
      {/* ── Left toolbar ── */}
      <div className="flex w-full shrink-0 items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] lg:w-12 lg:flex-col lg:py-2">
        <button title="Sélectionner" onClick={() => setTool("select")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tool === "select" ? "bg-black text-white" : "bg-white border border-neutral-200 hover:border-neutral-400"}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 0L20 10.5 13 12.5 10.5 22z"/></svg>
        </button>
        <button title="Outil texte — cliquez sur l'image pour placer" onClick={() => setTool("text")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all font-black text-sm ${tool === "text" ? "bg-black text-white" : "bg-white border border-neutral-200 hover:border-neutral-400"}`}>
          T
        </button>
        <div className="mx-0.5 h-7 border-l border-neutral-200 lg:h-auto lg:w-7 lg:border-l-0 lg:border-t" />
        <button title="Rotation +90°" onClick={() => setRotation(r => (r + 90) % 360)}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-neutral-200 hover:border-neutral-400 transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        <button title="Rotation -90°" onClick={() => setRotation(r => (r + 270) % 360)}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-neutral-200 hover:border-neutral-400 transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: "scaleX(-1)" }}>
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        <button title="Miroir horizontal" onClick={() => setFlipH(h => !h)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${flipH ? "bg-black text-white" : "bg-white border border-neutral-200 hover:border-neutral-400"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v18M4 7l4 5-4 5M20 7l-4 5 4 5"/>
          </svg>
        </button>
        <button title="Miroir vertical" onClick={() => setFlipV(v => !v)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${flipV ? "bg-black text-white" : "bg-white border border-neutral-200 hover:border-neutral-400"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M7 4l5 4 5-4M7 20l5-4 5 4"/>
          </svg>
        </button>
        <div className="flex-1" />
        <button title="Changer d'image" onClick={reset}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-neutral-200 hover:border-red-300 hover:text-red-400 transition-all">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
        </button>
      </div>

      {/* ── Canvas area ── */}
      <div className="flex min-h-[520px] min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-[#1a1a1a] lg:min-h-0">
        {/* Top action bar */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-neutral-800 bg-neutral-900 px-3 py-2.5 sm:px-4">
          <div className="hidden gap-1.5 sm:flex">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <p className="hidden flex-1 truncate text-center text-xs text-neutral-400 md:block">
            {tool === "text" ? "✏️  Cliquez sur l'image pour placer le texte" : "Studio Photo — L'ecomax"}
          </p>
          <div className="flex w-full gap-1.5 md:w-auto">
            <button onClick={() => doExport("jpeg")} disabled={saving}
              className="min-h-10 flex-1 rounded-lg bg-neutral-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-neutral-600 disabled:opacity-40 md:flex-none">
              ↓ JPG
            </button>
            <button onClick={() => doExport("png")} disabled={saving}
              className="min-h-10 flex-1 rounded-lg bg-neutral-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-neutral-600 disabled:opacity-40 md:flex-none">
              ↓ PNG
            </button>
            <button onClick={() => doExport("jpeg", true)} disabled={saving}
              className="min-h-10 flex-[1.4] rounded-lg bg-[#3ecf4c] px-3 text-xs font-black text-black transition-colors hover:bg-[#33b840] disabled:opacity-40 md:flex-none">
              {saving ? "…" : "⊕ Médiathèque"}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 sm:p-6"
          onClick={onCanvasClick}
          style={{ cursor: tool === "text" ? "crosshair" : "default" }}
        >
          <div ref={containerRef} className="relative inline-block select-none">
            <img
              ref={imgRef}
              src={src}
              alt="studio"
              crossOrigin="anonymous"
              onDragStart={e => e.preventDefault()}
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "min(62dvh, 720px)",
                width: "auto",
                height: "auto",
                filter: filterStr,
                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                transformOrigin: "center center",
              }}
            />
            {/* Text layers */}
            {layers.map(layer => (
              <div
                key={layer.id}
                data-layer="1"
                className="absolute pointer-events-auto"
                style={{
                  left: `${layer.xPct}%`,
                  top: `${layer.yPct}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: layer.fontSize,
                  fontFamily: layer.fontFamily,
                  color: layer.color,
                  fontWeight: layer.bold ? "bold" : "normal",
                  fontStyle: layer.italic ? "italic" : "normal",
                  textShadow: layer.shadow ? "2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.4)" : "none",
                  textAlign: layer.align,
                  whiteSpace: "nowrap",
                  cursor: "move",
                  userSelect: "none",
                  touchAction: "none",
                  outline: selectedId === layer.id ? "2px dashed rgba(255,255,255,0.7)" : "none",
                  outlineOffset: "4px",
                  borderRadius: "2px",
                }}
                onPointerDown={e => startDrag(e, layer.id)}
              >
                {layer.text}
              </div>
            ))}
          </div>
        </div>

        {/* Preset strip */}
        <div className="flex-shrink-0 px-4 py-2 bg-neutral-900 border-t border-neutral-800 flex gap-1.5 overflow-x-auto">
          {PRESETS.map(({ name }) => (
            <button key={name} onClick={() => applyPreset(name)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePreset === name
                  ? "bg-white text-black"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="grid w-full shrink-0 gap-3 md:grid-cols-2 lg:flex lg:w-64 lg:flex-col lg:overflow-y-auto">
        {/* Filter adjustments */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Réglages</h3>
          <div className="space-y-3">
            <Slider label="Luminosité"  value={filters.brightness}  min={0.2}  max={2.5}  step={0.05}       onChange={v => setF("brightness", v)} />
            <Slider label="Contraste"   value={filters.contrast}    min={0.2}  max={2.5}  step={0.05}       onChange={v => setF("contrast", v)} />
            <Slider label="Saturation"  value={filters.saturation}  min={0}    max={3}    step={0.05}       onChange={v => setF("saturation", v)} />
            <Slider label="Teinte"      value={filters.hueRotate}   min={0}    max={360}  step={1}  unit="°" onChange={v => setF("hueRotate", v)} />
            <Slider label="Flou"        value={filters.blur}        min={0}    max={15}   step={0.1} unit="px" onChange={v => setF("blur", v)} />
            <Slider label="Sépia"       value={filters.sepia}       min={0}    max={1}    step={0.01}       onChange={v => setF("sepia", v)} />
            <Slider label="N&B"         value={filters.grayscale}   min={0}    max={1}    step={0.01}       onChange={v => setF("grayscale", v)} />
          </div>
        </div>

        {/* Text layer editor — only when a layer is selected */}
        {selectedLayer && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Texte</h3>
              <button
                onClick={() => { setLayers(ls => ls.filter(l => l.id !== selectedId)); setSelectedId(null); }}
                className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors">
                ✕ Supprimer
              </button>
            </div>
            <div className="space-y-2.5">
              <input
                type="text"
                value={selectedLayer.text}
                onChange={e => updateLayer({ text: e.target.value })}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Taille</label>
                  <input
                    type="number" min={8} max={180} value={selectedLayer.fontSize}
                    onChange={e => updateLayer({ fontSize: parseInt(e.target.value) || 28 })}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Couleur</label>
                  <input
                    type="color" value={selectedLayer.color}
                    onChange={e => updateLayer({ color: e.target.value })}
                    className="w-full h-[38px] rounded-xl border border-neutral-200 cursor-pointer bg-white p-1"
                  />
                </div>
              </div>
              <select
                value={selectedLayer.fontFamily}
                onChange={e => updateLayer({ fontFamily: e.target.value })}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
              >
                <option value="Inter, sans-serif">Inter — Moderne</option>
                <option value="Georgia, serif">Georgia — Élégant</option>
                <option value="Arial Black, sans-serif">Arial Black — Impact</option>
                <option value="'Courier New', monospace">Courier — Technique</option>
                <option value="'Times New Roman', serif">Times — Classique</option>
                <option value="Brush Script MT, cursive">Script — Manuscrit</option>
              </select>
              {/* Style toggles */}
              <div className="flex gap-1.5">
                <button onClick={() => updateLayer({ bold: !selectedLayer.bold })}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-black transition-all ${selectedLayer.bold ? "bg-black text-white" : "border border-neutral-200 hover:border-black"}`}>
                  G
                </button>
                <button onClick={() => updateLayer({ italic: !selectedLayer.italic })}
                  className={`flex-1 py-1.5 rounded-lg text-sm italic font-bold transition-all ${selectedLayer.italic ? "bg-black text-white" : "border border-neutral-200 hover:border-black"}`}>
                  I
                </button>
                <button onClick={() => updateLayer({ shadow: !selectedLayer.shadow })}
                  title="Ombre portée"
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedLayer.shadow ? "bg-black text-white" : "border border-neutral-200 hover:border-black"}`}>
                  Ombre
                </button>
              </div>
              {/* Alignment */}
              <div className="flex gap-1.5">
                {(["left", "center", "right"] as const).map(a => (
                  <button key={a} onClick={() => updateLayer({ align: a })}
                    className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${selectedLayer.align === a ? "bg-black text-white" : "border border-neutral-200 hover:border-black"}`}>
                    {a === "left" ? "◀" : a === "center" ? "●" : "▶"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Layers list */}
        {layers.length > 0 && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-4">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Calques texte</h3>
            <div className="space-y-1">
              {[...layers].reverse().map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedId(l.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all truncate ${
                    selectedId === l.id ? "bg-black text-white" : "hover:bg-neutral-50 border border-neutral-100"
                  }`}
                >
                  <span className="font-bold mr-1.5">T</span>{l.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status message */}
        {msg && (
          <div className={`px-3 py-2.5 rounded-xl text-xs font-semibold ${
            msg.type === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Video Editor ─────────────────────────────────────────────
function VideoEditor() {
  const [src, setSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadFile(file: File) {
    if (!file.type.startsWith("video/")) { setMsg({ type: "err", text: "Choisissez une vidéo valide." }); return; }
    if (file.size > 500 * 1024 * 1024) { setMsg({ type: "err", text: "La vidéo dépasse la limite de 500 Mo." }); return; }
    if (src) URL.revokeObjectURL(src);
    fileRef.current = file;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setSrc(url);
    setMsg(null);
  }

  function onLoaded() {
    const v = videoRef.current!;
    setDuration(v.duration);
    setTrimEnd(v.duration);
    setCurrentTime(0);
  }

  function onTimeUpdate() {
    const v = videoRef.current!;
    setCurrentTime(v.currentTime);
    if (v.currentTime >= trimEnd) {
      v.pause();
      v.currentTime = trimStart;
      setPlaying(false);
    }
  }

  function togglePlay() {
    const v = videoRef.current!;
    if (playing) { v.pause(); setPlaying(false); }
    else {
      if (v.currentTime < trimStart || v.currentTime >= trimEnd) v.currentTime = trimStart;
      v.play(); setPlaying(true);
    }
  }

  function seek(t: number) {
    const v = videoRef.current!;
    v.currentTime = Math.max(0, Math.min(duration, t));
    setCurrentTime(v.currentTime);
  }

  function fmt(t: number) {
    if (!isFinite(t) || t < 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  async function saveToLibrary() {
    if (!fileRef.current) return;
    setSaving(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", fileRef.current);
      const r = await fetch("/api/upload-media", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Upload échoué");
      setMsg({ type: "ok", text: "✓ Vidéo sauvegardée dans la Médiathèque" });
    } catch (err: unknown) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur" });
    }
    setSaving(false);
  }

  // Upload screen
  if (!src) {
    return (
      <div className="mx-auto mt-4 max-w-3xl sm:mt-8">
        <div
          className={`relative cursor-pointer overflow-hidden rounded-[28px] border-2 border-dashed bg-white px-5 py-14 text-center shadow-sm transition-all sm:px-12 sm:py-20 ${dragOver ? "scale-[1.01] border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-400 hover:shadow-md"}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
        >
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-lg"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="15" height="14" rx="3"/><path d="m17 10 5-3v10l-5-3z"/></svg></span>
          <p className="mb-2 mt-5 text-lg font-black sm:text-xl">Ajoutez une vidéo à préparer</p>
          <p className="mb-6 text-sm text-neutral-400">Glissez votre fichier ici ou cliquez pour le sélectionner</p>
          <div className="inline-flex flex-wrap justify-center gap-2">
            {["MP4", "MOV", "WEBM"].map(t => (
              <span key={t} className="text-xs bg-neutral-100 text-neutral-500 px-2 py-1 rounded-lg font-medium">{t}</span>
            ))}
          </div>
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        </div>
        {msg && <div role="alert" className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{msg.text}</div>}
      </div>
    );
  }

  const trimDuration = trimEnd - trimStart;
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:h-[calc(100dvh-180px)] lg:min-h-[640px] lg:flex-row">
      {/* Video + controls */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {/* Player */}
        <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-[22px] bg-black sm:min-h-[420px] lg:min-h-0">
          <video
            ref={videoRef}
            src={src}
            muted={muted}
            className="max-h-full max-w-full"
            onLoadedMetadata={onLoaded}
            onTimeUpdate={onTimeUpdate}
            onClick={togglePlay}
            style={{ cursor: "pointer" }}
          />
          {!playing && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
            >
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="black"><polygon points="5,3 19,12 5,21"/></svg>
              </div>
            </div>
          )}
          {/* Corner time display */}
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded-lg backdrop-blur-sm">
            {fmt(currentTime)} / {fmt(duration)}
          </div>
        </div>

        {/* Timeline + controls */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex-shrink-0">
          {/* Timeline */}
          <div
            className="relative h-8 bg-neutral-100 rounded-xl overflow-hidden mb-4 cursor-pointer"
            onClick={e => {
              const r = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - r.left) / r.width) * duration);
            }}
          >
            {/* Trim zone */}
            {duration > 0 && (
              <div
                className="absolute inset-y-0 bg-green-200"
                style={{
                  left: `${(trimStart / duration) * 100}%`,
                  width: `${((trimEnd - trimStart) / duration) * 100}%`,
                }}
              />
            )}
            {/* Outside trim zone — dark overlay */}
            {duration > 0 && (
              <>
                <div className="absolute inset-y-0 left-0 bg-neutral-300/50" style={{ width: `${(trimStart / duration) * 100}%` }} />
                <div className="absolute inset-y-0 right-0 bg-neutral-300/50" style={{ width: `${((duration - trimEnd) / duration) * 100}%` }} />
              </>
            )}
            {/* Trim start handle */}
            {duration > 0 && (
              <div className="absolute inset-y-0 w-1 bg-green-600 rounded-full z-10" style={{ left: `${(trimStart / duration) * 100}%` }} />
            )}
            {/* Trim end handle */}
            {duration > 0 && (
              <div className="absolute inset-y-0 w-1 bg-green-600 rounded-full z-10" style={{ left: `${(trimEnd / duration) * 100}%` }} />
            )}
            {/* Playhead */}
            {duration > 0 && (
              <div className="absolute inset-y-0 w-0.5 bg-black z-20" style={{ left: `${playheadPct}%` }} />
            )}
          </div>

          {/* Trim sliders */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Début du clip
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={0} max={Math.max(0, trimEnd - 0.1)} step={0.1} value={trimStart}
                  onChange={e => { const v = parseFloat(e.target.value); setTrimStart(v); seek(v); }}
                  className="flex-1 accent-green-500"
                />
                <span className="text-xs font-mono text-neutral-500 w-10 text-right">{fmt(trimStart)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Fin du clip
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={Math.min(trimStart + 0.1, duration)} max={duration} step={0.1} value={trimEnd}
                  onChange={e => { const v = parseFloat(e.target.value); setTrimEnd(v); seek(v); }}
                  className="flex-1 accent-green-500"
                />
                <span className="text-xs font-mono text-neutral-500 w-10 text-right">{fmt(trimEnd)}</span>
              </div>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => seek(trimStart)} title="Retour au début" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="19,20 9,12 19,4"/><line x1="5" y1="4" x2="5" y2="20"/>
              </svg>
            </button>
            <button onClick={togglePlay}
              className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors flex-shrink-0">
              {playing
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              }
            </button>
            <button onClick={() => seek(trimEnd - 0.05)} title="Aller à la fin" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5,4 15,12 5,20"/><line x1="19" y1="4" x2="19" y2="20"/>
              </svg>
            </button>
            <button onClick={() => setMuted(m => !m)}
              className={`p-2 rounded-lg transition-colors ${muted ? "bg-red-50 text-red-400" : "hover:bg-neutral-100"}`}>
              {muted
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              }
            </button>
            <div className="flex items-center gap-1.5 flex-1">
              <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; setMuted(v === 0); }}
                className="w-20 accent-black" />
            </div>
            <span className="text-xs text-neutral-400 ml-auto">
              Clip: <strong className="text-neutral-700">{fmt(trimDuration)}</strong>
              <span className="text-neutral-300 mx-1">/</span>
              {fmt(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="grid w-full shrink-0 gap-3 md:grid-cols-2 lg:flex lg:w-64 lg:flex-col">
        {/* File info */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Fichier</h3>
          <p className="text-sm font-semibold truncate" title={fileName}>{fileName}</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Durée totale</span>
              <span className="font-mono font-semibold text-neutral-600">{fmt(duration)}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Durée du clip</span>
              <span className="font-mono font-semibold text-green-600">{fmt(trimDuration)}</span>
            </div>
            {fileRef.current && (
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Taille</span>
                <span className="font-semibold text-neutral-600">
                  {(fileRef.current.size / (1024 * 1024)).toFixed(1)} Mo
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => { setSrc(null); setFileName(""); fileRef.current = null; setPlaying(false); setMsg(null); }}
            className="mt-3 text-xs text-red-400 hover:text-red-600 font-semibold transition-colors">
            ← Changer de vidéo
          </button>
        </div>

        {/* Export */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Exporter</h3>
          <div className="space-y-2">
            <button onClick={saveToLibrary} disabled={saving}
              className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-50 text-sm transition-colors">
              {saving ? "Enregistrement…" : "⊕ Sauvegarder en Médiathèque"}
            </button>
            <a href={src} download={fileName}
              className="w-full border border-neutral-200 text-neutral-700 font-semibold py-3 rounded-xl hover:border-black text-sm transition-colors flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Télécharger l&apos;original
            </a>
          </div>
          <p className="text-xs text-neutral-300 mt-3 leading-relaxed">
            L&apos;encodage du clip découpé (export natif) sera disponible dans une prochaine mise à jour.
          </p>
        </div>

        {/* Status */}
        {msg && (
          <div className={`px-3 py-2.5 rounded-xl text-xs font-semibold ${
            msg.type === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function StudioPage() {
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      {/* Header */}
      <div className="relative mb-5 flex flex-col gap-5 overflow-hidden rounded-[28px] bg-neutral-950 p-5 text-white shadow-xl sm:flex-row sm:items-center sm:p-6">
        <div aria-hidden="true" className="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <button onClick={() => router.back()}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white hover:text-black">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="relative min-w-0 flex-1">
          <p className="mb-1 text-[9px] font-extrabold uppercase tracking-[.18em] text-fuchsia-300">Production visuelle</p>
          <h1 className="text-2xl font-black tracking-tight">Studio Créatif</h1>
          <p className="mt-1 text-xs text-white/45">Retouche photo & préparation vidéo professionnelle</p>
        </div>
        {/* Mode tabs */}
        <div className="relative flex w-full gap-1 rounded-2xl bg-white/10 p-1 sm:ml-auto sm:w-auto">
          <button
            onClick={() => setMode("photo")}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-all sm:flex-none ${mode === "photo" ? "bg-white text-black shadow-sm" : "text-white/50 hover:bg-white/10 hover:text-white"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            Photo
          </button>
          <button
            onClick={() => setMode("video")}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-all sm:flex-none ${mode === "video" ? "bg-white text-black shadow-sm" : "text-white/50 hover:bg-white/10 hover:text-white"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            Vidéo
          </button>
        </div>
      </div>

      {mode === "photo" ? <PhotoEditor /> : <VideoEditor />}
    </div>
  );
}
