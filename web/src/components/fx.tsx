import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export const EASE = [0.16, 1, 0.3, 1] as const;

export type Word = { text: string; em?: boolean; className?: string };

export function SplitWords({
  words,
  className,
}: {
  words: (Word | string)[];
  delay?: number;
  stagger?: number;
  inView?: boolean;
  className?: string;
}) {
  return (
    <span className={className}>
      {words.map((raw, index) => {
        const word = typeof raw === "string" ? { text: raw } : raw;
        return (
          <span key={`${word.text}-${index}`}>
            <span className={`word ${word.em ? "em" : ""} ${word.className ?? ""}`}>{word.text}</span>
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
  y = 10,
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
      transition={{ duration: 0.3, ease: EASE, delay }}
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

export function Magnetic({ children }: { children: ReactNode; strength?: number }) {
  return <span className="magnetic">{children}</span>;
}

export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  return <div className={className}>{children}</div>;
}

export function CursorGlow() {
  return null;
}

/** Small uppercase-free eyebrow label with a status dot. */
export function Eyebrow({ children, tone = "signal" }: { children: ReactNode; tone?: "signal" | "ice" | "violet" | "verify" | "flood" }) {
  return (
    <span className={`eyebrow tone-${tone}`}>
      <i aria-hidden="true" />
      {children}
    </span>
  );
}
