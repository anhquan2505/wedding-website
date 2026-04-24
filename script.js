/* ============================================================
   Wedding Website — script.js

   NHẠC NỀN:
   Thêm file nhạc vào thư mục music/ với tên wedding.mp3
   Có thể dùng nhạc không bản quyền từ:
   - https://pixabay.com/music/search/wedding/
   - https://freemusicarchive.org

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
  const opening    = document.getElementById('opening');
  const openingBtn = document.getElementById('openingBtn');
  const site       = document.getElementById('site');
  const musicToggle = document.getElementById('musicToggle');
  const bgMusic    = document.getElementById('bgMusic');

  if (openingBtn) {
    openingBtn.addEventListener('click', () => {
      // Mở thiệp
      opening.classList.add('hidden');
      site.classList.add('visible');
      site.removeAttribute('aria-hidden');

      // Hiện nút nhạc
      if (musicToggle) musicToggle.classList.add('visible');

      // Thử phát nhạc (cần user interaction — đây là thời điểm hợp lệ)
      tryPlayMusic();
    });
  }

  // ── NHẠC NỀN ────────────────────────────────────────────────
  let isPlaying = false;

  function tryPlayMusic() {
    if (!bgMusic) return;
    bgMusic.volume = 0.5;
    bgMusic.play()
      .then(() => {
        isPlaying = true;
        updateMusicUI();
      })
      .catch(() => {
        // File chưa có hoặc trình duyệt chặn → bỏ qua
        isPlaying = false;
      });
  }

  function updateMusicUI() {
    if (!musicToggle) return;
    musicToggle.classList.toggle('playing', isPlaying);
    musicToggle.setAttribute('aria-label', isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền');
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', () => {
      if (!bgMusic) return;
      if (isPlaying) {
        bgMusic.pause();
        isPlaying = false;
      } else {
        bgMusic.play().catch(() => {});
        isPlaying = true;
      }
      updateMusicUI();
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
})();
