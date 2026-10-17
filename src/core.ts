import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

interface BuildInfo {
  app: { version: string };
}

export interface WriteOptions {
  /** Project folder containing package.json. Defaults to the current directory. */
  root?: string;
  /** Build output folder to write version.json into, relative to root. Auto-detected under dist/ when omitted. */
  out?: string;
}

// index.csr.html is what Angular SSR emits instead of index.html
const ENTRY_FILES = ['index.html', 'index.csr.html'];

function readVersion(root: string): string {
  const file = join(root, 'package.json');
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  if (!pkg.version) {
    throw new Error(`ui-actuator: no "version" field in ${file}`);
  }
  return pkg.version;
}

// Folders under dir (max 3 levels deep) that contain an index.html, i.e. the folders that get deployed
function findWebRoots(dir: string, depth = 3): string[] {
  if (ENTRY_FILES.some((f) => existsSync(join(dir, f)))) return [dir];
  if (depth === 0) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => findWebRoots(join(dir, entry.name), depth - 1));
}

function detectOutDir(root: string): string {
  const dist = join(root, 'dist');
  if (!existsSync(dist)) {
    throw new Error(`ui-actuator: ${dist} not found. Run after your build, or pass --out.`);
  }

  const found = findWebRoots(dist);
  if (found.length === 0) return dist;
  if (found.length === 1) return found[0]!;

  const list = found.map((dir) => relative(root, dir)).join(', ');
  throw new Error(`ui-actuator: multiple apps found in dist (${list}). Pass --out to pick one.`);
}

/** Reads the version from package.json and writes version.json into the build output. Returns the version. */
export function write({ root = process.cwd(), out }: WriteOptions = {}): string {
  const dir = out === undefined ? detectOutDir(root) : join(root, out);
  // Runs after the build, so a missing folder means a wrong --out path
  if (!existsSync(dir)) {
    throw new Error(`ui-actuator: output folder ${dir} not found. Run after your build and check --out.`);
  }

  const info: BuildInfo = { app: { version: readVersion(root) } };
  writeFileSync(join(dir, 'version.json'), JSON.stringify(info, null, 2) + '\n');

  return info.app.version;
}
