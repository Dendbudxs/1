const state = {
  user: null,
  config: null,
  serverState: 'loading',
  home: { news: [], banners: [] },
  newsVisibleCount: 3,
  lore: { book: null, chapters: [] },
  loreCategory: 'all',
  loreSelectedId: null,
  rules: [],
  contact: null,
  admin: {
    activeTab: 'overview',
    overview: null,
    news: [], selectedNewsId: null,
    lore: { book: null, chapters: [] }, selectedChapterId: null,
    rules: [], selectedRuleId: null,
    banners: [], selectedBannerId: null,
    users: [],
    settings: null,
    dragChapterId: null
  }
};

const DEFAULT_APPEARANCE = Object.freeze({
  themePreset: 'graphite',
  accentColor: '#7b98a3',
  uiDensity: 'normal',
  cornerStyle: 'soft',
  fontPreset: 'modern',
  acrylicBlur: 22,
  acrylicOpacity: 74,
  textureIntensity: 22,
  animationsEnabled: true
});

const APPEARANCE_CACHE_KEY = 'dark.appearance.v1';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function normalizeAppearance(value = {}) {
  const appearance = { ...DEFAULT_APPEARANCE, ...(value || {}) };
  if (!['graphite', 'obsidian', 'steel', 'warm'].includes(appearance.themePreset)) appearance.themePreset = DEFAULT_APPEARANCE.themePreset;
  if (!/^#[0-9a-f]{6}$/i.test(appearance.accentColor || '')) appearance.accentColor = DEFAULT_APPEARANCE.accentColor;
  if (!['compact', 'normal', 'relaxed'].includes(appearance.uiDensity)) appearance.uiDensity = DEFAULT_APPEARANCE.uiDensity;
  if (!['sharp', 'soft', 'round'].includes(appearance.cornerStyle)) appearance.cornerStyle = DEFAULT_APPEARANCE.cornerStyle;
  if (!['modern', 'clean', 'technical'].includes(appearance.fontPreset)) appearance.fontPreset = DEFAULT_APPEARANCE.fontPreset;
  appearance.acrylicBlur = clampNumber(appearance.acrylicBlur, 0, 32, 22);
  appearance.acrylicOpacity = clampNumber(appearance.acrylicOpacity, 45, 92, 74);
  appearance.textureIntensity = clampNumber(appearance.textureIntensity, 0, 100, 22);
  appearance.animationsEnabled = appearance.animationsEnabled !== false;
  return appearance;
}

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return [123, 152, 163];
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
}

function applyAppearance(value, { cache = true } = {}) {
  const appearance = normalizeAppearance(value);
  const root = document.documentElement;
  const [r, g, b] = hexToRgb(appearance.accentColor);
  root.dataset.theme = appearance.themePreset;
  root.dataset.density = appearance.uiDensity;
  root.dataset.corners = appearance.cornerStyle;
  root.dataset.font = appearance.fontPreset;
  root.style.setProperty('--accent', appearance.accentColor);
  root.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, .14)`);
  root.style.setProperty('--accent-focus', `rgba(${r}, ${g}, ${b}, .50)`);
  root.style.setProperty('--accent-switch', `rgba(${r}, ${g}, ${b}, .20)`);
  root.style.setProperty('--accent-switch-line', `rgba(${r}, ${g}, ${b}, .36)`);
  root.style.setProperty('--acrylic-blur', `${appearance.acrylicBlur}px`);
  root.style.setProperty('--surface-opacity', (appearance.acrylicOpacity / 100).toFixed(2));
  root.style.setProperty('--texture-opacity', (appearance.textureIntensity / 100).toFixed(2));
  root.classList.toggle('motion-off', appearance.animationsEnabled === false);
  if (cache) {
    try { localStorage.setItem(APPEARANCE_CACHE_KEY, JSON.stringify(appearance)); } catch {}
  }
  return appearance;
}

function appearanceForUser(user = state.user) {
  if (!user) return { ...DEFAULT_APPEARANCE };
  return normalizeAppearance({ ...(user.appearance || {}), animationsEnabled: user.animationsEnabled !== false });
}

function loadCachedAppearance() {
  try {
    const cached = JSON.parse(localStorage.getItem(APPEARANCE_CACHE_KEY) || 'null');
    if (cached) applyAppearance(cached, { cache: false });
  } catch {}
}

loadCachedAppearance();

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
}

function formatDate(value, options = {}) {
  if (!value) return '—';
  const normalized = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric', ...options
  });
}

const NEWS_VARIANTS = {
  chronicle: { label: 'Хроника' },
  spotlight: { label: 'Акцент' },
  update: { label: 'Обновление' }
};

const BANNER_VARIANTS = {
  spotlight: { label: 'Акцент' },
  chronicle: { label: 'Хроника' },
  signal: { label: 'Сигнал' },
  update: { label: 'Обновление' }
};

function normalizeNewsVariant(value) {
  return NEWS_VARIANTS[value] ? value : 'chronicle';
}

function normalizeBannerVariant(value) {
  return BANNER_VARIANTS[value] ? value : 'spotlight';
}


function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 2400);
}

async function api(url, options = {}) {
  const init = {
    credentials: 'same-origin',
    signal: AbortSignal.timeout(15000),
    ...options,
    headers: { ...(options.headers || {}) }
  };
  if (options.body && typeof options.body === 'string' && !init.headers['content-type']) {
    init.headers['content-type'] = 'application/json';
  }
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `HTTP_${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function humanError(code) {
  const errors = {
    USERNAME_INVALID: 'Логин: 3–24 символа, латиница, цифры и _.',
    PASSWORD_INVALID: 'Пароль должен содержать минимум 8 символов.',
    USERNAME_TAKEN: 'Этот логин уже занят.',
    INVALID_CREDENTIALS: 'Неверный логин или пароль.',
    USE_DISCORD: 'Для этого аккаунта используется вход через Discord.',
    TOO_MANY_ATTEMPTS: 'Слишком много попыток. Попробуй позже.',
    CURRENT_PASSWORD_INVALID: 'Текущий пароль указан неверно.',
    DISPLAY_NAME_INVALID: 'Имя должно содержать минимум 2 символа.',
    SET_PASSWORD_BEFORE_DISCONNECT: 'Сначала установи локальный пароль, затем отключай Discord.',
    ADMIN_REQUIRED: 'Нужны права администратора.',
    AUTH_REQUIRED: 'Сначала войди в аккаунт.',
    CANNOT_DEMOTE_SELF: 'Нельзя снять права администратора у самого себя.',
    LAST_ADMIN: 'Нельзя убрать последнего администратора.',
    IMAGE_TYPE_INVALID: 'Поддерживаются PNG, JPG и WebP.',
    IMAGE_SIZE_INVALID: 'Файл слишком большой.',
    IMAGE_SAVE_FAILED: 'Не удалось сохранить изображение.',
    TITLE_INVALID: 'Укажи заголовок.',
    SERVER_STATE_INVALID: 'Некорректный статус сервера.',
    ORIGIN_INVALID: 'Запрос отклонён защитой сайта.'
  };
  return errors[code] || 'Не удалось выполнить действие.';
}

function setAvatar(element, user) {
  element.replaceChildren();
  if (user?.avatarUrl) {
    const img = node('img');
    img.src = user.avatarUrl;
    img.alt = user.displayName || user.username || 'Аватар';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => {
      element.replaceChildren(node('span', '', (user.displayName || user.username || 'D').slice(0, 1).toUpperCase()));
    }, { once: true });
    element.append(img);
  } else {
    element.append(node('span', '', (user?.displayName || user?.username || 'D').slice(0, 1).toUpperCase()));
  }
}

function applyMotionPreference() {
  applyAppearance(appearanceForUser());
}

