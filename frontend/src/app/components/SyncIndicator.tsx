import { useSync } from '../contexts/SyncContext';
import { Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

export function SyncIndicator() {
  const { syncState, syncData } = useSync();

  if (!syncState.isSyncing && !syncState.syncMessage && !syncState.lastSyncTime) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {syncState.isSyncing && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <span className="text-sm text-gray-700">{syncState.syncMessage}</span>
        </div>
      )}

      {!syncState.isSyncing && syncState.lastSyncTime && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">All changes saved</p>
            <p className="text-xs text-gray-500">
              Last synced: {syncState.lastSyncTime.toLocaleTimeString()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={syncData}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
