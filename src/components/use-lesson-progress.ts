"use client";

import { useState, useSyncExternalStore } from "react";
import type { Lesson } from "@/domain/learning/types";
import {
  decodeProgress,
  freshProgress,
  STORAGE_KEY,
  type LocalProgress,
} from "@/infrastructure/local-progress";

// A stable external snapshot gives SSR a deterministic first render and reads
// browser storage at subscription time, without overwriting it during hydration.
function createStore(lesson: Lesson) {
  const serverSnapshot = {
    data: freshProgress(lesson),
    loaded: false,
    storageNotice: "",
  };
  let snapshot = serverSnapshot;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  return {
    getServerSnapshot: () => serverSnapshot,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!snapshot.loaded) {
        let data = snapshot.data;
        let storageNotice = "";
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const saved = decodeProgress(raw, lesson);
          if (saved) data = saved;
          else if (raw)
            storageNotice =
              "The saved lesson could not be restored. A fresh practice is ready.";
        } catch {
          storageNotice =
            "Browser storage is unavailable. You can practice, but progress will last only while this page is open.";
        }
        snapshot = { data, loaded: true, storageNotice };
        emit();
      }
      return () => {
        listeners.delete(listener);
      };
    },
    update(updater: (current: LocalProgress) => LocalProgress) {
      const data = updater(snapshot.data);
      let storageNotice = snapshot.storageNotice;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        storageNotice =
          "Progress could not be saved. Keep this page open to continue this practice.";
      }
      snapshot = { data, loaded: true, storageNotice };
      emit();
    },
  };
}

export function useLessonProgress(lesson: Lesson) {
  const [store] = useState(() => createStore(lesson));
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return { ...state, setData: store.update };
}
