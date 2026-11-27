/* تثبيت الإجابة في الأسئلة الاختيارية: الطالب يختار ويغيّر براحته، ولا تُحتسب الإجابة إلا بعد الضغط على "تثبيت الإجابة" */
(function () {
  var BLUE = ['border-blue-600', 'bg-blue-50', 'dark:bg-blue-900/40', 'ring-2', 'ring-blue-400'];
  function clickedOption() {
    try {
      var e = window.event, t = e && e.target;
      if (!t || !t.closest) return null;
      return t.closest('button[data-opt]');
    } catch (x) { return null; }
  }
  function clearMarks(box) {
    box.querySelectorAll('button[data-opt]').forEach(function (b) {
      BLUE.forEach(function (c) { b.classList.remove(c); });
      b.removeAttribute('aria-pressed');
    });
    var r = box.querySelector('.ict-lock-row'); if (r) r.remove();
  }
  function confirmBox(box) {
    var p = box.__pend; if (!p) return;
    box.__pend = null;
    clearMarks(box);
    p.fn.apply(p.ctx, p.args);
  }
  function wrap(name) {
    var orig = window[name]; if (typeof orig !== 'function') return;
    window[name] = function () {
      var args = Array.prototype.slice.call(arguments), b = clickedOption();
      if (!b || b.disabled) return orig.apply(this, args);
      var box = b.closest('[id$="-mc"]');
      if (!box || box.dataset.done) return orig.apply(this, args);
      box.__pend = { fn: orig, args: args, ctx: this };
      clearMarks(box);
      BLUE.forEach(function (c) { b.classList.add(c); });
      b.setAttribute('aria-pressed', 'true');
      var row = document.createElement('div');
      row.className = 'ict-lock-row flex flex-wrap items-center gap-2';
      var lk = document.createElement('button');
      lk.type = 'button';
      lk.className = 'px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-extrabold transition';
      lk.textContent = '🔒 تثبيت الإجابة';
      lk.addEventListener('click', function (ev) { ev.stopPropagation(); confirmBox(box); });
      var hint = document.createElement('span');
      hint.className = 'text-[11px] font-bold text-slate-500 dark:text-slate-400';
      hint.textContent = 'تقدر تغيّر اختيارك قبل التثبيت';
      row.appendChild(lk); row.appendChild(hint);
      b.insertAdjacentElement('afterend', row);
    };
  }

  /* لمسات واجهة: تركيز واضح للوحة المفاتيح، مساحة لمس مريحة، حركة ناعمة */
  var st = document.createElement('style'); st.id = 'ict-polish2';
  st.textContent = 'html{scroll-behavior:smooth;-webkit-tap-highlight-color:transparent}' +
    'button:focus-visible,a:focus-visible,summary:focus-visible,[role=button]:focus-visible{outline:3px solid #60a5fa !important;outline-offset:2px}' +
    'button,a,summary{transition:background-color .15s,border-color .15s,box-shadow .15s,transform .1s}' +
    'button:not(:disabled):active{transform:scale(.98)}' +
    'button[data-opt]{min-height:2.75rem}' +
    '@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}button,a,summary{transition:none}}';
  document.head.appendChild(st);
  wrap('assessPick');
  wrap('examPick');
  var fin = window.examFinish;
  if (typeof fin === 'function') window.examFinish = function () {
    document.querySelectorAll('[id$="-mc"]').forEach(function (bx) { if (bx.__pend) confirmBox(bx); });
    return fin.apply(this, arguments);
  };
})();

document.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('button');if(!b)return;var m=(b.getAttribute('onclick')||'').match(/getElementById\('([^']+)'\)\.classList\.toggle\('hidden'\)/);if(!m)return;var t=document.getElementById(m[1]);if(!t)return;var x=b.textContent.trim();if(b.dataset.ictShow===undefined){if(x.indexOf('اعرض الإجابة')!==0)return;b.dataset.ictShow=x}b.textContent=t.classList.contains('hidden')?b.dataset.ictShow:'إخفاء الإجابة'});

/* Term 2: visible show/hide label on expandable answer blocks */
(function(){var S='display:inline-block;flex:none;margin-inline-start:.75rem;padding:.375rem .875rem;border-radius:.75rem;background:#f59e0b;color:#020617;font-size:.75rem;font-weight:800;white-space:nowrap';var SHOW='اعرض الإجابة النموذجية',HIDE='إخفاء الإجابة';function lab(d){var l=d.querySelector(':scope>summary>.ict-t2lbl');if(l)l.textContent=d.open?HIDE:SHOW}function dec(r){(r||document).querySelectorAll('details.border-amber-300:not([data-ictl])').forEach(function(d){var s=d.querySelector(':scope>summary');if(!s)return;d.dataset.ictl='1';s.style.cssText+=';display:flex;align-items:center;justify-content:space-between;gap:.5rem';var b=document.createElement('span');b.className='ict-t2lbl';b.style.cssText=S;s.appendChild(b);lab(d)})}document.addEventListener('toggle',function(e){if(e.target&&e.target.matches&&e.target.matches('details[data-ictl]'))lab(e.target)},true);new MutationObserver(function(){dec()}).observe(document.documentElement,{childList:true,subtree:true});dec()})();
