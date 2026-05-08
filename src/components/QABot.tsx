import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircleQuestion, Send, Sparkles, X } from 'lucide-react';
import type { EventDoc } from '../lib/types';
import { answerQuestion, streamText } from '../lib/aiFixtures';
import { db } from '../lib/store';
import { uid } from '../lib/utils';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
};

export function QABot({ event }: { event: EventDoc }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: 'intro',
      role: 'assistant',
      content: `Hi — I'm the assistant for ${event.title}. Ask me about timing, location, tickets, schedule, refunds, or anything else.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  function send(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: text };
    const aId = crypto.randomUUID();
    setMessages((m) => [...m, userMsg, { id: aId, role: 'assistant', content: '', streaming: true }]);
    setInput('');

    const { reply, forwardToOrganizer } = answerQuestion(text, event);

    if (forwardToOrganizer) {
      db.upsertNotification({
        id: uid('ntf_'),
        recipientId: event.organizerId,
        eventId: event.id,
        kind: 'qa_forwarded',
        title: `Question from an attendee on ${event.title}`,
        body: text,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    setTimeout(() => {
      cancelRef.current = streamText(
        reply,
        (full) => setMessages((m) => m.map((x) => (x.id === aId ? { ...x, content: full } : x))),
        () => {
          setMessages((m) => m.map((x) => (x.id === aId ? { ...x, streaming: false } : x)));
          setBusy(false);
        },
      );
    }, 240);
  }

  function stop() {
    cancelRef.current?.();
    cancelRef.current = null;
    setMessages((m) => m.map((x) => (x.streaming ? { ...x, streaming: false } : x)));
    setBusy(false);
  }

  const SUGGESTED = ['When does it start?', 'Where is it?', 'How do refunds work?', 'What\'s on the schedule?'];

  return (
    <>
      {/* Launcher */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 h-14 px-5 rounded-full bg-ink text-paper border-2 border-ink shadow-[6px_6px_0_0_rgb(var(--accent))] hover:shadow-[8px_8px_0_0_rgb(var(--accent))] transition-shadow font-semibold"
        aria-label="Ask about this event"
      >
        <MessageCircleQuestion size={18} />
        <span className="hidden sm:inline">Ask the event AI</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed bottom-24 right-6 z-40 w-[min(420px,calc(100vw-3rem))] h-[min(560px,calc(100vh-7rem))] card overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14 border-b-2 border-ink/10 bg-paper">
              <div className="inline-flex items-center gap-2">
                <span className="size-7 rounded-xl bg-accent border-2 border-ink grid place-items-center shadow-[2px_2px_0_0_rgb(var(--ink))]">
                  <Sparkles size={12} className="text-accent-ink" />
                </span>
                <div>
                  <div className="font-display font-bold text-sm leading-tight">Event AI</div>
                  <div className="text-xs text-muted leading-tight">{event.title}</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-ink p-1.5 rounded-lg hover:bg-line/40" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] bg-primary text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed'
                        : 'max-w-[90%] bg-paper border-2 border-ink/15 text-ink px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed whitespace-pre-wrap'
                    }
                  >
                    {m.content}
                    {m.streaming && (
                      <span className="inline-block w-1.5 h-4 bg-ink align-middle ml-0.5 animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
              {messages.length <= 1 && (
                <div className="pt-2">
                  <div className="text-xs uppercase tracking-[0.12em] font-bold text-muted mb-2">Try asking</div>
                  <div className="grid grid-cols-2 gap-2">
                    {SUGGESTED.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-left text-xs px-3 py-2.5 rounded-xl border-2 border-ink/15 hover:border-ink hover:bg-paper transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t-2 border-ink/10 p-3 flex items-center gap-2 bg-paper"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about this event…"
                className="flex-1 h-10 px-3 rounded-xl bg-panel border-2 border-ink/15 focus:border-ink focus:outline-none text-sm placeholder:text-subtle"
                disabled={busy}
              />
              {busy ? (
                <button type="button" onClick={stop} className="btn-quiet h-10 text-sm">
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="inline-flex items-center justify-center size-10 rounded-xl bg-ink text-paper border-2 border-ink disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send size={14} />
                </button>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
