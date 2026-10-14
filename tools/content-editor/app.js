(function () {
  "use strict";

  var state = {
    scenarios: {},
    scenarioIds: [],
    currentId: "scenario1",
    dirty: false,
  };

  var els = {
    scenarioSelect: document.getElementById("scenarioSelect"),
    btnAddScenario: document.getElementById("btnAddScenario"),
    btnRemoveScenario: document.getElementById("btnRemoveScenario"),
    btnReload: document.getElementById("btnReload"),
    btnSave: document.getElementById("btnSave"),
    btnSaveAll: document.getElementById("btnSaveAll"),
    btnDownload: document.getElementById("btnDownload"),
    btnExportHandoff: document.getElementById("btnExportHandoff"),
    btnPaperTest: document.getElementById("btnPaperTest"),
    btnImportHandoff: document.getElementById("btnImportHandoff"),
    handoffFile: document.getElementById("handoffFile"),
    status: document.getElementById("status"),
    validation: document.getElementById("validation"),
    listFunctions: document.getElementById("list-functions"),
    listSubtasks: document.getElementById("list-subtasks"),
    listElements: document.getElementById("list-elements"),
    answersBody: document.getElementById("answersBody"),
    btnRebuildAnswers: document.getElementById("btnRebuildAnswers"),
  };

  function getForceItems(data) {
    if (!data || !data.force) return [];
    if (Array.isArray(data.force.item)) return data.force.item.slice();
    if (Array.isArray(data.force.first)) return data.force.first.slice();
    return [];
  }

  function getAnswerForce(answer) {
    if (!answer) return "";
    if (typeof answer.force === "string") return answer.force;
    if (Array.isArray(answer.force)) return answer.force[0] || "";
    return "";
  }

  function normalizeScenario(data) {
    if (!data) return data;
    data.force = { item: getForceItems(data) };
    data.answers = (data.answers || []).map(function (a) {
      return {
        subtask: a.subtask,
        funct: a.funct,
        force: getAnswerForce(a),
        concept: a.concept,
      };
    });
    return data;
  }

  function sortScenarioIds(ids) {
    return ids.slice().sort(function (a, b) {
      return (
        parseInt(String(a).replace(/^scenario/i, ""), 10) -
        parseInt(String(b).replace(/^scenario/i, ""), 10)
      );
    });
  }

  function getOrderedScenarioIds() {
    if (state.scenarioIds && state.scenarioIds.length) {
      return sortScenarioIds(state.scenarioIds);
    }
    return sortScenarioIds(Object.keys(state.scenarios));
  }

  function scenarioLabel(id) {
    var n = parseInt(String(id).replace(/^scenario/i, ""), 10);
    return "Scenario " + n;
  }

  function renderScenarioSelect() {
    var ids = getOrderedScenarioIds();
    els.scenarioSelect.innerHTML = "";
    ids.forEach(function (id) {
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = scenarioLabel(id);
      if (id === state.currentId) {
        opt.selected = true;
      }
      els.scenarioSelect.appendChild(opt);
    });
    els.btnRemoveScenario.disabled = ids.length <= 1;
  }

  function current() {
    return state.scenarios[state.currentId];
  }

  function setStatus(message, type) {
    els.status.hidden = !message;
    els.status.textContent = message || "";
    els.status.className = "status " + (type || "");
  }

  function markDirty() {
    state.dirty = true;
    renderValidation();
  }

  function validateScenario(data, idPrefix) {
    var issues = [];
    var p = idPrefix ? idPrefix + ": " : "";
    var functs = data.funct && data.funct.item ? data.funct.item : [];
    var subtasks = data.subtask && data.subtask.item ? data.subtask.item : [];
    var elements = getForceItems(data);
    var answers = data.answers || [];

    if (!functs.length) issues.push(p + "Air Force Core Functions library is empty.");
    if (!subtasks.length) issues.push(p + "Scenario Based Task list is empty.");
    if (!elements.length) issues.push(p + "Joint Functions library is empty.");

    answers.forEach(function (a, i) {
      var row = p + "Answer row " + (i + 1);
      if (!a.subtask) issues.push(row + ": missing Scenario Based Task.");
      else if (subtasks.indexOf(a.subtask) === -1) issues.push(row + ': Scenario Based Task "' + a.subtask + '" not in list.');
      if (!a.funct) issues.push(row + ": missing Air Force Core Function.");
      else if (functs.indexOf(a.funct) === -1) issues.push(row + ': Air Force Core Function "' + a.funct + '" not in library.');
      var force = getAnswerForce(a);
      if (!force) issues.push(row + ": missing joint function.");
      else if (elements.indexOf(force) === -1) issues.push(row + ': joint function "' + force + '" invalid.');
    });

    subtasks.forEach(function (st) {
      if (!answers.some(function (a) { return a.subtask === st; })) {
        issues.push(p + 'Scenario Based Task has no answer row: "' + st + '"');
      }
    });

    return issues;
  }

  function validateAllScenarios() {
    var all = [];
    getOrderedScenarioIds().forEach(function (id) {
      if (state.scenarios[id]) {
        all = all.concat(validateScenario(state.scenarios[id], id));
      }
    });
    return all;
  }

  function showValidationIssues(issues) {
    if (!issues || !issues.length) {
      els.validation.hidden = true;
      return;
    }
    els.validation.hidden = false;
    els.validation.innerHTML =
      "<strong>Validation (" + issues.length + ")</strong><ul>" +
      issues.map(function (i) {
        return "<li>" + escapeHtml(i) + "</li>";
      }).join("") +
      "</ul>";
  }

  function renderValidation() {
    var data = current();
    if (!data) return;
    showValidationIssues(validateAllScenarios());
  }

  function buildHandoffPackage() {
    var ids = getOrderedScenarioIds();
    var validation = {};
    ids.forEach(function (id) {
      if (state.scenarios[id]) {
        validation[id] = validateScenario(state.scenarios[id], id);
      }
    });
    return {
      format: "jnt601b-scenario-handoff",
      version: 2,
      exportedAt: new Date().toISOString(),
      scenarioIds: ids,
      scenarios: state.scenarios,
      validation: validation,
    };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function emptyScenarioTemplate() {
    return normalizeScenario({
      funct: { item: [""] },
      subtask: { item: [""] },
      force: { item: [""] },
      answers: [{ subtask: "", funct: "", force: "" }],
    });
  }

  function startBlankEditor() {
    var seed = window.JNT601B_COURSE_SEED;
    if (seed && seed.scenarios) {
      state.scenarios = seed.scenarios;
      state.scenarioIds = seed.scenarioIds
        ? sortScenarioIds(seed.scenarioIds)
        : sortScenarioIds(Object.keys(seed.scenarios));
      Object.keys(state.scenarios).forEach(function (id) {
        state.scenarios[id] = normalizeScenario(state.scenarios[id]);
      });
      state.currentId = state.scenarioIds[0] || "scenario1";
      state.dirty = false;
      renderScenarioSelect();
      updateCourseLink();
      render();
      showValidationIssues(validateAllScenarios());
      setStatus("Loaded current course scenario sets (" + state.scenarioIds.length + ").", "ok");
      return;
    }
    state.scenarios = { scenario1: emptyScenarioTemplate() };
    state.scenarioIds = ["scenario1"];
    state.currentId = "scenario1";
    state.dirty = true;
    renderScenarioSelect();
    updateCourseLink();
    render();
    showValidationIssues(validateAllScenarios());
  }

  function loadAll() {
    return fetch("/api/scenarios")
      .then(function (r) {
        if (!r.ok) throw new Error("Failed to load scenarios (" + r.status + ")");
        return r.json();
      })
      .then(function (data) {
        if (data.ids && data.scenarios) {
          state.scenarioIds = data.ids;
          state.scenarios = data.scenarios;
        } else {
          state.scenarios = data;
          state.scenarioIds = sortScenarioIds(Object.keys(data));
        }
        Object.keys(state.scenarios).forEach(function (id) {
          state.scenarios[id] = normalizeScenario(state.scenarios[id]);
        });
        if (!state.scenarios[state.currentId]) {
          state.currentId = getOrderedScenarioIds()[0] || "scenario1";
        }
        state.dirty = false;
        renderScenarioSelect();
        updateCourseLink();
        render();
        setStatus(
          "Loaded " + getOrderedScenarioIds().length + " scenario(s) from content/",
          "ok"
        );
      });
  }

  function saveCurrent() {
    var data = normalizeScenario(current());
    return fetch("/api/scenarios/" + state.currentId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(function (r) {
      return r.json().then(function (body) {
        if (!r.ok) throw new Error(body.error || "Save failed");
        state.dirty = false;
        setStatus("Saved " + state.currentId + ".js", "ok");
        if (body.warnings && body.warnings.length) {
          renderValidation();
        }
      });
    });
  }

  function downloadBlob(blob, filename) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function saveAllToProject() {
    var ids = getOrderedScenarioIds();
    if (!ids.length) {
      setStatus("No scenarios to save.", "err");
      return;
    }
    return fetch("/api/scenarios/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarios: state.scenarios,
        scenarioIds: ids,
      }),
    })
      .then(function (r) {
        return r.json().then(function (body) {
          if (!r.ok) throw new Error(body.error || "Save failed");
          state.scenarioIds = body.ids || ids;
          state.dirty = false;
          renderScenarioSelect();
          setStatus(
            "Saved " + state.scenarioIds.length + " scenario(s) and updated scenarios-loader.js",
            body.warnings && body.warnings.length ? "err" : "ok"
          );
          if (body.warnings && body.warnings.length) {
            showValidationIssues(body.warnings);
          }
        });
      });
  }

  function addScenario() {
    return fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(function (r) {
        return r.json().then(function (body) {
          if (!r.ok) throw new Error(body.error || "Could not add scenario");
          state.scenarioIds = body.ids;
          state.scenarios[body.id] = body.data;
          state.currentId = body.id;
          state.dirty = false;
          renderScenarioSelect();
          updateCourseLink();
          render();
          setStatus("Added " + body.id + " (saved to disk)", "ok");
        });
      });
  }

  function removeScenario() {
    var ids = getOrderedScenarioIds();
    if (ids.length <= 1) {
      setStatus("At least one scenario must remain.", "err");
      return Promise.resolve();
    }
    if (
      !confirm(
        "Delete " +
          state.currentId +
          " from the project?\n\nThis removes the .js file when you confirm."
      )
    ) {
      return Promise.resolve();
    }
    return fetch("/api/scenarios/" + state.currentId, { method: "DELETE" })
      .then(function (r) {
        return r.json().then(function (body) {
          if (!r.ok) throw new Error(body.error || "Could not remove scenario");
          delete state.scenarios[body.id];
          state.scenarioIds = body.ids;
          state.currentId = body.ids[0];
          state.dirty = false;
          renderScenarioSelect();
          updateCourseLink();
          render();
          setStatus("Removed " + body.id, "ok");
        });
      });
  }

  function downloadPaperTest() {
    var ids = getOrderedScenarioIds();
    if (!ids.length) {
      setStatus("Nothing loaded to print. Reload from disk or import a handoff file first.", "err");
      return;
    }
    if (!window.Jnt601bPaperTest || !window.Jnt601bPaperTest.downloadPaperTest) {
      setStatus("Paper test generator is missing (tools/paper-test.js).", "err");
      return;
    }
    window.Jnt601bPaperTest.downloadPaperTest(state.scenarios, ids);
    setStatus(
      "Downloaded student paper test and instructor answer key (HTML). Open each file and Print → Save as PDF if needed.",
      "ok"
    );
  }

  function exportHandoff() {
    if (!getOrderedScenarioIds().length) {
      setStatus("Nothing loaded to export. Reload from disk or import a handoff file first.", "err");
      return;
    }
    var name =
      "jnt601b-scenarios-" + new Date().toISOString().slice(0, 10) + ".json";
    downloadBlob(
      new Blob([JSON.stringify(buildHandoffPackage(), null, 2)], {
        type: "application/json",
      }),
      name
    );
    setStatus("Exported handoff file: " + name, "ok");
  }

  function importHandoff(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var body;
      try {
        body = JSON.parse(reader.result);
      } catch (e) {
        setStatus("Invalid JSON file.", "err");
        return;
      }
      if (!body || !body.scenarios) {
        setStatus("Invalid handoff file (missing scenarios).", "err");
        return;
      }
      state.scenarios = body.scenarios;
      state.scenarioIds = body.scenarioIds
        ? sortScenarioIds(body.scenarioIds)
        : sortScenarioIds(Object.keys(body.scenarios));
      Object.keys(state.scenarios).forEach(function (id) {
        state.scenarios[id] = normalizeScenario(state.scenarios[id]);
      });
      if (!state.scenarios[state.currentId]) {
        state.currentId = state.scenarioIds[0] || "scenario1";
      }
      state.dirty = true;
      renderScenarioSelect();
      render();
      updateCourseLink();
      var issues = validateAllScenarios();
      showValidationIssues(issues);
      setStatus(
        issues.length
          ? "Handoff loaded (" +
              state.scenarioIds.length +
              " scenarios) — fix warnings, then Save all to project."
          : "Handoff loaded (" +
              state.scenarioIds.length +
              " scenarios) — click Save all to project to write files.",
        issues.length ? "err" : "ok"
      );
    };
    reader.readAsText(file);
  }

  function downloadCurrent() {
    fetch("/api/scenarios/" + state.currentId + "/export")
      .then(function (r) {
        return r.text();
      })
      .then(function (text) {
        var blob = new Blob([text], { type: "text/javascript" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = state.currentId + ".js";
        a.click();
        URL.revokeObjectURL(a.href);
        setStatus("Downloaded " + state.currentId + ".js", "ok");
      })
      .catch(function (err) {
        setStatus(err.message, "err");
      });
  }

  function render() {
    var data = current();
    if (!data) return;
    normalizeScenario(data);

    renderStringList(els.listFunctions, data.funct.item, function (items) {
      data.funct.item = items;
      markDirty();
      renderAnswersTable();
    });

    renderStringList(els.listSubtasks, data.subtask.item, function (items) {
      data.subtask.item = items;
      markDirty();
      renderAnswersTable();
    });

    renderStringList(els.listElements, data.force.item, function (items) {
      data.force.item = items;
      markDirty();
      renderAnswersTable();
    });

    renderAnswersTable();
    renderValidation();
  }

  function renderStringList(container, items, onChange) {
    container.innerHTML = "";
    items.forEach(function (value, index) {
      container.appendChild(
        buildListRow(value, index, items.length, function (newValue) {
          items[index] = newValue;
          onChange(items);
        }, function () {
          items.splice(index, 1);
          onChange(items);
          render();
        }, function (dir) {
          var j = index + dir;
          if (j < 0 || j >= items.length) return;
          var tmp = items[index];
          items[index] = items[j];
          items[j] = tmp;
          onChange(items);
          render();
        })
      );
    });
  }

  function buildListRow(value, index, total, onEdit, onDelete, onMove) {
    var row = document.createElement("div");
    row.className = "item-row";

    var move = document.createElement("div");
    move.className = "move";
    var up = document.createElement("button");
    up.type = "button";
    up.textContent = "▲";
    up.disabled = index === 0;
    up.addEventListener("click", function () {
      onMove(-1);
    });
    var down = document.createElement("button");
    down.type = "button";
    down.textContent = "▼";
    down.disabled = index === total - 1;
    down.addEventListener("click", function () {
      onMove(1);
    });
    move.appendChild(up);
    move.appendChild(down);

    var input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.addEventListener("input", function () {
      onEdit(input.value);
    });

    var del = document.createElement("button");
    del.type = "button";
    del.className = "danger";
    del.textContent = "Remove";
    del.addEventListener("click", onDelete);

    row.appendChild(move);
    row.appendChild(input);
    row.appendChild(del);
    return row;
  }

  function renderAnswersTable() {
    var data = current();
    var functs = data.funct.item;
    var subtasks = data.subtask.item;
    var elements = data.force.item;

    els.answersBody.innerHTML = "";

    data.answers.forEach(function (answer, rowIndex) {
      var tr = document.createElement("tr");

      tr.appendChild(
        buildSelectCell(subtasks, answer.subtask, function (v) {
          answer.subtask = v;
          markDirty();
        })
      );
      tr.appendChild(
        buildSelectCell(functs, answer.funct, function (v) {
          answer.funct = v;
          markDirty();
        })
      );
      tr.appendChild(
        buildSelectCell(elements, getAnswerForce(answer), function (v) {
          answer.force = v;
          markDirty();
        })
      );

      var tdDel = document.createElement("td");
      var del = document.createElement("button");
      del.type = "button";
      del.className = "danger";
      del.textContent = "×";
      del.addEventListener("click", function () {
        data.answers.splice(rowIndex, 1);
        markDirty();
        renderAnswersTable();
      });
      tdDel.appendChild(del);
      tr.appendChild(tdDel);

      els.answersBody.appendChild(tr);
    });
  }

  function buildSelectCell(options, value, onChange) {
    var td = document.createElement("td");
    var sel = document.createElement("select");
    var empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "— select —";
    sel.appendChild(empty);

    options.forEach(function (opt) {
      var o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      if (opt === value) o.selected = true;
      sel.appendChild(o);
    });

    sel.addEventListener("change", function () {
      onChange(sel.value);
    });
    td.appendChild(sel);
    return td;
  }

  function addToList(key) {
    var data = current();

    switch (key) {
      case "functions":
        data.funct.item.push("");
        break;
      case "subtasks":
        data.subtask.item.push("");
        data.answers.push({
          subtask: "",
          funct: data.funct.item[0] || "",
          force: data.force.item[0] || "",
        });
        break;
      case "elements":
        data.force.item.push("");
        break;
      case "answers":
        data.answers.push({
          subtask: data.subtask.item[0] || "",
          funct: data.funct.item[0] || "",
          force: data.force.item[0] || "",
        });
        break;
    }
    markDirty();
    render();
    var panel = document.getElementById("panel-" + (key === "functions" ? "functions" : key === "subtasks" ? "subtasks" : key === "elements" ? "elements" : "answers"));
    if (panel && key !== "answers") {
      var inputs = panel.querySelectorAll(".item-list input");
      if (inputs.length) inputs[inputs.length - 1].focus();
    }
  }

  function rebuildAnswersFromSubtasks() {
    var data = current();
    if (
      data.answers.length > 0 &&
      !confirm(
        "Replace all answer rows with one row per scenario based task? Existing answer mappings will be lost."
      )
    ) {
      return;
    }

    var old = {};
    data.answers.forEach(function (a) {
      old[a.subtask] = a;
    });

    data.answers = data.subtask.item.map(function (st) {
      if (old[st]) return old[st];
      return {
        subtask: st,
        funct: data.funct.item[0] || "",
        force: data.force.item[0] || "",
      };
    });

    markDirty();
    render();
    setStatus("Answer rows rebuilt from scenario based task list.", "ok");
  }

  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) {
        t.classList.remove("active");
      });
      document.querySelectorAll(".panel").forEach(function (p) {
        p.classList.remove("active");
      });
      tab.classList.add("active");
      document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
    });
  });

  document.querySelectorAll(".add-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      addToList(btn.dataset.list);
    });
  });

  function updateCourseLink() {
    var ids = getOrderedScenarioIds();
    var idx = ids.indexOf(state.currentId);
    if (idx < 0) {
      idx = 0;
    }
    document.getElementById("linkCourse").href =
      "../../index.html?scenario=" + idx;
  }

  els.scenarioSelect.addEventListener("change", function () {
    if (state.dirty && !confirm("Switch scenario without saving? Unsaved changes will be lost.")) {
      els.scenarioSelect.value = state.currentId;
      return;
    }
    state.currentId = els.scenarioSelect.value;
    state.dirty = false;
    updateCourseLink();
    render();
    setStatus("", "");
  });

  els.btnReload.addEventListener("click", function () {
    if (state.dirty && !confirm("Reload from disk? Unsaved changes will be lost.")) return;
    loadAll().catch(function (err) {
      setStatus(err.message, "err");
    });
  });

  els.btnSave.addEventListener("click", function () {
    saveCurrent().catch(function (err) {
      setStatus(err.message, "err");
    });
  });

  els.btnSaveAll.addEventListener("click", function () {
    saveAllToProject().catch(function (err) {
      setStatus(err.message, "err");
    });
  });

  els.btnAddScenario.addEventListener("click", function () {
    addScenario().catch(function (err) {
      setStatus(err.message, "err");
    });
  });

  els.btnRemoveScenario.addEventListener("click", function () {
    removeScenario().catch(function (err) {
      setStatus(err.message, "err");
    });
  });

  els.btnDownload.addEventListener("click", downloadCurrent);
  els.btnExportHandoff.addEventListener("click", exportHandoff);
  els.btnPaperTest.addEventListener("click", downloadPaperTest);
  els.btnImportHandoff.addEventListener("click", function () {
    els.handoffFile.click();
  });
  els.handoffFile.addEventListener("change", function () {
    var file = els.handoffFile.files[0];
    els.handoffFile.value = "";
    if (!file) return;
    var apply = confirm(
      "Import handoff file?\n\n" +
        "OK = load into editor (review, then Save to project)\n" +
        "Cancel = abort"
    );
    if (apply) importHandoff(file);
  });
  els.btnRebuildAnswers.addEventListener("click", rebuildAnswersFromSubtasks);

  window.addEventListener("beforeunload", function (e) {
    if (state.dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  updateCourseLink();

  loadAll().catch(function (err) {
    startBlankEditor();
    setStatus(
      err.message +
        " — Started a blank scenario. Edit and export handoff, or run: node server.js",
      "ok"
    );
  });
})();
