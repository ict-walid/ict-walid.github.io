/* حفظ حالة الاختبارات (أسئلة + إجابات) عبر تحديث الصفحة حتى التسليم؛ بعد التسليم أي إعادة تعطي أسئلة جديدة */
(function () {
  var PFX = 'ict_exam_v1_', MAX_AGE = 48 * 3600 * 1000;
  function uid() {
    try {
      var u = appState.currentUser;
      if (!u || appState.isTeacherMode || u.username === 'mr_walid_preview') return (u && u.username === 'mr_walid_preview') ? 'preview' : null;
      return String(u.uid || u.username || '');
    } catch (e) { return null; }
  }
  function load() { var id = uid(); if (!id) return null; try { return JSON.parse(localStorage.getItem(PFX + id) || '{}') || {}; } catch (e) { return {}; } }
  function store(all) { var id = uid(); if (!id) return; try { localStorage.setItem(PFX + id, JSON.stringify(all)); } catch (e) {} }
  function save(u) {
    try {
      var ex = window.__t1ex && window.__t1ex[u]; if (!ex) return;
      var all = load(); if (!all) return;
      var res = {}, ans = {};
      ex.list.forEach(function (it, i) {
        var r = ex.res[it.id];
        if (it.type === 'mcq') { if (r) res[i] = r.picked; }
        else {
          var ta = document.getElementById(it.id + '-ta');
          var v = ta ? ta.value : (ex.ans && ex.ans[i]) || '';
          if (v) ans[i] = v;
          if (r) res[i] = 'c';
        }
      });
      ex.ans = ex.ans || {}; Object.keys(ans).forEach(function (k) { ex.ans[k] = ans[k]; });
      all[u] = { t: Date.now(), finished: !!ex.finished, res: res, ans: ans,
        list: ex.list.map(function (it) { return [it.type === 'mcq' ? 'm' : 'e', it.lid, T1_ASSESS[it.lid].indexOf(it.x)]; }) };
      store(all);
    } catch (e) {}
  }
  function rebuild(u, s) {
    var list = s.list.map(function (r, i) {
      var x = T1_ASSESS[r[1]] && T1_ASSESS[r[1]][r[2]]; if (!x) throw 0;
      return { type: r[0] === 'm' ? 'mcq' : 'essay', lid: r[1], x: x, id: (u === 'term' ? 'exterm-' : 'ex' + u + '-') + i };
    });
    return { u: u, list: list, res: {}, finished: false };
  }
  var origShow = {};
  function wrapShow(name, key) {
    var f = window[name]; if (typeof f !== 'function') return; origShow[name] = f;
    window[name] = function (a, b) {
      var u = key || a, fresh = key ? a : b;
      var args = Array.prototype.slice.call(arguments);
      var mem = window.__t1ex[u], restoring = !!window.__ictRestoring;
      var s = null;
      if (!fresh && !mem) { var all = load(); s = all && all[u]; if (s && Date.now() - s.t > MAX_AGE) s = null; }
      if (!fresh && mem && mem.finished && !restoring) fresh = true;
      if (!fresh && s && s.finished && !restoring) { fresh = true; s = null; }
      if (fresh) { delete window.__t1ex[u]; s = null; args = key ? [true] : [u, true]; }
      var replay = null;
      if (s && !mem) { try { window.__t1ex[u] = rebuild(u, s); replay = s; } catch (e) { delete window.__t1ex[u]; replay = null; } }
      var r = f.apply(this, args);
      if (replay) {
        var ex = window.__t1ex[u];
        ex.ans = replay.ans || {};
        ex.list.forEach(function (it, i) {
          if (it.type === 'essay' && replay.ans && replay.ans[i]) { var ta = document.getElementById(it.id + '-ta'); if (ta) ta.value = replay.ans[i]; }
        });
        ex.list.forEach(function (it, i) {
          var v = replay.res[i]; if (v === undefined) return;
          if (it.type === 'mcq') examPick(u, i, v); else examCheckEssay(u, i);
        });
        if (replay.finished) { examFinish(u); window.scrollTo(0, 0); }
      }
      save(u);
      return r;
    };
  }
  wrapShow('showT1Exam'); wrapShow('showT1TermExam', 'term');
  ['examPick', 'examCheckEssay', 'examFinish'].forEach(function (n) {
    var f = window[n]; if (typeof f !== 'function') return;
    window[n] = function (u) { var r = f.apply(this, arguments); save(u); return r; };
  });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t || !t.id || !/-ta$/.test(t.id)) return;
    var m = /^(?:ex(\d)-|exterm-)\d+-ta$/.exec(t.id); if (!m) return;
    save(m[1] || 'term');
  });
  var lo = window.logoutUser;
  if (typeof lo === 'function') window.logoutUser = function () {
    var id = uid(); try { if (id) localStorage.removeItem(PFX + id); } catch (e) {}
    window.__t1ex = {};
    return lo.apply(this, arguments);
  };
})();
