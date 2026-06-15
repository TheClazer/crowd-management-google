import Database from 'better-sqlite3';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// CrowdGuard RAG vector store.
//
// Works GREAT offline: when no Google/Gemini key is configured, embeddings are
// skipped entirely and high-quality keyword search is used instead. When a key
// IS present, it uses the text-embedding-004 model for semantic search.
//
// No API keys are hardcoded — only process.env.GOOGLE_API_KEY (or the
// GEMINI_API_KEY alias) is read.

const EMBED_MODEL = 'text-embedding-004';

function getApiKey(): string | undefined {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || undefined;
}

export class VectorStore {
  private db: Database.Database;
  private gemini: GoogleGenerativeAI | null;
  private readonly hasEmbeddings: boolean;

  constructor() {
    // Resolve the SQLite path against the project root so it works regardless
    // of the process CWD (Next.js bundling moves things around).
    const dbPath = path.join(process.cwd(), 'rag-vectors.db');
    this.db = new Database(dbPath);

    // Create tables
    this.initTables();

    // Initialize Gemini client only when a key exists. Otherwise we run in
    // keyword-only mode (no network calls, no NaN, no zero-vector garbage).
    const apiKey = getApiKey();
    this.hasEmbeddings = Boolean(apiKey);
    this.gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  private initTables() {
    // Create documents table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create embeddings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER,
        vector TEXT NOT NULL, -- Store as JSON string for simplicity
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id)
      )
    `);
  }

  async addDocuments(documents: { source: string; content: string }[]) {
    const insertDoc = this.db.prepare('INSERT INTO documents (source, content) VALUES (?, ?)');
    const existsStmt = this.db.prepare('SELECT 1 FROM documents WHERE source = ? AND content = ? LIMIT 1');
    const insertEmbed = this.db.prepare('INSERT INTO embeddings (document_id, vector) VALUES (?, ?)');

    for (const doc of documents) {
      // Split content into chunks (approximately)
      const chunks = this.chunkText(doc.content);

      for (const chunk of chunks) {
        // Idempotency guard: skip chunks we already stored for this source so
        // repeated cold starts don't duplicate the whole knowledge base.
        const already = existsStmt.get(doc.source, chunk);
        if (already) continue;

        // Insert document
        const docResult = insertDoc.run(doc.source, chunk);

        // Generate embedding (no-op -> empty array when embeddings disabled)
        const embedding = await this.embedText(chunk);

        // Only store a vector row when we actually produced a usable embedding.
        if (embedding.length > 0) {
          insertEmbed.run(docResult.lastInsertRowid, JSON.stringify(embedding));
        }
      }
    }
  }

  private chunkText(text: string): string[] {
    // Simple chunking - split by double newlines, then further split if too long
    const paragraphs = text.split('\n\n');
    const chunks: string[] = [];

    for (const paragraph of paragraphs) {
      if (paragraph.length > 1000) {
        // Further split long paragraphs
        const subchunks = paragraph.match(/.{1,500}(?:[.!?]|\n|$)/g) || [paragraph];
        chunks.push(...subchunks);
      } else {
        chunks.push(paragraph);
      }
    }

    return chunks.filter(chunk => chunk.trim().length > 20); // Filter out very short chunks
  }

  /**
   * Embed text via Gemini text-embedding-004. Returns an empty array when no
   * API key is configured or the call fails — callers MUST treat `[]` as
   * "no embedding available" and fall back to keyword search. We never emit a
   * zero vector (which produced NaN cosine similarities downstream).
   */
  private async embedText(text: string): Promise<number[]> {
    const trimmed = text?.trim();
    if (!trimmed) return []; // empty-query guard
    if (!this.hasEmbeddings || !this.gemini) return []; // offline keyword mode

    try {
      const model = this.gemini.getGenerativeModel({ model: EMBED_MODEL });
      const result = await model.embedContent(trimmed);
      const values = result?.embedding?.values;
      if (Array.isArray(values) && values.length > 0) {
        return values;
      }
      // Unexpected shape — fall back to keyword search.
      return [];
    } catch (error) {
      console.error('Gemini embedding failed, falling back to keyword search:', error);
      return [];
    }
  }

  async search(query: string, topK: number = 3): Promise<{ content: string; source: string; score: number }[]> {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) return []; // empty-query guard — no NaN, no full scan

    // Try embedding-based search first; empty array => keyword fallback.
    const queryEmbedding = await this.embedText(trimmedQuery);
    if (queryEmbedding.length === 0 || isZeroVector(queryEmbedding)) {
      return this.keywordSearch(trimmedQuery, topK);
    }

    // Get all embeddings and calculate similarity
    const selectEmbeddings = this.db.prepare(`
      SELECT e.id, e.vector, e.document_id, d.content, d.source
      FROM embeddings e
      JOIN documents d ON e.document_id = d.id
    `);

    const embeddings = selectEmbeddings.all();

    // If we have a query embedding but no stored vectors, keyword search.
    if (embeddings.length === 0) {
      return this.keywordSearch(trimmedQuery, topK);
    }

    // Calculate cosine similarity (with zero-norm guards)
    const results = embeddings.map((emb: any) => {
      let vector: number[];
      try {
        vector = JSON.parse(emb.vector);
      } catch {
        vector = [];
      }
      if (vector.length === 0 || isZeroVector(vector)) {
        // Fall back to keyword similarity for this content
        return {
          content: emb.content,
          source: emb.source,
          score: this.keywordSimilarity(trimmedQuery, emb.content),
        };
      }
      return {
        content: emb.content,
        source: emb.source,
        score: this.cosineSimilarity(queryEmbedding, vector),
      };
    });

    // Sort by similarity and return top K
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK).map(r => ({
      content: r.content,
      source: r.source,
      score: r.score,
    }));
  }

  // Keyword-based search fallback — must stay excellent offline.
  private keywordSearch(query: string, topK: number): { content: string; source: string; score: number }[] {
    const selectDocuments = this.db.prepare(`
      SELECT d.content, d.source
      FROM documents d
    `);

    const documents = selectDocuments.all();

    const results = documents.map((doc: any) => ({
      content: doc.content,
      source: doc.source,
      score: this.keywordSimilarity(query, doc.content)
    }));

    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK).filter(r => r.score > 0.2); // keep selective but not starved
  }

  // Simple keyword similarity (guarded against divide-by-zero)
  private keywordSimilarity(query: string, content: string): number {
    const queryWords = this.extractKeywords(query);
    if (queryWords.length === 0) return 0; // zero-norm / empty guard
    const contentWords = this.extractKeywords(content);

    let matches = 0;
    for (const word of queryWords) {
      if (contentWords.includes(word)) matches++;
    }

    return matches / queryWords.length;
  }

  // Extract keywords
  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'how', 'use', 'when', 'with'].includes(word));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    // Cosine similarity = (a · b) / (||a|| * ||b||), guarded against zero norms.
    const len = Math.min(a.length, b.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0) return 0; // zero-norm guard — never return NaN
    return dotProduct / denom;
  }

  close() {
    this.db.close();
  }

  // Initialize with existing knowledge base. Idempotent: addDocuments() skips
  // chunks already present, so repeated calls don't duplicate rows.
  async initializeKnowledgeBase() {
    // Lazy node-only imports (this module is server-only).
    const fs = await import('fs');

    const knowledgeFiles: { file: string; source: string }[] = [
      { file: 'medical-protocols.txt', source: 'medical' },
      { file: 'fire-safety-protocols.txt', source: 'fire' },
      { file: 'gate-management-faqs.txt', source: 'gate' },
      { file: 'text-blocks.txt', source: 'general' },
    ];

    for (const { file, source } of knowledgeFiles) {
      const filePath = path.join(process.cwd(), 'lib', 'knowledge-base', file);

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        await this.addDocuments([{ source, content }]);
      }
    }
  }
}

/** True when every component is exactly zero (degenerate embedding). */
function isZeroVector(v: number[]): boolean {
  for (let i = 0; i < v.length; i++) {
    if (v[i] !== 0) return false;
  }
  return true;
}
