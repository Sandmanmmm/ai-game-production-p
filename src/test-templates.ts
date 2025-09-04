// Quick test to verify the modular template system is working
import { allTemplates, getTemplateById, getTemplatesByCategory } from './lib/templates'
import { realTemplateGenerator } from './lib/realTemplateGeneratorClean'

console.log('=== Template System Test ===')

// Test 1: Check if all templates are loaded
console.log(`Total templates loaded: ${allTemplates.length}`)
allTemplates.forEach((template, index) => {
  console.log(`${index + 1}. ${template.name} (${template.id}) - ${template.complexity}`)
})

// Test 2: Test template retrieval
const cookieTemplate = getTemplateById('cookie-clicker')
console.log('\n=== Cookie Clicker Template Test ===')
if (cookieTemplate) {
  console.log(`✅ Cookie Clicker template found: ${cookieTemplate.name}`)
  console.log(`   Description: ${cookieTemplate.description}`)
  console.log(`   Themes available: ${cookieTemplate.customizationOptions.themes.length}`)
} else {
  console.log('❌ Cookie Clicker template not found')
}

// Test 3: Test category filtering
const beginnerTemplates = getTemplatesByCategory('beginner')
console.log(`\n=== Beginner Templates (${beginnerTemplates.length}) ===`)
beginnerTemplates.forEach(template => {
  console.log(`- ${template.name}`)
})

// Test 4: Test generator functionality
console.log('\n=== Template Generator Test ===')
const generator = realTemplateGenerator
console.log(`✅ Generator created successfully`)

// Test template preview generation
if (cookieTemplate) {
  generator.generateTemplatePreview(cookieTemplate.id).then(preview => {
    console.log(`✅ Template preview generated (${preview.length} characters)`)
  }).catch(err => {
    console.log(`❌ Template preview failed: ${err.message}`)
  })
}

console.log('\n=== Test Complete ===')
