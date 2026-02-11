const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  HOME: "/home",
  PRODUCT_DETAIL: "/product_detail",
  CART: "/cart",
  FAVORITES: "/favorites",
  MAP: "/map",
  PROFILE: "/profile",
  CHECKOUT: "/checkout",
  PAYMENT_METHOD: "/payment",
  PAYMENT_SIMULATION: "/payment_simulation",
  PAYMENT_SUCCESS: "/payment_success",
  ADMIN_DASHBOARD: "/admin_dashboard"
};

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Pudding Milk",
    variant: "Vanilla",
    price: 12000,
    description: "Pudding rasa vanilla lembut dengan topping fresh cream.",
    imageAsset: "assets/images/pudding milk.png",
    location: "Dapur Pumeow, Malang",
    rating: 4.7,
    isAvailable: true
  },
  {
    id: 2,
    name: "Pudding Chocolate",
    variant: "Chocolate",
    price: 13000,
    description: "Pudding coklat pekat dengan lapisan ganache tipis.",
    imageAsset: "assets/images/pudding coklat.png",
    location: "Dapur Pumeow, Malang",
    rating: 4.8,
    isAvailable: true
  },
  {
    id: 3,
    name: "Pudding Mango",
    variant: "Mango",
    price: 14000,
    description: "Pudding mangga dengan puree asli dan aroma tropis.",
    imageAsset: "assets/images/pudding mangga.png",
    location: "Dapur Pumeow, Malang",
    rating: 4.6,
    isAvailable: true
  },
  {
    id: 4,
    name: "Pudding Taro",
    variant: "Taro",
    price: 15000,
    description: "Pudding taro ungu lembut dengan aroma talas manis.",
    imageAsset: "assets/images/pudding taro.png",
    location: "Dapur Pumeow, Malang",
    rating: 4.7,
    isAvailable: true
  },
  {
    id: 5,
    name: "Pudding Pandan",
    variant: "Pandan",
    price: 15000,
    description: "Pudding pandan wangi dengan santan gurih dan gula merah.",
    imageAsset: "assets/images/pudding pandan.png",
    location: "Dapur Pumeow, Malang",
    rating: 4.6,
    isAvailable: true
  },
  {
    id: 6,
    name: "Pudding Buah",
    variant: "Buah",
    price: 16000,
    description: "Pudding creamy dengan topping potongan buah segar.",
    imageAsset: "assets/images/pudding buah.png",
    location: "Dapur Pumeow, Malang",
    rating: 4.8,
    isAvailable: true
  }
];

const appRoot = document.getElementById("appRoot");
const snackbar = document.getElementById("snackbar");
const startupPopup = document.getElementById("startupPopup");
const startupClose = document.getElementById("startupClose");

const state = {
  auth: {
    email: "",
    password: "",
    isLoading: false,
    isLoggedIn: false,
    isAdmin: false
  },
  products: [...DEFAULT_PRODUCTS],
  cart: {},
  favorites: new Set(),
  purchaseHistory: [],
  selectedProductId: null,
  search: "",
  selectedVariant: "Semua",
  location: {
    lat: -7.96662,
    lng: 112.63263,
    address: "Malang, Jawa Timur",
    isLoading: false
  },
  payment: {
    method: "",
    lat: null,
    lng: null,
    address: ""
  }
};

const routeState = {};

