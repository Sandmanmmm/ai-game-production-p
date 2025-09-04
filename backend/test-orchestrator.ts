// LLM Orchestrator Test Script
import 'dotenv/config';

async function testOrchestrator() {
  try {
    console.log('🧪 Testing LLM Orchestrator...');
    
    // Test intent parsing
    const { intentParser } = await import('./src/services/intentParser');
    
    const testRequest = "Generate 5 warrior sprites in pixel art style";
    const intent = await intentParser.parseUserIntent(testRequest);
    
    console.log('✅ Intent parsing test passed:');
    console.log('  Request:', testRequest);
    console.log('  Action:', intent.parsedIntent.action);
    console.log('  Confidence:', intent.parsedIntent.confidence);
    console.log('  Asset Types:', intent.parsedIntent.entities.assetTypes);
    console.log('  Quantities:', intent.parsedIntent.entities.quantities);
    console.log('  Styles:', intent.parsedIntent.entities.styles);
    
    // Test vector memory
    const { vectorMemoryService } = await import('./src/services/vectorMemory');
    
    const sampleProject = {
      id: 'test-project-123',
      name: 'Test RPG',
      description: 'A fantasy RPG with pixel art',
      gameType: 'RPG',
      targetPlatform: ['PC'],
      artStyle: 'pixel-art',
      technicalStack: ['React'],
      requirements: ['16-bit style'],
      assets: {
        characters: ['hero', 'villain'],
        environments: ['forest'],
        props: ['sword'],
        ui: ['health-bar']
      },
      styleGuides: ['Use 16-bit pixel art with limited palette'],
      codebase: {
        languages: ['TypeScript'],
        frameworks: ['React'],
        architecture: 'Component-based'
      },
      timeline: {
        milestones: []
      }
    };
    
    await vectorMemoryService.storeProjectContext(sampleProject);
    console.log('✅ Vector memory test passed - project context stored');
    
    const context = await vectorMemoryService.getAssetGenerationContext(
      'test-project-123',
      'sprite',
      'warrior'
    );
    
    console.log('✅ Context retrieval test passed:');
    console.log('  Project:', context.projectOverview);
    console.log('  Style Guidelines:', context.styleGuidelines);
    
    console.log('🎉 All orchestrator tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOrchestrator().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
