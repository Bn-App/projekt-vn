import { useProjectStore } from '../../state/projectStore'
import { Button } from '../../components/Button'
import { TextInput } from '../../components/TextInput'
import { ImageDropzone } from '../../components/ImageDropzone'
import { useCanEditDestructively } from '../collab/collabStore'

export function BackgroundManager() {
  const backgrounds = useProjectStore((s) => s.project.backgrounds)
  const addBackground = useProjectStore((s) => s.addBackground)
  const updateBackground = useProjectStore((s) => s.updateBackground)
  const removeBackground = useProjectStore((s) => s.removeBackground)
  const canDelete = useCanEditDestructively()

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {backgrounds.map((bg) => (
          <div key={bg.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <ImageDropzone
              value={bg.imageDataUrl}
              onChange={(url) => updateBackground(bg.id, { imageDataUrl: url })}
              className="aspect-video w-full"
              variant="background"
            />
            <TextInput
              value={bg.name}
              onChange={(e) => updateBackground(bg.id, { name: e.target.value })}
              placeholder="Name des Hintergrunds"
            />
            <textarea
              value={bg.description ?? ''}
              onChange={(e) => updateBackground(bg.id, { description: e.target.value })}
              placeholder="Beschreibung dieser Location (nur für dich)…"
              rows={2}
              className="w-full resize-none rounded border border-slate-200 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            />
            {canDelete && (
              <Button variant="danger" className="w-full" onClick={() => removeBackground(bg.id)}>
                Entfernen
              </Button>
            )}
          </div>
        ))}
        <button
          onClick={() => addBackground({ name: `Hintergrund ${backgrounds.length + 1}`, imageDataUrl: '' })}
          className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-400 hover:border-indigo-400 hover:text-indigo-500"
        >
          <span className="text-2xl leading-none">+</span>
          Neuer Hintergrund
        </button>
      </div>
    </div>
  )
}
