import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProjectStore } from '../../state/projectStore'
import { useEditorUiStore } from '../../state/editorUiStore'
import { useCanEditDestructively } from '../collab/collabStore'
import { PresenceDots } from '../collab/PresenceDot'
import { SLIDE_COLOR_TAGS } from '../../types/project'
import type { Slide } from '../../types/project'

interface SlideThumbnailProps {
  slide: Slide
  index: number
  isSelected: boolean
}

export function SlideThumbnail({ slide, index, isSelected }: SlideThumbnailProps) {
  const background = useProjectStore((s) => s.project.backgrounds.find((b) => b.id === slide.backgroundId))
  const selectSlide = useProjectStore((s) => s.selectSlide)
  const duplicateSlide = useProjectStore((s) => s.duplicateSlide)
  const removeSlide = useProjectStore((s) => s.removeSlide)
  const setSlideSectionTitle = useProjectStore((s) => s.setSlideSectionTitle)
  const setSlideColorTag = useProjectStore((s) => s.setSlideColorTag)
  const closeSlidesPanel = useEditorUiStore((s) => s.closeSlidesPanel)
  const canDelete = useCanEditDestructively()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const firstLine = slide.dialogueLines.find((l) => l.text.trim())?.text ?? '(leer)'
  const name = slide.name?.trim()
  const hasChoices = !!slide.choices && slide.choices.length > 0
  const isEnding = !!slide.isEnding && !hasChoices
  const hasCustomNext = !hasChoices && !isEnding && slide.nextSlideId !== undefined

  return (
    <div ref={setNodeRef} style={style}>
      {slide.sectionTitle !== undefined && (
        <div className="mb-1 mt-2 flex items-center gap-1 px-1 first:mt-0">
          <input
            key={slide.id}
            defaultValue={slide.sectionTitle}
            onBlur={(e) => setSlideSectionTitle(slide.id, e.target.value)}
            placeholder="Überschrift"
            className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-500 hover:border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
          {canDelete && (
            <button
              onClick={() => setSlideSectionTitle(slide.id, null)}
              title="Überschrift entfernen"
              className="text-xs text-slate-300 hover:text-red-500"
            >
              ✕
            </button>
          )}
        </div>
      )}
      <div
        onClick={() => {
          selectSlide(slide.id)
          closeSlidesPanel()
        }}
        className={`group relative cursor-pointer rounded-md border-2 p-1.5 ${
          isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-white hover:border-slate-200'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {slide.colorTag && (
            <span
              className="h-8 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: slide.colorTag }}
              title="Farbmarkierung"
            />
          )}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none px-0.5 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
            title="Verschieben"
          >
            ⠿
          </button>
          <span className="w-5 shrink-0 text-xs font-medium text-slate-400">{index + 1}</span>
          <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded bg-slate-200">
            {background?.imageDataUrl && (
              <img src={background.imageDataUrl} alt="" className="h-full w-full object-cover" />
            )}
            <PresenceDots slideId={slide.id} />
            {slide.isTitleSlide && (
              <span className="absolute bottom-0.5 left-0.5 rounded bg-indigo-600 px-1 text-[10px] font-bold text-white" title="Titelkarte">
                🎬
              </span>
            )}
            {hasChoices && (
              <span className="absolute right-0.5 top-0.5 rounded bg-amber-400 px-1 text-[10px] font-bold text-white" title="Enthält Antwortmöglichkeiten">
                🔀
              </span>
            )}
            {isEnding && (
              <span className="absolute right-0.5 top-0.5 rounded bg-slate-700 px-1 text-[10px] font-bold text-white" title="Ende der Geschichte">
                🏁
              </span>
            )}
            {hasCustomNext && (
              <span className="absolute right-0.5 top-0.5 rounded bg-sky-500 px-1 text-[10px] font-bold text-white" title="Springt zu einer bestimmten Folie">
                ➡️
              </span>
            )}
          </div>
          <p className="line-clamp-2 flex-1 text-xs text-slate-600">
            {name && <span className="font-semibold text-slate-700">{name}</span>}
            {name && ' — '}
            {firstLine}
          </p>
        </div>
        {/* visible on hover (mouse) OR when selected (tap-to-select on touch devices, which have no hover) */}
        <div className={`mt-1 flex-col gap-1 group-hover:flex ${isSelected ? 'flex' : 'hidden'}`}>
          <div className="flex items-center gap-1">
            {SLIDE_COLOR_TAGS.map((color) => (
              <button
                key={color}
                onClick={(e) => {
                  e.stopPropagation()
                  setSlideColorTag(slide.id, slide.colorTag === color ? null : color)
                }}
                title="Farbe zuweisen"
                className={`h-3.5 w-3.5 shrink-0 rounded-full ${
                  slide.colorTag === color ? 'ring-2 ring-offset-1 ring-slate-500' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            {slide.colorTag && canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSlideColorTag(slide.id, null)
                }}
                title="Farbmarkierung entfernen"
                className="text-[10px] text-slate-400 hover:text-red-500"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex justify-end gap-1">
            {slide.sectionTitle === undefined && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSlideSectionTitle(slide.id, 'Neue Überschrift')
                }}
                className="mr-auto rounded px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100"
              >
                + Überschrift
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                duplicateSlide(slide.id)
              }}
              className="rounded px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100"
            >
              Duplizieren
            </button>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeSlide(slide.id)
                }}
                className="rounded px-1.5 py-0.5 text-[11px] text-red-500 hover:bg-red-50"
              >
                Löschen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
