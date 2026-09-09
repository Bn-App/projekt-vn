import { useProjectStore } from '../../state/projectStore'
import { Button } from '../../components/Button'
import { useCanEditDestructively } from '../collab/collabStore'
import { NARRATOR_LABEL, DEFAULT_DIALOGUE_FONT_SIZE_PX, DIALOGUE_FONT_SIZE_PRESETS } from '../../types/project'
import type { Slide } from '../../types/project'

export function DialogueEditor({ slide }: { slide: Slide }) {
  const characters = useProjectStore((s) => s.project.characters)
  const addDialogueLine = useProjectStore((s) => s.addDialogueLine)
  const updateDialogueLine = useProjectStore((s) => s.updateDialogueLine)
  const removeDialogueLine = useProjectStore((s) => s.removeDialogueLine)
  const moveDialogueLine = useProjectStore((s) => s.moveDialogueLine)
  const canDelete = useCanEditDestructively()
  const dialogueFontSizePx = useProjectStore((s) => s.project.dialogueFontSizePx) ?? DEFAULT_DIALOGUE_FONT_SIZE_PX
  const setDialogueFontSize = useProjectStore((s) => s.setDialogueFontSize)
  const resetDialogueBoxLayout = useProjectStore((s) => s.resetDialogueBoxLayout)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dialog</h3>
        <Button onClick={() => addDialogueLine(slide.id)}>+ Zeile</Button>
      </div>

      <div>
        <p className="mb-1 text-xs text-slate-500">Textgröße im Dialogfeld (gilt für die ganze Geschichte)</p>
        <div className="flex gap-1 rounded-md bg-slate-100 p-0.5 text-xs">
          {DIALOGUE_FONT_SIZE_PRESETS.map((preset) => (
            <button
              key={preset.px}
              onClick={() => setDialogueFontSize(preset.px)}
              className={`flex-1 rounded px-1.5 py-1 ${
                dialogueFontSizePx === preset.px ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>Position &amp; Größe: direkt auf der Bühne ziehen (gilt für die ganze Geschichte)</p>
        <button onClick={resetDialogueBoxLayout} className="shrink-0 text-slate-400 underline hover:text-slate-600">
          Zurücksetzen
        </button>
      </div>

      <div className="space-y-2">
        {slide.dialogueLines.map((line, i) => (
          <div key={i} className="space-y-1 rounded-md border border-slate-200 p-2">
            <div className="flex items-center gap-1">
              <select
                value={line.speakerCharacterId ?? ''}
                onChange={(e) => updateDialogueLine(slide.id, i, { speakerCharacterId: e.target.value || null })}
                className="flex-1 rounded border border-slate-200 bg-white px-1.5 py-1 text-xs"
              >
                <option value="">{NARRATOR_LABEL}</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button onClick={() => moveDialogueLine(slide.id, i, -1)} disabled={i === 0} className="px-1 text-xs text-slate-400 hover:text-slate-700 disabled:opacity-30">
                ↑
              </button>
              <button
                onClick={() => moveDialogueLine(slide.id, i, 1)}
                disabled={i === slide.dialogueLines.length - 1}
                className="px-1 text-xs text-slate-400 hover:text-slate-700 disabled:opacity-30"
              >
                ↓
              </button>
              {canDelete && (
                <button
                  onClick={() => removeDialogueLine(slide.id, i)}
                  disabled={slide.dialogueLines.length === 1}
                  className="px-1 text-xs text-red-400 hover:text-red-600 disabled:opacity-30"
                >
                  ✕
                </button>
              )}
            </div>
            <textarea
              value={line.text}
              onChange={(e) => updateDialogueLine(slide.id, i, { text: e.target.value })}
              placeholder="Was wird gesagt?"
              rows={2}
              className="w-full resize-none rounded border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
