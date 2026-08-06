(() => {
  'use strict';

  /* ---------- Sticky header ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', () => {
    const open = header.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  mainNav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      header.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Active nav link on scroll ---------- */
  const navLinks = Array.from(mainNav.querySelectorAll('a'));
  const sections = navLinks
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = '#' + entry.target.id;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => sectionObserver.observe(s));

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in-view'), (i % 4) * 90);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- Before / after slider ---------- */
  const slider = document.getElementById('baSlider');
  const before = document.getElementById('baBefore');
  const handle = document.getElementById('baHandle');

  function setSlider(percent) {
    const p = Math.min(100, Math.max(0, percent));
    before.style.width = p + '%';
    handle.style.left = p + '%';
    handle.setAttribute('aria-valuenow', String(Math.round(p)));
  }

  function posFromEvent(clientX) {
    const rect = slider.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  let dragging = false;
  slider.addEventListener('pointerdown', (e) => {
    dragging = true;
    slider.setPointerCapture(e.pointerId);
    setSlider(posFromEvent(e.clientX));
  });
  slider.addEventListener('pointermove', (e) => {
    if (dragging) setSlider(posFromEvent(e.clientX));
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
    slider.addEventListener(ev, () => { dragging = false; })
  );
  handle.addEventListener('keydown', (e) => {
    const current = parseFloat(handle.style.left) || 50;
    if (e.key === 'ArrowLeft') setSlider(current - 5);
    if (e.key === 'ArrowRight') setSlider(current + 5);
  });
  setSlider(50);

  /* ---------- Testimonial carousel ---------- */
  const track = document.getElementById('quoteTrack');
  const slides = Array.from(track.querySelectorAll('.quote-slide'));
  const dotsWrap = document.getElementById('quoteDots');
  let active = 0;
  let timer;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Show reflection ${i + 1}`);
    dot.addEventListener('click', () => { goTo(i); resetTimer(); });
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function goTo(i) {
    slides[active].classList.remove('active');
    dots[active].classList.remove('active');
    active = (i + slides.length) % slides.length;
    slides[active].classList.add('active');
    dots[active].classList.add('active');
  }
  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(active + 1), 6000);
  }
  goTo(0);
  resetTimer();

  /* ---------- Contact form (front-end demo) ---------- */
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      note.textContent = 'Please fill in your name, email and a short message.';
      form.reportValidity();
      return;
    }
    note.textContent = `Thank you — we'll be in touch shortly. You can also reach us directly at (416) 243-5451.`;
    form.reset();
  });

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
