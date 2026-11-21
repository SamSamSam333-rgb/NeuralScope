import { useEffect, useRef, useState } from 'react';
import { detect, DetectResult, getHealth, getModels, ModelInfo } from '../lib/api';

const COLORS = ['#22e4ff', '#ff5fd2', '#ffb224', '#7cff6b', '#a78bfa', '#ff7a59'];

function Detector() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [model, setModel] = useState('yolov8n');
  const [models, setModels] = useState<ModelInfo[]>([]);
  useEffect(() => { getModels().then(setModels); }, []);
  const [conf, setConf] = useState(0.25);
  const [iou, setIou] = useState(0.7);
  const [res, setRes] = useState<DetectResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const cv = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement | null>(null);
  const [shown, setShown] = useState(0); // minimum confidence the viewer wants to see (filters locally, no re-run)

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u); setRes(null); setErr('');
    return () => URL.revokeObjectURL(u);
  }, [file]);

  useEffect(() => {
    const c = cv.current; if (!c || !url) return;
    const im = new Image();
    im.onload = () => { img.current = im; draw(); };
    im.src = url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, res, shown]);

  function draw() {
    const c = cv.current, im = img.current; if (!c || !im) return;
    const W = Math.min(900, im.naturalWidth), s = W / im.naturalWidth;
    c.width = W; c.height = Math.round(im.naturalHeight * s);
    const g = c.getContext('2d')!;
    g.drawImage(im, 0, 0, c.width, c.height);
    if (!res) return;
    g.font = '600 13px "JetBrains Mono", monospace'; g.lineWidth = 2;
    res.detections.filter((d) => d.conf >= shown).forEach((d) => {
      const col = COLORS[d.cls % COLORS.length];
      const [x1, y1, x2, y2] = d.box.map((v) => v * s);
      g.strokeStyle = col; g.strokeRect(x1, y1, x2 - x1, y2 - y1);
      const t = `${d.name} ${(d.conf * 100).toFixed(0)}%`, w = g.measureText(t).width + 8;
      g.fillStyle = col; g.fillRect(x1, Math.max(0, y1 - 18), w, 18);
      g.fillStyle = '#04101a'; g.fillText(t, x1 + 4, Math.max(13, y1 - 5));
    });
  }

  async function run() {
    if (!file) return;
    setBusy(true); setErr('');
    try { setRes(await detect(file, model, conf, iou)); }
    catch (e) { setErr((e as Error).message); setRes(null); }
    finally { setBusy(false); }
  }

  const visible = res ? res.detections.filter((d) => d.conf >= shown) : [];
  return (
    <div className="grid g2">
      <div className="card">
        <div className="lbl">Real YOLO detection (Ultralytics, running on the Python server)</div>
        <p className="small muted">Choose any photo. The server runs a real YOLOv8 model on it and sends back every box it found. Nothing here is drawn by hand.</p>
        <div className="row" style={{ margin: '8px 0' }}>
          <input type="file" accept="image/*" aria-label="Choose an image" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap', margin: '8px 0' }}>
          <label className="small">Model{' '}
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {(models.length ? models : [{ id: 'yolov8n', label: 'YOLOv8 nano: 80 everyday objects (fastest)', classes: 80 }]).map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="small">Confidence cutoff {conf.toFixed(2)}{' '}
            <input type="range" min={0.05} max={0.9} step={0.05} value={conf} onChange={(e) => setConf(+e.target.value)} />
          </label>
          <label className="small">Overlap limit (IoU) {iou.toFixed(2)}{' '}
            <input type="range" min={0.1} max={0.95} step={0.05} value={iou} onChange={(e) => setIou(+e.target.value)} />
          </label>
        </div>
        <details className="small muted" style={{ marginBottom: 8 }}>
          <summary>What do these three settings do?</summary>
          <p><b>Model:</b> a model can only name the things it was trained on. The 80-object models know everyday items (person, car, dog, chair). The Open Images models know about 600 types, including many animals, fruits, instruments and clothes. Letters and digits need their own model, which you train once with train-letters.bat. Bigger models make fewer mistakes but take longer. The first time you use one, the server downloads its weights.</p>
          <p><b>Confidence cutoff:</b> the model gives every box a score from 0 to 1. Boxes scoring below the cutoff are thrown away before you see them. Raise it to remove doubtful boxes, lower it to catch more objects (and more false alarms). Try 0.25, then 0.6.</p>
          <p><b>Overlap limit (IoU):</b> several boxes often land on the same object. When two boxes overlap more than this limit, only the higher-scoring one is kept. Lower it to remove more duplicates; set it too low and two real objects standing close together may be merged.</p>
        </details>
        <button className="btn primary" type="button" disabled={!file || busy} onClick={run}>{busy ? 'Detecting…' : 'Detect objects'}</button>
        {err && <p role="alert" className="small" style={{ color: '#ff8a8a' }}>{err}</p>}
        {res && (
          <div style={{ marginTop: 12 }}>
            <p className="small">Found <b>{res.detections.length}</b> box{res.detections.length === 1 ? '' : 'es'} with {res.model} on {res.device} in {res.ms.toFixed(0)} ms (image {res.width}×{res.height}).</p>
            <label className="small">Only show boxes scoring at least {Math.round(shown * 100)}%{' '}
              <input type="range" min={0} max={0.95} step={0.05} value={shown} onChange={(e) => setShown(+e.target.value)} />
            </label>
            <table className="small" style={{ width: '100%', marginTop: 8 }}>
              <thead><tr><th align="left">Object</th><th align="left">Score</th><th align="left">Box (x1, y1, x2, y2)</th></tr></thead>
              <tbody>{visible.map((d, i) => (
                <tr key={i}><td>{d.name}</td><td>{(d.conf * 100).toFixed(1)}%</td><td>{d.box.map((v) => Math.round(v)).join(', ')}</td></tr>
              ))}</tbody>
            </table>
            {visible.length === 0 && <p className="small muted">No boxes at this score. Lower the confidence cutoff and run again.</p>}
          </div>
        )}
      </div>
      <div className="card">
        <div className="lbl">Result</div>
        {url ? <canvas ref={cv} className="cv" style={{ width: '100%', height: 'auto' }} aria-label="Image with detection boxes" />
          : <p className="small muted">Choose an image to see it here.</p>}
      </div>
    </div>
  );
}