function setServerState(serverState) {
  state.serverState = serverState || 'unknown';
  const labels = {
    loading: ['Проверяем…', 'Проверяем статус…'],
    unknown: ['Нет данных', 'Статус недоступен'],
    online: ['Онлайн', 'Сервер онлайн'],
    maintenance: ['Работы', 'Технические работы'],
    offline: ['Офлайн', 'Сервер офлайн']
  };
  const pair = labels[state.serverState] || labels.offline;
  $('#headerStatusText').textContent = pair[0];
  $('#heroStatusText').textContent = pair[1];
  $$('.status-dot').forEach((dot) => {
    dot.classList.remove('online', 'offline', 'maintenance', 'loading', 'unknown');
    dot.classList.add(state.serverState);
  });
  if ($('#metricServerState')) $('#metricServerState').textContent = pair[1];
}

function renderHeaderUser() {
  $('#accountLabel').textContent = state.user ? state.user.displayName : 'Войти';
  setAvatar($('#headerAvatar'), state.user);
  $('#mobileAdminLink').hidden = state.user?.role !== 'admin';
  applyMotionPreference();
}

function normalizePath(pathname) {
  let path = String(pathname || '/').split('?')[0].split('#')[0];
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}

function pageForPath(path) {
  if (/^\/news\/\d+$/.test(path)) return 'news';
  if (path === '/lore') return 'lore';
  if (path === '/contact') return 'contact';
  if (path === '/rules') return 'rules';
  if (path === '/clans') return 'clans';
  if (path === '/account') return 'account';
  if (path === '/admin') return 'admin';
  if (path === '/play') return 'play';
  return path === '/' ? 'home' : 'notfound';
}

function updateActiveNav(path) {
  $$('[data-route]').forEach((link) => {
    const href = normalizePath(link.getAttribute('href') || link.dataset.route || '/');
    link.classList.toggle('active', href === path || (href === '/' && path === '/'));
  });
}

const ROUTE_ORDER = ['/', '/lore', '/rules', '/contact', '/clans', '/account', '/admin', '/play'];
function routeTransitionDirection(fromPath, toPath) {
  const from = normalizePath(fromPath);
  const to = normalizePath(toPath);
  const fromBase = /^\/news\/\d+$/.test(from) ? '/' : from;
  const toBase = /^\/news\/\d+$/.test(to) ? '/' : to;
  const fromIndex = ROUTE_ORDER.indexOf(fromBase);
  const toIndex = ROUTE_ORDER.indexOf(toBase);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return 'forward';
  return toIndex > fromIndex ? 'forward' : 'back';
}

function performPageSwitch(path) {
  const page = pageForPath(path);
  $$('.page').forEach((section) => section.classList.toggle('active', section.dataset.page === page));
  document.body.classList.toggle('admin-mode', page === 'admin');
  updateActiveNav(path);
  const heading = document.querySelector('.page.active h1');
  document.title = `${heading?.textContent || 'DARK'} · DARK Games`;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function routeMotionEnabled() {
  return !document.documentElement.classList.contains('motion-off')
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function animateRouteSwitch(path) {
  // Keep backdrop-filter panels fully opaque throughout navigation.
  performPageSwitch(path);
}

async function ensureRouteData(path) {
  if (/^\/news\/\d+$/.test(path)) {
    const id = Number(path.split('/').pop());
    const ok = await renderNewsDetail(id);
    if (!ok) return false;
  }
  if (path === '/account') renderAccount();
  if (path === '/admin') {
    if (!state.user) {
      openAuth('login');
      return false;
    }
    if (state.user.role !== 'admin') {
      toast('У аккаунта нет прав администратора.');
      navigate('/account', { replace: true });
      return false;
    }
    $('#adminIdentity').textContent = state.user.username;
    await openAdminTab(state.admin.activeTab || 'overview');
  }
  return true;
}

async function navigate(rawPath, { replace = false } = {}) {
  const destination = new URL(rawPath, location.origin);
  const path = normalizePath(destination.pathname);
  if (path === '/lore') selectLoreFromHash(destination.hash);
  const allowed = await ensureRouteData(path);
  if (allowed === false) return;

  const current = normalizePath(location.pathname);
  const direction = routeTransitionDirection(current, path);
  await animateRouteSwitch(path, direction);
  showSiteHeader();

  const fullPath = path + destination.search + destination.hash;
  if (fullPath !== location.pathname + location.search + location.hash || replace) history[replace ? 'replaceState' : 'pushState']({}, '', fullPath);
  closeMobileMenu();
}

function openMobileMenu() {
  $('#mobileMenuBackdrop').hidden = false;
  requestAnimationFrame(() => $('#mobileMenu').classList.add('open'));
  $('#mobileMenu').setAttribute('aria-hidden', 'false');
  $('#menuButton').setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
}

function closeMobileMenu() {
  $('#mobileMenu').classList.remove('open');
  $('#mobileMenu').setAttribute('aria-hidden', 'true');
  $('#menuButton').setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  setTimeout(() => { if (!$('#mobileMenu').classList.contains('open')) $('#mobileMenuBackdrop').hidden = true; }, 280);
}

function openAuth(tab = 'login') {
  selectAuthTab(tab);
  const dialog = $('#authDialog');
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('dialog-open');
}

function closeAuth() {
  const dialog = $('#authDialog');
  if (dialog.open) dialog.close();
  document.body.classList.remove('dialog-open');
}

function selectAuthTab(tab) {
  $$('[data-auth-tab]').forEach((button) => button.classList.toggle('active', button.dataset.authTab === tab));
  $('#loginForm').hidden = tab !== 'login';
  $('#registerForm').hidden = tab !== 'register';
  $('#authDialogTitle').textContent = tab === 'login' ? 'Вход' : 'Регистрация';
  $('#authMessage').textContent = '';
}

function renderDiscordAvailability() {
  const configured = Boolean(state.config?.discordConfigured);
  const login = $('#discordLoginButton');
  const profile = $('#discordConnectButton');
  [login, profile].forEach((element) => {
    if (!element) return;
    element.classList.toggle('disabled', !configured);
    element.setAttribute('aria-disabled', String(!configured));
    if (!configured) element.title = 'Сначала добавь Discord Client ID и Client Secret в .env';
  });
  if (!configured) login.textContent = 'Discord OAuth не настроен';
  else login.textContent = 'Продолжить через Discord';
}

function renderHome() {
  $('#serverIpText').textContent = state.config?.serverIp || 'darkgamespro.falix.pro';
  $('#versionText').textContent = state.config?.minecraftVersion || '—';
  $('#playVersion').textContent = state.config?.minecraftVersion || '—';
  $('#playIp').textContent = state.config?.serverIp || 'Адрес временно недоступен';

  const bannerStrip = $('#bannerStrip');
  bannerStrip.replaceChildren();
  const banner = state.home.banners?.[0];
  $('#bannerEmpty').hidden = Boolean(banner);
  if (banner) {
    const variant = normalizeBannerVariant(banner.style_variant);
    const item = node('div', 'banner-item');
    item.dataset.variant = variant;
    if (banner.image_url) {
      const image = node('img');
      image.src = banner.image_url;
      image.alt = banner.title || 'Мир DARK';
      image.loading = 'lazy';
      item.append(image);
    }
    const copy = node('div', 'banner-copy');
    const meta = node('div', 'banner-meta');
    meta.append(node('span', 'banner-kicker', BANNER_VARIANTS[variant].label));
    meta.append(node('span', 'banner-index', 'Событие мира'));
    copy.append(meta);
    copy.append(node('h3', '', banner.title));
    if (banner.subtitle) copy.append(node('p', '', banner.subtitle));
    if (banner.link_url) {
      const actions = node('div', 'banner-actions');
      const link = node('a', 'banner-link', 'Подробнее');
      link.href = banner.link_url;
      if (banner.link_url.startsWith('/')) link.dataset.route = banner.link_url;
      else { link.target = '_blank'; link.rel = 'noopener'; }
      actions.append(link);
      copy.append(actions);
    }
    item.append(copy);
    bannerStrip.append(item);
    bannerStrip.hidden = false;
  } else {
    bannerStrip.hidden = true;
  }

  const list = $('#newsList');
  list.replaceChildren();
  const more = $('#newsMoreButton');
  more.hidden = (state.home.news?.length || 0) <= state.newsVisibleCount;
  if (!state.home.news?.length) {
    list.append(node('div', 'empty-line', 'Новости пока не опубликованы.'));
    watchReveals();
    return;
  }
  state.home.news.slice(0, state.newsVisibleCount).forEach((item, index) => {
    const variant = normalizeNewsVariant(item.style_variant);
    const row = node('article', 'news-item');
    row.dataset.reveal = '';
    row.dataset.variant = variant;
    if (item.image_url) row.classList.add('has-image');
    row.tabIndex = 0;
    row.setAttribute('role', 'link');

    const dateWrap = node('div', 'news-date-block');
    dateWrap.append(node('time', '', formatDate(item.published_at || item.updated_at)));
    dateWrap.append(node('small', '', String(index + 1).padStart(2, '0')));

    const copy = node('div', 'news-copy');
    const topline = node('div', 'news-topline');
    topline.append(node('span', 'news-pill', NEWS_VARIANTS[variant].label));
    topline.append(node('span', 'news-read', 'Открыть публикацию'));
    copy.append(topline);
    copy.append(node('h3', '', item.title));
    copy.append(node('p', '', item.excerpt || 'Открыть публикацию.'));

    const open = () => navigate(`/news/${item.id}`);
    row.addEventListener('click', open);
    row.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });

    row.append(dateWrap, copy);

    if (item.image_url) {
      const thumb = node('div', 'news-thumb');
      const image = node('img');
      image.src = item.image_url;
      image.alt = item.title;
      image.loading = 'lazy';
      thumb.append(image);
      row.append(thumb);
    }

    row.append(node('span', 'news-arrow', '→'));
    list.append(row);
  });
  watchReveals();
}

