/**
 * Optics for a slab of glass with a rounded, convex rim, seen from straight
 * above. The rim's height profile gives a surface normal at every distance
 * from the edge; Snell's law turns that normal into how far the background
 * appears shifted, and the same normal lights the rim.
 */

export type GlassShape = {
  width: number;
  height: number;
  radius: number;
};

export type GlassOptics = {
  /** Width of the curved rim, in CSS pixels. */
  bezel: number;
  /** Height of the glass where the rim levels off, in CSS pixels. */
  thickness: number;
  /** Index of refraction for each colour channel; blue bends the most. */
  ior: { red: number; green: number; blue: number };
};

export type GlassPixels = Uint8ClampedArray<ArrayBuffer>;

export type GlassMaps = {
  width: number;
  height: number;
  /** feDisplacementMap input: red and green hold the x and y offset. */
  displacement: GlassPixels;
  /** feDisplacementMap scale per colour channel, in CSS pixels. */
  scale: { red: number; green: number; blue: number };
  /** White, with alpha holding the light caught by the rim. */
  light: GlassPixels;
  /** Alpha holding how reflective each point is, for masking moving light. */
  rim: GlassPixels;
};

const SAMPLES = 256;
const KEY_LIGHT = normalize2(-0.8, -0.6);

type RimProfile = {
  /** How far inward the background shifts, in CSS pixels. */
  offset: Float32Array;
  /** Outward and upward components of the surface normal. */
  tilt: Float32Array;
  facing: Float32Array;
};

function normalize2(x: number, y: number): [number, number] {
  const length = Math.hypot(x, y);
  return [x / length, y / length];
}

/** A squircle bezel: steep at the edge, flattening smoothly into the top. */
function rimProfile({ bezel, thickness }: GlassOptics, ior: number): RimProfile {
  const eta = 1 / ior;
  const offset = new Float32Array(SAMPLES + 1);
  const tilt = new Float32Array(SAMPLES + 1);
  const facing = new Float32Array(SAMPLES + 1);

  for (let i = 0; i <= SAMPLES; i++) {
    const t = Math.max(i / SAMPLES, 1e-4);
    const rise = 1 - (1 - t) ** 4;
    const height = thickness * rise ** 0.25;
    const slope = (thickness / bezel) * (1 - t) ** 3 * rise ** -0.75;
    const length = Math.hypot(slope, 1);
    const nu = slope / length;
    const nz = 1 / length;

    // A ray falling straight down bends toward the inward normal on entry and
    // travels through the glass to the background beneath it.
    const cosT = Math.sqrt(1 - eta * eta * (1 - nz * nz));
    const k = eta * nz - cosT;
    const inward = (k * nu) / (-eta + k * nz);

    offset[i] = height * inward;
    tilt[i] = nu;
    facing[i] = nz;
  }
  return { offset, tilt, facing };
}

function sample(table: Float32Array, t: number): number {
  const position = t * SAMPLES;
  const index = Math.min(Math.floor(position), SAMPLES - 1);
  const fraction = position - index;
  return table[index] + (table[index + 1] - table[index]) * fraction;
}

export function renderGlassMaps(
  shape: GlassShape,
  optics: GlassOptics,
  pixelRatio: number,
): GlassMaps {
  const width = Math.max(1, Math.round(shape.width * pixelRatio));
  const height = Math.max(1, Math.round(shape.height * pixelRatio));
  const displacement = new Uint8ClampedArray(width * height * 4);
  const light = new Uint8ClampedArray(width * height * 4);
  const rim = new Uint8ClampedArray(width * height * 4);

  const red = rimProfile(optics, optics.ior.red);
  const reach = Math.max(...red.offset);
  // Every channel shares one map; each channel's scale stretches it to that
  // channel's refraction, which splits colours apart toward the edge.
  const scaleFor = (ior: number) =>
    2 * Math.max(...rimProfile(optics, ior).offset);

  const halfWidth = shape.width / 2;
  const halfHeight = shape.height / 2;
  const radius = Math.min(shape.radius, halfWidth, halfHeight);
  const bezel = Math.min(optics.bezel, halfHeight);

  for (let py = 0; py < height; py++) {
    const y = (py + 0.5) / pixelRatio - halfHeight;
    const qy = Math.abs(y) - halfHeight + radius;
    const sy = y < 0 ? -1 : 1;

    for (let px = 0; px < width; px++) {
      const x = (px + 0.5) / pixelRatio - halfWidth;
      const qx = Math.abs(x) - halfWidth + radius;
      const sx = x < 0 ? -1 : 1;

      // Signed distance to the rounded rectangle and its outward normal.
      let distance: number;
      let nx: number;
      let ny: number;
      if (qx > 0 && qy > 0) {
        const corner = Math.hypot(qx, qy);
        distance = corner - radius;
        nx = (qx / corner) * sx;
        ny = (qy / corner) * sy;
      } else if (qx > qy) {
        distance = qx - radius;
        nx = sx;
        ny = 0;
      } else {
        distance = qy - radius;
        nx = 0;
        ny = sy;
      }

      const i = (py * width + px) * 4;
      const depth = -distance;
      displacement[i] = 128;
      displacement[i + 1] = 128;
      displacement[i + 3] = 255;
      light[i] = light[i + 1] = light[i + 2] = 255;
      rim[i] = rim[i + 1] = rim[i + 2] = 255;
      if (depth <= -1 / pixelRatio || depth >= bezel) continue;

      const t = Math.max(depth, 0) / bezel;
      const offset = sample(red.offset, t) / reach;
      displacement[i] = 128 - nx * offset * 127;
      displacement[i + 1] = 128 - ny * offset * 127;

      const tilt = sample(red.tilt, t);
      const facing = sample(red.facing, t);
      const coverage = Math.min(Math.max(depth * pixelRatio + 0.5, 0), 1);
      const toward = nx * KEY_LIGHT[0] + ny * KEY_LIGHT[1];
      const key = Math.max(toward, 0) ** 3;
      const bounce = Math.max(-toward, 0) ** 3;

      // A hairline where the glass turns edge-on, then a broad sheen across
      // the curve that faces the light.
      const edge = Math.exp(-Math.max(depth, 0) * 1.4);
      const sheen = tilt * (1 - facing) ** 0.5 * (1 - t);
      const caught =
        edge * (0.16 + 0.84 * key + 0.5 * bounce) +
        sheen * (0.22 * key + 0.1 * bounce + 0.03);
      light[i + 3] = Math.min(caught, 1) * coverage * 255;
      rim[i + 3] = Math.min(edge + sheen * 0.6, 1) * coverage * 255;
    }
  }

  return {
    width,
    height,
    displacement,
    scale: {
      red: 2 * reach,
      green: scaleFor(optics.ior.green),
      blue: scaleFor(optics.ior.blue),
    },
    light,
    rim,
  };
}
