# Joint Functions Map

Static SCORM course for JNT601B (Air Force core functions ↔ joint functions).

## Play online (GitHub Pages)

**https://sosgit-app.github.io/Joint-Functions/**

Opens the browser demo with a fake SCORM API (no LMS required).

## Local testing

```bash
node server.js
```

Then open:

- Course (static / Pages-style): http://localhost:3000/index.html  
- Course (debug): http://localhost:3000/index-debug.html  
- Content editor: http://localhost:3000/tools/content-editor/

## Canvas / LMS package

Build a SCORM 1.2 zip (uses `index-lms.html` as the package `index.html`):

```powershell
powershell -ExecutionPolicy Bypass -File tools\create-scorm-package.ps1
```

Upload `Joint Functions Map.zip` to Canvas.

| File | Purpose |
|------|---------|
| `index.html` | GitHub Pages / static browser play (fake SCORM) |
| `index-lms.html` | Real LMS SCORM API (copied into the zip as `index.html`) |
| `index-debug.html` | Local debug build with cache-busting |

## Repo

https://github.com/SOSgit-app/Joint-Functions
