<script lang="ts">
  import { onDestroy } from 'svelte';
  import { renderDot } from './lib';

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
  let svgUrl = $state('');
  let status = $state('Ready');
  let lastCompiledAt = $state('');
  let fileInput: HTMLInputElement | undefined = $state();
  const lineCount = $derived(dotSource.trim() ? dotSource.split(/\r?\n/).length : 0);
  const charCount = $derived(dotSource.length);

  function setSvgPreview(svg: string) {
    if (svgUrl) URL.revokeObjectURL(svgUrl);
    svgUrl = svg ? URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })) : '';
  }

  async function compilePreview() {
    status = 'Compiling…';
    try {
      setSvgPreview(await renderDot(dotSource));
      status = 'Compiled by layout-rs WASM';
      lastCompiledAt = new Date().toLocaleTimeString();
    } catch (error) {
      setSvgPreview('');
      status = `Compile failed: ${error instanceof Error ? error.message : String(error)}`;
      lastCompiledAt = '';
    }
  }

  onDestroy(() => {
    if (svgUrl) URL.revokeObjectURL(svgUrl);
  });

  function clearPreview(statusText: string) {
    setSvgPreview('');
    status = statusText;
    lastCompiledAt = '';
  }

  function clearEditor() {
    dotSource = '';
    clearPreview('Cleared');
  }

  function resetSample() {
    dotSource = sampleDot;
    clearPreview('Sample loaded');
  }

  function openFilePicker() {
    fileInput?.click();
  }

  async function loadDotFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    dotSource = await file.text();
    clearPreview(`Loaded ${file.name}`);
    input.value = '';
  }

  void compilePreview();
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
        {#if svgUrl}
          <img class="svg-preview" src={svgUrl} alt="Rendered DOT graph" />
        {:else}
          <p class="empty-state">Compile DOT to show SVG output.</p>
        {/if}
      </div>
    </article>
  </section>

  <footer class="statusbar">
    <span>Compiler: layout-rs WebAssembly</span>
    <span>Output target: SVG</span>
  </footer>
</main>
