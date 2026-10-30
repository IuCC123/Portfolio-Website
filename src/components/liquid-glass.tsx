import React from "react";
import {
  renderGlassMaps,
  type GlassMaps,
  type GlassOptics,
  type GlassPixels,
} from "@/lib/liquid-glass";

const OPTICS: GlassOptics = {
  bezel: 24,
  thickness: 34,
  ior: { red: 1.46, green: 1.5, blue: 1.55 },
};

type Refraction = {
  map: string;
  width: number;
  height: number;
  scale: GlassMaps["scale"];
};

// Only Chromium renders SVG filters as a backdrop-filter; Safari and Firefox
// parse the value and then paint nothing, so they keep the frosted fallback.
function backdropAcceptsSvg(): boolean {
  const data = (
    navigator as Navigator & {
      userAgentData?: { brands: { brand: string }[] };
    }
  ).userAgentData;
  return data?.brands.some(({ brand }) => brand === "Chromium") ?? false;
}

function toDataUrl(pixels: GlassPixels, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.putImageData(new ImageData(pixels, width, height), 0, 0);
  return canvas.toDataURL();
}

const CHANNELS = [
  ["red", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"],
  ["green", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"],
  ["blue", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"],
] as const;

/**
 * Fills its positioned, rounded parent with liquid glass: the backdrop bends
 * through a curved rim, splits into colour at the edge, and the rim catches a
 * light from the top left plus a glint that follows the pointer.
 */
export function LiquidGlass() {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const lightRef = React.useRef<HTMLCanvasElement>(null);
  const filterId = `liquid-glass-${React.useId().replace(/[^\w-]/g, "")}`;
  const [refraction, setRefraction] = React.useState<Refraction | null>(null);
  const [rimMask, setRimMask] = React.useState<string | null>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = lightRef.current;
    const host = root?.parentElement;
    if (!root || !canvas || !host) return;
    const refracts = backdropAcceptsSvg();
    let frame = 0;

    const draw = () => {
      const width = root.offsetWidth;
      const height = root.offsetHeight;
      if (!width || !height) return;
      const radius = parseFloat(getComputedStyle(root).borderTopLeftRadius);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const maps = renderGlassMaps({ width, height, radius }, OPTICS, pixelRatio);

      canvas.width = maps.width;
      canvas.height = maps.height;
      canvas
        .getContext("2d")
        ?.putImageData(new ImageData(maps.light, maps.width, maps.height), 0, 0);
      setRimMask(toDataUrl(maps.rim, maps.width, maps.height));
      if (refracts) {
        setRefraction({
          map: toDataUrl(maps.displacement, maps.width, maps.height),
          width,
          height,
          scale: maps.scale,
        });
      }
    };

    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    });
    resize.observe(root);

    const follow = (event: PointerEvent) => {
      const box = root.getBoundingClientRect();
      root.style.setProperty("--glint-x", `${event.clientX - box.left}px`);
      root.style.setProperty("--glint-y", `${event.clientY - box.top}px`);
    };
    host.addEventListener("pointermove", follow);

    return () => {
      resize.disconnect();
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", follow);
    };
  }, []);

  return (
    <span
      ref={rootRef}
      className="liquid-glass"
      aria-hidden="true"
      data-lit={rimMask ? "" : undefined}
      data-refract={refraction ? "" : undefined}
      style={
        {
          "--glass-refraction": `url(#${filterId})`,
          "--glass-rim": rimMask ? `url(${rimMask})` : undefined,
        } as React.CSSProperties
      }
    >
      <svg className="liquid-glass-defs" width="0" height="0" focusable="false">
        <filter
          id={filterId}
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          {refraction ? (
            <>
              <feImage
                href={refraction.map}
                x="0"
                y="0"
                width={refraction.width}
                height={refraction.height}
                preserveAspectRatio="none"
                result="map"
              />
              {CHANNELS.map(([channel, matrix]) => (
                <React.Fragment key={channel}>
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="map"
                    scale={refraction.scale[channel]}
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                  <feColorMatrix
                    type="matrix"
                    values={matrix}
                    result={channel}
                  />
                </React.Fragment>
              ))}
              <feBlend in="red" in2="green" mode="screen" result="yellow" />
              <feBlend in="yellow" in2="blue" mode="screen" />
            </>
          ) : null}
        </filter>
      </svg>
      <span className="liquid-glass-lens" />
      <canvas ref={lightRef} className="liquid-glass-light" />
      <span className="liquid-glass-glint" />
    </span>
  );
}
