# Local testing environment

This SCORM course must be served over HTTP (not opened as a `file://` URL). Use the setup below to run it on your machine without an LMS.

## Quick start (Windows)

1. Open PowerShell in this folder.
2. Run:

   ```powershell
   .\start-local.ps1
   ```

3. In your browser, open:

   - **Scenario content editor:** [http://localhost:3000/tools/content-editor/](http://localhost:3000/tools/content-editor/)  
     Edit scenarios (add/remove with +/−), then **Save all to project** to write `content/scenarioN.js`, `scenarios-manifest.json`, and `scenarios-loader.js`.
   - **Development (recommended):** [http://localhost:3000/index-debug.html](http://localhost:3000/index-debug.html)  
     Uses a fake SCORM API so progress is stored in browser cookies—no LMS required.  
     After editing a scenario in the content editor, use a hard refresh (Ctrl+F5). Students complete **all** scenarios in order (5 total). To preview one scenario only: `index-debug.html?scenario=1` (0–4; optional `&force=0` or `&force=1`).
   - **Production-like:** [http://localhost:3000/index.html](http://localhost:3000/index.html)  
     Expects a real LMS/SCORM host; will not fully work locally without one.

## Manual start

```powershell
node server.js
```

Or: `npm start` (runs the same server).

Then open the URLs above.

## Unit tests (QUnit)

With the server running:

[http://localhost:3000/tests/TestRig.html](http://localhost:3000/tests/TestRig.html)

## Notes

- **Media:** Audio/video paths in `content/jf504.js` point at `assets/`. If those files are missing from your package, the course may still load but media will not play.
- **Progress:** In debug mode, suspend data and scores are saved via cookies (fake student: `FAKE-STUDENT-ID`). Clear site cookies to reset progress.
- **Port:** Default is `3000`. Set another port with `$env:PORT=8080; node server.js` (PowerShell).

## Requirements

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A modern browser (Chrome or Edge recommended)
