import { createContext, useContext, useState, type ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import type { Flick } from "@/data/feed";
import { Button } from "@/components/ui/button";
import { Close, More } from "./Icons";
import { Avatar } from "./Avatar";
import { usePrototypeBack, usePrototypeState } from "./PrototypeNavigation";

const BrowserContext = createContext<(flick: Flick) => void>(() => {});
export const useInAppBrowser = () => useContext(BrowserContext);

export function InAppBrowserProvider({ children }: { children: ReactNode }) {
  const [flick, setFlick] = usePrototypeState<Flick | null>("browser", null);
  const close = usePrototypeBack(() => setFlick(null));
  const [loaded, setLoaded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [pressed, setPressed] = useState(false);
  const open = (next: Flick) => { setLoaded(false); setMenu(false); setPressed(false); setFlick(next); };
  return <BrowserContext.Provider value={open}>{children}{flick && <div role="dialog" aria-modal="true" aria-label="In-app browser" className="animate-fb-sheet fixed inset-0 z-[90] flex flex-col bg-fb-card text-fb-fg" onKeyDown={e => { if (e.key === "Escape") close(); }}>
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-fb-sep bg-fb-bg px-2">
      <Button variant="ghost" size="icon" aria-label="Close browser" onClick={close}><Close size={23} /></Button>
      <LockKeyhole size={14} className="text-fb-muted" /><span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{flick.landingSheet?.address ?? (flick.landingUrl ? new URL(flick.landingUrl).hostname : flick.brand)}</span>
      <Button variant="ghost" size="icon" aria-label="Browser menu" onClick={() => setMenu(v => !v)}><More size={22} /></Button>
    </header>
    <div className="h-0.5 shrink-0 bg-fb-elev"><div className={`h-full bg-fb-blue ${loaded || !flick.embeddable ? "w-full" : "w-2/3 animate-pulse"}`} /></div>
    {menu && <div className="absolute right-2 top-14 z-10 rounded-lg border border-fb-sep bg-fb-card p-2 shadow-md">{flick.landingUrl ? <Button asChild variant="ghost"><a href={flick.landingUrl} target="_blank" rel="noopener noreferrer">Open in browser</a></Button> : <span className="px-2 text-[13px] text-fb-muted">Demo page</span>}</div>}
    {flick.embeddable && flick.landingUrl ? <><iframe title={`${flick.displayName} website`} src={flick.landingUrl} onLoad={() => setLoaded(true)} className="min-h-0 w-full flex-1 border-0" /><div className="border-t border-fb-sep p-2 text-center"><Button variant="ghost" onClick={() => setFlick({ ...flick, embeddable: false }, true)}>Page not showing?</Button></div></> : <div className="flex-1 overflow-y-auto px-6 py-12">
      <div className="mb-4"><Avatar logo={flick.logo} monogram={flick.displayName ?? flick.brand} size={56} /></div>
      <h1 className="text-[25px] font-bold">{flick.displayName}</h1>
      {flick.productName && <h2 className="mt-3 text-[18px] font-semibold">{flick.productName}</h2>}
      {flick.landingSheet ? <><p className="mt-6 text-[15px] leading-6 text-fb-muted">{flick.landingSheet.copy}</p><Button aria-pressed={pressed} onClick={() => setPressed(v => !v)} className="mt-6 bg-fb-blue text-fb-card hover:bg-fb-blue/90">{pressed ? "Saved" : flick.landingSheet.button}</Button></> : <><p className="mt-6 text-[15px] text-fb-muted">This site can't be shown inside the demo.</p><Button asChild className="mt-6 bg-fb-blue text-fb-card hover:bg-fb-blue/90"><a href={flick.landingUrl} target="_blank" rel="noopener noreferrer">Open in browser</a></Button></>}
    </div>}
  </div>}</BrowserContext.Provider>;
}