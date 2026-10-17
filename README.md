# ui-actuator

Spring Boot has `/actuator/info`. Frontend apps have nothing.

`ui-actuator` reads the `version` from your `package.json` and writes a `version.json` into your build output, so every deployed UI answers:

```
GET https://your-app.com/version.json
```

```json
{
  "app": {
    "version": "1.4.2"
  }
}
```

Works with any framework (Angular, React, Vue, Svelte) and any package manager (npm, pnpm, Yarn).

## Install

```bash
npm install -D ui-actuator
```

## Usage

Chain it **after** your build command in `package.json`:

```json
{
  "scripts": {
    "build": "ng build && ui-actuator generate"
  }
}
```

Then build as usual:

```bash
npm run build
```

`ui-actuator` must run **after** the build, because it writes into the build output.

### Finding the output folder

Without `--out`, `ui-actuator` searches `dist/` for the folder containing `index.html` (the folder that gets deployed) and writes `version.json` there:

| Framework | Detected folder |
|---|---|
| Vite (React, Vue, Svelte) | `dist` |
| Angular 17+ | `dist/<project-name>/browser` |
| Angular SSR | `dist/<project-name>/browser` (via `index.csr.html`) |
| Angular (older `browser` builder) | `dist/<project-name>` |

Pass `--out` when:
- your build doesn't write to `dist` (for example Create React App: `--out build`)
- `dist` contains more than one app

## CLI

```
ui-actuator generate [--out <folder>]
```

| Option | Default | Description |
|---|---|---|
| `--out` | auto-detected under `dist` | Build output folder to write `version.json` into, relative to the current directory |

The version is read from the `package.json` in the current directory.

Exits with code `1`, which stops the `&&` chain and fails the build, when:
- the `--out` folder doesn't exist, or `dist` doesn't exist when `--out` is omitted
- `dist` contains more than one app and `--out` is omitted
- `package.json` is missing or has no `version`

## API

For custom build scripts:

```ts
import { write } from 'ui-actuator';

const version = write(); // or write({ out: 'build' })
```

| Option | Default | Description |
|---|---|---|
| `root` | `process.cwd()` | Folder containing `package.json` |
| `out` | auto-detected under `dist` | Build output folder, relative to `root` |

Returns the version string. Throws on the same errors the CLI reports.

## Notes

- **Caching:** serve `version.json` with `Cache-Control: no-cache`. Otherwise CDNs and browsers may report an old version after a deploy.
- **Public by design:** only the version is exposed. No git info, environment variables, or dependency versions.

## Requirements

Node.js 18.3 or later.

## License

MIT
