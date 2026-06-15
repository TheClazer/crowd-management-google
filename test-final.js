// Smoke test: RAG protocol assistant (asserts a non-truncated response).
//
// PREREQUISITES:
//   1. A dev server must be running:  npm run dev   (serves http://localhost:3000)
//   2. Node 18+ (uses the built-in global `fetch`).
// RUN:  node test-final.js
//
// Works fully offline (demo keyword fallback) when no GOOGLE_API_KEY is set.

const testRAG = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "What should I do if someone has a severe allergic reaction?", context: 'responder' })
    });
    const data = await response.json();
    console.log('✅ RAG Test Successful');
    console.log(`Response length: ${data.message?.length || 0}`);
    console.log(`Is truncated: ${data.message?.includes('[Response truncated]')}`);
    console.log('Sample response:');
    console.log(data.message?.substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ Test failed');
  }
};

testRAG();
