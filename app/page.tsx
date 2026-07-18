"use client";

import { useMemo, useState } from "react";

type Project = {
  name: string;
  path: string;
  lane: string;
  summary: string;
  tags: string[];
  activity: number;
  tone: string;
};

const projects: Project[] = [
  { name: "Pharos", path: "Weekly Report / Pharos", lane: "AI Collective", summary: "以亚历山大灯塔为中心的多 Agent 聚合体与三维岛屿世界。", tags: ["Agents", "Three.js", "Organization"], activity: 96, tone: "amber" },
  { name: "Teamwork HMI Design", path: "Documents / Teamwork_HMI_Design", lane: "Design Organization", summary: "Unity HMI 团队领域阵型、项目担当、实时任务与 AI Worker 协作协议。", tags: ["HMI", "DDD", "Management"], activity: 94, tone: "olive" },
  { name: "Spatial AIOS", path: "Documents / Spatial AIOS", lane: "Embodied Mobility", summary: "从 SR 应用走向空间感知、空间记忆与具身智能汽车操作系统。", tags: ["AIOS", "Spatial Memory", "Cockpit"], activity: 90, tone: "blue" },
  { name: "AI Cowork", path: "Documents / AI cowork", lane: "Agent Infrastructure", summary: "帆½、Lark Bridge、跨设备 Agent Mesh、音乐与车辆可视化实验。", tags: ["帆½", "Lark", "Mesh"], activity: 88, tone: "orange" },
  { name: "Weekly Report", path: "Documents / Weekly Report", lane: "Leadership Intelligence", summary: "跨 Figma、飞书、会议与本地交付物的周度工作数据挖掘。", tags: ["Reports", "Evidence", "Leadership"], activity: 84, tone: "amber" },
  { name: "Design Cognition Alignment", path: "Documents / Design Cognition Alignment", lane: "Design Governance", summary: "设计质量分级、认知对齐、评审机制与风险升级路径。", tags: ["Quality", "Review", "Standards"], activity: 72, tone: "olive" },
  { name: "Design Management", path: "Documents / Design Management", lane: "Design Analytics", summary: "项目人力、领域投入、活跃度与设计管理洞察框架。", tags: ["Workload", "Insights", "Operations"], activity: 68, tone: "blue" },
  { name: "Cinematic Motion", path: "Documents / Cinematic Motion Shot Design", lane: "Motion & Film", summary: "驾驶模式运镜、电影化分镜与多时段环境视觉生成工作流。", tags: ["Motion", "Storyboard", "Automotive"], activity: 74, tone: "orange" },
  { name: "Dongfeng 8397", path: "Documents / Dongfeng8397", lane: "Automotive HMI", summary: "车辆能量流、机械结构简化与高端 HMI 视觉语言。", tags: ["Energy", "Visualization", "UI"], activity: 66, tone: "amber" },
  { name: "Creative Design", path: "Documents / Creative Design", lane: "Future Experience", summary: "潮玩、空间尺度切换与未来信号车辆的创意设计研究。", tags: ["Creative", "Spatial", "Trend"], activity: 62, tone: "olive" },
  { name: "Pets", path: "Documents / Pets", lane: "Character Agents", summary: "可视化 AI 角色、行为状态与 Codex 动态宠物资产生产。", tags: ["Character", "Sprites", "AI Worker"], activity: 70, tone: "blue" },
  { name: "Auto Show 2026", path: "my_work / Auto_show_2026", lane: "Mobility Futures", summary: "车展趋势、具身智能技术路径与汽车体验概念探索。", tags: ["Research", "VLA", "World Model"], activity: 58, tone: "orange" },
  { name: "Design System", path: "Claude / Projects / Design System", lane: "System Craft", summary: "跨屏幕设计系统、Figma 变量与座舱 UI 规范。", tags: ["Figma", "Tokens", "Responsive"], activity: 55, tone: "amber" },
  { name: "Particles", path: "Claude / Projects / particles", lane: "Generative Art", summary: "粒子宇宙、音乐可视化与 Boids 驱动的交互桌面。", tags: ["Generative", "Music", "Boids"], activity: 52, tone: "olive" },
];

