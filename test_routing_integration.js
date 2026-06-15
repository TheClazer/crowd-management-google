// Smoke test: crowd-aware routing via /api/planned-route (consumes forecasts).
//
// PREREQUISITES:
//   1. A dev server must be running:  npm run dev   (serves http://localhost:3000)
//   2. Node 18+ (uses the built-in global `fetch`).
// RUN:  node test_routing_integration.js
//
// Routes are computed from /api/crowd-density forecasts; both work in pure demo
// mode with no external services, so this passes offline.

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
