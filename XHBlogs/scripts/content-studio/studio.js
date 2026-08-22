'use strict'

const app = {
  token: '',
  previewUrl: 'http://127.0.0.1:3000',
  data: { posts: [], chatters: [], moments: [], albums: [], music: [], settings: {}, git: { branch: '', changes: [] } },
  writingKind: 'posts',
  momentImages: [],
  albumPhotos: [],
  activeAlbum: -1,
  publishTimer: null,
}

const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]))
const assetUrl = (url) => url?.startsWith('/uploads/') ? `${app.previewUrl}${url}` : url

function toast(message, isError = false) {
  const node = $('#toast')
  node.textContent = message
  node.className = `toast show${isError ? ' error' : ''}`
  clearTimeout(toast.timer)
  toast.timer = setTimeout(() => { node.className = 'toast' }, 3000)
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (options.mutate) headers.set('X-Studio-Token', app.token)
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    options.body = JSON.stringify(options.json)
  }
  const response = await fetch(path, { ...options, headers })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `请求失败（${response.status}）`)
  return payload
}

async function loadState(showToast = false) {
  app.data = await api('/api/state')
  renderAll()
  if (showToast) toast('已从磁盘重新载入')
}

function setView(name) {
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === name))
  $$('.view').forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === name))
  const titles = { overview: '内容概览', writing: '文章与日记', moments: '动态', albums: '照片与相册', music: '音乐', publish: '检查与发布' }
  $('#page-title').textContent = titles[name]
  if (name === 'publish') loadState().catch(handleError)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function renderAll() {
  renderStats()
  renderToggles()
  renderWritingList()
  renderMomentList()
  renderAlbumList()
  renderMusic()
  renderChanges()
}

function renderStats() {
  const photoCount = app.data.albums.reduce((sum, album) => sum + (album.photos?.length || 0), 0)
  const stats = [
    ['文章', app.data.posts.length], ['日记 / 杂谈', app.data.chatters.length], ['动态', app.data.moments.length], ['照片', photoCount],
  ]
  $('#stat-grid').innerHTML = stats.map(([label, value]) => `<article class="stat-card"><span>${label}</span><strong>${value}</strong></article>`).join('')
}

function renderToggles() {
  const definitions = [
    ['moments', '动态', '在导航和首页显示动态入口'],
    ['chatter', '日记 / 杂谈', '在导航和首页显示杂谈入口'],
    ['photoWall', '照片墙', '公开相册与照片页面'],
    ['music', '音乐馆', '显示网站播放器与音乐页面'],
  ]
  $('#feature-toggles').innerHTML = definitions.map(([key, title, description]) => `<div class="toggle-row"><div><strong>${title}</strong><span>${description}</span></div><button class="switch ${app.data.settings[key] ? 'on' : ''}" data-setting="${key}" aria-label="切换${title}"></button></div>`).join('')
}

async function updateSetting(key) {
  const next = { ...app.data.settings, [key]: !app.data.settings[key] }
  const result = await api('/api/settings', { method: 'PUT', mutate: true, json: next })
  app.data.settings = result.settings
  renderToggles()
  renderChanges()
  toast('栏目状态已保存到本地')
}

function recordLabel(record, fallback) { return record.title || record.content?.split('\n').find(Boolean)?.slice(0, 36) || fallback }

function renderWritingList() {
  const query = $('#writing-search')?.value.trim().toLowerCase() || ''
  const records = app.data[app.writingKind].filter((record) => JSON.stringify([record.title, record.tags, record.description]).toLowerCase().includes(query))
  const list = $('#writing-list')
  if (!records.length) { list.innerHTML = '<div class="record-empty">还没有内容，点右上角 ＋ 新建</div>'; return }
  list.innerHTML = records.map((record) => `<button class="record-item" data-writing-slug="${escapeHtml(record.slug)}"><strong>${escapeHtml(record.title)}</strong><span>${escapeHtml(record.date || '未填写日期')} · ${escapeHtml((record.tags || []).join(' / ') || '无标签')}</span></button>`).join('')
}

function resetWriting(kind = app.writingKind) {
  app.writingKind = kind
  $$('[data-writing-kind]').forEach((button) => button.classList.toggle('active', button.dataset.writingKind === kind))
  $('#mood-field').classList.toggle('hidden', kind !== 'chatters')
  $('#tags-field').classList.toggle('hidden', false)
  const form = $('#writing-form')
  form.reset()
  form.elements.date.value = today()
  $('#writing-eyebrow').textContent = kind === 'posts' ? 'NEW POST' : 'NEW CHATTER'
  $('#writing-heading').textContent = kind === 'posts' ? '新文章' : '新日记 / 杂谈'
  $('#delete-writing').classList.add('hidden')
  renderCoverPreview('')
  renderWritingList()
}

