import { useEffect } from 'react'
import { useProjectStore } from '../../state/projectStore'
import { useCollabStore } from './collabStore'
import { broadcastProject, broadcastPresence, markLocalEdit, isRemoteProject } from './collabSession'

const SYNC_DEBOUNCE_MS = 250

/** keeps the local project store in sync with connected collab peers; a no-op while role is 'solo' */
export function useCollabSync() {
  const role = useCollabStore((s) => s.role)

  useEffect(() => {
    if (role === 'solo') return
    let timeout: number | undefined
    let lastSeenProject = useProjectStore.getState().project
    const unsubscribe = useProjectStore.subscribe((state) => {
      if (state.project === lastSeenProject) return
      lastSeenProject = state.project
      if (isRemoteProject(state.project)) return
      markLocalEdit()
      if (timeout) window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        broadcastProject(useProjectStore.getState().project)
      }, SYNC_DEBOUNCE_MS)
    })
    return () => {
      unsubscribe()
      if (timeout) window.clearTimeout(timeout)
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