function enableDragScroll(container) {
  if (!container || container.dataset.dragScrollBound === "1") return;
  container.dataset.dragScrollBound = "1";

  let isDragging = false;
  let hasMoved = false;
  let suppressClickUntil = 0;
  let startY = 0;
  let startX = 0;
  let startTop = 0;

  container.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest("button,a,input,textarea,select,label")) return;

    isDragging = true;
    hasMoved = false;
    startY = event.clientY;
    startX = event.clientX;
    startTop = container.scrollTop;
    container.classList.add("dragging");
    event.preventDefault();
  });

  window.addEventListener("mousemove", (event) => {
    if (!isDragging) return;
    const movedX = Math.abs(event.clientX - startX);
    const movedY = Math.abs(event.clientY - startY);
    if (movedX > 4 || movedY > 4) {
      hasMoved = true;
    }
    const dy = event.clientY - startY;
    container.scrollTop = startTop - dy;
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    if (hasMoved) {
      suppressClickUntil = Date.now() + 220;
    }
    container.classList.remove("dragging");
  });

  container.addEventListener(
    "click",
    (event) => {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
}

function enableHorizontalDragScroll(scroller) {
  if (!scroller || scroller.dataset.hDragBound === "1") return;
  scroller.dataset.hDragBound = "1";

  let isDown = false;
  let moved = false;
  let startX = 0;
  let startLeft = 0;
  let suppressClickUntil = 0;

  scroller.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    isDown = true;
    moved = false;
    startX = event.clientX;
    startLeft = scroller.scrollLeft;
    scroller.classList.add("dragging-x");
    event.preventDefault();
  });

  window.addEventListener("mousemove", (event) => {
    if (!isDown) return;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 3) moved = true;
    scroller.scrollLeft = startLeft - dx;
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    scroller.classList.remove("dragging-x");
    if (moved) suppressClickUntil = Date.now() + 220;
  });

  scroller.addEventListener(
    "click",
    (event) => {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  scroller.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      scroller.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  }, { passive: false });
}

function showSnackbar(message) {
  snackbar.textContent = message;
  snackbar.className = "snackbar show";
  clearTimeout(showSnackbar.t);
  showSnackbar.t = setTimeout(() => {
    snackbar.className = "snackbar";
  }, 2200);
}

function formatPrice(value) {
  return `Rp${Math.round(value)}`;
}

function icon(name, className = "") {
  return `<span class="material-symbols-outlined ${className}" aria-hidden="true">${name}</span>`;
}

function getRoute() {
  const hash = window.location.hash || "#/login";
  if (hash.startsWith("#/")) {
    return hash.slice(1);
  }
  return ROUTES.LOGIN;
}

function navigate(route, args = null) {
  if (args) {
    routeState[route] = args;
  }
  window.location.hash = `#${route}`;
}

function saveState() {
  const data = {
    auth: state.auth,
    cart: state.cart,
    favorites: [...state.favorites],
    purchaseHistory: state.purchaseHistory,
    selectedVariant: state.selectedVariant,
    search: state.search,
    products: state.products
  };
  localStorage.setItem("pumeowWebState", JSON.stringify(data));
}

function loadState() {
  const raw = localStorage.getItem("pumeowWebState");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    state.auth = { ...state.auth, ...(data.auth || {}) };
    state.cart = data.cart || {};
    state.favorites = new Set(data.favorites || []);
    state.purchaseHistory = data.purchaseHistory || [];
    state.selectedVariant = data.selectedVariant || "Semua";
    state.search = data.search || "";
    state.products = data.products?.length ? data.products : [...DEFAULT_PRODUCTS];
  } catch (_) {
    // ignore corrupted localStorage
  }
}

function maskPassword(value) {
  if (!value) return "Belum ada data";
  return "*".repeat(value.length);
}

function currentProduct() {
  return state.products.find((p) => p.id === state.selectedProductId) || state.products[0];
}

function cartEntries() {
  return Object.entries(state.cart)
    .map(([productId, quantity]) => {
      const product = state.products.find((p) => p.id === Number(productId));
      return product ? { product, quantity } : null;
    })
    .filter(Boolean);
}

function cartIsEmpty() {
  return cartEntries().length === 0;
}

function addToCart(productId) {
  const key = String(productId);
  state.cart[key] = (state.cart[key] || 0) + 1;
  saveState();
}

function removeFromCart(productId) {
  const key = String(productId);
  if (!state.cart[key]) return;
  if (state.cart[key] > 1) {
    state.cart[key] -= 1;
  } else {
    delete state.cart[key];
  }
  saveState();
}

function toggleFavorite(productId) {
  if (state.favorites.has(productId)) {
    state.favorites.delete(productId);
  } else {
    state.favorites.add(productId);
  }
  saveState();
}

function doCheckout(method, args = {}) {
  const items = cartEntries();
  if (!items.length) {
    showSnackbar("Keranjang masih kosong");
    return;
  }

  const now = new Date().toISOString();
  items.forEach(({ product, quantity }) => {
    state.purchaseHistory.push({
      product,
      quantity,
      method,
      createdAt: now,
      orderId: `ORD-${Date.now()}`,
      lat: args.lat || null,
      lng: args.lng || null,
      address: args.address || ""
    });
  });

  state.cart = {};
  saveState();
}

