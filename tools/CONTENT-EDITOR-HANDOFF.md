# Sharing the scenario / answer key editor with a coworker

Use this workflow when a coworker edits content in the **Scenario Content Editor** and sends it back for you to load into the course.

## Government / locked PC (no Node.js)

Your coworker **cannot install Node.js**:

1. You: **Export handoff (.json)** from the editor.
2. Run `.\tools\create-offline-package.ps1` → creates **`jnt601b-content-editor-OFFLINE.zip`**
3. Send them the **zip** + the **JSON** file.
4. They: unzip, double-click **`Scenario-Content-Editor-OFFLINE.html`**, Import JSON, edit, Export JSON, send back.
5. You: **Import handoff** in your editor → **Save to project**.

No server, no install—only Edge/Chrome and permission to open local HTML files.

---

## What you send them (with Node.js)

### Option A — Handoff file only (simplest)

1. Run `node server.js` in the project folder.
2. Open http://localhost:3000/tools/content-editor/
3. Click **Export handoff (.json)** → e.g. `jnt601b-scenarios-2026-05-21.json`
4. Email / Teams / SharePoint that **one JSON file**, plus the **Editor package** below.

### Option B — Editor package (so they can use the same UI)

Zip these paths (keep folder structure):

```
server.js
tools/scenario-io.js
tools/content-editor/     (entire folder)
tools/CONTENT-EDITOR-HANDOFF.md
```

Optionally include your exported `jnt601b-scenarios-….json` in the zip.

**They need:** [Node.js](https://nodejs.org/) installed.

**They run:**

```powershell
cd <unzipped-folder>
node server.js
```

Then open http://localhost:3000/tools/content-editor/

---

## What your coworker does

1. Start the server (`node server.js`).
2. Open the editor URL.
3. Click **Import handoff** and choose your JSON file.
4. Edit tabs as needed (especially **Answer key**).
5. Fix any yellow **Validation** warnings.
6. Click **Export handoff (.json)** and send that file back to you.

They do **not** need the full SCORM course—only the editor package + JSON.

---

## What you do when you get the file back

1. Run `node server.js` in **your** full project (with `content/` folder).
2. Open http://localhost:3000/tools/content-editor/
3. Click **Import handoff** → select their JSON.
4. Review validation and spot-check scenarios in the **Answer key** tab.
5. Click **Save all to project** (writes all `content/scenarioN.js` files plus the manifest and loader).
6. Test the course, e.g. http://localhost:3000/index-debug.html?scenario=1

**Alternative:** If they only send four `.js` files (`scenario1.js` … `scenario4.js`), copy them into your `content/` folder (replace existing files).

---

## Handoff file contents

The JSON includes all four scenarios:

- Function library (`funct.item`)
- Subtasks (`subtask.item`)
- Element libraries (`force.first`, `force.second`)
- Answer key (`answers`)

Format id: `jnt601b-scenario-handoff` (version 2; includes optional `scenarioIds` array for order).

The online editor can **add** (+) or **remove** (−) scenarios; use **Save all to project** to write `content/scenarioN.js`, `scenarios-manifest.json`, and `scenarios-loader.js`.

---

## Tips

| Topic | Note |
|--------|------|
| **Answer key** | Each row needs subtask text **exactly** matching the Subtasks tab. |
| **Two element columns** | Not two optional answers on one screen—correct asset for list A vs list B when the course picks that list at random. |
| **Preview** | `index-debug.html?scenario=0` … `?scenario=3`; add `&force=0` or `&force=1` for element list. |
| **Conflicts** | If you both edit, use one handoff file as the source of truth and re-import. |
