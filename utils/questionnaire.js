// ── State ──────────────────────────────────────────────────────────────────
let questData   = null;
const answers   = {};          // qid → text
const skipped   = new Set();   // skipped qids
const confirmed = new Set();   // confirmed qids
let currentLang = 'both';
let tocIsOpen   = false;

// ── Language ───────────────────────────────────────────────────────────────
function setLang(mode) {
  currentLang = mode;
  document.body.className = 'lang-' + currentLang;
  document.querySelectorAll('.lang-btn').forEach((b, i) =>
    b.classList.toggle('active', ['both','en','zh'][i] === mode)
  );
}

// ── TOC toggle (mobile) ────────────────────────────────────────────────────
function toggleToc() {
  tocIsOpen = !tocIsOpen;
  document.getElementById('toc-sidebar').classList.toggle('toc-open', tocIsOpen);
  document.getElementById('toc-overlay').classList.toggle('show', tocIsOpen);
}

// ── Question lookup helpers ───────────────────────────────────────────────
function getAllQids() {
  if (!questData) return [];
  const qids = [];
  for (const sec of questData.sections) for (const q of sec.questions) qids.push(q.id);
  for (const q of questData.summary.questions) qids.push(q.id);
  return qids;
}

function findQuestion(qid) {
  if (!questData) return null;
  for (const sec of questData.sections) {
    const q = sec.questions.find(q => q.id === qid);
    if (q) return q;
  }
  return questData.summary.questions.find(q => q.id === qid) || null;
}

// ── Confirm pill enable/disable based on answer presence ─────────────────
function updateConfirmPill(qid) {
  if (skipped.has(qid)) return; // skip handler manages it
  const confirmLabel = document.getElementById('confirm-label-' + qid);
  const confirmHint  = document.getElementById('confirm-hint-' + qid);
  if (!confirmLabel) return;
  const hasAnswer = !!answers[qid];
  if (hasAnswer) {
    confirmLabel.classList.remove('disabled');
    confirmLabel.title = '';
    if (confirmHint) confirmHint.style.display = 'none';
  } else {
    // If answer cleared, also uncheck confirm
    const confirmCb = document.getElementById('confirm-' + qid);
    if (confirmCb && confirmCb.checked) {
      confirmCb.checked = false;
      confirmed.delete(qid);
    }
    confirmLabel.classList.add('disabled');
    confirmLabel.title = 'Write an answer first / 请先填写答案';
    if (confirmHint) confirmHint.style.display = '';
  }
}

// ── Download button enable/disable ────────────────────────────────────────
function updateDownloadBtn() {
  const btn  = document.getElementById('download-btn');
  const hint = document.getElementById('download-hint');
  if (!btn || !questData) return;
  const pending = getAllQids().filter(
    qid => !skipped.has(qid) && !(answers[qid] && confirmed.has(qid))
  );
  if (pending.length === 0) {
    btn.disabled = false;
    if (hint) hint.innerHTML = '';
  } else {
    btn.disabled = true;
    if (hint) hint.innerHTML =
      `<span class="en-only">${pending.length} question${pending.length > 1 ? 's' : ''} still need answer+confirm or skip</span>` +
      `<span class="zh-only">还有 ${pending.length} 道题需作答确认或跳过</span>`;
  }
}

// ── Copy question to clipboard ────────────────────────────────────────────
function copyQuestion(qid) {
  const q = findQuestion(qid);
  if (!q) return;
  const lines = [];
  lines.push(`[${q.id}] ${q.title.en}`);
  lines.push(`[${q.id}] ${q.title.zh}`);
  if (q.context?.en) lines.push('\n' + q.context.en);
  if (q.context?.zh) lines.push(q.context.zh);
  if (q.prompts?.en?.length) {
    lines.push('\nYour response should address:');
    q.prompts.en.forEach(p => lines.push('• ' + p));
  }
  if (q.prompts?.zh?.length) {
    lines.push('\n您的回答应涵盖：');
    q.prompts.zh.forEach(p => lines.push('• ' + p));
  }
  const text = lines.join('\n');
  const doToast = () => showToast('Copied to clipboard! / 已复制到剪贴板');
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(doToast).catch(() => fallbackCopy(text, doToast));
  } else {
    fallbackCopy(text, doToast);
  }
}

