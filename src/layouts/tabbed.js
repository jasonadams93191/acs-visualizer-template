/* ACS Visualizer - Tabbed Workbook Layout */
var LAYOUT = (function() {

  var state = {};

  function init(data, config) {
    state.data = data;
    state.config = config;
    state.saved = ACS.loadSavedData();

    // Merge saved data overrides if any
    if (state.saved) {
      if (state.saved.overrides) state.data._overrides = state.saved.overrides;
      if (state.saved.defaults) state.data._defaults = state.saved.defaults;
      if (state.saved.profiles) state.data._profiles = state.saved.profiles;
    }

    renderTabs();
    renderPanels();
    renderStats();
    ACS.initTabs();
    initFeatures();
    ACS.initSaveBar(doSave);
  }

  function renderTabs() {
    var bar = document.querySelector('.tab-bar');
    if (!bar) return;
    var html = '';
    (state.data.tabs || state.config.tabs || []).forEach(function(tab, i) {
      var name = typeof tab === 'string' ? tab : tab.name;
      var count = typeof tab === 'object' && tab.items ? tab.items.length : '';
      var badge = count ? '<span class="badge">' + count + '</span>' : '';
      html += '<div class="tab' + (i === 0 ? ' active' : '') + '" data-tab="' + slugify(name) + '">' + ACS.escHtml(name) + badge + '</div>';
    });
    bar.innerHTML = html;
  }

  function renderPanels() {
    var main = document.getElementById('appMain');
    if (!main) return;
    var html = '';
    (state.data.tabs || []).forEach(function(tab, i) {
      var name = typeof tab === 'string' ? tab : tab.name;
      var type = typeof tab === 'object' ? (tab.type || 'text') : 'text';
      html += '<div class="panel' + (i === 0 ? ' active' : '') + '" id="panel-' + slugify(name) + '">';
      html += '<div class="panel-content">';

      if (type === 'text' || type === 'instructions') {
        html += renderTextPanel(tab);
      } else if (type === 'cards') {
        html += renderCardsPanel(tab);
      } else if (type === 'table') {
        html += renderTablePanel(tab);
      } else if (type === 'vendors' || type === 'static-cards') {
        html += renderStaticCards(tab);
      }

      html += '</div></div>';
    });
    main.innerHTML = html;
  }

  /* ── Panel Renderers ── */

  function renderTextPanel(tab) {
    if (typeof tab === 'string') return '<div class="section"><p>' + ACS.escHtml(tab) + '</p></div>';
    var html = '';
    (tab.sections || []).forEach(function(sec) {
      html += '<div class="section">';
      if (sec.title) html += '<h3>' + ACS.escHtml(sec.title) + '</h3>';
      if (sec.content) html += '<div style="font-size:13px;line-height:1.7;color:#475569">' + sec.content + '</div>';
      html += '</div>';
    });
    return html || '<div class="section"><p>' + ACS.escHtml(tab.content || '') + '</p></div>';
  }

  function renderCardsPanel(tab) {
    var html = '';
    // Toolbar
    if (state.config.features.search || state.config.features.expandCollapse) {
      html += '<div class="toolbar" style="margin:-24px -24px 16px;padding:12px 24px">';
      if (state.config.features.search) {
        html += '<div class="search-box"><span class="search-icon">&#128269;</span><input type="text" id="search-' + slugify(tab.name) + '" placeholder="Search ' + ACS.escHtml(tab.name) + '..."></div>';
      }
      if (state.config.features.expandCollapse) {
        html += '<div class="btn-group">';
        html += '<button class="btn btn-sm" onclick="ACS.expandAll(this.closest(\'.panel\'))">Expand All</button>';
        html += '<button class="btn btn-sm" onclick="ACS.collapseAll(this.closest(\'.panel\'))">Collapse All</button>';
        html += '</div>';
      }
      html += '</div>';
    }

    (tab.items || []).forEach(function(card, idx) {
      var accent = card.accentColor || state.config.accentColor || '#1956A6';
      html += '<div class="card mb-md" data-card-idx="' + idx + '" data-search-text="' + ACS.escHtml((card.title + ' ' + (card.subtitle || '')).toLowerCase()) + '">';
      html += '<div class="card-header" onclick="ACS.toggleCard(this)">';
      html += '<div class="card-accent" style="background:' + accent + '"></div>';
      html += '<div class="card-title">' + ACS.escHtml(card.title) + '</div>';
      if (card.subtitle) html += '<div class="card-meta">' + ACS.escHtml(card.subtitle) + '</div>';
      html += '<span class="expand-icon">&#9654;</span>';
      html += '</div>';
      html += '<div class="card-body">';

      // Render card fields
      (card.fields || []).forEach(function(f) {
        html += renderField(f, idx);
      });

      // Render card lists
      (card.lists || []).forEach(function(lst) {
        html += '<div class="field">';
        html += '<label>' + ACS.escHtml(lst.label) + ' <span class="tag tag-gray list-count-' + idx + '-' + slugify(lst.label) + '">' + (lst.values || []).length + '</span></label>';
        html += '<div class="dyn-list" data-list-key="' + slugify(lst.label) + '" data-card-idx="' + idx + '">';
        (lst.values || []).forEach(function(v) {
          html += '<div class="dyn-item"><input type="text" value="' + ACS.escHtml(v) + '"' + (state.config.features.editableFields ? '' : ' readonly') + '><button class="dyn-remove" title="Remove">&times;</button></div>';
        });
        if (state.config.features.editableFields) {
          html += '<div class="dyn-add"><input type="text" placeholder="Add ' + ACS.escHtml(lst.label.toLowerCase()) + '..."><button class="dyn-add-btn">+</button></div>';
        }
        html += '</div></div>';
      });

      html += '</div></div>';
    });

    return html;
  }

  function renderTablePanel(tab) {
    var html = '';
    // Toolbar
    html += '<div class="toolbar" style="margin:-24px -24px 16px;padding:12px 24px">';
    if (state.config.features.search) {
      html += '<div class="search-box"><span class="search-icon">&#128269;</span><input type="text" id="search-' + slugify(tab.name) + '" placeholder="Search..."></div>';
    }
    if (tab.filters) {
      html += '<select class="filter-select" id="filter-' + slugify(tab.name) + '">';
      tab.filters.forEach(function(f) {
        html += '<option value="' + ACS.escHtml(f.value) + '">' + ACS.escHtml(f.label) + '</option>';
      });
      html += '</select>';
    }
    if (state.config.features.export) {
      html += '<div class="btn-group" style="margin-left:auto">';
      state.config.features.export.forEach(function(fmt) {
        html += '<button class="btn btn-sm" onclick="LAYOUT.exportTable(\'' + slugify(tab.name) + '\',\'' + fmt + '\')">' + fmt.toUpperCase() + '</button>';
      });
      html += '</div>';
    }
    html += '</div>';

    // Table
    var cols = tab.columns || [];
    html += '<div style="overflow-x:auto;max-height:75vh;overflow-y:auto">';
    html += '<table class="data-table" id="table-' + slugify(tab.name) + '">';
    html += '<thead><tr>';
    cols.forEach(function(c) {
      var label = typeof c === 'string' ? c : c.label;
      html += '<th>' + ACS.escHtml(label) + '</th>';
    });
    html += '</tr></thead><tbody>';

    (tab.items || []).forEach(function(row, ri) {
      var rowText = cols.map(function(c) {
        var key = typeof c === 'string' ? c : c.key;
        return String(row[key] || '');
      }).join(' ').toLowerCase();
      var rowClass = row._class || '';
      html += '<tr data-row-idx="' + ri + '" data-search-text="' + ACS.escHtml(rowText) + '" class="' + rowClass + '">';
      cols.forEach(function(c) {
        var key = typeof c === 'string' ? c : c.key;
        var type = typeof c === 'object' ? (c.type || 'text') : 'text';
        var val = row[key] != null ? row[key] : '';

        if (type === 'select' && c.options) {
          html += '<td><select class="filter-select" data-row="' + ri + '" data-key="' + key + '" onchange="LAYOUT.onCellChange(this)" style="font-size:12px;padding:4px 6px">';
          html += '<option value="">--</option>';
          c.options.forEach(function(opt) {
            html += '<option value="' + ACS.escHtml(opt) + '"' + (opt === val ? ' selected' : '') + '>' + ACS.escHtml(opt) + '</option>';
          });
          html += '</select></td>';
        } else if (type === 'tag') {
          var tagClass = c.tagMap && c.tagMap[val] ? c.tagMap[val] : 'tag-gray';
          html += '<td><span class="tag ' + tagClass + '">' + ACS.escHtml(val) + '</span></td>';
        } else {
          html += '<td>' + ACS.escHtml(String(val)) + '</td>';
        }
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    return html;
  }

  function renderStaticCards(tab) {
    var html = '';
    (tab.items || []).forEach(function(card) {
      var accent = card.accentColor || '#6c757d';
      html += '<div class="card mb-md">';
      html += '<div class="card-header" onclick="ACS.toggleCard(this)">';
      html += '<div class="card-accent" style="background:' + accent + '"></div>';
      html += '<div class="card-title">' + ACS.escHtml(card.title) + '</div>';
      html += '<span class="expand-icon">&#9654;</span>';
      html += '</div>';
      html += '<div class="card-body">';
      if (card.content) html += '<div style="font-size:13px;line-height:1.6;color:#475569">' + card.content + '</div>';
      (card.fields || []).forEach(function(f) {
        html += '<div class="field"><label>' + ACS.escHtml(f.label) + '</label>';
        html += '<div style="font-size:13px">' + ACS.escHtml(f.value || '') + '</div></div>';
      });
      html += '</div></div>';
    });
    return html;
  }

  function renderField(f, cardIdx) {
    var html = '<div class="field">';
    html += '<label>' + ACS.escHtml(f.label) + '</label>';
    var ro = state.config.features.editableFields ? '' : ' readonly';
    if (f.type === 'textarea') {
      html += '<textarea data-card="' + cardIdx + '" data-key="' + slugify(f.label) + '"' + ro + ' oninput="ACS.markDirty()">' + ACS.escHtml(f.value || '') + '</textarea>';
    } else if (f.type === 'grid') {
      html += '<div style="display:grid;grid-template-columns:repeat(' + (f.columns || 3) + ',1fr);gap:8px">';
      (f.items || []).forEach(function(gi) {
        html += '<div><label style="font-size:10px">' + ACS.escHtml(gi.label) + '</label>';
        html += '<input type="text" value="' + ACS.escHtml(gi.value || '') + '" data-card="' + cardIdx + '" data-key="' + slugify(gi.label) + '"' + ro + ' oninput="ACS.markDirty()"></div>';
      });
      html += '</div>';
    } else {
      html += '<input type="text" value="' + ACS.escHtml(f.value || '') + '" data-card="' + cardIdx + '" data-key="' + slugify(f.label) + '"' + ro + ' oninput="ACS.markDirty()">';
    }
    html += '</div>';
    return html;
  }

  /* ── Features ── */

  function initFeatures() {
    // Init search for each tab
    (state.data.tabs || []).forEach(function(tab) {
      var name = typeof tab === 'string' ? tab : tab.name;
      var type = typeof tab === 'object' ? (tab.type || 'text') : 'text';
      if (type === 'cards') {
        ACS.initSearch('search-' + slugify(name), function(q) { filterCards(slugify(name), q); });
      } else if (type === 'table') {
        ACS.initSearch('search-' + slugify(name), function(q) { filterTable(slugify(name), q); });
      }
    });

    // Init dynamic lists
    document.querySelectorAll('.dyn-list').forEach(function(list) {
      ACS.initDynList(list);
    });
  }

  function filterCards(panelSlug, query) {
    var panel = document.getElementById('panel-' + panelSlug);
    if (!panel) return;
    panel.querySelectorAll('.card').forEach(function(card) {
      var text = card.dataset.searchText || '';
      card.style.display = ACS.matchesSearch(text, query) ? '' : 'none';
    });
  }

  function filterTable(panelSlug, query) {
    var table = document.getElementById('table-' + panelSlug);
    if (!table) return;
    table.querySelectorAll('tbody tr').forEach(function(tr) {
      var text = tr.dataset.searchText || '';
      tr.style.display = ACS.matchesSearch(text, query) ? '' : 'none';
    });
  }

  function renderStats() {
    var stats = {};
    (state.data.tabs || []).forEach(function(tab) {
      if (typeof tab === 'object' && tab.items) {
        stats[tab.name.toLowerCase()] = tab.items.length;
      }
    });
    if (Object.keys(stats).length > 0) ACS.renderStats(stats);
  }

  /* ── Cell Change ── */
  function onCellChange(el) {
    var ri = parseInt(el.dataset.row);
    var key = el.dataset.key;
    var val = el.value;
    // Find the tab this table belongs to
    var table = el.closest('table');
    if (table) {
      var panelId = table.id.replace('table-', '');
      var tab = (state.data.tabs || []).find(function(t) {
        return typeof t === 'object' && slugify(t.name) === panelId;
      });
      if (tab && tab.items && tab.items[ri]) {
        tab.items[ri][key] = val;
      }
    }
    ACS.markDirty();
  }

  /* ── Export ── */
  function exportTable(panelSlug, format) {
    var tab = (state.data.tabs || []).find(function(t) {
      return typeof t === 'object' && slugify(t.name) === panelSlug;
    });
    if (!tab) return;
    var cols = (tab.columns || []).map(function(c) { return typeof c === 'string' ? c : c.key; });
    if (format === 'json') {
      ACS.exportJSON(tab.items || [], state.config.project + '_' + tab.name + '.json');
    } else {
      ACS.exportCSV(tab.items || [], cols, state.config.project + '_' + tab.name + '.csv');
    }
  }

  /* ── Save ── */
  function doSave() {
    ACS.saveData({
      tabs: state.data.tabs,
      savedAt: new Date().toISOString()
    });
  }

  /* ── Utils ── */
  function slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  return {
    init: init,
    onCellChange: onCellChange,
    exportTable: exportTable
  };
})();
