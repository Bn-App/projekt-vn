import { useSelectedSlide, useProjectStore } from '../../state/projectStore'
import { useEditorUiStore } from '../../state/editorUiStore'
import { validateProject } from '../../engine/validation'
import { TextInput } from '../../components/TextInput'
import { SlideBackgroundPicker } from './SlideBackgroundPicker'
import { SlideCharacterPicker } from './SlideCharacterPicker'
import { TitleSlideEditor } from './TitleSlideEditor'
import { DialogueEditor } from './DialogueEditor'
import { ChoiceEditor } from './ChoiceEditor'

export function InspectorPanel() {
  const slide = useSelectedSlide()
  const project = useProjectStore((s) => s.project)
  const setSlideName = useProjectStore((s) => s.setSlideName)
  const isOpen = useEditorUiStore((s) => s.isInspectorPanelOpen)
  const closeInspectorPanel = useEditorUiStore((s) => s.closeInspectorPanel)

  const issues = slide ? validateProject(project).filter((issue) => issue.slideId === slide.id) : []

  return (
    <div
      className={`fixed inset-y-0 right-0 z-30 flex w-80 shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 lg:hidden">
        <h2 className="text-sm font-semibold text-slate-700">Bearbeiten</h2>
        <button onClick={closeInspectorPanel} className="text-slate-400 hover:text-slate-700" title="Schließen">
          ✕
        </button>
      </div>
      <div className="space-y-5 p-4">
        {!slide ? (
          <p className="text-sm text-slate-400">Keine Folie ausgewählt.</p>
        ) : (
          <>
            {issues.length > 0 && (
              <div className="space-y-1 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                {issues.map((issue, i) => (
                  <p key={i}>⚠ {issue.message}</p>
                ))}
              </div>
            )}
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Name der Folie</h3>
              <TextInput
                value={slide.name ?? ''}
                onChange={(e) => setSlideName(slide.id, e.target.value)}
                placeholder="z.B. Eingang zur Höhle"
              />
            </div>
            <SlideBackgroundPicker slide={slide} />
            <SlideCharacterPicker slide={slide} />
            <TitleSlideEditor slide={slide} />
            {!slide.isTitleSlide && <DialogueEditor slide={slide} />}
            <ChoiceEditor slide={slide} />
          </>
        )}
      </div>
    </div>
  )
}