function fallbackCopy(text, cb) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); cb(); } catch(e) {}
  document.body.removeChild(ta);
}

// ── localStorage persistence ──────────────────────────────────────────────
const STORAGE_KEY = 'scut-bylaw-q-state';
let saveTimer = null;

function saveState() {
  const respondent = document.getElementById('respondent-name').value;
  const state = {
    respondent,
    answers:   { ...answers },
    skipped:   [...skipped],
    confirmed: [...confirmed]
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) { /* storage full or private browsing — ignore */ }
  // Flash auto-save indicator
  const el = document.getElementById('autosave-status');
  if (el) {
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.classList.remove('show'), 2500);
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 800);
}

// Flush on page unload so debounced saves aren't lost on back/refresh
window.addEventListener('beforeunload', () => {
  clearTimeout(saveTimer);
  saveState();
});

function restoreState() {
  let stored;
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch(e) { return; }
  if (!stored) return;

  // Restore name
  if (stored.respondent) {
    document.getElementById('respondent-name').value = stored.respondent;
  }

  // Restore answers
  if (stored.answers) {
    for (const [qid, val] of Object.entries(stored.answers)) {
      const textarea = document.getElementById('ans-' + qid);
      if (textarea) {
        textarea.value = val;
        answers[qid] = val;
        textarea.classList.add('has-content');
      }
    }
  }

  // Restore skipped
  if (stored.skipped) {
    for (const qid of stored.skipped) {
      const skipCb = document.getElementById('skip-' + qid);
      if (!skipCb) continue;
      skipCb.checked = true;
      skipped.add(qid);
      const textarea = document.getElementById('ans-' + qid);
      if (textarea) { textarea.disabled = true; textarea.classList.remove('has-content'); }
      const confirmLabel = document.getElementById('confirm-label-' + qid);
      if (confirmLabel) confirmLabel.classList.add('disabled');
      const confirmCb = document.getElementById('confirm-' + qid);
      if (confirmCb) { confirmCb.checked = false; }
    }
  }

  // Restore confirmed (only if not skipped)
  if (stored.confirmed) {
    for (const qid of stored.confirmed) {
      if (skipped.has(qid)) continue;
      const confirmCb = document.getElementById('confirm-' + qid);
      if (confirmCb) { confirmCb.checked = true; confirmed.add(qid); }
    }
  }

  // Refresh all visual states
  const allQids = [...document.querySelectorAll('.question-block[data-qid]')]
    .map(el => el.dataset.qid);
  allQids.forEach(qid => { updateTocItem(qid); updateBlockClass(qid); updateConfirmPill(qid); });
  updateProgress();
  updateDownloadBtn();

  // Show restoration banner if there was meaningful state
  if (stored.respondent || stored.skipped?.length || stored.confirmed?.length ||
      Object.keys(stored.answers || {}).length) {
    showRestoreBanner();
  }
}

function showRestoreBanner() {
  const main = document.getElementById('main-content');
  if (!main || document.getElementById('restore-banner')) return;
  const banner = document.createElement('div');
  banner.className = 'restore-banner';
  banner.id = 'restore-banner';
  banner.innerHTML = `
    <div class="restore-banner-text">
      <strong class="en-only">&#x1F4BE; Draft restored</strong>
      <strong class="zh-only">&#x1F4BE; 已恢复上次草稿</strong>
      <span class="en-only"> — Your previous progress was saved and has been restored.</span>
      <span class="zh-only"> — 已自动恢复您上次填写的内容。</span>
    </div>
    <button class="restore-discard-btn" onclick="discardSavedState()">
      <span class="en-only">Discard &amp; start over</span>
      <span class="zh-only">丢弃并重新开始</span>
    </button>`;
  main.insertBefore(banner, main.firstChild);
}

