import { useRef, useState } from "react";
import { ImageOff } from "lucide";
import { MorphIcon } from "morphicons/react";
import {
  motion,
  useIsomorphicLayoutEffect,
  useReducedMotion,
} from "motion/react";

const DEVELOP = { duration: 0.65, ease: [0.23, 1, 0.32, 1] } as const;

const INSTANT = { duration: 0 } as const;

export type BlurUpStatus = "loading" | "ready" | "error";

export type UseBlurUpImageOptions = {
  src?: string;
  srcSet?: string;
  onReady?: () => void;
  onError?: () => void;
};

export function useBlurUpImage({
  src,
  srcSet,
  onReady,
  onError,
}: UseBlurUpImageOptions) {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<{
    status: BlurUpStatus;
    instant: boolean;
  }>({ status: "loading", instant: false });

  const ready = useRef(onReady);
  ready.current = onReady;
  const failed = useRef(onError);
  failed.current = onError;

  useIsomorphicLayoutEffect(() => {
    const img = ref.current;

    const set = (status: BlurUpStatus, instant: boolean) =>
      setState((prev) =>
        prev.status === status && prev.instant === instant
          ? prev
          : { status, instant },
      );

    if (!img || !src) {
      set("loading", false);
      return;
    }

    let alive = true;

    const cached = img.complete && img.naturalWidth > 0;

    const reveal = () => {
      if (!alive) return;
      set("ready", cached);
      ready.current?.();
    };

    const fail = () => {
      if (!alive) return;
      set("error", cached);
      failed.current?.();
    };

    if (img.complete) {
      if (cached) reveal();
      else fail();
      return () => {
        alive = false;
      };
    }

    set("loading", false);

    const onLoad = () => {
      if (!alive) return;
      if (typeof img.decode === "function") {
        img.decode().then(reveal, fail);
        return;
      }
      reveal();
    };

    img.addEventListener("load", onLoad);
    img.addEventListener("error", fail);

    return () => {
      alive = false;
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", fail);
    };
  }, [src, srcSet]);

  return {
    ref,
    status: state.status,
    instant: state.instant,
    loaded: state.status === "ready",
  };
}

export type BlurUpImageProps = {
  src?: string;
  alt: string;
  width: number;
  height: number;
  placeholder?: string;
  color?: string;
  blur?: number;
  radius?: 5 | 6 | 9 | 11 | 14;
  srcSet?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  onReady?: () => void;
  onError?: () => void;
  className?: string;
};

export function BlurUpImage({
  src,
  alt,
  width,
  height,
  placeholder,
  color,
  blur = 14,
  radius = 11,
  srcSet,
  sizes,
  loading = "lazy",
  fetchPriority,
  onReady,
  onError,
  className = "",
}: BlurUpImageProps) {
  const reduced = useReducedMotion();
  const { ref, status, instant } = useBlurUpImage({
    src,
    srcSet,
    onReady,
    onError,
  });

  const shown = status === "ready";
  const still = reduced === true || instant;
  const transition = still ? INSTANT : DEVELOP;

  return (
    <div
      aria-busy={status === "loading"}
      style={{
        aspectRatio: `${width} / ${height}`,
        borderRadius: radius,
        backgroundColor: color,
      }}
      className={`relative w-full overflow-hidden bg-stone-200 dark:bg-white/15 ${className}`}
    >
      {placeholder ? (
        <img
          src={placeholder}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: `blur(${blur}px)`, transform: "scale(1.08)" }}
        />
      ) : null}

      <motion.img
        ref={ref}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        initial={false}
        animate={
          still
            ? { opacity: shown ? 1 : 0 }
            : shown
              ? {
                  opacity: 1,
                  filter: "blur(0px) saturate(1)",
                  scale: 1,
                }
              : {
                  opacity: 0,
                  filter: "blur(18px) saturate(0.6)",
                  scale: 1.06,
                }
        }
        transition={transition}
      />

      {status === "error" ? (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className="absolute inset-0 grid place-items-center bg-white text-stone-400 dark:bg-[#1D1D1A] dark:text-stone-500"
        >
          <MorphIcon
            icon={ImageOff}
            size={22}
            strokeWidth={1.8}
            reducedMotion="user"
          />
        </motion.div>
      ) : null}
    </div>
  );
}
