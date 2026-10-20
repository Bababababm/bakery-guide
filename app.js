import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import products from './products.json' with { type: 'json' };

// SUPABASE CONNECTION

const supabase = createClient(
  'https://fexwvngtfvgdvlaiccex.supabase.co',
  'sb_publishable_p34_IUB13ekAsjCtCfk1-g_fbDCzpxK'
);

const bucket = 'bakery-photos';

// WEBSITE ELEMENTS

const app = document.getElementById('app');
const status = document.getElementById('status');

const dSearch = document.getElementById('desktop-search');
const mSearch = document.getElementById('mobile-search');

let current = products[0]?.id ?? null;
let timer = null;

// SAFE TEXT DISPLAY

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// STATUS

document.getElementById('count').textContent =
  `(${products.length})`;

status.textContent =
  'Shared photos • Anyone with the link can replace product photos';

// PRODUCT MENU

function drawMenus() {

  const term = (
    dSearch.value || mSearch.value
  ).trim().toLowerCase();

  for (const target of ['desktop-list', 'mobile-list']) {

    const list = document.getElementById(target);

    list.replaceChildren();

    const matches = products.filter(p =>
      p.name.toLowerCase().includes(term)
    );

    for (const p of matches) {

      const b = document.createElement('button');

      b.className =
        'item' + (current === p.id ? ' active' : '');

      b.innerHTML = `
        <span class="loaf">🥖</span>
        <span>${escape(p.name)}</span>
        <span class="arrow">›</span>
      `;

      // SELECT PRODUCT AND SCROLL TO DETAILS

      b.onclick = () => {

        show(p.id);

        document.getElementById('app').scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

      };

      list.append(b);
    }

    if (!list.children.length) {
      list.innerHTML =
        '<div class="empty">No matching products</div>';
    }
  }
}

// SEARCH

dSearch.oninput = () => {
  mSearch.value = dSearch.value;
  drawMenus();
};

mSearch.oninput = () => {
  dSearch.value = mSearch.value;
  drawMenus();
};

// NAVIGATION

document.getElementById('nav-products').onclick = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

  mSearch.focus();
};

document.getElementById('nav-oven').onclick = () => {
  document.querySelector('.stats')?.scrollIntoView({
    behavior: 'smooth'
  });
};

document.getElementById('nav-notes').onclick = () => {
  document.querySelector('.notes')?.scrollIntoView({
    behavior: 'smooth'
  });
};

// LOAD SHARED PRODUCT PHOTOS

async function refresh(id) {

  if (current !== id) return;

  for (const kind of ['proofer', 'oven']) {

    const frame = document.getElementById(
      'frame-' + kind
    );

    if (!frame) return;

    const path = `products/${id}/${kind}.jpg`;

    const { data, error } =
      await supabase.storage.from(bucket).info(path);

    if (current !== id) return;

    if (error || !data) {
      frame.textContent = '📷 No photo uploaded yet';
      continue;
    }

    const { data: link } =
      supabase.storage.from(bucket).getPublicUrl(path);

    const img = document.createElement('img');

    img.src =
      link.publicUrl +
      '?v=' +
      encodeURIComponent(
        data.updated_at ||
        data.created_at ||
        Date.now()
      );

    img.alt = `${kind} photo`;

    frame.replaceChildren(img);
  }
}

// DISPLAY SELECTED PRODUCT

