"use client";
import { useState, useSyncExternalStore } from "react";
import {
  decodeGameData,
  freshGameData,
  GAME_STORAGE_KEY,
  serializeGames,
  type GameData,
} from "@/infrastructure/game-progress";
function createStore() {
  const server = { data: freshGameData(), ready: false, notice: "" };
  let snapshot = server;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  return {
    getServerSnapshot: () => server,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!snapshot.ready) {
        let data = freshGameData(),
          notice = "";
        try {
          const raw = localStorage.getItem(GAME_STORAGE_KEY);
          const decoded = decodeGameData(raw);
          data = decoded ?? data;
          if (raw && !decoded)
            notice =
              "Saved game data is unsupported or damaged. A fresh game record is ready; lesson progress is untouched.";
        } catch {
          notice =
            "Game storage is unavailable. You can play in memory and export PGN before leaving.";
        }
        snapshot = { data, ready: true, notice };
        emit();
      }
      return () => {
        listeners.delete(listener);
      };
    },
    update(updater: (current: GameData) => GameData) {
      const data = updater(snapshot.data);
      let notice = snapshot.notice;
      try {
        localStorage.setItem(GAME_STORAGE_KEY, serializeGames(data));
      } catch {
        notice =
          "Game progress could not be saved. Keep this page open and export PGN before leaving.";
      }
      snapshot = { data, ready: true, notice };
      emit();
    },
  };
}
export function useGameProgress() {
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
