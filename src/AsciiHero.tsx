import React from "react";
import { afterPageIdle } from "@/lib/idle";
import {
  MONOGRAM_HEIGHT,
  pose,
  sampleMonogram,
  type Tone,
} from "@/lib/monogram";

const RAMP = ".,:-=+*#%@";
const FIELD_RAMP = ".:-=+*";
const DECODE = "!<>-_\\/[]{}=+*^?#%&";
const FRAME_MS = 1000 / 30;
const INTRO_MS = 1400;
const SPIN_MS = 1700;
const TAU = Math.PI * 2;

type Rgb = readonly [number, number, number];

function gradient(stops: readonly Rgb[], steps: number): string[] {
  return Array.from({ length: steps }, (_, i) => {
    const t = (i / (steps - 1)) * (stops.length - 1);
    const from = stops[Math.floor(t)];
    const to = stops[Math.min(stops.length - 1, Math.floor(t) + 1)];
    const mix = t - Math.floor(t);
    const [r, g, b] = from.map((c, k) => Math.round(c + (to[k] - c) * mix));
    return `rgb(${r} ${g} ${b})`;
  });
}

const TONES: Record<Tone, string[]> = {
  ink: gradient(
    [
      [58, 58, 58],
      [170, 170, 170],
      [255, 255, 255],
    ],
    RAMP.length,
  ),
  accent: gradient(
    [
      [12, 70, 53],
      [53, 213, 164],
      [205, 255, 238],
    ],
    RAMP.length,
  ),
};
const FIELD_GRAY = gradient(
  [
    [24, 24, 24],
    [62, 62, 62],
  ],
  FIELD_RAMP.length,
);
const FIELD_MINT = gradient(
  [
    [18, 62, 48],
    [46, 168, 130],
  ],
  FIELD_RAMP.length,
);
const DECODE_COLOR = "rgb(53 213 164 / 0.6)";
const COLORS = [
  ...TONES.ink,
  ...TONES.accent,
  ...FIELD_GRAY,
  ...FIELD_MINT,
  DECODE_COLOR,
];

