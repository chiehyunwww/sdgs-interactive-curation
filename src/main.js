import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './style.css';
import { initStoreFinder } from './store-finder.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  mobileNav.hidden = isOpen;
  document.body.classList.toggle('menu-open', !isOpen);
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle?.setAttribute('aria-expanded', 'false');
    mobileNav.hidden = true;
    document.body.classList.remove('menu-open');
  });
});

if (!reducedMotion) {
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro.from('.hero-meta', { y: 14, autoAlpha: 0, duration: 0.7 });
  intro.from('.hero-copy .eyebrow', { y: 20, autoAlpha: 0, duration: 0.55 }, '-=0.32');
  intro.from('.hero h1', { y: 46, autoAlpha: 0, duration: 0.85 }, '-=0.24');
  intro.from('.hero-intro, .hero-store-link, .round-link', { y: 18, autoAlpha: 0, duration: 0.6, stagger: 0.12 }, '-=0.42');
  intro.from('.hero-art', { scale: 0.94, rotate: 2, autoAlpha: 0, duration: 1.05 }, '-=0.95');
  intro.from('.art-sticker', { scale: 0.3, rotate: -24, autoAlpha: 0, duration: 0.55, ease: 'back.out(1.7)' }, '-=0.35');

  gsap.to('.orbit-one', { rotate: 360, duration: 90, ease: 'none', repeat: -1 });
  gsap.to('.orbit-two', { rotate: -360, duration: 120, ease: 'none', repeat: -1 });

  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (elements) => gsap.fromTo(elements,
      { y: 28, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.75, stagger: 0.12, ease: 'power2.out', overwrite: true },
    ),
  });

  gsap.utils.toArray('.action-row').forEach((row) => {
    gsap.from(row.querySelector('.action-illustration'), {
      rotate: -5,
      scale: 0.85,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'back.out(1.3)',
      scrollTrigger: { trigger: row, start: 'top 82%', once: true },
    });
  });
}

const storySteps = [...document.querySelectorAll('[data-story-step]')];
const storyScenes = [...document.querySelectorAll('[data-scene]')];
const storyCount = document.querySelector('#story-step-count');

function activateStoryStep(index) {
  storySteps.forEach((step, i) => step.classList.toggle('is-current', i === index));
  storyScenes.forEach((scene, i) => scene.classList.toggle('is-active', i === index));
  if (storyCount) storyCount.textContent = `${String(index + 1).padStart(2, '0')} — ${String(storySteps.length).padStart(2, '0')}`;
}

if (storySteps.length && !reducedMotion) {
  storySteps.forEach((step, index) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => activateStoryStep(index),
      onEnterBack: () => activateStoryStep(index),
    });
  });
}

const models = {
  auto: {
    item: '免洗餐具一組', price: '已附上', total: '沿用原本預設', stamp: '預設<br>自動',
    reflection: '當免洗餐具自動附上，什麼都不做就等於選擇了它。',
  },
  ask: {
    item: '依需求選擇', price: '由你決定', total: '點餐時先詢問', stamp: '選擇<br>由你',
    reflection: '選項清楚出現，才有機會做出符合當下需要的選擇。',
  },
  loop: {
    item: '循環餐具借用', price: '借用 / 歸還', total: '加入循環服務', stamp: '循環<br>使用',
    reflection: '當借還與清洗流程都被設計好，重複使用也能順路完成。',
  },
};

const receiptItem = document.querySelector('#receipt-item');
const receiptPrice = document.querySelector('#receipt-price');
const receiptTotal = document.querySelector('#receipt-total');
const receiptStamp = document.querySelector('#receipt-stamp');
const reflection = document.querySelector('#model-reflection');
const receipt = document.querySelector('.receipt-wrap');