function discardSavedState() {
  document.getElementById('restore-banner')?.remove();
  // Clear without showing a second confirm dialog
  document.querySelectorAll('textarea[data-qid]').forEach(t => {
    t.value = ''; t.classList.remove('has-content'); t.disabled = false;
  });
  document.querySelectorAll('input[type="checkbox"][data-qid]').forEach(c => { c.checked = false; });
  document.querySelectorAll('.question-block').forEach(b =>
    b.classList.remove('is-skipped', 'is-answered', 'is-confirmed')
  );
  document.querySelectorAll('.toc-q-item').forEach(el =>
    el.classList.remove('state-answered', 'state-confirmed', 'state-skipped')
  );
  Object.keys(answers).forEach(k => delete answers[k]);
  skipped.clear();
  confirmed.clear();
  document.getElementById('respondent-name').value = '';
  getAllQids().forEach(qid => updateConfirmPill(qid));
  updateProgress();
  updateDownloadBtn();
  localStorage.removeItem(STORAGE_KEY);
}

// ── Load YAML ─────────────────────────────────────────────────────────────
async function loadQuestionnaire() {
  try {
    const resp = await fetch('questions.yaml');
    if (!resp.ok) throw new Error('Failed to fetch questions.yaml');
    questData = jsyaml.load(await resp.text());
    renderQuestionnaire();
  } catch(e) {
    document.getElementById('main-content').innerHTML =
      `<div class="loading" style="color:#c8102e">
        <p>Error loading questionnaire: ${e.message}</p>
        <p style="margin-top:8px;font-size:0.85rem">Make sure questions.yaml is in the same directory.</p>
      </div>`;
  }
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderQuestionnaire() {
  const main = document.getElementById('main-content');
  main.innerHTML = '';

  for (const section of questData.sections) {
    main.appendChild(renderSection(section));
  }

  const sum = questData.summary;
  const sumCard = document.createElement('div');
  sumCard.className = 'summary-card';
  sumCard.id = 'section-S';
  sumCard.innerHTML = `
    <div class="summary-header">
      <h2>
        <span class="en-only">${sum.title.en}</span>
        <span class="zh-only">${sum.title.zh}</span>
      </h2>
      <div class="section-desc en-only" style="color:rgba(255,255,255,0.75)">${sum.description.en}</div>
      <div class="section-desc zh-only" style="color:rgba(255,255,255,0.75);font-style:italic;margin-top:3px;font-size:0.79rem">${sum.description.zh}</div>
    </div>`;
  for (const q of sum.questions) sumCard.appendChild(renderQuestion(q));
  main.appendChild(sumCard);

  buildToc();
  updateProgress();
  restoreState();
  updateDownloadBtn();
  initIntersectionObserver();
}

function renderSection(section) {
  const card = document.createElement('div');
  card.className = 'section-card';
  card.id = 'section-' + section.id;
  const hasDesc = section.description?.en || section.description?.zh;
  card.innerHTML = `
    <div class="section-header">
      <h2>
        <span class="sec-num">${section.id}</span>
        <span class="en-only">${section.title.en}</span>
        <span class="zh-only">${section.title.zh}</span>
      </h2>
      ${hasDesc ? `
        <div class="section-desc en-only">${section.description.en || ''}</div>
        <div class="section-desc-zh zh-only">${section.description.zh || ''}</div>` : ''}
    </div>`;
  for (const q of section.questions) card.appendChild(renderQuestion(q));
  return card;
}

function renderQuestion(q) {
  const block = document.createElement('div');
  block.className = 'question-block';
  block.id = 'q-' + q.id;
  block.dataset.qid = q.id;

  const hasPromptsEn = q.prompts?.en?.length > 0;
  const hasPromptsZh = q.prompts?.zh?.length > 0;
  const liEn = hasPromptsEn ? q.prompts.en.map(p => `<li>${p}</li>`).join('') : '';
  const liZh = hasPromptsZh ? q.prompts.zh.map(p => `<li>${p}</li>`).join('') : '';

  block.innerHTML = `
    <span class="q-id">${q.id}</span>
    <div class="q-title-en en-only">${q.title.en}</div>
    <div class="q-title-zh zh-only">${q.title.zh}</div>
    ${q.context?.en ? `<div class="q-context-en en-only">${q.context.en}</div>` : ''}
    ${q.context?.zh ? `<div class="q-context-zh zh-only">${q.context.zh}</div>` : ''}
    ${hasPromptsEn ? `
      <div class="prompts prompts-en en-only">
        <div class="prompt-label">Your response should address:</div>
        <ul>${liEn}</ul>
      </div>` : ''}
    ${hasPromptsZh ? `
      <div class="prompts prompts-zh zh-only">
        <div class="prompt-label">您的回答应涵盖：</div>
        <ul>${liZh}</ul>
      </div>` : ''}
    <div class="action-row">
      <label class="pill-label skip-pill" id="skip-label-${q.id}">
        <input type="checkbox" id="skip-${q.id}" data-qid="${q.id}" onchange="onSkipChange(this)" />
        <span class="en-only">⊘ Mark as Skipped</span>
        <span class="zh-only">⊘ 跳过此题</span>
      </label>
      <label class="pill-label confirm-pill disabled" id="confirm-label-${q.id}"
             title="Write an answer first / 请先填写答案">
        <input type="checkbox" id="confirm-${q.id}" data-qid="${q.id}" onchange="onConfirmChange(this)" />
        <span class="en-only">✓ Confirmed</span>
        <span class="zh-only">✓ 已确认</span>
      </label>
      <span class="pill-hint" id="confirm-hint-${q.id}">
        <span class="en-only">Write an answer first</span>
        <span class="zh-only">请先填写答案</span>
      </span>
      <button class="copy-btn" onclick="copyQuestion('${q.id}')"
              title="Copy question text / 复制题目内容">
        <span>📋</span>
        <span class="en-only">Copy</span>
        <span class="zh-only">复制</span>
      </button>
    </div>
    <div class="answer-area">
      <label>
        <span class="en-only">Your Answer:</span>
        <span class="zh-only">您的回答：</span>
      </label>
      <textarea
        id="ans-${q.id}"
        data-qid="${q.id}"
        placeholder="Enter your answer (English or Chinese / 中英文均可)"
        oninput="onAnswerChange(this)"
      ></textarea>
    </div>`;
  return block;
}

// ── Build TOC ──────────────────────────────────────────────────────────────
function buildToc() {
  const list = document.getElementById('toc-list');
  list.innerHTML = '';

  const addSection = (id, titleEn, titleZh, questions) => {
    const label = document.createElement('div');
    label.className = 'toc-section-label';
    label.innerHTML =
      `<span class="en-only">§${id} ${titleEn}</span>` +
      `<span class="zh-only">§${id} ${titleZh}</span>`;
    list.appendChild(label);

    for (const q of questions) {
      const a = document.createElement('a');
      a.className = 'toc-q-item';
      a.dataset.qid = q.id;
      a.href = '#q-' + q.id;
      a.innerHTML = `<span class="toc-dot"></span><span class="toc-qid">${q.id}</span>`;
      a.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('q-' + q.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (tocIsOpen) toggleToc();
      });
      list.appendChild(a);
    }
  };

  for (const section of questData.sections) {
    addSection(section.id, section.title.en, section.title.zh, section.questions);
  }
  addSection('S', questData.summary.title.en, questData.summary.title.zh, questData.summary.questions);
}

