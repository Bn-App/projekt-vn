import { useProjectStore } from '../../state/projectStore'
import { Button } from '../../components/Button'
import { useCanEditDestructively } from '../collab/collabStore'
import type { Slide } from '../../types/project'

function slideLabel(slide: Slide, index: number): string {
  if (slide.name?.trim()) return `${index + 1}. ${slide.name.trim()}`
  const firstLine = slide.dialogueLines.find((l) => l.text.trim())?.text
  return `${index + 1}. ${firstLine ? firstLine.slice(0, 30) : '(leere Folie)'}`
}

export function ChoiceEditor({ slide }: { slide: Slide }) {
  const slides = useProjectStore((s) => s.project.slides)
  const enableChoices = useProjectStore((s) => s.enableChoices)
  const disableChoices = useProjectStore((s) => s.disableChoices)
  const addChoice = useProjectStore((s) => s.addChoice)
  const updateChoice = useProjectStore((s) => s.updateChoice)
  const removeChoice = useProjectStore((s) => s.removeChoice)
  const addSlide = useProjectStore((s) => s.addSlide)
  const setSlideIsEnding = useProjectStore((s) => s.setSlideIsEnding)
  const setSlideNextSlideId = useProjectStore((s) => s.setSlideNextSlideId)
  const canDelete = useCanEditDestructively()

  const hasChoices = !!slide.choices
  const hasCustomNext = slide.nextSlideId !== undefined
  const isAutomatic = !hasCustomNext && !slide.isEnding

  function createLinkedSlide(choiceIndex: number) {
    const newId = addSlide(slide.id)
    updateChoice(slide.id, choiceIndex, { targetSlideId: newId })
  }

  return (
    <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/50 p-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700">Antworten &amp; Verzweigung</h3>
        {hasChoices ? (
          canDelete && (
            <button onClick={() => disableChoices(slide.id)} className="text-xs text-slate-500 underline hover:text-slate-700">
              Deaktivieren
            </button>
          )
        ) : (
          <Button onClick={() => enableChoices(slide.id)}>+ Antworten aktivieren</Button>
        )}
      </div>

      {!hasChoices && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Was passiert, wenn der Dialog dieser Folie zu Ende ist? Aktiviere stattdessen Antworten, um dem Spieler
            eine Wahl zu geben, die die Geschichte verzweigt.
          </p>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="radio"
                name={`slide-flow-${slide.id}`}
                checked={isAutomatic}
                onChange={() => {
                  setSlideIsEnding(slide.id, false)
                  setSlideNextSlideId(slide.id, null)
                }}
              />
              Automatisch zur nächsten Folie in der Liste
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="radio"
                name={`slide-flow-${slide.id}`}
                checked={hasCustomNext}
                onChange={() => setSlideNextSlideId(slide.id, '')}
              />
              Weiter mit bestimmter Folie
            </label>
            {hasCustomNext && (
              <select
                value={slide.nextSlideId}
                onChange={(e) => setSlideNextSlideId(slide.id, e.target.value)}
                className="ml-5 rounded border border-slate-200 bg-white px-1.5 py-1 text-xs"
              >
                <option value="">– Folie wählen –</option>
                {slides
                  .filter((s) => s.id !== slide.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {slideLabel(s, slides.indexOf(s))}
                    </option>
                  ))}
              </select>
            )}
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="radio"
                name={`slide-flow-${slide.id}`}
                checked={!!slide.isEnding}
                onChange={() => setSlideIsEnding(slide.id, true)}
              />
              Dies ist ein Ende der Geschichte
            </label>
          </div>
        </div>
      )}

      {hasChoices && (
        <div className="space-y-2">
          {slide.choices!.map((choice, i) => (
            <div key={i} className="space-y-1 rounded border border-amber-200 bg-white p-2">
              <div className="flex items-center gap-1">
                <input
                  value={choice.text}
                  onChange={(e) => updateChoice(slide.id, i, { text: e.target.value })}
                  placeholder="Antworttext, z.B. „Ich vertraue dir“"
                  className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                />
                {canDelete && (
                  <button onClick={() => removeChoice(slide.id, i)} className="px-1 text-xs text-red-400 hover:text-red-600">
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">führt zu</span>
                <select
                  value={choice.targetSlideId}
                  onChange={(e) => updateChoice(slide.id, i, { targetSlideId: e.target.value })}
                  className="flex-1 rounded border border-slate-200 bg-white px-1.5 py-1 text-xs"
                >
                  <option value="">– Folie wählen –</option>
                  {slides.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      {slideLabel(s, idx)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => createLinkedSlide(i)}
                  className="whitespace-nowrap text-xs text-indigo-600 underline hover:text-indigo-800"
                >
                  + Neue Folie
                </button>
              </div>
            </div>
          ))}
          <Button onClick={() => addChoice(slide.id)}>+ Weitere Antwort</Button>
        </div>
      )}
    </div>
  )
}
