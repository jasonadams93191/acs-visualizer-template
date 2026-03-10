/* ACS Visualizer - Comparison/Matrix Layout */
var LAYOUT = (function() {

  var state = {};

  function init(data, config) {
    state.data = data;
    state.config = config;
    render();
    initFeatures();
  }

  function render() {
    var main = document.getElementById('appMain');
    if (!main) return;
    var d = state.data;
    var html = '<div class="panel active" id="panel-matrix"><div class="panel-content">';

    // Title / description
    if (d.title) html += '<h3 style="margin-bottom:8px">' + ACS.escHtml(d.title) + '</h3>';
    if (d.description) html += '<p style="font-size:13px;color:var(--g5);margin-bottom:16px">' + ACS.escHtml(d.description) + '</p>';

    // Toolbar
    html += '<div class="toolbar" style="margin-bottom:16px;border:1px solid var(--g2);border-radius:var(--radius)">';
    html += '<div class="search-box"><span class="search-icon">&#128269;</span><input type="text" id="matrixSearch" placeholder="Search rows..."></div>';
    if (d.categories) {
      html += '<select class="filter-select" id="matrixFilter"><option value="">All Categories</option>';
      d.categories.forEach(function(cat) {
        html += '<option value="' + ACS.escHtml(cat) + '">' + ACS.escHtml(cat) + '</option>';
      });
      html += '</select>';
    }
    if (state.config.features.export) {
      html += '<div class="btn-group" style="margin-left:auto">';
      state.config.features.export.forEach(function(fmt) {
        html += '<button class="btn btn-sm" onclick="LAYOUT.doExport(\'' + fmt + '\')">' + fmt.toUpperCase() + '</button>';
      });
      html += '</div>';
    }
    html += '</div>';

    // Legend
    if (d.legend) {
      html += '<div style="display:flex;gap:16px;margin-bottom:12px;font-size:11px;color:var(--g5);flex-wrap:wrap">';
      d.legend.forEach(function(l) {
        html += '<span>' + l.symbol + ' ' + ACS.escHtml(l.label) + '</span>';
      });
      html += '</div>';
    }

    // Matrix table
    var cols = d.columns || [];
    var rows = d.rows || [];
    html += '<div class="matrix-wrap">';
    html += '<table class="matrix-table" id="matrixTable">';

    // Header
    html += '<thead><tr>';
    html += '<th class="corner">' + ACS.escHtml(d.rowHeader || '') + '</th>';
    cols.forEach(function(col) {
      var label = typeof col === 'string' ? col : col.label;
      var tooltip = typeof col === 'object' && col.tooltip ? ' title="' + ACS.escHtml(col.tooltip) + '"' : '';
      html += '<th' + tooltip + '>' + ACS.escHtml(label) + '</th>';
    });
    html += '</tr></thead>';

    // Body
    html += '<tbody>';
    rows.forEach(function(row, ri) {
      var rowName = typeof row === 'string' ? row : row.name;
      var category = typeof row === 'object' ? (row.category || '') : '';
      var searchText = (rowName + ' ' + category).toLowerCase();
      html += '<tr data-row-idx="' + ri + '" data-search-text="' + ACS.escHtml(searchText) + '" data-category="' + ACS.escHtml(category) + '">';
      html += '<td class="row-label">' + ACS.escHtml(rowName);
      if (category) html += '<div style="font-size:10px;color:var(--g5);font-weight:400">' + ACS.escHtml(category) + '</div>';
      html += '</td>';

      cols.forEach(function(col) {
        var colKey = typeof col === 'string' ? col : (col.key || col.label);
        var rowKey = typeof row === 'string' ? row : (row.key || row.name);
        var cellKey = rowKey + '::' + colKey;
        var cell = d.cells ? d.cells[cellKey] : null;

        if (cell == null && typeof row === 'object' && row.values) {
          cell = row.values[colKey];
        }

        html += '<td>' + renderCell(cell) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';

    html += '</div></div>';
    main.innerHTML = html;

    // Stats
    var totalCells = rows.length * cols.length;
    var filledCells = 0;
    rows.forEach(function(row) {
      cols.forEach(function(col) {
        var colKey = typeof col === 'string' ? col : (col.key || col.label);
        var rowKey = typeof row === 'string' ? row : (row.key || row.name);
        var cellKey = rowKey + '::' + colKey;
        var cell = d.cells ? d.cells[cellKey] : null;
        if (cell == null && typeof row === 'object' && row.values) cell = row.values[colKey];
        if (cell != null && cell !== false && cell !== '' && cell !== 'no') filledCells++;
      });
    });
    ACS.renderStats({ rows: rows.length, columns: cols.length, coverage: Math.round((filledCells / totalCells) * 100) + '%' });
  }

  function renderCell(cell) {
    if (cell == null || cell === '') return '<span class="cell-x">-</span>';
    if (cell === true || cell === 'yes' || cell === 'check') return '<span class="cell-check">&#10003;</span>';
    if (cell === false || cell === 'no') return '<span class="cell-x">&#10007;</span>';
    if (cell === 'partial') return '<span class="cell-partial">&#9679;</span>';
    if (typeof cell === 'object' && cell.value != null) {
      var style = cell.color ? 'color:' + cell.color : '';
      return '<span style="font-size:12px;font-weight:600;' + style + '">' + ACS.escHtml(String(cell.value)) + '</span>';
    }
    return '<span style="font-size:12px">' + ACS.escHtml(String(cell)) + '</span>';
  }

  function initFeatures() {
    ACS.initSearch('matrixSearch', filterRows);
    var filterEl = document.getElementById('matrixFilter');
    if (filterEl) {
      filterEl.addEventListener('change', function() { filterRows(document.getElementById('matrixSearch').value); });
    }
  }

  function filterRows(query) {
    var cat = '';
    var filterEl = document.getElementById('matrixFilter');
    if (filterEl) cat = filterEl.value;
    var table = document.getElementById('matrixTable');
    if (!table) return;
    table.querySelectorAll('tbody tr').forEach(function(tr) {
      var textMatch = ACS.matchesSearch(tr.dataset.searchText || '', query);
      var catMatch = !cat || tr.dataset.category === cat;
      tr.style.display = (textMatch && catMatch) ? '' : 'none';
    });
  }

  function doExport(format) {
    var d = state.data;
    var cols = d.columns || [];
    var rows = d.rows || [];
    if (format === 'json') {
      ACS.exportJSON({ columns: cols, rows: rows, cells: d.cells }, state.config.project + '_matrix.json');
    } else {
      var headers = [d.rowHeader || 'Item'].concat(cols.map(function(c) { return typeof c === 'string' ? c : c.label; }));
      var csvRows = rows.map(function(row) {
        var rowName = typeof row === 'string' ? row : row.name;
        var obj = {};
        obj[headers[0]] = rowName;
        cols.forEach(function(col, ci) {
          var colKey = typeof col === 'string' ? col : (col.key || col.label);
          var rowKey = typeof row === 'string' ? row : (row.key || row.name);
          var cellKey = rowKey + '::' + colKey;
          var cell = d.cells ? d.cells[cellKey] : null;
          if (cell == null && typeof row === 'object' && row.values) cell = row.values[colKey];
          obj[headers[ci + 1]] = cell === true ? 'Yes' : cell === false ? 'No' : (cell != null ? String(typeof cell === 'object' ? cell.value : cell) : '');
        });
        return obj;
      });
      ACS.exportCSV(csvRows, headers, state.config.project + '_matrix.csv');
    }
  }

  return { init: init, doExport: doExport };
})();
