import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { write } from '../src/core';

describe('write', () => {
  let root: string;

  // Fresh temp project folder for each test
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'ui-actuator-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function setup(pkg: object, outDir = 'dist'): void {
    writeFileSync(join(root, 'package.json'), JSON.stringify(pkg));
    mkdirSync(join(root, outDir), { recursive: true });
  }

  function readOutput(outDir = 'dist'): unknown {
    return JSON.parse(readFileSync(join(root, outDir, 'version.json'), 'utf8'));
  }

  it('writes the package.json version to dist/version.json by default', () => {
    setup({ name: 'app', version: '1.4.2' });

    const version = write({ root });

    expect(version).toBe('1.4.2');
    expect(readOutput()).toEqual({ app: { version: '1.4.2' } });
  });

  it('writes to a custom --out folder', () => {
    setup({ version: '2.0.0' }, 'dist/my-app/browser');

    write({ root, out: 'dist/my-app/browser' });

    expect(readOutput('dist/my-app/browser')).toEqual({ app: { version: '2.0.0' } });
  });

  it('overwrites an existing version.json', () => {
    setup({ version: '3.0.0' });
    writeFileSync(join(root, 'dist', 'version.json'), '{"old":true}');

    write({ root });

    expect(readOutput()).toEqual({ app: { version: '3.0.0' } });
  });

  it('throws when the --out folder does not exist', () => {
    setup({ version: '1.0.0' });

    expect(() => write({ root, out: 'nope' })).toThrow(/output folder .* not found/);
  });

  it('throws when dist does not exist and no --out is given', () => {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ version: '1.0.0' }));

    expect(() => write({ root })).toThrow(/dist not found/);
  });

  describe('auto-detecting the output folder', () => {
    function addIndex(dir: string, file = 'index.html'): void {
      mkdirSync(join(root, dir), { recursive: true });
      writeFileSync(join(root, dir, file), '<html></html>');
    }

    it('uses dist when index.html is directly in it (Vite)', () => {
      setup({ version: '1.0.0' });
      addIndex('dist');

      write({ root });

      expect(readOutput('dist')).toEqual({ app: { version: '1.0.0' } });
    });

    it('finds dist/<app>/browser (Angular)', () => {
      setup({ version: '1.0.0' });
      addIndex('dist/my-app/browser');

      write({ root });

      expect(readOutput('dist/my-app/browser')).toEqual({ app: { version: '1.0.0' } });
    });

    it('finds the browser folder of an Angular SSR build (index.csr.html)', () => {
      setup({ version: '1.0.0' });
      addIndex('dist/my-app/browser', 'index.csr.html');
      mkdirSync(join(root, 'dist/my-app/server'), { recursive: true });

      write({ root });

      expect(readOutput('dist/my-app/browser')).toEqual({ app: { version: '1.0.0' } });
    });

    it('throws when dist contains more than one app', () => {
      setup({ version: '1.0.0' });
      addIndex('dist/app-one/browser');
      addIndex('dist/app-two/browser');

      expect(() => write({ root })).toThrow(/multiple apps found/);
    });

    it('skips detection when --out is given', () => {
      setup({ version: '1.0.0' });
      addIndex('dist/app-one/browser');
      addIndex('dist/app-two/browser');

      write({ root, out: 'dist/app-two/browser' });

      expect(readOutput('dist/app-two/browser')).toEqual({ app: { version: '1.0.0' } });
    });
  });

  it('throws when package.json has no version', () => {
    setup({ name: 'app' });

    expect(() => write({ root })).toThrow(/no "version" field/);
  });

  it('throws when package.json is missing', () => {
    mkdirSync(join(root, 'dist'));

    expect(() => write({ root })).toThrow();
  });
});
