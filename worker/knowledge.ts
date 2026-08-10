type KnowledgeEnv = {
  DB: D1Database;
  AURELIA_IMPORT_SECRET?: string;
};

type SourceInput = {
  source_id: string;
  title: string;
  source_kind: string;
  format: string;
  authority_note: string;
  origin_label: string;
  content?: string;
  byte_size?: number;
  content_mode?: string;
};

type ChunkInput = {
  chunk_id: string;
  source_id: string;
  section: string;
  content: string;
  token_length?: number;
  source_chunk_number?: number;
};

async function ensureKnowledgeSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS knowledge_sources (
      source_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      format TEXT NOT NULL,
      authority_note TEXT NOT NULL,
      origin_label TEXT NOT NULL,
      content TEXT,
      byte_size INTEGER NOT NULL DEFAULT 0,
      content_mode TEXT NOT NULL DEFAULT 'private_text',
      imported_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS knowledge_chunks (
      chunk_id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      section TEXT NOT NULL,
      content TEXT NOT NULL,
      token_length INTEGER NOT NULL DEFAULT 0,
      source_chunk_number INTEGER NOT NULL DEFAULT 0,
      imported_at TEXT NOT NULL,
      FOREIGN KEY(source_id) REFERENCES knowledge_sources(source_id)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source_id ON knowledge_chunks(source_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_knowledge_sources_kind ON knowledge_sources(source_kind)"),
  ]);
}

async function runInBatches(db: D1Database, statements: D1PreparedStatement[]) {
  for (let index = 0; index < statements.length; index += 40) {
    await db.batch(statements.slice(index, index + 40));
  }
}

export async function handleKnowledgeApi(request: Request, env: KnowledgeEnv): Promise<Response> {
  if (!env.DB) {
    return Response.json({ error: "Knowledge database is not configured." }, { status: 503 });
  }

  await ensureKnowledgeSchema(env.DB);
  const url = new URL(request.url);

  if (request.method === "GET") {
    const query = (url.searchParams.get("q") || "").trim();
    const sourceKind = (url.searchParams.get("source_kind") || "").trim();
    const sourceId = (url.searchParams.get("source_id") || "").trim();
    const clauses: string[] = [];
    const bindings: string[] = [];

    if (query) {
      clauses.push("(c.content LIKE ? OR c.section LIKE ? OR s.title LIKE ?)");
      const like = `%${query}%`;
      bindings.push(like, like, like);
    }
    if (sourceKind) {
      clauses.push("s.source_kind = ?");
      bindings.push(sourceKind);
    }
    if (sourceId) {
      clauses.push("s.source_id = ?");
      bindings.push(sourceId);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const chunkStatement = env.DB.prepare(`
      SELECT c.chunk_id, c.source_id, c.section, c.content, c.token_length,
             c.source_chunk_number, s.title AS source_title, s.source_kind,
             s.authority_note
      FROM knowledge_chunks c
      JOIN knowledge_sources s ON s.source_id = c.source_id
      ${where}
      ORDER BY c.chunk_id
      LIMIT 150
    `).bind(...bindings);
    const countStatement = env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM knowledge_chunks c
      JOIN knowledge_sources s ON s.source_id = c.source_id
      ${where}
    `).bind(...bindings);

    const [chunks, count, sources, totals] = await Promise.all([
      chunkStatement.all(),
      countStatement.first<{ count: number }>(),
      env.DB.prepare(`SELECT source_id, title, source_kind, format, authority_note,
        origin_label, byte_size, content_mode, imported_at
        FROM knowledge_sources ORDER BY source_kind, title`).all(),
      env.DB.prepare(`SELECT
        (SELECT COUNT(*) FROM knowledge_chunks) AS chunks,
        (SELECT COUNT(*) FROM knowledge_sources) AS sources,
        (SELECT COUNT(*) FROM knowledge_chunks WHERE source_id IN
          (SELECT source_id FROM knowledge_sources WHERE source_kind = 'project_rule')) AS project_rules,
        (SELECT COUNT(*) FROM knowledge_chunks WHERE source_id IN
          (SELECT source_id FROM knowledge_sources WHERE source_kind = 'collected_reference')) AS collected_references
      `).first(),
    ]);

    return Response.json({
      chunks: chunks.results,
      result_count: Number(count?.count || 0),
      sources: sources.results,
      totals,
    });
  }

  if (request.method === "POST") {
    const secret = request.headers.get("x-aurelia-import-secret");
    if (!env.AURELIA_IMPORT_SECRET || secret !== env.AURELIA_IMPORT_SECRET) {
      return Response.json({ error: "Import authorization failed." }, { status: 401 });
    }

    const body = await request.json() as { sources?: SourceInput[]; chunks?: ChunkInput[] };
    const now = new Date().toISOString();
    const sourceStatements = (body.sources || []).map((source) => env.DB.prepare(`
      INSERT INTO knowledge_sources
        (source_id, title, source_kind, format, authority_note, origin_label, content,
         byte_size, content_mode, imported_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source_id) DO UPDATE SET
        title = excluded.title,
        source_kind = excluded.source_kind,
        format = excluded.format,
        authority_note = excluded.authority_note,
        origin_label = excluded.origin_label,
        content = excluded.content,
        byte_size = excluded.byte_size,
        content_mode = excluded.content_mode,
        imported_at = excluded.imported_at
    `).bind(
      source.source_id,
      source.title,
      source.source_kind,
      source.format,
      source.authority_note,
      source.origin_label,
      source.content || null,
      source.byte_size || 0,
      source.content_mode || "private_text",
      now,
    ));
    await runInBatches(env.DB, sourceStatements);

    const chunkStatements = (body.chunks || []).map((chunk) => env.DB.prepare(`
      INSERT INTO knowledge_chunks
        (chunk_id, source_id, section, content, token_length, source_chunk_number, imported_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(chunk_id) DO UPDATE SET
        source_id = excluded.source_id,
        section = excluded.section,
        content = excluded.content,
        token_length = excluded.token_length,
        source_chunk_number = excluded.source_chunk_number,
        imported_at = excluded.imported_at
    `).bind(
      chunk.chunk_id,
      chunk.source_id,
      chunk.section,
      chunk.content,
      chunk.token_length || 0,
      chunk.source_chunk_number || 0,
      now,
    ));
    await runInBatches(env.DB, chunkStatements);

    const totals = await env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM knowledge_chunks) AS chunks,
      (SELECT COUNT(*) FROM knowledge_sources) AS sources
    `).first();
    return Response.json({ imported: { sources: sourceStatements.length, chunks: chunkStatements.length }, totals });
  }

  return new Response("Method not allowed", { status: 405 });
}
