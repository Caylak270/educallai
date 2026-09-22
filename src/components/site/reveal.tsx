"use client";

import { useEffect, useRef, useState } from "react";

import { clsx } from "@/lib/clsx";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** ms cinsinden gecikme — kart dizilerinde kademeli giriş için */
  delay?: number;
};

/* Scroll-reveal: öğe görünür alana girince yumuşakça yükselerek belirir.
   21st.dev tarzı micro-interaction'ın sıfır bağımlılıklı karşılığı. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={clsx(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}
