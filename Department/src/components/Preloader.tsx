import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const duration = 2200;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const raw = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - raw, 2);
      setCount(Math.floor(eased * 100));
      if (raw < 1) {
        requestAnimationFrame(tick);
      } else {
        setCount(100);
        setTimeout(() => setVisible(false), 400);
      }
    };

    requestAnimationFrame(tick);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          className="fixed inset-0 bg-sm-ink z-[2000] flex items-center justify-center overflow-hidden select-none"
          exit={{ y: '-100%' }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span className="font-serif text-8xl md:text-9xl text-sm-bg tracking-tighter leading-none">SM</span>
            <span className="text-[8px] uppercase tracking-[0.5em] font-black text-sm-bg/20">Department Store</span>
          </motion.div>

          <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
            <span
              className="font-serif leading-none text-sm-bg/[0.05] tabular-nums"
              style={{ fontSize: '20vw' }}
            >
              {String(count).padStart(2, '0')}
            </span>
            <div className="flex flex-col items-end gap-2 pb-1 shrink-0">
              <span className="text-[8px] uppercase tracking-[0.5em] font-black text-sm-bg/20">
                {count < 100 ? 'Loading' : 'Welcome'}
              </span>
              <div className="w-36 h-[1px] bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-sm-accent transition-none origin-left"
                  style={{ width: `${count}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