function renderHeader(title, backRoute = null) {
  return `<div class="head-row"><h2 class="page-title">${title}</h2>${
    backRoute
      ? `<button class="btn btn-ghost small" data-action="go" data-route="${backRoute}">Kembali</button>`
      : ""
  }</div>`;
}

function renderLogin() {
  return `
    <section class="view">
      <article class="login-card">
        <figure class="logo-wrap"><img src="assets/images/logo.png" alt="Pumeow" class="logo-img"></figure>
        <h1 class="login-title">PumeowID</h1>
        <p class="login-subtitle">Login untuk melanjutkan</p>
        <form class="form" id="loginForm" novalidate>
          <div class="field-group">
            <label class="field-label" for="loginEmail">Email</label>
            <div class="input-shell"><span class="field-icon">${icon("mail")}</span><input id="loginEmail" type="email" placeholder="you@example.com" required></div>
            <p class="error-text" id="loginEmailError"></p>
          </div>
          <div class="field-group">
            <label class="field-label" for="loginPassword">Password</label>
            <div class="input-shell"><span class="field-icon">${icon("lock")}</span><input id="loginPassword" type="password" placeholder="Enter password" required></div>
            <p class="error-text" id="loginPasswordError"></p>
          </div>
          <button class="btn btn-primary" type="submit">${state.auth.isLoading ? "Loading..." : "Login"}</button>
        </form>
        <p class="inline-link"><a href="#" data-action="go" data-route="${ROUTES.REGISTER}">Belum punya akun? Register</a></p>
      </article>
    </section>
  `;
}

function renderRegister() {
  return `
    <section class="view">
      ${renderHeader("Create Account", ROUTES.LOGIN)}
      <article class="card">
        <form class="form" id="registerForm" novalidate>
          <div class="field-group">
            <label class="field-label" for="regEmail">Email</label>
            <div class="input-shell"><span class="field-icon">${icon("mail")}</span><input id="regEmail" type="email" required></div>
            <p class="error-text" id="regEmailError"></p>
          </div>
          <div class="field-group">
            <label class="field-label" for="regPassword">Password</label>
            <div class="input-shell"><span class="field-icon">${icon("lock")}</span><input id="regPassword" type="password" required></div>
            <p class="error-text" id="regPasswordError"></p>
          </div>
          <div class="field-group">
            <label class="field-label" for="regConfirm">Confirm Password</label>
            <div class="input-shell"><span class="field-icon">${icon("lock")}</span><input id="regConfirm" type="password" required></div>
            <p class="error-text" id="regConfirmError"></p>
          </div>
          <button class="btn btn-primary" type="submit">REGISTER</button>
        </form>
      </article>
    </section>
  `;
}

