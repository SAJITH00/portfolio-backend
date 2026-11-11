(() => {
  const API_BASE = '/api/admin';
  // Admin sessions use the HTTP-only cookie; do not expose JWTs to JavaScript storage.

  // State
  let currentRange = '30d';
  let customStart = '';
  let customEnd = '';
  let chartMode = 'daily';
  let chartInstance = null;
  let deviceChartInstance = null;
  let referrerChartInstance = null;
  let browserChartInstance = null;
  let sectionChartInstance = null;

  let currentMsgFilter = 'all';
  let currentMsgPage = 1;
  let currentMsgSearch = '';
  let activeMessage = null;

  let projectsData = [];
  let skillsData = [];
  let timelineData = { education: [], experience: [] };

  // Theme Management
  const body = document.body;
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('sajith_admin_theme') || 'dark';
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const nextTheme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  });

  function applyTheme(theme) {
    body.setAttribute('data-theme', theme);
    localStorage.setItem('sajith_admin_theme', theme);
    themeToggleBtn.textContent = theme === 'light' ? '🌙' : '☀️';
  }

  // API Helper
  async function apiFetch(endpoint, options = {}) {
    const headers = {
      ...(options.headers || {}),
    };
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error(data.message || 'Unauthorized');
    }
    if (!res.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  }

  function handleUnauthorized() {
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('loginView').style.display = 'flex';
  }

  // Check Session
  async function checkSession() {
    try {
      const res = await apiFetch(`${API_BASE}/me`);
      if (res.success && res.admin) {
        showDashboard(res.admin);
      } else {
        handleUnauthorized();
      }
    } catch {
      handleUnauthorized();
    }
  }

  function showDashboard(admin) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'flex';
    if (admin && admin.username) {
      document.getElementById('adminUsernameDisplay').textContent = admin.username;
    }
    loadAnalytics();
  }

  // Login Form
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginError = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    loginError.style.display = 'none';
    loginBtn.disabled = true;
    loginBtnText.textContent = 'Verifying Credentials...';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Invalid credentials');

      loginForm.reset();
      showDashboard(data.admin);
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = 'block';
    } finally {
      loginBtn.disabled = false;
      loginBtnText.textContent = 'Unlock System';
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await apiFetch(`${API_BASE}/logout`, { method: 'POST' }); } catch (_) {}
    handleUnauthorized();
  });

  // Navigation Switcher
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('pageTitle');
  const pageSub = document.getElementById('pageSub');

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      navItems.forEach((b) => b.classList.toggle('active', b === btn));
      tabPanes.forEach((p) => {
        p.style.display = p.id === `tab-${tab}` ? 'block' : 'none';
      });

      if (tab === 'overview') {
        pageTitle.textContent = 'Telemetry & Visitor Analytics';
        pageSub.textContent = 'Real-time visitor telemetry, page views, and transmission feeds';
        loadAnalytics();
      } else if (tab === 'messages') {
        pageTitle.textContent = 'Transmissions Inquiries';
        pageSub.textContent = 'Read, manage and respond to incoming inquiries';
        loadMessages();
      } else if (tab === 'projects') {
        pageTitle.textContent = 'Projects Manager';
        pageSub.textContent = 'Add, edit, and reorder portfolio showcase items';
        loadProjects();
      } else if (tab === 'skills') {
        pageTitle.textContent = 'Technical Arsenal & Skills';
        pageSub.textContent = 'Manage competencies displayed across frontend, backend, tools and AI';
        loadSkills();
      } else if (tab === 'timeline') {
        pageTitle.textContent = 'Experience & Education Timeline';
        pageSub.textContent = 'Manage professional journey milestones and academic qualifications';
        loadTimeline();
      } else if (tab === 'profile') {
        pageTitle.textContent = 'Profile & Narrative CMS';
        pageSub.textContent = 'Update your bio, contact information, metrics, and resume links';
        loadProfile();
      }
    });
  });

  document.getElementById('refreshBtn').addEventListener('click', () => {
    const activeTab = document.querySelector('.nav-item.active')?.dataset.tab || 'overview';
    if (activeTab === 'overview') loadAnalytics();
    else if (activeTab === 'messages') loadMessages();
    else if (activeTab === 'projects') loadProjects();
    else if (activeTab === 'skills') loadSkills();
    else if (activeTab === 'timeline') loadTimeline();
    else if (activeTab === 'profile') loadProfile();
  });

  // =========================================================
  // ANALYTICS & CHARTS
  // =========================================================
  document.querySelectorAll('.range-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.range-pill').forEach((p) => p.classList.toggle('active', p === pill));
      currentRange = pill.dataset.range;
      loadAnalytics();
    });
  });

  document.getElementById('applyCustomDateBtn').addEventListener('click', () => {
    const s = document.getElementById('customStartDate').value;
    const e = document.getElementById('customEndDate').value;
    if (!s) return alert('Please select a start date');
    currentRange = 'custom';
    customStart = s;
    customEnd = e;
    document.querySelectorAll('.range-pill').forEach((p) => p.classList.remove('active'));
    loadAnalytics();
  });

  document.querySelectorAll('.chart-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach((t) => t.classList.toggle('active', t === tab));
      chartMode = tab.dataset.chart;
      loadAnalytics();
    });
  });

  async function loadAnalytics() {
    try {
      let url = `${API_BASE}/analytics?range=${currentRange}`;
      if (currentRange === 'custom') {
        url += `&startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
      }
      const res = await apiFetch(url);
      const summary = res.data?.summary || {};
      const chartTimeline = res.data?.chartTimeline || [];
      const breakdowns = res.data?.breakdowns || {};

      // Update 7 Cards
      const metric = (value) => Number(value || 0).toLocaleString();
      document.getElementById('metricTotalViews').textContent = metric(summary.totalPageViews);
      document.getElementById('metricUniqueVisitors').textContent = metric(summary.uniqueVisitors);
      document.getElementById('metricTodayVisitors').textContent = metric(summary.todayVisitors);
      document.getElementById('metricMonthVisitors').textContent = metric(summary.monthVisitors);
      document.getElementById('metricTotalProjects').textContent = metric(summary.totalProjects);
      document.getElementById('metricTotalMessages').textContent = metric(summary.totalMessages);
      document.getElementById('metricUnreadMessages').textContent = metric(summary.unreadMessages);

      const badge = document.getElementById('sidebarUnreadBadge');
      if (summary.unreadMessages > 0) {
        badge.textContent = summary.unreadMessages;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }

      renderTrafficChart(chartTimeline || []);
      renderDonutChart('deviceChart', breakdowns.devices, 'Devices', ['#6366f1', '#06b6d4', '#10b981', '#f59e0b']);
      renderBarChart('referrerChart', breakdowns.referrers, 'Referrers', '#06b6d4');
      renderDonutChart('browserChart', breakdowns.browsers, 'Browsers', ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']);
      renderBarChart('sectionChart', breakdowns.sections, 'Sections', '#6366f1');
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }

  function bucketTimeline(timeline, mode) {
    if (mode === 'daily') return timeline;
    const buckets = new Map();
    timeline.forEach((point) => {
      const key = mode === 'monthly'
        ? String(point.date || '').slice(0, 7)
        : weekStart(point.date);
      const current = buckets.get(key) || { date: key, visitors: 0, pageViews: 0 };
      current.visitors += Number(point.visitors) || 0;
      current.pageViews += Number(point.pageViews) || 0;
      buckets.set(key, current);
    });
    return [...buckets.values()];
  }

  function weekStart(dateStr) {
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;
    date.setDate(date.getDate() - date.getDay());
    return date.toISOString().slice(0, 10);
  }

  function renderTrafficChart(timeline) {
    const ctx = document.getElementById('trafficChart')?.getContext('2d');
    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();

    const series = bucketTimeline(timeline, chartMode);
    const labels = series.map((d) => d.date);
    const visitors = series.map((d) => d.visitors);
    const views = series.map((d) => d.pageViews);

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Page Views',
            data: views,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3,
          },
          {
            label: 'Unique Visitors',
            data: visitors,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } } },
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#64748b', beginAtZero: true }, grid: { color: 'rgba(255,255,255,0.04)' } },
        },
      },
    });
  }

  function renderDonutChart(canvasId, items = [], title, colors) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = items.map((i) => i.name || 'Unknown');
    const data = items.map((i) => i.count || 0);

    let instance;
    if (canvasId === 'deviceChart') {
      if (deviceChartInstance) deviceChartInstance.destroy();
      instance = deviceChartInstance = new Chart(ctx, makeDoughnutConfig(labels, data, colors));
    } else if (canvasId === 'browserChart') {
      if (browserChartInstance) browserChartInstance.destroy();
      instance = browserChartInstance = new Chart(ctx, makeDoughnutConfig(labels, data, colors));
    }
  }

  function makeDoughnutConfig(labels, data, colors) {
    return {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [{
          data: data.length ? data : [1],
          backgroundColor: colors,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } },
        },
      },
    };
  }

  function renderBarChart(canvasId, items = [], label, color) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = items.map((i) => i.name || 'Unknown');
    const data = items.map((i) => i.count || 0);

    const config = {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [{
          label,
          data: data.length ? data : [0],
          backgroundColor: color,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { display: false } },
          y: { ticks: { color: '#64748b', beginAtZero: true }, grid: { color: 'rgba(255,255,255,0.04)' } },
        },
      },
    };

    if (canvasId === 'referrerChart') {
      if (referrerChartInstance) referrerChartInstance.destroy();
      referrerChartInstance = new Chart(ctx, config);
    } else if (canvasId === 'sectionChart') {
      if (sectionChartInstance) sectionChartInstance.destroy();
      sectionChartInstance = new Chart(ctx, config);
    }
  }

  // =========================================================
  // MESSAGES
  // =========================================================
  async function loadMessages() {
    const tableBody = document.getElementById('messagesTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">Loading transmissions...</td></tr>';
    try {
      const url = `${API_BASE}/messages?page=${currentMsgPage}&limit=12&status=${currentMsgFilter}&search=${encodeURIComponent(currentMsgSearch)}`;
      const res = await apiFetch(url);
      const messages = res.data;
      const { total, page, pages } = res.pagination;
      const counts = res.counts || {};

      document.getElementById('countFilterAll').textContent = counts.all ?? total;
      document.getElementById('countFilterUnread').textContent = counts.unread ?? 0;
      document.getElementById('countFilterRead').textContent = counts.read ?? 0;

      if (!messages || messages.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No matching transmissions found.</td></tr>';
        document.getElementById('paginationInfo').textContent = 'No records';
        document.getElementById('prevPageBtn').disabled = true;
        document.getElementById('nextPageBtn').disabled = true;
        return;
      }

      tableBody.innerHTML = messages.map((m) => `
        <tr>
          <td><span class="status-tag ${m.isRead ? 'read' : 'unread'}">${m.isRead ? 'READ' : 'NEW'}</span></td>
          <td><strong>${escapeHtml(m.name)}</strong></td>
          <td><a href="mailto:${escapeHtml(m.email)}" style="color:var(--secondary); text-decoration:none">${escapeHtml(m.email)}</a></td>
          <td>${escapeHtml(m.subject)}</td>
          <td>${formatDate(m.createdAt)}</td>
          <td>
            <div class="action-btns">
              <button class="btn-action view-btn" data-id="${m._id}">View</button>
              <button class="btn-action toggle-btn" data-id="${m._id}" data-read="${m.isRead}">${m.isRead ? 'Mark Unread' : 'Mark Read'}</button>
              <button class="btn-action delete delete-btn" data-id="${m._id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');

      document.getElementById('paginationInfo').textContent = `Page ${page} of ${pages} (${total} total)`;
      document.getElementById('prevPageBtn').disabled = page <= 1;
      document.getElementById('nextPageBtn').disabled = page >= pages;

      tableBody.querySelectorAll('.view-btn').forEach((b) => b.addEventListener('click', () => openMessageModal(b.dataset.id)));
      tableBody.querySelectorAll('.toggle-btn').forEach((b) => b.addEventListener('click', () => toggleMessageRead(b.dataset.id, b.dataset.read !== 'true')));
      tableBody.querySelectorAll('.delete-btn').forEach((b) => b.addEventListener('click', () => deleteMessageItem(b.dataset.id)));
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" class="empty-cell text-warning">${err.message}</td></tr>`;
    }
  }

  document.querySelectorAll('#tab-messages .filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-messages .filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
      currentMsgFilter = btn.dataset.filter;
      currentMsgPage = 1;
      loadMessages();
    });
  });

  let searchTimer = null;
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentMsgSearch = e.target.value.trim();
      currentMsgPage = 1;
      loadMessages();
    }, 350);
  });

  document.getElementById('prevPageBtn')?.addEventListener('click', () => {
    if (currentMsgPage > 1) { currentMsgPage--; loadMessages(); }
  });
  document.getElementById('nextPageBtn')?.addEventListener('click', () => {
    currentMsgPage++; loadMessages();
  });

  async function openMessageModal(id) {
    try {
      const res = await apiFetch(`${API_BASE}/messages/${id}`);
      activeMessage = res.data;
      document.getElementById('modalSubject').textContent = activeMessage.subject;
      document.getElementById('modalSender').textContent = activeMessage.name;
      document.getElementById('modalEmailLink').textContent = activeMessage.email;
      document.getElementById('modalEmailLink').href = `mailto:${activeMessage.email}`;
      document.getElementById('modalDate').textContent = formatDate(activeMessage.createdAt);
      document.getElementById('modalContent').textContent = activeMessage.message;

      const pill = document.getElementById('modalStatusPill');
      pill.textContent = activeMessage.isRead ? 'Read' : 'Unread';
      pill.className = `status-pill ${activeMessage.isRead ? 'read' : 'unread'}`;
      document.getElementById('modalToggleReadBtn').textContent = activeMessage.isRead ? 'Mark as Unread' : 'Mark as Read';
      document.getElementById('modalReplyBtn').href = `mailto:${activeMessage.email}?subject=Re: ${encodeURIComponent(activeMessage.subject)}`;

      document.getElementById('messageModal').style.display = 'flex';
      if (!activeMessage.isRead) toggleMessageRead(activeMessage._id, true, false);
    } catch (err) { alert(err.message); }
  }

  async function toggleMessageRead(id, newState, reload = true) {
    try {
      await apiFetch(`${API_BASE}/messages/${id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: newState }),
      });
      if (reload) { loadMessages(); loadAnalytics(); }
    } catch (err) { alert(err.message); }
  }

  async function deleteMessageItem(id) {
    if (!confirm('Are you sure you want to delete this transmission?')) return;
    try {
      await apiFetch(`${API_BASE}/messages/${id}`, { method: 'DELETE' });
      document.getElementById('messageModal').style.display = 'none';
      loadMessages();
      loadAnalytics();
    } catch (err) { alert(err.message); }
  }

  document.getElementById('modalCloseBtn')?.addEventListener('click', () => {
    document.getElementById('messageModal').style.display = 'none';
    loadMessages();
  });
  document.getElementById('modalToggleReadBtn')?.addEventListener('click', () => {
    if (activeMessage) toggleMessageRead(activeMessage._id, !activeMessage.isRead);
  });
  document.getElementById('modalDeleteBtn')?.addEventListener('click', () => {
    if (activeMessage) deleteMessageItem(activeMessage._id);
  });

  // =========================================================
  // PROJECTS CRUD
  // =========================================================
  async function loadProjects() {
    const tableBody = document.getElementById('projectsTableBody');
    tableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">Loading projects...</td></tr>';
    try {
      const res = await apiFetch('/api/portfolio/projects');
      projectsData = res.data || [];

      if (!projectsData.length) {
        tableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">No projects found. Click "+ Add New Project" to create one.</td></tr>';
        return;
      }

      tableBody.innerHTML = projectsData.map((p) => `
        <tr>
          <td><strong>#${p.order}</strong></td>
          <td>${mediaSrc(p.imageUrl) ? `<img src="${escapeHtml(mediaSrc(p.imageUrl))}" class="table-thumb" alt="">` : '<span class="table-thumb placeholder"></span>'}</td>
          <td><strong>${escapeHtml(p.title)}</strong><br><small style="color:var(--text-muted)">${(p.technologies || []).join(', ')}</small></td>
          <td><span class="status-tag read">${escapeHtml(p.category)}</span></td>
          <td>${p.badge ? `<span class="status-tag unread">${escapeHtml(p.badge)}</span>` : '-'}</td>
          <td>${p.isFeatured ? '⭐ Yes' : 'No'}</td>
          <td>
            <div class="action-btns">
              <button class="btn-action edit-proj-btn" data-id="${p._id}">Edit</button>
              <button class="btn-action delete delete-proj-btn" data-id="${p._id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');

      tableBody.querySelectorAll('.edit-proj-btn').forEach((b) => b.addEventListener('click', () => openProjectModal(b.dataset.id)));
      tableBody.querySelectorAll('.delete-proj-btn').forEach((b) => b.addEventListener('click', () => deleteProjectItem(b.dataset.id)));
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="7" class="empty-cell text-warning">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  const projectModal = document.getElementById('projectModal');
  const projectForm = document.getElementById('projectForm');
  document.getElementById('addNewProjectBtn').addEventListener('click', () => openProjectModal());
  document.getElementById('projectModalCloseBtn').addEventListener('click', () => projectModal.style.display = 'none');
  document.getElementById('cancelProjectBtn').addEventListener('click', () => projectModal.style.display = 'none');

  function openProjectModal(id = null) {
    projectForm.reset();
    document.getElementById('projId').value = id || '';
    if (id) {
      const p = projectsData.find((x) => x._id === id);
      if (!p) return;
      document.getElementById('projectModalTitle').textContent = 'Edit Project';
      document.getElementById('projTitle').value = p.title || '';
      document.getElementById('projDesc').value = p.description || '';
      ensureSelectOption('projCategory', p.category || 'frontend');
      document.getElementById('projCategory').value = p.category || 'frontend';
      document.getElementById('projBadge').value = p.badge || '';
      document.getElementById('projTech').value = (p.technologies || []).join(', ');
      document.getElementById('projImage').value = p.imageUrl || '';
      setProjectPreview(p.imageUrl);
      document.getElementById('projLive').value = p.liveUrl || '';
      document.getElementById('projGithub').value = p.githubUrl || '';
      document.getElementById('projOrder').value = p.order || 0;
      document.getElementById('projFeatured').checked = !!p.isFeatured;
    } else {
      document.getElementById('projectModalTitle').textContent = 'Add New Project';
      document.getElementById('projOrder').value = projectsData.length + 1;
      setProjectPreview('');
    }
    setFormStatus('projectFormStatus', '');
    projectModal.style.display = 'flex';
  }

  function setProjectPreview(url) {
    const wrap = document.getElementById('projImagePreview');
    const img = document.getElementById('projImagePreviewImg');
    const src = mediaSrc(url);
    if (!src || src.startsWith('data:')) {
      wrap.hidden = true;
      img.removeAttribute('src');
      return;
    }
    img.src = src;
    wrap.hidden = false;
  }

  // Upload Project Image
  document.getElementById('uploadProjImgBtn').addEventListener('click', () => document.getElementById('projFileInput').click());
  document.getElementById('projImage').addEventListener('input', (e) => setProjectPreview(e.target.value.trim()));
  document.getElementById('projFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const button = document.getElementById('uploadProjImgBtn');
    button.disabled = true;
    button.textContent = 'Uploading...';
    try {
      const res = await apiFetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
      document.getElementById('projImage').value = res.url;
      setProjectPreview(res.url);
      setFormStatus('projectFormStatus', 'Image uploaded. Save the project to publish it.');
    } catch (err) {
      setFormStatus('projectFormStatus', err.message, true);
    } finally {
      button.disabled = false;
      button.textContent = 'Upload image';
      e.target.value = '';
    }
  });

  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('projId').value;
    const payload = {
      title: document.getElementById('projTitle').value.trim(),
      description: document.getElementById('projDesc').value.trim(),
      category: document.getElementById('projCategory').value,
      badge: document.getElementById('projBadge').value.trim(),
      technologies: document.getElementById('projTech').value.split(',').map((t) => t.trim()).filter(Boolean),
      imageUrl: document.getElementById('projImage').value.trim(),
      liveUrl: document.getElementById('projLive').value.trim(),
      githubUrl: document.getElementById('projGithub').value.trim(),
      order: parseInt(document.getElementById('projOrder').value, 10) || 0,
      isFeatured: document.getElementById('projFeatured').checked,
    };

    const saveBtn = document.getElementById('saveProjectBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    try {
      if (id) {
        await apiFetch(`${API_BASE}/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch(`${API_BASE}/projects`, { method: 'POST', body: JSON.stringify(payload) });
      }
      projectModal.style.display = 'none';
      loadProjects();
    } catch (err) {
      setFormStatus('projectFormStatus', err.message, true);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Project';
    }
  });

  async function deleteProjectItem(id) {
    if (!confirm('Are you sure you want to permanently delete this project?')) return;
    try {
      await apiFetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
      loadProjects();
    } catch (err) { alert(err.message); }
  }

  // =========================================================
  // SKILLS CRUD
  // =========================================================
  async function loadSkills() {
    const tableBody = document.getElementById('skillsTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">Loading skills...</td></tr>';
    try {
      const res = await apiFetch('/api/portfolio/skills');
      skillsData = res.data || [];

      if (!skillsData.length) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No skills found.</td></tr>';
        return;
      }

      tableBody.innerHTML = skillsData.map((s) => `
        <tr>
          <td><strong>${escapeHtml(s.name)}</strong></td>
          <td><span class="status-tag read">${escapeHtml(s.category)}</span></td>
          <td>${s.isHighlight ? '⭐ Highlight' : 'Standard'}</td>
          <td><code>${s.styleClass || '-'}</code></td>
          <td>${s.order}</td>
          <td>
            <div class="action-btns">
              <button class="btn-action edit-skill-btn" data-id="${s._id}">Edit</button>
              <button class="btn-action delete delete-skill-btn" data-id="${s._id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');

      tableBody.querySelectorAll('.edit-skill-btn').forEach((b) => b.addEventListener('click', () => openSkillModal(b.dataset.id)));
      tableBody.querySelectorAll('.delete-skill-btn').forEach((b) => b.addEventListener('click', () => deleteSkillItem(b.dataset.id)));
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" class="empty-cell text-warning">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  const skillModal = document.getElementById('skillModal');
  const skillForm = document.getElementById('skillForm');
  document.getElementById('addNewSkillBtn').addEventListener('click', () => openSkillModal());
  document.getElementById('skillModalCloseBtn').addEventListener('click', () => skillModal.style.display = 'none');
  document.getElementById('cancelSkillBtn').addEventListener('click', () => skillModal.style.display = 'none');

  function openSkillModal(id = null) {
    skillForm.reset();
    document.getElementById('skillId').value = id || '';
    if (id) {
      const s = skillsData.find((x) => x._id === id);
      if (!s) return;
      document.getElementById('skillModalTitle').textContent = 'Edit Skill';
      document.getElementById('skillName').value = s.name || '';
      document.getElementById('skillCategory').value = s.category || 'Frontend';
      document.getElementById('skillStyle').value = s.styleClass || '';
      document.getElementById('skillOrder').value = s.order || 0;
      document.getElementById('skillHighlight').checked = !!s.isHighlight;
    } else {
      document.getElementById('skillModalTitle').textContent = 'Add New Skill';
      document.getElementById('skillOrder').value = skillsData.length + 1;
    }
    skillModal.style.display = 'flex';
  }

  skillForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('skillId').value;
    const payload = {
      name: document.getElementById('skillName').value.trim(),
      category: document.getElementById('skillCategory').value,
      styleClass: document.getElementById('skillStyle').value,
      order: parseInt(document.getElementById('skillOrder').value, 10) || 0,
      isHighlight: document.getElementById('skillHighlight').checked,
    };
    try {
      if (id) {
        await apiFetch(`${API_BASE}/skills/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch(`${API_BASE}/skills`, { method: 'POST', body: JSON.stringify(payload) });
      }
      skillModal.style.display = 'none';
      loadSkills();
    } catch (err) { alert(err.message); }
  });

  async function deleteSkillItem(id) {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
      await apiFetch(`${API_BASE}/skills/${id}`, { method: 'DELETE' });
      loadSkills();
    } catch (err) { alert(err.message); }
  }

  // =========================================================
  // TIMELINE (EDUCATION & EXPERIENCE) CRUD
  // =========================================================
  async function loadTimeline() {
    const expBody = document.getElementById('experienceTableBody');
    const eduBody = document.getElementById('educationTableBody');
    try {
      const res = await apiFetch('/api/portfolio/timeline');
      timelineData = res.data || { education: [], experience: [] };

      expBody.innerHTML = (timelineData.experience || []).map((exp) => `
        <tr>
          <td><strong>${escapeHtml(exp.company)}</strong></td>
          <td>${escapeHtml(exp.role)}</td>
          <td>${escapeHtml(exp.period || '-')}</td>
          <td>${exp.tag ? `<span class="status-tag unread">${escapeHtml(exp.tag)}</span>` : '-'}</td>
          <td>
            <div class="action-btns">
              <button class="btn-action edit-tl-btn" data-type="experience" data-id="${exp._id}">Edit</button>
              <button class="btn-action delete delete-tl-btn" data-type="experience" data-id="${exp._id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="5" class="empty-cell">No experience items.</td></tr>';

      eduBody.innerHTML = (timelineData.education || []).map((edu) => `
        <tr>
          <td><strong>${escapeHtml(edu.institution)}</strong></td>
          <td>${escapeHtml(edu.degree)}</td>
          <td>${escapeHtml(edu.period || '-')}</td>
          <td>
            <div class="action-btns">
              <button class="btn-action edit-tl-btn" data-type="education" data-id="${edu._id}">Edit</button>
              <button class="btn-action delete delete-tl-btn" data-type="education" data-id="${edu._id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="4" class="empty-cell">No education items.</td></tr>';

      document.querySelectorAll('.edit-tl-btn').forEach((b) => b.addEventListener('click', () => openTimelineModal(b.dataset.type, b.dataset.id)));
      document.querySelectorAll('.delete-tl-btn').forEach((b) => b.addEventListener('click', () => deleteTimelineItem(b.dataset.type, b.dataset.id)));
    } catch (err) {
      expBody.innerHTML = `<tr><td colspan="5" class="empty-cell text-warning">Failed to load experience: ${escapeHtml(err.message)}</td></tr>`;
      eduBody.innerHTML = `<tr><td colspan="4" class="empty-cell text-warning">Failed to load education: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  const timelineModal = document.getElementById('timelineModal');
  const timelineForm = document.getElementById('timelineForm');
  document.getElementById('addNewExpBtn').addEventListener('click', () => openTimelineModal('experience'));
  document.getElementById('addNewEduBtn').addEventListener('click', () => openTimelineModal('education'));
  document.getElementById('timelineModalCloseBtn').addEventListener('click', () => timelineModal.style.display = 'none');
  document.getElementById('cancelTimelineBtn').addEventListener('click', () => timelineModal.style.display = 'none');

  function openTimelineModal(type, id = null) {
    timelineForm.reset();
    document.getElementById('timelineType').value = type;
    document.getElementById('timelineId').value = id || '';

    const isExp = type === 'experience';
    document.getElementById('tlOrgLabel').textContent = isExp ? 'COMPANY / ORGANIZATION *' : 'INSTITUTION / ACADEMY *';
    document.getElementById('tlTitleLabel').textContent = isExp ? 'ROLE / POSITION *' : 'DEGREE / CERTIFICATION *';

    if (id) {
      const list = isExp ? timelineData.experience : timelineData.education;
      const item = list.find((x) => x._id === id);
      if (!item) return;
      document.getElementById('timelineModalTitle').textContent = `Edit ${isExp ? 'Experience' : 'Education'}`;
      document.getElementById('tlOrg').value = (isExp ? item.company : item.institution) || '';
      document.getElementById('tlTitle').value = (isExp ? item.role : item.degree) || '';
      document.getElementById('tlPeriod').value = item.period || '';
      document.getElementById('tlDesc').value = item.description || '';
      document.getElementById('tlOrder').value = item.order || 0;
      const tagField = document.getElementById('tlTagWrap');
      if (isExp) document.getElementById('tlTag').value = item.tag || '';
      tagField.hidden = !isExp;
    } else {
      document.getElementById('timelineModalTitle').textContent = `Add ${isExp ? 'Experience' : 'Education'}`;
      document.getElementById('tlTagWrap').hidden = !isExp;
    }
    timelineModal.style.display = 'flex';
  }

  timelineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('timelineType').value;
    const id = document.getElementById('timelineId').value;
    const isExp = type === 'experience';

    const payload = {
      period: document.getElementById('tlPeriod').value.trim(),
      description: document.getElementById('tlDesc').value.trim(),
      order: parseInt(document.getElementById('tlOrder').value, 10) || 0,
    };

    if (isExp) {
      payload.company = document.getElementById('tlOrg').value.trim();
      payload.role = document.getElementById('tlTitle').value.trim();
      payload.tag = document.getElementById('tlTag').value.trim();
    } else {
      payload.institution = document.getElementById('tlOrg').value.trim();
      payload.degree = document.getElementById('tlTitle').value.trim();
    }

    try {
      const endpoint = `${API_BASE}/${type}${id ? `/${id}` : ''}`;
      const method = id ? 'PUT' : 'POST';
      await apiFetch(endpoint, { method, body: JSON.stringify(payload) });
      timelineModal.style.display = 'none';
      loadTimeline();
    } catch (err) { alert(err.message); }
  });

  async function deleteTimelineItem(type, id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await apiFetch(`${API_BASE}/${type}/${id}`, { method: 'DELETE' });
      loadTimeline();
    } catch (err) { alert(err.message); }
  }

  // =========================================================
  // PROFILE / ABOUT CMS
  // =========================================================
  async function loadProfile() {
    try {
      const res = await apiFetch('/api/portfolio/profile');
      const p = res.data;
      if (!p) return;

      document.getElementById('profName').value = p.name || '';
      document.getElementById('profTitle').value = p.title || '';
      document.getElementById('profTagline').value = p.tagline || '';
      document.getElementById('profLocation').value = p.location || '';
      document.getElementById('profStatus').value = p.status || '';
      document.getElementById('profEmail').value = p.email || '';
      document.getElementById('profPhone').value = p.phone || '';
      document.getElementById('profHeadline').value = p.aboutHeadline || '';
      document.getElementById('profBio').value = p.aboutBio || '';
      document.getElementById('profProjectsCount').value = p.stats?.projectsCount || '15+';
      document.getElementById('profTechMastered').value = p.stats?.techMastered || '12+';
      document.getElementById('profPassionRate').value = p.stats?.passionRate || '100%';
      document.getElementById('profGithub').value = p.githubUrl || '';
      document.getElementById('profLinkedin').value = p.linkedinUrl || '';
      document.getElementById('profWhatsapp').value = p.whatsappUrl || '';
      document.getElementById('profResume').value = p.resumeUrl || '';
      document.getElementById('profAvatar').value = p.avatarUrl || '';
      setAvatarPreview(p.avatarUrl);
      setFormStatus('profileFormStatus', '');
    } catch (err) {
      console.error('Failed to load profile:', err);
      alert(`Failed to load profile: ${err.message}`);
    }
  }

  document.getElementById('uploadAvatarBtn').addEventListener('click', () => document.getElementById('avatarFileInput').click());
  document.getElementById('avatarFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await apiFetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
      document.getElementById('profAvatar').value = res.url;
      setAvatarPreview(res.url);
      setFormStatus('profileFormStatus', 'Avatar uploaded. Save profile changes to publish it.');
    } catch (err) {
      setFormStatus('profileFormStatus', err.message, true);
    } finally {
      e.target.value = '';
    }
  });

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveProfileBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving Changes...';

    const payload = {
      name: document.getElementById('profName').value.trim(),
      title: document.getElementById('profTitle').value.trim(),
      tagline: document.getElementById('profTagline').value.trim(),
      location: document.getElementById('profLocation').value.trim(),
      status: document.getElementById('profStatus').value.trim(),
      email: document.getElementById('profEmail').value.trim(),
      phone: document.getElementById('profPhone').value.trim(),
      aboutHeadline: document.getElementById('profHeadline').value.trim(),
      aboutBio: document.getElementById('profBio').value.trim(),
      stats: {
        projectsCount: document.getElementById('profProjectsCount').value.trim(),
        techMastered: document.getElementById('profTechMastered').value.trim(),
        passionRate: document.getElementById('profPassionRate').value.trim(),
      },
      githubUrl: document.getElementById('profGithub').value.trim(),
      linkedinUrl: document.getElementById('profLinkedin').value.trim(),
      whatsappUrl: document.getElementById('profWhatsapp').value.trim(),
      resumeUrl: document.getElementById('profResume').value.trim(),
      avatarUrl: document.getElementById('profAvatar').value.trim(),
    };

    try {
      await apiFetch(`${API_BASE}/profile`, { method: 'PUT', body: JSON.stringify(payload) });
      setFormStatus('profileFormStatus', 'Profile updated successfully.');
    } catch (err) {
      setFormStatus('profileFormStatus', err.message, true);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Profile Changes';
    }
  });

  // Helpers
  function formatDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function mediaSrc(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url, location.origin);
      if (parsed.pathname.startsWith('/uploads/')) return `${parsed.pathname}${parsed.search}`;
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
    } catch {
      return '';
    }
    return '';
  }

  function ensureSelectOption(selectId, value) {
    const select = document.getElementById(selectId);
    if (!value || [...select.options].some((option) => option.value === value)) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }

  function setAvatarPreview(url) {
    const wrap = document.getElementById('avatarPreview');
    const img = document.getElementById('avatarPreviewImg');
    const src = mediaSrc(url);
    if (!src) {
      wrap.hidden = true;
      img.removeAttribute('src');
      return;
    }
    img.src = src;
    wrap.hidden = false;
  }

  function setFormStatus(id, message, isError = false) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = message || '';
    node.className = `form-status${isError ? ' error' : ''}${message ? '' : ' is-empty'}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // Start
  checkSession();
})();
