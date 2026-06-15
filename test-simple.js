// Smoke test: RAG protocol assistant (fire-extinguisher question).
//
// PREREQUISITES:
//   1. A dev server must be running:  npm run dev   (serves http://localhost:3000)
//   2. Node 18+ (uses the built-in global `fetch`).
// RUN:  node test-simple.js
//
// The /api/chat route works fully offline (demo keyword fallback) when no
// GOOGLE_API_KEY is set, so this passes in pure demo mode.

const testOneQuestion = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "What types of fire extinguishers should be used for different fires?",
        context: 'responder',
      }),
    });

    const data = await response.json();
    console.log('Question: What types of fire extinguishers should be used for different fires?');
    console.log(`Response length: ${data.message?.length || 0} characters`);
    console.log(`Relevant blocks found: ${data.retrieved_blocks?.length || 0}`);
    console.log(`Is it fire-related? ${data.message?.toLowerCase().includes('fire') || data.message?.toLowerCase().includes('extinguisher') || data.message?.toLowerCase().includes('class')}`);

    // Show first 300 characters of response
    const shortResponse = data.message?.substring(0, 300) || 'No response';
    console.log(`Response preview: ${shortResponse}${shortResponse.length === 300 ? '...' : ''}`);

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Is the dev server running on http://localhost:3000 (npm run dev)?');
  }
};

testOneQuestion();