document.querySelectorAll('.model-button').forEach((button) => {
  button.addEventListener('click', () => {
    const model = models[button.dataset.model];
    if (!model) return;
    document.querySelectorAll('.model-button').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    receiptItem.textContent = model.item;
    receiptPrice.textContent = model.price;
    receiptTotal.textContent = model.total;
    receiptStamp.innerHTML = model.stamp;
    reflection.textContent = model.reflection;
    if (!reducedMotion && receipt) {
      gsap.fromTo(receipt, { y: 8, autoAlpha: 0.72 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out' });
    }
  });
});

const feedbackForm = document.querySelector('#feedback-form');
const feedbackStatus = document.querySelector('#form-status');
const messageField = document.querySelector('#feedback-message');
const charCount = document.querySelector('#char-count');
const endpoint = (import.meta.env.VITE_APPS_SCRIPT_URL || '').trim();
const sink = document.querySelector('iframe[name="apps-script-sink"]');
let activeNonce = '';
let responseTimer;

messageField?.addEventListener('input', () => {
  if (charCount) charCount.textContent = `${messageField.value.length} / 300`;
});

function isValidAppsScriptUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:'
      && parsed.hostname === 'script.google.com'
      && /^\/macros\/s\/[\w-]+\/exec\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

if (!endpoint || !isValidAppsScriptUrl(endpoint)) {
  feedbackStatus.textContent = '觀展表單尚未連接 Google Apps Script。完成瀏覽器端部署並設定 VITE_APPS_SCRIPT_URL 後，回應才會寫入試算表。';
}

feedbackForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!endpoint || !isValidAppsScriptUrl(endpoint)) {
    feedbackStatus.textContent = '目前還沒有可用的回饋端點；這次內容沒有送出。';
    return;
  }

  const formData = new FormData(feedbackForm);
  if (String(formData.get('website') || '').trim()) {
    feedbackStatus.textContent = '已收到回應。謝謝你參與這場展覽。';
    feedbackForm.reset();
    if (charCount) charCount.textContent = '0 / 300';
    return;
  }

  const payload = {
    action: String(formData.get('action') || ''),
    message: String(formData.get('message') || '').trim().slice(0, 300),
  };
  activeNonce = crypto.randomUUID();
  const payloadField = document.createElement('input');
  payloadField.type = 'hidden';
  payloadField.name = 'payload';
  payloadField.value = JSON.stringify(payload);
  feedbackForm.append(payloadField);

  const nonceField = document.createElement('input');
  nonceField.type = 'hidden';
  nonceField.name = 'nonce';
  nonceField.value = activeNonce;
  feedbackForm.append(nonceField);

  feedbackForm.action = endpoint;
  feedbackForm.target = sink.name;
  feedbackStatus.textContent = '正在送出回應……';
  feedbackForm.querySelector('.submit-button').disabled = true;
  feedbackForm.submit();
  payloadField.remove();
  nonceField.remove();

  window.clearTimeout(responseTimer);
  responseTimer = window.setTimeout(() => {
    if (activeNonce) {
      feedbackStatus.textContent = '尚未收到試算表回覆。請稍後查看 Apps Script 部署設定，或重新送出。';
      feedbackForm.querySelector('.submit-button').disabled = false;
    }
  }, 20000);
});

window.addEventListener('message', (event) => {
  const trustedOrigin = event.origin === 'https://script.google.com'
    || event.origin.endsWith('.googleusercontent.com');
  if (!trustedOrigin || !activeNonce || event.data?.type !== 'sdgs-feedback-response' || event.data?.nonce !== activeNonce) return;

  window.clearTimeout(responseTimer);
  if (event.data.status === 'ok') {
    feedbackStatus.textContent = '回應已寫入試算表。謝謝你，讓展覽繼續發生。';
    feedbackForm.reset();
    if (charCount) charCount.textContent = '0 / 300';
  } else {
    feedbackStatus.textContent = '這次沒有成功寫入試算表，請稍後再試。';
  }
  activeNonce = '';
  feedbackForm.querySelector('.submit-button').disabled = false;
});

initStoreFinder({ gsap, ScrollTrigger, reducedMotion });
