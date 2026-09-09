import { create } from 'zustand'

export type CollabRole = 'solo' | 'host' | 'guest'
export type CollabConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'

export interface CollabPeerInfo {
  role: Exclude<CollabRole, 'solo'>
  viewingSlideId: string | null
  color: string
  lastSeenAt: number
}

interface CollabState {
  role: CollabRole
  roomCode: string | null
  status: CollabConnectionStatus
  errorMessage: string | null
  peers: Record<string, CollabPeerInfo>
  /** true once at least one project snapshot has been exchanged with a peer in this session */
  hasSyncedOnce: boolean

  startHosting: (roomCode: string) => void
  startJoining: () => void
  setConnected: () => void
  markSynced: () => void
  setError: (message: string) => void
  reset: () => void
  upsertPeer: (peerId: string, patch: Partial<CollabPeerInfo>) => void
  removePeer: (peerId: string) => void
}

const PEER_COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

export function colorForPeerId(peerId: string): string {
  let hash = 0
  for (let i = 0; i < peerId.length; i++) hash = (hash * 31 + peerId.charCodeAt(i)) >>> 0
  return PEER_COLORS[hash % PEER_COLORS.length]
}

export const useCollabStore = create<CollabState>((set) => ({
  role: 'solo',
  roomCode: null,
  status: 'idle',
  errorMessage: null,
  peers: {},
  hasSyncedOnce: false,

  startHosting: (roomCode) =>
    set({ role: 'host', roomCode, status: 'connecting', errorMessage: null, peers: {}, hasSyncedOnce: false }),
  startJoining: () => set({ role: 'guest', status: 'connecting', errorMessage: null, peers: {}, hasSyncedOnce: false }),
  setConnected: () => set({ status: 'connected' }),
  markSynced: () => set({ hasSyncedOnce: true }),
  setError: (message) => set({ status: 'error', errorMessage: message }),
  reset: () =>
    set({ role: 'solo', roomCode: null, status: 'idle', errorMessage: null, peers: {}, hasSyncedOnce: false }),
  upsertPeer: (peerId, patch) =>
    set((state) => {
      const existing = state.peers[peerId]
      return {
        peers: {
          ...state.peers,
          [peerId]: {
            role: existing?.role ?? 'guest',
            viewingSlideId: existing?.viewingSlideId ?? null,
            color: existing?.color ?? colorForPeerId(peerId),
            lastSeenAt: Date.now(),
            ...patch,
          },
        },
      }
    }),
  removePeer: (peerId) =>
    set((state) => {
      const peers = { ...state.peers }
      delete peers[peerId]
      return { peers }
    }),
}))

export function useCanEditDestructively(): boolean {
  return useCollabStore((s) => s.role !== 'guest')
}
