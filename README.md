# RSS-nodejs-crud-api

## Requirements

- Node.js (recommended v18+)
- npm (bundled with Node) or yarn

## Clone Project

git clone https://github.com/iliaShamakhia/RSS-nodejs-crud-api.git

cd RSS-nodejs-crud-api

git checkout rss-nodejs-crud-api

## Install

Open a terminal in the project root (Windows PowerShell or CMD):

- Using npm:
  ```
  npm install
  ```

- Using yarn:
  ```
  yarn
  ```

This installs all devDependencies used by the project (nodemon, ts-node, TypeScript, webpack, jest, etc.).

## Environment

If the project uses environment variables, create a `.env` file in the project root and set values there (e.g. PORT, NODE_ENV). The project includes `dotenv` as a dev dependency.

## Available scripts

Run scripts with `npm run <script>` (or `yarn <script>`). Examples below use npm.

- Start development with auto-reload
  - Command:
    ```
    npm run start:dev
    ```
  - What it does:
    - Runs `nodemon src/index.ts`. Useful during development: the server restarts automatically when source files change. Requires dev dependencies installed (nodemon, ts-node).

- Start production (bundle + run)
  - Command:
    ```
    npm run start:prod
    ```
  - What it does:
    - Runs `webpack` to produce a bundled file and then runs `node dist/bundle.js`. Use this to run the bundled production build.

- Start in cluster / multi-process mode
  - Command:
    ```
    npm run start:multi
    ```
  - What it does:
    - Runs `ts-node src/cluster.ts` (runs the cluster entry using ts-node). Use when you want to run the app using Node's cluster support (requires dev dependencies).

- Build (TypeScript compile)
  - Command:
    ```
    npm run build
    ```
  - What it does:
    - Runs `tsc` (TypeScript compiler) and emits JavaScript to `dist/` according to tsconfig.json.

- Run tests
  - Command:
    ```
    npm test
    ```
  - What it does:
    - Runs `jest` (unit/integration tests).

## Typical workflows

- Development
  1. Install deps: `npm install`
  2. Start dev server: `npm run start:dev`

- Production (bundle + run)
  1. Install deps: `npm install --production` (or `npm install`)
  2. Build & run: `npm run start:prod`

- Compile only
  ```
  npm run build
  ```

- Run tests
  ```
  npm test
  ```

## Notes and troubleshooting

- Local binaries are used when running `npm run <script>`; you do not need global installs of nodemon, ts-node, etc.
- If `start:dev` fails to run TypeScript directly, ensure `ts-node` is installed and that nodemon is configured to execute TypeScript files (project may rely on a nodemon.json or package config).
- If webpack or tsc outputs files to a different path, check `webpack.config.js` and `tsconfig.json` for correct output paths (the `start:prod` script expects `dist/bundle.js`).
- On Windows, run commands from PowerShell or CMD in the repository root.