"use client";
import { useState, useSyncExternalStore } from "react";
import { freshLearningData, type LearningData } from "@/domain/adaptive/types";
import {
  LEARNING_STORAGE_KEY,
  loadLearningData,
} from "@/infrastructure/adaptive-progress";
import { STORAGE_KEY } from "@/infrastructure/local-progress";

function createStore() {
  const server = {
    data: freshLearningData(),
    ready: false,
    notice: "",
    now: 0,
  };
  let snapshot = server;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  return {
    getServerSnapshot: () => server,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!snapshot.ready) {
        let loaded = { data: snapshot.data, notice: "" };
        try {
          loaded = loadLearningData(
            localStorage.getItem(LEARNING_STORAGE_KEY),
            localStorage.getItem(STORAGE_KEY),
          );
          localStorage.setItem(
            LEARNING_STORAGE_KEY,
            JSON.stringify(loaded.data),
          );
        } catch {
          loaded.notice =
            "Browser storage is unavailable. Practice works in memory; export before closing this page.";
        }
        snapshot = { ...loaded, ready: true, now: Date.now() };
        emit();
      }
      // Re-evaluate a due date while this page is open or after sleep, without a
      // fake clock or a visible “advance time” control in the learning product.
      const refresh = () => {
        snapshot = { ...snapshot, now: Date.now() };
        emit();
      };
      const interval = window.setInterval(refresh, 60_000);
      window.addEventListener("focus", refresh);
      return () => {
        listeners.delete(listener);
        window.clearInterval(interval);
        window.removeEventListener("focus", refresh);
      };
    },
    update(updater: (current: LearningData, now: number) => LearningData) {
      const now = Date.now();
      const data = updater(snapshot.data, now);
      let notice = snapshot.notice;
      try {
        localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(data));
      } catch {
        notice =
          "Progress could not be saved. Keep this page open or export the current results.";
      }
      snapshot = { data, ready: true, notice, now };
      emit();
    },
  };
}
export function useAdaptiveProgress() {
  const [store] = useState(createStore);
  return {
    ...useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getServerSnapshot,
    ),
    update: store.update,
  };
}
