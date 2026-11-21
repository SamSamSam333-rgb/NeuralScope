import { useCallback, useEffect, useState } from 'react';
import { activate, LEGACY_IDS, loadLegacy, ModuleId, NAV } from './lib/legacy';
import StatusBadge from './components/StatusBadge';
import VisionView from './components/VisionView';

const IDS = NAV.map((n) => n.id);
const fromHash = (): ModuleId => {
  const h = location.hash.slice(1) as ModuleId;
  return IDS.includes(h) ? h : 'dashboard';
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState<ModuleId>(fromHash);

  const go = useCallback((id: ModuleId) => {
    setPage(id);
    history.replaceState(null, '', '#' + id);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => { loadLegacy().then(() => setReady(true)).catch((e: Error) => setError(e.message)); }, []);

  // The lab modules call NS.go('academy') etc. The legacy router sends those requests here.
  useEffect(() => {
    const on = (e: Event) => { const id = (e as CustomEvent<ModuleId>).detail; if (IDS.includes(id)) go(id); };
    window.addEventListener('ns-go', on);
    return () => window.removeEventListener('ns-go', on);
  }, [go]);

  // Build the page for every legacy module once, so cross-links such as "Learn it in the Academy" always work.
  useEffect(() => {
    if (!ready) return;
    LEGACY_IDS.forEach((id) => { if (id !== page) activate(id); });
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (ready && LEGACY_IDS.includes(page)) activate(page); }, [ready, page]);

  return (
    <>
      <header>
        <div className="brand">NEURALSCOPE</div>
        <StatusBadge />
        <nav aria-label="Modules">
          {NAV.map((n) => (
            <button key={n.id} type="button" data-go={n.id} aria-current={page === n.id ? 'page' : undefined}>{n.label}</button>
          ))}
        </nav>
        <div className="sp" />
      </header>
      <main>
        {error && <div className="card" role="alert">NeuralScope could not load its lab scripts: {error}</div>}
        {!ready && !error && <div className="card">Loading the labs…</div>}
        {LEGACY_IDS.map((id) => <section key={id} id={'v-' + id} className={'view' + (page === id ? ' on' : '')} />)}
        <section id="v-vision" className={'view' + (page === 'vision' ? ' on' : '')}>{page === 'vision' && <VisionView />}</section>
      </main>
    </>
  );
}