const conversations = [
  ["Aurelia · 构建 Codex LLM Wiki", "Knowledge Architecture", "今天", "14 项目 · 43 对话 · 29 领域"],
  ["Pharos 岛与 AI Worker 聚合体", "Agent Collective", "今天", "三维岛屿 · 灯塔 · 20+ Worker"],
  ["项目工作担当分析", "Design Organization", "7月12日", "DDD 阵型 · 负载 · 协作"],
  ["Unity HMI 实时任务看板", "Design Operations", "7月11日", "自动采集 · 飞书 · 风险"],
  ["帆½ 飞书反馈与卡片系统", "AI Worker", "7月10日", "Bridge · Reply Cards · Protocol"],
  ["Spatial AIOS 与空间记忆 MVP", "Embodied Mobility", "6月20日", "SR · World Model · 3D"],
  ["Pets AIOS 多角色座舱", "Character Agents", "6月18日", "Personality · Harness · Voice"],
  ["汽车能量管理 UI 简化", "Automotive HMI", "5月28日", "Energy Flow · Visual Language"],
  ["驾驶模式电影级运镜", "Motion & Film", "5月24日", "Storyboard · Figma · Camera"],
  ["设计质量与认知对齐", "Design Governance", "7月8日", "Quality Gate · Review"],
];

const domains = {
  "Design Domain": ["Launcher", "Car Setting", "Navigation", "ADAS", "Media", "AI Center", "UX Framework", "Car Visualization", "Motion", "Smart Cockpit", "Character", "Movie Creative", "Creative", "Game Design", "Design Support"],
  "Design System": ["UI Kit", "Style Library", "Icon Library", "Image Library", "Motion Library", "3D Assets", "3D Engine", "HMI Agents"],
  "Design Management": ["Cognitive Align", "Action Plan", "Design Specification", "Workflow", "File Management", "Realtime Task"],
};

const routes = [
  { title: "Art → Intelligence", text: "从角色、电影、动效与生成艺术进入 AI Worker 的表达、性格和交互。", nodes: ["Creative Design", "Cinematic Motion", "Pets", "Pharos"] },
  { title: "Vehicle → Spatial OS", text: "从车控、导航与车辆可视化，走向空间记忆和具身智能座舱。", nodes: ["Dongfeng 8397", "Teamwork HMI", "Spatial AIOS"] },
  { title: "Team → Agent Collective", text: "从领域阵型与实时任务，扩展到个人 Wiki、AI Worker 和 Pharos 联邦知识。", nodes: ["Design Management", "帆½", "Aurelia", "Pharos"] },
];

