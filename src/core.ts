import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface BuildInfo {
  app: { version: string };
}

export interface WriteOptions {
  /** Project folder containing package.json. Defaults to the current directory. */
  root?: string;
  /** Build output folder to write version.json into, relative to root. */
  out?: string;
}

function readVersion(root: string): string {
  const file = join(root, 'package.json');
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  if (!pkg.version) {
    throw new Error(`ui-actuator: no "version" field in ${file}`);
  }
  return pkg.version;
}

/** Reads the version from package.json and writes version.json into the build output. Returns the version. */
export function write({ root = process.cwd(), out = 'dist' }: WriteOptions = {}): string {
  const dir = join(root, out);
  // Runs after the build, so a missing folder means a wrong --out path
  if (!existsSync(dir)) {
    throw new Error(`ui-actuator: output folder ${dir} not found. Run after your build and check --out.`);
  }

  const info: BuildInfo = { app: { version: readVersion(root) } };
  writeFileSync(join(dir, 'version.json'), JSON.stringify(info, null, 2) + '\n');

  return info.app.version;
}
