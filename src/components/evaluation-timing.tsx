"use client";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  decodeTiming,
  freshTiming,
  measuredTick,
  TIMING_KEY,
} from "@/domain/evaluation/timing";
function createTimingStore() {
  const server = {
    data: freshTiming(),
    ready: false,
    active: false,
    notice: "",
  };
  let snapshot = server,
    anchor = 0,
    route = "";
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  function persist() {
    try {
      localStorage.setItem(TIMING_KEY, JSON.stringify(snapshot.data));
    } catch {
      snapshot = {
        ...snapshot,
        notice: "Timing could not be saved. Export while this page is open.",
      };
    }
    emit();
  }
  return {
    getServerSnapshot: () => server,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!snapshot.ready) {
        let notice = "",
          data = freshTiming();
        try {
          const raw = localStorage.getItem(TIMING_KEY);
          const decoded = decodeTiming(raw);
          data = decoded ?? data;
          if (raw && !decoded)
            notice =
              "Saved timing is unsupported or damaged; past timing is unavailable.";
        } catch {
          notice = "Timing storage is unavailable; timing works in memory.";
        }
        snapshot = { data, notice, ready: true, active: false };
        emit();
      }
      return () => {
        listeners.delete(listener);
      };
    },
    start() {
      if (snapshot.active) return;
      anchor = Date.now();
      route = window.location.pathname;
      snapshot = {
        ...snapshot,
        active: true,
        data: {
          version: 1,
          segments: [
            ...snapshot.data.segments,
            {
              id: crypto.randomUUID(),
              startedAt: anchor,
              endedAt: anchor,
              activeMs: 0,
              byRoute: {},
            },
          ].slice(-200),
        },
      };
      persist();
    },
    tick() {
      if (!snapshot.active) return;
      const now = Date.now(),
        nextRoute = window.location.pathname;
      const segments = [...snapshot.data.segments];
      segments[segments.length - 1] = measuredTick(
        segments.at(-1)!,
        anchor,
        now,
        route,
        nextRoute,
      );
      anchor = now;
      route = nextRoute;
      snapshot = { ...snapshot, data: { version: 1, segments } };
      persist();
    },
    pause() {
      if (!snapshot.active) return;
      this.tick();
      snapshot = { ...snapshot, active: false };
      persist();
    },
  };
}
type Store = ReturnType<typeof createTimingStore>;
const Context = createContext<Store | null>(null);
export function EvaluationTimingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [store] = useState(createTimingStore);
  useEffect(() => {
    const interval = window.setInterval(() => store.tick(), 5_000);
    const hidden = () => {
      if (document.hidden) store.pause();
    };
    const unload = () => store.pause();
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", unload);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", unload);
    };
  }, [store]);
  return (
    <Context.Provider value={store}>
      <TimingBanner />
      {children}
    </Context.Provider>
  );
}
export function useEvaluationTiming() {
  const store = useContext(Context);
  if (!store) throw new Error("Timing provider is missing.");
  return {
    ...useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getServerSnapshot,
    ),
    start: () => store.start(),
    pause: () => store.pause(),
  };
}
function TimingBanner() {
  const timing = useEvaluationTiming();
  return timing.active ? (
    <div className="shell timing-banner" role="status">
      <span>Training timer active on this device.</span>
      <button className="text-button" onClick={timing.pause}>
        Pause training timer
      </button>
      <Link href="/evaluation">Local results</Link>
    </div>
  ) : null;
}
