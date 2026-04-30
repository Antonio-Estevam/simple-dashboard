"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type State = "hidden" | "loading" | "completing";

export function NavigationProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<State>("hidden");
  const [width, setWidth] = useState(0);
  const prevPath = useRef(pathname);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Navigation completed → finish the bar
  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    if (tickRef.current) clearInterval(tickRef.current);
    setState("completing");
    setWidth(100);

    hideRef.current = setTimeout(() => {
      setState("hidden");
      setWidth(0);
    }, 350);
  }, [pathname]);

  // Listen for internal link clicks → start the bar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) return;
      if (href === pathname) return;

      if (tickRef.current) clearInterval(tickRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);

      setState("loading");
      setWidth(12);

      let w = 12;
      tickRef.current = setInterval(() => {
        // Ease toward 88 — gets slower as it approaches, never arrives
        w += (88 - w) * 0.1;
        setWidth(w);
      }, 160);
    }

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      if (tickRef.current) clearInterval(tickRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, [pathname]);

  if (state === "hidden") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 pointer-events-none">
      <div
        className="h-full bg-primary shadow-[0_0_8px_1px] shadow-primary/60"
        style={{
          width: `${width}%`,
          transition:
            state === "completing"
              ? "width 150ms ease-out, opacity 200ms ease 200ms"
              : "width 130ms linear",
          opacity: state === "completing" ? 0 : 1,
        }}
      />
    </div>
  );
}
