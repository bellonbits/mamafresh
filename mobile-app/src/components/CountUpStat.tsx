
import { useEffect, useRef } from "react";
import { animate } from "animejs";

interface Props {
  value: string;
  className?: string;
}

function parseTarget(value: string): { prefix: string; number: number; suffix: string } | null {
  const match = value.match(/^([^\d]*)([\d,]+)(.*)$/);
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  return { prefix, number: Number(digits.replace(/,/g, "")), suffix };
}

/** Counts a stat number up from 0 once it scrolls into view — imperative DOM tween via anime.js, outside React's render loop. */
export default function CountUpStat({ value, className }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parsed = parseTarget(value);
    if (!el) return;
    if (!parsed) { el.textContent = value; return; }

    el.textContent = `${parsed.prefix}0${parsed.suffix}`;
    const counter = { n: 0 };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        animate(counter, {
          n: parsed.number,
          duration: 1200,
          onUpdate: () => {
            el.textContent = `${parsed.prefix}${Math.round(counter.n).toLocaleString()}${parsed.suffix}`;
          },
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <p ref={ref} className={className}>{value}</p>;
}
