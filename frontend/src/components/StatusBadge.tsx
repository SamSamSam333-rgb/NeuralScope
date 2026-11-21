import { useEffect, useState } from 'react';
import { getHealth, Health } from '../lib/api';

export default function StatusBadge() {
  const [h, setH] = useState<Health | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const poll = () => getHealth().then((x) => alive && setH(x));
    poll();
    const t = setInterval(poll, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  const on = !!h;
  const text = h === undefined ? 'Checking Python…' : h
    ? `Python online · PyTorch ${h.torch.split('+')[0]} · ${h.cuda ? h.gpu ?? 'GPU' : 'CPU'}`
    : 'Python offline · browser labs still work';
  return (
    <div className="badge" role="status" title={on ? 'The Python server is running: real PyTorch, scikit-learn and YOLO are available.' : 'Start the backend (run-backend.bat) to enable the Python features.'}
      style={{ color: on ? 'var(--green, #3ddc97)' : 'var(--muted)' }}>
      {text}
    </div>
  );
}