// ── Update a single TOC dot ────────────────────────────────────────────────
// Priority: skipped > confirmed > answered > default(red)
function updateTocItem(qid) {
  const el = document.querySelector(`.toc-q-item[data-qid="${qid}"]`);
  if (!el) return;
  el.classList.remove('state-answered', 'state-confirmed', 'state-skipped');
  if (skipped.has(qid)) {
    el.classList.add('state-skipped');
  } else if (confirmed.has(qid)) {
    el.classList.add('state-confirmed');
  } else if (answers[qid]) {
    el.classList.add('state-answered');
  }
}

// ── Update question block background class ─────────────────────────────────
function updateBlockClass(qid) {
  const block = document.getElementById('q-' + qid);
  if (!block) return;
  block.classList.remove('is-skipped', 'is-answered', 'is-confirmed');
  if (skipped.has(qid)) {
    block.classList.add('is-skipped');
  } else if (confirmed.has(qid)) {
    block.classList.add('is-confirmed');
  } else if (answers[qid]) {
    block.classList.add('is-answered');
  }
}

// ── Progress ───────────────────────────────────────────────────────────────
function updateProgress() {
  let total = 0, nConfirmed = 0, nAnswered = 0, nSkipped = 0;
  document.querySelectorAll('textarea[data-qid]').forEach(t => {
    total++;
    const qid = t.dataset.qid;
    if (skipped.has(qid))        nSkipped++;
    else if (confirmed.has(qid)) nConfirmed++;
    else if (answers[qid])       nAnswered++;
  });
  const done = nConfirmed + nAnswered + nSkipped;
  const pct  = total > 0 ? Math.round(done / total * 100) : 0;

  document.getElementById('toc-prog-fill').style.width = pct + '%';
  document.getElementById('toc-prog-label').textContent =
    `${nConfirmed} confirmed · ${nAnswered} answered · ${nSkipped} skipped / ${total}`;

  document.getElementById('mob-prog-fill').style.width = pct + '%';
  document.getElementById('mob-prog-label').textContent = `${done}/${total} (${pct}%)`;
}

