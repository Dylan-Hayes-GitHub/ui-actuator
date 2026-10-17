#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { write } from './core';

const USAGE = 'Usage: ui-actuator generate [--out <build-output-folder>]';

function main(): void {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: 'string' },
    },
  });

  if (positionals[0] !== 'generate') {
    console.error(USAGE);
    process.exit(1);
  }

  const version = write({ out: values.out });
  console.log(`ui-actuator: version ${version}`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