function renderProductCard(product) {
  const isFavorite = state.favorites.has(product.id);
  return `
    <article class="product-card" data-action="open-product" data-id="${product.id}">
      <img class="product-image" src="${product.imageAsset}" alt="${product.name}">
      <div>
        <div class="product-top">
          <span class="variant-pill">${product.variant.toUpperCase()}</span>
          <span style="margin-left:auto"></span>
          <button class="icon-btn ${isFavorite ? "active" : ""}" data-action="toggle-favorite" data-id="${product.id}">${icon(isFavorite ? "favorite" : "favorite_border")}</button>
          <button class="icon-btn" data-action="add-cart" data-id="${product.id}">${icon("add_shopping_cart")}</button>
        </div>
        <div style="font-weight:800; margin-top:6px;">${product.name}</div>
        <div class="small muted">${icon("location_on", "small-icon")} ${product.location}</div>
        <div class="head-row" style="margin-top:8px;">
          <div class="small">${icon("star", "small-icon")} ${product.rating.toFixed(1)}</div>
          <div class="price">${formatPrice(product.price)}</div>
          <span class="stock-pill">${product.isAvailable ? "Tersedia" : "Habis"}</span>
        </div>
      </div>
    </article>
  `;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav bottom-nav-docked">
      <button class="nav-btn" data-action="go" data-route="${ROUTES.PROFILE}">${icon("person")}<span>Profile</span></button>
      <button class="nav-btn" data-action="go" data-route="${ROUTES.FAVORITES}">${icon("favorite")}<span>Favorites</span></button>
      <button class="nav-btn" data-action="go" data-route="${ROUTES.CART}">${icon("shopping_cart")}<span>Cart</span></button>
      ${state.auth.isAdmin ? `<button class="nav-btn" data-action="go" data-route="${ROUTES.ADMIN_DASHBOARD}">${icon("dashboard")}<span>Admin</span></button>` : `<button class="nav-btn" data-action="go" data-route="${ROUTES.MAP}">${icon("map")}<span>Map</span></button>`}
    </nav>
  `;
}

function renderHome() {
  const variants = ["Semua", ...new Set(state.products.map((p) => p.variant))];
  const q = state.search.toLowerCase();
  const filtered = state.products.filter((p) => {
    const matchQuery = p.name.toLowerCase().includes(q) || p.variant.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchVariant = state.selectedVariant === "Semua" || p.variant === state.selectedVariant;
    return matchQuery && matchVariant;
  });

  return `
    <section class="view home-view">
      <article class="card header-card">
        <div class="badge-icon"><img class="badge-logo" src="assets/images/logo.png" alt="Pumeow"></div>
        <div class="brand-copy">
          <div class="brand-title">Pumeow Pudding</div>
          <div class="brand-subtitle muted">Dessert lembut untuk temani harimu</div>
        </div>
      </article>

      <div class="search-box">
        <span>${icon("search")}</span>
        <input type="text" id="searchInput" placeholder="Cari pudding..." value="${state.search}">
      </div>

      <div class="row-scroll">
        ${variants.map((v) => `<button class="chip ${state.selectedVariant === v ? "active" : ""}" data-action="set-variant" data-variant="${v}">${v}</button>`).join("")}
      </div>

      <div class="product-list">
        ${filtered.length ? filtered.map(renderProductCard).join("") : `<div class="card muted">Produk tidak ditemukan</div>`}
      </div>
    </section>
  `;
}

function renderProductDetail() {
  const p = currentProduct();
  return `
    <section class="view">
      ${renderHeader(`${p.name} - ${p.variant}`, ROUTES.HOME)}
      <article class="card">
        <img class="product-image" style="width:100%; height:200px;" src="${p.imageAsset}" alt="${p.name}">
        <div style="margin-top:10px;" class="variant-pill">${p.variant}</div>
        <h3 style="margin:10px 0 6px;">${p.name}</h3>
        <div class="small muted">${icon("location_on", "small-icon")} ${p.location}</div>
        <p class="small" style="line-height:1.55;">${p.description}</p>
        <div class="head-row">
          <strong class="price">${formatPrice(p.price)}</strong>
          <button class="btn btn-primary" data-action="add-cart" data-id="${p.id}">Tambah ke Keranjang</button>
        </div>
      </article>
    </section>
  `;
}

function renderCart() {
  const entries = cartEntries();
  return `
    <section class="view">
      ${renderHeader("Keranjang", ROUTES.HOME)}
      ${entries.length ? entries.map(({ product, quantity }) => `
        <div class="list-item">
          <div>
            <div style="font-weight:700;">${product.name} - ${product.variant}</div>
            <div class="small muted">${formatPrice(product.price)} x ${quantity}</div>
          </div>
          <div class="qty">
            <button data-action="dec-cart" data-id="${product.id}">-</button>
            <strong>${quantity}</strong>
            <button data-action="inc-cart" data-id="${product.id}">+</button>
          </div>
        </div>
      `).join("") : `<div class="card muted">Keranjang kosong</div>`}
      <button class="btn btn-primary" data-action="go" data-route="${ROUTES.CHECKOUT}">Beli</button>
    </section>
  `;
}

function renderFavorites() {
  const items = state.products.filter((p) => state.favorites.has(p.id));
  return `
    <section class="view">
      ${renderHeader("Favorit", ROUTES.HOME)}
      ${items.length ? items.map((product) => `
        <div class="list-item" data-action="open-product" data-id="${product.id}">
          <div>
            <div style="font-weight:800;">${product.name}</div>
            <div class="small muted">${product.variant} - ${formatPrice(product.price)}</div>
          </div>
          <button class="icon-btn active" data-action="toggle-favorite" data-id="${product.id}">${icon("favorite")}</button>
        </div>
      `).join("") : `<div class="card muted">Belum ada produk favorit</div>`}
    </section>
  `;
}

function renderMap() {
  const { lat, lng, address, isLoading } = state.location;
  const mapArgs = routeState[ROUTES.MAP] || {};
  const fromRoute = mapArgs.fromRoute || ROUTES.CART;
  const backRoute = fromRoute === ROUTES.HOME ? ROUTES.HOME : ROUTES.CART;
  return `
    <section class="view">
      ${renderHeader("Lokasi Saya", backRoute)}
      <article class="card">
        <p class="small muted">${address || "Lokasi belum tersedia"}</p>
        <iframe class="map-frame" title="Map" src="https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}"></iframe>
        <div class="head-row" style="margin-top:10px;">
          <button class="btn btn-ghost" data-action="refresh-location">${isLoading ? "Memuat..." : "Ambil Lokasi"}</button>
          <button class="btn btn-primary" data-action="confirm-location">Konfirmasi Lokasi</button>
        </div>
      </article>
    </section>
  `;
}

function renderProfile() {
  const history = [...state.purchaseHistory].reverse();
  return `
    <section class="view">
      ${renderHeader("Profil Pengguna", ROUTES.HOME)}
      <article class="card">
        <div class="small muted">Email</div>
        <div style="font-weight:700;">${state.auth.email || "Belum login"}</div>
        <div class="small muted" style="margin-top:10px;">Password</div>
        <div style="font-weight:700;">${maskPassword(state.auth.password)}</div>
        <button class="btn btn-danger" style="margin-top:12px;" data-action="logout">Logout</button>
      </article>

      <h3 class="page-title" style="font-size:1rem;">Riwayat Pembelian</h3>
      ${history.length ? history.map((entry) => `
        <div class="list-item">
          <div>
            <div style="font-weight:700;">${entry.product.name}</div>
            <div class="small muted">Qty: ${entry.quantity} - ${formatPrice(entry.product.price)}</div>
            <div class="small muted">Metode: ${entry.method} | ${new Date(entry.createdAt).toLocaleString("id-ID")}</div>
          </div>
        </div>
      `).join("") : `<div class="card muted">Belum ada riwayat pembelian.</div>`}
    </section>
  `;
}

function renderCheckout() {
  return `
    <section class="view">
      ${renderHeader("Pilih Metode", ROUTES.CART)}
      <button class="btn btn-ghost" data-action="checkout-pickup">Ambil di tempat</button>
      <button class="btn btn-primary" data-action="checkout-delivery">Driver ke tujuan</button>
    </section>
  `;
}

function renderPaymentMethod() {
  const args = routeState[ROUTES.PAYMENT_METHOD] || {};
  return `
    <section class="view">
      ${renderHeader("Pilih Pembayaran", ROUTES.MAP)}
      <article class="card">
        <div style="font-weight:700;">Lokasi dikonfirmasi</div>
        <p class="small muted">${args.address || (args.lat && args.lng ? `Lat: ${args.lat.toFixed(5)}, Lng: ${args.lng.toFixed(5)}` : "Lokasi tidak tersedia")}</p>
      </article>
      <button class="btn btn-ghost" data-action="choose-payment" data-method="E-Wallet">E-Wallet</button>
      <button class="btn btn-ghost" data-action="choose-payment" data-method="Debit">Debit</button>
      <button class="btn btn-ghost" data-action="choose-payment" data-method="Virtual Account">Virtual Account</button>
      <button class="btn btn-ghost" data-action="choose-payment" data-method="QRIS">QRIS</button>
    </section>
  `;
}

function renderPaymentSimulation() {
  const args = routeState[ROUTES.PAYMENT_SIMULATION] || {};
  const method = args.method || "Pembayaran";
  return `
    <section class="view">
      ${renderHeader(`Simulasi ${method}`, ROUTES.PAYMENT_METHOD)}
      <article class="card">
        <div style="font-weight:700;">Lokasi Pengantaran</div>
        <p class="small muted">${args.address || (args.lat && args.lng ? `Lat: ${args.lat.toFixed(5)}, Lng: ${args.lng.toFixed(5)}` : "Lokasi belum tersedia")}</p>
      </article>
      <article class="card">
        <div style="font-weight:800; margin-bottom:8px;">${method}</div>
        <p class="small muted">${method === "QRIS" ? "Scan kode QR (simulasi)." : method === "Virtual Account" ? "No. VA (simulasi): 8808 1234 5678 9012" : method === "Debit" ? "Masukkan kartu pada EDC (simulasi)." : "Konfirmasi di aplikasi e-wallet (simulasi)."}</p>
      </article>
      <button class="btn btn-primary" data-action="confirm-payment">Konfirmasi Pembayaran (Simulasi)</button>
    </section>
  `;
}

function renderPaymentSuccess() {
  const args = routeState[ROUTES.PAYMENT_SUCCESS] || {};
  const method = args.method || "Pembayaran";
  return `
    <section class="view">
      ${renderHeader("Pembayaran Berhasil", ROUTES.HOME)}
      <article class="card" style="text-align:center;">
        <div>${icon("check_circle", "success-icon")}</div>
        <h3 style="margin:0;">${method} berhasil disimulasikan</h3>
        <p class="small muted">Pesanan kamu tercatat. Terima kasih!</p>
        <button class="btn btn-primary" data-action="go" data-route="${ROUTES.HOME}">Kembali ke Beranda</button>
      </article>
    </section>
  `;
}

function renderAdminDashboard() {
  const orders = [...state.purchaseHistory].reverse();
  return `
    <section class="view">
      ${renderHeader("Admin Dashboard", ROUTES.HOME)}
      <div class="head-row">
        <h3 class="page-title" style="font-size:1rem;">Produk</h3>
        <button class="btn btn-primary small" data-action="admin-add-product">Tambah</button>
      </div>
      <div class="table-list">
        ${state.products.map((p) => `
          <div class="list-item">
            <div>
              <div style="font-weight:800;">${p.name}</div>
              <div class="small muted">${p.variant} - ${formatPrice(p.price)}</div>
            </div>
            <div class="qty">
              <button data-action="admin-edit-product" data-id="${p.id}">${icon("edit")}</button>
              <button data-action="admin-delete-product" data-id="${p.id}">${icon("delete")}</button>
            </div>
          </div>
        `).join("")}
      </div>

      <h3 class="page-title" style="font-size:1rem; margin-top:6px;">Pesanan (checkout)</h3>
      ${orders.length ? orders.map((o, i) => `
        <div class="list-item">
          <div>
            <div style="font-weight:700;">Order ${i + 1}</div>
            <div class="small muted">Pembeli: ${state.auth.email || "-"}</div>
            <div class="small muted">Method: ${o.method} - Total: ${formatPrice(o.product.price * o.quantity)}</div>
          </div>
        </div>
      `).join("") : `<div class="card muted">Belum ada data pesanan.</div>`}
    </section>
  `;
}

function render() {
  let route = getRoute();
  const authFree = route === ROUTES.LOGIN || route === ROUTES.REGISTER;

  if (!state.auth.isLoggedIn && !authFree) {
    route = ROUTES.LOGIN;
    if (window.location.hash !== `#${ROUTES.LOGIN}`) {
      window.location.hash = `#${ROUTES.LOGIN}`;
      return;
    }
  }

  if (route === ROUTES.ADMIN_DASHBOARD && !state.auth.isAdmin) {
    showSnackbar("Hanya admin dapat membuka dashboard");
    navigate(ROUTES.HOME);
    return;
  }

  const viewMap = {
    [ROUTES.LOGIN]: renderLogin,
    [ROUTES.REGISTER]: renderRegister,
    [ROUTES.HOME]: renderHome,
    [ROUTES.PRODUCT_DETAIL]: renderProductDetail,
    [ROUTES.CART]: renderCart,
    [ROUTES.FAVORITES]: renderFavorites,
    [ROUTES.MAP]: renderMap,
    [ROUTES.PROFILE]: renderProfile,
    [ROUTES.CHECKOUT]: renderCheckout,
    [ROUTES.PAYMENT_METHOD]: renderPaymentMethod,
    [ROUTES.PAYMENT_SIMULATION]: renderPaymentSimulation,
    [ROUTES.PAYMENT_SUCCESS]: renderPaymentSuccess,
    [ROUTES.ADMIN_DASHBOARD]: renderAdminDashboard
  };

  const renderer = viewMap[route] || renderLogin;
  appRoot.innerHTML = renderer();
  if (route === ROUTES.HOME) {
    appRoot.classList.add("has-docked-nav");
    appRoot.insertAdjacentHTML("beforeend", renderBottomNav());
    const homeScroller = appRoot.querySelector(".home-view");
    enableDragScroll(homeScroller);
  } else {
    appRoot.classList.remove("has-docked-nav");
    enableDragScroll(appRoot);
  }
  appRoot.querySelectorAll(".row-scroll").forEach(enableHorizontalDragScroll);
}