// ── Answer change ─────────────────────────────────────────────────────────
function onAnswerChange(textarea) {
  const qid = textarea.dataset.qid;
  const val = textarea.value.trim();
  if (val) {
    answers[qid] = val;
    textarea.classList.add('has-content');
  } else {
    delete answers[qid];
    textarea.classList.remove('has-content');
  }
  updateTocItem(qid);
  updateBlockClass(qid);
  updateProgress();
  updateConfirmPill(qid);
  updateDownloadBtn();
  scheduleSave();
}

// ── Skip change ───────────────────────────────────────────────────────────
function onSkipChange(checkbox) {
  const qid = checkbox.dataset.qid;
  const textarea      = document.getElementById('ans-' + qid);
  const confirmLabel  = document.getElementById('confirm-label-' + qid);
  const confirmCb     = document.getElementById('confirm-' + qid);

  if (checkbox.checked) {
    skipped.add(qid);
    textarea.disabled = true;
    textarea.classList.remove('has-content');
    // Disable and uncheck confirm
    confirmed.delete(qid);
    confirmCb.checked = false;
    confirmLabel.classList.add('disabled');
  } else {
    skipped.delete(qid);
    textarea.disabled = false;
    // Re-evaluate answer state
    if (textarea.value.trim()) {
      answers[qid] = textarea.value.trim();
      textarea.classList.add('has-content');
    }
    updateConfirmPill(qid); // re-enable confirm only if answer exists
  }
  updateTocItem(qid);
  updateBlockClass(qid);
  updateProgress();
  updateDownloadBtn();
  saveState();
}

// ── Confirm change ────────────────────────────────────────────────────────
function onConfirmChange(checkbox) {
  const qid = checkbox.dataset.qid;
  if (checkbox.checked) {
    confirmed.add(qid);
  } else {
    confirmed.delete(qid);
  }
  updateTocItem(qid);
  updateBlockClass(qid);
  updateProgress();
  updateDownloadBtn();
  saveState();
}

