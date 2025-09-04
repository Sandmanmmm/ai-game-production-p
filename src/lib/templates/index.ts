// Type exports
export type { RealGameTemplate } from '../realTemplateGenerator'

// Individual template exports
export { cookieClickerTemplate } from './cookieClickerTemplate'
export { snakeGameTemplate } from './snakeGameTemplate'
export { flappyBirdTemplate } from './flappyBirdTemplate'
export { platformerTemplate } from './platformerTemplate'

// Template collection for easy access
import { cookieClickerTemplate } from './cookieClickerTemplate'
import { snakeGameTemplate } from './snakeGameTemplate'
import { flappyBirdTemplate } from './flappyBirdTemplate'
import { platformerTemplate } from './platformerTemplate'

export const allTemplates = [
  cookieClickerTemplate,
  snakeGameTemplate,
  flappyBirdTemplate,
  platformerTemplate
]

// Helper function to get template by ID
export function getTemplateById(id: string) {
  return allTemplates.find(template => template.id === id)
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: string) {
  return allTemplates.filter(template => template.category === category)
}

// Helper function to get templates by complexity
export function getTemplatesByComplexity(complexity: string) {
  return allTemplates.filter(template => template.complexity === complexity)
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