export default function VisionView() {
  const [tab, setTab] = useState<'yolo' | 'lab'>('yolo');
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => { getHealth().then((h) => setOnline(!!h && !!h.ultralytics)); }, []);
  return (
    <>
      <h1>Computer Vision Lab</h1>
      <p className="muted">Two parts: a real YOLO detector that runs on the Python server, and a hand-built lab that shows what happens inside a detector step by step.</p>
      <div className="row" style={{ margin: '10px 0' }} role="group" aria-label="Vision lab part">
        <button type="button" className="btn" aria-pressed={tab === 'yolo'} onClick={() => setTab('yolo')}>Real YOLO (Python)</button>
        <button type="button" className="btn" aria-pressed={tab === 'lab'} onClick={() => setTab('lab')}>Concept lab (drawn sample)</button>
      </div>
      {tab === 'yolo' ? (
        <>
          {online === false && <div className="card"><p className="small">The Python server is not running, or Ultralytics is not installed. Start it with <b>run-backend.bat</b> and reload this page.</p></div>}
          <Detector />
        </>
      ) : (
        <>
          <p className="small muted">This part works on a drawn sample scene, not a photo. It is a teaching model: every step is computed, but the boxes come from a simplified detector, not a trained network.</p>
          <iframe title="Concept vision lab" src="/legacy/lab/index.html" style={{ width: '100%', height: '1500px', border: '1px solid var(--line)', borderRadius: 8, background: '#060c15' }} />
        </>
      )}
    </>
  );
}
