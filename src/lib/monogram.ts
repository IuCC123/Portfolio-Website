export type Tone = "ink" | "accent";

type Stroke =
  | {
      kind: "segment";
      ax: number;
      ay: number;
      bx: number;
      by: number;
      tone: Tone;
    }
  | {
      kind: "arc";
      cx: number;
      cy: number;
      radius: number;
      start: number;
      sweep: number;
      tone: Tone;
    };

const STROKE_RADIUS = 1.3;
const HALF_DEPTH = 1.25;
const BEVEL = 0.4;
const C_OPENING = 0.7837;
const ORIGIN_X = 15.85;
const ORIGIN_Y = 15.8;

// Same strokes as public/favicon.svg, in its 32-unit grid, recentred with y up.
const x = (value: number) => value - ORIGIN_X;
const y = (value: number) => ORIGIN_Y - value;

const STROKES: readonly Stroke[] = [
  {
    kind: "segment",
    ax: x(9.7),
    ay: y(6),
    bx: x(9.7),
    by: y(13.75),
    tone: "accent",
  },
  {
    kind: "segment",
    ax: x(15.2),
    ay: y(8.75),
    bx: x(15.2),
    by: y(10.5),
    tone: "ink",
  },
  {
    kind: "arc",
    cx: x(18.45),
    cy: y(10.5),
    radius: 3.25,
    start: -Math.PI,
    sweep: Math.PI,
    tone: "ink",
  },
  {
    kind: "segment",
    ax: x(21.7),
    ay: y(8.75),
    bx: x(21.7),
    by: y(13.75),
    tone: "ink",
  },
  {
    kind: "arc",
    cx: x(11.4),
    cy: y(22.25),
    radius: 3.4,
    start: C_OPENING,
    sweep: Math.PI * 2 - C_OPENING * 2,
    tone: "ink",
  },
  {
    kind: "arc",
    cx: x(21),
    cy: y(22.25),
    radius: 3.4,
    start: C_OPENING,
    sweep: Math.PI * 2 - C_OPENING * 2,
    tone: "ink",
  },
];

/** Glyph height in scene units, tubes included. */
export const MONOGRAM_HEIGHT = 25;
const BOUNDS = 15.8;
const EYE = 90;
const TAU = Math.PI * 2;

function planeDistance(stroke: Stroke, px: number, py: number): number {
  if (stroke.kind === "segment") {
    const abx = stroke.bx - stroke.ax;
    const aby = stroke.by - stroke.ay;
    const apx = px - stroke.ax;
    const apy = py - stroke.ay;
    const t = Math.max(
      0,
      Math.min(1, (apx * abx + apy * aby) / (abx * abx + aby * aby)),
    );
    return Math.hypot(apx - abx * t, apy - aby * t);
  }

  const vx = px - stroke.cx;
  const vy = py - stroke.cy;
  const angle = (((Math.atan2(vy, vx) - stroke.start) % TAU) + TAU) % TAU;
  if (angle <= stroke.sweep)
    return Math.abs(Math.hypot(vx, vy) - stroke.radius);

  const end = stroke.start + stroke.sweep;
  const r = stroke.radius;
  return Math.min(
    Math.hypot(
      vx - Math.cos(stroke.start) * r,
      vy - Math.sin(stroke.start) * r,
    ),
    Math.hypot(vx - Math.cos(end) * r, vy - Math.sin(end) * r),
  );
}

function sceneDistance(px: number, py: number, pz: number): number {
  let plane = Infinity;
  for (const stroke of STROKES)
    plane = Math.min(plane, planeDistance(stroke, px, py));
  // Extrude the rounded 2D strokes along z, then round every edge by BEVEL.
  const wx = plane - (STROKE_RADIUS - BEVEL);
  const wz = Math.abs(pz) - (HALF_DEPTH - BEVEL);
  return (
    Math.min(Math.max(wx, wz), 0) +
    Math.hypot(Math.max(wx, 0), Math.max(wz, 0)) -
    BEVEL
  );
}

function toneAt(px: number, py: number): Tone {
  let nearest = Infinity;
  let tone: Tone = "ink";
  for (const stroke of STROKES) {
    const d = planeDistance(stroke, px, py);
    if (d < nearest) {
      nearest = d;
      tone = stroke.tone;
    }
  }
  return tone;
}

