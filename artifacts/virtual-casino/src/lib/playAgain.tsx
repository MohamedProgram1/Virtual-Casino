import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface PlayAgainSlot {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface PlayAgainContextValue {
  slot: PlayAgainSlot | null;
  setSlot: (s: PlayAgainSlot | null) => void;
}

const PlayAgainContext = createContext<PlayAgainContextValue | null>(null);

export function PlayAgainProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<PlayAgainSlot | null>(null);
  return (
    <PlayAgainContext.Provider value={{ slot, setSlot }}>
      {children}
    </PlayAgainContext.Provider>
  );
}

export function usePlayAgainSlot(): PlayAgainSlot | null {
  const ctx = useContext(PlayAgainContext);
  if (!ctx) throw new Error("usePlayAgainSlot must be inside PlayAgainProvider");
  return ctx.slot;
}

/**
 * Register (or unregister) the current page's "Play Again" action.
 * Pass `null` to hide the floating button.
 *
 * @param cfg   The slot to register, or null to clear.
 * @param deps  Dependency list — the slot is re-registered whenever one
 *              of these changes. Pattern matches React's useEffect deps.
 */
export function useRegisterPlayAgain(
  cfg: PlayAgainSlot | null,
  deps: unknown[],
) {
  const ctx = useContext(PlayAgainContext);
  if (!ctx) throw new Error("useRegisterPlayAgain must be inside PlayAgainProvider");
  const { setSlot } = ctx;

  // Hold the latest config in a ref so the wrapped onClick always points
  // at the freshest closure without forcing re-registration on every render.
  const ref = useRef(cfg);
  ref.current = cfg;

  useEffect(() => {
    if (!cfg) {
      setSlot(null);
      return;
    }
    setSlot({
      label: cfg.label,
      disabled: cfg.disabled,
      onClick: () => ref.current?.onClick(),
    });
    return () => setSlot(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
