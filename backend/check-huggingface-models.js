/**
 * HuggingFace API Model Checker and Configurator
 * This script helps find working models for your HuggingFace API key
 */

const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

// Models to test (known to work better with free tier)
const MODELS_TO_TEST = {
  text: [
    'gpt2',
    'microsoft/DialoGPT-small',  
    'facebook/blenderbot-400M-distill',
    'microsoft/CodeBERTa-small-v1',
  ],
  image: [
    'CompVis/stable-diffusion-v1-4',
    'runwayml/stable-diffusion-v1-5',
    'stabilityai/stable-diffusion-2-1',
    'dreamlike-art/dreamlike-photoreal-2.0',
  ]
};

async function checkHuggingFaceStatus() {
  console.log('🧪 HuggingFace API Model Availability Checker\n');

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey || apiKey === 'your_actual_huggingface_token_here') {
    console.log('❌ ERROR: HuggingFace API key not configured!');
    return;
  }

  const hf = new HfInference(apiKey);
  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...\n');

  const workingModels = {
    text: [],
    image: []
  };

  // Test text generation models
  console.log('🔤 Testing Text Generation Models...');
  for (const model of MODELS_TO_TEST.text) {
    try {
      console.log(`  Testing ${model}...`);
      await hf.textGeneration({
        model: model,
        inputs: 'A fantasy warrior',
        parameters: { 
          max_length: 20,
          temperature: 0.7
        }
      });
      console.log(`  ✅ ${model} - WORKING`);
      workingModels.text.push(model);
    } catch (error) {
      console.log(`  ❌ ${model} - ${error.message}`);
    }
  }

  // Test image generation models  
  console.log('\n🎨 Testing Image Generation Models...');
  for (const model of MODELS_TO_TEST.image) {
    try {
      console.log(`  Testing ${model}...`);
      await hf.textToImage({
        model: model,
        inputs: 'fantasy sword'
      });
      console.log(`  ✅ ${model} - WORKING`);
      workingModels.image.push(model);
    } catch (error) {
      console.log(`  ❌ ${model} - ${error.message}`);
    }
  }

  // Generate configuration
  console.log('\n📋 RESULTS SUMMARY:');
  console.log('===================');
  
  if (workingModels.text.length === 0 && workingModels.image.length === 0) {
    console.log('❌ No models are currently available on your HuggingFace account.');
    console.log('\n💡 SOLUTIONS:');
    console.log('1. Upgrade to HuggingFace Pro ($20/month) for better model access');
    console.log('2. Use Replicate API instead (pay-per-use)');
    console.log('3. Set up local AI with Ollama (free but requires powerful hardware)');
    console.log('\n🔗 Quick Setup Links:');
    console.log('- HuggingFace Pro: https://huggingface.co/pricing');
    console.log('- Replicate: https://replicate.com/');
    console.log('- Ollama: https://ollama.com/');
  } else {
    console.log(`✅ Found ${workingModels.text.length + workingModels.image.length} working models!`);
    
    if (workingModels.text.length > 0) {
      console.log(`\n🔤 Working Text Models: ${workingModels.text.join(', ')}`);
    }
    
    if (workingModels.image.length > 0) {
      console.log(`🎨 Working Image Models: ${workingModels.image.join(', ')}`);
    }

    // Generate updated config
    console.log('\n⚙️  RECOMMENDED CONFIGURATION UPDATE:');
    console.log('Update your backend/src/controllers/ai.ts with:');
    console.log('```typescript');
    console.log('const aiConfig: AIConfig = {');
    console.log('  huggingface: {');
    console.log('    apiKey: process.env.HUGGINGFACE_API_KEY,');
    console.log(`    textModel: '${workingModels.text[0] || 'gpt2'}',`);
    console.log(`    imageModel: '${workingModels.image[0] || 'runwayml/stable-diffusion-v1-5'}',`);
    console.log("    codeModel: 'gpt2',");
    console.log('  },');
    console.log('  // ... rest of config');
    console.log('};');
    console.log('```');
  }

  return workingModels;
}

// Run the checker
checkHuggingFaceStatus().catch(console.error);
