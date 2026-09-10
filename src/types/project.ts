export interface Character {
  id: string
  name: string
  color: string
  /** expressionKey (e.g. "neutral", "happy") -> image data URL */
  sprites: Record<string, string>
  /** author-only note, never shown in the exported game; included in the PDF manuscript export */
  description?: string
}

export interface Background {
  id: string
  name: string
  imageDataUrl: string
  /** author-only note, never shown in the exported game; included in the PDF manuscript export */
  description?: string
}

export interface CharacterOnStage {
  characterId: string
  expression: string
  /** percentage coordinates (0-100), resolution independent */
  position: { xPct: number; yPct: number }
  /** width as a percentage of the stage width; defaults to DEFAULT_CHARACTER_SIZE_PCT when undefined */
  sizePct?: number
}

export interface DialogueLine {
  /** null = Narrator */
  speakerCharacterId: string | null
  text: string
}

export interface Choice {
  text: string
  targetSlideId: string
}

export interface Slide {
  id: string
  /** optional author-facing label, shown in the slide list, target dropdowns, and the PDF manuscript */
  name?: string
  /** optional color tag for visually grouping slides in the slide list (e.g. by branch) */
  colorTag?: string
  backgroundId: string | null
  charactersOnStage: CharacterOnStage[]
  dialogueLines: DialogueLine[]
  /** if present (even empty array), this slide ends in a player choice instead of auto-advancing */
  choices?: Choice[]
  /** 'cover' (default): crop-to-fill, draggable via backgroundPosition. 'stretch': fill exactly, distorting aspect ratio. */
  backgroundFitMode?: 'cover' | 'stretch'
  /** percentage (0-100) used as CSS object-position when backgroundFitMode is 'cover'; defaults to centered */
  backgroundPosition?: { xPct: number; yPct: number }
  /** shown as a heading above this slide in the slide list, to group it and following slides into a labeled section */
  sectionTitle?: string
  /** if true and this slide has no active choices, the story ends here instead of auto-advancing to the next slide */
  isEnding?: boolean
  /**
   * Explicit override for which slide plays next when this slide has no active choices, instead of
   * relying on array order. `undefined` = automatic (next slide in the list). `''` = this mode is
   * selected but no target has been chosen yet (flagged by validation). Ignored if choices or isEnding are set.
   */
  nextSlideId?: string
  /** if true, this slide shows a centered title card (e.g. a movie-style title) instead of the dialogue box */
  isTitleSlide?: boolean
  /** text shown on the title card; supports line breaks */
  titleText?: string
}

export interface DialogueBoxLayout {
  /** percentage coordinates (0-100) of the box's top-left corner, resolution independent */
  xPct: number
  yPct: number
  /** size as a percentage of the stage width/height */
  widthPct: number
  heightPct: number
}

export interface Project {
  characters: Character[]
  backgrounds: Background[]
  slides: Slide[]
  /** font size (px) for the dialogue box text, applies to the whole story; defaults to DEFAULT_DIALOGUE_FONT_SIZE_PX */
  dialogueFontSizePx?: number
  /** position/size of the dialogue box, applies to the whole story; defaults to DEFAULT_DIALOGUE_BOX_LAYOUT */
  dialogueBoxLayout?: DialogueBoxLayout
}

export function createEmptyProject(): Project {
  return { characters: [], backgrounds: [], slides: [] }
}

export const NARRATOR_LABEL = 'Erzähler'
export const DEFAULT_EXPRESSION = 'neutral'
export const DEFAULT_CHARACTER_SIZE_PCT = 28
export const DEFAULT_BACKGROUND_POSITION = { xPct: 50, yPct: 50 }
export const DEFAULT_DIALOGUE_FONT_SIZE_PX = 18
export const DEFAULT_DIALOGUE_BOX_LAYOUT: DialogueBoxLayout = { xPct: 0, yPct: 75, widthPct: 100, heightPct: 25 }
export const MIN_DIALOGUE_BOX_WIDTH_PCT = 20
export const MIN_DIALOGUE_BOX_HEIGHT_PCT = 12
export const DIALOGUE_FONT_SIZE_PRESETS = [
  { label: 'Klein', px: 14 },
  { label: 'Normal', px: 18 },
  { label: 'Groß', px: 32 },
  { label: 'Sehr groß', px: 48 },
]
/** pastel palette for tagging slides in the slide list, e.g. to group branches by color */
export const SLIDE_COLOR_TAGS = ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4']