function hash(x: number, y: number, z = 0): number {
  let h =
    Math.imul(x, 374761393) ^
    Math.imul(y, 668265263) ^
    Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const fade = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function noiseLayer(xi: number, yi: number, zi: number, u: number, v: number) {
  return lerp(
    lerp(hash(xi, yi, zi), hash(xi + 1, yi, zi), u),
    lerp(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u),
    v,
  );
}

function noise(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = fade(x - xi);
  const v = fade(y - yi);
  return lerp(
    noiseLayer(xi, yi, zi, u, v),
    noiseLayer(xi, yi, zi + 1, u, v),
    fade(z - zi),
  );
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/**
 * A full-bleed ASCII canvas for the hero. The monogram is drawn centred on the
 * art slot, so the hero's grid decides where it sits and how large it is.
 */
export default function AsciiHero({
  avoidRef,
}: {
  avoidRef: React.RefObject<HTMLElement | null>;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const slotRef = React.useRef<HTMLButtonElement>(null);
  const spinStart = React.useRef<number | null>(null);
  const [still, setStill] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const slot = slotRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !slot || !ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setStill(reduced);

    let start = 0;
    let started = false;

    let width = 0;
    let height = 0;
    let cellW = 8;
    let cellH = 13;
    let cols = 0;
    let rows = 0;
    let art = { x: 0, y: 0, size: 0 };
    let avoid = { left: 0, top: 0, right: 0, bottom: 0 };
    let client: { x: number; y: number } | null = null;
    let yaw = reduced ? -0.42 : 0;
    let pitch = -0.12;
    let lastDraw = start;
    let lastFrame = 0;
    let frame = 0;
    let raf = 0;
    let visible = true;

    const buckets = COLORS.map(() => ({
      chars: [] as string[],
      xs: [] as number[],
      ys: [] as number[],
    }));
    const push = (color: number, char: string, x: number, y: number) => {
      const bucket = buckets[color];
      bucket.chars.push(char);
      bucket.xs.push(x);
      bucket.ys.push(y);
    };

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      art = {
        x: slotRect.left + slotRect.width / 2 - rect.left,
        y: slotRect.top + slotRect.height / 2 - rect.top,
        size: slotRect.height,
      };
      const avoidRect = avoidRef.current?.getBoundingClientRect();
      avoid = avoidRect
        ? {
            left: avoidRect.left - rect.left,
            top: avoidRect.top - rect.top,
            right: avoidRect.right - rect.left,
            bottom: avoidRect.bottom - rect.top,
          }
        : { left: 0, top: 0, right: 0, bottom: 0 };
      const fontSize = clamp(Math.round(art.size / 46), 6, 10);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${fontSize}px "Geist Mono Variable", ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      cellW = ctx.measureText("M").width;
      cellH = Math.round(fontSize * 1.2);
      cols = Math.ceil(width / cellW);
      rows = Math.ceil(height / cellH);
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min(0.1, (now - lastDraw) / 1000);
      const bounds = canvas.getBoundingClientRect();
      const pointer = client && {
        x: client.x - bounds.left,
        y: client.y - bounds.top,
      };
      lastDraw = now;
      frame++;

      let targetYaw = -0.42;
      let targetPitch = -0.12;
      if (!reduced) {
        targetYaw = Math.sin(t * 0.5) * 0.38;
        targetPitch = Math.sin(t * 0.37) * 0.1 - 0.06;
        if (pointer) {
          targetYaw += clamp((pointer.x - art.x) / (width / 2), -1, 1) * 0.55;
          targetPitch +=
            clamp((pointer.y - art.y) / (height / 2), -1, 1) * 0.35;
        }
        const ease = 1 - Math.exp(-dt * 4);
        yaw += (targetYaw - yaw) * ease;
        pitch += (targetPitch - pitch) * ease;
      }

      let spin = 0;
      if (spinStart.current !== null && now >= spinStart.current) {
        const progress = (now - spinStart.current) / SPIN_MS;
        if (progress >= 1) spinStart.current = null;
        else spin = easeInOutCubic(progress) * TAU;
      }
      const rotation = pose(
        yaw + spin,
        pitch,
        reduced ? 0 : Math.sin(t * 0.29) * 0.04,
      );

      const intro = reduced ? 1 : clamp((now - start) / INTRO_MS, 0, 1);
      const scale = art.size / (MONOGRAM_HEIGHT + 3);
      const reach = 17 * scale;
      const spot = 110;

      for (const bucket of buckets) {
        bucket.chars.length = 0;
        bucket.xs.length = 0;
        bucket.ys.length = 0;
      }

      let char = "";
      const cellColor = (col: number, row: number, y: number): number => {
        const x = col * cellW + cellW / 2;
        const dx = x - art.x;
        const dy = y - art.y;
        const distance = Math.hypot(dx, dy);
        let color = -1;

        if (Math.abs(dx) < reach && Math.abs(dy) < reach) {
          const sample = sampleMonogram(dx / scale, -dy / scale, rotation);
          if (sample) {
            const level = Math.round(sample.light * (RAMP.length - 1));
            char = RAMP[level];
            color = (sample.tone === "ink" ? 0 : RAMP.length) + level;
          }
        }

        if (color < 0) {
          const clear = smoothstep(
            12,
            72,
            Math.hypot(
              Math.max(avoid.left - x, 0, x - avoid.right),
              Math.max(avoid.top - y, 0, y - avoid.bottom),
            ),
          );
          const halo =
            clear *
            smoothstep(art.size * 0.34, art.size * 0.55, distance) *
            (1 - smoothstep(art.size * 0.62, art.size * 0.98, distance));
          const lit = pointer
            ? clear *
              Math.exp(
                -((x - pointer.x) ** 2 + (y - pointer.y) ** 2) /
                  (2 * spot * spot),
              )
            : 0;
          if (halo === 0 && lit < 0.05) return -1;
          const n = noise(col * 0.07 + t * 0.1, row * 0.14, t * 0.2);
          const value = n * n * halo * 1.1 + lit * n * 0.8;
          if (value < 0.2) return -1;
          const level = Math.min(
            FIELD_RAMP.length - 1,
            Math.floor(value * FIELD_RAMP.length),
          );
          char = FIELD_RAMP[level];
          color =
            RAMP.length * 2 + (lit > 0.45 ? FIELD_RAMP.length : 0) + level;
        }

        if (intro < 1) {
          const reveal =
            hash(col, row) * 0.55 + (distance / Math.max(width, 1)) * 0.45;
          if (reveal > intro) {
            char =
              DECODE[Math.floor(hash(col, row, frame >> 1) * DECODE.length)];
            color = COLORS.length - 1;
          }
        }
        return color;
      };

      // Geist Mono has a fixed advance, so a run of same-coloured cells can be
      // drawn as one string instead of one fillText call per character.
      for (let row = 0; row < rows; row++) {
        const y = row * cellH + cellH / 2;
        let runColor = -1;
        let runStart = 0;
        let run = "";
        for (let col = 0; col <= cols; col++) {
          const color = col < cols ? cellColor(col, row, y) : -1;
          if (color !== runColor) {
            if (runColor >= 0) push(runColor, run, runStart * cellW, y);
            runColor = color;
            runStart = col;
            run = "";
          }
          if (color >= 0) run += char;
        }
      }

      ctx.clearRect(0, 0, width, height);
      buckets.forEach((bucket, color) => {
        if (bucket.chars.length === 0) return;
        ctx.fillStyle = COLORS[color];
        for (let i = 0; i < bucket.chars.length; i++) {
          ctx.fillText(bucket.chars[i], bucket.xs[i], bucket.ys[i]);
        }
      });
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      if (now - lastFrame >= FRAME_MS - 2) {
        lastFrame = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };

    const play = () => {
      if (!started) return;
      if (reduced) draw(performance.now());
      else if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    const resize = new ResizeObserver(() => {
      measure();
      play();
    });
    resize.observe(canvas);
    resize.observe(slot);
    if (avoidRef.current) resize.observe(avoidRef.current);

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      play();
    });
    intersection.observe(canvas);

    const onPointerMove = (event: PointerEvent) => {
      client = { x: event.clientX, y: event.clientY };
    };
    const onPointerLeave = () => {
      client = null;
    };
    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
    }

    let disposed = false;
    let cancelIdle = () => {};
    const begin = () => {
      if (disposed) return;
      start = performance.now();
      lastDraw = start;
      started = true;
      if (!reduced) spinStart.current = start + INTRO_MS + 300;
      measure();
      play();
    };
    document.fonts.ready.then(() => {
      if (!disposed) cancelIdle = afterPageIdle(begin);
    });

    return () => {
      disposed = true;
      cancelIdle();
      cancelAnimationFrame(raf);
      resize.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerLeave,
      );
    };
  }, [avoidRef]);

  return (
    <>
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
      <button
        ref={slotRef}
        type="button"
        className="hero-art"
        aria-label="Spin the IuCC logo"
        disabled={still}
        onClick={() => {
          if (spinStart.current === null) spinStart.current = performance.now();
        }}
      />
    </>
  );
}
