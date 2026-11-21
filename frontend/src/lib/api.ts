export interface Health {
  status: string; torch: string; cuda: boolean; gpu: string | null;
  sklearn: string; ultralytics: string | null; yolo_models: string[];
}
export async function getHealth(): Promise<Health | null> {
  try {
    const r = await fetch('/api/health');
    return r.ok ? ((await r.json()) as Health) : null;
  } catch { return null; }
}

export interface Detection { cls: number; name: string; conf: number; box: [number, number, number, number] }
export interface DetectResult {
  width: number; height: number; detections: Detection[]; ms: number; device: string; model: string; conf: number; iou: number;
}
export async function detect(file: File, model: string, conf: number, iou: number): Promise<DetectResult> {
  const fd = new FormData();
  fd.append('file', file); fd.append('model', model); fd.append('conf', String(conf)); fd.append('iou', String(iou));
  const r = await fetch('/api/yolo/detect', { method: 'POST', body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof j.detail === 'string' ? j.detail : `${r.status} ${r.statusText}`);
  return j as DetectResult;
}

export interface ModelInfo { id: string; label: string; classes: number }
export async function getModels(): Promise<ModelInfo[]> {
  try {
    const r = await fetch('/api/yolo/models');
    return r.ok ? ((await r.json()) as ModelInfo[]) : [];
  } catch { return []; }
}
