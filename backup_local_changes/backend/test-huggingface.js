/**
 * HuggingFace API Test Script
 * Run this to verify your HuggingFace API key is working
 */

const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

async function testHuggingFaceAPI() {
  console.log('🧪 Testing HuggingFace API Configuration...\n');

  // Check if API key is set
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey || apiKey === 'your_actual_huggingface_token_here') {
    console.log('❌ ERROR: HuggingFace API key not configured!');
    console.log('Please update HUGGINGFACE_API_KEY in your .env file');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

  // Initialize HuggingFace client
  const hf = new HfInference(apiKey);

  try {
    console.log('🔄 Testing text generation...');
    
    // Test simple text generation
    const textResult = await hf.textGeneration({
      model: 'gpt2',
      inputs: 'A fantasy game character description:',
      parameters: {
        max_new_tokens: 50,
        temperature: 0.7
      }
    });

    console.log('✅ Text Generation Success!');
    console.log('Sample output:', textResult.generated_text.substring(0, 100) + '...');

  } catch (error) {
    console.log('❌ Text Generation Error:', error.message);
    if (error.message.includes('401')) {
      console.log('💡 This usually means your API key is invalid');
    }
  }

  try {
    console.log('\n🔄 Testing image generation...');
    
    // Test image generation with a simple prompt
    const imageResult = await hf.textToImage({
      model: 'runwayml/stable-diffusion-v1-5',
      inputs: 'pixel art game character, 16-bit style'
    });

    console.log('✅ Image Generation Success!');
    console.log('Image blob size:', imageResult.size, 'bytes');

  } catch (error) {
    console.log('❌ Image Generation Error:', error.message);
    if (error.message.includes('loading')) {
      console.log('💡 Model is cold-starting, this is normal - try again in a few minutes');
    }
  }

  console.log('\n🎉 HuggingFace API test completed!');
}

// Run the test
testHuggingFaceAPI().catch(console.error);
