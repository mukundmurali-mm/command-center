# blue print

**# Command Center — Application Blueprint**

**## Overview**

- ***Command Center**** is a locally-run, single-page web application that serves as a personal wiki viewer for Obsidian markdown vaults. It has an Express backend (Node.js) and a React + Tailwind CSS frontend, bundled with Vite. It ships as an npm-installable CLI tool that starts the server and opens the app in a browser.
- ***Key capabilities:****
- Connect one or more Obsidian vaults (local folders of `.md` files)
- Browse vault notes by folder tree or by AI-organized topic groups
- Render markdown files as a rich wiki page (GFM, syntax highlighting, etc.)
- Persist vault configuration in `~/.command-center/config.json`
- AI-powered topic organization via the GitHub Copilot CLI (`copilot -p <prompt>`)
- Update-check banner polling GitHub Releases
- macOS background service installer (launchd plist)
- Cross-platform native folder picker (macOS AppleScript, Linux zenity, Windows PowerShell)
- **--**

**## Tech Stack**

| Layer | Technology |

|---|---|

| Frontend | React 19, React Router DOM 7, Tailwind CSS 4, `@tailwindcss/typography` |

| Markdown | `react-markdown` + `remark-gfm` |

| Build | Vite 8 + `@vitejs/plugin-react` |

| Backend | Express 5 (ESM), Node.js ≥ 18 |

| Dev tooling | `concurrently`, `nodemon` |

| Config | `dotenv` |

- **--**

**## Project Structure**

```

command-center/

├── bin/

│   └── command-center.js        # CLI entry point (start / --update / --service)

├── server/

│   ├── index.js                 # Express app + /api/version endpoint

│   ├── routes/

│   │   ├── vault.js             # GET /api/vault/tree, /api/vault/smart-tree, /api/vault/file

│   │   └── config.js            # GET|POST|DELETE /api/config/vaults, GET /api/config/pick-folder

│   └── utils/

│       ├── fileReader.js        # readConfig() / writeConfig() → ~/.command-center/config.json

│       └── aiEnhancer.js        # organizeVaultStructure() — calls copilot CLI, caches result

├── src/

│   ├── main.jsx                 # React entry (ReactDOM.createRoot)

│   ├── index.css                # Tailwind base + typography plugin import

│   ├── App.jsx                  # Root component — vault selection state, routing between Dashboard/WikiView

│   ├── hooks/

│   │   ├── useConfig.js         # Fetches /api/config, exposes { vaults, addVault, removeVault }

│   │   └── useVault.js          # Fetches /api/vault/tree for selected vault

│   └── components/

│       ├── Layout.jsx           # App shell: header, collapsible sidebar, update banner

│       ├── Sidebar.jsx          # File tree (Folders view) + AI topic groups (Topics view) + InlineVaultPicker

│       ├── VaultSwitcher.jsx    # Dropdown in header to switch/add/remove vaults

│       ├── VaultSetup.jsx       # Full-page setup screen (unused in current routing; kept as standalone form)

│       ├── Dashboard.jsx        # Home view: stat cards (note count, vault name, status) + placeholder widgets

│       └── WikiView.jsx         # Markdown renderer for a single note file

├── public/

│   └── icon.svg                 # Favicon (SVG)

├── index.html                   # Vite HTML shell

├── vite.config.js               # Vite config — React plugin, Tailwind plugin, /api proxy → :3001

├── package.json

└── install.sh                   # Bash one-liner installer (clone, build, launchd service)

```

- **--**

**## package.json**

