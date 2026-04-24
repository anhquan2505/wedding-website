/* ============================================================
   Wedding Website — script.js

   NHẠC NỀN: ZingMP3 embed — bài hát IW7ADEAC
   Khách click "Xem thiệp" → music bar hiện ra ở cuối trang.
   Khách tự click play trên player ZingMP3.

   GOOGLE SHEETS SETUP (nếu chưa làm):
   1. Vào https://script.google.com → New project
   2. Dán code sau:

      const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';

      function doPost(e) {
        const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(['Thời gian','Họ tên','SĐT','Email','Tham dự','Số người','Khách của','Ghi chú']);
          sheet.getRange(1,1,1,8).setFontWeight('bold');
        }
        sheet.appendRow([
          new Date().toLocaleString('vi-VN'),
          e.parameter.name, e.parameter.phone, e.parameter.email,
          e.parameter.attend, e.parameter.guests,
          e.parameter.side, e.parameter.note
        ]);
        return ContentService.createTextOutput('OK');
      }

   3. Deploy → New deployment → Web app → Anyone → Copy URL
   4. Dán URL vào data-sheet-url trong index.html
   ============================================================ */

(function () {
  'use strict';

  // ── OPENING OVERLAY ─────────────────────────────────────────
  const opening      = document.getElementById('opening');
  const openingBtn   = document.getElementById('openingBtn');
  const site         = document.getElementById('site');
  const musicToggle  = document.getElementById('musicToggle');
  const bgMusic      = document.getElementById('bgMusic');

  if (openingBtn) {
    openingBtn.addEventListener('click', () => {
      opening.classList.add('hidden');
      site.classList.add('visible');
      site.removeAttribute('aria-hidden');
      if (musicToggle) musicToggle.classList.add('visible');
      tryPlay();
    });
  }

  // ── NHẠC NỀN (local file) ────────────────────────────────────
  let playing = false;

  function tryPlay() {
    if (!bgMusic) return;
    bgMusic.volume = 0.45;
    bgMusic.play()
      .then(() => { playing = true; syncMusicBtn(); })
      .catch(() => { playing = false; });
  }

  function syncMusicBtn() {
    if (!musicToggle) return;
    musicToggle.textContent  = playing ? '♫' : '♪';
    musicToggle.setAttribute('aria-label', playing ? 'Tắt nhạc' : 'Bật nhạc');
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', () => {
      if (!bgMusic) return;
      if (playing) { bgMusic.pause(); playing = false; }
      else { bgMusic.play().catch(() => {}); playing = true; }
      syncMusicBtn();
    });
  }

  // ── COUNTDOWN ───────────────────────────────────────────────
  const WEDDING_DATE = new Date('2026-05-10T17:00:00+07:00');

  const countdownEls = {
    days:    document.getElementById('days'),
    hours:   document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
  };

  function pad(n) { return String(n).padStart(2, '0'); }

  function updateCountdown() {
    const diff = WEDDING_DATE - Date.now();
    if (diff <= 0) {
      Object.values(countdownEls).forEach((el) => { if (el) el.textContent = '00'; });
      return;
    }
    const s = Math.floor(diff / 1000);
    if (countdownEls.days)    countdownEls.days.textContent    = pad(Math.floor(s / 86400));
    if (countdownEls.hours)   countdownEls.hours.textContent   = pad(Math.floor((s % 86400) / 3600));
    if (countdownEls.minutes) countdownEls.minutes.textContent = pad(Math.floor((s % 3600) / 60));
    if (countdownEls.seconds) countdownEls.seconds.textContent = pad(s % 60);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ── NAV ─────────────────────────────────────────────────────
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const navLinks = document.querySelector('.nav__links');

  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── SCROLL REVEAL ────────────────────────────────────────────
  const revealTargets = document.querySelectorAll(
    '.story__grid, .details__card, .timeline__item, .family__side, ' +
    '.gallery__item, .rsvp__form, .calendar, .countdown'
  );

  revealTargets.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealTargets.forEach((el) => observer.observe(el));

  // ── RSVP → GOOGLE SHEETS ────────────────────────────────────
  const form       = document.getElementById('rsvpForm');
  const successMsg = document.getElementById('formSuccess');
  const submitBtn  = form ? form.querySelector('.form__submit') : null;

  if (!form) return;

  const SHEET_URL = form.dataset.sheetUrl || '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      name:    form.elements['name'].value.trim(),
      phone:   form.elements['phone'].value.trim(),
      email:   form.elements['email'].value.trim(),
      attend:  form.elements['attend'].value,
      guests:  form.elements['guests'].value,
      side:    form.elements['side'].value,
      note:    form.elements['note'].value.trim(),
    };

    if (!data.name || !data.attend) {
      alert('Vui lòng điền họ tên và xác nhận tham dự.');
      return;
    }

    if (!SHEET_URL || SHEET_URL.includes('YOUR_APPS_SCRIPT_ID')) {
      showSuccess();
      return;
    }

    setSubmitting(true);

    try {
      await fetch(SHEET_URL, {
        method: 'POST',
        mode:   'no-cors',
        body:   new URLSearchParams(data),
      });
      form.reset();
      showSuccess();
    } catch {
      alert('Không thể gửi. Vui lòng thử lại hoặc liên hệ trực tiếp.');
    } finally {
      setSubmitting(false);
    }
  });

  function setSubmitting(loading) {
    if (!submitBtn) return;
    submitBtn.disabled    = loading;
    submitBtn.textContent = loading ? 'Đang gửi...' : 'Gửi xác nhận';
  }

  function showSuccess() {
    if (!successMsg) return;
    successMsg.style.display = 'block';
    successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── SLIDESHOW ────────────────────────────────────────────────
  const slideshow = document.getElementById('photoSlideshow');

  if (slideshow) {
    const slides      = Array.from(slideshow.querySelectorAll('.slide'));
    const dotsWrap    = document.getElementById('slideDots');
    const counter     = document.getElementById('slideCounter');
    const btnPrev     = document.getElementById('slidePrev');
    const btnNext     = document.getElementById('slideNext');
    let   current     = 0;
    let   autoTimer;

    // Tạo dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'slideshow__dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Ảnh ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    const dots = Array.from(dotsWrap.querySelectorAll('.slideshow__dot'));

    function goTo(index) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
      if (counter) counter.textContent = `${current + 1} / ${slides.length}`;
      resetAuto();
    }

    function resetAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => goTo(current + 1), 5000);
    }

    if (btnPrev) btnPrev.addEventListener('click', () => goTo(current - 1));
    if (btnNext) btnNext.addEventListener('click', () => goTo(current + 1));

    // Swipe support (mobile)
    let touchStartX = 0;
    slideshow.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    slideshow.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
    });

    if (counter) counter.textContent = `1 / ${slides.length}`;
    resetAuto();
  }
})();
