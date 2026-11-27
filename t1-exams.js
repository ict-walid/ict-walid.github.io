/*************************************************************************
 * الاختبارات الشاملة 1-4 (واحد لكل وحدة): 50 سؤالًا = 35 موضوعي + 15 مقالي
 * كل الأسئلة مسحوبة من أسئلة التقييمات الرسمية (T1_ASSESS) دون أي إضافة.
 * الموضوعي: فقط الأسئلة التي لها خيارات حقيقية.
 *************************************************************************/
const T1_EXAM_UNITS = {1:['1-1','1-2','1-3','1-4'],2:['2-1','2-2','2-3'],3:['3-1','3-2','3-3'],4:['4-1','4-2','4-3','4-4']};
const T1_EXAM_UNIT_NAME = {1:'الوحدة الأولى',2:'الوحدة الثانية',3:'الوحدة الثالثة',4:'الوحدة الرابعة','term':'الترم الأول كامل'};
window.__t1ex = window.__t1ex || {};

function t1Norm(s) {
  return String(s || '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .toLowerCase()
    .replace(/[^\u0621-\u064Aa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
const T1_STOP = new Set(['في','من','على','الي','عن','هذا','هذه','ذلك','التي','الذي','التى','هو','هي','ان','او','ثم','كما','مع','بين','عند','كل','ما','لا','قد','لم','كان','يكون','تكون','او','اي','به','بها','له','لها','ايضا','حيث','اذا','الى','هناك','فقط','بعد','قبل','خلال','وهو','وهي']);
function t1Stem(w) {
  w = w.replace(/^(وال|بال|لل|كال|فال)/, '').replace(/^(ال|و|ب|ل|ك|ف)(?=.{3,})/, '');
  w = w.replace(/(ات|ون|ين|ان|ها|هم|ه|ي|ا)$/, m => '');
  return w;
}
function t1Terms(s) {
  return t1Norm(s).split(' ').filter(w => w.length > 1 && !T1_STOP.has(w)).map(t1Stem).filter(w => w.length > 1);
}
function t1Grade(student, model) {
  const st = t1Terms(student), md = t1Terms(model);
  if (!st.length || !md.length) return {ok: false, cover: 0, dice: 0, matched: 0};
  const sset = new Set(st), mset = new Set(md);
  let matched = 0;
  mset.forEach(m => { if (sset.has(m) || [...sset].some(s => s.length > 3 && m.length > 3 && (s.startsWith(m) || m.startsWith(s)))) matched++; });
  const cover = matched / mset.size;
  let inter = 0; sset.forEach(s => { if (mset.has(s)) inter++; });
  const dice = 2 * inter / (sset.size + mset.size);
  const ok = matched >= 3 && (dice >= 0.9 || cover >= 0.6) || (mset.size <= 4 && cover >= 0.9);
  return {ok, cover, dice, matched};
}

function t1ShuffleSample(arr, n) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
function t1Split(total, parts) { const b = Math.floor(total / parts), r = total % parts; return Array.from({length: parts}, (_, i) => b + (i < r ? 1 : 0)); }
function t1Diff(it) {
  if (it.type === 'mcq') return it.x.mcq.stem.length + it.x.mcq.opts.reduce((n, o) => n + o.length, 0) * 0.6 + (it.x.mcq.opts[it.x.mcq.correct] || '').length;
  return (it.x.a || '').length;
}
function t1BuildExam(u) {
  const lessons = T1_EXAM_UNITS[u];
  const nM = t1Split(35, lessons.length), nE = t1Split(15, lessons.length);
  const mcq = [], essay = [];
  lessons.forEach((lid, i) => {
    const items = T1_ASSESS[lid] || [];
    const seenQ = new Set();
    const uniq = x => { const k = x.q.replace(/[\s\u064B-\u0652؟?.،:]/g, ''); if (seenQ.has(k)) return false; seenQ.add(k); return true; };
    const pm = items.filter(x => x.qtype === 'موضوعي' && x.mcq).filter(uniq), pe = items.filter(x => x.qtype !== 'موضوعي').filter(uniq);
    t1ShuffleSample(pm, nM[i]).forEach(x => mcq.push({type: 'mcq', lid, x}));
    t1ShuffleSample(pe, nE[i]).forEach(x => essay.push({type: 'essay', lid, x}));
  });
  mcq.sort((a, b) => t1Diff(a) - t1Diff(b));
  essay.sort((a, b) => t1Diff(a) - t1Diff(b));
  const list = mcq.concat(essay);
  list.forEach((it, i) => it.id = 'ex' + u + '-' + i);
  return {u, list, res: {}, finished: false};
}

function showT1Exam(u, fresh) {
  if (fresh || !window.__t1ex[u]) window.__t1ex[u] = t1BuildExam(u);
  appState.selectedLessonId = 't1-exam-' + u;
  if (appState.activeTab !== 'lessons') switchTab('lessons');
  renderLessonExplorer();
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function examPick(u, i, picked) {
  const ex = window.__t1ex[u]; const it = ex.list[i]; if (ex.res[it.id] || ex.finished) return;
  const m = it.x.mcq; ex.res[it.id] = {ok: picked === m.correct, picked};
  const box = document.getElementById(it.id + '-mc');
  box.querySelectorAll('button[data-opt]').forEach(b => {
    const k = parseInt(b.dataset.opt, 10); b.disabled = true;
    if (k === m.correct) b.classList.add('bg-emerald-100', 'dark:bg-emerald-900/50', 'border-emerald-500', 'text-emerald-900', 'dark:text-emerald-100');
    else if (k === picked) b.classList.add('bg-red-100', 'dark:bg-red-900/40', 'border-red-500', 'text-red-900', 'dark:text-red-100');
  });
  const fb = document.getElementById(it.id + '-fb'); fb.classList.remove('hidden');
  fb.textContent = picked === m.correct ? '✔ إجابة صحيحة' : '✘ إجابة غير صحيحة — الإجابة الصحيحة: ' + ['أ', 'ب', 'ج', 'د'][m.correct] + ') ' + m.opts[m.correct];
}

function examCheckEssay(u, i) {
  const ex = window.__t1ex[u]; const it = ex.list[i];
  const val = (document.getElementById(it.id + '-ta') || {}).value || '';
  const g = t1Grade(val, it.x.a); ex.res[it.id] = {ok: g.ok, g};
  const fb = document.getElementById(it.id + '-fb'); fb.classList.remove('hidden');
  const pct = Math.round(Math.max(g.cover, g.dice) * 100);
  fb.className = 'p-3.5 rounded-xl border text-xs sm:text-sm font-bold leading-relaxed whitespace-pre-line ' + (g.ok ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200' : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200');
  fb.textContent = (g.ok ? '✔ تُحتسب صحيحة' : (val.trim() ? '✘ لا تُحتسب صحيحة' : '✘ لم تكتب إجابة')) + ' (تطابق تقريبي ' + pct + '٪ مع الإجابة النموذجية)\n\nالإجابة النموذجية:\n' + it.x.a;
  const ta = document.getElementById(it.id + '-ta'); if (ta) ta.readOnly = true;
  const bt = document.getElementById(it.id + '-bt'); if (bt) bt.classList.add('hidden');
}

function examFinish(u) {
  const ex = window.__t1ex[u]; if (ex.finished) return;
  ex.list.forEach((it, i) => { if (it.type === 'essay' && !ex.res[it.id]) examCheckEssay(u, i); });
  ex.finished = true;
  let m = 0, e = 0, mt = 0, et = 0, ans = 0;
  ex.list.forEach(it => { const r = ex.res[it.id]; if (it.type === 'mcq') { mt++; if (r) ans++; if (r && r.ok) m++; } else { et++; if (r && r.ok) e++; } });
  const box = document.getElementById('exam-result'); box.classList.remove('hidden');
  box.innerHTML = '<div class="text-base font-extrabold">النتيجة: ' + (m + e) + ' / ' + (mt + et) + '</div><div class="text-sm font-bold">الموضوعي: ' + m + ' / ' + mt + ' (لم تُجَب ' + (mt - ans) + ')</div><div class="text-sm font-bold">المقالي: ' + e + ' / ' + et + '</div>';
  box.scrollIntoView({behavior: 'smooth', block: 'center'});
}

function renderT1Exam(u) {
  const ex = window.__t1ex[u] || (window.__t1ex[u] = t1BuildExam(u));
  const letters = ['أ', 'ب', 'ج', 'د'];
  const cls = 'p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 space-y-2.5';
  const q = (it, i) => {
    if (it.type === 'mcq') {
      const m = it.x.mcq;
      return `<div class="${cls}">
        <div class="text-[11px] font-extrabold text-blue-800 dark:text-blue-300">${i + 1} • ${u === 'term' ? 'الوحدة ' + it.lid.split('-')[0] + ' • ' : ''}الدرس ${it.lid}</div>
        <p class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">${escapeHtml(m.stem)}</p>
        <div id="${it.id}-mc" class="space-y-2">${m.opts.map((o, oi) => `
          <button data-opt="${oi}" onclick="examPick('${u}', ${i}, ${oi})" class="w-full text-right px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed transition">
            <span class="font-extrabold text-blue-800 dark:text-blue-300">${letters[oi]} -</span> <span dir="auto">${escapeHtml(o)}</span></button>`).join('')}</div>
        <div id="${it.id}-fb" class="hidden p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed"></div></div>`;
    }
    return `<div class="${cls}">
        <div class="text-[11px] font-extrabold text-blue-800 dark:text-blue-300">${i + 1} • مقالي • ${u === 'term' ? 'الوحدة ' + it.lid.split('-')[0] + ' • ' : ''}الدرس ${it.lid}</div>
        <p class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-line">${escapeHtml(it.x.q)}</p>
        <textarea id="${it.id}-ta" rows="4" placeholder="اكتب إجابتك هنا..." class="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed"></textarea>
        <button id="${it.id}-bt" onclick="examCheckEssay('${u}', ${i})" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition">صحّح إجابتي واعرض النموذجية</button>
        <div id="${it.id}-fb" class="hidden"></div></div>`;
  };
  const nm = ex.list.filter(x => x.type === 'mcq').length, ne = ex.list.length - nm;
  const per = {}; ex.list.forEach(it => per[it.lid] = (per[it.lid] || 0) + 1);
  return `<div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 animate-fade-up">
    <div class="space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-700">
      <button onclick="t1ExamBack()" class="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-extrabold">→ رجوع لاختيار الاختبار</button>
      <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">${u === 'term' ? '🎓 اختبار شامل للترم الأول' : '📝 شامل ' + u + ' — ' + T1_EXAM_UNIT_NAME[u]}</h2>
      <p class="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">${u === 'term' ? ex.list.length + ' سؤالًا: ' + nm + ' اختياري + ' + ne + ' مقالي — 20 سؤالًا من كل وحدة من الوحدات الأربع (15 اختياري + 5 مقالي)، موزعة على الدروس (' + Object.keys(per).map(k => k + ': ' + per[k]).join('، ') + '). الأسئلة عشوائية ومرتبة من الأسهل للأصعب في كل قسم.' : ex.list.length + ' سؤالًا: ' + nm + ' موضوعي + ' + ne + ' مقالي، من تقييمات دروس الوحدة (' + Object.keys(per).map(k => k + ': ' + per[k]).join('، ') + '). الأسئلة عشوائية ومرتبة من الأسهل للأصعب في كل قسم.'}</p>
      <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400">المقالي: تُحتسب الإجابة صحيحة إذا غطّت معظم المصطلحات الرئيسية للإجابة النموذجية (تقريبًا 60٪ فأكثر) أو تطابقت 90٪ تقريبًا معها. الإجابة النموذجية تظهر دائمًا. التصحيح تقريبي وليس بديلًا عن المدرس.</p>
      <button onclick="${u === 'term' ? 'showT1TermExam(true)' : 'showT1Exam(' + u + ', true)'}" class="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-extrabold">🔀 اختبار جديد (أسئلة مختلفة)</button>
    </div>
    <div class="text-sm font-extrabold text-blue-900 dark:text-blue-300">القسم الأول: أسئلة موضوعية (${nm})</div>
    ${ex.list.map((it, i) => it.type === 'mcq' ? q(it, i) : '').join('')}
    <div class="text-sm font-extrabold text-blue-900 dark:text-blue-300 pt-2">القسم الثاني: أسئلة مقالية (${ne})</div>
    ${ex.list.map((it, i) => it.type === 'essay' ? q(it, i) : '').join('')}
    <button onclick="examFinish('${u}')" class="w-full p-3.5 rounded-2xl bg-blue-700 hover:bg-blue-600 text-white text-sm font-extrabold">إنهاء الاختبار وعرض النتيجة</button>
    <div id="exam-result" class="hidden p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 space-y-1"></div>
  </div>`;
}


/*************************************************************************
 * اختبار شامل للترم الأول: 80 سؤالًا = 60 اختياري + 20 مقالي
 * 20 سؤالًا من كل وحدة (15 اختياري + 5 مقالي)، موزعة على دروس الوحدة.
 * كل الأسئلة مسحوبة من أسئلة التقييمات الرسمية (T1_ASSESS) دون أي إضافة.
 *************************************************************************/
function t1BuildTermExam() {
  const mcq = [], essay = [];
  const seenQ = new Set();
  const uniq = x => { const k = x.q.replace(/[\s\u064B-\u0652؟?.،:]/g, ''); if (seenQ.has(k)) return false; seenQ.add(k); return true; };
  [1, 2, 3, 4].forEach(u => {
    const lessons = T1_EXAM_UNITS[u];
    const nM = t1Split(15, lessons.length), nE = t1Split(5, lessons.length);
    lessons.forEach((lid, i) => {
      const items = T1_ASSESS[lid] || [];
      const pm = items.filter(x => x.qtype === 'موضوعي' && x.mcq).filter(uniq);
      const pe = items.filter(x => x.qtype !== 'موضوعي' && (x.a || '').trim()).filter(uniq);
      t1ShuffleSample(pm, nM[i]).forEach(x => mcq.push({type: 'mcq', lid, x}));
      t1ShuffleSample(pe, nE[i]).forEach(x => essay.push({type: 'essay', lid, x}));
    });
  });
  mcq.sort((a, b) => t1Diff(a) - t1Diff(b));
  essay.sort((a, b) => t1Diff(a) - t1Diff(b));
  const list = mcq.concat(essay);
  list.forEach((it, i) => it.id = 'exterm-' + i);
  return {u: 'term', list, res: {}, finished: false};
}

function showT1TermExam(fresh) {
  if (fresh || !window.__t1ex['term']) window.__t1ex['term'] = t1BuildTermExam();
  appState.selectedLessonId = 't1-exam-term';
  if (appState.activeTab !== 'lessons') switchTab('lessons');
  renderLessonExplorer();
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function t1ExamBack() {
  switchTab('practice');
  if (typeof switchPracticeSubTab === 'function') switchPracticeSubTab('exam');
  window.scrollTo({top: 0, behavior: 'smooth'});
}