```json

{

"name": "@mukundm/command-center",

"version": "1.0.0",

"description": "A personal command center — locally-run wiki viewer for your Obsidian vault with AI-powered topic organization.",

"type": "module",

"bin": { "command-center": "./bin/command-center.js" },

"files": ["bin/", "server/", "dist/", "public/"],

"scripts": {

"start": "concurrently \"node server/index.js\" \"vite\"",

"dev": "concurrently \"nodemon server/index.js\" \"vite\"",

"build": "vite build",

"prepublishOnly": "npm run build"

},

"engines": { "node": ">=18.0.0" },

"dependencies": {

"@tailwindcss/typography": "^0.5.19",

"@vitejs/plugin-react": "^6.0.1",

"concurrently": "^9.2.1",

"cors": "^2.8.6",

"dotenv": "^17.4.2",

"express": "^5.2.1",

"nodemon": "^3.1.14",

"react": "^19.2.5",

"react-dom": "^19.2.5",

"react-markdown": "^10.1.0",

"react-router-dom": "^7.14.2",

"remark-gfm": "^4.0.1",

"vite": "^8.0.10"

},

"devDependencies": {

"@tailwindcss/vite": "^4.2.4",

"autoprefixer": "^10.5.0",

"tailwindcss": "^4.2.4"

}

}

```

- **--**

**## Backend: `server/index.js`**

- Express app on `PORT` (default `3001`)
- CORS enabled globally
- Mounts `vault.js` at `/api/vault` and `config.js` at `/api/config`
- `GET /api/version` — reads `package.json` version, fetches `https://api.github.com/repos/{OWNER}/{REPO}/releases/latest`, returns `{ current, latest, updateAvailable, releaseUrl }`
- Serves `dist/` folder as static files + SPA catch-all if `dist/` exists (production mode)
- `uncaughtException` and `unhandledRejection` handlers so the server never crashes
- **--**

**## Backend: `server/routes/vault.js`**

**### `GET /api/vault/tree?vaultPath=<path>`**

Recursively walks the vault directory. Returns a JSON tree:

```json

{ "tree": [

{ "type": "folder", "name": "My Folder", "path": "My Folder", "children": [

{ "type": "file", "name": "My Note", "path": "My Folder/My Note.md" }

]}

]}

```

- ***Rules:****
- Skip hidden entries (starting with `.`)
- Skip directories: `node_modules`, `.git`, `.obsidian`, `dist`, `.venv`, `__pycache__`, `.next`
- Only include `.md` files
- Sort: folders before files, then alphabetically
- File `name` is the filename ***without**** `.md` extension
- File `path` is ***relative**** to `vaultPath`

**### `GET /api/vault/smart-tree?vaultPath=<path>`**

1. Builds the same tree as above

2. Flattens all file paths

3. Calls `organizeVaultStructure(filePaths)` from `aiEnhancer.js`

4. Returns `{ groups: [...], fallbackTree: [...] }`

**### `GET /api/vault/file?vaultPath=<path>&filePath=<relativePath>`**

- Resolves `vaultPath + filePath`, validates it's still inside `vaultPath` (path traversal guard)
- Returns `{ content: "<raw markdown>", name: "<filename without .md>" }`
- **--**

**## Backend: `server/routes/config.js`**

Config is stored at `~/.command-center/config.json` with shape `{ "vaults": [{ "id": "<uuid>", "name": "<folder name>", "path": "<absolute path>" }] }`.

| Method | Path | Description |

|---|---|---|

| `GET` | `/api/config` | Returns the full config object |

| `POST` | `/api/config/vaults` | Body: `{ path }`. Validates path exists, derives `name` from `path.basename`, assigns a UUID, appends to config. Returns the new vault object `201`. |

| `DELETE` | `/api/config/vaults/:id` | Removes vault by id from config. |

| `GET` | `/api/config/pick-folder` | Opens a native OS folder picker dialog. macOS: AppleScript via `osascript`. Linux: `zenity --file-selection --directory`. Windows: PowerShell `FolderBrowserDialog`. Returns `{ path }` or `{ cancelled: true }`. 60-second timeout. |

- **--**

**## Backend: `server/utils/fileReader.js`**

```js

const CONFIG_DIR = path.join(os.homedir(), '.command-center')

const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

readConfig()  // returns { vaults: [] } if file doesn't exist

writeConfig(config)  // creates CONFIG_DIR if needed, writes JSON

```

- **--**

**## Backend: `server/utils/aiEnhancer.js`**

Calls the GitHub Copilot CLI to organize vault file paths into topic groups.

- ***Cache:**** persisted to `~/.command-center/structure-cache.json`. Key = FNV-style hash of joined file paths. Cache is loaded at startup and saved after each successful AI call.
- ***`findCopilotCLI()`*** — tries these paths in order:

