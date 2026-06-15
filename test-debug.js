// Smoke test: RAG semantic retrieval debug (inspects retrieved blocks + scores).
//
// PREREQUISITES:
//   1. A dev server must be running:  npm run dev   (serves http://localhost:3000)
//   2. Node 18+ (uses the built-in global `fetch`).
// RUN:  node test-debug.js
//
// This hits the live /api/chat route (which initializes the VectorStore and runs
// semantic search internally) instead of importing lib/vector-db.ts directly —
// plain `node` cannot require/run TypeScript. It prints the retrieved knowledge
// blocks and their similarity scores so you can eyeball retrieval quality.

async function debugRAG() {
  try {
    console.log('Querying /api/chat for "someone is dizzy"...');
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'someone is dizzy', context: 'responder' }),
    });

    const data = await response.json();

    const scores = data.search_scores || [];
    const blocks = data.retrieved_blocks || [];
    console.log(`Retrieved ${blocks.length} block(s):`);
    blocks.forEach((content, i) => {
      const score = scores[i]?.score;
      const source = scores[i]?.source || 'unknown';
      console.log(`  [${source}] score=${score?.toFixed?.(3) ?? 'n/a'} — ${content.substring(0, 60)}...`);
    });

    console.log('\nResponse preview:');
    console.log(`  ${data.message?.substring(0, 200) || 'No response'}...`);
  } catch (error) {
    console.error('Debug error:', error.message);
    console.error('Is the dev server running on http://localhost:3000 (npm run dev)?');
  }
}

debugRAG();
