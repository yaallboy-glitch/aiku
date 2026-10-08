(function(){
  const STORAGE_KEY = 'dsmd_catalog_v2';
  const CART_KEY = 'dsmd_cart_v2';

  const DEFAULT_CATALOG = [
    {
      id: 'dsmd-01',
      num: '01',
      title: 'MONO PARKA “VOID”',
      cat: 'parka',
      tag: 'Ripstop / seam-sealed / 47 pcs',
      price: 1890000,
      rate: '★ 4.9 · 120 terjual',
      city: 'Jogja',
      type: 't1',
      img: ''
    },
    {
      id: 'dsmd-02',
      num: '02',
      title: 'ABSTRAK TEE “GRAIN”',
      cat: 'tee',
      tag: 'Heavy cotton 240gsm / sablon retak',
      price: 449000,
      rate: '★ 5.0 · 340 terjual',
      city: 'Jogja',
      type: 't2',
      img: ''
    },
    {
      id: 'dsmd-03',
      num: '03',
      title: 'CARGO “FRACTURE”',
      cat: 'cargo',
      tag: 'Potongan asimetris / limited edition',
      price: 890000,
      rate: '★ 4.8 · 89 terjual',
      city: 'Jogja',
      type: 't3',
      img: ''
    },
    {
      id: 'dsmd-04',
      num: '04',
      title: 'TACTICAL BALACLAVA “ECHO”',
      cat: 'aksesoris',
      tag: 'Bahan rajut thermo / laser eyelet',
      price: 280000,
      rate: '★ 4.9 · 210 terjual',
      city: 'Jogja',
      type: 't1',
      img: ''
    }
  ];

  let catalog = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    catalog = saved ? JSON.parse(saved) : DEFAULT_CATALOG;
  } catch(e) {
    catalog = DEFAULT_CATALOG;
  }

  let cart = [];
  try {
    const savedCart = localStorage.getItem(CART_KEY);
    cart = savedCart ? JSON.parse(savedCart) : [];
  } catch(e) {
    cart = [];
  }

  function saveCatalog() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog)); } catch(e){}
  }

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch(e){}
    updateCartUI();
  }

  function formatIDR(num) {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  }

  // Toast System
  const toast = document.getElementById('dsmd-toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  // Render Catalog
  let currentCat = 'all';
  const gridEl = document.getElementById('catalog-grid');

  function renderCatalog() {
    if (!gridEl) return;
    const filtered = currentCat === 'all' 
      ? catalog 
      : catalog.filter(p => p.cat.toLowerCase() === currentCat.toLowerCase());

    if (filtered.length === 0) {
      gridEl.innerHTML = `<div class="empty-state"><p class="mono">TIDAK ADA PRODUK DALAM KATEGORI INI.</p><button type="button" class="btn-ghost sm" id="btn-reset-cat">Lihat Semua Produk</button></div>`;
      const btnReset = document.getElementById('btn-reset-cat');
      if (btnReset) btnReset.onclick = () => filterCategory('all');
      return;
    }

    gridEl.innerHTML = filtered.map((item, i) => {
      const isTall = i % 2 === 1 ? 'tall' : '';
      const thumbContent = item.img 
        ? `<img src="${item.img}" alt="${item.title}" class="card-custom-img">`
        : `<span>${item.num || ('0' + (i + 1))}</span>`;
      
      const thumbClass = item.img ? 'custom-thumb' : (item.type || 't1');

      return `
        <article class="card ${isTall}" data-id="${item.id}" style="animation-delay:${i * 0.08}s">
          <div class="thumb ${thumbClass}">
            ${thumbContent}
            <div class="card-badge mono">${item.cat.toUpperCase()}</div>
          </div>
          <div class="info">
            <p class="rate">${item.rate || '★ 5.0 · Eksklusif'} · ${item.city || 'Jogja'}</p>
            <h3>${item.title}</h3>
            <p>${item.tag || 'Produksi terbatas Jogja'}</p>
            <div class="row">
              <b>${formatIDR(item.price)}</b>
              <div class="card-actions">
                ${item.isCustom ? `<button class="btn-del" title="Hapus produk" data-del="${item.id}">✕</button>` : ''}
                <button class="btn-add-cart" data-add="${item.id}">+ Keranjang</button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    gridEl.querySelectorAll('[data-add]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        addToCart(btn.dataset.add);
      };
    });

    gridEl.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        deleteProduct(btn.dataset.del);
      };
    });
  }

  function filterCategory(cat) {
    currentCat = cat;
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.cat === cat);
    });
    gridEl.classList.add('grid-fade');
    setTimeout(() => {
      renderCatalog();
      gridEl.classList.remove('grid-fade');
    }, 180);
  }

  function addToCart(id) {
    const prod = catalog.find(p => p.id === id);
    if (!prod) return;
    const existing = cart.find(c => c.id === id);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({ ...prod, qty: 1 });
    }
    saveCart();
    showToast(`✓ Ditambahkan: ${prod.title}`);
  }

  function deleteProduct(id) {
    if (!confirm('Hapus produk ini dari katalog?')) return;
    catalog = catalog.filter(p => p.id !== id);
    saveCatalog();
    renderCatalog();
    showToast('✓ Produk berhasil dihapus dari katalog');
  }

  function updateCartUI() {
    const totalQty = cart.reduce((acc, c) => acc + (c.qty || 1), 0);
    const totalPrice = cart.reduce((acc, c) => acc + (c.price * (c.qty || 1)), 0);

    document.querySelectorAll('.cart-count-badge').forEach(el => el.textContent = totalQty);

    const drawerBody = document.getElementById('cart-drawer-items');
    const drawerTotal = document.getElementById('cart-drawer-total');
    if (drawerTotal) drawerTotal.textContent = formatIDR(totalPrice);

    if (drawerBody) {
      if (cart.length === 0) {
        drawerBody.innerHTML = `<div class="empty-cart"><p class="mono">KERANJANG KOSONG</p><p class="sub-empty">Pilih produk eksklusif dari katalog Jogja.</p></div>`;
      } else {
        drawerBody.innerHTML = cart.map(item => `
          <div class="cart-item-row" data-id="${item.id}">
            <div class="c-thumb">
              ${item.img ? `<img src="${item.img}" alt="${item.title}">` : `<span>${item.num || '01'}</span>`}
            </div>
            <div class="c-desc">
              <h4>${item.title}</h4>
              <p class="c-price">${formatIDR(item.price)}</p>
              <div class="c-qty-row">
                <button class="c-qty-btn" data-qty-dec="${item.id}">−</button>
                <span>${item.qty}</span>
                <button class="c-qty-btn" data-qty-inc="${item.id}">+</button>
              </div>
            </div>
            <button class="c-del-btn" data-del-cart="${item.id}">✕</button>
          </div>
        `).join('');

        drawerBody.querySelectorAll('[data-qty-dec]').forEach(b => {
          b.onclick = () => {
            const id = b.dataset.qtyDec;
            const target = cart.find(x => x.id === id);
            if (target) {
              if (target.qty > 1) { target.qty--; } else { cart = cart.filter(x => x.id !== id); }
              saveCart();
            }
          };
        });

        drawerBody.querySelectorAll('[data-qty-inc]').forEach(b => {
          b.onclick = () => {
            const id = b.dataset.qtyInc;
            const target = cart.find(x => x.id === id);
            if (target) { target.qty++; saveCart(); }
          };
        });

        drawerBody.querySelectorAll('[data-del-cart]').forEach(b => {
          b.onclick = () => {
            cart = cart.filter(x => x.id !== b.dataset.delCart);
            saveCart();
          };
        });
      }
    }
  }

  // Cart Drawer open/close
  const cartDrawer = document.getElementById('cart-drawer');
  document.querySelectorAll('.btn-trigger-cart').forEach(b => {
    b.onclick = (e) => {
      e.preventDefault();
      if (cartDrawer) cartDrawer.classList.add('open');
    };
  });
  const btnCloseCart = document.getElementById('btn-close-cart');
  if (btnCloseCart) btnCloseCart.onclick = () => cartDrawer.classList.remove('open');

  const btnCheckout = document.getElementById('btn-checkout');
  if (btnCheckout) {
    btnCheckout.onclick = () => {
      if (cart.length === 0) {
        showToast('Keranjang masih kosong!');
        return;
      }
      const total = cart.reduce((acc, c) => acc + (c.price * (c.qty || 1)), 0);
      showToast(`Memproses Checkout (${formatIDR(total)}) dari Jogja...`);
      setTimeout(() => {
        cart = [];
        saveCart();
        cartDrawer.classList.remove('open');
        showToast('✓ Pesanan Berhasil! Dikirim langsung dari Jogja.');
      }, 1200);
    };
  }

  // Admin Modal & Image Upload
  const adminModal = document.getElementById('admin-modal');
  const btnOpenAdmin = document.getElementById('btn-open-admin');
  const btnCloseAdmin = document.getElementById('btn-close-admin');
  const formAdmin = document.getElementById('form-admin-product');
  const fileInput = document.getElementById('admin-file-input');
  const previewBox = document.getElementById('admin-img-preview');
  let uploadedImgDataUrl = '';

  if (btnOpenAdmin) {
    btnOpenAdmin.onclick = (e) => {
      e.preventDefault();
      if (adminModal) adminModal.classList.add('active');
    };
  }

  if (btnCloseAdmin) {
    btnCloseAdmin.onclick = () => adminModal && adminModal.classList.remove('active');
  }

  if (adminModal) {
    adminModal.onclick = (e) => {
      if (e.target === adminModal) adminModal.classList.remove('active');
    };
  }

  if (fileInput) {
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('⚠ Mohon upload file gambar');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        uploadedImgDataUrl = evt.target.result;
        if (previewBox) {
          previewBox.innerHTML = `<img src="${uploadedImgDataUrl}" alt="Preview" class="preview-active-img"><button type="button" id="btn-remove-preview" class="btn-remove-prev">Ganti Foto</button>`;
          const btnRemove = document.getElementById('btn-remove-preview');
          if (btnRemove) {
            btnRemove.onclick = () => {
              uploadedImgDataUrl = '';
              fileInput.value = '';
              previewBox.innerHTML = `<div class="prev-ph"><p>+ Klik / Geser Foto Produk</p><span class="mono">PNG, JPG, WEBP (Maks 5MB)</span></div>`;
            };
          }
        }
      };
      reader.readAsDataURL(file);
    };
  }

  if (formAdmin) {
    formAdmin.onsubmit = (e) => {
      e.preventDefault();
      const title = document.getElementById('adm-title').value.trim();
      const cat = document.getElementById('adm-cat').value;
      const price = parseInt(document.getElementById('adm-price').value, 10);
      const tag = document.getElementById('adm-tag').value.trim();
      const stock = document.getElementById('adm-stock').value.trim() || '47 pcs';

      if (!title || isNaN(price)) {
        showToast('⚠ Mohon lengkapi judul dan harga');
        return;
      }

      const nextNum = (catalog.length + 1).toString().padStart(2, '0');
      const newProduct = {
        id: 'dsmd-' + Date.now(),
        num: nextNum,
        title: title.toUpperCase(),
        cat: cat,
        tag: `${tag || 'Koleksi eksklusif'} · ${stock}`,
        price: price,
        rate: '★ 5.0 · Drop Baru',
        city: 'Jogja',
        type: 't1',
        img: uploadedImgDataUrl,
        isCustom: true
      };

      catalog.unshift(newProduct);
      saveCatalog();
      renderCatalog();

      formAdmin.reset();
      uploadedImgDataUrl = '';
      if (previewBox) {
        previewBox.innerHTML = `<div class="prev-ph"><p>+ Klik / Geser Foto Produk</p><span class="mono">PNG, JPG, WEBP (Maks 5MB)</span></div>`;
      }
      adminModal.classList.remove('active');
      showToast(`✓ Drop Baru Terbit: ${newProduct.title}`);
      
      const catSec = document.getElementById('katalog');
      if (catSec) catSec.scrollIntoView({ behavior: 'smooth' });
    };
  }

  // Dynamic Navigation Dock Indicator
  const navDock = document.getElementById('nav-dock');
  const dockPill = document.getElementById('dock-pill');
  const navLinks = document.querySelectorAll('.nav-dock-link');

  function updateDockPill(activeLink) {
    if (!dockPill || !activeLink || !navDock) return;
    const linkRect = activeLink.getBoundingClientRect();
    const dockRect = navDock.getBoundingClientRect();
    const left = linkRect.left - dockRect.left;
    dockPill.style.width = `${linkRect.width}px`;
    dockPill.style.transform = `translateX(${left}px)`;
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      updateDockPill(link);
    });
  });

  // Category filter pill buttons
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.onclick = (e) => {
      e.preventDefault();
      filterCategory(pill.dataset.cat);
    };
  });

  // Search input live filtering
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      currentCat = 'all';
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('active', p.dataset.cat === 'all'));
      const filtered = catalog.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.cat.toLowerCase().includes(q) || 
        (p.tag && p.tag.toLowerCase().includes(q))
      );
      if (!gridEl) return;
      gridEl.innerHTML = filtered.map((item, i) => `
        <article class="card" data-id="${item.id}">
          <div class="thumb ${item.img ? 'custom-thumb' : (item.type || 't1')}">
            ${item.img ? `<img src="${item.img}" alt="${item.title}" class="card-custom-img">` : `<span>${item.num || '01'}</span>`}
            <div class="card-badge mono">${item.cat.toUpperCase()}</div>
          </div>
          <div class="info">
            <p class="rate">${item.rate || '★ 5.0'} · ${item.city || 'Jogja'}</p>
            <h3>${item.title}</h3>
            <p>${item.tag || ''}</p>
            <div class="row">
              <b>${formatIDR(item.price)}</b>
              <button class="btn-add-cart" data-add="${item.id}">+ Keranjang</button>
            </div>
          </div>
        </article>
      `).join('');

      gridEl.querySelectorAll('[data-add]').forEach(btn => {
        btn.onclick = (ev) => {
          ev.stopPropagation();
          addToCart(btn.dataset.add);
        };
      });
    });
  }

  // Initial load
  window.addEventListener('DOMContentLoaded', () => {
    renderCatalog();
    updateCartUI();
    const firstActive = document.querySelector('.nav-dock-link.active') || navLinks[0];
    if (firstActive) {
      setTimeout(() => updateDockPill(firstActive), 120);
    }
  });

  window.addEventListener('resize', () => {
    const active = document.querySelector('.nav-dock-link.active');
    if (active) updateDockPill(active);
  });

  window.__dsmd = { saveCatalog, saveCart, formatIDR, showToast, renderCatalog, filterCategory, addToCart, deleteProduct, updateCartUI };
})();