// ── IntersectionObserver ──────────────────────────────────────────────────
function initIntersectionObserver() {
  const observer = new IntersectionObserver(entries => {
    let best = null, bestDist = Infinity;
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const rect = entry.boundingClientRect;
        const mid  = (rect.top + rect.bottom) / 2;
        const dist = Math.abs(mid - window.innerHeight / 2);
        if (dist < bestDist) { bestDist = dist; best = entry.target; }
      }
    });
    if (best) setActiveTocItem(best.dataset.qid);
  }, { rootMargin: '-10% 0px -50% 0px', threshold: 0 });

  document.querySelectorAll('.question-block[data-qid]').forEach(el => observer.observe(el));
}

function setActiveTocItem(qid) {
  document.querySelectorAll('.toc-q-item').forEach(el => el.classList.remove('is-active'));
  const item = document.querySelector(`.toc-q-item[data-qid="${qid}"]`);
  if (!item) return;
  item.classList.add('is-active');
  // Scroll TOC list to center this item
  const tocList = document.getElementById('toc-list');
  const targetScroll = item.offsetTop - tocList.clientHeight / 2 + item.offsetHeight / 2;
  tocList.scrollTo({ top: targetScroll, behavior: 'smooth' });
}

// ── Name validation ───────────────────────────────────────────────────────
function clearNameError() {
  document.getElementById('respondent-box').classList.remove('error');
  document.getElementById('name-error').style.display = 'none';
}

function validateName() {
  const name = document.getElementById('respondent-name').value.trim();
  if (!name) {
    document.getElementById('respondent-box').classList.add('error');
    document.getElementById('name-error').style.display = 'block';
    document.getElementById('respondent-name').focus();
    return false;
  }
  clearNameError();
  return true;
}

// ── Clear all ─────────────────────────────────────────────────────────────
function clearAll() {
  if (!confirm('Clear all answers, skips, and confirmations? / 确认清空所有回答、跳过和确认标记？')) return;

  document.querySelectorAll('textarea[data-qid]').forEach(t => {
    t.value = ''; t.classList.remove('has-content'); t.disabled = false;
  });
  document.querySelectorAll('input[type="checkbox"][data-qid]').forEach(c => {
    c.checked = false;
  });
  document.querySelectorAll('.confirm-pill').forEach(l => l.classList.remove('disabled'));
  document.querySelectorAll('.question-block').forEach(b =>
    b.classList.remove('is-skipped', 'is-answered', 'is-confirmed')
  );

  Object.keys(answers).forEach(k => delete answers[k]);
  skipped.clear();
  confirmed.clear();

  document.querySelectorAll('.toc-q-item').forEach(el =>
    el.classList.remove('state-answered', 'state-confirmed', 'state-skipped')
  );
  // Reset confirm pills to disabled (no answer)
  getAllQids().forEach(qid => updateConfirmPill(qid));
  updateProgress();
  updateDownloadBtn();
  localStorage.removeItem(STORAGE_KEY);
}

// ── Download answers ──────────────────────────────────────────────────────
function downloadAnswers() {
  if (!validateName()) {
    document.getElementById('respondent-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (Object.keys(answers).length === 0 && skipped.size === 0 && confirmed.size === 0) {
    showToast('Please answer at least one question. / 请至少填写一道题。');
    return;
  }

  const respondent = document.getElementById('respondent-name').value.trim();
  const now = new Date().toISOString();

  const output = {
    meta: { respondent, timestamp: now, questionnaire: questData.meta.title.en },
    answers:   {},
    confirmed: [],
    skipped:   []
  };

  const allSections = [...questData.sections, { questions: questData.summary.questions }];
  for (const section of allSections) {
    for (const q of section.questions) {
      if (answers[q.id]    !== undefined) output.answers[q.id] = answers[q.id];
      if (confirmed.has(q.id))            output.confirmed.push(q.id);
      if (skipped.has(q.id))              output.skipped.push(q.id);
    }
  }

  const yamlStr = jsyaml.dump(output, { lineWidth: 100, indent: 2 });
  const blob = new Blob([yamlStr], { type: 'text/yaml' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  const safeName = respondent.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 30);
  a.download = `answers_${safeName}_${now.substring(0,10)}.yaml`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Downloaded! / 下载完成！');
}

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

loadQuestionnaire();
