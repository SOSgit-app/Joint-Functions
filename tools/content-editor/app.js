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
    btnImportHandoff: document.getElementById("btnImportHandoff"),
    handoffFile: document.getElementById("handoffFile"),
    status: document.getElementById("status"),
    validation: document.getElementById("validation"),
    listFunctions: document.getElementById("list-functions"),
    listSubtasks: document.getElementById("list-subtasks"),
    listElementsFirst: document.getElementById("list-elements-first"),
    listElementsSecond: document.getElementById("list-elements-second"),
    answersBody: document.getElementById("answersBody"),
    btnSyncElementCount: document.getElementById("btnSyncElementCount"),
    btnRebuildAnswers: document.getElementById("btnRebuildAnswers"),
  };

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
    var first = data.force && data.force.first ? data.force.first : [];
    var second = data.force && data.force.second ? data.force.second : [];
    var answers = data.answers || [];

    if (!functs.length) issues.push(p + "Function library is empty.");
    if (!subtasks.length) issues.push(p + "Subtask list is empty.");
    if (!first.length) issues.push(p + "Element library (first) is empty.");
    if (!second.length) issues.push(p + "Element library (second) is empty.");
    if (first.length !== second.length) {
      issues.push(p + "Element lists differ in length (" + first.length + " vs " + second.length + ").");
    }

    answers.forEach(function (a, i) {
      var row = p + "Answer row " + (i + 1);
      if (!a.subtask) issues.push(row + ": missing subtask.");
      else if (subtasks.indexOf(a.subtask) === -1) issues.push(row + ': subtask "' + a.subtask + '" not in list.');
      if (!a.funct) issues.push(row + ": missing function.");
      else if (functs.indexOf(a.funct) === -1) issues.push(row + ': function "' + a.funct + '" not in library.');
      if (!a.force || a.force.length !== 2) {
        issues.push(row + ": force must be two element names.");
      } else {
        if (first.indexOf(a.force[0]) === -1) issues.push(row + ': element (first) "' + a.force[0] + '" invalid.');
        if (second.indexOf(a.force[1]) === -1) issues.push(row + ': element (second) "' + a.force[1] + '" invalid.');
      }
    });

    subtasks.forEach(function (st) {
      if (!answers.some(function (a) { return a.subtask === st; })) {
        issues.push(p + 'Subtask has no answer row: "' + st + '"');
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
    var data = current();
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

    renderStringList(els.listElementsFirst, data.force.first, function (items) {
      data.force.first = items;
      markDirty();
      renderAnswersTable();
    });

    renderStringList(els.listElementsSecond, data.force.second, function (items) {
      data.force.second = items;
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
    var first = data.force.first;
    var second = data.force.second;

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
        buildSelectCell(first, answer.force[0], function (v) {
          answer.force[0] = v;
          markDirty();
        })
      );
      tr.appendChild(
        buildSelectCell(second, answer.force[1], function (v) {
          answer.force[1] = v;
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
    var label = prompt("New item text:");
    if (label === null) return;
    label = label.trim();
    if (!label) return;

    switch (key) {
      case "functions":
        data.funct.item.push(label);
        break;
      case "subtasks":
        data.subtask.item.push(label);
        data.answers.push({
          subtask: label,
          funct: data.funct.item[0] || "",
          force: [data.force.first[0] || "", data.force.second[0] || ""],
        });
        break;
      case "elements-first":
        data.force.first.push(label);
        data.force.second.push(label);
        break;
      case "answers":
        data.answers.push({
          subtask: data.subtask.item[0] || "",
          funct: data.funct.item[0] || "",
          force: [data.force.first[0] || "", data.force.second[0] || ""],
        });
        break;
    }
    markDirty();
    render();
  }

  function syncElementLengths() {
    var data = current();
    var a = data.force.first;
    var b = data.force.second;
    while (a.length < b.length) a.push("");
    while (b.length < a.length) b.push("");
    markDirty();
    render();
    setStatus("Padded shorter element list with empty rows.", "ok");
  }

  function rebuildAnswersFromSubtasks() {
    var data = current();
    if (
      data.answers.length > 0 &&
      !confirm(
        "Replace all answer rows with one row per subtask? Existing answer mappings will be lost."
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
        force: [data.force.first[0] || "", data.force.second[0] || ""],
      };
    });

    markDirty();
    render();
    setStatus("Answer rows rebuilt from subtask list.", "ok");
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
      "/index-debug.html?scenario=" + idx + "&force=0";
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
  els.btnSyncElementCount.addEventListener("click", syncElementLengths);
  els.btnRebuildAnswers.addEventListener("click", rebuildAnswersFromSubtasks);

  window.addEventListener("beforeunload", function (e) {
    if (state.dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  updateCourseLink();

  loadAll().catch(function (err) {
    setStatus(
      err.message + " — Start the project server with: node server.js",
      "err"
    );
  });
})();
