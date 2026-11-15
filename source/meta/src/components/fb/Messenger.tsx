import { useState } from "react";
import { CHATS, ME, type Chat } from "@/data/feed";
import { Avatar } from "./Avatar";
import { Back, Chevron, Plus, Search, ThumbUp } from "./Icons";
import { FlickEmbed } from "./FlickEmbed";
import { FlickCta } from "./FlickCta";
import { Button } from "@/components/ui/button";

function ChatRow({ chat, onOpen }: { chat: Chat; onOpen: (c: Chat) => void }) {
  return (
    <button onClick={() => onOpen(chat)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-fb-bg">
      <Avatar src={chat.avatar} logo={chat.sponsored ? chat.flick?.logo : undefined} monogram={chat.monogram} size={52} />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-[15px] font-medium">{chat.name}</div>
        <div className={`truncate text-[13px] ${chat.sponsored ? "text-fb-muted" : "text-fb-muted"}`}>
          {chat.preview}
        </div>
      </div>
      <span className="shrink-0 text-[12px] text-fb-muted">{chat.time}</span>
    </button>
  );
}

function ChatList({ onOpen, onClose }: { onOpen: (c: Chat) => void; onClose: () => void }) {
  return (
    <>
      <header className="flex h-[56px] shrink-0 items-center gap-2 border-b border-fb-sep px-2">
        <Button variant="ghost" size="icon" aria-label="Back to Facebook" onClick={onClose} className="hover:bg-fb-elev"><Back size={24} /></Button>
        <Avatar src={ME.avatar} size={32} />
        <span className="flex-1 text-[22px] font-bold">Chats</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fb-elev"><Search size={18} /></span>
      </header>
      <div className="px-3 py-2"><div className="flex h-9 items-center rounded-full bg-fb-elev px-3 text-[14px] text-fb-muted">Search</div></div>
      <div className="no-scrollbar flex-1 overflow-y-auto pb-4">
        {CHATS.map((c) => <ChatRow key={c.id} chat={c} onOpen={onOpen} />)}
      </div>
    </>
  );
}

function SponsoredThread({ chat, onBack }: { chat: Chat; onBack: () => void }) {
  const [notNow, setNotNow] = useState(false);
  const flick = chat.flick;
  return (
    <>
      <header className="flex h-[56px] shrink-0 items-center gap-2 border-b border-fb-sep px-2">
        <Button variant="ghost" size="icon" aria-label="Back to chats" onClick={onBack} className="hover:bg-fb-elev"><Back size={24} /></Button>
        <Avatar src={chat.avatar} logo={chat.sponsored ? flick?.logo : undefined} monogram={chat.monogram} size={36} />
        <div className="flex-1 leading-tight"><div className="text-[15px] font-semibold">{chat.name}</div><div className="text-[12px] text-fb-muted">{chat.shared ? "Messenger" : chat.sponsored ? "Sponsored" : "Active now"}</div></div>
      </header>
      <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {chat.shared && <p className="mb-3 ml-10 w-3/4 rounded-2xl bg-fb-elev px-3 py-2 text-[14px]">Saw this and thought of you!</p>}
        {flick ? <div className="flex items-end gap-2">
          <Avatar logo={chat.sponsored || chat.shared ? flick.logo : undefined} monogram={chat.shared ? flick.displayName : chat.monogram} size={28} />
          <div data-placement={`message-${chat.id}`} className="w-[78%] overflow-hidden rounded-2xl border border-fb-sep bg-fb-card">
            <FlickEmbed id={flick.flickId} aspect={flick.aspect} priority={9} />
            <div className="px-3 py-2">
              <div className="text-[14px] font-semibold">{flick.productName ?? flick.linkHeadline ?? flick.displayName}</div>
              <div className="text-[12px] text-fb-muted">{flick.linkDomain} </div>
            </div>
            <FlickCta flick={flick} className="h-11 w-full rounded-none border-t border-fb-sep bg-fb-card text-fb-blue hover:bg-fb-elev" />
            <button aria-pressed={notNow} onClick={() => setNotNow((v) => !v)} className={`w-full border-t border-fb-sep py-2.5 text-[14px] font-semibold ${notNow ? "bg-fb-elev text-fb-muted" : "text-fb-fg"}`}>Not now</button>
          </div>
        </div> : <p className="rounded-2xl bg-fb-elev p-3 text-[14px]">{chat.preview}</p>}
        {chat.shared && <p className="mt-3 ml-10 w-3/4 rounded-2xl bg-fb-elev px-3 py-2 text-[14px]">What do you think?</p>}
        <div className="mt-1 pl-10 text-[11px] text-fb-muted">{chat.time}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2 px-3 pb-4 pt-1">
        <span className="text-fb-blue"><Plus size={24} /></span>
        <div className="flex h-9 flex-1 items-center rounded-full bg-fb-elev px-3 text-[14px] text-fb-muted">Aa</div>
        <span className="text-fb-blue"><ThumbUp size={22} /></span>
      </div>
    </>
  );
}

export function Messenger({ onClose, thread, setThread }: { onClose: () => void; thread: Chat | null; setThread: (chat: Chat | null) => void }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-fb-card text-fb-fg">
      {thread ? <SponsoredThread chat={thread} onBack={() => setThread(null)} /> : <ChatList onOpen={setThread} onClose={onClose} />}
    </div>
  );
}