function show(id) {

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  current = id;

  const p = products.find(x => x.id === id);

  if (!p) return;

  drawMenus();

  app.innerHTML = `
    <div class="eyebrow">
      Products › ${escape(p.name)}
    </div>

    <h1 class="product-title">
      ${escape(p.name)}
    </h1>

    <p class="intro">
      Product oven reference and shared
      before-and-after bakery photos.
    </p>

    <div class="stats">

      ${[
        ['♨', 'PREHEAT', p.preheat],
        ['♨', 'BAKE', p.bake],
        ['◷', 'TIME', p.time],
        ['≋', 'STEAM', p.steam]
      ].map(([icon, k, v]) => `
        <div class="stat">
          <span class="symbol">${icon}</span>
          <small>${k}</small>
          <strong>${escape(v)}</strong>
        </div>
      `).join('')}

    </div>

    <div class="photos">

      ${[
        ['proofer', 'Out of Proofer'],
        ['oven', 'Out of Oven']
      ].map(([kind, title]) => `
        <section class="photo">

          <h3>♧ ${title}</h3>

          <div
            class="frame"
            id="frame-${kind}"
          >
            Loading photo…
          </div>

          <div class="actions">

            <button
              class="camera"
              id="btn-${kind}"
            >
              📷 Take / Replace Photo
            </button>

            <input
              type="file"
              accept="image/*"
              id="file-${kind}"
              hidden
            >

            <p
              class="hint"
              id="msg-${kind}"
            >
              Take a photo or choose from gallery.
            </p>

          </div>
        </section>
      `).join('')}

    </div>

    <section class="section">
      <h3>☷ Baking reference</h3>

      <p>
        Use the preheat, baking temperature,
        time and steam settings shown above.
        Confirm oven-specific adjustments
        with your bakery supervisor.
      </p>
    </section>

    <section class="section quality">
      <h3>💡 Quality check</h3>

      <p>
        Compare the product with your bakery's
        approved proofed and finished-product
        photos. Check appearance and bake
        quality using local bakery standards.
      </p>
    </section>

    <section class="section notes">
      <h3>▤ Product notes</h3>

      <p>
        ${escape(
          p.notes || 'No additional notes recorded.'
        )}
      </p>
    </section>
  `;

  // PHOTO UPLOAD BUTTONS

  for (const kind of ['proofer', 'oven']) {

    const file = document.getElementById(
      'file-' + kind
    );

    const btn = document.getElementById(
      'btn-' + kind
    );

    const msg = document.getElementById(
      'msg-' + kind
    );

    btn.onclick = () => file.click();

    file.onchange = async () => {

      const f = file.files?.[0];

      if (!f) return;

      if (!f.type.startsWith('image/')) {
        msg.textContent = 'Choose an image file.';
        return;
      }

      btn.disabled = true;
      msg.textContent = 'Preparing image…';

      try {

        const jpg = await createJpeg(f);

        if (jpg.size > 5 * 1024 * 1024) {
          throw Error('Photo too large');
        }

        msg.textContent = 'Uploading…';

        const { error } =
          await supabase.storage.from(bucket).upload(
            `products/${id}/${kind}.jpg`,
            jpg,
            {
              contentType: 'image/jpeg',
              upsert: true,
              cacheControl: '60'
            }
          );

        if (error) throw error;

        msg.textContent =
          'Saved! Other devices will update shortly.';

        await refresh(id);

      } catch (e) {

        msg.textContent =
          'Upload failed: ' + e.message;

      } finally {

        btn.disabled = false;
        file.value = '';

      }
    };
  }

  refresh(id).catch(e => {
    status.textContent =
      'Photo loading issue: ' + e.message;
  });

  // CHECK FOR NEW PHOTOS EVERY 15 SECONDS

  timer = setInterval(() => {
    refresh(id).catch(() => {});
  }, 15000);
}

// COMPRESS PHOTOS BEFORE UPLOADING

async function createJpeg(file) {

  const bmp = await createImageBitmap(file);

  const scale = Math.min(
    1,
    1600 / Math.max(bmp.width, bmp.height)
  );

  const c = document.createElement('canvas');

  c.width = Math.max(
    1,
    Math.round(bmp.width * scale)
  );

  c.height = Math.max(
    1,
    Math.round(bmp.height * scale)
  );

  c.getContext('2d').drawImage(
    bmp,
    0,
    0,
    c.width,
    c.height
  );

  bmp.close();

  return new Promise((resolve, reject) => {

    c.toBlob(
      b => b
        ? resolve(b)
        : reject(Error('Could not prepare photo')),
      'image/jpeg',
      0.8
    );

  });
}

// START WEBSITE

if (products.length) {
  show(products[0].id);
} else {
  app.textContent = 'No products found.';
}

