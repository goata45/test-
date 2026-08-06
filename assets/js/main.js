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
  const carousel = document.getElementById('quoteCarousel');
  const track = document.getElementById('quoteTrack');
  const slides = Array.from(track.querySelectorAll('.quote-slide'));
  const dotsWrap = document.getElementById('quoteDots');
  const announce = document.getElementById('quoteAnnounce');
  const prevBtn = document.getElementById('quotePrev');
  const nextBtn = document.getElementById('quoteNext');
  let active = 0;
  let timer;
  let paused = false;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show reflection ${i + 1} of ${slides.length}`);
    dot.addEventListener('click', () => { goTo(i); resetTimer(); });
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function goTo(i) {
    slides[active].classList.remove('active');
    dots[active].classList.remove('active');
    dots[active].removeAttribute('aria-current');
    active = (i + slides.length) % slides.length;
    slides[active].classList.add('active');
    dots[active].classList.add('active');
    dots[active].setAttribute('aria-current', 'true');
    announce.textContent = `Reflection ${active + 1} of ${slides.length}: ${slides[active].querySelector('cite').textContent}`;
  }
  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => { if (!paused) goTo(active + 1); }, 6000);
  }
  prevBtn.addEventListener('click', () => { goTo(active - 1); resetTimer(); });
  nextBtn.addEventListener('click', () => { goTo(active + 1); resetTimer(); });
  carousel.addEventListener('mouseenter', () => { paused = true; });
  carousel.addEventListener('mouseleave', () => { paused = false; });
  carousel.addEventListener('focusin', () => { paused = true; });
  carousel.addEventListener('focusout', () => { paused = false; });
  goTo(0);
  resetTimer();

  /* ---------- Contact form ----------
     No backend is deployed with this static site, so submissions can't be
     POSTed anywhere yet. To wire this to a real inbox, set FORM_ENDPOINT to
     a hosted form service (Formspree, Netlify Forms, Getform, etc.) — the
     endpoint receives a normal fetch POST. Until then, submitting opens the
     visitor's email client with the message pre-filled to the shop's real
     inbox, so leads are never silently dropped. */
  const FORM_ENDPOINT = '';
  const BUSINESS_EMAIL = 'info@dncustomupholstery.ca'; // placeholder — replace with the real inbox to receive leads

  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      note.textContent = 'Please fill in your name, email and a short message.';
      form.reportValidity();
      return;
    }

    const data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
    };

    if (FORM_ENDPOINT) {
      submitBtn.disabled = true;
      note.textContent = 'Sending…';
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Request failed');
        note.textContent = `Thank you, ${data.name.split(' ')[0]} — we'll be in touch shortly. You can also reach us directly at (416) 243-5451.`;
        form.reset();
      } catch (err) {
        note.textContent = `Something went wrong sending that. Please call us directly at (416) 243-5451, or email ${BUSINESS_EMAIL}.`;
      } finally {
        submitBtn.disabled = false;
      }
      return;
    }

    const subject = encodeURIComponent(`Consultation request from ${data.name}`);
    const body = encodeURIComponent(
      `Name: ${data.name}\nPhone: ${data.phone || '—'}\nEmail: ${data.email}\n\nProject details:\n${data.message}`
    );
    window.location.href = `mailto:${BUSINESS_EMAIL}?subject=${subject}&body=${body}`;
    note.textContent = `Opening your email app to send this to us — if nothing opens, call (416) 243-5451 or email ${BUSINESS_EMAIL} directly.`;
  });

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
