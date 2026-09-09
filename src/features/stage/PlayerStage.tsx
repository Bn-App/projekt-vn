import { DialogueBox } from './DialogueBox'
import { ChoiceOverlay } from './ChoiceOverlay'
import { getAvailableChoices, getCurrentLine } from '../../engine/playerEngine'
import { DEFAULT_CHARACTER_SIZE_PCT, DEFAULT_BACKGROUND_POSITION } from '../../types/project'
import type { Project } from '../../types/project'
import type { PlayerState } from '../../types/runtime'

interface PlayerStageProps {
  project: Project
  state: PlayerState
  onAdvance: () => void
  onChoose: (index: number) => void
}

/**
 * Renders a slide during actual playback (playtest or exported game).
 * Shared by PlaytestOverlay and the exported HTML runtime so both behave and look identical.
 */
export function PlayerStage({ project, state, onAdvance, onChoose }: PlayerStageProps) {
  const slide = project.slides.find((s) => s.id === state.currentSlideId)
  if (!slide) return null

  const background = project.backgrounds.find((b) => b.id === slide.backgroundId)
  const choices = getAvailableChoices(project, state)
  const currentLine = getCurrentLine(project, state)
  const speaker = currentLine?.speakerCharacterId
    ? project.characters.find((c) => c.id === currentLine.speakerCharacterId)
    : null

  return (
    <div
      onClick={choices ? undefined : onAdvance}
      className={`relative aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-slate-700 shadow-2xl ${choices ? '' : 'cursor-pointer'}`}
    >
      {background?.imageDataUrl && (
        <img
          src={background.imageDataUrl}
          alt=""
          className="absolute inset-0 h-full w-full"
          style={{
            objectFit: slide.backgroundFitMode === 'stretch' ? 'fill' : 'cover',
            objectPosition:
              slide.backgroundFitMode === 'stretch'
                ? undefined
                : `${(slide.backgroundPosition ?? DEFAULT_BACKGROUND_POSITION).xPct}% ${(slide.backgroundPosition ?? DEFAULT_BACKGROUND_POSITION).yPct}%`,
          }}
        />
      )}
      {slide.charactersOnStage.map((onStage) => {
        const character = project.characters.find((c) => c.id === onStage.characterId)
        const sprite = character?.sprites[onStage.expression] ?? Object.values(character?.sprites ?? {})[0]
        if (!character || !sprite) return null
        return (
          <img
            key={onStage.characterId}
            src={sprite}
            alt={character.name}
            className="absolute -translate-x-1/2 -translate-y-full select-none drop-shadow-lg"
            style={{
              left: `${onStage.position.xPct}%`,
              top: `${onStage.position.yPct}%`,
              width: `${onStage.sizePct ?? DEFAULT_CHARACTER_SIZE_PCT}%`,
            }}
          />
        )
      })}
      {choices ? (
        <ChoiceOverlay choices={choices} onChoose={onChoose} />
      ) : (
        <DialogueBox
          speakerName={speaker?.name ?? null}
          speakerColor={speaker?.color ?? null}
          text={currentLine?.text ?? ''}
          fontSizePx={project.dialogueFontSizePx}
          layout={project.dialogueBoxLayout}
        />
      )}
    </div>
  )
}
