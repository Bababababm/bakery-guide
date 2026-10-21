
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import products from './products.json' with { type: 'json' };

// SUPABASE SETTINGS

const supabase = createClient(
  'https://fexwvngtfvgdvlaiccex.supabase.co',
  'sb_publishable_p34_IUB13ekAsjCtCfk1-g_fbDCzpxK'
);

const bucket = 'bakery-photos';

// PAGE ELEMENTS

const app = document.getElementById('app');
const status = document.getElementById('status');
const dSearch = document.getElementById('desktop-search');
const mSearch = document.getElementById('mobile-search');

const desktopList = document.getElementById('desktop-list');
const mobileList = document.getElementById('mobile-list');

let current = products[0]?.id ?? null;
let photoTimer = null;
let selectionNumber = 0;

// ESCAPE HTML

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

// INITIAL STATUS

document.getElementById('count').textContent =
  `(${products.length})`;

status.textContent =
  'Shared bakery photos • Select any product';

// AUTOMATIC SCROLL TO PRODUCT DETAILS

function scrollToProduct() {

  // Run after the product details have been updated.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {

      const details = document.getElementById('app');

      if (!details) return;

      const targetPosition =
        details.getBoundingClientRect().top +
        window.scrollY -
        8;

      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: 'auto'
      });

    });
  });
}

// PRODUCT SELECTION

function selectProduct(id) {

  const product = products.find(p => p.id === id);

  if (!product) return;

  // Stop any previous scrolling animation.
  // Immediately update the product details.
  showProduct(id);

  // Scroll to the selected product.
  scrollToProduct();
}

// BUILD PRODUCT BUTTONS

function drawMenus() {

  const searchText = (
    dSearch.value || mSearch.value
  ).trim().toLowerCase();

  const matchingProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchText)
  );

  for (const list of [desktopList, mobileList]) {

    list.replaceChildren();

    for (const product of matchingProducts) {

      const button = document.createElement('button');

      button.type = 'button';

      button.className =
        'item' + (current === product.id ? ' active' : '');

      button.innerHTML = `
        <span class="loaf">🥖</span>
        <span>${escapeHtml(product.name)}</span>
        <span class="arrow">›</span>
      `;

      // WORKS FOR EVERY PRODUCT
      button.addEventListener('click', () => {
        selectProduct(product.id);
      });

      list.appendChild(button);
    }

    if (matchingProducts.length === 0) {
      list.innerHTML =
        '<div class="empty">No matching products</div>';
    }
  }
}

// SEARCH

dSearch.addEventListener('input', () => {
  mSearch.value = dSearch.value;
  drawMenus();
});

mSearch.addEventListener('input', () => {
  dSearch.value = mSearch.value;
  drawMenus();
});

// NAVIGATION BUTTONS

document.getElementById('nav-products').onclick = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

document.getElementById('nav-oven').onclick = () => {
  document.querySelector('.stats')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
};

document.getElementById('nav-notes').onclick = () => {
  document.querySelector('.notes')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
};

// LOAD PHOTOS FROM SUPABASE

