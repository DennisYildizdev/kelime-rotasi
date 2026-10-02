import { createSession, recordAnswer, advanceSession } from './learning-engine.js';
import { createStorage, exportState, importState } from './storage.js';
import { createExercise, checkExerciseAnswer, searchWords } from './exercises.js';
import { joinContent, getPronunciation, CONTENT_VERSION } from './content.js';
import { createSpeechController } from './speech.js';

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
let storageWarning = '';
const store = createStorage({ contentVersion: CONTENT_VERSION, onWarning: message => { storageWarning = message; showStorageWarning(); } });
let user = store.load();
const state = { words: [], enriched: [], ipa: [], route: 'home', search: { query: '', level: '', topic: '', mark: '', page: 1 }, speechStatus: '' };
const speech = createSpeechController({ notify, onStatus: status => { state.speechStatus = status.message || ''; const node = document.querySelector('#speechStatus'); if (node) node.textContent = state.speechStatus; } });
const preferences = () => user.preferences;
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]); }
function notify(message) {
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove('show'), 4000);
}
function showStorageWarning() {
  let warning = document.querySelector('#storageWarning');
  if (!warning) { warning = document.createElement('div'); warning.id = 'storageWarning'; warning.className = 'gentle-note storage-warning'; warning.setAttribute('role', 'status'); app.before(warning); }
  warning.textContent = storageWarning; warning.hidden = !storageWarning;
}
function persist() { store.save(user); showStorageWarning(); }
function updatePreferences(changes) { user = { ...user, preferences: { ...preferences(), ...changes } }; persist(); applyPreferences(); }
function applyPreferences() {
  document.body.classList.toggle('calm', preferences().calm);
  document.querySelector('#soundToggle').textContent = preferences().sound ? 'Ses açık' : 'Ses kapalı';
  document.querySelector('#soundToggle').setAttribute('aria-pressed', String(preferences().sound));
  document.querySelector('#calmToggle').setAttribute('aria-pressed', String(preferences().calm));
}
async function speak(text, rate = 0.85, listening = false) {
  const sessionId = user.session?.sessionId, questionId = currentQuestion()?.id;
  const result = await speech.speak(text, { lang: preferences().accent, rate, enabled: preferences().sound });
  if (!result.ok && !['cancelled', 'disposed'].includes(result.reason) && listening && state.route === 'lesson' && user.session?.sessionId === sessionId && currentQuestion()?.id === questionId && !user.session.answered) {
    patchSession({ listeningFallback: true }); render();
  }
}
function setRoute(route) {
  speech.cancel(); state.route = route;
  document.querySelectorAll('[data-route]').forEach(button => button.classList.toggle('active', button.dataset.route === route));
  render(); app.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: preferences().calm ? 'auto' : 'smooth' });
}
function patchSession(changes) { user = { ...user, session: { ...user.session, ...changes, updatedAt: Date.now() } }; persist(); }
function currentQuestion() { return user.session?.questions[user.session.currentIndex]; }
function currentWord() { return state.enriched.find(w => w.id === currentQuestion()?.wordId); }
function currentExercise() { return createExercise(currentWord(), state.enriched.filter(w => w.level === user.session.level), { ...currentQuestion(), listeningFallback: user.session.listeningFallback }); }
function pronunciation(word) {
  const p = getPronunciation(word, preferences().accent) || {};
  const accent = preferences().accent === 'en-US' ? 'ABD' : 'BK';
  return `${preferences().showIpa ? `<div class="ipa">IPA (${accent}): ${escapeHtml(p.ipa || 'Bu aksan için hazırlanıyor')}</div>` : ''}${preferences().showApprox ? `<div class="approx">Türkçe yaklaşık okunuş (${accent}): ${escapeHtml(p.approxTr || 'Bu aksan için hazırlanıyor')}</div>` : ''}`;
}
function audioControls(word, listening = false) {
  return `<div class="audio-controls"><button class="speak-button" data-speak="${escapeHtml(word.speechText || word.displayWord || word.word)}" ${listening ? 'data-listening="true"' : ''}>${listening ? 'Soruyu dinle' : 'Telaffuzu dinle'}</button><button class="speak-button" data-speak="${escapeHtml(word.speechText || word.displayWord || word.word)}" data-rate="0.6" ${listening ? 'data-listening="true"' : ''}>Yavaş dinle</button></div>`;
}
function settingsView() {
  const p = preferences();
  return `<details id="preferences" class="preferences"><summary>Görünüm, ses ve ders tercihleri</summary><div class="preferences-grid">
    <label><input id="showIpa" type="checkbox" ${p.showIpa ? 'checked' : ''}> IPA göster</label>
    <label><input id="showApprox" type="checkbox" ${p.showApprox ? 'checked' : ''}> Türkçe yaklaşık okunuş göster</label>
    <label><input id="introductions" type="checkbox" ${p.introductions ? 'checked' : ''}> Yeni kelimeyi sorudan önce tanıt</label>
    <div class="field"><label for="accentSelect">Ses ve transkripsiyon aksanı</label><select id="accentSelect"><option value="en-US" ${p.accent === 'en-US' ? 'selected' : ''}>Amerikan İngilizcesi (en-US)</option><option value="en-GB" ${p.accent === 'en-GB' ? 'selected' : ''}>İngiliz İngilizcesi (en-GB)</option></select></div>
    <div class="field"><label for="exerciseSelect">Alıştırma</label><select id="exerciseSelect">${Object.entries({ mixed: 'Karışık', meaning: 'Kelime → anlam', reverse: 'Anlam → kelime', spelling: 'Yazma', listening: 'Dinleme', context: 'Cümlede boşluk' }).map(([value, label]) => `<option value="${value}" ${p.exercise === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
    <p class="content-note">Yaklaşık okunuş IPA'nın yerine geçmez; telaffuz puanlaması değildir. Cihazında seçilen aksan yoksa ses yerine metinle devam edebilirsin. Çevrimdışı ses garantisi yoktur.</p>
  </div></details>`;
}
function homeView() {
  const p = preferences();
  const studied = Object.values(user.progress).filter(v => v.attempts || v.dueAt).length;
  const resume = user.session && !user.session.completed;
  const levelCounts = Object.fromEntries(['A1', 'A2', 'B1', 'B2'].map(level => [
    level, state.enriched.filter(word => word.level === level).length
  ]));
  const levelButtons = ['A1', 'A2', 'B1', 'B2'].map(level => {
    const available = levelCounts[level] > 0;
    const selected = p.level === level;
    return `<button type="button" class="level-choice ${selected ? 'selected' : ''}" data-level="${level}" role="radio" aria-checked="${selected}" tabindex="${selected ? '0' : '-1'}" ${available ? '' : 'disabled'}><strong>${level}</strong><small>${available ? `${levelCounts[level]} kart` : 'hazırlanıyor'}</small></button>`;
  }).join('');
  return `<section class="hero"><p class="eyebrow">ADHD dostu İngilizce</p><h1>Başlamak küçük olsun.</h1><p class="lead">Günlük İngilizce kelimelerinden kısa dersler, IPA telaffuzu ve baskı oluşturmayan tekrarlar. Bugün bir kelime bile yeter.</p><div class="gentle-note">Seri kaybetme yok · istediğin zaman devam et</div></section>
  <section class="panel"><p class="eyebrow">Bugünkü enerjin</p><div class="mode-grid" role="radiogroup" aria-label="Ders yoğunluğu">${modeCard('tiny', '1', 'Mini başlangıç', 'Yaklaşık 60 saniye')}${modeCard('focus', '5', 'Odak dersi', 'Dengeli mikro seans')}${modeCard('challenge', '10', 'Meydan okuma', 'En fazla 5 yeni kelime')}</div>
  <div class="level-field" style="margin-top:18px"><span id="levelLabel" class="field-label">Seviye</span><div class="level-choices" role="radiogroup" aria-labelledby="levelLabel">${levelButtons}</div></div>
  <div class="controls-row lesson-start-row"><div class="lesson-count"><span>Ders içeriği</span><strong id="lessonContentCount">${levelCounts[p.level]} kelime</strong></div><button id="startLesson" class="primary">${resume ? 'Yeni ders' : 'Derse başla'}</button></div>
  ${resume ? `<div class="lesson-actions"><button id="resumeLesson" class="primary">Kaldığın yerden devam et (${user.session.currentIndex + 1}/${user.session.questions.length})</button></div>` : ''}
  ${settingsView()}<p class="content-note">${state.enriched.length} taslak ders kartı · ${state.enriched.filter(w => w.reviewStatus === 'reviewed').length} editoryal incelenmiş kart. A1 kaynak envanterinin tamamı derslere açıktır; dilbilimsel ve editoryal insan incelemesi bekliyor.</p></section>
  <div class="section-title"><h2>Öğrenme rotası</h2><span>${studied} kelime çalışıldı</span></div><div class="path">${['A1', 'A2', 'B1', 'B2'].map((level, i) => pathRow(level, ['Temel günlük dil', 'Günlük iletişim', 'Bağımsız kullanım', 'İleri kelimeler'][i])).join('')}</div>`;
}
function modeCard(mode, symbol, title, detail) { return `<button class="mode-card ${preferences().mode === mode ? 'selected' : ''}" data-mode="${mode}" role="radio" aria-checked="${preferences().mode === mode}"><span class="mode-symbol">${symbol}</span><strong>${title}</strong><small>${detail}</small></button>`; }
function pathRow(level, label) {
  const total = state.words.filter(w => w.level === level).length;
  const available = state.enriched.filter(w => w.level === level);
  const studied = available.filter(w => user.progress[w.id]?.dueAt).length;
  const percent = available.length ? Math.round(studied / available.length * 100) : 0;
  return `<div class="path-row"><div class="level-badge">${level}</div><div class="path-copy"><strong>${label}</strong><small>${total} kaynak kelime · ${available.length} ders kartı</small></div><div class="progress-mini" title="%${percent} çalışıldı"><span style="width:${percent}%"></span></div></div>`;
}
function startLesson(reviewOnly = false) {
  if (user.session && !user.session.completed && !confirm('Kaydedilmiş seans yerine yeni ders açılsın mı? Yanıtlanmış kelimelerin ilerlemesi korunur.')) return;
  const session = createSession(state.enriched, { ...preferences(), progress: user.progress, contentVersion: CONTENT_VERSION, reviewOnly });
  if (!session.questions.length) { notify(reviewOnly ? 'Şu anda zamanı gelen tekrar yok.' : 'Bu seviyede uygun yeni kart veya zamanı gelen tekrar yok. Başka seviye seçebilir ya da sonra dönebilirsin.'); return; }
  user = { ...user, session }; persist(); setRoute('lesson');
}
function wordDetails(word, includePronunciation = true) {
  return `<strong>${escapeHtml(word.word)} — ${escapeHtml(word.translation)}</strong>${includePronunciation ? pronunciation(word) : ''}<p>${escapeHtml(word.example)}<br><small>${escapeHtml(word.exampleTr)}</small></p>${word.contentNote ? `<p class="content-note">${escapeHtml(word.contentNote)}</p>` : ''}<small>${escapeHtml(word.partOfSpeech)} · ${escapeHtml(word.level)} · Taslak içerik / editoryal inceleme bekliyor</small>`;
}
function markControls(word) {
  const mark = user.progress[word.id]?.mark || '';
  return `<div class="field word-mark"><label for="mark-${escapeHtml(word.id)}">Kişisel işaret</label><select id="mark-${escapeHtml(word.id)}" data-mark-id="${escapeHtml(word.id)}">${Object.entries({ '': 'İşaret yok', known: 'Biliyorum', learning: 'Öğreniyorum', difficult: 'Zor' }).map(([value, label]) => `<option value="${value}" ${mark === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div>`;
}
function lessonView() {
  const s = user.session;
  if (!s) return homeView();
  if (s.completed) return completeView();
  const word = currentWord();
  if (!word) return '<section class="panel"><h2>Kaydedilmiş kart bu içerik paketinde bulunamadı.</h2><p>İlerleme silinmedi. Ana sayfadan yeni ders açabilirsin.</p><button id="exitLesson" class="secondary">Ana sayfa</button></section>';
  const q = currentQuestion(), ex = currentExercise();
  const intro = q.intro && !s.introDismissed && !s.answered;
  const head = `<div class="lesson-head"><button id="exitLesson" class="close-button" aria-label="Dersi kapat">×</button><div class="progress-track"><span style="width:${s.currentIndex / s.questions.length * 100}%"></span></div><div class="counter">${s.currentIndex + 1}/${s.questions.length}</div></div>`;
  if (intro) return `<section class="lesson-wrap">${head}<article class="panel lesson-card"><p class="prompt">Kısa tanıtım · istediğin zaman geç</p><div class="word-display">${escapeHtml(word.word)}</div><div class="feedback">${wordDetails(word)}</div>${audioControls(word)}<div class="lesson-actions"><button id="introContinue" class="primary">Soruya geç</button></div></article></section>`;
  return `<section class="lesson-wrap">${head}<article class="panel lesson-card" data-exercise="${ex.type}"><p class="prompt">${ex.label}</p><div class="word-display ${ex.type === 'context' ? 'context-prompt' : ''}">${escapeHtml(ex.prompt)}</div>
    ${ex.type === 'meaning' || s.answered ? pronunciation(word) : ''}
    <div class="word-meta">${escapeHtml(word.partOfSpeech)} · ${escapeHtml(word.level)}</div>
    ${ex.type === 'meaning' || ex.type === 'listening' || s.answered ? audioControls(word, ex.type === 'listening') : ''}
    ${ex.note ? `<p class="content-note">${escapeHtml(ex.note)}</p>` : ''}
    ${ex.type === 'listening' && !s.answered ? '<button id="listeningFallback" class="secondary fallback-button">Ses kullanamıyorum · metinle devam et</button>' : ''}
    <div id="speechStatus" class="content-note" role="status">${escapeHtml(state.speechStatus)}</div>
    ${ex.typed ? `<form id="answerForm" class="typed-form"><label for="typedAnswer">İngilizce yanıt</label><input id="typedAnswer" name="answer" maxlength="200" autocomplete="off" autocapitalize="none" spellcheck="false" value="${escapeHtml(s.selectedAnswer)}" ${s.answered ? 'disabled' : ''}><div class="lesson-actions"><button id="showHint" type="button" class="secondary" ${s.answered || s.hintUsed ? 'disabled' : ''}>İpucu</button><button id="submitAnswer" class="primary" ${s.answered ? 'disabled' : ''}>Kontrol et</button></div>${s.hintUsed ? `<p class="content-note">İpucu: ${escapeHtml(word.word.charAt(0))}${' _'.repeat(Math.min(word.word.length - 1, 30))} · İpuçlu yanıt daha erken tekrar edilir.</p>` : ''}</form>` : `<div class="answers">${ex.choices.map(choice => `<button class="answer-button ${s.answered && choice === ex.expected ? 'correct' : s.answered && choice === s.selectedAnswer ? 'wrong' : ''}" data-answer="${escapeHtml(choice)}" ${s.answered ? 'disabled' : ''}>${escapeHtml(choice)}</button>`).join('')}</div>`}
    ${s.answered ? `<div class="feedback" role="status"><strong>${s.correct ? (s.hintUsed ? 'İpucuyla doğru — tekrar ederek pekiştirelim.' : 'Doğru — iyi yakaladın.') : `Doğru cevap: ${escapeHtml(ex.expected)}`}</strong>${wordDetails(word, false)}</div>${markControls(word)}<div class="lesson-actions"><button id="pauseLesson" class="secondary">Burada bırak</button><button id="nextQuestion" class="primary">Devam et</button></div>` : ''}
    </article></section>`;
}
function answerQuestion(answer) {
  if (!user.session || user.session.answered || user.session.completed) return;
  if (!answer.trim()) { notify('Yanıtını yazabilir veya ipucu alabilirsin.'); return; }
  speech.cancel(); user = recordAnswer(user, { answer, correct: checkExerciseAnswer(currentExercise(), answer) }); persist(); render();
}
function completeView() {
  const s = user.session;
  const worked = [...new Set(s.questions.map(q => q.wordId))].map(id => state.enriched.find(w => w.id === id)?.word).filter(Boolean);
  return `<section class="panel complete"><div class="complete-mark">✓</div><p class="eyebrow">Seans tamamlandı</p><h2>${s.score}/${s.questions.length} doğru</h2><p>Kısa bir çalışma da gerçek ilerlemedir. Burada durabilir veya yeni bir mikro ders açabilirsin.</p><p>Çalışılanlar: ${worked.map(escapeHtml).join(', ')}. Tek doğru yanıt kalıcı öğrenme anlamına gelmez.</p><button id="finishLesson" class="primary">Ana sayfaya dön</button></section>`;
}
function wordsView() {
  return `<section class="hero"><p class="eyebrow">Kelime kütüphanesi</p><h2>Öğrenmek istediğin kelimeler</h2><p class="lead">${state.words.length} kayıt. ${state.enriched.length} taslak ders kartı; ${state.enriched.filter(w => w.reviewStatus === 'reviewed').length} editoryal incelenmiş kart. Kaynak listesi ve ders içeriği ayrı kapsamlardır.</p></section><div class="search-bar"><label class="sr-only" for="wordSearch">İngilizce veya Türkçe kelime ara</label><input id="wordSearch" type="search" placeholder="İngilizce veya Türkçe ara…" value="${escapeHtml(state.search.query)}" autocomplete="off"></div><details class="panel library-filters"><summary>Seviye, konu ve kişisel işaret filtreleri</summary><div class="preferences-grid">${searchFilter('filterLevel', 'Seviye', ['', 'A1', 'A2', 'B1', 'B2'], state.search.level)}${searchFilter('filterTopic', 'Konu', ['', ...new Set(state.words.flatMap(w => w.topicTags || []))].sort(), state.search.topic)}<div class="field"><label for="filterMark">Kişisel işaret</label><select id="filterMark">${Object.entries({ '': 'Tümü', known: 'Biliyorum', learning: 'Öğreniyorum', difficult: 'Zor' }).map(([v, l]) => `<option value="${v}" ${state.search.mark === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div></details><div id="libraryResults">${libraryResults()}</div>`;
}
function searchFilter(id, label, values, selected) { return `<div class="field"><label for="${id}">${label}</label><select id="${id}">${values.map(v => `<option value="${escapeHtml(v)}" ${selected === v ? 'selected' : ''}>${escapeHtml(v || 'Tümü')}</option>`).join('')}</select></div>`; }
function libraryResults() {
  const result = searchWords(state.words, { ...state.search, progress: user.progress }); state.search.page = result.page;
  return `<p id="searchCount" class="content-note" role="status">${result.total} sonuç · Sayfa ${result.page}/${result.pages}</p><div id="wordList" class="word-list">${wordRows(result.items)}</div><div class="lesson-actions"><button id="previousPage" class="secondary" ${result.page <= 1 ? 'disabled' : ''}>Önceki</button><button id="nextPage" class="secondary" ${result.page >= result.pages ? 'disabled' : ''}>Sonraki</button></div>`;
}
function wordRows(words) {
  if (!words.length) return '<div class="empty">Eşleşen kelime bulunamadı.</div>';
  return words.map(word => `<div class="word-row"><div><strong>${escapeHtml(word.word)}</strong><small>${escapeHtml(word.translation || word.raw)}</small>${word.translation ? pronunciation(word) : '<small> · Ders içeriği hazırlanıyor</small>'}<details class="word-details"><summary>Kart ayrıntısı ve kişisel işaret</summary>${word.translation ? `<p>${escapeHtml(word.example)}<br>${escapeHtml(word.exampleTr)}</p>${word.contentNote ? `<p class="content-note">${escapeHtml(word.contentNote)}</p>` : ''}<p class="content-note">Taslak içerik / editoryal inceleme bekliyor. Yaklaşık okunuş IPA’nın yerine geçmez.</p>` : ''}${markControls(word)}</details></div><span class="tag">${escapeHtml(word.level)}</span><button class="sound-small" data-speak="${escapeHtml(word.speechText || word.displayWord || word.word)}" aria-label="${escapeHtml(word.word)} kelimesini dinle">▶</button></div>`).join('');
}
function ipaView() {
  return `<section class="hero"><p class="eyebrow">Uluslararası Fonetik Alfabe</p><h2>Sesi gör, sonra duy.</h2><p class="lead">Bir sembole dokun; örnek kelimeyi dinle. Bu yardımcı tablo tam IPA alfabesi veya telaffuz değerlendirmesi değildir; açıklamalar inceleme bekliyor.</p></section><div class="ipa-grid">${state.ipa.map(([symbol, label, examples]) => `<button class="ipa-tile" data-speak="${escapeHtml(examples.split(',')[0].trim())}"><strong>${escapeHtml(symbol)}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(examples)}</small></button>`).join('')}</div><div class="panel" style="margin-top:18px"><p class="eyebrow">Bugünün minimal çifti</p><h2>ship /ʃɪp/ — sheep /ʃiːp/</h2><p class="lead">/ɪ/ kısa ve gevşek; /iː/ daha uzun ve gergindir.</p><div class="lesson-actions"><button class="secondary" data-speak="ship">ship dinle</button><button class="primary" data-speak="sheep">sheep dinle</button></div></div>`;
}
function progressView() {
  const entries = Object.values(user.progress).filter(p => p.attempts || p.dueAt);
  const due = state.enriched.filter(w => user.progress[w.id]?.dueAt <= Date.now()).length;
  return `<section class="hero"><p class="eyebrow">Baskısız ilerleme</p><h2>Geri dönmek başarıdır.</h2><p class="lead">Seri sayacı yok. Sistem yalnızca hangi kelimelerin tekrar zamanı geldiğini takip eder.</p></section><div class="stat-grid"><div class="stat"><strong>${entries.length}</strong><span>çalışılan kelime</span></div><div class="stat"><strong>${entries.filter(p => p.lastResult).length}</strong><span>son denemesi doğru</span></div><div class="stat"><strong>${due}</strong><span>tekrara hazır ders kartı</span></div></div><div class="panel" style="margin-top:18px"><h2>ADHD destekleri</h2><p class="lead">Mini başlangıç, tek görevli ekranlar, sakin görünüm ve cezasız mola. Kişisel “biliyorum” işareti bir ölçüm değildir.</p><button id="reviewLesson" class="primary">Zamanı gelenleri tekrar et</button>${settingsView()}<details class="preferences"><summary>İlerleme yedeği (yalnızca bu cihaz)</summary><p class="content-note">JSON yedeği ilerleme, tercihler ve etkin seansı içerir. İçe aktarma mevcut kelime kayıtlarını korur; çakışan kayıtları yedekteki değerlerle günceller. Eski kr-progress verisi silinmez.</p><div class="lesson-actions"><button id="exportProgress" class="secondary">JSON dışa aktar</button><label class="secondary file-button">JSON içe aktar<input id="importProgress" type="file" accept=".json,application/json"></label></div></details></div>`;
}
function render() {
  document.querySelector('.bottom-nav').hidden = state.route === 'lesson';
  const views = { home: homeView, lesson: lessonView, words: wordsView, ipa: ipaView, progress: progressView };
  app.innerHTML = (views[state.route] || homeView)(); bindViewEvents(); showStorageWarning();
}
function on(selector, event, handler) { app.querySelector(selector)?.addEventListener(event, handler); }
function bindViewEvents() {
  app.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { updatePreferences({ mode: b.dataset.mode }); render(); }));
  app.querySelectorAll('[data-level]').forEach(button => {
    button.addEventListener('click', () => { updatePreferences({ level: button.dataset.level }); render(); });
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const choices = [...app.querySelectorAll('[data-level]:not(:disabled)')];
      const current = choices.indexOf(button);
      const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
      const next = choices[(current + direction + choices.length) % choices.length];
      updatePreferences({ level: next.dataset.level }); render();
      app.querySelector(`[data-level="${next.dataset.level}"]`)?.focus();
    });
  });
  on('#startLesson', 'click', () => startLesson()); on('#reviewLesson', 'click', () => startLesson(true));
  on('#resumeLesson', 'click', () => setRoute('lesson'));
  for (const selector of ['#exitLesson', '#pauseLesson', '#finishLesson']) on(selector, 'click', () => setRoute('home'));
  on('#nextQuestion', 'click', () => { speech.cancel(); user = advanceSession(user); persist(); render(); app.focus({ preventScroll: true }); });
  on('#introContinue', 'click', () => { patchSession({ introDismissed: true }); render(); });
  on('#showHint', 'click', () => { patchSession({ hintUsed: true, selectedAnswer: document.querySelector('#typedAnswer').value }); render(); document.querySelector('#typedAnswer')?.focus(); });
  on('#typedAnswer', 'input', e => patchSession({ selectedAnswer: e.target.value }));
  on('#answerForm', 'submit', e => { e.preventDefault(); answerQuestion(document.querySelector('#typedAnswer').value); });
  on('#listeningFallback', 'click', () => { speech.cancel(); patchSession({ listeningFallback: true }); render(); });
  app.querySelectorAll('[data-answer]').forEach(b => b.addEventListener('click', () => answerQuestion(b.dataset.answer)));
  for (const key of ['showIpa', 'showApprox', 'introductions']) on(`#${key}`, 'change', e => updatePreferences({ [key]: e.target.checked }));
  on('#accentSelect', 'change', e => { speech.cancel(); updatePreferences({ accent: e.target.value }); });
  on('#exerciseSelect', 'change', e => updatePreferences({ exercise: e.target.value }));
  on('#wordSearch', 'input', e => { state.search.query = e.target.value; state.search.page = 1; refreshLibrary(); });
  for (const [id, field] of [['filterLevel', 'level'], ['filterTopic', 'topic'], ['filterMark', 'mark']]) on(`#${id}`, 'change', e => { state.search[field] = e.target.value; state.search.page = 1; refreshLibrary(); });
  bindDynamicEvents();
  on('#exportProgress', 'click', () => {
    const blob = new Blob([exportState(user)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'kelime-rotasi-ilerleme-v2.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('JSON yedeği indirildi.');
  });
  on('#importProgress', 'change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      if (file.size > 5000000) throw Error('Yedek dosyası çok büyük.');
      const incoming = importState(await file.text(), CONTENT_VERSION);
      if (incoming.session && incoming.session.questions.some(q => !state.enriched.some(w => w.id === q.wordId))) throw Error('Yedekteki seans kartları bu içerik paketinde yok; kayıt değiştirilmedi.');
      if (!confirm('Yedekteki ilerleme birleştirilsin, tercihler ve seans içe aktarılsın mı?')) return;
      user = { ...incoming, progress: { ...user.progress, ...incoming.progress } }; persist(); applyPreferences(); render(); notify('Yedek içe aktarıldı.');
    } catch (error) { notify(error.message); } finally { e.target.value = ''; }
  });
}
function bindDynamicEvents(root = app) {
  root.querySelectorAll('[data-speak]').forEach(b => b.addEventListener('click', () => speak(b.dataset.speak, Number(b.dataset.rate) || 0.85, b.dataset.listening === 'true')));
  root.querySelectorAll('[data-mark-id]').forEach(select => select.addEventListener('change', () => {
    const id = select.dataset.markId, mark = select.value;
    user = { ...user, progress: { ...user.progress, [id]: { ...user.progress[id], mark, markedDifficult: mark === 'difficult' } } }; persist();
    if (state.route === 'words' && state.search.mark) refreshLibrary();
  }));
  root.querySelector('#previousPage')?.addEventListener('click', () => { state.search.page--; refreshLibrary(); });
  root.querySelector('#nextPage')?.addEventListener('click', () => { state.search.page++; refreshLibrary(); });
}
function refreshLibrary() { const root = document.querySelector('#libraryResults'); root.innerHTML = libraryResults(); bindDynamicEvents(root); }

document.querySelectorAll('[data-route]').forEach(b => b.addEventListener('click', () => setRoute(b.dataset.route)));
document.querySelector('#soundToggle').addEventListener('click', () => { updatePreferences({ sound: !preferences().sound }); if (!preferences().sound) speech.cancel(); notify(preferences().sound ? 'Ses açıldı' : 'Ses kapatıldı'); });
document.querySelector('#calmToggle').addEventListener('click', () => { updatePreferences({ calm: !preferences().calm }); notify(preferences().calm ? 'Sakin görünüm açık' : 'Sakin görünüm kapalı'); });
window.addEventListener('pagehide', () => speech.cancel());
applyPreferences();
try {
  const [words, enrichment, ipa] = await Promise.all(['words', 'enrichment', 'ipa'].map(async name => { const response = await fetch(`./data/${name}.json`); if (!response.ok) throw Error(`${name}: HTTP ${response.status}`); return response.json(); }));
  state.words = joinContent(words, enrichment); state.enriched = state.words.filter(w => w.eligible).map(w => ({ ...w, word: w.displayWord || w.word })); state.ipa = ipa;
  if (!state.enriched.some(word => word.level === preferences().level)) {
    user = { ...user, preferences: { ...preferences(), level: 'A1' } };
    persist();
  }
  render();
} catch (error) {
  app.innerHTML = `<div class="panel"><h2>Veri yüklenemedi</h2><p>Yerel sunucunun ve içerik dosyalarının kullanılabilir olduğundan emin ol. İlerleme silinmedi.</p><small>${escapeHtml(error.message)}</small></div>`;
}
