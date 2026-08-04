/**

 * Read/write scenario content files (AMD define modules in content/scenarioN.js).

 */

const fs = require("fs");

const path = require("path");

const vm = require("vm");



const CONTENT_DIR = path.join(__dirname, "..", "content");

const MANIFEST_PATH = path.join(CONTENT_DIR, "scenarios-manifest.json");

const LOADER_PATH = path.join(CONTENT_DIR, "scenarios-loader.js");

const SCENARIO_ID_PATTERN = /^scenario\d+$/i;



function isValidScenarioId(id) {

  return SCENARIO_ID_PATTERN.test(id);

}



function sortScenarioIds(ids) {

  return ids.slice().sort((a, b) => {

    const na = parseInt(String(a).replace(/^scenario/i, ""), 10);

    const nb = parseInt(String(b).replace(/^scenario/i, ""), 10);

    return na - nb;

  });

}



function discoverScenarioIds() {

  return fs

    .readdirSync(CONTENT_DIR)

    .filter((f) => /^scenario\d+\.js$/i.test(f))

    .map((f) => f.replace(/\.js$/i, ""))

    .filter(isValidScenarioId)

    .sort((a, b) => {

      const na = parseInt(a.replace(/^scenario/i, ""), 10);

      const nb = parseInt(b.replace(/^scenario/i, ""), 10);

      return na - nb;

    });

}



function readManifestIds() {

  if (!fs.existsSync(MANIFEST_PATH)) {

    return null;

  }

  try {

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

    if (Array.isArray(manifest.ids) && manifest.ids.length) {

      return sortScenarioIds(manifest.ids.filter(isValidScenarioId));

    }

  } catch (e) {

    throw new Error("Invalid scenarios-manifest.json: " + e.message);

  }

  return null;

}



function writeManifest(ids) {

  const sorted = sortScenarioIds(ids);

  fs.writeFileSync(

    MANIFEST_PATH,

    JSON.stringify({ ids: sorted }, null, 2) + "\n",

    "utf8"

  );

  return sorted;

}



function listScenarioIds() {

  const fromManifest = readManifestIds();

  if (fromManifest && fromManifest.length) {

    return fromManifest;

  }

  const discovered = discoverScenarioIds();

  if (discovered.length) {

    writeManifest(discovered);

  }

  return discovered;

}



function nextScenarioId(ids) {

  let max = 0;

  for (const id of ids) {

    const n = parseInt(String(id).replace(/^scenario/i, ""), 10);

    if (!Number.isNaN(n) && n > max) {

      max = n;

    }

  }

  return "scenario" + (max + 1);

}



function getForceItems(data) {
  if (!data || !data.force) return [];
  if (Array.isArray(data.force.item)) return data.force.item.filter(Boolean);
  if (Array.isArray(data.force.first)) return data.force.first.filter(Boolean);
  return [];
}

function getAnswerForce(answer) {
  if (!answer) return "";
  if (typeof answer.force === "string") return answer.force;
  if (Array.isArray(answer.force)) return answer.force[0] || "";
  return "";
}

function normalizeScenario(data) {
  const normalized = JSON.parse(JSON.stringify(data || {}));
  const items = getForceItems(normalized);
  normalized.force = { item: items };
  normalized.answers = (normalized.answers || []).map((a) => ({
    subtask: a.subtask,
    funct: a.funct,
    force: getAnswerForce(a),
    concept: a.concept,
  }));
  return normalized;
}

function emptyScenarioTemplate() {
  return {
    funct: {
      item: [""],
    },
    subtask: {
      item: [""],
    },
    force: {
      item: [""],
    },
    answers: [
      {
        subtask: "",
        funct: "",
        force: "",
      },
    ],
  };
}



function parseScenarioFile(content) {

  const trimmed = content.trim();

  const match = trimmed.match(

    /^define\(\[\],\s*function\s*\(\)\s*\{[\s\S]*?return\s*([\s\S]*?)\s*\}\s*\)\s*;?\s*$/

  );

  if (!match) {

    throw new Error(

      "Unrecognized scenario file format (expected define([], function () { return {...} }))."

    );

  }

  return vm.runInNewContext("(" + match[1] + ")", {}, { timeout: 1000 });

}



function serializeScenario(data) {

  const body = JSON.stringify(data, null, 4)

    .split("\n")

    .map((line) => "\t\t" + line)

    .join("\n");



  return "define([], function () {\n\n\treturn " + body.trimStart() + "\n})";

}



function scenarioFilePath(id) {

  if (!isValidScenarioId(id)) {

    throw new Error("Invalid scenario id: " + id);

  }

  return path.join(CONTENT_DIR, id + ".js");

}



function readScenario(id) {

  const filePath = scenarioFilePath(id);

  if (!fs.existsSync(filePath)) {

    throw new Error("Scenario file not found: " + id + ".js");

  }

  const content = fs.readFileSync(filePath, "utf8");

  return normalizeScenario(parseScenarioFile(content));

}



