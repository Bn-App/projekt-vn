import { create } from 'zustand'
import { createId } from '../lib/id'
import { DEFAULT_EXPRESSION } from '../types/project'
import type { Project, Character, Background, Slide, DialogueLine, Choice, CharacterOnStage } from '../types/project'

function createEmptySlide(): Slide {
  return {
    id: createId(),
    backgroundId: null,
    charactersOnStage: [],
    dialogueLines: [{ speakerCharacterId: null, text: '' }],
  }
}

function mapSlide(project: Project, slideId: string, fn: (slide: Slide) => Slide): Project {
  return { ...project, slides: project.slides.map((s) => (s.id === slideId ? fn(s) : s)) }
}

interface ProjectStoreState {
  project: Project
  selectedSlideId: string | null
  isDirty: boolean

  loadProject: (project: Project) => void
  /** used by the collab sync layer to adopt a project snapshot received from a peer, without resetting the current selection like loadProject does */
  applyRemoteProject: (project: Project) => void
  markSaved: () => void
  setDialogueFontSize: (sizePx: number) => void

  // characters
  addCharacter: (input: { name: string; color: string }) => string
  updateCharacter: (id: string, patch: Partial<Omit<Character, 'id' | 'sprites'>>) => void
  removeCharacter: (id: string) => void
  setCharacterSprite: (id: string, expression: string, imageDataUrl: string) => void
  removeCharacterSprite: (id: string, expression: string) => void
  renameCharacterSprite: (id: string, oldExpression: string, newExpression: string) => void

  // backgrounds
  addBackground: (input: { name: string; imageDataUrl: string }) => string
  updateBackground: (id: string, patch: Partial<Omit<Background, 'id'>>) => void
  removeBackground: (id: string) => void

  // slides
  addSlide: (afterSlideId?: string | null) => string
  duplicateSlide: (id: string) => string
  removeSlide: (id: string) => void
  reorderSlides: (orderedIds: string[]) => void
  selectSlide: (id: string | null) => void
  setSlideBackground: (slideId: string, backgroundId: string | null) => void
  setSlideBackgroundFitMode: (slideId: string, mode: 'cover' | 'stretch') => void
  setSlideBackgroundPosition: (slideId: string, position: { xPct: number; yPct: number }) => void
  setSlideSectionTitle: (slideId: string, title: string | null) => void
  setSlideIsEnding: (slideId: string, isEnding: boolean) => void
  setSlideNextSlideId: (slideId: string, nextSlideId: string | null) => void
  setSlideName: (slideId: string, name: string) => void
  setSlideColorTag: (slideId: string, colorTag: string | null) => void

  // dialogue lines
  addDialogueLine: (slideId: string) => void
  updateDialogueLine: (slideId: string, index: number, patch: Partial<DialogueLine>) => void
  removeDialogueLine: (slideId: string, index: number) => void
  moveDialogueLine: (slideId: string, index: number, direction: -1 | 1) => void

  // characters on stage
  addCharacterToSlide: (slideId: string, characterId: string) => void
  updateCharacterOnStage: (slideId: string, characterId: string, patch: Partial<Omit<CharacterOnStage, 'characterId'>>) => void
  removeCharacterFromSlide: (slideId: string, characterId: string) => void

  // choices
  enableChoices: (slideId: string) => void
  disableChoices: (slideId: string) => void
  addChoice: (slideId: string) => void
  updateChoice: (slideId: string, index: number, patch: Partial<Choice>) => void
  removeChoice: (slideId: string, index: number) => void
}

