const DATA_API = 'https://data.moenv.gov.tw/api/v2/gis_p_11?api_key=b7df779e-71a6-4148-8379-5afbd441d803&format=JSON&limit=1000&sort=ImportDate+desc';
const PAGE_SIZE = 1000;
const RESULTS_PER_PAGE = 12;

const byId = (id) => document.getElementById(id);

function makeLink(label, href, className, { external = false, ariaLabel = '' } = {}) {
  const link = document.createElement('a');
  link.className = className;
  link.href = href;
  link.textContent = label;
  if (ariaLabel) link.setAttribute('aria-label', ariaLabel);
  if (external) {
    link.target = '_blank';
    link.rel = 'noreferrer';
  }
  return link;
}

function distanceBetween(latA, lonA, latB, lonB) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(latB - latA);
  const deltaLon = toRadians(lonB - lonA);
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(deltaLon / 2) ** 2;
  const boundedHaversine = Math.min(1, Math.max(0, haversine));
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(boundedHaversine), Math.sqrt(1 - boundedHaversine));
}

async function fetchAllStores() {
  const records = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const offsets = [0, 1, 2, 3].map((page) => offset + page * PAGE_SIZE);
    const pages = await Promise.all(offsets.map(async (pageOffset) => {
      const response = await fetch(`${DATA_API}&offset=${pageOffset}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`資料服務回應 ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('資料格式不正確');
      return data;
    }));

    pages.forEach((page) => records.push(...page));
    hasMore = pages.every((page) => page.length === PAGE_SIZE);
    offset += offsets.length * PAGE_SIZE;
    if (offset > 100000) throw new Error('資料頁數超出預期');
  }

  const seen = new Set();
  return records.filter((record) => {
    const identity = record.restid || `${record.name}|${record.address}`;
    if (!record.name || !record.address || seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function storeCard(store, distanceKm) {
  const article = document.createElement('article');
  article.className = 'store-card';

  const heading = document.createElement('div');
  heading.className = 'store-card-heading';
  const identity = document.createElement('div');
  identity.className = 'store-identity';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'store-badge';
  eyebrow.textContent = '環境部・綠食飯桌';
  const title = document.createElement('h3');
  title.textContent = store.name;
  identity.append(eyebrow, title);
  heading.append(identity);

  if (Number.isFinite(distanceKm)) {
    const distance = document.createElement('span');
    distance.className = 'store-distance';
    distance.textContent = `${distanceKm.toFixed(1)} km`;
    heading.append(distance);
  }

  const address = document.createElement('p');
  address.className = 'store-address';
  address.textContent = store.address;
  article.append(heading, address);

  const actions = document.createElement('div');
  actions.className = 'store-card-actions';
  const mapQuery = encodeURIComponent(`${store.name} ${store.address}`);
  actions.append(makeLink('開啟地圖 ↗', `https://www.google.com/maps/search/?api=1&query=${mapQuery}`, 'store-map-link', { external: true }));

  const phone = String(store.phone || store.mobile || '').replace(/[^+\d]/g, '');
  if (phone.length >= 6) {
    actions.append(makeLink('先問循環餐具 ↗', `tel:${phone}`, 'store-call-link', {
      ariaLabel: `致電 ${store.name}，詢問是否提供可借還的循環餐具`,
    }));
  } else {
    const contact = document.createElement('span');
    contact.className = 'store-no-phone';
    contact.textContent = '出發前請先確認餐具服務';
    actions.append(contact);
  }
  article.append(actions);
  return article;
}

export function initStoreFinder({ gsap, ScrollTrigger, reducedMotion }) {
  const section = byId('finder');
  const list = byId('store-results');
  const status = byId('finder-status');
  const loadButton = byId('finder-load');
  const citySelect = byId('finder-city');
  const searchInput = byId('finder-search');
  const locateButton = byId('finder-locate');
  const moreButton = byId('finder-more');
  const count = byId('finder-count');
  if (!section || !list || !status || !loadButton || !citySelect || !searchInput || !locateButton || !moreButton) return;

  let stores = [];
  let userPosition = null;
  let shown = RESULTS_PER_PAGE;
  let isLoading = false;

  const updateFilters = () => {
    const city = citySelect.value;
    const query = searchInput.value.trim().toLocaleLowerCase('zh-Hant');
    let results = stores.filter((store) => {
      const matchesCity = !city || store.city === city;
      const searchable = `${store.name} ${store.address} ${store.city || ''} ${store.phone || ''}`.toLocaleLowerCase('zh-Hant');
      return matchesCity && (!query || searchable.includes(query));
    });

    if (userPosition) {
      results = results.map((store) => {
        const latitude = Number(store.latitude);
        const longitude = Number(store.longitude);
        const hasCoordinates = String(store.latitude || '').trim() !== ''
          && String(store.longitude || '').trim() !== ''
          && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
          && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
        const distanceKm = hasCoordinates
          ? distanceBetween(userPosition.latitude, userPosition.longitude, latitude, longitude)
          : Infinity;
        return { ...store, distanceKm };
      }).sort((first, second) => first.distanceKm - second.distanceKm);
    } else {
      const collator = new Intl.Collator('zh-Hant');
      results.sort((first, second) => collator.compare(first.name, second.name));
    }

    list.replaceChildren();
    const visible = results.slice(0, shown);
    visible.forEach((store, index) => {
      const card = storeCard(store, store.distanceKm);
      card.style.setProperty('--card-index', index);
      list.append(card);
    });

    if (!results.length) {
      const empty = document.createElement('div');
      empty.className = 'store-empty';
      empty.textContent = '目前沒有符合的餐廳。試試其他縣市或關鍵字，也可以直接查看環境部名錄。';
      list.append(empty);
    }

    count.textContent = stores.length ? `${results.length.toLocaleString('zh-TW')} 間` : '待載入';
    moreButton.hidden = results.length <= visible.length;
    moreButton.textContent = `再看 12 間　↓`;
    if (stores.length) {
      status.textContent = userPosition
        ? `找到 ${results.length.toLocaleString('zh-TW')} 間名錄餐廳，已依距離排序。位置只在此裝置處理，不會傳送或儲存。`
        : `找到 ${results.length.toLocaleString('zh-TW')} 間名錄餐廳。記得先確認店家是否提供循環餐具。`;
    }

    if (!reducedMotion && gsap && visible.length) {
      gsap.fromTo(list.children, { y: 16, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        duration: 0.42,
        stagger: 0.035,
        ease: 'power2.out',
        overwrite: true,
      });
    }
    ScrollTrigger?.refresh();
  };

  const loadStores = async () => {
    if (stores.length || isLoading) return;
    isLoading = true;
    loadButton.disabled = true;
    loadButton.textContent = '正在連接政府資料…';
    status.textContent = '正在載入環境部開放名錄，稍等一下。';
    try {
      stores = await fetchAllStores();
      const cities = [...new Set(stores.map((store) => store.city).filter(Boolean))]
        .sort(new Intl.Collator('zh-Hant').compare);
      citySelect.replaceChildren(new Option('全台灣', ''));
      cities.forEach((city) => citySelect.add(new Option(city, city)));
      citySelect.disabled = false;
      searchInput.disabled = false;
      locateButton.disabled = false;
      loadButton.textContent = '名錄已更新 ✓';
      loadButton.disabled = true;
      status.textContent = `已載入 ${stores.length.toLocaleString('zh-TW')} 筆環境部綠食飯桌名錄。這不是循環餐具服務保證名單，出發前請向店家確認。`;
      updateFilters();
    } catch (error) {
      loadButton.disabled = false;
      loadButton.textContent = '重新載入名錄 ↻';
      status.textContent = '暫時無法連接環境部資料。你仍可直接開啟官方名錄查看最新資訊。';
      list.replaceChildren();
      console.error('Unable to load the MOENV green dining directory:', error);
    } finally {
      isLoading = false;
    }
  };

  loadButton.addEventListener('click', loadStores);
  citySelect.addEventListener('change', () => {
    shown = RESULTS_PER_PAGE;
    updateFilters();
  });
  searchInput.addEventListener('input', () => {
    shown = RESULTS_PER_PAGE;
    updateFilters();
  });
  moreButton.addEventListener('click', () => {
    shown += RESULTS_PER_PAGE;
    updateFilters();
  });
  locateButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
      status.textContent = '此瀏覽器不支援位置服務，仍可用縣市和關鍵字搜尋。';
      return;
    }
    locateButton.disabled = true;
    locateButton.textContent = '正在取得位置…';
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      userPosition = { latitude: coords.latitude, longitude: coords.longitude };
      locateButton.disabled = false;
      locateButton.textContent = '附近餐廳已排序 ✓';
      shown = RESULTS_PER_PAGE;
      updateFilters();
    }, (error) => {
      locateButton.disabled = false;
      locateButton.textContent = '依目前位置排序 ↗';
      status.textContent = error.code === error.PERMISSION_DENIED
        ? '你未開放位置權限。可以改用縣市與街道搜尋。'
        : '無法取得目前位置。可以改用縣市與街道搜尋。';
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });
}