async function renderNewsDetail(id) {
  try {
    const item = await api(`/api/content/news/${id}`);
    const variant = normalizeNewsVariant(item.style_variant);
    $('#newsDetailDate').textContent = formatDate(item.published_at || item.updated_at);
    $('#newsDetailVariantTag').textContent = `DARK NEWS · ${NEWS_VARIANTS[variant].label}`;
    $('#newsDetailArticle').dataset.variant = variant;
    $('#newsDetailTitle').textContent = item.title;
    $('#newsDetailExcerpt').textContent = item.excerpt || '';
    $('#newsDetailBody').textContent = item.body || '';
    const image = $('#newsDetailImage');
    if (item.image_url) {
      image.src = item.image_url;
      image.alt = item.title;
      image.hidden = false;
    } else {
      image.hidden = true;
      image.removeAttribute('src');
    }
  } catch (error) {
    toast('Новость не найдена.');
    await navigate('/', { replace: true });
    return false;
  }
  return true;
}

const loreCategoryNames = {
  history: 'История', regions: 'Регионы', cities: 'Города', characters: 'Персонажи', mechanics: 'Механики'
};

function selectLoreFromHash(hash = location.hash) {
  const match = /^#chapter-(\d+)$/.exec(hash);
  if (!match) return;
  state.loreSelectedId = Number(match[1]);
  state.loreCategory = 'all';
  $('#loreSearch').value = '';
  renderLore();
}

