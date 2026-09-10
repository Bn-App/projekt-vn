import type { Project } from '../types/project'

export interface StoryIssue {
  slideId: string
  message: string
}

/** Pure, non-blocking checks surfaced as authoring warnings, not enforced errors. */
export function validateProject(project: Project): StoryIssue[] {
  const issues: StoryIssue[] = []
  const slideIds = new Set(project.slides.map((s) => s.id))

  for (const slide of project.slides) {
    if (slide.isTitleSlide && !slide.titleText?.trim()) {
      issues.push({ slideId: slide.id, message: 'Titelkarte hat noch keinen Titeltext.' })
    }
    if (slide.isEnding && slide.choices && slide.choices.length > 0) {
      issues.push({
        slideId: slide.id,
        message: 'Folie ist als Ende markiert, hat aber aktive Antworten – die Antworten haben Vorrang, das Ende wird ignoriert.',
      })
    }
    if (slide.choices) {
      if (slide.choices.length === 0) {
        issues.push({ slideId: slide.id, message: 'Folie hat einen Antwort-Bereich ohne Antworten.' })
      }
      for (const choice of slide.choices) {
        if (!choice.text.trim()) {
          issues.push({ slideId: slide.id, message: 'Eine Antwort hat keinen Text.' })
        }
        if (!choice.targetSlideId || !slideIds.has(choice.targetSlideId)) {
          issues.push({ slideId: slide.id, message: `Antwort "${choice.text || '(leer)'}" verweist auf keine gültige Folie.` })
        }
      }
    } else if (!slide.isEnding && slide.nextSlideId !== undefined && !slideIds.has(slide.nextSlideId)) {
      issues.push({ slideId: slide.id, message: 'Es ist noch keine Ziel-Folie für "Weiter mit bestimmter Folie" ausgewählt.' })
    }
  }

  if (project.slides.length > 0) {
    const reachable = new Set<string>()
    const queue = [project.slides[0].id]
    while (queue.length > 0) {
      const id = queue.pop()!
      if (reachable.has(id)) continue
      reachable.add(id)
      const slide = project.slides.find((s) => s.id === id)
      if (!slide) continue
      const index = project.slides.indexOf(slide)
      if (slide.choices && slide.choices.length > 0) {
        for (const choice of slide.choices) {
          if (choice.targetSlideId) queue.push(choice.targetSlideId)
        }
      } else if (slide.isEnding) {
        // no further reachability from an ending
      } else if (slide.nextSlideId !== undefined) {
        if (slide.nextSlideId) queue.push(slide.nextSlideId)
      } else {
        const next = project.slides[index + 1]
        if (next) queue.push(next.id)
      }
    }
    for (const slide of project.slides) {
      if (!reachable.has(slide.id)) {
        issues.push({ slideId: slide.id, message: 'Diese Folie ist von der ersten Folie aus nicht erreichbar.' })
      }
    }
  }

  return issues
}
