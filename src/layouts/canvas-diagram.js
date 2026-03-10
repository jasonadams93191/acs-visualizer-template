/* ACS Visualizer - Canvas Diagram Layout */
/* Simplified workflow/stage diagram with task cards and dependency arrows */
var LAYOUT = (function() {

  var state = {};
  var STAGE_W = 220;
  var TASK_W = 184;
  var TASK_H = 68;
  var LANE_H = 90;
  var HEADER_H = 32;
  var LANE_LABEL_W = 130;

  function init(data, config) {
    state.data = data;
    state.config = config;
    state.currentPlan = 0;
    renderToolbar();
    renderPlan();
    renderStats();
  }

  function renderToolbar() {
    var bar = document.querySelector('.tab-bar');
    if (!bar) return;
    var plans = state.data.plans || [];
    if (plans.length <= 1) { bar.style.display = 'none'; return; }

    var html = '<select class="filter-select" id="planSelector" onchange="LAYOUT.selectPlan(this.value)" style="min-width:250px">';
    plans.forEach(function(p, i) {
      var name = p.name || ('Plan ' + (i + 1));
      var count = countTasks(p);
      html += '<option value="' + i + '">' + ACS.escHtml(name) + ' (' + count + ' tasks)</option>';
    });
    html += '</select>';
    html += '<div class="btn-group" style="margin-left:auto">';
    html += '<button class="btn btn-sm" onclick="LAYOUT.zoomIn()">Zoom +</button>';
    html += '<button class="btn btn-sm" onclick="LAYOUT.zoomOut()">Zoom -</button>';
    if (state.config.features.export) {
      state.config.features.export.forEach(function(fmt) {
        html += '<button class="btn btn-sm" onclick="LAYOUT.doExport(\'' + fmt + '\')">' + fmt.toUpperCase() + '</button>';
      });
    }
    html += '</div>';
    bar.innerHTML = html;
    bar.style.display = 'flex';
  }

  function renderPlan() {
    var main = document.getElementById('appMain');
    if (!main) return;
    var plan = (state.data.plans || [])[state.currentPlan];
    if (!plan) { main.innerHTML = '<div style="padding:40px;text-align:center;color:var(--g4)">No plan data loaded.</div>'; return; }

    var stages = plan.stages || [];
    var roles = extractRoles(plan);
    var canvasW = LANE_LABEL_W + (stages.length * STAGE_W) + 60;
    var canvasH = HEADER_H + (roles.length * LANE_H) + 40;

    var html = '<div class="panel active" id="panel-diagram"><div style="overflow:auto;padding:12px">';
    html += '<div style="position:relative;min-width:' + canvasW + 'px;min-height:' + canvasH + 'px">';

    // Stage bands
    stages.forEach(function(stage, si) {
      var left = LANE_LABEL_W + si * STAGE_W;
      html += '<div style="position:absolute;top:0;left:' + left + 'px;width:' + STAGE_W + 'px;bottom:0;border-right:1px solid var(--g2);background:' + (si % 2 === 0 ? 'rgba(247,248,250,.6)' : 'rgba(233,236,239,.3)') + '">';
      html += '<div style="position:sticky;top:0;z-index:20;background:var(--bl);color:var(--wh);font-size:11px;font-weight:700;text-align:center;padding:6px 4px;border-radius:0 0 5px 5px;margin:0 8px">' + ACS.escHtml(stage.name) + '</div>';
      html += '</div>';
    });

    // Role lanes
    roles.forEach(function(role, ri) {
      var top = HEADER_H + ri * LANE_H;
      var colors = getRoleColor(role);
      html += '<div style="position:absolute;left:0;right:0;top:' + top + 'px;height:' + LANE_H + 'px;border-bottom:1px solid var(--g2);background:' + (ri % 2 === 0 ? 'rgba(255,255,255,.6)' : 'rgba(248,250,252,.6)') + '">';
      html += '<div style="position:absolute;left:0;top:0;bottom:0;width:' + LANE_LABEL_W + 'px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;font-size:10px;font-weight:700;color:var(--g5);border-right:2px solid var(--g3);background:inherit">';
      html += '<div style="width:7px;height:7px;border-radius:2px;margin-right:5px;background:' + colors.bg + '"></div>';
      html += ACS.escHtml(role);
      html += '</div></div>';
    });

    // Task cards
    var taskPositions = {};
    stages.forEach(function(stage, si) {
      var tasksInStage = (stage.tasks || []);
      tasksInStage.forEach(function(task, ti) {
        var role = task.role || 'Unassigned';
        var ri = roles.indexOf(role);
        if (ri === -1) ri = roles.length - 1;

        var left = LANE_LABEL_W + si * STAGE_W + 18;
        var top = HEADER_H + ri * LANE_H + 12;
        var colors = getRoleColor(role);
        var taskId = task.id || (si + '-' + ti);
        taskPositions[taskId] = { x: left + TASK_W / 2, y: top + TASK_H / 2, left: left, top: top };

        html += '<div class="task-card" style="position:absolute;left:' + left + 'px;top:' + top + 'px;width:' + TASK_W + 'px;background:var(--wh);border:1.5px solid var(--g2);border-radius:6px;padding:5px 7px 6px;cursor:pointer;z-index:15" data-task-id="' + taskId + '" onclick="LAYOUT.showTask(\'' + ACS.escHtml(taskId) + '\')">';
        html += '<div style="height:3px;position:absolute;top:0;left:0;right:0;border-radius:6px 6px 0 0;background:' + colors.bg + '"></div>';
        html += '<div style="font-size:10.5px;font-weight:600;line-height:1.25;margin-top:2px;max-height:26px;overflow:hidden">' + ACS.escHtml(task.name) + '</div>';
        if (task.trigger) html += '<div style="font-size:9px;color:var(--g5);margin-top:3px">' + ACS.escHtml(task.trigger) + '</div>';
        html += '</div>';
      });
    });

    // SVG arrow layer for dependencies
    html += '<svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:12">';
    stages.forEach(function(stage) {
      (stage.tasks || []).forEach(function(task) {
        var taskId = task.id;
        if (!taskId || !task.predecessors) return;
        (task.predecessors || []).forEach(function(predId) {
          var from = taskPositions[predId];
          var to = taskPositions[taskId];
          if (!from || !to) return;
          var x1 = from.left + TASK_W;
          var y1 = from.top + TASK_H / 2;
          var x2 = to.left;
          var y2 = to.top + TASK_H / 2;
          var midX = (x1 + x2) / 2;
          html += '<path d="M ' + x1 + ' ' + y1 + ' C ' + midX + ' ' + y1 + ' ' + midX + ' ' + y2 + ' ' + x2 + ' ' + y2 + '" fill="none" stroke="var(--g4)" stroke-width="1.4" marker-end="url(#arrowhead)"/>';
        });
      });
    });
    html += '<defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--g4)"/></marker></defs>';
    html += '</svg>';

    html += '</div></div></div>';
    main.innerHTML = html;
  }

  function renderStats() {
    var plan = (state.data.plans || [])[state.currentPlan];
    if (!plan) return;
    var stages = plan.stages || [];
    var tasks = countTasks(plan);
    var roles = extractRoles(plan).length;
    ACS.renderStats({ stages: stages.length, tasks: tasks, roles: roles });
  }

  function selectPlan(idx) {
    state.currentPlan = parseInt(idx);
    renderPlan();
    renderStats();
  }

  function showTask(taskId) {
    var plan = (state.data.plans || [])[state.currentPlan];
    if (!plan) return;
    var task = null;
    (plan.stages || []).forEach(function(s) {
      (s.tasks || []).forEach(function(t) {
        if ((t.id || '') === taskId) task = t;
      });
    });
    if (!task) return;
    var body = '<div class="field"><label>Task Name</label><div style="font-size:14px;font-weight:600">' + ACS.escHtml(task.name) + '</div></div>';
    if (task.role) body += '<div class="field"><label>Assigned To</label><div>' + ACS.escHtml(task.role) + '</div></div>';
    if (task.trigger) body += '<div class="field"><label>Trigger</label><div>' + ACS.escHtml(task.trigger) + '</div></div>';
    if (task.description) body += '<div class="field"><label>Description</label><div style="font-size:13px;color:var(--g5)">' + ACS.escHtml(task.description) + '</div></div>';
    if (task.predecessors && task.predecessors.length) body += '<div class="field"><label>Predecessors</label><div>' + task.predecessors.map(function(p) { return '<span class="tag tag-purple" style="margin-right:4px">' + ACS.escHtml(p) + '</span>'; }).join('') + '</div></div>';
    ACS.openModal(task.name, body);
  }

  function extractRoles(plan) {
    var roleSet = {};
    (plan.stages || []).forEach(function(s) {
      (s.tasks || []).forEach(function(t) {
        roleSet[t.role || 'Unassigned'] = true;
      });
    });
    return Object.keys(roleSet);
  }

  function countTasks(plan) {
    var c = 0;
    (plan.stages || []).forEach(function(s) { c += (s.tasks || []).length; });
    return c;
  }

  function getRoleColor(role) {
    var colors = {
      'Attorney': { bg: '#3b82f6' }, 'Paralegal': { bg: '#22c55e' },
      'Admin': { bg: '#f97316' }, 'Finance': { bg: '#eab308' },
      'Super Attorney': { bg: '#6366f1' }, 'Super Paralegal': { bg: '#14b8a6' },
      'Unassigned': { bg: '#9ca3af' }
    };
    return colors[role] || { bg: '#6c757d' };
  }

  var zoom = 1;
  function zoomIn() { zoom = Math.min(2, zoom + 0.1); applyZoom(); }
  function zoomOut() { zoom = Math.max(0.5, zoom - 0.1); applyZoom(); }
  function applyZoom() {
    var panel = document.getElementById('panel-diagram');
    if (panel) panel.style.transform = 'scale(' + zoom + ')';
    if (panel) panel.style.transformOrigin = 'top left';
  }

  function doExport(format) {
    var plan = (state.data.plans || [])[state.currentPlan];
    if (!plan) return;
    if (format === 'json') {
      ACS.exportJSON(plan, state.config.project + '_' + (plan.name || 'plan') + '.json');
    } else {
      var rows = [];
      (plan.stages || []).forEach(function(s) {
        (s.tasks || []).forEach(function(t) {
          rows.push({ stage: s.name, task: t.name, role: t.role || '', trigger: t.trigger || '', predecessors: (t.predecessors || []).join('; ') });
        });
      });
      ACS.exportCSV(rows, ['stage', 'task', 'role', 'trigger', 'predecessors'], state.config.project + '_' + (plan.name || 'plan') + '.csv');
    }
  }

  return {
    init: init,
    selectPlan: selectPlan,
    showTask: showTask,
    zoomIn: zoomIn,
    zoomOut: zoomOut,
    doExport: doExport
  };
})();