export const useProjectStore = create<ProjectStoreState>((set) => ({
  project: { characters: [], backgrounds: [], slides: [] },
  selectedSlideId: null,
  isDirty: false,

  loadProject: (project) =>
    set({ project, selectedSlideId: project.slides[0]?.id ?? null, isDirty: false }),
  applyRemoteProject: (project) =>
    set((state) => ({
      project,
      selectedSlideId: project.slides.some((s) => s.id === state.selectedSlideId)
        ? state.selectedSlideId
        : (project.slides[0]?.id ?? null),
      isDirty: true,
    })),
  markSaved: () => set({ isDirty: false }),
  setDialogueFontSize: (sizePx) =>
    set((state) => ({ project: { ...state.project, dialogueFontSizePx: sizePx }, isDirty: true })),

  addCharacter: ({ name, color }) => {
    const id = createId()
    set((state) => ({
      project: { ...state.project, characters: [...state.project.characters, { id, name, color, sprites: {} }] },
      isDirty: true,
    }))
    return id
  },
  updateCharacter: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        characters: state.project.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      },
      isDirty: true,
    })),
  removeCharacter: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        characters: state.project.characters.filter((c) => c.id !== id),
        slides: state.project.slides.map((s) => ({
          ...s,
          charactersOnStage: s.charactersOnStage.filter((c) => c.characterId !== id),
          dialogueLines: s.dialogueLines.map((l) =>
            l.speakerCharacterId === id ? { ...l, speakerCharacterId: null } : l,
          ),
        })),
      },
      isDirty: true,
    })),
  setCharacterSprite: (id, expression, imageDataUrl) =>
    set((state) => ({
      project: {
        ...state.project,
        characters: state.project.characters.map((c) =>
          c.id === id ? { ...c, sprites: { ...c.sprites, [expression]: imageDataUrl } } : c,
        ),
      },
      isDirty: true,
    })),
  removeCharacterSprite: (id, expression) =>
    set((state) => ({
      project: {
        ...state.project,
        characters: state.project.characters.map((c) => {
          if (c.id !== id) return c
          const sprites = { ...c.sprites }
          delete sprites[expression]
          return { ...c, sprites }
        }),
      },
      isDirty: true,
    })),
  renameCharacterSprite: (id, oldExpression, newExpression) =>
    set((state) => {
      const trimmed = newExpression.trim()
      const character = state.project.characters.find((c) => c.id === id)
      if (!character || !trimmed || trimmed === oldExpression || trimmed in character.sprites) {
        return state
      }
      return {
        project: {
          ...state.project,
          characters: state.project.characters.map((c) => {
            if (c.id !== id) return c
            const sprites: Record<string, string> = {}
            for (const [key, value] of Object.entries(c.sprites)) {
              sprites[key === oldExpression ? trimmed : key] = value
            }
            return { ...c, sprites }
          }),
          slides: state.project.slides.map((s) => ({
            ...s,
            charactersOnStage: s.charactersOnStage.map((cos) =>
              cos.characterId === id && cos.expression === oldExpression ? { ...cos, expression: trimmed } : cos,
            ),
          })),
        },
        isDirty: true,
      }
    }),

  addBackground: ({ name, imageDataUrl }) => {
    const id = createId()
    set((state) => ({
      project: { ...state.project, backgrounds: [...state.project.backgrounds, { id, name, imageDataUrl }] },
      isDirty: true,
    }))
    return id
  },
  updateBackground: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        backgrounds: state.project.backgrounds.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      },
      isDirty: true,
    })),
  removeBackground: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        backgrounds: state.project.backgrounds.filter((b) => b.id !== id),
        slides: state.project.slides.map((s) => (s.backgroundId === id ? { ...s, backgroundId: null } : s)),
      },
      isDirty: true,
    })),

  addSlide: (afterSlideId) => {
    const newSlide = createEmptySlide()
    set((state) => {
      const slides = [...state.project.slides]
      const insertAt = afterSlideId ? slides.findIndex((s) => s.id === afterSlideId) + 1 : slides.length
      slides.splice(insertAt, 0, newSlide)
      return { project: { ...state.project, slides }, selectedSlideId: newSlide.id, isDirty: true }
    })
    return newSlide.id
  },
  duplicateSlide: (id) => {
    const copyId = createId()
    set((state) => {
      const index = state.project.slides.findIndex((s) => s.id === id)
      if (index === -1) return state
      const original = state.project.slides[index]
      const copy: Slide = { ...original, id: copyId, choices: original.choices ? [...original.choices] : undefined }
      const slides = [...state.project.slides]
      slides.splice(index + 1, 0, copy)
      return { project: { ...state.project, slides }, selectedSlideId: copyId, isDirty: true }
    })
    return copyId
  },
  removeSlide: (id) =>
    set((state) => {
      const slides = state.project.slides.filter((s) => s.id !== id)
      const wasSelected = state.selectedSlideId === id
      return {
        project: { ...state.project, slides },
        selectedSlideId: wasSelected ? (slides[0]?.id ?? null) : state.selectedSlideId,
        isDirty: true,
      }
    }),
  reorderSlides: (orderedIds) =>
    set((state) => {
      const byId = new Map(state.project.slides.map((s) => [s.id, s]))
      const slides = orderedIds.map((id) => byId.get(id)).filter((s): s is Slide => !!s)
      return { project: { ...state.project, slides }, isDirty: true }
    }),
  selectSlide: (id) => set({ selectedSlideId: id }),
  setSlideBackground: (slideId, backgroundId) =>
    set((state) => ({ project: mapSlide(state.project, slideId, (s) => ({ ...s, backgroundId })), isDirty: true })),
  setSlideBackgroundFitMode: (slideId, mode) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({ ...s, backgroundFitMode: mode })),
      isDirty: true,
    })),
  setSlideBackgroundPosition: (slideId, position) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({ ...s, backgroundPosition: position })),
      isDirty: true,
    })),
  setSlideSectionTitle: (slideId, title) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({ ...s, sectionTitle: title?.trim() || undefined })),
      isDirty: true,
    })),
  setSlideIsEnding: (slideId, isEnding) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({
        ...s,
        isEnding,
        nextSlideId: isEnding ? undefined : s.nextSlideId,
      })),
      isDirty: true,
    })),
  setSlideNextSlideId: (slideId, nextSlideId) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({
        ...s,
        nextSlideId: nextSlideId === null ? undefined : nextSlideId,
        isEnding: nextSlideId === null ? s.isEnding : false,
      })),
      isDirty: true,
    })),
  setSlideName: (slideId, name) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({ ...s, name })),
      isDirty: true,
    })),
  setSlideColorTag: (slideId, colorTag) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({ ...s, colorTag: colorTag ?? undefined })),
      isDirty: true,
    })),

  addDialogueLine: (slideId) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({
        ...s,
        dialogueLines: [...s.dialogueLines, { speakerCharacterId: null, text: '' }],
      })),
      isDirty: true,
    })),
  updateDialogueLine: (slideId, index, patch) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({
        ...s,
        dialogueLines: s.dialogueLines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
      })),
      isDirty: true,
    })),
  removeDialogueLine: (slideId, index) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({
        ...s,
        dialogueLines: s.dialogueLines.length > 1 ? s.dialogueLines.filter((_, i) => i !== index) : s.dialogueLines,
      })),
      isDirty: true,
    })),
  moveDialogueLine: (slideId, index, direction) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => {
        const target = index + direction
        if (target < 0 || target >= s.dialogueLines.length) return s
        const lines = [...s.dialogueLines]
        ;[lines[index], lines[target]] = [lines[target], lines[index]]
        return { ...s, dialogueLines: lines }
      }),
      isDirty: true,
    })),

  addCharacterToSlide: (slideId, characterId) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => {
        if (s.charactersOnStage.some((c) => c.characterId === characterId)) return s
        const character = state.project.characters.find((c) => c.id === characterId)
        const firstExpression = character ? Object.keys(character.sprites)[0] : undefined
        return {
          ...s,
          charactersOnStage: [
            ...s.charactersOnStage,
            {
              characterId,
              expression: firstExpression ?? DEFAULT_EXPRESSION,
              position: { xPct: 50, yPct: 80 },
            },
          ],
        }
      }),
      isDirty: true,
    })),
  updateCharacterOnStage: (slideId, characterId, patch) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({
        ...s,
        charactersOnStage: s.charactersOnStage.map((c) => (c.characterId === characterId ? { ...c, ...patch } : c)),
      })),
      isDirty: true,
    })),
  removeCharacterFromSlide: (slideId, characterId) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({
        ...s,
        charactersOnStage: s.charactersOnStage.filter((c) => c.characterId !== characterId),
      })),
      isDirty: true,
    })),

  enableChoices: (slideId) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({ ...s, choices: s.choices ?? [{ text: '', targetSlideId: '' }] })),
      isDirty: true,
    })),
  disableChoices: (slideId) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => {
        const { choices, ...rest } = s
        return rest
      }),
      isDirty: true,
    })),
  addChoice: (slideId) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({
        ...s,
        choices: [...(s.choices ?? []), { text: '', targetSlideId: '' }],
      })),
      isDirty: true,
    })),
  updateChoice: (slideId, index, patch) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({
        ...s,
        choices: s.choices?.map((c, i) => (i === index ? { ...c, ...patch } : c)),
      })),
      isDirty: true,
    })),
  removeChoice: (slideId, index) =>
    set((state) => ({
      project: mapSlide(state.project, slideId, (s) => ({
        ...s,
        choices: s.choices?.filter((_, i) => i !== index),
      })),
      isDirty: true,
    })),
}))

export function useSelectedSlide(): Slide | null {
  return useProjectStore((state) => state.project.slides.find((s) => s.id === state.selectedSlideId) ?? null)
}