1. `process.env.COPILOT_CLI_PATH`

2. `copilot` (on PATH)

3. `/opt/homebrew/bin/copilot`

4. `/usr/local/bin/copilot`

5. `~/.local/bin/copilot`

- ***`runCopilot(cli, prompt)`*** — runs `copilot -p "<prompt>"`, 120s timeout, 5MB buffer.
- ***Prompt sent to Copilot CLI:****

```

You are organizing a personal knowledge base wiki navigation.

Given the file paths below from an Obsidian vault, analyze the file names and organize them into 3–8 logical topic groups for a wiki sidebar.

Rules:

- Group by topic/theme, not by folder structure
- Use short, clear group names (2–3 words max)
- Pick a relevant emoji icon for each group
- Every file must appear in exactly one group
- Sort files alphabetically within each group
- If a file doesn't clearly fit a topic group, put it in a "General" group

Output ONLY the following with no other text:

<<<WIKI_START>>>

{

"groups": [

{ "name": "Group Name", "icon": "📁", "files": ["path/to/file.md"] }

]

}

<<<WIKI_END>>>

File paths:

<one path per line>

```

- ***Response parsing:**** looks for `<<<WIKI_START>>>` / `<<<WIKI_END>>>` delimiters. Falls back to first `{...}` block if not found. Max 150 files sent (capped to avoid token limits).
- ***`organizeVaultStructure(filePaths)`*** — exported async function, returns `{ groups: [...] }` or `null`.
- **--**

**## Frontend: `vite.config.js`**

```js

export default defineConfig({

plugins: [react(), tailwindcss()],

server: {

port: 5173,

proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } }

}

})

```

- **--**

**## Frontend: `src/index.css`**

```css

@import "tailwindcss";

@plugin "@tailwindcss/typography";

@layer base {

body {

@apply bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100;

font-family: 'Inter', system-ui, -apple-system, sans-serif;

}

}

```

- **--**

**## Frontend: `src/main.jsx`**

Standard React 19 `ReactDOM.createRoot` mounting `<App />` into `#root`.

- **--**

**## Frontend: `src/App.jsx`**

Root component. Manages:

- `vaults` + `loading` from `useConfig` hook
- `activeVaultId` — auto-set to first vault on load
- `selectedFile` — `{ path, name }` or `null` (null = show Dashboard)
- Resets `selectedFile` to null when vault changes
- Loading spinner while config loads
- Renders `<Layout>` with either `<Dashboard>` or `<WikiView>` as children
- **--**

**## Frontend: `src/hooks/useConfig.js`**

```

fetch('/api/config')  →  { vaults: [] }

addVault(path)  →  POST /api/config/vaults  →  appends to local state

removeVault(id) →  DELETE /api/config/vaults/:id  →  filters local state

```

Returns: `{ vaults, loading, addVault, removeVault }`

- **--**

**## Frontend: `src/hooks/useVault.js`**

```

fetch('/api/vault/tree?vaultPath=<vault.path>')  →  { tree: [...] }

```

Re-fetches whenever `vault` reference changes.

Returns: `{ tree, loading, error }`

- **--**

**## Frontend: `src/components/Layout.jsx`**

- ***App shell.**** Renders the full viewport.
- ***Structure:****

```

[Update Banner — shown if updateAvailable and not dismissed]

<header>

[Sidebar toggle button] [⌘ Command Center logo/home button] [VaultSwitcher]

</header>

<div flex-row>

<aside w-64 (or w-10 when collapsed)>

[Collapsed icon rail — shows section icons when sidebar is w-10]

[Full sidebar — Home button + accordion sections]

</aside>

<main flex-1>

{children}

</main>

</div>

```

- ***Sidebar sections**** defined in a `SECTIONS` array:

```js

const SECTIONS = [

{ id: 'wiki', icon: '📖', label: 'Wiki' },

// future: tasks, etc.

]

```

Each section has a collapsible `SectionHeader`. The `wiki` section renders `<Sidebar>`.

