import { useEffect, useState } from 'react'
import { useEditorUiStore } from './state/editorUiStore'
import { useProjectStore } from './state/projectStore'
import { OnboardingWizard } from './features/onboarding/OnboardingWizard'
import { EditorLayout } from './EditorLayout'
import { RecoveryPrompt } from './features/persistence/RecoveryPrompt'
import { readAutosave, writeAutosave, clearAutosave } from './features/persistence/autosaveDb'
import type { AutosaveRecord } from './features/persistence/autosaveDb'
import { useCollabStore } from './features/collab/collabStore'
import { joinAsGuest } from './features/collab/collabSession'
import { useCollabSync } from './features/collab/useCollabSync'

const AUTOSAVE_DEBOUNCE_MS = 3000

function getJoinCodeFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('join')
}

export default function App() {
  const view = useEditorUiStore((s) => s.view)
  const [recovery, setRecovery] = useState<AutosaveRecord | null | 'checking'>('checking')
  const [joinCode] = useState(getJoinCodeFromUrl)
  const collabHasSynced = useCollabStore((s) => s.hasSyncedOnce)

  useCollabSync()

  useEffect(() => {
    if (joinCode) {
      useEditorUiStore.getState().setView('editor')
      joinAsGuest(joinCode)
      setRecovery(null)
      return
    }
    readAutosave()
      .then(setRecovery)
      .catch(() => setRecovery(null))
  }, [joinCode])

  useEffect(() => {
    let timeout: number | undefined
    const unsubscribe = useProjectStore.subscribe((state) => {
      if (!state.isDirty) return
      if (timeout) window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        void writeAutosave(state.project)
      }, AUTOSAVE_DEBOUNCE_MS)
    })
    return () => {
      unsubscribe()
      if (timeout) window.clearTimeout(timeout)
    }
  }, [])

  if (recovery === 'checking') return null

  if (recovery) {
    return (
      <RecoveryPrompt
        record={recovery}
        onRestore={() => {
          useProjectStore.getState().loadProject(recovery.project)
          useEditorUiStore.getState().setView('editor')
          setRecovery(null)
        }}
        onDiscard={() => {
          void clearAutosave()
          setRecovery(null)
        }}
      />
    )
  }

  if (joinCode && !collabHasSynced) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        <p className="text-sm">Verbinde mit dem Host…</p>
      </div>
    )
  }

  return view === 'onboarding' ? <OnboardingWizard /> : <EditorLayout />
}