function editWriting(slug) {
  const record = app.data[app.writingKind].find((item) => item.slug === slug)
  if (!record) return
  const form = $('#writing-form')
  for (const name of ['originalSlug', 'slug', 'title', 'date', 'description', 'mood', 'cover', 'content']) {
    if (form.elements[name]) form.elements[name].value = name === 'originalSlug' ? record.slug : (record[name] || '')
  }
  form.elements.tags.value = (record.tags || []).join(', ')
  $('#writing-heading').textContent = record.title
  $('#writing-eyebrow').textContent = app.writingKind === 'posts' ? 'EDIT POST' : 'EDIT CHATTER'
  $('#delete-writing').classList.remove('hidden')
  renderCoverPreview(record.cover)
  $$('[data-writing-slug]').forEach((node) => node.classList.toggle('active', node.dataset.writingSlug === slug))
}

function renderCoverPreview(url) {
  $('#writing-cover-preview').innerHTML = url ? `<img src="${escapeHtml(assetUrl(url))}" alt="封面预览">` : '暂无封面'
}

async function saveWriting(event) {
  event.preventDefault()
  const values = Object.fromEntries(new FormData(event.currentTarget))
  values.tags = values.tags.split(',').map((item) => item.trim()).filter(Boolean)
  const result = await api(`/api/content/${app.writingKind}/${encodeURIComponent(values.slug)}`, { method: 'PUT', mutate: true, json: values })
  await loadState()
  editWriting(result.slug)
  toast('内容已保存到本地')
}

async function deleteWriting() {
  const slug = $('#writing-form').elements.originalSlug.value
  if (!slug || !confirm(`把「${slug}」移到本地废纸篓？`)) return
  await api(`/api/content/${app.writingKind}/${encodeURIComponent(slug)}`, { method: 'DELETE', mutate: true })
  await loadState()
  resetWriting()
  toast('已移到 .content-studio/trash')
}

function renderMomentList() {
  const list = $('#moment-list')
  if (!app.data.moments.length) { list.innerHTML = '<div class="record-empty">还没有动态</div>'; return }
  list.innerHTML = app.data.moments.map((record) => `<button class="record-item" data-moment-slug="${escapeHtml(record.slug)}"><strong>${escapeHtml(recordLabel(record, '无文字动态'))}</strong><span>${escapeHtml(record.date || '未填写日期')} · ${(record.images || []).length} 张图</span></button>`).join('')
}

function resetMoment() {
  const form = $('#moment-form'); form.reset(); form.elements.date.value = today()
  app.momentImages = []; renderMomentImages(); $('#moment-heading').textContent = '新动态'; $('#delete-moment').classList.add('hidden')
}

function editMoment(slug) {
  const record = app.data.moments.find((item) => item.slug === slug); if (!record) return
  const form = $('#moment-form')
  for (const name of ['originalSlug','slug','date','location','content']) form.elements[name].value = name === 'originalSlug' ? record.slug : (record[name] || '')
  app.momentImages = [...(record.images || [])]
  renderMomentImages(); $('#moment-heading').textContent = recordLabel(record, '动态'); $('#delete-moment').classList.remove('hidden')
  $$('[data-moment-slug]').forEach((node) => node.classList.toggle('active', node.dataset.momentSlug === slug))
}

function imageCard(url, index, kind) {
  return `<article class="image-card"><img src="${escapeHtml(assetUrl(url))}" alt="图片 ${index + 1}"><div class="image-actions"><button type="button" data-image-action="up" data-kind="${kind}" data-index="${index}">↑</button><button type="button" data-image-action="down" data-kind="${kind}" data-index="${index}">↓</button><button type="button" data-image-action="remove" data-kind="${kind}" data-index="${index}">移除</button></div></article>`
}

function renderMomentImages() { $('#moment-images').innerHTML = app.momentImages.length ? app.momentImages.map((url, index) => imageCard(url, index, 'moment')).join('') : '<div class="record-empty">暂无图片</div>' }

async function saveMoment(event) {
  event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); values.images = app.momentImages
  const result = await api(`/api/content/moments/${encodeURIComponent(values.slug)}`, { method: 'PUT', mutate: true, json: values })
  await loadState(); editMoment(result.slug); toast('动态已保存到本地')
}

