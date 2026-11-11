/* RTO Codes: the all-India finder on the home page, and the filter and sort on list pages. Searched inside the browser. */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); }, esc = function (s) { return SYG.esc(s); };

  /* ---------- filter and sort a table or grid ---------- */
  /* sort by the place, not by the kind of office in front of it (RTO Amritsar sorts under A) */
  function place(n) { return n.replace(/^((RTO|ARTO|DTO|ADTO|SRTO|SDM|RLA|STA|DY\.?|ADDL\.?|UO|MVI|AMVI|JTC|RTA)[\s.,-]+)+/i, '').trim().toLowerCase(); }
  var f = $('rto-f'), t = $('rto-t');
  if (f && t) {
    var body = t.tBodies ? t.tBodies[0] : t, none = $('rto-none');
    f.addEventListener('input', function () {
      var v = f.value.trim().toLowerCase().replace(/[\s-]+/g, ' '), tight = v.replace(/ /g, ''), n = 0;
      [].forEach.call(d.querySelectorAll('[data-f]'), function (r) {
        var k = r.getAttribute('data-f'), hit = !v || k.indexOf(v) > -1 || k.replace(/[\s-]/g, '').indexOf(tight) > -1;
        r.hidden = !hit; if (hit) n++;
      });
      if (none) none.hidden = n > 0;
      [].forEach.call(d.querySelectorAll('details'), function (x) { if (v && x.querySelector('[data-f]:not([hidden])')) x.open = true; });
    });
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sort]'); if (!b) return;
      var by = b.getAttribute('data-sort'), rows = [].slice.call(body.rows);
      rows.sort(function (a, c) {
        if (by === 'name') return place(a.cells[1].textContent).localeCompare(place(c.cells[1].textContent));
        return parseInt(a.cells[0].textContent.replace(/\D/g, ''), 10) - parseInt(c.cells[0].textContent.replace(/\D/g, ''), 10);
      });
      rows.forEach(function (r) { body.appendChild(r); });
      [].forEach.call(d.querySelectorAll('[data-sort]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    });
  }

  /* ---------- the finder ---------- */
  var q = $('rto-q'); if (!q) return;
  var out = $('rto-out'), rec = $('rto-recent'), D = null, wait = null;
  function show(code) { var n = code.slice(2); return code.slice(0, 2) + '-' + (/^\d(\D|$)/.test(n) ? '0' : '') + n; }
  function card(o) {
    var s = D.states[o[2]], text = show(o[0]) + ' is ' + o[1] + ', ' + s[1] + ' (VAHAN list, ' + D.asof + ')';
    return '<div class="result rise"><h2>' + esc(s[1]) + '</h2><p class="big">' + show(o[0]) + '</p><p><b>' + esc(o[1]) + '</b></p>' +
      '<dl class="facts"><dt>State or UT</dt><dd>' + esc(s[1]) + ' (' + s[0] + ')</dd><dt>On VAHAN since</dt><dd>' + esc(o[3]) + '</dd>' +
      (o[4] ? '' : '<dt>Note</dt><dd>A three-digit VAHAN code. It is not normally seen on number plates.</dd>') + '</dl>' +
      '<div class="acts"><a class="btn sm" href="/' + s[2] + '/">All ' + esc(s[0]) + ' codes</a><button class="btn sm ghost" type="button" data-copy="' + esc(text) + '">Copy</button>' +
      '<button class="btn sm ghost" type="button" data-wa="' + esc(text + ' rto.shareyourgroup.com') + '">WhatsApp</button></div></div>';
  }
  function run(save) {
    var raw = q.value.trim().toUpperCase(), v = raw.replace(/[^A-Z0-9]/g, '');
    if (!v) { out.innerHTML = ''; return; }
    if (/^\d{2}BH/.test(v)) {
      out.innerHTML = '<div class="result"><h2>Bharat series number</h2><p>A number that starts with two digits and BH is a Bharat (BH) series plate. It has no state letters and no RTO code. The two digits are the year of registration.</p><p><a href="/number-plate/">How to read a number plate</a></p></div>';
      return;
    }
    var m = v.match(/^([A-Z]{2})(\d{1,3})/), hits = [];
    if (m) {
      var st = m[1], num = m[2].replace(/^0+(?=\d)/, '');
      /* a full number such as PB10AB1234: the office number is the digits before the series letters; try the longest that exists */
      for (var len = num.length; len >= 1 && !hits.length; len--) {
        var code = st + num.slice(0, len);
        hits = D.offices.filter(function (o) { return o[0] === code || o[0].replace(/[A-Z]$/, '') === code; });
      }
      if (!hits.length) {
        var has = D.states.filter(function (s) { return s[0] === st; })[0];
        out.innerHTML = '<div class="result"><h2>No office with this code</h2><p>' + (has ? 'The VAHAN list has no office numbered ' + esc(num) + ' in ' + esc(has[1]) + '. <a href="/' + has[2] + '/">See all ' + st + ' codes</a>.' :
          esc(st) + ' is not a state code in use on VAHAN today. It may be an older code: see <a href="/state-codes/">state letters</a>.') + '</p></div>';
        return;
      }
      out.innerHTML = hits.map(card).join('');
      if (save) { SYG.recent('rto-recent', { u: hits[0][0], t: show(hits[0][0]) + ' ' + hits[0][1] }); recent(); }
      return;
    }
    if (/^[A-Z]{2}$/.test(v)) { var s2 = D.states.filter(function (s) { return s[0] === v; })[0]; if (s2) hits = D.offices.filter(function (o) { return D.states[o[2]] === s2 && o[4]; }); }
    var words = raw.toLowerCase().split(/\s+/).filter(Boolean);
    var byName = D.offices.filter(function (o) { var n = (o[1] + ' ' + D.states[o[2]][1]).toLowerCase(); return words.every(function (w) { return n.indexOf(w) > -1; }); });
    hits = hits.concat(byName.filter(function (o) { return hits.indexOf(o) < 0; }));
    if (!hits.length) { out.innerHTML = '<p class="hint">No office or place matches "' + esc(raw) + '". Try the first letters of the number plate, such as PB10, or <a href="/states/">browse by state</a>.</p>'; return; }
    if (hits.length === 1) { out.innerHTML = card(hits[0]); return; }
    out.innerHTML = '<p class="hint">' + hits.length + ' matches' + (hits.length > 60 ? ', showing the first 60' : '') + '. Tap one.</p><ul class="rto-list">' + hits.slice(0, 60).map(function (o) {
      return '<li><a href="/?q=' + o[0] + '" data-pick="' + o[0] + '"><b>' + show(o[0]) + '</b>' + esc(o[1]) + '<small>' + esc(D.states[o[2]][1]) + '</small></a></li>';
    }).join('') + '</ul>';
  }
  function recent() {
    var list = SYG.recent('rto-recent');
    rec.hidden = !list.length;
    rec.innerHTML = list.length ? '<b>Looked up recently:</b> ' + list.map(function (x) { return '<a href="/?q=' + esc(x.u) + '" data-pick="' + esc(x.u) + '">' + esc(x.t) + '</a>'; }).join('') : '';
  }
  function go(save) {
    if (D) return run(save);
    if (!wait) { out.innerHTML = '<div class="shim"></div>'; wait = SYG.json('/data/rto.json').then(function (j) { D = j; }); }
    wait.then(function () { run(save); }, function () { out.innerHTML = '<p class="hint">The list could not be loaded. Check your connection and try again.</p>'; wait = null; });
  }
  var timer;
  q.addEventListener('input', function () { go(false); clearTimeout(timer); timer = setTimeout(function () { go(true); }, 1500); });
  d.addEventListener('click', function (e) { var a = e.target.closest('[data-pick]'); if (!a) return; e.preventDefault(); q.value = a.getAttribute('data-pick'); go(true); q.scrollIntoView({ block: 'center' }); });
  var p = new URLSearchParams(location.search).get('q'); if (p) { q.value = p; go(true); }
  recent();
})();
