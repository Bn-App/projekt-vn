import { useEffect } from 'react'
import { useEditorUiStore } from './state/editorUiStore'
import { useProjectStore } from './state/projectStore'
import { SlideList } from './features/slideList/SlideList'
import { StageCanvas } from './features/stage/StageCanvas'
import { InspectorPanel } from './features/inspector/InspectorPanel'
import { CharacterManager } from './features/library/CharacterManager'
import { BackgroundManager } from './features/library/BackgroundManager'
import { PlaytestOverlay } from './features/playtest/PlaytestOverlay'
import { Button } from './components/Button'
import { exportProjectAsHtml } from './export/html/exportHtml'
import { exportProjectAsPptx } from './export/pptx/exportPptx'
import { exportProjectAsScriptPdf } from './export/pdf/exportPdf'
import { useProjectPersistence } from './features/persistence/useProjectPersistence'
import { ShareButton } from './features/collab/ShareButton'
import { CollabStatusBadge } from './features/collab/CollabStatusBadge'
import { useCanEditDestructively } from './features/collab/collabStore'
import type { EditorTab } from './state/editorUiStore'

const TABS: { id: EditorTab; label: string }[] = [
  { id: 'slides', label: 'Folien' },
  { id: 'cast', label: 'Cast' },
  { id: 'backgrounds', label: 'Hintergründe' },
]

export function EditorLayout() {
  const activeTab = useEditorUiStore((s) => s.activeTab)
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab)
  const isPlaytestOpen = useEditorUiStore((s) => s.isPlaytestOpen)
  const openPlaytest = useEditorUiStore((s) => s.openPlaytest)
  const isSlidesPanelOpen = useEditorUiStore((s) => s.isSlidesPanelOpen)
  const isInspectorPanelOpen = useEditorUiStore((s) => s.isInspectorPanelOpen)
  const openSlidesPanel = useEditorUiStore((s) => s.openSlidesPanel)
  const openInspectorPanel = useEditorUiStore((s) => s.openInspectorPanel)
  const closeSlidesPanel = useEditorUiStore((s) => s.closeSlidesPanel)
  const closeInspectorPanel = useEditorUiStore((s) => s.closeInspectorPanel)
  const project = useProjectStore((s) => s.project)
  const isDirty = useProjectStore((s) => s.isDirty)
  const { save, saveAs, open, newProject, canSaveInPlace } = useProjectPersistence()
  const canReset = useCanEditDestructively()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [save])

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 flex-col gap-2 border-b border-slate-200 bg-white px-4 py-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 lg:gap-4">
          {activeTab === 'slides' && (
            <button
              onClick={openSlidesPanel}
              className="shrink-0 rounded p-1.5 text-lg leading-none text-slate-500 hover:bg-slate-100 lg:hidden"
              title="Folien anzeigen"
            >
              ☰
            </button>
          )}
          <h1 className="shrink-0 whitespace-nowrap text-sm font-bold text-slate-900">
            Visual Novel Editor{isDirty ? ' •' : ''}
          </h1>
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          {activeTab === 'slides' && (
            <button
              onClick={openInspectorPanel}
              className="ml-auto shrink-0 rounded p-1.5 text-lg leading-none text-slate-500 hover:bg-slate-100 lg:hidden"
              title="Bearbeiten anzeigen"
            >
              ✏️
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <CollabStatusBadge />
          <ShareButton />
          {canReset && (
            <Button variant="ghost" className="shrink-0" onClick={newProject}>
              Neu
            </Button>
          )}
          {canReset && (
            <Button variant="ghost" className="shrink-0" onClick={() => void open()}>
              Öffnen…
            </Button>
          )}
          <Button variant="secondary" className="shrink-0" onClick={() => void save()} title={canSaveInPlace ? 'Strg+S' : undefined}>
            Speichern
          </Button>
          {canSaveInPlace && (
            <Button variant="ghost" className="shrink-0" onClick={() => void saveAs()}>
              Speichern unter…
            </Button>
          )}
          <Button
            variant="secondary"
            className="shrink-0"
            onClick={() => exportProjectAsHtml(project)}
            disabled={project.slides.length === 0}
          >
            ⭳ Als HTML exportieren
          </Button>
          <Button
            variant="ghost"
            className="shrink-0"
            onClick={() => void exportProjectAsPptx(project)}
            disabled={project.slides.length === 0}
            title="Lineares Storyboard – Verzweigungen sind hier nicht interaktiv, nur als Text sichtbar"
          >
            ⭳ Als PPTX (Storyboard)
          </Button>
          <Button
            variant="ghost"
            className="shrink-0"
            onClick={() => exportProjectAsScriptPdf(project)}
            disabled={project.slides.length === 0}
            title="Figuren, Locations und der gesamte Dialogtext als druckbares Manuskript"
          >
            ⭳ Als PDF (Manuskript)
          </Button>
          <Button variant="primary" className="shrink-0" onClick={openPlaytest} disabled={project.slides.length === 0}>
            ▶ Playtest
          </Button>
        </div>
      </header>

      <main className="relative flex flex-1 overflow-hidden">
        {activeTab === 'slides' && (
          <>
            {(isSlidesPanelOpen || isInspectorPanelOpen) && (
              <div
                onClick={() => {
                  closeSlidesPanel()
                  closeInspectorPanel()
                }}
                className="fixed inset-0 z-20 bg-black/30 lg:hidden"
              />
            )}
            <SlideList />
            <StageCanvas />
            <InspectorPanel />
          </>
        )}
        {activeTab === 'cast' && (
          <div className="w-full overflow-y-auto p-6">
            <CharacterManager />
          </div>
        )}
        {activeTab === 'backgrounds' && (
          <div className="w-full overflow-y-auto p-6">
            <BackgroundManager />
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-2 text-center text-xs text-slate-500">© B. Bruns</footer>
      {isPlaytestOpen && <PlaytestOverlay />}
    </div>
  )
}