async function deleteMoment() {
  const slug = $('#moment-form').elements.originalSlug.value
  if (!slug || !confirm(`把动态「${slug}」移到本地废纸篓？`)) return
  await api(`/api/content/moments/${encodeURIComponent(slug)}`, { method: 'DELETE', mutate: true }); await loadState(); resetMoment(); toast('动态已移到废纸篓')
}

async function uploadFiles(files, scope) {
  const urls = []
  for (let index = 0; index < files.length; index += 1) {
    $('#save-indicator').textContent = `处理图片 ${index + 1}/${files.length}`
    const result = await api(`/api/upload?scope=${scope}`, { method: 'POST', mutate: true, headers: { 'X-File-Name': encodeURIComponent(files[index].name) }, body: files[index] })
    urls.push(result.url)
  }
  $('#save-indicator').textContent = '图片处理完成'
  return urls
}

function renderAlbumList() {
  const list = $('#album-list')
  if (!app.data.albums.length) { list.innerHTML = '<div class="record-empty">还没有相册</div>'; return }
  list.innerHTML = app.data.albums.map((album, index) => `<button class="record-item ${index === app.activeAlbum ? 'active' : ''}" data-album-index="${index}"><strong>${escapeHtml(album.title)}</strong><span>${escapeHtml(album.date || '')} · ${(album.photos || []).length} 张</span></button>`).join('')
}

function resetAlbum() {
  app.activeAlbum = -1; app.albumPhotos = []; const form = $('#album-form'); form.reset(); form.elements.date.value = today(); $('#album-heading').textContent = '新相册'; $('#delete-album').classList.add('hidden'); renderAlbumPhotos(); renderAlbumList()
}

function editAlbum(index) {
  const album = app.data.albums[index]; if (!album) return
  app.activeAlbum = index; app.albumPhotos = (album.photos || []).map((photo) => ({ ...photo }))
  const form = $('#album-form')
  for (const name of ['originalId','id','title','date','cover','description']) form.elements[name].value = name === 'originalId' ? album.id : (album[name] || '')
  $('#album-heading').textContent = album.title; $('#delete-album').classList.remove('hidden'); renderAlbumPhotos(); renderAlbumList()
}

function renderAlbumPhotos() {
  const cover = $('#album-form').elements.cover.value
  $('#album-photos').innerHTML = app.albumPhotos.length ? app.albumPhotos.map((photo, index) => `<article class="photo-card">${cover === photo.url ? '<span class="cover-badge">封面</span>' : ''}<img src="${escapeHtml(assetUrl(photo.url))}" alt="照片 ${index + 1}"><input data-photo-caption="${index}" value="${escapeHtml(photo.caption || '')}" placeholder="照片说明"><div class="image-actions"><button type="button" data-set-cover="${index}">设封面</button><button type="button" data-image-action="up" data-kind="album" data-index="${index}">↑</button><button type="button" data-image-action="down" data-kind="album" data-index="${index}">↓</button><button type="button" data-image-action="remove" data-kind="album" data-index="${index}">移除</button></div></article>`).join('') : '<div class="record-empty">导入照片后会显示在这里</div>'
}

function syncAlbumCaptions() {
  $$('[data-photo-caption]').forEach((input) => {
    const photo = app.albumPhotos[Number(input.dataset.photoCaption)]
    if (photo) photo.caption = input.value
  })
}

async function saveAlbum(event) {
  event.preventDefault(); syncAlbumCaptions()
  const values = Object.fromEntries(new FormData(event.currentTarget)); const album = { id: values.id, title: values.title, description: values.description, cover: values.cover, date: values.date, photos: app.albumPhotos }
  const next = [...app.data.albums]
  if (app.activeAlbum >= 0) next[app.activeAlbum] = album; else next.unshift(album)
  const result = await api('/api/albums', { method: 'PUT', mutate: true, json: next }); app.data.albums = result.albums
  app.activeAlbum = app.data.albums.findIndex((item) => item.id === album.id); renderAll(); editAlbum(app.activeAlbum); toast('相册已保存到本地')
}

async function deleteAlbum() {
  if (app.activeAlbum < 0) return
  const album = app.data.albums[app.activeAlbum]
  if (!confirm(`删除相册「${album.title}」？图片文件会保留。`)) return
  const next = app.data.albums.filter((_, index) => index !== app.activeAlbum)
  const result = await api('/api/albums', { method: 'PUT', mutate: true, json: next }); app.data.albums = result.albums; resetAlbum(); renderAll(); toast('相册已删除，图片文件仍保留')
}

