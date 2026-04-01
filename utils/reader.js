// ── State ──────────────────────────────────────────────────────────────────
let questData = null;      // questions.yaml data
let loadedAnswers = [];    // [{filename, data}]
let allQuestions = [];     // flat list of {sectionId, sectionTitleEn, sectionTitleZh, q}

// ── Language ───────────────────────────────────────────────────────────────
function setLang(mode) {
  document.body.className = 'lang-' + mode;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  const idx = ['both','en','zh'].indexOf(mode);
  document.querySelectorAll('.lang-btn')[idx].classList.add('active');
}

// ── Load questionnaire structure ───────────────────────────────────────────
async function loadQuestionStructure() {
  try {
    const resp = await fetch('questions.yaml');
    if (!resp.ok) throw new Error('questions.yaml not found');
    const text = await resp.text();
    questData = jsyaml.load(text);
    buildQuestionIndex();
  } catch(e) {
    console.warn('Could not load questions.yaml:', e.message);
    // Will fall back to rendering with only the question IDs from answers
  }
}

function buildQuestionIndex() {
  allQuestions = [];
  for (const section of questData.sections) {
    for (const q of section.questions) {
      allQuestions.push({
        sectionId: section.id,
        sectionTitleEn: section.title.en,
        sectionTitleZh: section.title.zh,
        q
      });
    }
  }
  for (const q of questData.summary.questions) {
    allQuestions.push({
      sectionId: 'S',
      sectionTitleEn: questData.summary.title.en,
      sectionTitleZh: questData.summary.title.zh,
      q
    });
  }
}

// ── File handling ──────────────────────────────────────────────────────────
const dropArea = document.getElementById('drop-area');
dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('drag-over'); });
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
dropArea.addEventListener('drop', e => {
  e.preventDefault();
  dropArea.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
  const toLoad = Array.from(files).filter(f =>
    f.name.endsWith('.yaml') || f.name.endsWith('.yml')
  );
  let pending = toLoad.length;
  if (!pending) return;

  toLoad.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = jsyaml.load(e.target.result);
        // Check it's an answer file (has answers key)
        if (!data || typeof data.answers !== 'object') {
          console.warn(file.name, 'does not look like an answer file');
        }
        // Avoid duplicates by filename
        if (!loadedAnswers.find(a => a.filename === file.name)) {
          loadedAnswers.push({ filename: file.name, data });
        }
      } catch(err) {
        console.error('Parse error in', file.name, err);
      }
      if (--pending === 0) {
        renderFileList();
        renderResults();
      }
    };
    reader.readAsText(file);
  });
}

function removeFile(filename) {
  loadedAnswers = loadedAnswers.filter(a => a.filename !== filename);
  renderFileList();
  renderResults();
}

function clearAll() {
  loadedAnswers = [];
  renderFileList();
  renderResults();
}

function renderFileList() {
  const list = document.getElementById('file-list');
  list.innerHTML = '';
  loadedAnswers.forEach(({ filename, data }) => {
    const respondent = data?.meta?.respondent || 'Anonymous';
    const ts = data?.meta?.timestamp ? new Date(data.meta.timestamp).toLocaleDateString() : '';
    const tag = document.createElement('div');
    tag.className = 'file-tag';
    tag.innerHTML = `
      <span class="fname">${filename}</span>
      <span class="respondent">${respondent}</span>
      ${ts ? `<span class="answer-date">${ts}</span>` : ''}
      <button class="remove-btn" onclick="removeFile('${filename.replace(/'/g,"\\'")}')">✕</button>`;
    list.appendChild(tag);
  });

  const n = loadedAnswers.length;
  document.getElementById('status-count').innerHTML = n > 0
    ? `<strong>${n}</strong> file${n !== 1 ? 's' : ''} loaded / 已加载 <strong>${n}</strong> 份答卷`
    : '';
  document.getElementById('clear-btn').style.display = n > 0 ? '' : 'none';
}

