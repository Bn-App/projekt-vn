import { useProjectStore } from '../../state/projectStore'
import { Button } from '../../components/Button'
import { useCanEditDestructively } from '../collab/collabStore'
import type { Slide } from '../../types/project'

export function TitleSlideEditor({ slide }: { slide: Slide }) {
  const setSlideIsTitleSlide = useProjectStore((s) => s.setSlideIsTitleSlide)
  const setSlideTitleText = useProjectStore((s) => s.setSlideTitleText)
  const canDelete = useCanEditDestructively()
  const isTitleSlide = !!slide.isTitleSlide

  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Startfolie / Titelkarte</h3>
        {isTitleSlide ? (
          canDelete && (
            <button
              onClick={() => setSlideIsTitleSlide(slide.id, false)}
              className="text-xs text-slate-500 underline hover:text-slate-700"
            >
              Deaktivieren
            </button>
          )
        ) : (
          <Button onClick={() => setSlideIsTitleSlide(slide.id, true)}>+ Als Titelkarte verwenden</Button>
        )}
      </div>

      {isTitleSlide ? (
        <div>
          <p className="mb-1 text-xs text-slate-500">
            Wird groß und zentriert angezeigt, wie ein Filmtitel. Hintergrund und Figuren gelten weiterhin.
          </p>
          <textarea
            value={slide.titleText ?? ''}
            onChange={(e) => setSlideTitleText(slide.id, e.target.value)}
            placeholder="z.B. DER GEHEIME WALD"
            rows={3}
            className="w-full resize-none rounded border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Zeigt statt Dialog einen zentrierten Titeltext, z.B. für den Anfang der Geschichte.
        </p>
      )}
    </div>
  )
}
