import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { selectFlicks } from "./flick-policy";

type Registration = { element: HTMLDivElement; priority: number };
const FlickContext = createContext<{ active: string[]; register: (key: string, entry: Registration) => () => void } | null>(null);

export function FlickProvider({ children }: { children: ReactNode }) {
  const entries = useRef(new Map<string, Registration>());
  const current = useRef<string[]>([]);
  const [active, setActive] = useState<string[]>([]);
  const register = useCallback((key: string, entry: Registration) => {
    entries.current.set(key, entry);
    return () => { entries.current.delete(key); };
  }, []);
  useEffect(() => {
    const update = () => {
      const candidates = [...entries.current].flatMap(([key, { element, priority }]) => {
        if (!element.getClientRects().length) return [];
        let top = 0, bottom = window.innerHeight;
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
          if (/(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowY)) {
            const r = parent.getBoundingClientRect();
            top = Math.max(top, r.top); bottom = Math.min(bottom, r.bottom);
          }
        }
        if (bottom <= top) return [];
        const r = element.getBoundingClientRect();
        return [{ key, distance: Math.max(top - r.bottom, r.top - bottom, 0), viewport: bottom - top, retained: current.current.includes(key), priority }];
      });
      const next = selectFlicks(candidates);
      if (next.join() !== current.current.join()) { current.current = next; setActive(next); }
    };
    const timer = setInterval(update, 100);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    update();
    return () => { clearInterval(timer); window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, []);
  return <FlickContext.Provider value={{ active, register }}>{children}</FlickContext.Provider>;
}

export function FlickEmbed({ id, aspect, enabled = true, fill = false, priority = 0, onEvent, surface }: {
  id: string; aspect: string; enabled?: boolean; fill?: boolean; priority?: number;
  onEvent?: (type: string, detail: unknown) => void;
  surface?: "reel" | "story";
}) {
  const pool = useContext(FlickContext);
  const key = useId();
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const eventCallback = useRef(onEvent);
  useEffect(() => { eventCallback.current = onEvent; }, [onEvent]);
  const register = pool?.register;
  useEffect(() => {
    const element = box.current;
    if (!enabled || !element || !register) return;
    return register(key, { element, priority });
  }, [enabled, key, priority, register]);
  const mounted = enabled && (pool?.active.includes(key) ?? false);
  useEffect(() => {
    if (!mounted) return;
    setState("loading");
    let ready = false;
    const timer = setTimeout(() => { if (!ready) setState("error"); }, 12000);
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.source !== "flick" || data.id !== id) return;
      if (data.type === "vertex-ready") { ready = true; clearTimeout(timer); setState("ready"); }
      if (data.type === "vertex-error" && data.detail?.severity !== "warning") { clearTimeout(timer); setState("error"); }
      eventCallback.current?.(data.type, data.detail);
    };
    window.addEventListener("message", receive);
    return () => { clearTimeout(timer); window.removeEventListener("message", receive); };
  }, [mounted, id, attempt]);
  return <div ref={box} data-flick-id={id} data-flick-state={mounted ? state : "idle"} className={`relative w-full overflow-hidden bg-fb-elev ${fill ? "h-full" : ""}`} style={fill ? undefined : { aspectRatio: aspect }}>
    {mounted && <iframe key={attempt} ref={frame} src={"/flick-frame.html?id=" + id + (surface ? "&surface=" + surface : "")} allow="autoplay; fullscreen" title="Flick" className="absolute inset-0 h-full w-full border-0" />}
    {(!mounted || state === "loading") && <div aria-label="Loading Flick" className="pointer-events-none absolute inset-0 flick-shimmer" />}
    {mounted && state === "error" && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div role="alert" className="pointer-events-auto flex items-center gap-3 rounded-md bg-fb-card px-3 py-2 text-[12px] text-fb-fg shadow-md"><span>Flick didn't load</span><Button variant="ghost" size="sm" onClick={() => setAttempt((n) => n + 1)} className="text-fb-blue hover:bg-fb-elev">Retry</Button></div></div>}
  </div>;
}
