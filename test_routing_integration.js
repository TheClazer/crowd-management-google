// Test script for complete routing + crowd prediction integration
const BASE_URL = 'http://localhost:3000';

async function testRoutingIntegration() {
  console.log('🛣️ COMPLETE CROWD-AWARE ROUTING TEST');
  const testEventId = 'evt-summer-fest-2025';

  try {
    const routeResponse = await fetch(`${BASE_URL}/api/planned-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: testEventId, startNode: 'gate_north', endNode: 'food_court' })
    });

    if (routeResponse.ok) {
      const routeData = await routeResponse.json();
      console.log(`✅ Route: ${routeData.route.path.join(' → ')}`);
      console.log(`🚦 Risk: ${routeData.route.riskAssessment}`);
    } else {
      console.log(`❌ Route planning failed: ${routeResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testRoutingIntegration().catch(console.error);