- ***Update banner**** — polls `/api/version` on mount. If `updateAvailable`, shows an indigo banner with:
- Text: `v{latest} is available — run command-center --update to upgrade`
- "What's new" link to GitHub release URL
- Dismiss (×) button
- ***Sidebar collapse**** — toggle between `w-64` (full) and `w-10` (icon rail). Sidebar content is CSS-hidden (not unmounted) to avoid refetch on re-expand.
- **--**

**## Frontend: `src/components/Sidebar.jsx`**

- ***Two views, toggled by tab buttons at top:****

1. ****📁 Folders**** — renders the `useVault` tree as a recursive `<FileNode>` component

2. ****✦ Topics**** — fetches `/api/vault/smart-tree`, renders AI-organized `<TopicGroup>` components

- ***If no vault is connected:**** renders `<InlineVaultPicker>` instead.

**### `FileNode` component (recursive)**

- If `type === 'folder'`: collapsible button + renders children (depth 0 = open by default)
- If `type === 'file'`: clickable button, highlights if `selectedFile.path === node.path`
- Indentation via inline `paddingLeft: depth * 12px`

**### `TopicGroup` component**

- Shows group icon + name as a collapsible header
- Lists files from `allFiles` (flattened tree) that match `group.files` paths
- Open by default

**### `InlineVaultPicker`**

- "📂 Browse for Vault" button → calls `GET /api/config/pick-folder` (65s timeout)
- If cancelled or error → shows "Enter path manually" toggle
- Manual entry form with monospace input + Connect button

**### `useSmartTree` hook (internal)**

```

fetch('/api/vault/smart-tree?vaultPath=<vault.path>')

→ { groups: [...], fallbackTree: [...] }

```

Flattens `fallbackTree` into `allFiles` array for `TopicGroup` path lookups.

Re-fetches when `vault.id` changes.

- **--**

**## Frontend: `src/components/VaultSwitcher.jsx`**

Dropdown button in the header. Shows active vault name.

- ***Dropdown contents:****
- List of all vaults — click to switch (calls `onVaultChange(vault.id)`)
- Each vault has a ✕ button to remove
- "+ Add Vault" button — calls `GET /api/config/pick-folder`, then `onAddVault(path)`
- Active vault shown with `✓` prefix
- **--**

**## Frontend: `src/components/VaultSetup.jsx`**

Standalone full-page setup form (available as a component, but currently not rendered by the router — the inline picker in Sidebar handles the no-vault state).

- Large centered card with `⌘` logo
- Input for vault path + "📂 Browse" button
- "Connect Vault →" submit button
- **--**

**## Frontend: `src/components/Dashboard.jsx`**

Home view shown when no file is selected.

- ***Stat cards (3-column grid):****
- 📝 Notes — count of `.md` files in vault (fetched from `/api/vault/tree`)
- 🗂 Vault — active vault name
- ✦ Status — always "Ready" (accent indigo card)
- ***Placeholder widgets (2-column grid):****
- "Recent Notes" — coming soon
- "Quick Links" — coming soon
- **--**

**## Frontend: `src/components/WikiView.jsx`**

Renders a single markdown note.

```

fetch('/api/vault/file?vaultPath=<vault.path>&filePath=<filePath>')

→ { content: "<raw markdown>", name: "<filename without .md>" }

```

Renders:

- `<h1>` with the file name
- `<ReactMarkdown remarkPlugins={[remarkGfm]}>` with Tailwind typography prose classes:

- `prose dark:prose-invert prose-indigo`

- Custom: `prose-code:bg-gray-100 dark:prose-code:bg-gray-800`, code px/py/rounded

- `prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950`

- `prose-blockquote:border-indigo-400`

Loading: centered spinner. Error: red warning text.

- **--**

**## CLI: `bin/command-center.js`**

Entry point registered as the `command-center` binary.

**### `command-center` (no args)**

1. Checks `dist/` exists (errors if not built)

2. Spawns `node server/index.js` as a child process

3. After 1.5s, opens `http://localhost:{PORT}` in the default browser (`open`/`xdg-open`/`start`)

4. Forwards `SIGINT`/`SIGTERM` to child process

**### `command-center --version` / `-v`**

Prints `command-center v{pkg.version}` from `package.json`.

**### `command-center --update`**

1. `git pull --ff-only origin main` in install dir