function moveImage(kind, index, action) {
  if (kind === 'album') syncAlbumCaptions()
  const array = kind === 'moment' ? app.momentImages : app.albumPhotos
  if (action === 'remove') array.splice(index, 1)
  else {
    const target = action === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= array.length) return
    const current = array[index]
    array[index] = array[target]
    array[target] = current
  }
  if (kind === 'moment') renderMomentImages()
  else renderAlbumPhotos()
}

function renderMusic() {
  $('#music-count').textContent = `${app.data.music.length} 首`
  $('#music-list').innerHTML = app.data.music.length ? app.data.music.map((song, index) => `<div class="sort-row"><b>${String(index + 1).padStart(2,'0')}</b><input data-music-id="${index}" value="${escapeHtml(song.id)}"><input data-music-label="${index}" value="${escapeHtml(song.label || '')}" placeholder="备注"><div class="row-actions"><button data-music-action="up" data-index="${index}">↑</button><button data-music-action="down" data-index="${index}">↓</button><button data-music-action="remove" data-index="${index}">×</button></div></div>`).join('') : '<div class="record-empty">歌单为空</div>'
}

function syncMusicInputs() {
  $$('[data-music-id]').forEach((input) => { app.data.music[Number(input.dataset.musicId)].id = input.value })
  $$('[data-music-label]').forEach((input) => { app.data.music[Number(input.dataset.musicLabel)].label = input.value })
}

function addMusic() {
  const id = $('#music-id').value.trim(); if (!id) return toast('请输入歌曲 ID 或链接', true)
  app.data.music.push({ id, label: $('#music-label').value.trim() }); $('#music-id').value = ''; $('#music-label').value = ''; renderMusic()
}

function musicAction(action, index) {
  syncMusicInputs()
  if (action === 'remove') app.data.music.splice(index, 1)
  else {
    const target = action === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= app.data.music.length) return
    const current = app.data.music[index]
    app.data.music[index] = app.data.music[target]
    app.data.music[target] = current
  }
  renderMusic()
}

async function saveMusic() { syncMusicInputs(); const result = await api('/api/music', { method: 'PUT', mutate: true, json: app.data.music }); app.data.music = result.music; renderMusic(); renderChanges(); toast('歌单已保存到本地') }

function renderChanges() {
  const git = app.data.git || { branch: '', changes: [] }; $('#branch-pill').textContent = git.branch || 'detached'
  const summary = $('#change-summary')
  summary.innerHTML = git.changes.length ? git.changes.map((change) => `<div class="change-row"><b>${escapeHtml(change.status)}</b><span>${escapeHtml(change.path)}</span></div>`).join('') : '<div class="record-empty">工作区干净，没有待发布内容</div>'
  $('#publish-button').disabled = !git.changes.length
}

async function openPreview() {
  const previewWindow = window.open('about:blank', '_blank')
  const button = $('#preview-button'); button.disabled = true; button.textContent = '正在启动预览…'
  try {
    const result = await api('/api/preview', { method: 'POST', mutate: true })
    if (!result.ready) throw new Error('预览服务启动超时，请稍后再试')
    if (previewWindow) {
      previewWindow.opener = null
      previewWindow.location = result.url
    } else {
      window.location.assign(result.url)
    }
  } catch (error) {
    if (previewWindow) previewWindow.close()
    throw error
  } finally { button.disabled = false; button.textContent = '打开网站预览 ↗' }
}

async function publish() {
  if (!confirm('将先执行生产构建，通过后提交并推送到 GitHub main。继续吗？')) return
  const button = $('#publish-button'); button.disabled = true; $('#publish-log').textContent = '正在创建发布任务……'
  const result = await api('/api/publish', { method: 'POST', mutate: true, json: { message: $('#commit-message').value } })
  pollJob(result.id)
}

async function pollJob(id) {
  clearTimeout(app.publishTimer)
  try {
    const job = await api(`/api/jobs/${id}`); const log = $('#publish-log'); log.textContent = job.logs || '正在准备……'; log.scrollTop = log.scrollHeight
    if (job.status === 'success' || job.status === 'failed') {
      $('#publish-button').disabled = false; await loadState(); toast(job.status === 'success' ? '发布成功，Cloudflare 正在部署' : '发布失败，请查看日志', job.status === 'failed'); return
    }
    app.publishTimer = setTimeout(() => pollJob(id), 900)
  } catch (error) { $('#publish-button').disabled = false; handleError(error) }
}

