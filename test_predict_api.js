// Test script for the new crowd prediction API
const BASE_URL = 'http://localhost:3000';

async function testPredictionAPI() {
  console.log('🧪 Testing Crowd Prediction API Integration');
  console.log('='.repeat(50));

  const testEventId = 'evt-summer-fest-2025';

  console.log('\n🔮 Running Prediction Tests via Next.js App Router -> Python Backend...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/crowd-density?eventId=${testEventId}&hours=1`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
      return;
    }

    const result = await response.json();
    console.log(`   ✅ Successfully retrieved data from Next.js -> Python Backend.`);
    
    if (result.predictions && result.predictions.length > 0) {
      result.predictions.forEach(pred => {
        console.log(`      Zone ${pred.zoneId}: Predicted = ${pred.prediction15Min.toFixed(2)}, Confidence = ${(pred.confidence * 100).toFixed(1)}%, Risk = ${pred.riskLevel}`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Test error: ${error.message}`);
  }
}

testPredictionAPI().catch(console.error);