function normalizeLoreSearch(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function filteredLoreChapters() {
  const query = normalizeLoreSearch($('#loreSearch').value);
  const terms = query.split(/\s+/).filter(Boolean);

  return (state.lore.chapters || []).filter((chapter) => {
    // Search is intentionally global across all lore categories. Category filters
    // continue to work when the search field is empty.
    if (!terms.length && state.loreCategory !== 'all' && chapter.category !== state.loreCategory) return false;

    const category = loreCategoryNames[chapter.category] || chapter.category || '';
    const haystack = normalizeLoreSearch(`${chapter.title || ''} ${chapter.body || ''} ${category}`);
    return !terms.length || terms.every(term => haystack.includes(term));
  });
}

function renderLore() {
  $('#loreBookTitle').textContent = state.lore.book?.title || 'Книга мира';
  $('#loreBookSubtitle').textContent = state.lore.book?.subtitle || 'История мира DARK.';
  $$('[data-lore-category]').forEach((button) => button.classList.toggle('active', button.dataset.loreCategory === state.loreCategory));
  const chapters = filteredLoreChapters();
  if (!chapters.some((chapter) => chapter.id === state.loreSelectedId)) state.loreSelectedId = chapters[0]?.id || null;

  const toc = $('#loreToc');
  toc.replaceChildren();
  if (!chapters.length) {
    toc.append(node('div', 'empty-line', $('#loreSearch').value ? 'Ничего не найдено. Попробуй другое слово.' : 'В этом разделе пока нет глав.'));
  } else {
    chapters.forEach((chapter, index) => {
      const button = node('button', 'toc-item');
      button.type = 'button';
      button.classList.toggle('active', chapter.id === state.loreSelectedId);
      button.append(node('small', '', `${String(index + 1).padStart(2, '0')} · ${loreCategoryNames[chapter.category] || 'Глава'}`));
      button.append(document.createTextNode(chapter.title));
      button.addEventListener('click', () => {
        state.loreSelectedId = chapter.id;
        history.pushState({}, '', `/lore#chapter-${chapter.id}`);
        renderLore();
        $('.lore-toc').classList.remove('open');
      });
      toc.append(button);
    });
  }

  const reader = $('#loreReader');
  reader.replaceChildren();
  const selected = chapters.find((chapter) => chapter.id === state.loreSelectedId);
  if (!selected) {
    const empty = node('div', 'book-empty');
    empty.append(node('span', '', 'ARCHIVE'));
    empty.append(node('h2', '', $('#loreSearch').value ? 'Главы не найдены' : 'Книга пока закрыта.'));
    empty.append(node('p', '', $('#loreSearch').value ? 'Измени запрос или выбери другую категорию.' : 'Новые истории появятся здесь после публикации.'));
    reader.append(empty);
    $('#chapterMobileSelect').firstChild.textContent = 'Выбрать главу ';
    return;
  }
  const allIndex = (state.lore.chapters || []).findIndex((chapter) => chapter.id === selected.id) + 1;
  reader.append(node('div', 'book-chapter-number', `Глава ${String(allIndex).padStart(2, '0')} · ${loreCategoryNames[selected.category] || 'Архив'}`));
  reader.append(node('h2', '', selected.title));
  const share = node('button', 'subtle-button chapter-share', 'Скопировать ссылку на главу');
  share.type = 'button';
  share.addEventListener('click', async () => {
    const url = `${location.origin}/lore#chapter-${selected.id}`;
    try { await navigator.clipboard.writeText(url); toast('Ссылка скопирована'); }
    catch { window.prompt('Ссылка на главу', url); }
  });
  reader.append(share);
  reader.append(node('div', 'book-prose', selected.body || 'Текст этой главы ещё не написан.'));
  $('#chapterMobileSelect').firstChild.textContent = `${selected.title} `;
}

function renderRules() {
  const list = $('#rulesList');
  list.replaceChildren();
  if (!state.rules.length) {
    list.append(node('div', 'empty-line', 'Правила ещё не опубликованы.'));
    return;
  }
  state.rules.forEach((rule, index) => {
    const row = node('article', 'rule-item');
    row.append(node('div', 'rule-index', String(index + 1).padStart(2, '0')));
    const copy = node('div');
    copy.append(node('h3', '', rule.title));
    copy.append(node('p', '', rule.body));
    row.append(copy);
    list.append(row);
  });
}

function renderContact() {
  const contact = state.contact || {};
  $('#developerDiscordHandle').textContent = contact.discordHandle || '@developer';
  const link = $('#developerDiscordLink');
  if (contact.discordUrl) {
    link.href = contact.discordUrl;
    link.hidden = false;
  } else link.hidden = true;
}

function appearanceFromForm() {
  return normalizeAppearance({
    themePreset: $('#themePresetInput')?.value,
    accentColor: $('#accentColorInput')?.value,
    uiDensity: $('#uiDensityInput')?.value,
    cornerStyle: $('#cornerStyleInput')?.value,
    fontPreset: $('#fontPresetInput')?.value,
    acrylicBlur: $('#acrylicBlurInput')?.value,
    acrylicOpacity: $('#acrylicOpacityInput')?.value,
    textureIntensity: $('#textureIntensityInput')?.value,
    animationsEnabled: $('#animationsInput')?.checked !== false
  });
}

function updatePersonalizationReadouts(appearance = appearanceFromForm()) {
  if ($('#acrylicBlurValue')) $('#acrylicBlurValue').textContent = `${appearance.acrylicBlur} px`;
  if ($('#acrylicOpacityValue')) $('#acrylicOpacityValue').textContent = `${appearance.acrylicOpacity}%`;
  if ($('#textureIntensityValue')) $('#textureIntensityValue').textContent = `${appearance.textureIntensity}%`;
  $$('.accent-swatch').forEach((button) => button.classList.toggle('active', button.dataset.accent.toLowerCase() === appearance.accentColor.toLowerCase()));
}

function fillPersonalizationForm(value) {
  const appearance = normalizeAppearance(value);
  if (!$('#personalizationForm')) return;
  $('#themePresetInput').value = appearance.themePreset;
  $('#accentColorInput').value = appearance.accentColor;
  $('#uiDensityInput').value = appearance.uiDensity;
  $('#cornerStyleInput').value = appearance.cornerStyle;
  $('#fontPresetInput').value = appearance.fontPreset;
  $('#acrylicBlurInput').value = appearance.acrylicBlur;
  $('#acrylicOpacityInput').value = appearance.acrylicOpacity;
  $('#textureIntensityInput').value = appearance.textureIntensity;
  $('#animationsInput').checked = appearance.animationsEnabled;
  updatePersonalizationReadouts(appearance);
}

function previewPersonalization() {
  const appearance = appearanceFromForm();
  updatePersonalizationReadouts(appearance);
  applyAppearance(appearance);
}

function renderAccount() {
  $('#accountGuest').hidden = Boolean(state.user);
  $('#accountUser').hidden = !state.user;
  if (!state.user) return;

  const user = state.user;
  setAvatar($('#profileAvatar'), user);
  $('#profileDisplayName').textContent = user.displayName;
  $('#profileUsername').textContent = user.username;
  $('#profileRole').textContent = user.role === 'admin' ? 'administrator' : 'player';
  $('#displayNameInput').value = user.displayName;
  fillPersonalizationForm(appearanceForUser(user));
  $('#adminAccountRow').hidden = user.role !== 'admin';

  const connected = Boolean(user.discord);
  $('#discordConnectionText').textContent = connected ? `@${user.discord.username}` : 'Не привязан';
  $('#discordConnectButton').hidden = connected;
  $('#discordDisconnectButton').hidden = !connected;

  $('#currentPasswordLabel').hidden = !user.hasLocalPassword;
  $('#passwordSectionTitle').textContent = user.hasLocalPassword ? 'Пароль' : 'Установить пароль';
  renderDiscordAvailability();
}

async function refreshMe() {
  try {
    const data = await api('/api/auth/me');
    state.user = data.user;
  } catch (error) {
    if (error.status === 401) state.user = null;
    else throw error;
  }
  renderHeaderUser();
  renderAccount();
}

const publicSections = {
  config: { url: '/api/config', target: '.home-intro', apply(data) { state.config = data; renderHome(); renderDiscordAvailability(); } },
  status: { url: '/api/server/status', target: '.intro-meta', apply(data) { setServerState(data.state); } },
  home: { url: '/api/content/home', target: '.home-stage-nav', apply(data) { state.home = data; renderHome(); } },
  lore: { url: '/api/content/lore', target: '.lore-header', apply(data) { state.lore = data; renderLore(); selectLoreFromHash(); } },
  rules: { url: '/api/content/rules', target: '#rulesList', apply(data) { state.rules = data.rules || []; renderRules(); } },
  contact: { url: '/api/contact', target: '[data-page="contact"] .simple-head', apply(data) { state.contact = data; renderContact(); } }
};
async function loadPublicSection(key) {
  const section = publicSections[key];
  document.getElementById(`load-error-${key}`)?.remove();
  try {
    section.apply(await api(section.url));
  } catch {
    if (key === 'status') setServerState('unknown');
    if (key === 'home' && !state.home.news.length) $('#newsList').replaceChildren();
    if (key === 'rules' && !state.rules.length) $('#rulesList').replaceChildren();
    const box = node('div', 'load-error');
    box.id = `load-error-${key}`;
    box.setAttribute('role', 'status');
    box.append(node('span', '', 'Не удалось загрузить данные этого раздела.'));
    const retry = node('button', 'subtle-button', 'Повторить');
    retry.type = 'button';
    retry.addEventListener('click', () => loadPublicSection(key));
    box.append(retry);
    $(section.target).after(box);
  }
}
async function refreshPublic() {
  await Promise.allSettled(Object.keys(publicSections).map(loadPublicSection));
}

async function fileToDataUrl(file, maxBytes = 4 * 1024 * 1024) {
  if (!file) return null;
  if (file.size > maxBytes) throw new Error('IMAGE_SIZE_INVALID');
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('IMAGE_TYPE_INVALID');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('IMAGE_INVALID'));
    reader.readAsDataURL(file);
  });
}

// Admin -----------------------------------------------------------------------
function setAdminTabUI(tab) {
  state.admin.activeTab = tab;
  $$('[data-admin-tab]').forEach((button) => button.classList.toggle('active', button.dataset.adminTab === tab));
  $$('[data-admin-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.adminPanel === tab));
}

async function openAdminTab(tab) {
  setAdminTabUI(tab);
  try {
    if (tab === 'overview') await loadAdminOverview();
    if (tab === 'news') await loadAdminNews();
    if (tab === 'lore') await loadAdminLore();
    if (tab === 'rules') await loadAdminRules();
    if (tab === 'banners') await loadAdminBanners();
    if (tab === 'users') await loadAdminUsers();
    if (tab === 'settings') await loadAdminSettings();
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      toast(humanError(error.message));
      await refreshMe();
      navigate('/account', { replace: true });
    } else toast(humanError(error.message));
  }
}

async function loadAdminOverview() {
  const data = await api('/api/admin/overview');
  state.admin.overview = data;
  $('#metricUsers').textContent = data.users;
  $('#metricAdmins').textContent = data.admins;
  $('#metricNews').textContent = data.publishedNews;
  $('#metricChapters').textContent = data.chapters;
  $('#metricLatestNews').textContent = data.latestNews ? `${data.latestNews.title} · ${formatDate(data.latestNews.updated_at)}` : 'Нет данных';
  setServerState(data.serverState);
}