function handleError(error) { console.error(error); toast(error instanceof Error ? error.message : String(error), true) }

function bindEvents() {
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)))
  $$('[data-go]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.go)))
  $$('[data-new]').forEach((button) => button.addEventListener('click', () => {
    const kind = button.dataset.new
    setView(kind === 'moments' ? 'moments' : 'writing')
    if (kind === 'moments') resetMoment()
    else resetWriting(kind)
  }))
  $('#refresh-button').addEventListener('click', () => loadState(true).catch(handleError)); $('#preview-button').addEventListener('click', () => openPreview().catch(handleError))
  $('#feature-toggles').addEventListener('click', (event) => { const button = event.target.closest('[data-setting]'); if (button) updateSetting(button.dataset.setting).catch(handleError) })
  $$('[data-writing-kind]').forEach((button) => button.addEventListener('click', () => resetWriting(button.dataset.writingKind)))
  $('#new-writing').addEventListener('click', () => resetWriting()); $('#writing-search').addEventListener('input', renderWritingList)
  $('#writing-list').addEventListener('click', (event) => { const button = event.target.closest('[data-writing-slug]'); if (button) editWriting(button.dataset.writingSlug) })
  $('#writing-form').addEventListener('submit', (event) => saveWriting(event).catch(handleError)); $('#delete-writing').addEventListener('click', () => deleteWriting().catch(handleError))
  $('#writing-form').elements.cover.addEventListener('input', (event) => renderCoverPreview(event.target.value))
  $('#writing-cover-upload').addEventListener('change', async (event) => { try { const [url] = await uploadFiles([...event.target.files], 'content'); $('#writing-form').elements.cover.value = url; renderCoverPreview(url); toast('封面已导入') } catch (error) { handleError(error) } finally { event.target.value = '' } })
  $('#new-moment').addEventListener('click', resetMoment); $('#moment-list').addEventListener('click', (event) => { const button = event.target.closest('[data-moment-slug]'); if (button) editMoment(button.dataset.momentSlug) })
  $('#moment-form').addEventListener('submit', (event) => saveMoment(event).catch(handleError)); $('#delete-moment').addEventListener('click', () => deleteMoment().catch(handleError))
  $('#moment-images-upload').addEventListener('change', async (event) => { try { app.momentImages.push(...await uploadFiles([...event.target.files], 'content')); renderMomentImages(); toast('动态图片已导入') } catch (error) { handleError(error) } finally { event.target.value = '' } })
  $('#new-album').addEventListener('click', resetAlbum); $('#album-list').addEventListener('click', (event) => { const button = event.target.closest('[data-album-index]'); if (button) editAlbum(Number(button.dataset.albumIndex)) })
  $('#album-form').addEventListener('submit', (event) => saveAlbum(event).catch(handleError)); $('#delete-album').addEventListener('click', () => deleteAlbum().catch(handleError)); $('#album-form').elements.cover.addEventListener('input', renderAlbumPhotos)
  $('#album-photos-upload').addEventListener('change', async (event) => { try { app.albumPhotos.push(...(await uploadFiles([...event.target.files], 'photos')).map((url) => ({ url, caption: '' }))); renderAlbumPhotos(); toast('照片已导入并压缩') } catch (error) { handleError(error) } finally { event.target.value = '' } })
  document.addEventListener('click', (event) => {
    const imageButton = event.target.closest('[data-image-action]'); if (imageButton) moveImage(imageButton.dataset.kind, Number(imageButton.dataset.index), imageButton.dataset.imageAction)
    const coverButton = event.target.closest('[data-set-cover]'); if (coverButton) { syncAlbumCaptions(); $('#album-form').elements.cover.value = app.albumPhotos[Number(coverButton.dataset.setCover)].url; renderAlbumPhotos() }
    const musicButton = event.target.closest('[data-music-action]'); if (musicButton) musicAction(musicButton.dataset.musicAction, Number(musicButton.dataset.index))
  })
  $('#add-music').addEventListener('click', addMusic); $('#save-music').addEventListener('click', () => saveMusic().catch(handleError))
  $('#reload-changes').addEventListener('click', () => loadState(true).catch(handleError)); $('#publish-button').addEventListener('click', () => publish().catch(handleError))
}

async function boot() {
  const session = await api('/api/session'); app.token = session.token; app.previewUrl = session.previewUrl
  bindEvents(); await loadState(); resetWriting(); resetMoment(); resetAlbum()
}

boot().catch(handleError)
