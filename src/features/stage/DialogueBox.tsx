import { NARRATOR_LABEL, DEFAULT_DIALOGUE_FONT_SIZE_PX, DEFAULT_DIALOGUE_BOX_LAYOUT } from '../../types/project'
import type { DialogueBoxLayout } from '../../types/project'

interface DialogueBoxProps {
  speakerName: string | null
  speakerColor: string | null
  text: string
  fontSizePx?: number
  layout?: DialogueBoxLayout
}

export function DialogueBox({ speakerName, speakerColor, text, fontSizePx, layout }: DialogueBoxProps) {
  const { xPct, yPct, widthPct, heightPct } = layout ?? DEFAULT_DIALOGUE_BOX_LAYOUT
  return (
    <div
      className="absolute overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      style={{ left: `${xPct}%`, top: `${yPct}%`, width: `${widthPct}%`, height: `${heightPct}%` }}
    >
      <p
        className="mb-1 text-sm font-bold uppercase tracking-wide"
        style={{ color: speakerColor ?? '#e2e8f0' }}
      >
        {speakerName ?? NARRATOR_LABEL}
      </p>
      <p className="min-h-[2.5em] text-white" style={{ fontSize: `${fontSizePx ?? DEFAULT_DIALOGUE_FONT_SIZE_PX}px` }}>
        {text || '…'}
      </p>
    </div>
  )
}
