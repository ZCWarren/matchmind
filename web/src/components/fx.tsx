import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Signature expo-out easing used for every entrance. */
export const EASE = [0.16, 1, 0.3, 1] as const;

export type Word = { text: string; em?: boolean; className?: string };

/**
 * Line/word mask reveal. Each word slides up from behind its own clipping mask,
 * staggered 50ms. Spaces stay as real text nodes so innerText/accessibility read naturally.
 */
export function SplitWords({
  words,
  delay = 0,
  stagger = 0.05,
  inView = false,
  className,
}: {
  words: (Word | string)[];
  delay?: number;
  stagger?: number;
  inView?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const active = inView ? seen : true;
  return (
    <span ref={ref} className={className}>
      {words.map((raw, index) => {
        const word = typeof raw === "string" ? { text: raw } : raw;
        return (
          <span key={`${word.text}-${index}`}>
            <span className="word-mask">
              <motion.span
                className={`word ${word.em ? "em" : ""} ${word.className ?? ""}`}
                initial={{ y: "112%", rotate: 4 }}
                animate={active ? { y: "0%", rotate: 0 } : undefined}
                transition={{ duration: 1.05, ease: EASE, delay: delay + index * stagger }}
              >
                {word.text}
              </motion.span>
            </span>
            {index < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </span>
  );
}

/** Split a plain sentence into words, marking any word wrapped in *asterisks* as emphasis. */
export function words(sentence: string): Word[] {
  let inEm = false;
  return sentence.split(" ").map((part) => {
    if (part.startsWith("*")) inEm = true;
    const word = { text: part.replace(/\*/g, ""), em: inEm };
    if (/\*[.,!?]?$/.test(part) && !(part.startsWith("*") && part.length === 1)) inEm = false;
    return word;
  });
}

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "p" | "header";
  style?: CSSProperties;
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </Component>
  );
}

/** Animated count-up that starts when scrolled into view. */
export function CountUp({
  to,
  duration = 1.8,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (reduce) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, { duration, ease: EASE, onUpdate: setValue });
    return () => controls.stop();
  }, [seen, to, duration, reduce]);
  const text = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span ref={ref} className={className}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

/** Magnetic wrapper: the child drifts toward the pointer, springing back on leave. */
export function Magnetic({ children, strength = 0.28 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  return (
    <motion.span
      ref={ref}
      className="magnetic"
      style={{ x: sx, y: sy }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * strength);
        y.set((event.clientY - rect.top - rect.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/** Hover tilt card with a moving glare highlight. */
export function TiltCard({
  children,
  className,
  max = 9,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 160, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 160, damping: 18 });
  const gx = useTransform(px, (value) => `${value * 100}%`);
  const gy = useTransform(py, (value) => `${value * 100}%`);
  const glare = useMotionTemplate`radial-gradient(520px circle at ${gx} ${gy}, rgba(255,227,179,0.16), transparent 45%)`;
  return (
    <motion.div
      ref={ref}
      className={`tilt-card ${className ?? ""}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        px.set((event.clientX - rect.left) / rect.width);
        py.set((event.clientY - rect.top) / rect.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      {children}
      <motion.div className="tilt-glare" style={{ background: glare }} aria-hidden="true" />
    </motion.div>
  );
}

/** Soft floodlight glow that follows the cursor across a section. */
export function CursorGlow() {
  const x = useMotionValue(-999);
  const y = useMotionValue(-999);
  const sx = useSpring(x, { stiffness: 90, damping: 20 });
  const sy = useSpring(y, { stiffness: 90, damping: 20 });
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);
  return <motion.div className="cursor-glow" style={{ x: sx, y: sy }} aria-hidden="true" />;
}

/** Small uppercase-free eyebrow label with a glowing dot. */
export function Eyebrow({ children, tone = "signal" }: { children: ReactNode; tone?: "signal" | "ice" | "violet" | "verify" | "flood" }) {
  return (
    <span className={`eyebrow tone-${tone}`}>
      <i aria-hidden="true" />
      {children}
    </span>
  );
}