function renderAdminNewsList() {
  const list = $('#adminNewsList');
  list.replaceChildren();
  if (!state.admin.news.length) list.append(node('div', 'empty-line', 'Новостей пока нет.'));
  state.admin.news.forEach((item) => {
    const button = node('button', 'cms-list-item');
    button.type = 'button';
    button.classList.toggle('active', item.id === state.admin.selectedNewsId);
    button.append(node('strong', '', item.title));
    button.append(node('small', '', `${item.status === 'published' ? 'Опубликовано' : 'Черновик'} · ${formatDate(item.updated_at)}`));
    button.addEventListener('click', () => selectAdminNews(item.id));
    list.append(button);
  });
}

function selectAdminNews(id) {
  state.admin.selectedNewsId = id;
  const item = state.admin.news.find((entry) => entry.id === id);
  $('#newsEditorId').value = item?.id || '';
  $('#newsEditorTitle').value = item?.title || '';
  $('#newsEditorExcerpt').value = item?.excerpt || '';
  $('#newsEditorBody').value = item?.body || '';
  $('#newsEditorVariant').value = normalizeNewsVariant(item?.style_variant);
  $('#newsEditorStatus').value = item?.status || 'draft';
  $('#newsEditorImage').value = '';
  $('#newsEditorRemoveImage').checked = false;
  $('#deleteNewsButton').hidden = !item;
  renderAdminNewsList();
}

async function loadAdminNews(selectId = null) {
  const data = await api('/api/admin/news');
  state.admin.news = data.news || [];
  const candidate = selectId ?? state.admin.selectedNewsId;
  const id = state.admin.news.some((item) => item.id === candidate) ? candidate : state.admin.news[0]?.id || null;
  selectAdminNews(id);
}

function renderAdminChapterList() {
  const list = $('#adminChapterList');
  list.replaceChildren();
  const chapters = state.admin.lore.chapters || [];
  if (!chapters.length) list.append(node('div', 'empty-line', 'Глав пока нет.'));
  chapters.forEach((chapter) => {
    const item = node('div', 'cms-list-item');
    item.tabIndex = 0;
    item.draggable = true;
    item.dataset.id = chapter.id;
    item.classList.toggle('active', chapter.id === state.admin.selectedChapterId);
    item.append(node('strong', '', chapter.title));
    item.append(node('small', '', `${loreCategoryNames[chapter.category] || chapter.category} · ${chapter.published ? 'Опубликовано' : 'Скрыто'}`));
    item.addEventListener('click', () => selectAdminChapter(chapter.id));
    item.addEventListener('keydown', (event) => { if (event.key === 'Enter') selectAdminChapter(chapter.id); });
    item.addEventListener('dragstart', () => { state.admin.dragChapterId = chapter.id; item.classList.add('dragging'); });
    item.addEventListener('dragend', () => { state.admin.dragChapterId = null; $$('.cms-list-item', list).forEach((el) => el.classList.remove('dragging', 'drag-over')); });
    item.addEventListener('dragover', (event) => { event.preventDefault(); item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', async (event) => {
      event.preventDefault();
      item.classList.remove('drag-over');
      const fromId = state.admin.dragChapterId;
      const toId = chapter.id;
      if (!fromId || fromId === toId) return;
      const ids = chapters.map((entry) => entry.id);
      const fromIndex = ids.indexOf(fromId);
      const toIndex = ids.indexOf(toId);
      ids.splice(toIndex, 0, ids.splice(fromIndex, 1)[0]);
      try {
        await api('/api/admin/lore/reorder', { method: 'PUT', body: JSON.stringify({ ids }) });
        await loadAdminLore(fromId);
        await refreshLorePublic();
        toast('Порядок глав обновлён');
      } catch (error) { toast(humanError(error.message)); }
    });
    list.append(item);
  });
}

function setChapterCategory(category = 'history') {
  const allowed = ['history', 'regions', 'cities', 'characters', 'mechanics'];
  const next = allowed.includes(category) ? category : 'history';
  $('#chapterEditorCategory').value = next;
  $$('[data-chapter-category]').forEach((button) => {
    const active = button.dataset.chapterCategory === next;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', String(active));
  });
}

function selectAdminChapter(id) {
  state.admin.selectedChapterId = id;
  const chapter = state.admin.lore.chapters.find((entry) => entry.id === id);
  $('#chapterEditorId').value = chapter?.id || '';
  $('#chapterEditorTitle').value = chapter?.title || '';
  setChapterCategory(chapter?.category || 'history');
  $('#chapterEditorBody').value = chapter?.body || '';
  $('#chapterEditorPublished').checked = chapter ? Boolean(chapter.published) : true;
  $('#deleteChapterButton').hidden = !chapter;
  renderAdminChapterList();
}

async function loadAdminLore(selectId = null) {
  const data = await api('/api/admin/lore');
  state.admin.lore = data;
  $('#adminBookTitle').value = data.book?.title || '';
  $('#adminBookSubtitle').value = data.book?.subtitle || '';
  const candidate = selectId ?? state.admin.selectedChapterId;
  const id = data.chapters.some((entry) => entry.id === candidate) ? candidate : data.chapters[0]?.id || null;
  selectAdminChapter(id);
}

function renderAdminRulesList() {
  const list = $('#adminRulesList');
  list.replaceChildren();
  if (!state.admin.rules.length) list.append(node('div', 'empty-line', 'Правил пока нет.'));
  state.admin.rules.forEach((rule, index) => {
    const button = node('button', 'cms-list-item');
    button.type = 'button';
    button.classList.toggle('active', rule.id === state.admin.selectedRuleId);
    button.append(node('strong', '', `${String(index + 1).padStart(2, '0')} · ${rule.title}`));
    button.append(node('small', '', rule.published ? 'Опубликовано' : 'Скрыто'));
    button.addEventListener('click', () => selectAdminRule(rule.id));
    list.append(button);
  });
}

function selectAdminRule(id) {
  state.admin.selectedRuleId = id;
  const rule = state.admin.rules.find((entry) => entry.id === id);
  $('#ruleEditorId').value = rule?.id || '';
  $('#ruleEditorTitle').value = rule?.title || '';
  $('#ruleEditorBody').value = rule?.body || '';
  $('#ruleEditorPublished').checked = rule ? Boolean(rule.published) : true;
  $('#deleteRuleButton').hidden = !rule;
  renderAdminRulesList();
}

async function loadAdminRules(selectId = null) {
  const data = await api('/api/admin/rules');
  state.admin.rules = data.rules || [];
  const candidate = selectId ?? state.admin.selectedRuleId;
  const id = state.admin.rules.some((entry) => entry.id === candidate) ? candidate : state.admin.rules[0]?.id || null;
  selectAdminRule(id);
}

function renderAdminBannersList() {
  const list = $('#adminBannersList');
  list.replaceChildren();
  if (!state.admin.banners.length) list.append(node('div', 'empty-line', 'Баннеров пока нет.'));
  state.admin.banners.forEach((banner) => {
    const button = node('button', 'cms-list-item');
    button.type = 'button';
    button.classList.toggle('active', banner.id === state.admin.selectedBannerId);
    button.append(node('strong', '', banner.title));
    button.append(node('small', '', banner.active ? 'Показывается' : 'Выключен'));
    button.addEventListener('click', () => selectAdminBanner(banner.id));
    list.append(button);
  });
}

function selectAdminBanner(id) {
  state.admin.selectedBannerId = id;
  const banner = state.admin.banners.find((entry) => entry.id === id);
  $('#bannerEditorId').value = banner?.id || '';
  $('#bannerEditorTitle').value = banner?.title || '';
  $('#bannerEditorSubtitle').value = banner?.subtitle || '';
  $('#bannerEditorLink').value = banner?.link_url || '';
  $('#bannerEditorVariant').value = normalizeBannerVariant(banner?.style_variant);
  $('#bannerEditorImage').value = '';
  $('#bannerEditorRemoveImage').checked = false;
  $('#bannerEditorActive').checked = banner ? Boolean(banner.active) : true;
  $('#deleteBannerButton').hidden = !banner;
  renderAdminBannersList();
}

