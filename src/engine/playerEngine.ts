import type { Project, Slide, Choice, DialogueLine } from '../types/project'
import type { PlayerState, PlayerAction } from '../types/runtime'

function getSlide(project: Project, slideId: string): Slide | undefined {
  return project.slides.find((s) => s.id === slideId)
}

function getSlideIndex(project: Project, slideId: string): number {
  return project.slides.findIndex((s) => s.id === slideId)
}

function startsAwaitingChoice(slide: Slide | undefined): boolean {
  // a slide with choices but no dialogue lines has nothing to read first, so the
  // choice prompt is available immediately; otherwise the player must advance
  // past the last line before choices are exposed (see getAvailableChoices).
  return !!slide && !!slide.choices && slide.choices.length > 0 && slide.dialogueLines.length === 0
}

export function getInitialState(project: Project): PlayerState {
  const first = project.slides[0]
  return {
    currentSlideId: first?.id ?? '',
    lineIndex: 0,
    history: first ? [first.id] : [],
    isEnded: !first,
    awaitingChoice: startsAwaitingChoice(first),
  }
}

/** Choices this slide currently presents to the player, or null if the slide auto-advances instead. */
export function getAvailableChoices(project: Project, state: PlayerState): Choice[] | null {
  if (state.isEnded) return null
  const slide = getSlide(project, state.currentSlideId)
  if (!slide || !slide.choices || slide.choices.length === 0) return null
  return state.awaitingChoice ? slide.choices : null
}

export function getCurrentLine(project: Project, state: PlayerState): DialogueLine | null {
  const slide = getSlide(project, state.currentSlideId)
  if (!slide) return null
  return slide.dialogueLines[state.lineIndex] ?? null
}

function goToSlide(project: Project, state: PlayerState, targetSlideId: string): PlayerState {
  const target = getSlide(project, targetSlideId)
  if (!target) {
    return { ...state, isEnded: true }
  }
  return {
    currentSlideId: target.id,
    lineIndex: 0,
    history: [...state.history, target.id],
    isEnded: false,
    awaitingChoice: startsAwaitingChoice(target),
  }
}

export function reduce(project: Project, state: PlayerState, action: PlayerAction): PlayerState {
  if (action.type === 'RESTART') {
    return getInitialState(project)
  }

  if (state.isEnded) return state
  const slide = getSlide(project, state.currentSlideId)
  if (!slide) return { ...state, isEnded: true }

  if (action.type === 'CHOOSE') {
    const choices = getAvailableChoices(project, state)
    const choice = choices?.[action.choiceIndex]
    if (!choice) return state // guarded no-op: no choices available or invalid index
    return goToSlide(project, state, choice.targetSlideId)
  }

  // ADVANCE_LINE
  if (state.awaitingChoice) {
    return state // must resolve the choice first
  }

  // a title slide has no dialogue of its own to step through - any advance moves straight past it
  const hasMoreLines = !slide.isTitleSlide && state.lineIndex < slide.dialogueLines.length - 1
  if (hasMoreLines) {
    return { ...state, lineIndex: state.lineIndex + 1 }
  }

  // last line of the slide reached
  if (slide.choices && slide.choices.length > 0) {
    return { ...state, awaitingChoice: true }
  }

  // author-marked ending takes priority over falling through to the next slide
  if (slide.isEnding) {
    return { ...state, isEnded: true }
  }

  // explicit "goto slide" override takes priority over array order
  if (slide.nextSlideId) {
    return goToSlide(project, state, slide.nextSlideId)
  }

  // linear default: move to the next slide in array order
  const currentIndex = getSlideIndex(project, state.currentSlideId)
  const next = project.slides[currentIndex + 1]
  if (!next) {
    return { ...state, isEnded: true }
  }
  return goToSlide(project, state, next.id)
}
