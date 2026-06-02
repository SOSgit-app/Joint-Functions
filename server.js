/**
 * Static server + API for local SCORM course testing and scenario content editor.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const scenarioIo = require("./tools/scenario-io");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".xsd": "application/xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".less": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(ROOT, normalized);
  if (!full.startsWith(ROOT)) {
    return null;
  }
  return full;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : null);
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function handoffIds(body) {
  if (Array.isArray(body.scenarioIds) && body.scenarioIds.length) {
    return scenarioIo.sortScenarioIds(body.scenarioIds.filter(scenarioIo.isValidScenarioId));
  }
  return scenarioIo.sortScenarioIds(Object.keys(body.scenarios || {}));
}

function stripScenarioPayload(raw) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }
  const { theme, ...data } = raw;
  return data;
}

function handleApi(req, res, urlPath) {
  if (urlPath === "/api/scenarios/meta" && req.method === "GET") {
    try {
      sendJson(res, 200, { ids: scenarioIo.listScenarioIds() });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (urlPath === "/api/scenarios" && req.method === "GET") {
    try {
      sendJson(res, 200, scenarioIo.readAllScenarios());
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (urlPath === "/api/scenarios" && req.method === "POST") {
    readBody(req)
      .then((body) => {
        const created = scenarioIo.createScenario(body && body.data);
        sendJson(res, 201, created);
      })
      .catch((e) => sendJson(res, 400, { error: e.message }));
    return true;
  }

  if (urlPath === "/api/scenarios/sync" && req.method === "POST") {
    readBody(req)
      .then((body) => {
        if (!body || !body.scenarios) {
          throw new Error("Missing scenarios object.");
        }
        const ids = handoffIds(body);
        const allIssues = [];
        ids.forEach((id) => {
          const issues = scenarioIo.validateScenario(stripScenarioPayload(body.scenarios[id]));
          if (issues.length) {
            allIssues.push.apply(allIssues, issues.map((i) => id + ": " + i));
          }
        });
        const stripped = {};
        ids.forEach((id) => {
          stripped[id] = stripScenarioPayload(body.scenarios[id]);
        });
        const synced = scenarioIo.syncScenarios(stripped, ids);
        sendJson(res, 200, { ok: allIssues.length === 0, ids: synced.ids, warnings: allIssues });
      })
      .catch((e) => sendJson(res, 400, { error: e.message }));
    return true;
  }

  if (urlPath === "/api/scenarios/handoff" && req.method === "GET") {
    try {
      const pack = scenarioIo.readAllScenarios();
      const validation = {};
      pack.ids.forEach((id) => {
        validation[id] = scenarioIo.validateScenario(pack.scenarios[id]);
      });
      sendJson(res, 200, {
        format: "jnt601b-scenario-handoff",
        version: 2,
        exportedAt: new Date().toISOString(),
        scenarioIds: pack.ids,
        scenarios: pack.scenarios,
        validation: validation,
      });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (urlPath === "/api/scenarios/handoff" && req.method === "POST") {
    readBody(req)
      .then((body) => {
        if (!body || body.format !== "jnt601b-scenario-handoff" || !body.scenarios) {
          throw new Error("Invalid handoff file (expected format: jnt601b-scenario-handoff).");
        }
        const ids = handoffIds(body);
        if (!ids.length) {
          throw new Error("Handoff file contains no scenarios.");
        }
        const results = {};
        const allIssues = [];
        ids.forEach((id) => {
          const issues = scenarioIo.validateScenario(stripScenarioPayload(body.scenarios[id]));
          results[id] = { issues: issues, saved: false };
          if (issues.length) {
            allIssues.push.apply(allIssues, issues.map((i) => id + ": " + i));
          }
        });
        const apply = /[?&]apply=1(?:&|$)/.test(req.url);
        if (apply) {
          const stripped = {};
          ids.forEach((id) => {
            stripped[id] = stripScenarioPayload(body.scenarios[id]);
          });
          scenarioIo.syncScenarios(stripped, ids);
          ids.forEach((id) => {
            results[id].saved = true;
          });
        }
        sendJson(res, 200, {
          ok: allIssues.length === 0,
          apply: apply,
          scenarioIds: ids,
          results: results,
          issues: allIssues,
        });
      })
      .catch((e) => sendJson(res, 400, { error: e.message }));
    return true;
  }

  const match = urlPath.match(/^\/api\/scenarios\/(scenario\d+)(\/validate|\/export)?$/i);
  if (!match) return false;

  const id = match[1];
  const action = match[2];

  if (action === "/export" && req.method === "GET") {
    try {
      const data = scenarioIo.readScenario(id);
      const text = scenarioIo.serializeScenario(data);
      res.writeHead(200, {
        "Content-Type": "application/javascript; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + id + '.js"',
      });
      res.end(text);
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (action === "/validate" && req.method === "POST") {
    readBody(req)
      .then((data) => {
        sendJson(res, 200, { issues: scenarioIo.validateScenario(data) });
      })
      .catch((e) => sendJson(res, 400, { error: e.message }));
    return true;
  }

  if (!action && req.method === "GET") {
    try {
      sendJson(res, 200, scenarioIo.readScenario(id));
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (!action && req.method === "PUT") {
    readBody(req)
      .then((data) => {
        const warnings = scenarioIo.validateScenario(data);
        scenarioIo.writeScenario(id, data);
        scenarioIo.writeScenariosLoader(scenarioIo.listScenarioIds());
        sendJson(res, 200, { ok: true, id: id, warnings: warnings });
      })
      .catch((e) => sendJson(res, 400, { error: e.message }));
    return true;
  }

  if (!action && req.method === "DELETE") {
    try {
      const result = scenarioIo.deleteScenario(id);
      sendJson(res, 200, { ok: true, id: result.id, ids: result.ids });
    } catch (e) {
      sendJson(res, 400, { error: e.message });
    }
    return true;
  }

  sendJson(res, 405, { error: "Method not allowed" });
  return true;
}

function serveStatic(req, res, urlPath) {
  let filePath = safePath(urlPath === "/" ? "/index-debug.html" : urlPath);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];

  if (urlPath.startsWith("/api/")) {
    if (handleApi(req, res, urlPath)) return;
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  serveStatic(req, res, urlPath);
});

server.listen(PORT, () => {
  console.log("");
  console.log("JNT601B local testing server");
  console.log("  Content editor: http://localhost:" + PORT + "/tools/content-editor/");
  console.log("  Course (dev):   http://localhost:" + PORT + "/index-debug.html");
  console.log("  Course (LMS):   http://localhost:" + PORT + "/index.html");
  console.log("  Unit tests:     http://localhost:" + PORT + "/tests/TestRig.html");
  console.log("");
  console.log("Press Ctrl+C to stop.");
  console.log("");
});