async function loadAdminBanners(selectId = null) {
  const data = await api('/api/admin/banners');
  state.admin.banners = data.banners || [];
  const candidate = selectId ?? state.admin.selectedBannerId;
  const id = state.admin.banners.some((entry) => entry.id === candidate) ? candidate : state.admin.banners[0]?.id || null;
  selectAdminBanner(id);
}

async function loadAdminUsers() {
  const data = await api('/api/admin/users');
  state.admin.users = data.users || [];
  const list = $('#adminUsersList');
  list.replaceChildren();
  state.admin.users.forEach((user) => {
    const row = node('div', 'user-admin-row');
    const identity = node('div');
    identity.append(node('strong', '', user.username));
    identity.append(node('small', '', `ID ${user.id} · ${formatDate(user.createdAt)}`));
    const select = node('select');
    ['user', 'admin'].forEach((role) => {
      const option = node('option', '', role);
      option.value = role;
      option.selected = user.role === role;
      select.append(option);
    });
    const save = node('button', 'subtle-button', 'Сохранить');
    save.type = 'button';
    save.addEventListener('click', async () => {
      try {
        await api(`/api/admin/users/${user.id}/role`, { method: 'PATCH', body: JSON.stringify({ role: select.value }) });
        toast('Роль обновлена');
        await loadAdminUsers();
        await loadAdminOverview();
        if (user.id === state.user.id) await refreshMe();
      } catch (error) { toast(humanError(error.message)); }
    });
    row.append(identity, select, save);
    list.append(row);
  });
}

async function loadAdminSettings() {
  const settings = await api('/api/admin/settings');
  state.admin.settings = settings;
  $('#adminServerState').value = settings.serverState;
  $('#adminServerIp').value = settings.serverIp || '';
  $('#adminMinecraftVersion').value = settings.minecraftVersion || '';
  $('#adminDiscordHandle').value = settings.developerDiscordHandle || '';
  $('#adminDiscordUrl').value = settings.developerDiscordUrl || '';
}

async function refreshHomePublic() {
  state.home = await api('/api/content/home');
  renderHome();
}
async function refreshLorePublic() {
  state.lore = await api('/api/content/lore');
  renderLore();
}
async function refreshRulesPublic() {
  const data = await api('/api/content/rules');
  state.rules = data.rules || [];
  renderRules();
}
async function refreshContactPublic() {
  state.contact = await api('/api/contact');
  state.config = await api('/api/config');
  renderContact(); renderHome(); renderDiscordAvailability();
}

// Reveal elements once when they enter the viewport. Content stays visible if unsupported.
let revealObserver;
function watchReveals() {
  if (!('IntersectionObserver' in window)) return;
  if (!revealObserver) revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!document.documentElement.classList.contains('motion-off') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) entry.target.classList.add('reveal-in');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]:not([data-observed])').forEach(element => {
    element.dataset.observed = 'true';
    revealObserver.observe(element);
  });
}

function updateHeaderClock() {
  const timeNode = $('#headerClockTime');
  const dateNode = $('#headerClockDate');
  if (!timeNode || !dateNode) return;
  const now = new Date();
  timeNode.textContent = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(now);
  dateNode.textContent = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: 'short'
  }).format(now).replace('.', '');
  $('#headerClock')?.setAttribute('aria-label', `Локальное время ${timeNode.textContent}`);
}
updateHeaderClock();
setInterval(updateHeaderClock, 1000);

// Auto-hide header on downward scroll, reveal it immediately on upward scroll.
let lastHeaderScrollY = Math.max(0, window.scrollY);
let headerScrollTicking = false;
let headerHidden = false;

function showSiteHeader() {
  if (!headerHidden) return;
  headerHidden = false;
  document.querySelector('.site-header')?.classList.remove('header-hidden');
}

function hideSiteHeader() {
  if (headerHidden || document.body.classList.contains('menu-open') || document.body.classList.contains('dialog-open')) return;
  headerHidden = true;
  document.querySelector('.site-header')?.classList.add('header-hidden');
}

function updateHeaderVisibility() {
  const y = Math.max(0, window.scrollY);
  const delta = y - lastHeaderScrollY;

  if (y <= 36) showSiteHeader();
  else if (delta > 7 && y > 96) hideSiteHeader();
  else if (delta < -5) showSiteHeader();

  lastHeaderScrollY = y;
  headerScrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (headerScrollTicking) return;
  headerScrollTicking = true;
  requestAnimationFrame(updateHeaderVisibility);
}, { passive: true });
window.addEventListener('focus', showSiteHeader);

// Event wiring ---------------------------------------------------------------
let homeStageTransitioning = false;

async function selectHomeStage(name, { focusPanel = false } = {}) {
  const next = document.getElementById(`stage-${name}`);
  const panels = $$('.home-stage');
  const current = panels.find(panel => !panel.hidden);
  if (!next || !panels.includes(next) || !current || current === next || homeStageTransitioning) return;
  let viewport = document.getElementById('homeStageViewport');
  if (!viewport) {
    viewport = node('div', 'home-stage-viewport');
    viewport.id = 'homeStageViewport';
    current.before(viewport);
    panels.forEach(panel => viewport.append(panel));
  }
  const direction = panels.indexOf(next) > panels.indexOf(current) ? 1 : -1;
  const animations = [];
  homeStageTransitioning = true;
  viewport.classList.add('is-sliding');
  const oldHeight = Math.max(viewport.getBoundingClientRect().height, current.offsetHeight);
  viewport.style.minHeight = oldHeight + 'px';
  $$('[data-home-stage]').forEach(tab => {
    const selected = tab.dataset.homeStage === name;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  try {
    // Grid overlays the panels at exactly the same origin. Neither pushes the other down.
    next.hidden = false;
    current.inert = true;
    current.setAttribute('aria-hidden', 'true');
    next.inert = false;
    next.removeAttribute('aria-hidden');
    viewport.style.minHeight = Math.max(oldHeight, next.offsetHeight) + 'px';
  } finally {
    panels.forEach(panel => {
      panel.hidden = panel !== next;
      panel.inert = panel !== next;
      panel.removeAttribute('aria-hidden');
    });
    animations.forEach(animation => animation.cancel());
    viewport.classList.remove('is-sliding');
    homeStageTransitioning = false;
  }
  if (focusPanel) next.focus({ preventScroll: true });
  watchReveals();
}
$$('[data-home-stage]').forEach((tab, index, tabs) => {
  tab.addEventListener('click', () => selectHomeStage(tab.dataset.homeStage));
  tab.addEventListener('keydown', event => {
    let destination;
    if (event.key === 'ArrowRight') destination = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') destination = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') destination = 0;
    if (event.key === 'End') destination = tabs.length - 1;
    if (destination === undefined) return;
    event.preventDefault();
    tabs[destination].focus();
    selectHomeStage(tabs[destination].dataset.homeStage);
  });
});
$$('[data-stage-next]').forEach(button => button.addEventListener('click', () => selectHomeStage(button.dataset.stageNext, { focusPanel: true })));
$('#newsMoreButton').addEventListener('click', () => {
  const previousCount = state.newsVisibleCount;
  state.newsVisibleCount += 6;
  renderHome();
  const next = $('#newsList').children[previousCount];
  next?.focus({ preventScroll: true });
});
watchReveals();
$('#loreSearch').addEventListener('input', () => {
  if ($('#loreSearch').value.trim()) state.loreCategory = 'all';
  renderLore();
});
window.addEventListener('hashchange', () => { if (location.pathname === '/lore') selectLoreFromHash(); });
$('#playCopyIp').addEventListener('click', async () => {
  if (!state.config?.serverIp) return toast('Адрес не загрузился. Обнови страницу.');
  try { await navigator.clipboard.writeText(state.config.serverIp); toast('IP скопирован'); }
  catch { window.prompt('Адрес сервера', state.config.serverIp); }
});
$('#logoutAllButton').addEventListener('click', async () => {
  if (!window.confirm('Выйти из аккаунта на всех устройствах, включая это?')) return;
  try {
    await api('/api/auth/logout-all', { method: 'POST' });
    state.user = null;
    renderHeaderUser(); renderAccount();
    toast('Все сессии завершены');
  } catch (error) { toast(humanError(error.message)); }
});
document.addEventListener('click', (event) => {
  const routeLink = event.target.closest('[data-route]');
  if (routeLink) {
    const href = routeLink.getAttribute('href') || routeLink.dataset.route || '/';
    if (href.startsWith('/')) {
      event.preventDefault();
      navigate(href);
      return;
    }
  }
  const target = event.target.closest('[data-route-target]');
  if (target) navigate(target.dataset.routeTarget);
});

window.addEventListener('popstate', async () => {
  if (location.pathname === '/lore') selectLoreFromHash();
  const path = normalizePath(location.pathname);
  const allowed = await ensureRouteData(path);
  if (allowed === false) return;
  const activePage = $('.page.active');
  const currentPageName = activePage?.dataset.page || 'home';
  const pathForCurrentPage = currentPageName === 'home' ? '/' : `/${currentPageName}`;
  const direction = routeTransitionDirection(pathForCurrentPage, path);
  await animateRouteSwitch(path, direction);
  showSiteHeader();
});

$('#menuButton').addEventListener('click', openMobileMenu);
$('#closeMobileMenu').addEventListener('click', closeMobileMenu);
$('#mobileMenuBackdrop').addEventListener('click', closeMobileMenu);

$('#accountButton').addEventListener('click', () => state.user ? navigate('/account') : openAuth('login'));
$('#accountGuestLogin').addEventListener('click', () => openAuth('login'));
$('#closeAuthDialog').addEventListener('click', closeAuth);
$('#authDialog').addEventListener('close', () => document.body.classList.remove('dialog-open'));
$('#authDialog').addEventListener('click', (event) => {
  if (event.target === $('#authDialog')) {
    const rect = $('#authDialog').getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) closeAuth();
  }
});
$$('[data-auth-tab]').forEach((button) => button.addEventListener('click', () => selectAuthTab(button.dataset.authTab)));

