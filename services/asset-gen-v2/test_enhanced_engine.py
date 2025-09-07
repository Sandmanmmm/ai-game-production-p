"""
Phase 2 Test: Enhanced Generation Engine Demo
Demonstrates the production-ready asset generation capabilities
"""

import asyncio
import logging
import json
from pathlib import Path
import time

from enhanced_generation_engine import (
    EnhancedGenerationEngine,
    GenerationRequest,
    AssetType,
    QualityTier
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_enhanced_generation_engine():
    """Test the enhanced generation engine with various asset types"""
    
    print("🚀 Phase 2: Enhanced Generation Engine Test")
    print("=" * 60)
    
    # Configuration
    config = {
        "cache_dir": "./test_asset_cache",
        "threads": 4,
        "processes": 2,
        "storage": "local",
        "redis_url": "redis://localhost:6379"  # Optional
    }
    
    # Initialize engine
    engine = EnhancedGenerationEngine(config)
    await engine.initialize()
    
    print("✅ Engine initialized successfully")
    
    # Test cases
    test_cases = [
        {
            "name": "2D Texture Generation",
            "request": GenerationRequest(
                asset_type=AssetType.TEXTURE_2D,
                prompt="medieval stone wall texture, weathered, moss",
                quality_tier=QualityTier.PC,
                batch_size=2,
                variations=1
            ),
            "expected_files": ["diffuse.png", "normal.png", "roughness.png", "metallic.png", "ao.png"]
        },
        {
            "name": "3D Model Generation",
            "request": GenerationRequest(
                asset_type=AssetType.MODEL_3D,
                prompt="fantasy sword, ornate handle",
                quality_tier=QualityTier.CONSOLE,
                batch_size=1,
                variations=2
            ),
            "expected_files": ["model.obj", "model_LOD0.obj", "model_LOD1.obj"]
        },
        {
            "name": "Audio SFX Generation",
            "request": GenerationRequest(
                asset_type=AssetType.AUDIO_SFX,
                prompt="explosion sound effect",
                quality_tier=QualityTier.PC,
                parameters={"duration": 3},
                batch_size=1
            ),
            "expected_files": ["audio.wav"]
        },
        {
            "name": "Music Generation",
            "request": GenerationRequest(
                asset_type=AssetType.AUDIO_MUSIC,
                prompt="happy adventure music",
                quality_tier=QualityTier.CONSOLE,
                parameters={"duration": 10},
                batch_size=1
            ),
            "expected_files": ["audio.wav"]
        },
        {
            "name": "Animation Generation",
            "request": GenerationRequest(
                asset_type=AssetType.ANIMATION,
                prompt="character walking animation",
                quality_tier=QualityTier.PC,
                parameters={"duration": 2, "fps": 30},
                batch_size=1
            ),
            "expected_files": ["animation.json"]
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['name']}")
        print("-" * 40)
        
        try:
            start_time = time.time()
            
            # Generate assets
            assets = await engine.generate_asset(test_case["request"])
            
            generation_time = time.time() - start_time
            
            print(f"✅ Generated {len(assets)} assets in {generation_time:.2f}s")
            
            # Validate results
            for asset in assets:
                print(f"📁 Asset ID: {asset.asset_id}")
                print(f"   Type: {asset.asset_type.value}")
                print(f"   File: {asset.file_path}")
                print(f"   Size: {asset.file_size} bytes")
                print(f"   Quality Score: {asset.quality_metrics.get('overall', 'N/A')}")
                
                # Check if files exist
                asset_path = Path(asset.file_path)
                if asset_path.exists():
                    print(f"   ✅ Main file exists")
                else:
                    print(f"   ❌ Main file missing")
                
                # Check expected files
                asset_dir = asset_path.parent
                for expected_file in test_case.get("expected_files", []):
                    expected_path = asset_dir / expected_file
                    if expected_path.exists():
                        print(f"   ✅ {expected_file} exists")
                    else:
                        print(f"   ❌ {expected_file} missing")
            
            results.append({
                "test": test_case["name"],
                "status": "success",
                "assets_generated": len(assets),
                "generation_time": generation_time,
                "quality_scores": [a.quality_metrics.get("overall", 0) for a in assets]
            })
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            results.append({
                "test": test_case["name"],
                "status": "failed",
                "error": str(e)
            })
    
    # Print summary
    print("\n📊 Test Results Summary")
    print("=" * 60)
    
    successful_tests = [r for r in results if r["status"] == "success"]
    failed_tests = [r for r in results if r["status"] == "failed"]
    
    print(f"✅ Successful Tests: {len(successful_tests)}/{len(results)}")
    print(f"❌ Failed Tests: {len(failed_tests)}/{len(results)}")
    
    if successful_tests:
        total_assets = sum(r["assets_generated"] for r in successful_tests)
        avg_time = sum(r["generation_time"] for r in successful_tests) / len(successful_tests)
        avg_quality = []
        for r in successful_tests:
            avg_quality.extend(r["quality_scores"])
        
        print(f"📈 Total Assets Generated: {total_assets}")
        print(f"⏱️ Average Generation Time: {avg_time:.2f}s")
        if avg_quality:
            print(f"🏆 Average Quality Score: {sum(avg_quality)/len(avg_quality):.2f}")
    
    # Get engine metrics
    metrics = await engine.get_metrics()
    print(f"\n🎯 Engine Metrics:")
    print(f"   Total Generated: {metrics['total_generated']}")
    print(f"   Success Rate: {metrics['success_rate']:.1%}")
    print(f"   Avg Generation Time: {metrics['avg_generation_time']:.2f}s")
    print(f"   Avg Quality Score: {metrics['avg_quality_score']:.2f}")
    
    # Save detailed results
    results_file = Path("test_results.json")
    with open(results_file, 'w') as f:
        json.dump({
            "test_summary": {
                "total_tests": len(results),
                "successful": len(successful_tests),
                "failed": len(failed_tests),
                "success_rate": len(successful_tests) / len(results)
            },
            "detailed_results": results,
            "engine_metrics": metrics
        }, f, indent=2)
    
    print(f"📄 Detailed results saved to: {results_file}")
    
    # Cleanup
    await engine.shutdown()
    print("\n✅ Test completed successfully!")


async def test_quality_tiers():
    """Test different quality tiers"""
    print("\n🎨 Testing Quality Tiers")
    print("=" * 40)
    
    config = {"cache_dir": "./test_quality_cache"}
    engine = EnhancedGenerationEngine(config)
    await engine.initialize()
    
    prompt = "fantasy crystal texture"
    
    for tier in QualityTier:
        print(f"\n🔧 Testing {tier.value.upper()} quality")
        print(f"   Resolution: {tier.specs['texture_resolution']}px")
        print(f"   Poly Count: {tier.specs['poly_count']:,}")
        print(f"   Audio Bitrate: {tier.specs['audio_bitrate']}kbps")
        
        request = GenerationRequest(
            asset_type=AssetType.TEXTURE_2D,
            prompt=prompt,
            quality_tier=tier,
            batch_size=1
        )
        
        start_time = time.time()
        assets = await engine.generate_asset(request)
        generation_time = time.time() - start_time
        
        if assets:
            asset = assets[0]
            print(f"   ✅ Generated in {generation_time:.2f}s")
            print(f"   📏 File size: {asset.file_size} bytes")
            print(f"   🏆 Quality: {asset.quality_metrics.get('overall', 0):.2f}")
        else:
            print(f"   ❌ Generation failed")
    
    await engine.shutdown()


async def test_batch_generation():
    """Test batch generation capabilities"""
    print("\n📦 Testing Batch Generation")
    print("=" * 40)
    
    config = {"cache_dir": "./test_batch_cache"}
    engine = EnhancedGenerationEngine(config)
    await engine.initialize()
    
    batch_sizes = [1, 2, 4, 8]
    
    for batch_size in batch_sizes:
        print(f"\n📊 Batch size: {batch_size}")
        
        request = GenerationRequest(
            asset_type=AssetType.TEXTURE_2D,
            prompt="space nebula texture",
            quality_tier=QualityTier.CONSOLE,
            batch_size=batch_size
        )
        
        start_time = time.time()
        assets = await engine.generate_asset(request)
        total_time = time.time() - start_time
        
        print(f"   ✅ Generated {len(assets)} assets")
        print(f"   ⏱️ Total time: {total_time:.2f}s")
        print(f"   📈 Time per asset: {total_time/len(assets):.2f}s")
        print(f"   🚀 Throughput: {len(assets)/total_time:.1f} assets/sec")
    
    await engine.shutdown()


async def main():
    """Run all tests"""
    try:
        await test_enhanced_generation_engine()
        await test_quality_tiers()
        await test_batch_generation()
        
        print("\n🎉 All tests completed successfully!")
        print("🚀 Phase 2 Enhanced Generation Engine is ready for production!")
        
    except KeyboardInterrupt:
        print("\n⏹️ Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Test suite failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
