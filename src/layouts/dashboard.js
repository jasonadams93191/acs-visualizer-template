/* ACS Visualizer - Dashboard/KPI Layout */
var LAYOUT = (function() {

  var state = {};

  function init(data, config) {
    state.data = data;
    state.config = config;
    render();
  }

  function render() {
    var main = document.getElementById('appMain');
    if (!main) return;
    var html = '<div class="panel active" id="panel-dashboard"><div class="panel-content">';

    // KPI Cards
    if (state.data.kpis && state.data.kpis.length) {
      html += '<div class="kpi-grid">';
      state.data.kpis.forEach(function(kpi) {
        html += '<div class="kpi-card">';
        html += '<div class="kpi-value" style="color:' + (kpi.color || 'var(--nv)') + '">' + ACS.escHtml(String(kpi.value)) + '</div>';
        html += '<div class="kpi-label">' + ACS.escHtml(kpi.label) + '</div>';
        if (kpi.trend) {
          var cls = kpi.trend.direction === 'up' ? 'up' : (kpi.trend.direction === 'down' ? 'down' : '');
          var arrow = kpi.trend.direction === 'up' ? '&#9650;' : (kpi.trend.direction === 'down' ? '&#9660;' : '');
          html += '<div class="kpi-trend ' + cls + '">' + arrow + ' ' + ACS.escHtml(kpi.trend.text) + '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    // Charts
    if (state.data.charts && state.data.charts.length) {
      var chartCols = state.data.charts.length > 1 ? 'display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:16px;' : '';
      html += '<div style="' + chartCols + 'margin-bottom:24px">';
      state.data.charts.forEach(function(chart) {
        html += '<div class="chart-card">';
        html += '<div class="chart-title">' + ACS.escHtml(chart.title) + '</div>';

        if (chart.type === 'bar') {
          html += renderBarChart(chart);
        } else if (chart.type === 'donut') {
          html += renderDonutChart(chart);
        } else if (chart.type === 'stacked-bar') {
          html += renderStackedBarChart(chart);
        } else if (chart.type === 'progress') {
          html += renderProgressBars(chart);
        }

        html += '</div>';
      });
      html += '</div>';
    }

    // Tables
    if (state.data.tables && state.data.tables.length) {
      state.data.tables.forEach(function(tbl) {
        html += '<div class="section">';
        html += '<h3>' + ACS.escHtml(tbl.title) + '</h3>';
        html += renderDashTable(tbl);
        html += '</div>';
      });
    }

    html += '</div></div>';
    main.innerHTML = html;

    // Render stats
    if (state.data.stats) ACS.renderStats(state.data.stats);
  }

  function renderBarChart(chart) {
    var maxVal = Math.max.apply(null, chart.data.map(function(d) { return d.value; }));
    if (maxVal === 0) maxVal = 1;
    var html = '<div class="bar-chart">';
    chart.data.forEach(function(d) {
      var pct = Math.round((d.value / maxVal) * 100);
      var color = d.color || 'var(--bl)';
      html += '<div class="bar-row">';
      html += '<div class="bar-label">' + ACS.escHtml(d.label) + '</div>';
      html += '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + color + '">' + d.value + '</div></div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderDonutChart(chart) {
    var total = chart.data.reduce(function(s, d) { return s + d.value; }, 0);
    if (total === 0) total = 1;
    var colors = ['#1956A6', '#27ae60', '#f39c12', '#ff6b6b', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1'];
    var segments = [];
    var offset = 0;
    chart.data.forEach(function(d, i) {
      var pct = (d.value / total) * 100;
      segments.push({ pct: pct, offset: offset, color: d.color || colors[i % colors.length], label: d.label, value: d.value });
      offset += pct;
    });

    var size = 160;
    var r = 60;
    var cx = size / 2;
    var cy = size / 2;
    var html = '<div class="donut-wrap">';
    html += '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">';

    segments.forEach(function(seg) {
      var startAngle = (seg.offset / 100) * 360 - 90;
      var endAngle = ((seg.offset + seg.pct) / 100) * 360 - 90;
      var largeArc = seg.pct > 50 ? 1 : 0;
      var x1 = cx + r * Math.cos(startAngle * Math.PI / 180);
      var y1 = cy + r * Math.sin(startAngle * Math.PI / 180);
      var x2 = cx + r * Math.cos(endAngle * Math.PI / 180);
      var y2 = cy + r * Math.sin(endAngle * Math.PI / 180);
      if (seg.pct >= 99.9) {
        html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + seg.color + '" stroke-width="24"/>';
      } else if (seg.pct > 0.1) {
        html += '<path d="M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + '" fill="none" stroke="' + seg.color + '" stroke-width="24"/>';
      }
    });

    html += '<text x="' + cx + '" y="' + cx + '" text-anchor="middle" dominant-baseline="middle" font-size="20" font-weight="700" fill="var(--tx)">' + total + '</text>';
    html += '</svg>';

    // Legend
    html += '<div style="display:flex;flex-direction:column;gap:6px">';
    segments.forEach(function(seg) {
      html += '<div style="display:flex;align-items:center;gap:6px;font-size:12px">';
      html += '<div style="width:10px;height:10px;border-radius:2px;background:' + seg.color + ';flex-shrink:0"></div>';
      html += '<span>' + ACS.escHtml(seg.label) + '</span>';
      html += '<span style="color:var(--g5);margin-left:auto;font-weight:600">' + seg.value + '</span>';
      html += '</div>';
    });
    html += '</div></div>';
    return html;
  }

  function renderStackedBarChart(chart) {
    var maxVal = Math.max.apply(null, chart.data.map(function(d) {
      return d.segments.reduce(function(s, seg) { return s + seg.value; }, 0);
    }));
    if (maxVal === 0) maxVal = 1;
    var html = '<div class="bar-chart">';
    chart.data.forEach(function(d) {
      var total = d.segments.reduce(function(s, seg) { return s + seg.value; }, 0);
      html += '<div class="bar-row">';
      html += '<div class="bar-label">' + ACS.escHtml(d.label) + '</div>';
      html += '<div class="bar-track" style="display:flex">';
      d.segments.forEach(function(seg) {
        var pct = Math.round((seg.value / maxVal) * 100);
        html += '<div style="width:' + pct + '%;height:100%;background:' + (seg.color || 'var(--bl)') + '" title="' + ACS.escHtml(seg.label + ': ' + seg.value) + '"></div>';
      });
      html += '</div>';
      html += '<span style="font-size:11px;color:var(--g5);min-width:30px">' + total + '</span>';
      html += '</div>';
    });
    html += '</div>';

    // Legend
    if (chart.data[0] && chart.data[0].segments) {
      html += '<div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap">';
      chart.data[0].segments.forEach(function(seg) {
        html += '<div style="display:flex;align-items:center;gap:4px;font-size:11px">';
        html += '<div style="width:8px;height:8px;border-radius:2px;background:' + (seg.color || 'var(--bl)') + '"></div>';
        html += ACS.escHtml(seg.label);
        html += '</div>';
      });
      html += '</div>';
    }
    return html;
  }

  function renderProgressBars(chart) {
    var html = '<div style="display:flex;flex-direction:column;gap:12px">';
    chart.data.forEach(function(d) {
      var pct = Math.min(100, Math.max(0, d.value));
      var color = d.color || (pct >= 80 ? 'var(--gn)' : pct >= 50 ? 'var(--or)' : 'var(--co)');
      html += '<div>';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px"><span>' + ACS.escHtml(d.label) + '</span><span style="font-weight:700">' + pct + '%</span></div>';
      html += '<div class="bar-track" style="height:12px"><div class="bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderDashTable(tbl) {
    var html = '<div style="overflow-x:auto">';
    html += '<table class="data-table"><thead><tr>';
    (tbl.columns || []).forEach(function(c) {
      var label = typeof c === 'string' ? c : c.label;
      html += '<th>' + ACS.escHtml(label) + '</th>';
    });
    html += '</tr></thead><tbody>';
    (tbl.rows || []).forEach(function(row) {
      html += '<tr>';
      (tbl.columns || []).forEach(function(c) {
        var key = typeof c === 'string' ? c : c.key;
        html += '<td>' + ACS.escHtml(String(row[key] != null ? row[key] : '')) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  return { init: init };
})();