function refreshLocation() {
  if (!navigator.geolocation) {
    showSnackbar("Geolocation tidak didukung browser");
    return;
  }

  state.location.isLoading = true;
  render();
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.location.lat = pos.coords.latitude;
      state.location.lng = pos.coords.longitude;
      state.location.address = `Lat: ${state.location.lat.toFixed(5)}, Lng: ${state.location.lng.toFixed(5)}`;
      state.location.isLoading = false;
      showSnackbar("Lokasi berhasil diperbarui");
      render();
    },
    () => {
      state.location.isLoading = false;
      showSnackbar("Gagal mengambil lokasi");
      render();
    }
  );
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;

  if (action === "go") {
    event.preventDefault();
    const nextRoute = target.dataset.route;
    if (nextRoute === ROUTES.MAP) {
      navigate(ROUTES.MAP, { fromRoute: getRoute() });
      return;
    }
    navigate(nextRoute);
    return;
  }

  if (action === "set-variant") {
    state.selectedVariant = target.dataset.variant;
    saveState();
    render();
    return;
  }

  if (action === "open-product") {
    const id = Number(target.dataset.id);
    state.selectedProductId = id;
    navigate(ROUTES.PRODUCT_DETAIL);
    return;
  }

  if (action === "toggle-favorite") {
    event.stopPropagation();
    toggleFavorite(Number(target.dataset.id));
    render();
    return;
  }

  if (action === "add-cart") {
    event.stopPropagation();
    addToCart(Number(target.dataset.id));
    showSnackbar("Produk ditambahkan ke keranjang");
    render();
    return;
  }

  if (action === "inc-cart") {
    addToCart(Number(target.dataset.id));
    render();
    return;
  }

  if (action === "dec-cart") {
    removeFromCart(Number(target.dataset.id));
    render();
    return;
  }

  if (action === "checkout-pickup") {
    doCheckout("Ambil di tempat");
    showSnackbar("Pesanan pickup dicatat");
    navigate(ROUTES.HOME);
    return;
  }

  if (action === "checkout-delivery") {
    if (cartIsEmpty()) {
      showSnackbar("Keranjang masih kosong");
      return;
    }
    navigate(ROUTES.MAP, { fromRoute: ROUTES.CART });
    return;
  }

  if (action === "refresh-location") {
    refreshLocation();
    return;
  }

  if (action === "confirm-location") {
    const mapArgs = routeState[ROUTES.MAP] || {};
    const fromRoute = mapArgs.fromRoute || ROUTES.CART;
    if (fromRoute === ROUTES.HOME) {
      showSnackbar("Lokasi dikonfirmasi");
      navigate(ROUTES.HOME);
      return;
    }
    navigate(ROUTES.PAYMENT_METHOD, {
      lat: state.location.lat,
      lng: state.location.lng,
      address: state.location.address
    });
    return;
  }

  if (action === "choose-payment") {
    const paymentArgs = routeState[ROUTES.PAYMENT_METHOD] || {};
    navigate(ROUTES.PAYMENT_SIMULATION, {
      method: target.dataset.method,
      ...paymentArgs
    });
    return;
  }

  if (action === "confirm-payment") {
    const args = routeState[ROUTES.PAYMENT_SIMULATION] || {};
    doCheckout(args.method || "Pembayaran", args);
    navigate(ROUTES.PAYMENT_SUCCESS, { method: args.method || "Pembayaran" });
    return;
  }

  if (action === "logout") {
    state.auth = {
      email: "",
      password: "",
      isLoading: false,
      isLoggedIn: false,
      isAdmin: false
    };
    saveState();
    showSnackbar("Logout berhasil");
    navigate(ROUTES.LOGIN);
    return;
  }

  if (action === "admin-add-product") {
    const name = prompt("Nama produk:");
    if (!name) return;
    const variant = prompt("Variant:", "Custom") || "Custom";
    const price = Number(prompt("Harga:", "10000")) || 10000;
    const description = prompt("Deskripsi:", "Produk baru") || "Produk baru";
    const imageAsset = prompt("Path gambar:", "assets/images/logo.png") || "assets/images/logo.png";
    const location = prompt("Lokasi:", "Dapur Pumeow") || "Dapur Pumeow";
    const nextId = Math.max(...state.products.map((p) => p.id), 0) + 1;
    state.products.push({ id: nextId, name, variant, price, description, imageAsset, location, rating: 4.5, isAvailable: true });
    saveState();
    render();
    return;
  }

  if (action === "admin-edit-product") {
    const id = Number(target.dataset.id);
    const product = state.products.find((p) => p.id === id);
    if (!product) return;
    const name = prompt("Nama produk:", product.name);
    if (!name) return;
    const variant = prompt("Variant:", product.variant) || product.variant;
    const price = Number(prompt("Harga:", String(product.price))) || product.price;
    const description = prompt("Deskripsi:", product.description) || product.description;
    const imageAsset = prompt("Path gambar:", product.imageAsset) || product.imageAsset;
    const location = prompt("Lokasi:", product.location) || product.location;
    Object.assign(product, { name, variant, price, description, imageAsset, location });
    saveState();
    render();
    return;
  }

  if (action === "admin-delete-product") {
    const id = Number(target.dataset.id);
    state.products = state.products.filter((p) => p.id !== id);
    delete state.cart[String(id)];
    state.favorites.delete(id);
    saveState();
    render();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "searchInput") {
    state.search = event.target.value;
    saveState();
    render();
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "loginForm") {
    event.preventDefault();
    const emailInput = document.getElementById("loginEmail");
    const passInput = document.getElementById("loginPassword");
    const emailError = document.getElementById("loginEmailError");
    const passError = document.getElementById("loginPasswordError");

    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    emailError.textContent = "";
    passError.textContent = "";

    let valid = true;
    if (!email) {
      emailError.textContent = "Email wajib diisi";
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      emailError.textContent = "Format email tidak valid";
      valid = false;
    }

    if (!password) {
      passError.textContent = "Password wajib diisi";
      valid = false;
    } else if (password.length < 6) {
      passError.textContent = "Password minimal 6 karakter";
      valid = false;
    }

    if (!valid) return;

    state.auth.isLoading = true;
    render();

    await new Promise((resolve) => setTimeout(resolve, 600));
    state.auth.email = email;
    state.auth.password = password;
    state.auth.isLoading = false;
    state.auth.isLoggedIn = true;
    state.auth.isAdmin = email.toLowerCase() === "admin@gmail.com";
    saveState();
    showSnackbar("Login successful");
    navigate(ROUTES.HOME);
    return;
  }

  if (event.target.id === "registerForm") {
    event.preventDefault();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const confirm = document.getElementById("regConfirm").value.trim();

    document.getElementById("regEmailError").textContent = "";
    document.getElementById("regPasswordError").textContent = "";
    document.getElementById("regConfirmError").textContent = "";

    let valid = true;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      document.getElementById("regEmailError").textContent = "Email tidak valid";
      valid = false;
    }
    if (!password || password.length < 6) {
      document.getElementById("regPasswordError").textContent = "Password minimal 6 karakter";
      valid = false;
    }
    if (password !== confirm) {
      document.getElementById("regConfirmError").textContent = "Password tidak sama";
      valid = false;
    }

    if (!valid) return;

    showSnackbar("Registered successfully");
    navigate(ROUTES.LOGIN);
  }
});

window.addEventListener("hashchange", render);

if (startupClose && startupPopup) {
  startupClose.addEventListener("click", () => {
    startupPopup.classList.add("hidden");
  });
}

loadState();
if (!window.location.hash) {
  window.location.hash = `#${state.auth.isLoggedIn ? ROUTES.HOME : ROUTES.LOGIN}`;
}
render();
