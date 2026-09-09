import { useProjectStore } from '../../state/projectStore'
import { Button } from '../../components/Button'
import { TextInput } from '../../components/TextInput'
import { ImageDropzone } from '../../components/ImageDropzone'
import { useCanEditDestructively } from '../collab/collabStore'
import { DEFAULT_EXPRESSION } from '../../types/project'
import type { Character } from '../../types/project'

const RANDOM_COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

function randomColor(): string {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]
}

function CharacterCard({ character }: { character: Character }) {
  const updateCharacter = useProjectStore((s) => s.updateCharacter)
  const removeCharacter = useProjectStore((s) => s.removeCharacter)
  const setCharacterSprite = useProjectStore((s) => s.setCharacterSprite)
  const removeCharacterSprite = useProjectStore((s) => s.removeCharacterSprite)
  const renameCharacterSprite = useProjectStore((s) => s.renameCharacterSprite)
  const canDelete = useCanEditDestructively()

  const expressions = Object.entries(character.sprites)
  const nextAutoExpressionName = expressions.length === 0 ? DEFAULT_EXPRESSION : `ausdruck-${expressions.length + 1}`

  return (
    <div className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <input
        type="color"
        value={character.color}
        onChange={(e) => updateCharacter(character.id, { color: e.target.value })}
        className="h-10 w-10 shrink-0 cursor-pointer rounded border border-slate-300"
        title="Farbe im Dialogfeld"
      />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <TextInput
            value={character.name}
            onChange={(e) => updateCharacter(character.id, { name: e.target.value })}
            placeholder="Name der Figur"
            className="max-w-xs"
          />
          {canDelete && (
            <Button variant="danger" onClick={() => removeCharacter(character.id)}>
              Entfernen
            </Button>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Charakterisierung (nur für dich, nicht im Spiel sichtbar)</p>
          <textarea
            value={character.description ?? ''}
            onChange={(e) => updateCharacter(character.id, { description: e.target.value })}
            placeholder="z.B. Hintergrund, Motivation, Sprechweise…"
            rows={2}
            className="w-full resize-none rounded border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-500">Ausdrücke / Sprites</p>
          <div className="flex flex-wrap gap-3">
            {expressions.map(([expr, dataUrl]) => (
              <div key={expr} className="flex flex-col items-center gap-1">
                <ImageDropzone
                  value={dataUrl}
                  onChange={(url) => setCharacterSprite(character.id, expr, url)}
                  className="h-20 w-20"
                  label={expr}
                />
                <div className="flex items-center gap-1">
                  <input
                    key={expr}
                    defaultValue={expr}
                    onBlur={(e) => {
                      if (e.target.value === expr) return
                      renameCharacterSprite(character.id, expr, e.target.value)
                      const stillOld = useProjectStore
                        .getState()
                        .project.characters.find((c) => c.id === character.id)?.sprites[expr]
                      if (stillOld !== undefined) {
                        // rename was rejected (empty name or duplicate) - revert the stray typed text
                        e.target.value = expr
                      }
                    }}
                    className="w-16 rounded border border-slate-200 px-1 py-0.5 text-center text-xs"
                    title="Name des Ausdrucks (zum Umbenennen klicken)"
                  />
                  {canDelete && (
                    <button
                      onClick={() => removeCharacterSprite(character.id, expr)}
                      className="text-slate-400 hover:text-red-500"
                      title="Ausdruck entfernen"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1">
              <ImageDropzone
                value={null}
                onChange={(url) => setCharacterSprite(character.id, nextAutoExpressionName, url)}
                className="h-20 w-20"
                label="+ Ausdruck"
              />
              <span className="text-xs text-slate-400">{nextAutoExpressionName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CharacterManager() {
  const characters = useProjectStore((s) => s.project.characters)
  const addCharacter = useProjectStore((s) => s.addCharacter)

  return (
    <div className="space-y-3">
      {characters.map((c) => (
        <CharacterCard key={c.id} character={c} />
      ))}
      <Button
        variant="primary"
        onClick={() => addCharacter({ name: `Figur ${characters.length + 1}`, color: randomColor() })}
      >
        + Neue Figur
      </Button>
    </div>
  )
}
