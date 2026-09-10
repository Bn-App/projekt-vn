import { useRef } from 'react'
import { useProjectStore, useSelectedSlide } from '../../state/projectStore'
import { useEditorUiStore } from '../../state/editorUiStore'
import { StageCharacter } from './StageCharacter'
import { StageBackground } from './StageBackground'
import { StageDialogueBox } from './StageDialogueBox'
import { ChoiceOverlay } from './ChoiceOverlay'
import { TitleCard } from './TitleCard'

export function StageCanvas() {
  const slide = useSelectedSlide()
  const characters = useProjectStore((s) => s.project.characters)
  const background = useProjectStore((s) => s.project.backgrounds.find((b) => b.id === slide?.backgroundId))
  const dialogueFontSizePx = useProjectStore((s) => s.project.dialogueFontSizePx)
  const selectStageCharacter = useEditorUiStore((s) => s.selectStageCharacter)
  const stageRef = useRef<HTMLDivElement>(null)

  if (!slide) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        Wähle links eine Folie aus oder erstelle eine neue.
      </div>
    )
  }

  const firstLine = slide.dialogueLines[0]
  const speaker = firstLine?.speakerCharacterId
    ? characters.find((c) => c.id === firstLine.speakerCharacterId)
    : null

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-900 p-6">
      <div
        ref={stageRef}
        onClick={() => selectStageCharacter(null)}
        className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-lg bg-slate-700 shadow-2xl"
      >
        {background?.imageDataUrl ? (
          <StageBackground slide={slide} background={background} stageRef={stageRef} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Kein Hintergrund gewählt
          </div>
        )}

        {slide.charactersOnStage.map((onStage) => {
          const character = characters.find((c) => c.id === onStage.characterId)
          if (!character) return null
          return (
            <StageCharacter
              key={onStage.characterId}
              slideId={slide.id}
              character={character}
              onStage={onStage}
              stageRef={stageRef}
            />
          )
        })}

        {slide.choices && slide.choices.length > 0 ? (
          // pointer-events-none: this is a read-only preview here (editing happens in the Inspector), and it
          // must not block clicks/drags on characters (e.g. the resize handle) that sit underneath it
          <div className="pointer-events-none">
            <ChoiceOverlay choices={slide.choices} disabled />
          </div>
        ) : slide.isTitleSlide ? (
          <div className="pointer-events-none">
            <TitleCard text={slide.titleText ?? ''} />
          </div>
        ) : (
          <StageDialogueBox
            speakerName={speaker?.name ?? null}
            speakerColor={speaker?.color ?? null}
            text={firstLine?.text ?? ''}
            fontSizePx={dialogueFontSizePx}
            stageRef={stageRef}
          />
        )}
      </div>
    </div>
  )
}
