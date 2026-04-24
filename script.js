/* ============================================================
   Wedding Website — script.js

   SETUP GOOGLE SHEETS (làm 1 lần):
   1. Vào https://script.google.com → New project
   2. Xoá code cũ, dán đoạn này vào:

      const SPREADSHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID_HERE';

      function doPost(e) {
        // openById thay vì getActiveSpreadsheet() vì Web App không có "active" sheet
        const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();

        if (sheet.getLastRow() === 0) {
          sheet.appendRow(['Thời gian', 'Họ tên', 'SĐT', 'Email', 'Tham dự', 'Số người', 'Ghi chú']);
          sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
        }

        sheet.appendRow([
          new Date().toLocaleString('vi-VN'),
          e.parameter.name,
          e.parameter.phone,
          e.parameter.email,
          e.parameter.attend,
          e.parameter.guests,
          e.parameter.note
        ]);
        return ContentService.createTextOutput('OK');
      }

   3. File → Save → Deploy → New deployment
      - Type: Web app
      - Execute as: Me
      - Who has access: Anyone
   4. Authorise → Copy the Web App URL
   5. Dán URL vào data-sheet-url trong index.html

   ============================================================ */

(function () {
  'use strict';

  // ── Countdown ──────────────────────────────────────────────
  const WEDDING_DATE = new Date('2026-05-10T17:00:00+07:00');

  const countdownEls = {
    days:    document.getElementById('days'),
    hours:   document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
  };

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateCountdown() {
    const diff = WEDDING_DATE - Date.now();

    if (diff <= 0) {
      Object.values(countdownEls).forEach((el) => { if (el) el.textContent = '00'; });
      return;
    }

    const totalSec = Math.floor(diff / 1000);
    const days    = Math.floor(totalSec / 86400);
    const hours   = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (countdownEls.days)    countdownEls.days.textContent    = pad(days);
    if (countdownEls.hours)   countdownEls.hours.textContent   = pad(hours);
    if (countdownEls.minutes) countdownEls.minutes.textContent = pad(minutes);
    if (countdownEls.seconds) countdownEls.seconds.textContent = pad(seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ── Nav scroll effect ───────────────────────────────────────
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // ── Mobile burger menu ──────────────────────────────────────
  const burger   = document.getElementById('navBurger');
  const navLinks = document.querySelector('.nav__links');

  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Scroll reveal ───────────────────────────────────────────
  const revealTargets = document.querySelectorAll(
    '.story__grid, .details__card, .family__side, .gallery__item, .rsvp__form'
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

  // ── RSVP → Google Sheets ────────────────────────────────────
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
      note:    form.elements['note'].value.trim(),
    };

    if (!data.name || !data.attend) {
      alert('Vui lòng điền họ tên và xác nhận tham dự.');
      return;
    }

    // Google Apps Script chưa được cấu hình → hiện thông báo dev
    if (!SHEET_URL || SHEET_URL.includes('YOUR_APPS_SCRIPT_ID')) {
      showSuccess();
      return;
    }

    setSubmitting(true);

    try {
      // Dùng URLSearchParams vì Apps Script đọc e.parameter (form-encoded)
      // no-cors vì Apps Script không hỗ trợ CORS preflight cho doPost
      await fetch(SHEET_URL, {
        method:  'POST',
        mode:    'no-cors',
        body:    new URLSearchParams(data),
      });

      // Với no-cors không đọc được response — coi là thành công
      form.reset();
      showSuccess();
    } catch {
      alert('Không thể gửi. Vui lòng thử lại hoặc liên hệ trực tiếp với chúng tôi.');
    } finally {
      setSubmitting(false);
    }
  });

  function setSubmitting(loading) {
    if (!submitBtn) return;
    submitBtn.disabled   = loading;
    submitBtn.textContent = loading ? 'Đang gửi...' : 'Gửi xác nhận';
  }

  function showSuccess() {
    if (!successMsg) return;
    successMsg.style.display = 'block';
    successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
})();
