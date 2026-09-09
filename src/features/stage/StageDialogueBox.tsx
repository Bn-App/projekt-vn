import { useProjectStore } from '../../state/projectStore'
import { DialogueBox } from './DialogueBox'
import {
  DEFAULT_DIALOGUE_BOX_LAYOUT,
  MIN_DIALOGUE_BOX_WIDTH_PCT,
  MIN_DIALOGUE_BOX_HEIGHT_PCT,
} from '../../types/project'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

interface StageDialogueBoxProps {
  speakerName: string | null
  speakerColor: string | null
  text: string
  fontSizePx?: number
  stageRef: React.RefObject<HTMLDivElement | null>
}

/** editor-only wrapper around DialogueBox that lets the author drag it around and resize it on the stage */
export function StageDialogueBox({ speakerName, speakerColor, text, fontSizePx, stageRef }: StageDialogueBoxProps) {
  const layout = useProjectStore((s) => s.project.dialogueBoxLayout) ?? DEFAULT_DIALOGUE_BOX_LAYOUT
  const setDialogueBoxLayout = useProjectStore((s) => s.setDialogueBoxLayout)

  function handleMovePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    const stage = stageRef.current
    if (!stage) return
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    const startLayout = layout

    function handleMove(ev: PointerEvent) {
      const rect = stage!.getBoundingClientRect()
      const deltaXPct = ((ev.clientX - startX) / rect.width) * 100
      const deltaYPct = ((ev.clientY - startY) / rect.height) * 100
      const xPct = clamp(startLayout.xPct + deltaXPct, 0, 100 - startLayout.widthPct)
      const yPct = clamp(startLayout.yPct + deltaYPct, 0, 100 - startLayout.heightPct)
      setDialogueBoxLayout({ ...startLayout, xPct, yPct })
    }
    function stopDragging() {
      target.removeEventListener('pointermove', handleMove)
      target.removeEventListener('pointerup', stopDragging)
      target.removeEventListener('pointercancel', stopDragging)
    }
    target.addEventListener('pointermove', handleMove)
    target.addEventListener('pointerup', stopDragging)
    target.addEventListener('pointercancel', stopDragging)
  }

  function handleResizePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    const stage = stageRef.current
    if (!stage) return
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    const startLayout = layout

    function handleMove(ev: PointerEvent) {
      const rect = stage!.getBoundingClientRect()
      const deltaWidthPct = ((ev.clientX - startX) / rect.width) * 100
      const deltaHeightPct = ((ev.clientY - startY) / rect.height) * 100
      const widthPct = clamp(startLayout.widthPct + deltaWidthPct, MIN_DIALOGUE_BOX_WIDTH_PCT, 100 - startLayout.xPct)
      const heightPct = clamp(
        startLayout.heightPct + deltaHeightPct,
        MIN_DIALOGUE_BOX_HEIGHT_PCT,
        100 - startLayout.yPct,
      )
      setDialogueBoxLayout({ ...startLayout, widthPct, heightPct })
    }
    function stopDragging() {
      target.removeEventListener('pointermove', handleMove)
      target.removeEventListener('pointerup', stopDragging)
      target.removeEventListener('pointercancel', stopDragging)
    }
    target.addEventListener('pointermove', handleMove)
    target.addEventListener('pointerup', stopDragging)
    target.addEventListener('pointercancel', stopDragging)
  }

  return (
    <div
      onPointerDown={handleMovePointerDown}
      className="group absolute cursor-move touch-none"
      style={{
        left: `${layout.xPct}%`,
        top: `${layout.yPct}%`,
        width: `${layout.widthPct}%`,
        height: `${layout.heightPct}%`,
      }}
    >
      <div className="pointer-events-none h-full w-full outline-dashed outline-2 outline-offset-[-2px] outline-transparent group-hover:outline-indigo-400">
        <DialogueBox
          speakerName={speakerName}
          speakerColor={speakerColor}
          text={text}
          fontSizePx={fontSizePx}
          layout={{ xPct: 0, yPct: 0, widthPct: 100, heightPct: 100 }}
        />
      </div>
      {/* larger-than-it-looks hit area, same forgiving-touch-target idea as the character resize handle */}
      <div
        onPointerDown={handleResizePointerDown}
        title="Ziehen zum Vergrößern/Verkleinern"
        className="absolute -bottom-4 -right-4 flex h-9 w-9 cursor-nwse-resize touch-none items-center justify-center opacity-0 group-hover:opacity-100"
      >
        <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-500 shadow" />
      </div>
    </div>
  )
}
