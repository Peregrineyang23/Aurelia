"use client";

import { useEffect, useMemo, useState } from "react";

type Source = {
  source_id: string;
  title: string;
  source_kind: string;
  format: string;
  authority_note: string;
  origin_label: string;
  byte_size: number;
  content_mode: string;
  imported_at: string;
};

type Chunk = {
  chunk_id: string;
  source_id: string;
  source_title: string;
  source_kind: string;
  section: string;
  content: string;
  token_length: number;
  source_chunk_number: number;
  authority_note: string;
};

type KnowledgeResponse = {
  chunks: Chunk[];
  result_count: number;
  sources: Source[];
  totals: {
    chunks: number;
    sources: number;
    project_rules: number;
    collected_references: number;
  } | null;
};

const kindLabels: Record<string, string> = {
  collected_reference: "Collected reference",
  project_rule: "Project rule",
  knowledge_asset: "Knowledge asset",
  derived_index: "Derived index",
};

export default function KnowledgeBrowser() {
  const [query, setQuery] = useState("");
  const [sourceKind, setSourceKind] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [data, setData] = useState<KnowledgeResponse | null>(null);
  const [selected, setSelected] = useState<Chunk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (sourceKind) params.set("source_kind", sourceKind);
      if (sourceId) params.set("source_id", sourceId);
      try {
        const response = await fetch(`/api/knowledge?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Knowledge index is temporarily unavailable.");
        const next = await response.json() as KnowledgeResponse;
        setData(next);
        setError("");
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Unable to load knowledge.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, sourceKind, sourceId]);

  const visibleSources = useMemo(() => {
    if (!data) return [];
    return sourceKind ? data.sources.filter((source) => source.source_kind === sourceKind) : data.sources;
  }, [data, sourceKind]);

  return <section className="knowledge-browser">
    <div className="knowledge-summary">
      <div><strong>{data?.totals?.chunks ?? 117}</strong><span>Traceable chunks</span></div>
      <div><strong>{data?.totals?.sources ?? 8}</strong><span>Private sources</span></div>
      <div><strong>{data?.totals?.collected_references ?? 108}</strong><span>Collected references</span></div>
      <div><strong>{data?.totals?.project_rules ?? 9}</strong><span>Project rules</span></div>
    </div>

    <div className="knowledge-controls">
      <label className="knowledge-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ACC, ICA, NOA, ramps, reflections…" /></label>
      <select aria-label="Filter by knowledge type" value={sourceKind} onChange={(event) => { setSourceKind(event.target.value); setSourceId(""); }}>
        <option value="">All knowledge types</option>
        <option value="collected_reference">Collected reference</option>
        <option value="project_rule">Project rule</option>
        <option value="knowledge_asset">Knowledge asset</option>
        <option value="derived_index">Derived index</option>
      </select>
      <select aria-label="Filter by source" value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
        <option value="">All sources</option>
        {visibleSources.map((source) => <option key={source.source_id} value={source.source_id}>{source.title}</option>)}
      </select>
    </div>

    <div className="knowledge-result-head">
      <div><span className="eyebrow">PINAKES RETRIEVAL</span><h2>{loading ? "Searching private index…" : `${data?.result_count ?? 0} matching fragments`}</h2></div>
      <span className="privacy-chip">PRIVATE D1 · SOURCE TRACE ON</span>
    </div>

    {error && <div className="knowledge-empty"><b>Private index unavailable</b><p>{error}</p></div>}
    {!error && !loading && data?.chunks.length === 0 && <div className="knowledge-empty"><b>No matching fragment</b><p>Try a broader term or reset the source filters.</p></div>}
    {!error && <div className="knowledge-results">
      {(data?.chunks || []).map((chunk) => <button key={chunk.chunk_id} onClick={() => setSelected(chunk)}>
        <div className="chunk-meta"><span className={`kind-badge ${chunk.source_kind}`}>{kindLabels[chunk.source_kind] || chunk.source_kind}</span><code>{chunk.chunk_id}</code></div>
        <h3>{chunk.section}</h3>
        <p>{chunk.content}</p>
        <footer><span>{chunk.source_title}</span><b>View trace →</b></footer>
      </button>)}
    </div>}

    <div className="source-register">
      <div className="section-head"><div><span className="eyebrow">SOURCE REGISTER</span><h2>Eight governed knowledge sources</h2></div></div>
      <div>{(data?.sources || []).map((source) => <article key={source.source_id}>
        <span className={`kind-badge ${source.source_kind}`}>{kindLabels[source.source_kind] || source.source_kind}</span>
        <div><h3>{source.title}</h3><p>{source.authority_note}</p><small>{source.origin_label} · {source.format} · {source.content_mode}</small></div>
      </article>)}</div>
    </div>

    {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><aside className="drawer knowledge-drawer" onClick={(event) => event.stopPropagation()}>
      <button className="close" onClick={() => setSelected(null)}>×</button>
      <span className={`kind-badge ${selected.source_kind}`}>{kindLabels[selected.source_kind] || selected.source_kind}</span>
      <h2>{selected.chunk_id}</h2>
      <p>{selected.content}</p>
      <dl>
        <div><dt>Source</dt><dd>{selected.source_title}</dd></div>
        <div><dt>Section</dt><dd>{selected.section}</dd></div>
        <div><dt>Chunk identity</dt><dd>{selected.chunk_id} · source block {selected.source_chunk_number}</dd></div>
        <div><dt>Authority note</dt><dd>{selected.authority_note}</dd></div>
      </dl>
    </aside></div>}
  </section>;
}