// ── Render Results ─────────────────────────────────────────────────────────
function renderResults() {
  const results = document.getElementById('results');
  const statsPanel = document.getElementById('stats-panel');
  const filterBar = document.getElementById('filter-bar');
  const jumpNav = document.getElementById('jump-nav');

  if (loadedAnswers.length === 0) {
    results.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="en-only">Load one or more answer files to see results.</div>
      <div class="zh-only">请加载一个或多个答卷文件以查看汇总结果。</div>
    </div>`;
    statsPanel.style.display = 'none';
    filterBar.style.display = 'none';
    jumpNav.style.display = 'none';
    return;
  }

  // Show controls
  statsPanel.style.display = '';
  filterBar.style.display = '';
  jumpNav.style.display = '';

  // Collect all QIDs answered across all files
  const allQids = new Set();
  loadedAnswers.forEach(({ data }) => {
    if (data?.answers) Object.keys(data.answers).forEach(k => allQids.add(k));
  });

  // Compute stats
  let totalAnswered = 0;
  allQids.forEach(() => {});
  const answeredCounts = {};
  if (questData) {
    allQuestions.forEach(({ q }) => {
      const count = loadedAnswers.filter(({ data }) =>
        data?.answers?.[q.id] && data.answers[q.id].trim()
      ).length;
      if (count > 0) totalAnswered++;
      answeredCounts[q.id] = count;
    });
  }

  const totalQ = questData ? allQuestions.length : allQids.size;
  const respondents = loadedAnswers.length;
  const avgAnswered = respondents > 0
    ? Math.round(loadedAnswers.reduce((sum, { data }) =>
        sum + (data?.answers ? Object.keys(data.answers).filter(k => data.answers[k]?.trim()).length : 0)
      , 0) / respondents)
    : 0;

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card">
      <div class="stat-num">${respondents}</div>
      <div class="stat-label en-only">Respondents</div>
      <div class="stat-label zh-only">参与人数</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${totalQ}</div>
      <div class="stat-label en-only">Total Questions</div>
      <div class="stat-label zh-only">问题总数</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${totalAnswered}</div>
      <div class="stat-label en-only">Questions with ≥1 Answer</div>
      <div class="stat-label zh-only">有回答的问题数</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${avgAnswered}</div>
      <div class="stat-label en-only">Avg answers per person</div>
      <div class="stat-label zh-only">人均回答题数</div>
    </div>`;

  // Build main content
  results.innerHTML = '';

  if (!questData) {
    // Fallback: no question structure, just show raw answers by QID
    renderRawAnswers(results, allQids);
    return;
  }

  // Build jump nav
  const navInner = document.getElementById('jump-nav-inner');
  navInner.innerHTML = '';
  const sectionIds = [...new Set(allQuestions.map(q => q.sectionId))];
  sectionIds.forEach(sid => {
    const info = allQuestions.find(q => q.sectionId === sid);
    const a = document.createElement('a');
    a.href = '#section-' + sid;
    a.textContent = sid === 'S'
      ? 'Summary / 总结'
      : `§${sid} ${info.sectionTitleEn.split(' ').slice(0,2).join(' ')}`;
    navInner.appendChild(a);
  });

  // Group questions by section
  const sections = {};
  allQuestions.forEach(item => {
    if (!sections[item.sectionId]) {
      sections[item.sectionId] = {
        titleEn: item.sectionTitleEn,
        titleZh: item.sectionTitleZh,
        questions: []
      };
    }
    sections[item.sectionId].questions.push(item.q);
  });

  Object.entries(sections).forEach(([sectionId, section]) => {
    const card = document.createElement('div');
    card.className = 'section-card';
    card.id = 'section-' + sectionId;

    const header = document.createElement('div');
    header.className = 'section-header section-toggle';
    header.innerHTML = `
      <div class="sec-num">${sectionId === 'S' ? '★' : sectionId}</div>
      <div class="sec-title">
        <span class="en-only">${section.titleEn}</span>
        <span class="zh-only">${section.titleZh}</span>
      </div>`;
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'section-body';

    section.questions.forEach(q => {
      const qAnswers = loadedAnswers
        .filter(({ data }) => data?.answers?.[q.id] && data.answers[q.id].trim())
        .map(({ data }) => ({
          respondent: data?.meta?.respondent || 'Anonymous',
          timestamp:  data?.meta?.timestamp  || '',
          text:       data.answers[q.id],
          isConfirmed: Array.isArray(data?.confirmed) && data.confirmed.includes(q.id)
        }));

      const qSkipped = loadedAnswers
        .filter(({ data }) => Array.isArray(data?.skipped) && data.skipped.includes(q.id))
        .map(({ data }) => ({ respondent: data?.meta?.respondent || 'Anonymous' }));

      const qBlock = document.createElement('div');
      qBlock.className = 'question-block ' + (qAnswers.length > 0 ? 'q-answered' : 'q-unanswered');
      qBlock.dataset.qid = q.id;
      qBlock.dataset.searchtext = [
        q.id, q.title.en, q.title.zh,
        q.context?.en || '', q.context?.zh || '',
        ...qAnswers.map(a => a.text)
      ].join(' ').toLowerCase();

      const hasContextEn = q.context?.en && q.context.en.trim();
      const hasContextZh = q.context?.zh && q.context.zh.trim();
      const nConfirmed   = qAnswers.filter(a => a.isConfirmed).length;

      qBlock.innerHTML = `
        <div class="question-header">
          <div>
            <span class="q-id-badge">${q.id}</span>
            <span class="q-title en-only">${q.title.en}</span>
            <span class="q-title zh-only">${q.title.zh}</span>
          </div>
          ${hasContextEn ? `<div class="q-context-en en-only">${q.context.en}</div>` : ''}
          ${hasContextZh ? `<div class="q-context-zh zh-only">${q.context.zh}</div>` : ''}
        </div>
        <div class="answers-container">
          <div class="answer-count-bar">
            <span class="answered-badge">${qAnswers.length} / ${loadedAnswers.length}
              <span class="en-only">answered</span><span class="zh-only">人作答</span>
            </span>
            ${nConfirmed > 0 ? `<span class="answered-badge" style="background:#e8f5e9;color:#2e7d32;border:1px solid #81c784">
              ${nConfirmed} <span class="en-only">confirmed</span><span class="zh-only">已确认</span>
            </span>` : ''}
            ${qSkipped.length > 0 ? `<span class="answered-badge" style="background:#fff3cd;color:#b45309;border:1px solid #e8c97a">
              ${qSkipped.length} <span class="en-only">skipped</span><span class="zh-only">已跳过</span>
            </span>` : ''}
            ${qAnswers.length === 0 && qSkipped.length === 0
              ? `<span class="not-answered-badge en-only">No answers yet</span>
                 <span class="not-answered-badge zh-only">暂无回答</span>` : ''}
          </div>
          ${qAnswers.map(a => `
              <div class="answer-card" style="${a.isConfirmed ? 'border-color:#81c784;background:#f1faf1' : ''}">
                <div class="answer-card-header" style="${a.isConfirmed ? 'background:#e8f5e9' : ''}">
                  <span class="respondent-name" style="${a.isConfirmed ? 'color:#2e7d32' : ''}">${escHtml(a.respondent)}</span>
                  <span style="display:flex;align-items:center;gap:6px">
                    ${a.isConfirmed ? `<span style="font-size:0.7rem;font-weight:600;color:#2e7d32">
                      ✓ <span class="en-only">Confirmed</span><span class="zh-only">已确认</span>
                    </span>` : ''}
                    ${a.timestamp ? `<span class="answer-date">${new Date(a.timestamp).toLocaleDateString()}</span>` : ''}
                  </span>
                </div>
                <div class="answer-text">${escHtml(a.text)}</div>
              </div>`).join('')}
          ${qSkipped.map(a => `
              <div class="answer-card" style="border-color:#e8c97a;background:#fffbf0">
                <div class="answer-card-header" style="background:#fff3cd">
                  <span class="respondent-name" style="color:#b45309">${escHtml(a.respondent)}</span>
                  <span style="font-size:0.72rem;color:#b45309;font-style:italic">
                    ⊘ <span class="en-only">Skipped</span><span class="zh-only">已跳过</span>
                  </span>
                </div>
              </div>`).join('')}
          ${qAnswers.length === 0 && qSkipped.length === 0
            ? `<div class="no-answer en-only">No one answered this question yet.</div>
               <div class="no-answer zh-only">暂无人回答此题。</div>` : ''}
        </div>`;

      body.appendChild(qBlock);
    });

    // Section collapse toggle
    header.addEventListener('click', () => {
      header.classList.toggle('collapsed');
      body.classList.toggle('collapsed');
    });

    card.appendChild(body);
    results.appendChild(card);
  });

  applyFilter();
}

function renderRawAnswers(container, allQids) {
  // No questions.yaml — just show raw QID → answers
  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `<div class="section-header"><div class="sec-title">All Answers (raw) / 全部回答</div></div>`;
  const body = document.createElement('div');

  [...allQids].sort().forEach(qid => {
    const qAnswers = loadedAnswers
      .filter(({ data }) => data?.answers?.[qid] && data.answers[qid].trim())
      .map(({ data }) => ({
        respondent: data?.meta?.respondent || 'Anonymous',
        timestamp: data?.meta?.timestamp || '',
        text: data.answers[qid]
      }));

    const qBlock = document.createElement('div');
    qBlock.className = 'question-block';
    qBlock.innerHTML = `
      <div class="question-header">
        <span class="q-id-badge">${qid}</span>
      </div>
      <div class="answers-container">
        <div class="answer-count-bar">
          <span class="answered-badge">${qAnswers.length} answered</span>
        </div>
        ${qAnswers.map(a => `
          <div class="answer-card">
            <div class="answer-card-header">
              <span class="respondent-name">${escHtml(a.respondent)}</span>
              ${a.timestamp ? `<span class="answer-date">${new Date(a.timestamp).toLocaleDateString()}</span>` : ''}
            </div>
            <div class="answer-text">${escHtml(a.text)}</div>
          </div>`).join('')}
      </div>`;
    body.appendChild(qBlock);
  });

  card.appendChild(body);
  container.appendChild(card);
}

// ── Filter ─────────────────────────────────────────────────────────────────
function applyFilter() {
  const mode = document.getElementById('filter-mode').value;
  const search = document.getElementById('search-box').value.toLowerCase().trim();

  document.querySelectorAll('.question-block[data-qid]').forEach(block => {
    const hasAnswers = block.classList.contains('q-answered');
    let show = true;

    if (mode === 'answered' && !hasAnswers) show = false;
    if (mode === 'unanswered' && hasAnswers) show = false;

    if (show && search) {
      const searchText = block.dataset.searchtext || '';
      if (!searchText.includes(search)) show = false;
    }

    block.style.display = show ? '' : 'none';
  });

  // Hide section cards if all questions hidden
  document.querySelectorAll('.section-card').forEach(card => {
    const visible = [...card.querySelectorAll('.question-block[data-qid]')]
      .some(b => b.style.display !== 'none');
    card.style.display = visible ? '' : 'none';
  });
}

// ── Utilities ──────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ───────────────────────────────────────────────────────────────────
loadQuestionStructure();