/** Object-to-world rotation, row-major: yaw about y, then pitch about x, then roll about z. */
export type Pose = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export function pose(yaw: number, pitch: number, roll: number): Pose {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  return [
    cy * cr + sy * sp * sr,
    -cy * sr + sy * sp * cr,
    sy * cp,
    cp * sr,
    cp * cr,
    -sp,
    -sy * cr + cy * sp * sr,
    sy * sr + cy * sp * cr,
    cy * cp,
  ];
}

const LIGHT = normalize(-0.45, 0.55, 0.9);

function normalize(
  ax: number,
  ay: number,
  az: number,
): [number, number, number] {
  const length = Math.hypot(ax, ay, az) || 1;
  return [ax / length, ay / length, az / length];
}

export type Sample = { light: number; tone: Tone };

/**
 * Shades the screen-plane point (sx, sy), in scene units with y up, by
 * raymarching the monogram seen from a camera on the +z axis.
 */
export function sampleMonogram(sx: number, sy: number, r: Pose): Sample | null {
  const [dwx, dwy, dwz] = normalize(sx, sy, -EYE);
  // World to object space is the transpose of the pose.
  const ox = r[6] * EYE;
  const oy = r[7] * EYE;
  const oz = r[8] * EYE;
  const dx = r[0] * dwx + r[3] * dwy + r[6] * dwz;
  const dy = r[1] * dwx + r[4] * dwy + r[7] * dwz;
  const dz = r[2] * dwx + r[5] * dwy + r[8] * dwz;

  const b = ox * dx + oy * dy + oz * dz;
  const disc = b * b - (ox * ox + oy * oy + oz * oz - BOUNDS * BOUNDS);
  if (disc < 0) return null;
  const root = Math.sqrt(disc);
  let t = Math.max(0, -b - root);
  let far = -b + root;

  // The letters sit inside the slab |z| <= HALF_DEPTH, a much tighter bound
  // than the sphere for the near-frontal views the hero spends its time in.
  if (Math.abs(dz) > 1e-6) {
    const enter = (-HALF_DEPTH - oz) / dz;
    const exit = (HALF_DEPTH - oz) / dz;
    t = Math.max(t, Math.min(enter, exit));
    far = Math.min(far, Math.max(enter, exit));
  } else if (Math.abs(oz) > HALF_DEPTH) {
    return null;
  }

  for (let step = 0; step < 48 && t < far; step++) {
    const px = ox + dx * t;
    const py = oy + dy * t;
    const pz = oz + dz * t;
    const d = sceneDistance(px, py, pz);
    if (d < 0.02) return shade(px, py, pz, -dx, -dy, -dz, r);
    t += d * 0.9;
  }
  return null;
}

function shade(
  px: number,
  py: number,
  pz: number,
  vx: number,
  vy: number,
  vz: number,
  r: Pose,
): Sample {
  const h = 0.01;
  const a = sceneDistance(px + h, py - h, pz - h);
  const b = sceneDistance(px - h, py - h, pz + h);
  const c = sceneDistance(px - h, py + h, pz - h);
  const d = sceneDistance(px + h, py + h, pz + h);
  const [nx, ny, nz] = normalize(a - b - c + d, -a - b + c + d, -a + b - c + d);

  const lx = r[0] * LIGHT[0] + r[3] * LIGHT[1] + r[6] * LIGHT[2];
  const ly = r[1] * LIGHT[0] + r[4] * LIGHT[1] + r[7] * LIGHT[2];
  const lz = r[2] * LIGHT[0] + r[5] * LIGHT[1] + r[8] * LIGHT[2];

  const diffuse = Math.max(0, nx * lx + ny * ly + nz * lz);
  const [hx, hy, hz] = normalize(lx + vx, ly + vy, lz + vz);
  const specular = Math.max(0, nx * hx + ny * hy + nz * hz) ** 24;
  const rim = (1 - Math.max(0, nx * vx + ny * vy + nz * vz)) ** 3;
  const light = 0.08 + diffuse * 0.62 + specular * 0.7 + rim * 0.35;

  return { light: Math.min(1, light), tone: toneAt(px, py) };
}
