<script lang="ts">
  const sampleDot = `digraph G {
  rankdir=LR;
  node [shape=box, style="rounded,filled", fillcolor="#eef2ff"];

  parse [label="Parse DOT"];
  layout [label="Layout graph"];
  render [label="Render SVG"];

  parse -> layout;
  layout -> render;
}`;

  let dotSource = $state(sampleDot);
  let svgOutput = $state('');
  let status = $state('Ready');
  let lastCompiledAt = $state('');
  let fileInput: HTMLInputElement | undefined = $state();

  const lineCount = $derived(dotSource.trim() ? dotSource.split(/\r?\n/).length : 0);
  const charCount = $derived(dotSource.length);

  function escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function compilePreview() {
    status = 'Compiled with placeholder renderer';
    lastCompiledAt = new Date().toLocaleTimeString();
    svgOutput = createPlaceholderSvg(dotSource);
  }

  function createPlaceholderSvg(source: string) {
    const title = source.match(/(?:di)?graph\s+([A-Za-z0-9_]+)/)?.[1] ?? 'DOT graph';
    const edges = [...source.matchAll(/([A-Za-z0-9_"]+)\s*->\s*([A-Za-z0-9_"]+)/g)].slice(0, 4);
    const edgeLabels = edges.length
      ? edges.map((edge) => `${edge[1].replaceAll('"', '')} -> ${edge[2].replaceAll('"', '')}`)
      : ['WASM compiler output will render here'];

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 420" role="img" aria-label="${escapeHtml(title)} preview">
  <rect width="760" height="420" rx="0" fill="#f8fafc"/>
  <rect x="44" y="42" width="672" height="336" rx="8" fill="#ffffff" stroke="#d4d8e2"/>
  <text x="72" y="88" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" fill="#111827">${escapeHtml(title)}</text>
  <text x="72" y="118" font-family="ui-monospace, SFMono-Regular, monospace" font-size="13" fill="#667085">temporary UI renderer</text>
  ${edgeLabels
    .map((label, index) => {
      const x = 92 + index * 148;
      const nextX = x + 96;
      return `<g>
    <rect x="${x}" y="178" width="112" height="58" rx="7" fill="#edf5ff" stroke="#9dbce8"/>
    <text x="${x + 56}" y="212" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#12365f">${escapeHtml(label)}</text>
    ${index < edgeLabels.length - 1 ? `<path d="M ${nextX} 207 L ${nextX + 44} 207" stroke="#4b5563" stroke-width="2" marker-end="url(#arrow)"/>` : ''}
  </g>`;
    })
    .join('')}
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#4b5563"/>
    </marker>
  </defs>
</svg>`;
  }

  function clearEditor() {
    dotSource = '';
    svgOutput = '';
    status = 'Cleared';
    lastCompiledAt = '';
  }

  function resetSample() {
    dotSource = sampleDot;
    svgOutput = '';
    status = 'Sample loaded';
    lastCompiledAt = '';
  }

  function openFilePicker() {
    fileInput?.click();
  }

  async function loadDotFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    dotSource = await file.text();
    svgOutput = '';
    status = `Loaded ${file.name}`;
    lastCompiledAt = '';
    input.value = '';
  }

  compilePreview();
</script>

<main class="app-shell">
  <header class="topbar">
    <div>
      <p class="eyebrow">layout-rs web</p>
      <h1>Graphviz DOT Viewer</h1>
    </div>
    <div class="toolbar" aria-label="Graph actions">
      <input
        bind:this={fileInput}
        class="file-input"
        type="file"
        accept=".dot,.gv,text/vnd.graphviz,text/plain"
        onchange={loadDotFile}
      />
      <button class="button secondary" type="button" onclick={openFilePicker}>Open DOT</button>
      <button class="button secondary" type="button" onclick={resetSample}>Sample</button>
      <button class="button secondary" type="button" onclick={clearEditor}>Clear</button>
      <button class="button primary" type="button" onclick={compilePreview}>Compile</button>
    </div>
  </header>

  <section class="workspace" aria-label="DOT editor and compiled output">
    <article class="pane editor-pane">
      <div class="pane-header">
        <div>
          <h2>DOT file</h2>
          <p>{lineCount} lines, {charCount} chars</p>
        </div>
        <span class="badge">input</span>
      </div>
      <textarea
        bind:value={dotSource}
        spellcheck="false"
        aria-label="DOT source editor"
      ></textarea>
    </article>

    <article class="pane preview-pane">
      <div class="pane-header">
        <div>
          <h2>Produced SVG</h2>
          <p>{status}{lastCompiledAt ? ` at ${lastCompiledAt}` : ''}</p>
        </div>
        <span class="badge">output</span>
      </div>
      <div class="preview-surface" aria-live="polite">
        {#if svgOutput}
          {@html svgOutput}
        {:else}
          <p class="empty-state">Compile DOT to show SVG output.</p>
        {/if}
      </div>
    </article>
  </section>

  <footer class="statusbar">
    <span>Compiler bridge: pending WASM integration</span>
    <span>Output target: SVG</span>
  </footer>
</main>