async function refreshPhotos(id) {

  if (current !== id) return;

  for (const kind of ['proofer', 'oven']) {

    const frame = document.getElementById(
      `frame-${kind}`
    );

    if (!frame) continue;

    const path = `products/${id}/${kind}.jpg`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .info(path);

    if (current !== id) return;

    if (error || !data) {
      frame.textContent = '📷 No photo uploaded yet';
      continue;
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    const image = document.createElement('img');

    image.src =
      publicData.publicUrl +
      '?v=' +
      encodeURIComponent(
        data.updated_at ||
        data.created_at ||
        Date.now()
      );

    image.alt =
      kind === 'proofer'
        ? 'Out of Proofer'
        : 'Out of Oven';

    frame.replaceChildren(image);
  }
}

// SHOW PRODUCT DETAILS

function showProduct(id) {

  const product = products.find(p => p.id === id);

  if (!product) return;

  // Stop old photo refresh interval.
  if (photoTimer !== null) {
    clearInterval(photoTimer);
    photoTimer = null;
  }

  current = id;

  // Used to prevent outdated photo requests.
  selectionNumber++;
  const thisSelection = selectionNumber;

  // Update highlighted product button.
  drawMenus();

  // UPDATE PRODUCT INFORMATION

  app.innerHTML = `
    <div class="eyebrow">
      Products › ${escapeHtml(product.name)}
    </div>

    <h1 class="product-title">
      ${escapeHtml(product.name)}
    </h1>

    <p class="intro">
      Baking instructions, oven settings,
      and shared bakery photos.
    </p>

    <div class="stats">

      ${[
        ['♨', 'PREHEAT', product.preheat],
        ['♨', 'BAKE', product.bake],
        ['◷', 'TIME', product.time],
        ['≋', 'STEAM', product.steam]
      ].map(([icon, label, value]) => `
        <div class="stat">
          <span class="symbol">${icon}</span>
          <small>${label}</small>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `).join('')}

    </div>

    <div class="photos">

      ${[
        ['proofer', 'Out of Proofer'],
        ['oven', 'Out of Oven']
      ].map(([kind, title]) => `
        <section class="photo">

          <h3>📷 ${title}</h3>

          <div
            class="frame"
            id="frame-${kind}"
          >
            Loading photo…
          </div>

          <div class="actions">

            <button
              type="button"
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
      <h3>♨ Baking Reference</h3>

      <p>
        Preheat:
        <strong>${escapeHtml(product.preheat)}</strong>
      </p>

      <p>
        Bake:
        <strong>${escapeHtml(product.bake)}</strong>
      </p>

      <p>
        Time:
        <strong>${escapeHtml(product.time)}</strong>
      </p>

      <p>
        Steam:
        <strong>${escapeHtml(product.steam)}</strong>
      </p>
    </section>

    <section class="section quality">
      <h3>💡 Quality Check</h3>

      <p>
        Compare the product with the approved
        proofed and baked product photos.
        Check appearance, colour and baking
        quality using your bakery standards.
      </p>
    </section>

    <section class="section notes">
      <h3>📝 Product Notes</h3>

      <p>
        ${escapeHtml(
          product.notes || 'No additional notes recorded.'
        )}
      </p>
    </section>
  `;

  // CAMERA BUTTONS

  for (const kind of ['proofer', 'oven']) {

    const fileInput = document.getElementById(
      `file-${kind}`
    );

    const button = document.getElementById(
      `btn-${kind}`
    );

    const message = document.getElementById(
      `msg-${kind}`
    );

    button.onclick = () => {
      fileInput.click();
    };

    fileInput.onchange = async () => {

      const file = fileInput.files?.[0];

      if (!file) return;

      if (!file.type.startsWith('image/')) {
        message.textContent =
          'Please choose an image file.';
        return;
      }

      button.disabled = true;
      message.textContent = 'Preparing photo…';

      try {

        const jpeg = await createJpeg(file);

        if (jpeg.size > 5 * 1024 * 1024) {
          throw new Error('Photo is too large.');
        }

        message.textContent = 'Uploading photo…';

        const path = `products/${id}/${kind}.jpg`;

        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, jpeg, {
            contentType: 'image/jpeg',
            upsert: true,
            cacheControl: '60'
          });

        if (error) throw error;

        if (
          current === id &&
          selectionNumber === thisSelection
        ) {
          message.textContent =
            'Photo saved successfully!';

          await refreshPhotos(id);
        }

      } catch (error) {

        message.textContent =
          'Upload failed: ' + error.message;

      } finally {

        button.disabled = false;
        fileInput.value = '';

      }
    };
  }

  // INITIAL PHOTO LOAD

  refreshPhotos(id).catch(error => {
    console.error('Photo loading failed:', error);
  });

  // CHECK FOR UPDATED PHOTOS EVERY 15 SECONDS

  photoTimer = setInterval(() => {

    if (
      current !== id ||
      selectionNumber !== thisSelection
    ) {
      return;
    }

    refreshPhotos(id).catch(error => {
      console.error('Photo refresh failed:', error);
    });

  }, 15000);
}

// CONVERT AND COMPRESS PHOTOS

async function createJpeg(file) {

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(
    1,
    1600 / Math.max(bitmap.width, bitmap.height)
  );

  const canvas = document.createElement('canvas');

  canvas.width = Math.max(
    1,
    Math.round(bitmap.width * scale)
  );

  canvas.height = Math.max(
    1,
    Math.round(bitmap.height * scale)
  );

  const context = canvas.getContext('2d');

  context.drawImage(
    bitmap,
    0,
    0,
    canvas.width,
    canvas.height
  );

  bitmap.close();

  return new Promise((resolve, reject) => {

    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(
            new Error('Could not prepare photo.')
          );
        }
      },
      'image/jpeg',
      0.8
    );

  });
}

// START WEBSITE

if (products.length > 0) {

  showProduct(products[0].id);

} else {

  drawMenus();

  app.textContent = 'No products found.';

}
