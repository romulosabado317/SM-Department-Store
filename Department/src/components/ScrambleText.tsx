import { useState, useEffect, useRef } from 'react';
import { useInView } from 'motion/react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

interface Props {
  text: string;
  className?: string;
  delay?: number;
}

export default function ScrambleText({ text, className = '', delay = 0 }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(text);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isInView || hasRun.current) return;
    hasRun.current = true;

    const t = setTimeout(() => {
      let frame = 0;
      const total = text.length * 5;

      const interval = setInterval(() => {
        setDisplay(
          text.split('').map((char, i) => {
            if (char === ' ' || char === '.' || char === ',' || char === '-') return char;
            if (i < Math.floor(frame / 5)) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          }).join('')
        );
        frame++;
        if (frame > total) {
          setDisplay(text);
          clearInterval(interval);
        }
      }, 40);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(t);
  }, [isInView]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
