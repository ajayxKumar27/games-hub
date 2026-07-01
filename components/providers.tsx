"use client";

import { ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { ensurePlayerId, hydrate, PreferencesState } from "@/lib/store/preferencesSlice";
import { AppStore, makeStore } from "@/lib/store/store";

const STORAGE_KEY = "gaming-hub-preferences";

function createId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function Persistence({ store }: { store: AppStore }) {
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) store.dispatch(hydrate(JSON.parse(raw) as PreferencesState));
    store.dispatch(ensurePlayerId(createId()));
    return store.subscribe(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState().preferences));
    });
  }, [store]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());
  return (
    <Provider store={store}>
      <Persistence store={store} />
      {children}
    </Provider>
  );
}