function writeScenario(id, data) {

  if (!isValidScenarioId(id)) {

    throw new Error("Invalid scenario id: " + id);

  }

  const filePath = scenarioFilePath(id);

  const content = serializeScenario(normalizeScenario(data));

  fs.writeFileSync(filePath, content, "utf8");

  return filePath;

}



function writeScenariosLoader(ids) {

  const sorted = sortScenarioIds(ids);

  const deps = sorted.map((id) => '"content/' + id + '"').join(", ");

  const args = sorted.map((_, i) => "s" + i).join(", ");

  const lines = [

    "// Auto-generated by the Scenario Content Editor — do not edit by hand.",

    "define([" + deps + "], function (" + args + ") {",

    "\treturn [" + args + "];",

    "});",

    "",

  ];

  fs.writeFileSync(LOADER_PATH, lines.join("\n"), "utf8");

  return LOADER_PATH;

}



function readAllScenarios() {

  const ids = listScenarioIds();

  const out = {};

  for (const id of ids) {

    out[id] = readScenario(id);

  }

  return { ids: ids, scenarios: out };

}



function createScenario(data) {

  const ids = listScenarioIds();

  const id = nextScenarioId(ids);

  const payload = data || emptyScenarioTemplate();

  writeScenario(id, payload);

  const nextIds = ids.concat([id]);

  writeManifest(nextIds);

  writeScenariosLoader(nextIds);

  return { id: id, data: payload, ids: nextIds };

}



function deleteScenario(id) {

  if (!isValidScenarioId(id)) {

    throw new Error("Invalid scenario id: " + id);

  }

  const ids = listScenarioIds();

  if (ids.length <= 1) {

    throw new Error("Cannot delete the only remaining scenario.");

  }

  if (!ids.includes(id)) {

    throw new Error("Scenario not found: " + id);

  }

  const filePath = scenarioFilePath(id);

  if (fs.existsSync(filePath)) {

    fs.unlinkSync(filePath);

  }

  const nextIds = ids.filter((x) => x !== id);

  writeManifest(nextIds);

  writeScenariosLoader(nextIds);

  return { id: id, ids: nextIds };

}



function syncScenarios(scenariosById, orderedIds) {

  if (!scenariosById || typeof scenariosById !== "object") {

    throw new Error("Missing scenarios object.");

  }

  let ids = orderedIds && orderedIds.length ? sortScenarioIds(orderedIds) : sortScenarioIds(Object.keys(scenariosById));

  ids = ids.filter((id) => scenariosById[id]);

  if (!ids.length) {

    throw new Error("At least one scenario is required.");

  }



  for (const id of ids) {

    if (!isValidScenarioId(id)) {

      throw new Error("Invalid scenario id: " + id);

    }

    writeScenario(id, scenariosById[id]);

  }



  const existing = discoverScenarioIds();

  for (const id of existing) {

    if (!ids.includes(id)) {

      const filePath = scenarioFilePath(id);

      if (fs.existsSync(filePath)) {

        fs.unlinkSync(filePath);

      }

    }

  }



  writeManifest(ids);

  writeScenariosLoader(ids);

  return { ids: ids };

}



function validateScenario(data) {
  const normalized = normalizeScenario(data);
  const issues = [];
  const functs = normalized.funct?.item || [];
  const subtasks = normalized.subtask?.item || [];
  const elements = getForceItems(normalized);
  const answers = normalized.answers || [];

  if (functs.length === 0) issues.push("Air Force Core Functions library is empty.");
  if (subtasks.length === 0) issues.push("Scenario Based Task list is empty.");
  if (elements.length === 0) issues.push("Joint Functions library is empty.");

  answers.forEach((a, i) => {
    const row = "Answer row " + (i + 1);
    if (!a.subtask) issues.push(row + ": missing Scenario Based Task.");
    else if (!subtasks.includes(a.subtask)) issues.push(row + ': Scenario Based Task "' + a.subtask + '" is not in the list.');
    if (!a.funct) issues.push(row + ": missing Air Force Core Function.");
    else if (!functs.includes(a.funct)) issues.push(row + ': Air Force Core Function "' + a.funct + '" is not in the library.');
    const force = getAnswerForce(a);
    if (!force) issues.push(row + ": missing joint function.");
    else if (!elements.includes(force)) issues.push(row + ': joint function "' + force + '" is not in the library.');
  });

  subtasks.forEach((st) => {
    if (!answers.some((a) => a.subtask === st)) {
      issues.push('Scenario Based Task has no answer row: "' + st + '"');
    }
  });

  return issues;
}



/** @deprecated use listScenarioIds() */

const SCENARIO_IDS = listScenarioIds();



module.exports = {

  SCENARIO_IDS,

  CONTENT_DIR,

  MANIFEST_PATH,

  isValidScenarioId,

  sortScenarioIds,

  listScenarioIds,

  nextScenarioId,

  normalizeScenario,
  getForceItems,
  getAnswerForce,

  emptyScenarioTemplate,

  parseScenarioFile,

  serializeScenario,

  readScenario,

  writeScenario,

  writeScenariosLoader,

  readAllScenarios,

  createScenario,

  deleteScenario,

  syncScenarios,

  validateScenario,

};


