/* ACS Visualizer - Core Utilities */
var ACS = (function() {
  var dirty = false;
  var SAVE_KEY = 'acs_data_' + CONFIG.project.replace(/\s+/g, '_').toLowerCase();

  /* ── Tab Navigation ── */
  function initTabs() {
    var tabs = document.querySelectorAll('.tab-bar .tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = tab.dataset.tab;
        tabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        document.querySelectorAll('.panel').forEach(function(p) {
          p.classList.toggle('active', p.id === 'panel-' + target);
        });
      });
    });
  }

  /* ── Search ── */
  function initSearch(inputId, filterFn) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var debounce;
    input.addEventListener('input', function() {
      clearTimeout(debounce);
      debounce = setTimeout(function() { filterFn(input.value.trim().toLowerCase()); }, 150);
    });
  }

  function matchesSearch(text, query) {
    if (!query) return true;
    return text.toLowerCase().indexOf(query) !== -1;
  }

  /* ── Expand / Collapse ── */
  function toggleCard(header) {
    var body = header.nextElementSibling;
    var icon = header.querySelector('.expand-icon');
    if (body && body.classList.contains('card-body')) {
      body.classList.toggle('open');
      if (icon) icon.classList.toggle('open');
    }
  }

  function expandAll(container) {
    (container || document).querySelectorAll('.card-body').forEach(function(b) { b.classList.add('open'); });
    (container || document).querySelectorAll('.expand-icon').forEach(function(i) { i.classList.add('open'); });
  }

  function collapseAll(container) {
    (container || document).querySelectorAll('.card-body').forEach(function(b) { b.classList.remove('open'); });
    (container || document).querySelectorAll('.expand-icon').forEach(function(i) { i.classList.remove('open'); });
  }

  /* ── Dynamic Lists ── */
  function initDynList(container, onChange) {
    container.addEventListener('click', function(e) {
      if (e.target.classList.contains('dyn-remove')) {
        e.target.closest('.dyn-item').remove();
        markDirty();
        if (onChange) onChange();
      }
      if (e.target.classList.contains('dyn-add-btn')) {
        var input = container.querySelector('.dyn-add input');
        if (input && input.value.trim()) {
          addDynItem(container, input.value.trim());
          input.value = '';
          markDirty();
          if (onChange) onChange();
        }
      }
    });
    container.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.target.closest('.dyn-add')) {
        e.preventDefault();
        var btn = container.querySelector('.dyn-add-btn');
        if (btn) btn.click();
      }
    });
  }

  function addDynItem(container, value) {
    var list = container.querySelector('.dyn-list') || container;
    var addRow = list.querySelector('.dyn-add');
    var item = document.createElement('div');
    item.className = 'dyn-item';
    item.innerHTML = '<input type="text" value="' + escHtml(value) + '"><button class="dyn-remove" title="Remove">&times;</button>';
    if (addRow) list.insertBefore(item, addRow);
    else list.appendChild(item);
  }

  function getDynValues(container) {
    var vals = [];
    container.querySelectorAll('.dyn-item input').forEach(function(inp) {
      if (inp.value.trim()) vals.push(inp.value.trim());
    });
    return vals;
  }

  function renderDynList(container, values, placeholder) {
    var html = '';
    (values || []).forEach(function(v) {
      html += '<div class="dyn-item"><input type="text" value="' + escHtml(v) + '"><button class="dyn-remove" title="Remove">&times;</button></div>';
    });
    html += '<div class="dyn-add"><input type="text" placeholder="' + escHtml(placeholder || 'Add item...') + '"><button class="dyn-add-btn">+</button></div>';
    container.innerHTML = html;
  }

  /* ── Export ── */
  function exportJSON(data, filename) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, filename || CONFIG.project.replace(/\s+/g, '_') + '.json');
  }

  function exportCSV(rows, headers, filename) {
    var lines = [headers.join(',')];
    rows.forEach(function(row) {
      lines.push(headers.map(function(h) {
        var v = (row[h] != null ? String(row[h]) : '').replace(/"/g, '""');
        return '"' + v + '"';
      }).join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    downloadBlob(blob, filename || CONFIG.project.replace(/\s+/g, '_') + '.csv');
  }

  function downloadBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  /* ── Save / Dirty ── */
  function markDirty() {
    dirty = true;
    var el = document.querySelector('.save-status');
    if (el) { el.textContent = 'Unsaved changes'; el.classList.add('dirty'); }
    var btn = document.querySelector('.save-btn');
    if (btn) { btn.disabled = false; btn.classList.add('btn-primary'); }
  }

  function markClean() {
    dirty = false;
    var el = document.querySelector('.save-status');
    if (el) { el.textContent = 'All changes saved'; el.classList.remove('dirty'); }
    var btn = document.querySelector('.save-btn');
    if (btn) { btn.disabled = true; btn.classList.remove('btn-primary'); }
  }

  function saveData(data) {
    try {
      var payload = {
        project: CONFIG.project,
        savedAt: new Date().toISOString(),
        user: ACS_AUTH.getUser(),
        data: data
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      markClean();
      return true;
    } catch(e) {
      alert('Save failed: ' + e.message);
      return false;
    }
  }

  function loadSavedData() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw).data;
    } catch(e) {}
    return null;
  }

  function initSaveBar(saveFn) {
    var btn = document.querySelector('.save-btn');
    if (btn) btn.addEventListener('click', saveFn);
    window.addEventListener('beforeunload', function(e) {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });
    markClean();
  }

  /* ── Modal ── */
  function openModal(title, bodyHtml, onSave) {
    var overlay = document.getElementById('modalOverlay');
    var modal = overlay.querySelector('.modal');
    modal.innerHTML = '<h3>' + escHtml(title) + '</h3>' + bodyHtml +
      '<div class="modal-actions"><button class="btn" onclick="ACS.closeModal()">Cancel</button>' +
      (onSave ? '<button class="btn btn-primary" id="modalSaveBtn">Save</button>' : '') + '</div>';
    overlay.classList.add('open');
    if (onSave) document.getElementById('modalSaveBtn').addEventListener('click', function() { onSave(); ACS.closeModal(); });
  }

  function closeModal() {
    var overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('open');
  }

  /* ── Stats ── */
  function renderStats(stats) {
    var el = document.getElementById('headerStats');
    if (!el) return;
    el.innerHTML = Object.keys(stats).map(function(k) {
      return '<span><b>' + stats[k] + '</b> ' + k + '</span>';
    }).join('<span style="opacity:.4">&#183;</span>');
  }

  /* ── Utilities ── */
  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* ── Init ── */
  function init() {
    initTabs();
    markClean();
  }

  return {
    init: init,
    initTabs: initTabs,
    initSearch: initSearch,
    matchesSearch: matchesSearch,
    toggleCard: toggleCard,
    expandAll: expandAll,
    collapseAll: collapseAll,
    initDynList: initDynList,
    addDynItem: addDynItem,
    getDynValues: getDynValues,
    renderDynList: renderDynList,
    exportJSON: exportJSON,
    exportCSV: exportCSV,
    markDirty: markDirty,
    markClean: markClean,
    saveData: saveData,
    loadSavedData: loadSavedData,
    initSaveBar: initSaveBar,
    openModal: openModal,
    closeModal: closeModal,
    renderStats: renderStats,
    escHtml: escHtml,
    $: $, $$: $$,
    dirty: function() { return dirty; }
  };
})();
