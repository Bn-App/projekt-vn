import { useProjectStore } from '../../state/projectStore'
import { useCanEditDestructively } from '../collab/collabStore'
import type { Slide } from '../../types/project'

export function SlideCharacterPicker({ slide }: { slide: Slide }) {
  const characters = useProjectStore((s) => s.project.characters)
  const addCharacterToSlide = useProjectStore((s) => s.addCharacterToSlide)
  const removeCharacterFromSlide = useProjectStore((s) => s.removeCharacterFromSlide)
  const updateCharacterOnStage = useProjectStore((s) => s.updateCharacterOnStage)
  const canDelete = useCanEditDestructively()

  const onStageIds = new Set(slide.charactersOnStage.map((c) => c.characterId))
  const available = characters.filter((c) => !onStageIds.has(c.id))

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Figuren auf dieser Folie</h3>
      {characters.length === 0 && <p className="text-xs text-slate-400">Noch keine Figuren angelegt (Tab "Cast").</p>}

      <div className="space-y-1.5">
        {slide.charactersOnStage.map((onStage) => {
          const character = characters.find((c) => c.id === onStage.characterId)
          if (!character) return null
          const expressions = Object.keys(character.sprites)
          return (
            <div key={onStage.characterId} className="flex items-center gap-1.5 rounded border border-slate-200 p-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: character.color }} />
              <span className="flex-1 truncate text-sm">{character.name}</span>
              <select
                value={onStage.expression}
                onChange={(e) => updateCharacterOnStage(slide.id, character.id, { expression: e.target.value })}
                className="rounded border border-slate-200 bg-white px-1 py-0.5 text-xs"
              >
                {expressions.length === 0 && <option value={onStage.expression}>{onStage.expression}</option>}
                {expressions.map((expr) => (
                  <option key={expr} value={expr}>
                    {expr}
                  </option>
                ))}
              </select>
              {canDelete && (
                <button
                  onClick={() => removeCharacterFromSlide(slide.id, character.id)}
                  className="px-1 text-xs text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>

      {available.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && addCharacterToSlide(slide.id, e.target.value)}
          className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
        >
          <option value="">+ Figur auf die Bühne stellen…</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
