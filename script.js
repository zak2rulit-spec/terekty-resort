(() => {
  const PRICE = 15000, PREPAY = 0.30, ROOMS_MAX = 20, PER_ROOM = 2, MAX_NIGHTS = 30;
  const WA = '77776433336';
  const body = document.body, hdr = document.getElementById('hdr'), burger = document.getElementById('burger');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + ' ₸';

  /* ---------- menu ---------- */
  const closeMenu = () => { body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); body.style.overflow = ''; };
  burger.addEventListener('click', () => {
    const o = body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(o));
    body.style.overflow = o ? 'hidden' : '';
  });
  document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- reveal ---------- */
  const targets = document.querySelectorAll('.reveal, .reveal-img');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(t => io.observe(t));
  } else targets.forEach(t => t.classList.add('in'));

  /* ---------- counters ---------- */
  const count = el => {
    const end = +el.dataset.count; if (!end || reduce) return;
    const t0 = performance.now(), dur = 1400;
    const tick = now => { const p = Math.min((now - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { count(e.target); co.unobserve(e.target); } }), { threshold: .6 });
    document.querySelectorAll('[data-count]').forEach(el => co.observe(el));
  }

  /* ---------- scroll effects ---------- */
  const links = [...document.querySelectorAll('.nav a[href^="#"]:not(.nav__mob-cta)')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const heroBg = document.querySelector('[data-parallax]');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      hdr.classList.toggle('is-solid', y > 40);
      let cur = null; secs.forEach(s => { if (s.offsetTop <= y + 140) cur = s.id; });
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
      if (heroBg && !reduce && y < window.innerHeight) heroBg.style.transform = `translate3d(0,${y * .3}px,0)`;
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- seasons switch ---------- */
  const sw = document.querySelector('.switch');
  const setSeason = s => {
    sw.classList.toggle('is-winter', s === 'winter');
    sw.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.s === s)));
    document.querySelectorAll('[data-season]').forEach(i => i.classList.toggle('is-on', i.dataset.season === s));
    document.querySelectorAll('[data-copy]').forEach(c => { c.hidden = c.dataset.copy !== s; });
  };
  sw.querySelectorAll('button').forEach(b => b.addEventListener('click', () => setSeason(b.dataset.s)));
  const m = new Date().getMonth();
  setSeason(m >= 10 || m <= 2 ? 'winter' : 'summer');

  /* ---------- dates helpers ---------- */
  const iso = d => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const maxDate = new Date(today); maxDate.setFullYear(today.getFullYear() + 1);
  document.querySelectorAll('input[type="date"]').forEach(inp => { inp.min = iso(today); inp.max = iso(maxDate); });

  /* ---------- booking form ---------- */
  const form = document.getElementById('form'), f = form.elements;
  const err = document.getElementById('err');
  const sumLabel = document.getElementById('sumLabel'), sumTotal = document.getElementById('sumTotal'), sumPre = document.getElementById('sumPre');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  f.in.addEventListener('change', () => {
    if (!f.in.value) return;
    const next = new Date(f.in.value + 'T00:00'); next.setDate(next.getDate() + 1);
    f.out.min = iso(next);
    if (!f.out.value || f.out.value <= f.in.value) f.out.value = iso(next);
  });

  const syncRooms = () => {
    let g = clamp(parseInt(f.guests.value, 10) || 1, 1, ROOMS_MAX * PER_ROOM);
    let r = clamp(parseInt(f.rooms.value, 10) || 1, 1, ROOMS_MAX);
    if (r < Math.ceil(g / PER_ROOM)) r = Math.ceil(g / PER_ROOM);
    f.guests.value = g; f.rooms.value = r;
  };
  form.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
    const [name, d] = b.dataset.step.split(':');
    f[name].value = (parseInt(f[name].value, 10) || 0) + +d;
    if (name === 'rooms') { f.rooms.value = clamp(+f.rooms.value, 1, ROOMS_MAX); f.guests.value = Math.min(+f.guests.value, f.rooms.value * PER_ROOM); }
    syncRooms(); calc();
  }));
  f.guests.addEventListener('change', () => { syncRooms(); calc(); });
  f.rooms.addEventListener('change', () => { syncRooms(); calc(); });

  function calc(showErrors) {
    const res = { ok: false };
    if (!f.in.value || !f.out.value) { sumLabel.textContent = 'Выберите даты'; sumTotal.textContent = '—'; sumPre.textContent = '—'; if (showErrors) res.msg = 'выберите даты заезда и выезда'; return res; }
    const a = new Date(f.in.value + 'T00:00'), b = new Date(f.out.value + 'T00:00');
    const nights = Math.round((b - a) / 864e5);
    if (a < today) { res.msg = 'дата заезда не может быть в прошлом'; }
    else if (nights < 1) { res.msg = 'дата выезда должна быть позже заезда'; }
    else if (nights > MAX_NIGHTS) { res.msg = `онлайн-заявка — до ${MAX_NIGHTS} ночей, для длительного проживания позвоните нам`; }
    if (res.msg) { sumLabel.textContent = 'Проверьте даты'; sumTotal.textContent = '—'; sumPre.textContent = '—'; err.textContent = 'Пожалуйста, ' + res.msg + '.'; return res; }
    const rooms = +f.rooms.value, total = nights * rooms * PRICE, pre = Math.round(total * PREPAY);
    sumLabel.textContent = `${nights} ${plural(nights, 'ночь', 'ночи', 'ночей')} × ${rooms} ${plural(rooms, 'номер', 'номера', 'номеров')}`;
    sumTotal.textContent = fmt(total); sumPre.textContent = fmt(pre);
    if (!showErrors) err.textContent = '';
    return { ok: true, nights, rooms, total, pre };
  }
  const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };
  [f.in, f.out].forEach(i => i.addEventListener('change', () => calc()));

  /* phone mask */
  f.phone.addEventListener('input', () => {
    let d = f.phone.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d && d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    const p = [d.slice(0, 1), d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)].filter(Boolean);
    f.phone.value = p.length ? '+' + p.join(' ') : '';
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    [f.name, f.phone, f.in, f.out].forEach(i => i.classList.remove('bad'));
    err.style.color = '';
    const c = calc(true);
    const problems = [];
    if (!c.ok) { problems.push(c.msg); f.in.classList.add('bad'); f.out.classList.add('bad'); }
    if (f.name.value.trim().length < 2) { problems.push('укажите имя'); f.name.classList.add('bad'); }
    if (f.phone.value.replace(/\D/g, '').length !== 11) { problems.push('введите телефон полностью'); f.phone.classList.add('bad'); }
    if (problems.length) { err.textContent = 'Пожалуйста, ' + problems.join(', ') + '.'; return; }
    const text = [
      'Здравствуйте! Хочу забронировать Terekty Resort.', '',
      'Имя: ' + f.name.value.trim(),
      'Телефон: ' + f.phone.value,
      'Заезд: ' + f.in.value.split('-').reverse().join('.'),
      'Выезд: ' + f.out.value.split('-').reverse().join('.'),
      'Гостей: ' + f.guests.value + ', номеров: ' + c.rooms,
      'Стоимость: ' + fmt(c.total),
      'Предоплата 30%: ' + fmt(c.pre)
    ].join('\n');
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    err.style.color = '#2e7d4f';
    err.textContent = 'Открываем WhatsApp — отправьте сообщение администратору.';
  });

  /* ---------- quick bar → form ---------- */
  document.getElementById('qbar').addEventListener('submit', e => {
    e.preventDefault();
    const q = e.target.elements;
    if (q.in.value) { f.in.value = q.in.value; f.in.dispatchEvent(new Event('change')); }
    if (q.out.value && q.out.value > f.in.value) f.out.value = q.out.value;
    f.guests.value = q.guests.value; f.rooms.value = 1; syncRooms(); calc();
    document.getElementById('booking').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => f.name.focus({ preventScroll: true }), 700);
  });
  const qb = document.getElementById('qbar').elements;
  qb.in.addEventListener('change', () => { if (!qb.in.value) return; const n = new Date(qb.in.value + 'T00:00'); n.setDate(n.getDate() + 1); qb.out.min = iso(n); if (!qb.out.value || qb.out.value <= qb.in.value) qb.out.value = iso(n); });
  qb.in.value = iso(tomorrow); qb.in.dispatchEvent(new Event('change'));
  const t2 = new Date(tomorrow); t2.setDate(t2.getDate() + 2); qb.out.value = iso(t2);
})();