2. `npm install`

3. `npm run build`

4. On macOS, if launchd plist exists: `launchctl unload` + `launchctl load` to restart the background service

**### `command-center --service install` (macOS only)**

Writes a launchd plist to `~/Library/LaunchAgents/com.mukundm.command-center.plist`:

- Runs `node server/index.js`
- `RunAtLoad: true`, `KeepAlive: true`
- Logs to `~/.command-center/server.log`
- PATH includes `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin`
- Loads immediately with `launchctl load`

**### `command-center --service uninstall` (macOS only)**

Unloads and removes the plist file.

- **--**

**## `install.sh` (bash one-liner installer)**

```bash

curl -fsSL https://raw.githubusercontent.com/mukundm/command-center/main/install.sh | bash

```

Steps:

1. Checks `node` (≥18) and `git` are available

2. Clones repo to `~/.command-center-app/` (or `git pull` if already exists)

3. `npm install`

4. `npm run build`

5. Creates `~/.local/bin/command-center` launcher script

6. Hints to add `~/.local/bin` to PATH if not already there

7. Runs `command-center --service install` to register launchd service

- **--**

**## Design System**

- ***Colors:**** indigo-600 as primary accent. Gray scale for backgrounds and text. Dark mode via `dark:` variants.
- ***Typography:**** Inter (system font fallback). Tailwind Typography plugin for prose rendering.
- ***Key UI patterns:****
- Rounded cards: `rounded-2xl` with subtle borders
- Transitions: `transition-colors` on interactive elements
- Active/selected states: `bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700`
- Loading: `animate-spin` border-based spinner
- Sidebar width: `w-64` (open) / `w-10` (collapsed)
- Sidebar content: CSS `hidden`/`block`, never unmounted
- **--**

**## Data Flow Summary**

```

User action                     → Frontend call              → Backend

──────────────────────────────────────────────────────────────────────

App load                        → GET /api/config            → readConfig()

Add vault (browse)              → GET /api/config/pick-folder → osascript/zenity/PowerShell

Add vault (confirm)             → POST /api/config/vaults    → writeConfig()

Remove vault                    → DELETE /api/config/vaults/:id → writeConfig()

Switch vault / select vault     → (local state only)

Open Folders view               → GET /api/vault/tree        → buildTree()

Open Topics view                → GET /api/vault/smart-tree  → buildTree() + copilot CLI

Click a note                    → GET /api/vault/file        → fs.readFileSync()

Dashboard load                  → GET /api/vault/tree        → countFiles()

Version check                   → GET /api/version           → GitHub Releases API

```

- **--**

**## Environment Variables**

| Variable | Default | Description |

|---|---|---|

| `PORT` | `3001` | Express server port |

| `COPILOT_CLI_PATH` | (auto-detected) | Override path to `copilot` CLI binary |

- **--**

**## Notes for the Rebuilding Agent**

1. ****ESM throughout**** — `"type": "module"` in package.json; use `import`/`export`, not `require`.

2. ****No TypeScript**** — plain `.js` and `.jsx` files.

3. ****No React Router routes**** — all routing is done via `selectedFile` state in `App.jsx`. No `<BrowserRouter>` or URL-based routing.

4. ****Sidebar sections are extensible**** — the `SECTIONS` array in `Layout.jsx` is the place to add new capabilities (Tasks, etc.). Each section gets an accordion entry; the `wiki` section is the only active one.

5. ****Smart tree caches aggressively**** — the AI call only runs once per unique vault file list. Cache is stored on disk and survives restarts.

6. ****Path security**** — `GET /api/vault/file` uses `path.resolve` + `startsWith` check to prevent path traversal outside the vault.

7. ****Folder picker is best-effort**** — if it fails (dialog unavailable), the frontend falls back to manual path input.

8. ****No auth, no database**** — everything is local files. Config is a simple JSON file.

9. ****Production mode**** — when `dist/` exists, the Express server serves the built frontend and handles SPA routing. In dev, Vite runs separately on :5173 and proxies `/api` to :3001.

[command-center-blueprint](https://www.notion.so/command-center-blueprint-34e0c9c27d238078b9cce6540c1da790?pvs=21)