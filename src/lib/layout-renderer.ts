import initWasm, { render_dot } from "./layout-wasm/layout_wasm.js";

export interface RenderOptions {
  disableOptimizations?: boolean;
  disableLayout?: boolean;
}

let wasmInitialization: Promise<void> | undefined;

export function initializeLayoutRenderer(): Promise<void> {
  wasmInitialization ??= initWasm().then(() => undefined);
  return wasmInitialization;
}

export async function renderDot(source: string, options: RenderOptions = {}): Promise<string> {
  await initializeLayoutRenderer();
  return render_dot(source, options.disableOptimizations ?? false, options.disableLayout ?? false);
}
