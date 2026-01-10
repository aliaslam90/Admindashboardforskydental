import { createContext, useContext, useState, ReactNode } from 'react';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncMessage: string | null;
}

interface SyncContextValue {
  syncState: SyncState;
  syncData: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    syncMessage: null,
  });

  const syncData = async () => {
    // Lightweight sync placeholder; extend to call domain fetchers as needed.
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Syncing data...' });
    await Promise.resolve(); // Keep async signature
    setSyncState({
      isSyncing: false,
      lastSyncTime: new Date(),
      syncMessage: null,
    });
  };

  return (
    <SyncContext.Provider value={{ syncState, syncData }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return ctx;
}

