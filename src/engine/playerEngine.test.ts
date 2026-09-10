import { describe, it, expect } from 'vitest'
import { getInitialState, reduce, getAvailableChoices, getCurrentLine } from './playerEngine'
import type { Project } from '../types/project'

function slide(
  id: string,
  lines: string[],
  choices?: { text: string; targetSlideId: string }[],
  isEnding?: boolean,
  nextSlideId?: string,
) {
  return {
    id,
    backgroundId: null,
    charactersOnStage: [],
    dialogueLines: lines.map((text) => ({ speakerCharacterId: null, text })),
    ...(choices ? { choices } : {}),
    ...(isEnding ? { isEnding } : {}),
    ...(nextSlideId !== undefined ? { nextSlideId } : {}),
  }
}

describe('playerEngine', () => {
  it('advances linearly through slides to the end', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [slide('a', ['a1', 'a2']), slide('b', ['b1']), slide('c', ['c1'])],
    }
    let state = getInitialState(project)
    expect(state.currentSlideId).toBe('a')

    state = reduce(project, state, { type: 'ADVANCE_LINE' }) // a2
    expect(getCurrentLine(project, state)?.text).toBe('a2')

    state = reduce(project, state, { type: 'ADVANCE_LINE' }) // -> b
    expect(state.currentSlideId).toBe('b')

    state = reduce(project, state, { type: 'ADVANCE_LINE' }) // -> c
    expect(state.currentSlideId).toBe('c')
    expect(state.isEnded).toBe(false)

    state = reduce(project, state, { type: 'ADVANCE_LINE' }) // -> end
    expect(state.isEnded).toBe(true)
  })

  it('requires reading the last line before exposing choices', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [
        slide('a', ['pick one'], [
          { text: 'go left', targetSlideId: 'left' },
          { text: 'go right', targetSlideId: 'right' },
        ]),
        slide('left', ['you went left']),
        slide('right', ['you went right']),
      ],
    }
    let state = getInitialState(project)
    // the line must be shown first, not immediately replaced by the choice prompt
    expect(getCurrentLine(project, state)?.text).toBe('pick one')
    expect(getAvailableChoices(project, state)).toBeNull()

    state = reduce(project, state, { type: 'ADVANCE_LINE' }) // acknowledge the last line
    expect(getAvailableChoices(project, state)).toHaveLength(2)
  })

  it('shows choices immediately when a slide has no dialogue lines of its own', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [slide('a', [], [{ text: 'go', targetSlideId: 'b' }]), slide('b', ['end'])],
    }
    const state = getInitialState(project)
    expect(getAvailableChoices(project, state)).toHaveLength(1)
  })

  it('branches to the chosen target slide', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [
        slide('a', ['pick one'], [
          { text: 'go left', targetSlideId: 'left' },
          { text: 'go right', targetSlideId: 'right' },
        ]),
        slide('left', ['you went left']),
        slide('right', ['you went right']),
      ],
    }
    let state = getInitialState(project)
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    expect(getAvailableChoices(project, state)).toHaveLength(2)

    state = reduce(project, state, { type: 'CHOOSE', choiceIndex: 1 })
    expect(state.currentSlideId).toBe('right')
    expect(getCurrentLine(project, state)?.text).toBe('you went right')
  })

  it('merges two branches back into the same slide', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [
        slide('a', ['pick'], [
          { text: 'opt1', targetSlideId: 'b' },
          { text: 'opt2', targetSlideId: 'c' },
        ]),
        slide('b', ['b1']),
        slide('c', ['c1']),
        slide('d', ['merged']),
      ],
    }
    let state = getInitialState(project)
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    const viaB = reduce(project, state, { type: 'CHOOSE', choiceIndex: 0 })
    expect(viaB.currentSlideId).toBe('b')

    const viaC = reduce(project, state, { type: 'CHOOSE', choiceIndex: 1 })
    expect(viaC.currentSlideId).toBe('c')
  })

  it('does not auto-advance past a slide with unresolved choices', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [slide('a', ['line1'], [{ text: 'go', targetSlideId: 'b' }]), slide('b', ['end'])],
    }
    let state = getInitialState(project)
    state = reduce(project, state, { type: 'ADVANCE_LINE' }) // reveals the choice
    state = reduce(project, state, { type: 'ADVANCE_LINE' }) // no-op, choice pending
    expect(state.currentSlideId).toBe('a')
    expect(getAvailableChoices(project, state)).toHaveLength(1)
  })

  it('guards against an invalid choice index', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [slide('a', ['line1'], [{ text: 'go', targetSlideId: 'b' }]), slide('b', ['end'])],
    }
    let state = getInitialState(project)
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    const result = reduce(project, state, { type: 'CHOOSE', choiceIndex: 99 })
    expect(result.currentSlideId).toBe('a')
  })

  it('detects a dangling target slide id as an ended state', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [slide('a', ['line1'], [{ text: 'go', targetSlideId: 'ghost' }])],
    }
    let state = getInitialState(project)
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    const result = reduce(project, state, { type: 'CHOOSE', choiceIndex: 0 })
    expect(result.isEnded).toBe(true)
  })

  it('supports a cycle without infinite-looping the reducer itself', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [
        slide('a', ['a1'], [{ text: 'loop', targetSlideId: 'b' }]),
        slide('b', ['b1'], [{ text: 'back', targetSlideId: 'a' }]),
      ],
    }
    let state = getInitialState(project)
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    state = reduce(project, state, { type: 'CHOOSE', choiceIndex: 0 })
    expect(state.currentSlideId).toBe('b')
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    state = reduce(project, state, { type: 'CHOOSE', choiceIndex: 0 })
    expect(state.currentSlideId).toBe('a')
    expect(state.history).toEqual(['a', 'b', 'a'])
  })

  it('restarts back to the initial state', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [slide('a', ['a1']), slide('b', ['b1'])],
    }
    let state = getInitialState(project)
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    state = reduce(project, state, { type: 'RESTART' })
    expect(state).toEqual(getInitialState(project))
  })

  it('stops at a slide explicitly marked as an ending, even if later slides exist', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [slide('a', ['this is a bad ending'], undefined, true), slide('b', ['unrelated later slide'])],
    }
    let state = getInitialState(project)
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    expect(state.isEnded).toBe(true)
    expect(state.currentSlideId).toBe('a')
  })

  it('ignores isEnding on a slide that still has active choices', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [
        slide('a', ['pick'], [{ text: 'go', targetSlideId: 'b' }], true),
        slide('b', ['reached via choice']),
      ],
    }
    let state = getInitialState(project)
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    expect(getAvailableChoices(project, state)).toHaveLength(1)
    state = reduce(project, state, { type: 'CHOOSE', choiceIndex: 0 })
    expect(state.currentSlideId).toBe('b')
    expect(state.isEnded).toBe(false)
  })

  it('follows an explicit nextSlideId override instead of array order', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [slide('a', ['jumps ahead'], undefined, undefined, 'c'), slide('b', ['skipped']), slide('c', ['landed here'])],
    }
    let state = getInitialState(project)
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    expect(state.currentSlideId).toBe('c')
  })

  it('advances past a title slide with a single click, regardless of its dialogue line count', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [
        { ...slide('title', ['line1', 'line2', 'line3']), isTitleSlide: true, titleText: 'MY MOVIE' },
        slide('b', ['story starts here']),
      ],
    }
    let state = getInitialState(project)
    expect(state.currentSlideId).toBe('title')
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    expect(state.currentSlideId).toBe('b')
  })

  it('does not advance when nextSlideId is set but still unselected (empty string)', () => {
    const project: Project = {
      characters: [],
      backgrounds: [],
      slides: [slide('a', ['pending target']), slide('b', ['next in array'])],
    }
    ;(project.slides[0] as { nextSlideId?: string }).nextSlideId = ''
    let state = getInitialState(project)
    state = reduce(project, state, { type: 'ADVANCE_LINE' })
    // falls back to array order rather than crashing on an empty target
    expect(state.currentSlideId).toBe('b')
  })
})
