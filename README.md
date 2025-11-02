# k6ScriptGenerator

A small, opinionated visual generator for k6 performance test scripts. This project provides a browser-based UI to compose k6 test scenarios, add APIs with headers/checks, manage environment variables per profile, and export ready-to-run k6 scripts — no manual scripting required.

## Why this project exists

Writing k6 scripts by hand is powerful but repetitive for standard API load tests. This generator speeds up test creation with a visual editor and sensible defaults so engineers and QA can produce consistent, well-structured k6 scripts quickly. It's ideal for creating smoke, load, and functional performance tests and for teaching teams how k6 scripts are structured.

## Features

- Visual UI to add API requests, checks, headers, and request chaining
- Environment variable profiles (dev / staging / prod) with per-profile values
- Think-time configuration (fixed or random ranges)
- Scenarios, stages, and execution strategy controls
- Thresholds configuration (p95/p99/error rate) baked into the script
- Code preview powered by Monaco (fallback to a simple editor if not available)
- Export JSON config, copy/download generated k6 script

## Files in this repo

- `index.html` — main UI for the generator
- `script.js` — application logic (UI handlers, script builder)
- `style.css` — styles for the UI
- `README.md` — this file

## Quick start — run locally

You can open `index.html` directly in a browser, but for best results serve the folder over a local HTTP server so the Monaco editor loads correctly.

Using Python 3 (PowerShell):

```powershell
python -m http.server 8000
# k6ScriptGenerator

![k6 logo](https://raw.githubusercontent.com/grafana/k6/master/docs/logo/k6-logo-dark.png)  
Visual k6 script builder — create consistent, production-ready k6 tests from a simple browser UI.

---

Why this exists
---------------

Manually authoring k6 scripts for common API flows is repetitive and error prone. This small tool accelerates test creation by providing a visual editor for requests, checks, environment profiles, and execution strategies, then generating a ready-to-run k6 script.

Audience: QA engineers, performance engineers, and developers who want to quickly produce and iterate on k6 load tests without writing the entire script by hand.

Key features
------------

- Add API requests with method, path, headers, body and extraction rules
- Configure functional checks per request and global thresholds (p95/p99/error rate)
- Environment variable profiles (dev / staging / prod) and per-profile values
- Think-time controls (fixed / random ranges) to simulate real user pacing
- Scenarios & stages support for ramp-up or steady-state testing
- Live script preview (Monaco editor) with fallback when Monaco is unavailable
- Export JSON configuration and copy/download the generated k6 script

Repository layout
-----------------

- `index.html` — single-page UI
- `script.js` — application logic that builds k6 scripts from UI data
- `style.css` — UI styling
- `README.md` — this documentation

Quick start (serve locally)
---------------------------

For best results serve the folder over a local HTTP server (so Monaco loads correctly):

Using Python 3 (PowerShell):

```powershell
python -m http.server 8000
# open http://localhost:8000
```

Using npx (Node.js):

```powershell
npx http-server . -p 8000
# open http://localhost:8000
```

How to use the app
------------------

1. Open the page and configure general test options (test name, base URL, VUs, duration or stages).
2. Add environment variables per profile in the **Environment Variables** section.
3. Use **Add API Request** to declare endpoints. Configure method, path, headers, body and checks.
4. Optionally enable **Scenarios** to create multiple execution flows.
5. Click **Generate K6 Script** to preview the script in the right-hand panel.
6. Export with **Copy** or **Download** and run using k6.

Example workflow
----------------

- Create a GET request to `/products`, add a check ensuring 200 and JSON array.
- Extract a product id from the response and use it in a subsequent POST `/checkout` request.
- Configure think-time between steps and a threshold for `p(95)<400` ms.

Run the generated script
------------------------

Install k6 (https://k6.io/docs/getting-started/installation/) then:

```powershell
k6 run script.js
```

Or pass environment variables when running:

```powershell
$env:BASE_URL = 'https://api.staging.example.com'; k6 run script.js
```

Troubleshooting & common gotchas
--------------------------------

- Buttons not responding: open the browser DevTools console (F12) and check for errors. The UI relies on `script.js` event listeners and the Monaco loader; if the page fails to load Monaco from CDN the editor code path may early-exit.
- Monaco blocked/offline: the app has a fallback editor; refresh after fixing connectivity.
- Generated script doesn't work: compare endpoint paths and payloads against your API contract. The generator uses the values provided in the UI — validate headers and body format.

Contributing
------------

Contributions welcome. Suggested small PRs:

