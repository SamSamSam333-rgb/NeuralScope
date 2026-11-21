// Loads the NeuralScope lab modules (plain scripts that share one global `NS`) in the order they depend on each other.
const BASE = '/legacy/';
const SCRIPTS = [
  'nn', 'data', 'ml', 'app', 'api', 'help', 'help_explorer', 'help_trainer', 'help_playground',
  'trainer', 'playground', 'explorer', 'acad_data0', 'acad_d1', 'acad_d2', 'acad_d3', 'acad_d4', 'acad_d5',
  'acad_new', 'acad_L1', 'acad_L2', 'acad_L3', 'acad_L4', 'acad_L5', 'acad_viz1', 'acad_viz2',
  'acad_ui1', 'acad_ui2', 'academy', 'dash',
];
const STYLES = ['style.css', 'help.css'];

export type ModuleId = 'dashboard' | 'academy' | 'explorer' | 'trainer' | 'playground' | 'vision' | 'quiz' | 'next';
export const NAV: { id: ModuleId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' }, { id: 'academy', label: 'Academy' }, { id: 'explorer', label: '3D Explorer' },
  { id: 'trainer', label: 'Training Lab' }, { id: 'playground', label: 'ML Playground' }, { id: 'vision', label: 'Vision Lab' },
  { id: 'quiz', label: 'Quizzes & Progress' }, { id: 'next', label: 'Coming next' },
];
// Modules whose page is written by the legacy scripts (the Vision Lab page is a React component).
export const LEGACY_IDS: ModuleId[] = ['dashboard', 'academy', 'explorer', 'trainer', 'playground', 'quiz', 'next'];
const HELP_LABS: Partial<Record<ModuleId, string>> = { explorer: 'ex', trainer: 'tr', playground: 'pg' };

type NSMod = { init?: (root: HTMLElement) => void; show?: () => void };
interface NSGlobal { mods: Record<string, NSMod>; $: (s: string) => HTMLElement | null; esc: (s: string) => string }
declare global {
  interface Window { NS: NSGlobal; NSH: { mount: (root: HTMLElement, lab: string) => void }; THREE: unknown }
}

function addScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = () => res();
    s.onerror = () => rej(new Error('Could not load ' + src));
    document.head.appendChild(s);
  });
}
function addStyle(href: string) {
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
}

let loading: Promise<void> | null = null;
export function loadLegacy(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      STYLES.forEach((s) => addStyle(BASE + s));
      await addScript('/vendor/three.min.js');
      for (const n of SCRIPTS) await addScript(`${BASE}${n}.js`);
    })();
  }
  return loading;
}

const started = new Set<ModuleId>();
/** Start a module once (builds its page inside the section), then call show() each time it becomes visible. */
export function activate(id: ModuleId) {
  const mod = window.NS.mods[id];
  const root = document.getElementById('v-' + id);
  if (!mod || !root) return;
  if (!started.has(id)) {
    started.add(id);
    try {
      mod.init?.(root);
      const lab = HELP_LABS[id];
      if (lab) window.NSH.mount(root, lab);
    } catch (err) {
      root.innerHTML = '<div class="card">This module failed to start: ' + window.NS.esc((err as Error).message) + '</div>';
    }
  }
  try { mod.show?.(); } catch { /* a module's show() must never break navigation */ }
}
