// Type exports
export type { RealGameTemplate } from './types'

// Individual template exports
export { clickerTemplate } from './clicker'
export { snakeTemplate } from './snake'
export { flappyTemplate } from './flappy'

// Template collection for easy access
import { clickerTemplate } from './clicker'
import { snakeTemplate } from './snake'
import { flappyTemplate } from './flappy'

export const allTemplates = [
  clickerTemplate,
  snakeTemplate,
  flappyTemplate
]

// Helper function to get template by ID
export function getTemplateById(id: string) {
  return allTemplates.find(template => template.id === id)
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: 'beginner' | 'intermediate' | 'advanced') {
  return allTemplates.filter(template => template.category === category)
}

// Helper function to get templates by complexity
export function getTemplatesByComplexity(complexity: 'beginner' | 'intermediate' | 'advanced') {
  return allTemplates.filter(template => template.complexity === complexity)
}

// Helper function to get templates by tag
export function getTemplatesByTag(tag: string) {
  return allTemplates.filter(template => template.tags.includes(tag))
}

// Helper function to get templates by game type
export function getTemplatesByGameType(gameType: string) {
  return allTemplates.filter(template => template.gameStructure.gameType === gameType)
}

// Get all available tags
export function getAvailableTags(): string[] {
  const tags = new Set<string>()
  allTemplates.forEach(template => {
    template.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
}

// Get all available game types
export function getAvailableGameTypes(): string[] {
  const gameTypes = new Set<string>()
  allTemplates.forEach(template => {
    gameTypes.add(template.gameStructure.gameType)
  })
  return Array.from(gameTypes).sort()
}

// Search templates by query
export function searchTemplates(query: string) {
  const lowerQuery = query.toLowerCase()
  return allTemplates.filter(template => 
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

// Template metadata for quick reference
export const templateMetadata = {
  count: allTemplates.length,
  categories: Array.from(new Set(allTemplates.map(t => t.category))),
  complexities: Array.from(new Set(allTemplates.map(t => t.complexity))),
  totalEstimatedTime: allTemplates.reduce((total, template) => {
    const minutes = parseInt(template.estimatedTime.split(' ')[0])
    return total + minutes
  }, 0),
  templateIds: allTemplates.map(t => t.id)
}
