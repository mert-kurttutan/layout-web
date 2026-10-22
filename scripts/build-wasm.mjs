import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const layoutRepo = resolve(appRoot, process.env.LAYOUT_RS_PATH || '../layout');
const wasmCrate = resolve(layoutRepo, 'wasm');
const outputDirectory = resolve(appRoot, 'src/lib/layout-wasm');

function rustcOutput(args) {
  const result = spawnSync('rustup', ['run', 'stable', 'rustc', ...args], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || `rustc ${args.join(' ')} failed\n`);
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

const sysroot = rustcOutput(['--print', 'sysroot']);
const host = rustcOutput(['-vV']).match(/^host: (.+)$/m)?.[1];
if (!host) {
  throw new Error('Could not determine the Rust host target');
}

const hostKey = host.toUpperCase().replaceAll('-', '_');
const env = {
  ...process.env,
  [`CARGO_TARGET_${hostKey}_LINKER`]: process.env.CC || 'cc',
  CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_LINKER: join(
    sysroot,
    'lib',
    'rustlib',
    host,
    'bin',
    'rust-lld',
  ),
};

const build = spawnSync(
  'nix',
  [
    'develop',
    layoutRepo,
    '--command',
    'rustup',
    'run',
    'stable',
    'wasm-pack',
    'build',
    wasmCrate,
    '--target',
    'web',
    '--out-dir',
    outputDirectory,
  ],
  { cwd: appRoot, env, stdio: 'inherit' },
);

if (build.error) throw build.error;
process.exit(build.status ?? 1);