$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: form.get('username'), password: form.get('password') })
    });
    state.user = data.user;
    renderHeaderUser(); renderAccount(); closeAuth();
    toast('Вход выполнен');
    navigate(state.user.role === 'admin' ? '/admin' : '/account');
  } catch (error) { $('#authMessage').textContent = humanError(error.message); }
});

$('#registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: form.get('username'), password: form.get('password') })
    });
    state.user = data.user;
    renderHeaderUser(); renderAccount(); closeAuth();
    toast('Аккаунт создан');
    navigate('/account');
  } catch (error) { $('#authMessage').textContent = humanError(error.message); }
});

$('#logoutButton').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
  state.user = null;
  try { localStorage.removeItem(APPEARANCE_CACHE_KEY); } catch {}
  applyAppearance(DEFAULT_APPEARANCE, { cache: false });
  renderHeaderUser(); renderAccount();
  toast('Ты вышел из аккаунта');
  navigate('/');
});

$('#copyIpButton').addEventListener('click', async () => {
  const ip = state.config?.serverIp || $('#serverIpText').textContent;
  try { await navigator.clipboard.writeText(ip); toast('IP скопирован'); }
  catch { toast(`IP: ${ip}`); }
});

$('#heroStatus').addEventListener('click', () => toast($('#heroStatusText').textContent));

$('#chapterMobileSelect').addEventListener('click', () => $('.lore-toc').classList.toggle('open'));
$$('[data-lore-category]').forEach((button) => button.addEventListener('click', () => {
  state.loreCategory = button.dataset.loreCategory;
  state.loreSelectedId = null;
  renderLore();
}));

$('#contactDiscordAuth').addEventListener('click', () => {
  if (!state.config?.discordConfigured) return toast('Discord OAuth ещё не настроен в .env');
  if (state.user?.discord) return navigate('/account');
  location.href = '/auth/discord';
});

$('#discordLoginButton').addEventListener('click', (event) => {
  if (!state.config?.discordConfigured) { event.preventDefault(); toast('Добавь Discord OAuth данные в .env'); }
});
$('#discordConnectButton').addEventListener('click', (event) => {
  if (!state.config?.discordConfigured) { event.preventDefault(); toast('Добавь Discord OAuth данные в .env'); }
});

$('#profileForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const data = await api('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ displayName: $('#displayNameInput').value, animationsEnabled: state.user?.animationsEnabled !== false })
    });
    state.user = data.user;
    renderHeaderUser(); renderAccount();
    toast('Профиль сохранён');
  } catch (error) { toast(humanError(error.message)); }
});

$('#personalizationForm').addEventListener('input', (event) => {
  if (event.target.matches('input, select')) previewPersonalization();
});
$('#personalizationForm').addEventListener('change', (event) => {
  if (event.target.matches('input, select')) previewPersonalization();
});
$$('.accent-swatch').forEach((button) => button.addEventListener('click', () => {
  $('#accentColorInput').value = button.dataset.accent;
  previewPersonalization();
}));

$('#personalizationForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const appearance = appearanceFromForm();
  try {
    const data = await api('/api/profile/personalization', {
      method: 'PATCH',
      body: JSON.stringify(appearance)
    });
    state.user = data.user;
    renderHeaderUser();
    fillPersonalizationForm(appearanceForUser());
    toast('Оформление сохранено');
  } catch (error) {
    fillPersonalizationForm(appearanceForUser());
    applyMotionPreference();
    toast(humanError(error.message));
  }
});

$('#resetPersonalizationButton').addEventListener('click', async () => {
  const defaults = { ...DEFAULT_APPEARANCE };
  fillPersonalizationForm(defaults);
  applyAppearance(defaults);
  try {
    const data = await api('/api/profile/personalization', { method: 'PATCH', body: JSON.stringify(defaults) });
    state.user = data.user;
    renderHeaderUser();
    fillPersonalizationForm(appearanceForUser());
    toast('Оформление сброшено');
  } catch (error) { toast(humanError(error.message)); }
});

$('#uploadAvatarButton').addEventListener('click', async () => {
  const file = $('#avatarInput').files?.[0];
  if (!file) return toast('Сначала выбери изображение.');
  try {
    const imageData = await fileToDataUrl(file, 2 * 1024 * 1024);
    const data = await api('/api/profile/avatar', { method: 'POST', body: JSON.stringify({ imageData }) });
    state.user = data.user;
    $('#avatarInput').value = '';
    renderHeaderUser(); renderAccount();
    toast('Аватар обновлён');
  } catch (error) { toast(humanError(error.message)); }
});

$('#removeAvatarButton').addEventListener('click', async () => {
  try {
    const data = await api('/api/profile/avatar', { method: 'DELETE' });
    state.user = data.user;
    renderHeaderUser(); renderAccount();
    toast('Аватар удалён');
  } catch (error) { toast(humanError(error.message)); }
});

$('#passwordForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const data = await api('/api/profile/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: form.get('currentPassword'), newPassword: form.get('newPassword') })
    });
    state.user = data.user;
    event.currentTarget.reset();
    renderHeaderUser(); renderAccount();
    toast('Пароль обновлён');
  } catch (error) { toast(humanError(error.message)); }
});

