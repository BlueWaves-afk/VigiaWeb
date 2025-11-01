// src/lib/yoloPost.ts
export type BBox = { x: number; y: number; w: number; h: number; score: number; cls: number };

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const iou = (a: BBox, b: BBox) => {
  const ax1 = a.x - a.w / 2, ay1 = a.y - a.h / 2;
  const ax2 = a.x + a.w / 2, ay2 = a.y + a.h / 2;
  const bx1 = b.x - b.w / 2, by1 = b.y - b.h / 2;
  const bx2 = b.x + b.w / 2, by2 = b.y + b.h / 2;
  const interX1 = Math.max(ax1, bx1), interY1 = Math.max(ay1, by1);
  const interX2 = Math.min(ax2, bx2), interY2 = Math.min(ay2, by2);
  const inter = Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
  const ua = (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - inter;
  return ua ? inter / ua : 0;
};

// Very generic parser for common YOLOv8 TFLite export that returns Nx(4+1+C):
// [cx, cy, w, h, obj_conf, ...class_logits]
// If your export differs, tweak indices below.
export function parseYoloV8Raw(
  raw: Float32Array | number[],
  numCols: number,
  confThresh = 0.25
): BBox[] {
  const out: BBox[] = [];
  const rows = (raw.length / numCols) | 0;

  for (let i = 0; i < rows; i++) {
    const off = i * numCols;
    const cx = raw[off + 0], cy = raw[off + 1];
    const w  = raw[off + 2], h  = raw[off + 3];
    const obj = sigmoid(raw[off + 4]);
    // class scores start at 5
    let best = 0, bestIdx = 0;
    for (let c = 5; c < numCols; c++) {
      const s = sigmoid(raw[off + c]);
      if (s > best) { best = s; bestIdx = c - 5; }
    }
    const score = obj * best;
    if (score >= confThresh) out.push({ x: cx, y: cy, w, h, score, cls: bestIdx });
  }
  return out;
}

export function nms(boxes: BBox[], iouThresh = 0.45, limit = 50): BBox[] {
  const sorted = boxes.sort((a, b) => b.score - a.score);
  const keep: BBox[] = [];
  for (const b of sorted) {
    if (keep.length >= limit) break;
    let ok = true;
    for (const k of keep) { if (iou(b, k) > iouThresh) { ok = false; break; } }
    if (ok) keep.push(b);
  }
  return keep;
}