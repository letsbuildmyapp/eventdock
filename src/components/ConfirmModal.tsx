import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ConfirmOpts = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type Resolver = (ok: boolean) => void;

const Ctx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const [resolver, setResolver] = useState<Resolver | null>(null);

  const confirm = useCallback((o: ConfirmOpts) => {
    return new Promise<boolean>((resolve) => {
      setOpts(o);
      setResolver(() => resolve);
    });
  }, []);

  const close = (ok: boolean) => {
    resolver?.(ok);
    setOpts(null);
    setResolver(null);
  };

  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      else if (e.key === 'Enter') close(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts]);

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {opts && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] grid place-items-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => close(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="card w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-display font-bold">{opts.title}</h2>
              {opts.message && <div className="mt-3 text-muted">{opts.message}</div>}
              <div className="mt-6 flex justify-end gap-3">
                <button className="btn-ghost" onClick={() => close(false)}>{opts.cancelLabel ?? 'Cancel'}</button>
                <button className={opts.destructive ? 'btn-danger' : 'btn-primary'} onClick={() => close(true)}>
                  {opts.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export function useConfirm() {
  return useContext(Ctx);
}