const nav = ["Overview", "Projects", "Conversations", "Domains", "Federation"];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("All lanes");
  const [selected, setSelected] = useState<Project | null>(null);
  const [routeProject, setRouteProject] = useState<Project | null>(null);
  const lanes = ["All lanes", ...Array.from(new Set(projects.map((p) => p.lane)))];
  const filtered = useMemo(() => projects.filter((p) => {
    const haystack = `${p.name} ${p.summary} ${p.tags.join(" ")} ${p.lane}`.toLowerCase();
    return (lane === "All lanes" || p.lane === lane) && haystack.includes(query.toLowerCase());
  }), [query, lane]);

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>A</span></div>
        <div className="brand-copy"><strong>Aurelia</strong><small>PHAROS KNOWLEDGE ATLAS</small></div>
        <nav>{nav.map((item) => <button key={item} className={active === item ? "active" : ""} onClick={() => { setActive(item); setRouteProject(null); }}><span className="nav-dot" />{item}</button>)}</nav>
        <div className="side-note">
          <span className="eyebrow">KNOWLEDGE KEEPER</span>
          <div className="worker"><div className="worker-orbit">½</div><div><b>帆½</b><small>Company AI Worker</small></div></div>
          <p>连接个人工作、团队领域与 Pharos 集体智能。</p>
        </div>
        <div className="sync"><i /> Indexed · 2026.07.13</div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="search"><span>⌕</span><input aria-label="Search Aurelia" placeholder="Search Pinakes — projects, domains, conversations…" value={query} onChange={(e) => setQuery(e.target.value)} /><kbd>⌘ K</kbd></div>
          <div className="top-actions"><button className="round">↗</button><div className="avatar">YF</div></div>
        </header>

        {active === "Overview" && <div className="page">
          <section className="hero">
            <div className="hero-copy"><span className="eyebrow">THE LIVING KNOWLEDGE ROUTES OF PHAROS</span><h1>Every idea leaves<br />a <em>road</em> behind.</h1><p>Aurelia connects your art, automotive HMI, spatial intelligence and AI workers into one evolving knowledge atlas.</p><div className="hero-actions"><button onClick={() => setActive("Projects")}>Explore the atlas <b>→</b></button><span>Pinakes index active</span></div></div>
            <div className="atlas-art" aria-label="Aurelia knowledge route map">
              <div className="sun"/><div className="road road-a"/><div className="road road-b"/><div className="road road-c"/>
              <div className="node node-a"><i>PH</i><span>Pharos</span></div><div className="node node-b"><i>½</i><span>帆½</span></div><div className="node node-c"><i>AI</i><span>Spatial AIOS</span></div><div className="node node-d"><i>DS</i><span>Design System</span></div>
              <div className="legend">AURELIA NETWORK · 2026</div>
            </div>
          </section>

          <section className="metrics">
            <div><strong>14</strong><span>Codex Projects</span><small>Across 8 knowledge lanes</small></div>
            <div><strong>43</strong><span>Recent Conversations</span><small>Indexed by Pinakes</small></div>
            <div><strong>29</strong><span>Team Domains</span><small>DD · DS · DM formation</small></div>
            <div><strong>3</strong><span>Knowledge Layers</span><small>Human · Agent · Collective</small></div>
          </section>

          <div className="section-head"><div><span className="eyebrow">KNOWLEDGE ROUTES</span><h2>Paths through your practice</h2></div><button onClick={() => setActive("Domains")}>View domain formation →</button></div>
          <section className="route-grid">{routes.map((r, idx) => <article key={r.title}><span className="route-num">0{idx + 1}</span><h3>{r.title}</h3><p>{r.text}</p><div className="route-line">{r.nodes.map((n) => <span key={n}>{n}</span>)}</div></article>)}</section>

          <div className="section-head"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Conversations becoming knowledge</h2></div><button onClick={() => setActive("Conversations")}>Open all 43 conversations →</button></div>
          <section className="conversation-list compact">{conversations.slice(0, 5).map((c, i) => <article key={c[0]}><span className="index">{String(i + 1).padStart(2, "0")}</span><div><h3>{c[0]}</h3><p>{c[3]}</p></div><span className="pill">{c[1]}</span><time>{c[2]}</time><b>↗</b></article>)}</section>
        </div>}

        {active === "Projects" && !routeProject && <div className="page subpage">
          <div className="title-row"><div><span className="eyebrow">PROJECT ATLAS</span><h1>Fourteen active worlds.</h1><p>每个项目是一段设计实践，也是一条可以被其他 Agent 重新进入的知识路径。</p></div><div className="big-number">14</div></div>
          <div className="filters"><div className="filter-search">⌕ <input placeholder="Filter projects…" value={query} onChange={(e) => setQuery(e.target.value)}/></div><select value={lane} onChange={(e) => setLane(e.target.value)}>{lanes.map((x) => <option key={x}>{x}</option>)}</select><span>{filtered.length} visible</span></div>
          <section className="project-grid">{filtered.map((p) => <button className="project-card" key={p.name} onClick={() => setSelected(p)}><div className={`project-visual ${p.tone}`}><span>{p.name.slice(0, 2).toUpperCase()}</span><i style={{width: `${p.activity}%`}} /></div><div className="project-body"><span className="eyebrow">{p.lane}</span><h2>{p.name}</h2><p>{p.summary}</p><div>{p.tags.map((t) => <small key={t}>{t}</small>)}</div></div><b>↗</b></button>)}</section>
        </div>}

        {active === "Projects" && routeProject && <div className="page subpage route-page">
          <button className="route-back" onClick={() => setRouteProject(null)}>← Back to Project Atlas</button>
          <section className="route-hero">
            <div className="route-hero-copy"><span className="eyebrow">PROJECT KNOWLEDGE ROUTE · {routeProject.lane.toUpperCase()}</span><h1>{routeProject.name}</h1><p>{routeProject.summary}</p><div className="route-tags">{routeProject.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
            <div className={`route-emblem ${routeProject.tone}`}><span>{routeProject.name.slice(0, 2).toUpperCase()}</span><i /><i /><i /></div>
          </section>
          <section className="route-meta">
            <div><span>SOURCE</span><b>{routeProject.path}</b></div><div><span>KNOWLEDGE LANE</span><b>{routeProject.lane}</b></div><div><span>ACTIVITY SIGNAL</span><b>{routeProject.activity}% indexed</b></div><div><span>OWNERSHIP</span><b>Yangfan · 帆½</b></div>
          </section>
          <div className="route-layout">
            <section className="route-timeline">
              <div className="section-head"><div><span className="eyebrow">KNOWLEDGE JOURNEY</span><h2>From source to collective memory</h2></div></div>
              {[{n:"01",title:"Source material",text:`原始项目文件、设计资产与交付记录保存在 ${routeProject.path}。`,type:"LOCAL SOURCE"},{n:"02",title:"Design reasoning",text:`与 ${routeProject.tags.join("、")} 相关的对话被 Pinakes 归档为可追溯的设计判断。`,type:"CODEX CONVERSATIONS"},{n:"03",title:"Domain knowledge",text:`知识被映射到 ${routeProject.lane}，并使用统一领域标签进入 Aurelia 检索。`,type:"AURELIA INDEX"},{n:"04",title:"Team federation",text:"经确认可共享的摘要、向量与引用提交到 Pharos，供团队 AI Workers 联邦检索。",type:"PHAROS"}].map((step) => <article key={step.n}><span>{step.n}</span><div><small>{step.type}</small><h3>{step.title}</h3><p>{step.text}</p></div></article>)}
            </section>
            <aside className="route-aside">
              <span className="eyebrow">RELATED KNOWLEDGE</span><h2>Connected routes</h2>
              {projects.filter((p) => p.name !== routeProject.name && (p.lane === routeProject.lane || p.tags.some((t) => routeProject.tags.includes(t)))).slice(0,3).map((p) => <button key={p.name} onClick={() => setRouteProject(p)}><i className={p.tone}>{p.name.slice(0,2).toUpperCase()}</i><span><b>{p.name}</b><small>{p.lane}</small></span><strong>→</strong></button>)}
              <div className="route-note"><span>PINAKES ID</span><code>yangfan.{routeProject.lane.toLowerCase().replaceAll(" ", "-")}.project.{routeProject.name.toLowerCase().replaceAll(" ", "-")}</code><p>本知识路径遵循 Aurelia 联邦命名与检索规范。</p></div>
            </aside>
          </div>
        </div>}

        {active === "Conversations" && <div className="page subpage">
          <div className="title-row"><div><span className="eyebrow">CONVERSATION ARCHIVE</span><h1>Thinking, made traceable.</h1><p>对话不是瞬时记录，而是决策、方法、命名和知识演化的证据链。</p></div><div className="big-number">43</div></div>
          <section className="conversation-list">{conversations.map((c, i) => <article key={c[0]}><span className="index">{String(i + 1).padStart(2, "0")}</span><div><h3>{c[0]}</h3><p>{c[3]}</p></div><span className="pill">{c[1]}</span><time>{c[2]}</time><b>↗</b></article>)}</section>
          <div className="archive-note">Showing the most connected conversations. Pinakes has indexed 43 recent Codex tasks across 18 working contexts.</div>
        </div>}

        {active === "Domains" && <div className="page subpage">
          <div className="title-row"><div><span className="eyebrow">UNITY HMI DOMAIN FORMATION</span><h1>One practice, three systems.</h1><p>领域阵型把设计产出、设计资产与设计管理连接成可复用的团队能力。</p></div><div className="big-number">29</div></div>
          <section className="domain-columns">{Object.entries(domains).map(([group, items], gi) => <article key={group}><header><span>0{gi + 1}</span><div><h2>{group}</h2><small>{items.length} domains</small></div></header><div>{items.map((x, i) => <p key={x}><i>{String(i + 1).padStart(2, "0")}</i><span>{x}</span><b>→</b></p>)}</div></article>)}</section>
        </div>}

        {active === "Federation" && <div className="page subpage federation">
          <div className="title-row"><div><span className="eyebrow">PHAROS KNOWLEDGE FEDERATION</span><h1>Local roots.<br />Collective intelligence.</h1><p>每个人与 AI Worker 拥有自己的知识主权；Pharos 汇总可共享的结构化知识，而不是复制全部私人内容。</p></div><div className="federation-seal">φ</div></div>
          <section className="layer-stack">
            <article><span>01</span><div><h2>Local Wiki · 权威知识源</h2><p>个人项目目录保存原始文档、资产、对话摘要与版本历史。Aurelia 是杨帆与帆½的个人 Wiki。</p></div><b>Source of truth</b></article>
            <article><span>02</span><div><h2>Feishu · 人类协作界面</h2><p>发布适合阅读、评审和共同编辑的页面；飞书文档保留原知识单元 ID 与本地来源链接。</p></div><b>Collaboration</b></article>
            <article><span>03</span><div><h2>Pharos · 团队联邦索引</h2><p>只接收声明为 team / public 的知识卡片、摘要、向量和引用，统一检索但不夺走个人所有权。</p></div><b>Federated retrieval</b></article>
          </section>
          <div className="section-head"><div><span className="eyebrow">SHARED CONTRACT</span><h2>A common grammar for every Wiki</h2></div></div>
          <section className="contract-grid">
            <article><span>IDENTITY</span><h3>统一命名</h3><p><code>owner.domain.kind.slug</code></p><small>例：yangfan.dd010.insight.energy-flow</small></article>
            <article><span>SCHEMA</span><h3>统一知识卡片</h3><p>标题 · 摘要 · 来源 · 领域 · 状态 · 权限 · 版本</p><small>人类与 Agent 都可读写同一结构</small></article>
            <article><span>VECTOR</span><h3>统一向量策略</h3><p>同一嵌入模型、切块规则、语言标签与版本号</p><small>向量可重建，原文始终可追溯</small></article>
            <article><span>RETRIEVAL</span><h3>统一检索顺序</h3><p>权限 → 元数据 → 关键词 → 向量 → 重排 → 引用</p><small>领域与时效优先于纯相似度</small></article>
          </section>
          <section className="flow"><div className="flow-node"><i>YF</i><b>Human Wiki</b><small>Aurelia</small></div><span>＋</span><div className="flow-node"><i>½</i><b>Agent Wiki</b><small>帆½ Memory</small></div><span>→</span><div className="flow-node dark"><i>φ</i><b>Pharos</b><small>Team Atlas</small></div></section>
        </div>}
      </section>

      {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><aside className="drawer" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><span className="eyebrow">{selected.lane}</span><h2>{selected.name}</h2><p>{selected.summary}</p><div className={`drawer-visual ${selected.tone}`}><span>{selected.name.slice(0, 2).toUpperCase()}</span></div><dl><div><dt>Knowledge path</dt><dd>{selected.path}</dd></div><div><dt>Activity signal</dt><dd>{selected.activity}%</dd></div><div><dt>Indexed tags</dt><dd>{selected.tags.join(" · ")}</dd></div></dl><button className="primary" onClick={() => { setRouteProject(selected); setSelected(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Open knowledge route →</button></aside></div>}
    </main>
  );
}
