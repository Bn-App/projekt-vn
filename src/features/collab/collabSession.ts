import { joinRoom, selfId } from 'trystero/nostr'
import type { DataPayload, MessageAction, Room } from 'trystero/nostr'
import type { Project } from '../../types/project'
import { useProjectStore } from '../../state/projectStore'
import { useCollabStore, type CollabRole } from './collabStore'

const APP_ID = 'projekt-vn-editor'
const SOFT_LOCK_MS = 150
/** a small set of well-established public relays, pinned explicitly instead of trystero's full default
 * list (which includes several low-traffic/unreliable relays) to make matchmaking faster and more reliable */
const RELAY_URLS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://nostr.wine', 'wss://relay.primal.net']

/**
 * The domain types (Project, Slide, ...) are plain JSON-shaped data but are declared as regular
 * interfaces without index signatures, so TypeScript won't structurally match them against
 * trystero's `DataPayload` constraint. We know they're JSON-serializable at runtime, so we cast at
 * the send/receive boundary instead of adding index signatures to the whole domain model.
 */
interface ProjectSyncMessage {
  project: Project
  senderId: string
}

interface PresenceMessage {
  role: Exclude<CollabRole, 'solo'>
  viewingSlideId: string | null
}

let room: Room | null = null
let projectSyncAction: MessageAction<DataPayload> | null = null
let presenceAction: MessageAction<DataPayload> | null = null
let lastLocalEditAt = 0
let pendingIncoming: ProjectSyncMessage | null = null
let pendingTimer: number | undefined
/** the exact project object we last applied from a peer; lets the sync hook tell a genuine local
 * edit apart from the store update caused by adopting a remote snapshot, so it doesn't echo it back */
let lastAppliedRemoteProject: Project | null = null

function roomIdFor(roomCode: string): string {
  return `pvn-${roomCode}`
}

function sendProjectSync(data: ProjectSyncMessage, target?: string) {
  void projectSyncAction?.send(data as unknown as DataPayload, target ? { target } : undefined)
}

function sendPresence(data: PresenceMessage, target?: string) {
  void presenceAction?.send(data as unknown as DataPayload, target ? { target } : undefined)
}

function attachRoom(newRoom: Room, myRole: Exclude<CollabRole, 'solo'>) {
  room = newRoom

  projectSyncAction = newRoom.makeAction('project-sync')
  presenceAction = newRoom.makeAction('presence')

  projectSyncAction.onMessage = (data) => applyIncomingProject(data as unknown as ProjectSyncMessage)
  presenceAction.onMessage = (data, ctx) => {
    const presence = data as unknown as PresenceMessage
    useCollabStore.getState().upsertPeer(ctx.peerId, { role: presence.role, viewingSlideId: presence.viewingSlideId })
  }

  newRoom.onPeerJoin = (peerId) => {
    useCollabStore.getState().upsertPeer(peerId, {})
    useCollabStore.getState().setConnected()
    if (myRole === 'host') {
      sendProjectSync({ project: useProjectStore.getState().project, senderId: selfId }, peerId)
    }
    sendPresence({ role: myRole, viewingSlideId: useProjectStore.getState().selectedSlideId }, peerId)
  }
  newRoom.onPeerLeave = (peerId) => {
    useCollabStore.getState().removePeer(peerId)
  }
}

function applyIncomingProject(msg: ProjectSyncMessage) {
  const apply = () => {
    lastAppliedRemoteProject = msg.project
    useProjectStore.getState().applyRemoteProject(msg.project)
    useCollabStore.getState().markSynced()
  }
  const sinceLocalEdit = Date.now() - lastLocalEditAt
  if (sinceLocalEdit > SOFT_LOCK_MS) {
    apply()
    return
  }
  pendingIncoming = msg
  if (pendingTimer) window.clearTimeout(pendingTimer)
  pendingTimer = window.setTimeout(() => {
    if (pendingIncoming === msg) apply()
    pendingIncoming = null
  }, SOFT_LOCK_MS)
}

/** call whenever the local project store changes, so incoming remote updates briefly back off instead of clobbering an in-flight edit */
export function markLocalEdit() {
  lastLocalEditAt = Date.now()
}

/** true if this exact project snapshot is one we just adopted from a peer (not a genuine local edit) */
export function isRemoteProject(project: Project): boolean {
  return project === lastAppliedRemoteProject
}

export function broadcastProject(project: Project) {
  sendProjectSync({ project, senderId: selfId })
}

export function broadcastPresence(viewingSlideId: string | null) {
  const role = useCollabStore.getState().role
  if (role === 'solo') return
  sendPresence({ role, viewingSlideId })
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function startHosting(): string {
  const roomCode = generateRoomCode()
  useCollabStore.getState().startHosting(roomCode)
  const newRoom = joinRoom({ appId: APP_ID, relayConfig: { urls: RELAY_URLS } }, roomIdFor(roomCode))
  attachRoom(newRoom, 'host')
  return roomCode
}

export function joinAsGuest(roomCode: string) {
  useCollabStore.getState().startJoining()
  const newRoom = joinRoom({ appId: APP_ID, relayConfig: { urls: RELAY_URLS } }, roomIdFor(roomCode))
  attachRoom(newRoom, 'guest')
}

export function leaveSession() {
  void room?.leave()
  room = null
  projectSyncAction = null
  presenceAction = null
  useCollabStore.getState().reset()
}