$('#discordDisconnectButton').addEventListener('click', async () => {
  if (!confirm('Отключить Discord от аккаунта?')) return;
  try {
    const data = await api('/api/profile/discord', { method: 'DELETE' });
    state.user = data.user;
    renderHeaderUser(); renderAccount();
    toast('Discord отключён');
  } catch (error) { toast(humanError(error.message)); }
});

$$('[data-admin-tab]').forEach((button) => button.addEventListener('click', () => openAdminTab(button.dataset.adminTab)));

$('#newNewsButton').addEventListener('click', () => { state.admin.selectedNewsId = null; selectAdminNews(null); $('#newsEditorTitle').focus(); });
$('#newsEditorForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const id = Number($('#newsEditorId').value) || null;
    const file = $('#newsEditorImage').files?.[0];
    const imageData = file ? await fileToDataUrl(file) : null;
    const payload = {
      title: $('#newsEditorTitle').value,
      excerpt: $('#newsEditorExcerpt').value,
      body: $('#newsEditorBody').value,
      styleVariant: $('#newsEditorVariant').value,
      status: $('#newsEditorStatus').value,
      imageData,
      removeImage: $('#newsEditorRemoveImage').checked
    };
    const saved = await api(id ? `/api/admin/news/${id}` : '/api/admin/news', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await loadAdminNews(saved.id); await refreshHomePublic();
    toast('Новость сохранена');
  } catch (error) { toast(humanError(error.message)); }
});
$('#deleteNewsButton').addEventListener('click', async () => {
  const id = Number($('#newsEditorId').value);
  if (!id || !confirm('Удалить эту новость?')) return;
  try { await api(`/api/admin/news/${id}`, { method: 'DELETE' }); state.admin.selectedNewsId = null; await loadAdminNews(); await refreshHomePublic(); toast('Новость удалена'); }
  catch (error) { toast(humanError(error.message)); }
});

$$('[data-chapter-category]').forEach((button) => button.addEventListener('click', () => {
  setChapterCategory(button.dataset.chapterCategory);
}));

$('#bookSettingsForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/api/admin/lore/book', { method: 'PUT', body: JSON.stringify({ title: $('#adminBookTitle').value, subtitle: $('#adminBookSubtitle').value }) });
    await loadAdminLore(state.admin.selectedChapterId); await refreshLorePublic(); toast('Книга сохранена');
  } catch (error) { toast(humanError(error.message)); }
});
$('#newChapterButton').addEventListener('click', () => { state.admin.selectedChapterId = null; selectAdminChapter(null); $('#chapterEditorTitle').focus(); });
$('#chapterEditorForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const id = Number($('#chapterEditorId').value) || null;
    const payload = { title: $('#chapterEditorTitle').value, category: $('#chapterEditorCategory').value, body: $('#chapterEditorBody').value, published: $('#chapterEditorPublished').checked };
    const saved = await api(id ? `/api/admin/lore/chapters/${id}` : '/api/admin/lore/chapters', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await loadAdminLore(saved.id); await refreshLorePublic(); toast('Глава сохранена');
  } catch (error) { toast(humanError(error.message)); }
});
$('#deleteChapterButton').addEventListener('click', async () => {
  const id = Number($('#chapterEditorId').value);
  if (!id || !confirm('Удалить эту главу?')) return;
  try { await api(`/api/admin/lore/chapters/${id}`, { method: 'DELETE' }); state.admin.selectedChapterId = null; await loadAdminLore(); await refreshLorePublic(); toast('Глава удалена'); }
  catch (error) { toast(humanError(error.message)); }
});

$('#newRuleButton').addEventListener('click', () => { state.admin.selectedRuleId = null; selectAdminRule(null); $('#ruleEditorTitle').focus(); });
$('#ruleEditorForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const id = Number($('#ruleEditorId').value) || null;
    const payload = { title: $('#ruleEditorTitle').value, body: $('#ruleEditorBody').value, published: $('#ruleEditorPublished').checked };
    const saved = await api(id ? `/api/admin/rules/${id}` : '/api/admin/rules', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await loadAdminRules(saved.id); await refreshRulesPublic(); toast('Правило сохранено');
  } catch (error) { toast(humanError(error.message)); }
});
$('#deleteRuleButton').addEventListener('click', async () => {
  const id = Number($('#ruleEditorId').value);
  if (!id || !confirm('Удалить это правило?')) return;
  try { await api(`/api/admin/rules/${id}`, { method: 'DELETE' }); state.admin.selectedRuleId = null; await loadAdminRules(); await refreshRulesPublic(); toast('Правило удалено'); }
  catch (error) { toast(humanError(error.message)); }
});

$('#newBannerButton').addEventListener('click', () => { state.admin.selectedBannerId = null; selectAdminBanner(null); $('#bannerEditorTitle').focus(); });
$('#bannerEditorForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const id = Number($('#bannerEditorId').value) || null;
    const file = $('#bannerEditorImage').files?.[0];
    const imageData = file ? await fileToDataUrl(file) : null;
    const payload = {
      title: $('#bannerEditorTitle').value,
      subtitle: $('#bannerEditorSubtitle').value,
      linkUrl: $('#bannerEditorLink').value,
      styleVariant: $('#bannerEditorVariant').value,
      imageData,
      removeImage: $('#bannerEditorRemoveImage').checked,
      active: $('#bannerEditorActive').checked
    };
    const saved = await api(id ? `/api/admin/banners/${id}` : '/api/admin/banners', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await loadAdminBanners(saved.id); await refreshHomePublic(); toast('Баннер сохранён');
  } catch (error) { toast(humanError(error.message)); }
});
$('#deleteBannerButton').addEventListener('click', async () => {
  const id = Number($('#bannerEditorId').value);
  if (!id || !confirm('Удалить этот баннер?')) return;
  try { await api(`/api/admin/banners/${id}`, { method: 'DELETE' }); state.admin.selectedBannerId = null; await loadAdminBanners(); await refreshHomePublic(); toast('Баннер удалён'); }
  catch (error) { toast(humanError(error.message)); }
});

$('#adminSettingsForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        serverState: $('#adminServerState').value,
        serverIp: $('#adminServerIp').value,
        minecraftVersion: $('#adminMinecraftVersion').value,
        developerDiscordHandle: $('#adminDiscordHandle').value,
        developerDiscordUrl: $('#adminDiscordUrl').value
      })
    });
    const server = await api('/api/server/status');
    setServerState(server.state);
    await refreshContactPublic();
    toast('Настройки сохранены');
  } catch (error) { toast(humanError(error.message)); }
});

// Boot ------------------------------------------------------------------------
async function boot() {
  try {
    await Promise.all([refreshPublic(), refreshMe()]);
  } catch (error) {
    console.error(error);
    toast('Не удалось загрузить часть данных сайта.');
  }

  const params = new URLSearchParams(location.search);
  const discord = params.get('discord');
  if (discord) {
    const messages = {
      connected: 'Discord подключён.',
      'not-configured': 'Discord OAuth ещё не настроен.',
      'state-error': 'Сессия Discord устарела. Попробуй снова.',
      'already-linked': 'Этот Discord уже связан с другим аккаунтом.',
      failed: 'Не удалось войти через Discord.'
    };
    toast(messages[discord] || 'Discord: неизвестный статус.');
    history.replaceState({}, '', location.pathname);
    await refreshMe().catch(() => {});
  }

  const path = normalizePath(location.pathname);
  const allowed = await ensureRouteData(path);
  if (allowed !== false) performPageSwitch(path);
}

boot();
