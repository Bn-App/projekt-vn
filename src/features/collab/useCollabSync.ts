import { useEffect } from 'react'
import { useProjectStore } from '../../state/projectStore'
import { useCollabStore } from './collabStore'
import { broadcastProject, broadcastPresence, markLocalEdit, isRemoteProject } from './collabSession'

/**
 * Minimum time between broadcasts. Throttled (immediate-then-trailing), not debounced: a single
 * isolated edit (one keystroke, one click) goes out right away instead of waiting out a fixed delay,
 * and a continuous change (dragging a character or the dialogue box) still streams roughly every
 * SYNC_INTERVAL_MS instead of only appearing once the drag ends - a plain debounce would make the
 * other side see nothing until the mouse button comes back up.
 */
const SYNC_INTERVAL_MS = 120

/** keeps the local project store in sync with connected collab peers; a no-op while role is 'solo' */
export function useCollabSync() {
  const role = useCollabStore((s) => s.role)

  useEffect(() => {
    if (role === 'solo') return
    let lastBroadcastAt = 0
    let trailingTimeout: number | undefined
    let lastSeenProject = useProjectStore.getState().project

    function scheduleBroadcast() {
      const elapsed = Date.now() - lastBroadcastAt
      if (elapsed >= SYNC_INTERVAL_MS) {
        lastBroadcastAt = Date.now()
        broadcastProject(useProjectStore.getState().project)
        return
      }
      if (trailingTimeout) return
      trailingTimeout = window.setTimeout(() => {
        trailingTimeout = undefined
        lastBroadcastAt = Date.now()
        broadcastProject(useProjectStore.getState().project)
      }, SYNC_INTERVAL_MS - elapsed)
    }

    const unsubscribe = useProjectStore.subscribe((state) => {
      if (state.project === lastSeenProject) return
      lastSeenProject = state.project
      if (isRemoteProject(state.project)) return
      markLocalEdit()
      scheduleBroadcast()
    })
    return () => {
      unsubscribe()
      if (trailingTimeout) window.clearTimeout(trailingTimeout)
    }
  }, [role])

  useEffect(() => {
    if (role === 'solo') return
    let lastSlideId = useProjectStore.getState().selectedSlideId
    broadcastPresence(lastSlideId)
    const unsubscribe = useProjectStore.subscribe((state) => {
      if (state.selectedSlideId === lastSlideId) return
      lastSlideId = state.selectedSlideId
      broadcastPresence(lastSlideId)
    })
    return unsubscribe
  }, [role])
}
