/* Driving Licence: practice test, fee calculator and validity calculator. Everything runs in the browser. */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); }, esc = function (s) { return SYG.esc(s); };

  /* ---------- practice test ---------- */
  var box = $('pt-box');
  if (box) {
    var DATA = JSON.parse($('pt-data').textContent), Q = DATA.q, SIGNS = DATA.signs;
    var set = [], at = 0, right = 0, wrong = [];
    var shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    var start = function (topic, n) {
      var pool = Q.filter(function (q) { return !topic || q[0] === topic; });
      set = shuffle(pool.slice()).slice(0, n || pool.length); at = 0; right = 0; wrong = [];
      show();
    };
    var show = function () {
      if (at >= set.length) return done();
      var q = set[at], order = shuffle(q[2].map(function (_, i) { return i; }));
      box.innerHTML = '<p class="pt-count">Question ' + (at + 1) + ' of ' + set.length + ' · ' + esc(q[0]) + '</p>' +
        (q[5] ? '<div class="pt-sign">' + SIGNS[q[5]] + '</div>' : '') + '<h2 class="pt-q">' + esc(q[1]) + '</h2><div class="pt-opts">' +
        order.map(function (i) { return '<button type="button" class="pt-opt" data-i="' + i + '">' + esc(q[2][i]) + '</button>'; }).join('') + '</div><div id="pt-why" aria-live="polite"></div>';
      box.scrollIntoView({ block: 'nearest' });
    };
    var done = function () {
      var pct = Math.round(right * 100 / set.length), pass = pct >= 60;
      try { localStorage.setItem('lic-best', Math.max(pct, parseInt(localStorage.getItem('lic-best') || '0', 10))); } catch (e) {}
      box.innerHTML = '<div class="result"><h2>' + (pass ? 'Well done' : 'Keep practising') + '</h2><p class="big">' + right + ' / ' + set.length + '</p><p>You answered ' + pct + '% correctly. ' +
        (pass ? 'That is above 60%, the pass mark used in the computer test in Delhi, for example.' : 'Aim for at least 60%, the pass mark used in the computer test in Delhi, for example.') + '</p>' +
        (wrong.length ? '<h3>Go over these</h3><ul class="pt-review">' + wrong.map(function (q) { return '<li><b>' + esc(q[1]) + '</b>' + (q[5] ? ' (' + esc(DATA.names[q[5]]) + ' sign)' : '') + '<br>' + esc(q[2][q[3]]) + '. ' + esc(q[4]) + '</li>'; }).join('') + '</ul>' : '<p>No mistakes. Try another set to be sure.</p>') +
        '<div class="acts"><button class="btn" type="button" data-start="">Another 15 questions</button><a class="btn ghost" href="/licence/questions/">Read all questions and answers</a>' +
        '<button class="btn ghost" type="button" data-wa="I scored ' + right + ' out of ' + set.length + ' in a learner licence practice test. Try it: https://rto.shareyourgroup.com/licence/practice-test/">Share on WhatsApp</button></div></div>';
      box.scrollIntoView({ block: 'nearest' });
    };
    d.addEventListener('click', function (e) {
      var s = e.target.closest('[data-start]');
      if (s) { var t = s.getAttribute('data-start'); start(t, t ? 0 : 15); return; }
      var o = e.target.closest('.pt-opt'); if (!o || o.disabled) return;
      var q = set[at], pick = parseInt(o.getAttribute('data-i'), 10), ok = pick === q[3];
      [].forEach.call(box.querySelectorAll('.pt-opt'), function (b) { b.disabled = true; if (parseInt(b.getAttribute('data-i'), 10) === q[3]) b.classList.add('ok'); });
      if (ok) right++; else { o.classList.add('no'); wrong.push(q); }
      $('pt-why').innerHTML = '<p class="note"><b>' + (ok ? 'Correct.' : 'Not quite.') + '</b> ' + esc(q[4]) + '</p><p><button class="btn" type="button" id="pt-next">' + (at + 1 < set.length ? 'Next question' : 'See my score') + '</button></p>';
      $('pt-next').focus();
    });
    d.addEventListener('click', function (e) { if (e.target.id === 'pt-next') { at++; show(); } });
    try { var best = localStorage.getItem('lic-best'); if (best && $('pt-best')) { $('pt-best').hidden = false; $('pt-best').textContent = 'Your best score on this device: ' + best + '%'; } } catch (e) {}
  }

  /* ---------- fee calculator ---------- */
  var fc = $('fc-n');
  if (fc) {
    var fout = $('fc-out'), rup = function (n) { return 'Rs ' + n.toLocaleString('en-IN'); };
    var frun = function () {
      var n = parseInt(fc.value, 10), ll = 150 * n + 50, dl = 300 * n + 200, text = 'Learner and driving licence fees for ' + n + (n === 1 ? ' class' : ' classes') + ' of vehicle: ' + rup(ll + dl) + ' (central fees, before state charges)';
      fout.hidden = false;
      fout.innerHTML = '<h2>Central fees for ' + n + (n === 1 ? ' class' : ' classes') + ' of vehicle</h2><p class="big">' + rup(ll + dl) + '</p><dl class="facts">' +
        '<dt>Learner\'s licence, Rs 150 for each class</dt><dd>' + rup(150 * n) + '</dd><dt>Learner\'s licence test</dt><dd>' + rup(50) + '</dd><dt>At the learner stage</dt><dd>' + rup(ll) + '</dd>' +
        '<dt>Driving test, Rs 300 for each class</dt><dd>' + rup(300 * n) + '</dd><dt>Issue of driving licence</dt><dd>' + rup(200) + '</dd><dt>At the driving licence stage</dt><dd>' + rup(dl) + '</dd></dl>' +
        '<p class="hint">States add their own user or smart card charges on top, and a repeat test is charged again. The payment page of Sarathi shows the exact amount for your state.</p>' +
        '<div class="acts"><button class="btn sm ghost" type="button" data-copy="' + esc(text) + '">Copy</button></div>';
    };
    fc.addEventListener('change', frun); frun();
  }

  /* ---------- validity calculator ---------- */
  var vb = $('vc-dob');
  if (vb) {
    var vi = $('vc-issue'), vt = $('vc-type'), vout = $('vc-out');
    var fmt = function (x) { return x.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); };
    var add = function (x, y) { var r = new Date(x.getTime()); r.setFullYear(r.getFullYear() + y); return r; };
    var vrun = function () {
      var dob = new Date(vb.value), iss = new Date(vi.value);
      if (isNaN(dob) || isNaN(iss)) { vout.hidden = true; return; }
      var age = (iss - dob) / (365.2425 * 864e5), until, why;
      vout.hidden = false;
      if (age < 16 || age > 110) { vout.innerHTML = '<p>Check the two dates. The date of issue should be at least 16 years after the date of birth.</p>'; return; }
      if (vt.value === 'tr') { until = add(iss, 5); why = 'A licence for transport (commercial) vehicles is valid for 5 years from the date of issue.'; }
      else if (age < 30) { until = add(dob, 40); why = 'You were under 30 on the date of issue, so the licence runs until you turn 40.'; }
      else if (age < 50) { until = add(iss, 10); why = 'You were between 30 and 50 on the date of issue, so the licence is valid for 10 years.'; }
      else if (age < 55) { until = add(dob, 60); why = 'You were between 50 and 55 on the date of issue, so the licence runs until you turn 60.'; }
      else { until = add(iss, 5); why = 'You were 55 or older on the date of issue, so the licence is valid for 5 years.'; }
      var text = 'Driving licence valid until about ' + fmt(until) + '. Renewal window: ' + fmt(add(until, -1)) + ' to ' + fmt(add(until, 1)) + '.';
      vout.innerHTML = '<h2>Valid until about</h2><p class="big">' + fmt(until) + '</p><p>' + why + '</p><dl class="facts"><dt>Renewal can be applied for</dt><dd>' + fmt(add(until, -1)) + ' to ' + fmt(add(until, 1)) + '</dd>' +
        '<dt>Age on date of issue</dt><dd>' + Math.floor(age) + ' years</dd></dl><p class="hint">This follows the rule as explained on the Parivahan website. The date printed on your own licence is the one that counts.</p>' +
        '<div class="acts"><button class="btn sm ghost" type="button" data-copy="' + esc(text) + '">Copy</button></div>';
    };
    [vb, vi, vt].forEach(function (e) { e.addEventListener('change', vrun); e.addEventListener('input', vrun); });
  }
})();
