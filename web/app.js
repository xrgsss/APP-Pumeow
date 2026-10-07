const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
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
  ORDER_TRACKING: "/orders",
  ADMIN_DASHBOARD: "/admin_dashboard"
};

// ─── Firebase Configuration ─────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyB55LZ9N61YIwj0gz50uXXOueKR3lLYdD4",
  authDomain: "pumeow.firebaseapp.com",
  projectId: "pumeow",
  storageBucket: "pumeow.firebasestorage.app",
  messagingSenderId: "810280036341",
  appId: "1:810280036341:web:7661c9f86820ccac0062bc",
  measurementId: "G-NWBB03XZZV"
};

// Inisialisasi Firebase
let fbApp = null;
let fbAuth = null;
let fbDb = null;
try {
  fbApp = firebase.initializeApp(firebaseConfig);
  fbAuth = firebase.auth();
  fbDb = firebase.firestore();
  // Aktifkan offline persistence (opsional, membantu saat koneksi buruk)
  fbDb.enablePersistence({ synchronizeTabs: true }).catch(() => { });
} catch (e) {
  console.error("Firebase init error:", e);
}

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Pudding Milk",
    variant: "Vanilla",
    price: 12000,
    stock: 20,
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
    stock: 15,
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
    stock: 10,
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
    stock: 12,
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
    stock: 8,
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
    stock: 5,
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
    isAdmin: false,
    user: null
  },
  products: [...DEFAULT_PRODUCTS],
  cart: {},
  favorites: new Set(),
  purchaseHistory: [],
  orders: [], // Structured orders list
  selectedProductId: null,
  trackingOrderId: null,
  trackingOrderData: null,
  isLoadingOrder: false,
  orderTrackingError: null,
  showConfirmReceivedModal: false,
  confirmingOrderId: null,
  showProductModal: false,
  editingProduct: null,
  forgotSuccessMessage: "",
  resetSuccessMessage: "",
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

function parseHash() {
  const raw = window.location.hash || "#/login";
  // Deteksi recovery token Firebase Auth dari URL hash (jika ada)
  if (raw.includes("type=recovery") || raw.includes("access_token")) {
    return { route: ROUTES.RESET_PASSWORD, params: {} };
  }

  const clean = raw.startsWith("#") ? raw.slice(1) : raw;
  const [pathPart, queryPart] = clean.split("?");
  const params = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((v, k) => (params[k] = v));
  }

  if (pathPart.startsWith("/orders/")) {
    const id = pathPart.replace("/orders/", "");
    params.id = id;
    return { route: ROUTES.ORDER_TRACKING, params };
  }

  return { route: pathPart || ROUTES.LOGIN, params };
}

function getRoute() {
  return parseHash().route;
}

function navigate(route, args = null) {
  if (args) {
    routeState[route] = args;
    if (args.id && route === ROUTES.ORDER_TRACKING) {
      window.location.hash = `#/orders?id=${encodeURIComponent(args.id)}`;
      return;
    }
  }
  window.location.hash = `#${route}`;
}

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

  scroller.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        scroller.scrollLeft += event.deltaY;
        event.preventDefault();
      }
    },
    { passive: false }
  );
}

function showSnackbar(message) {
  snackbar.textContent = message;
  snackbar.className = "snackbar show";
  clearTimeout(showSnackbar.t);
  showSnackbar.t = setTimeout(() => {
    snackbar.className = "snackbar";
  }, 2500);
}

function formatPrice(value) {
  return `Rp${Math.round(value || 0).toLocaleString("id-ID")}`;
}

function icon(name, className = "") {
  return `<span class="material-symbols-outlined ${className}" aria-hidden="true">${name}</span>`;
}

function saveState() {
  const data = {
    auth: state.auth,
    cart: state.cart,
    favorites: [...state.favorites],
    purchaseHistory: state.purchaseHistory,
    orders: state.orders,
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
    state.orders = data.orders || [];
    state.selectedVariant = data.selectedVariant || "Semua";
    state.search = data.search || "";
    // Pastikan semua produk memiliki stok
    state.products = (data.products?.length ? data.products : [...DEFAULT_PRODUCTS]).map((p) => {
      const stock = typeof p.stock === "number" ? p.stock : 15;
      return {
        ...p,
        stock,
        isAvailable: stock > 0 && p.isAvailable !== false
      };
    });
  } catch (_) {
    // ignore corrupted localStorage
  }
}

function maskPassword(value) {
  if (!value) return "Belum ada data";
  return "*".repeat(Math.min(value.length, 12));
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
  const product = state.products.find((p) => p.id === Number(productId));
  if (!product) return;

  const stock = typeof product.stock === "number" ? product.stock : 0;
  const key = String(productId);
  const currentQty = state.cart[key] || 0;

  if (stock <= 0 || !product.isAvailable) {
    showSnackbar(`Maaf, stok "${product.name}" sedang habis!`);
    return false;
  }

  if (currentQty >= stock) {
    showSnackbar(`Maksimal ${stock} pcs! Tidak bisa melebihi stok yang tersedia.`);
    return false;
  }

  state.cart[key] = currentQty + 1;
  saveState();
  showSnackbar(`"${product.name}" ditambahkan (${currentQty + 1}/${stock} pcs)`);
  return true;
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

// ─── Firebase Products Services ─────────────────────────────────
async function firebaseFetchProducts() {
  if (fbDb) {
    try {
      const snap = await fbDb.collection("products").get();
      if (!snap.empty) {
        state.products = snap.docs.map((d) => {
          const data = d.data();
          const stock = typeof data.stock === "number" ? data.stock : 10;
          return {
            id: isNaN(d.id) ? d.id : Number(d.id),
            ...data,
            stock,
            isAvailable: stock > 0 && data.isAvailable !== false
          };
        });
        saveState();
        return state.products;
      }
    } catch (e) {
      console.warn("Firestore fetch products warning:", e);
    }
  }
  return state.products;
}

async function firebaseSaveProduct(product) {
  if (fbDb) {
    try {
      await fbDb.collection("products").doc(String(product.id)).set(product, { merge: true });
    } catch (e) {
      console.warn("Firestore save product warning:", e);
    }
  }
}

async function firebaseDeleteProduct(productId) {
  if (fbDb) {
    try {
      await fbDb.collection("products").doc(String(productId)).delete();
    } catch (e) {
      console.warn("Firestore delete product warning:", e);
    }
  }
}

// -------------------------------------------------------------
// FIREBASE OPERATIONS & SERVICES
// -------------------------------------------------------------

/** Kirim email reset password via Firebase Auth */
async function firebaseResetPasswordForEmail(email) {
  if (fbAuth) {
    try {
      await fbAuth.sendPasswordResetEmail(email);
    } catch (err) {
      // Log tapi tetap return success agar tidak bocor info akun
      console.warn("Firebase resetPassword warning:", err.message);
    }
  }
  return true; // Selalu sukses generik demi keamanan
}

/** Update password user yang sedang login via Firebase Auth */
async function firebaseUpdateUserPassword(newPassword) {
  if (fbAuth && fbAuth.currentUser) {
    try {
      await fbAuth.currentUser.updatePassword(newPassword);
      return { success: true };
    } catch (err) {
      console.warn("Firebase updatePassword error:", err);
      throw err;
    }
  }
  return { success: true };
}

/** Buat pesanan baru di Firestore (koleksi 'orders' + subkoleksi 'items') */
async function firebaseCreateOrder(orderData, itemsData) {
  const orderId = orderData.id;
  if (fbDb) {
    try {
      const orderRef = fbDb.collection("orders").doc(orderId);
      await orderRef.set({
        id: orderId,
        user_id: state.auth.user?.uid || null,
        buyer_email: state.auth.email,
        method: orderData.method,
        total: orderData.total,
        lat: orderData.lat || null,
        lng: orderData.lng || null,
        address: orderData.address || "",
        status: orderData.status || "paid",
        courier: orderData.courier || null,
        tracking_number: null,
        shipping_date: null,
        estimated_delivery: null,
        delivered_at: null,
        created_at: orderData.created_at || new Date().toISOString()
      });

      if (itemsData && itemsData.length) {
        const batch = fbDb.batch();
        itemsData.forEach((it) => {
          const itemRef = orderRef.collection("items").doc();
          batch.set(itemRef, {
            product_id: it.product.id,
            name: it.product.name,
            variant: it.product.variant,
            quantity: it.quantity,
            price: it.product.price
          });
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn("Firebase createOrder error, saving locally:", err);
    }
  }
  return orderId;
}

/** Ambil satu pesanan dari Firestore beserta items-nya */
async function firebaseFetchOrder(orderId) {
  if (fbDb) {
    try {
      const doc = await fbDb.collection("orders").doc(orderId).get();
      if (doc.exists) {
        const order = { id: doc.id, ...doc.data() };
        // Ambil items subkoleksi
        const itemsSnap = await fbDb
          .collection("orders").doc(orderId)
          .collection("items").get();
        order.items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return order;
      }
    } catch (err) {
      console.warn("Firebase fetchOrder error, checking local:", err);
    }
  }
  return state.orders.find((o) => String(o.id) === String(orderId)) || null;
}

/** Update status pesanan di Firestore */
async function firebaseUpdateOrderStatus(orderId, newStatus, extraData = {}) {
  const updatePayload = { status: newStatus, ...extraData };
  if (fbDb) {
    try {
      const ref = fbDb.collection("orders").doc(orderId);
      // Validasi kepemilikan: customer hanya bisa update ke completed
      if (!state.auth.isAdmin) {
        const snap = await ref.get();
        if (snap.exists) {
          const data = snap.data();
          const isOwner = data.user_id === (state.auth.user?.uid || null) ||
            data.buyer_email === state.auth.email;
          if (!isOwner) {
            console.warn("Firebase: akses ditolak, bukan pemilik pesanan");
            return false;
          }
        }
      }
      await ref.update(updatePayload);
    } catch (err) {
      console.warn("Firebase updateOrderStatus error:", err);
    }
  }
  // Update local store
  const localOrder = state.orders.find((o) => String(o.id) === String(orderId));
  if (localOrder) Object.assign(localOrder, updatePayload);
  saveState();
  return true;
}

/** Ambil semua pesanan dari Firestore (untuk admin atau user sendiri) */
async function firebaseFetchAllOrders() {
  if (fbDb) {
    try {
      let query = fbDb.collection("orders").orderBy("created_at", "desc");
      // Filter per user jika bukan admin
      if (!state.auth.isAdmin && state.auth.user?.uid) {
        query = query.where("user_id", "==", state.auth.user.uid);
      }
      const snap = await query.get();
      if (!snap.empty) {
        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        fetched.forEach((fbOrder) => {
          const idx = state.orders.findIndex((o) => String(o.id) === String(fbOrder.id));
          if (idx >= 0) {
            state.orders[idx] = { ...state.orders[idx], ...fbOrder };
          } else {
            state.orders.unshift(fbOrder);
          }
        });
        saveState();
        return state.orders;
      }
    } catch (err) {
      console.warn("Firebase fetchAllOrders error:", err);
    }
  }
  return state.orders;
}

// ─── Realtime Firestore Listeners ───────────────────────────────
let orderRealtimeUnsub = null;
let allOrdersRealtimeUnsub = null;

/** Langganan realtime untuk satu pesanan (user tracking live) */
function subscribeOrderRealtime(orderId) {
  if (orderRealtimeUnsub) {
    orderRealtimeUnsub();
    orderRealtimeUnsub = null;
  }
  if (!fbDb || !orderId) return;

  try {
    orderRealtimeUnsub = fbDb.collection("orders").doc(String(orderId)).onSnapshot((doc) => {
      if (doc.exists) {
        const orderData = { id: doc.id, ...doc.data() };
        // Sync items subcollection
        fbDb.collection("orders").doc(String(orderId)).collection("items").get().then((itemsSnap) => {
          orderData.items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          state.trackingOrderData = orderData;
          state.isLoadingOrder = false;
          const idx = state.orders.findIndex((o) => String(o.id) === String(orderId));
          if (idx >= 0) state.orders[idx] = { ...state.orders[idx], ...orderData };
          saveState();
          render();
        }).catch(() => {
          state.trackingOrderData = orderData;
          state.isLoadingOrder = false;
          render();
        });
      } else {
        // Dokumen tidak ditemukan di Firestore
        state.trackingOrderData = null;
        state.isLoadingOrder = false;
        render();
      }
    }, (err) => {
      console.warn("Realtime order tracking snapshot error:", err);
      // Hentikan loading jika terjadi error pada listener
      state.isLoadingOrder = false;
      render();
    });
  } catch (err) {
    console.warn("Failed to subscribe order realtime:", err);
  }
}

/** Langganan realtime untuk seluruh daftar pesanan di Admin Dashboard */
function subscribeAllOrdersRealtime() {
  if (allOrdersRealtimeUnsub) {
    allOrdersRealtimeUnsub();
    allOrdersRealtimeUnsub = null;
  }
  if (!fbDb) return;

  try {
    let query = fbDb.collection("orders").orderBy("created_at", "desc");
    if (!state.auth.isAdmin && state.auth.user?.uid) {
      query = query.where("user_id", "==", state.auth.user.uid);
    }
    allOrdersRealtimeUnsub = query.onSnapshot((snap) => {
      if (!snap.empty) {
        state.orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        saveState();
        render();
      }
    }, (err) => {
      console.warn("Realtime all orders snapshot error:", err);
    });
  } catch (err) {
    console.warn("Failed to subscribe all orders realtime:", err);
  }
}

async function doCheckout(method, args = {}) {
  const items = cartEntries();
  if (!items.length) {
    showSnackbar("Keranjang masih kosong");
    return null;
  }

  // 1. VALIDASI STOK KETAT: Cek apakah ada barang yang melebihi stok
  for (const it of items) {
    const prod = state.products.find((p) => p.id === it.product.id);
    const stock = prod ? (typeof prod.stock === "number" ? prod.stock : 0) : 0;
    if (!prod || stock < it.quantity) {
      showSnackbar(`Gagal Checkout: Stok "${it.product.name}" tersisa ${stock} pcs (di keranjang: ${it.quantity} pcs)`);
      return null;
    }
  }

  const now = new Date().toISOString();
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const orderId = `ORD-${Date.now()}`;

  const orderRecord = {
    id: orderId,
    orderId: orderId,
    user_id: state.auth.user?.uid || null,
    buyer_email: state.auth.email || "user@gmail.com",
    method,
    total,
    status: "paid", // Status pesanan: pending, paid, processing, shipped, completed
    paymentStatus: "Lunas (Simulasi)",
    lat: args.lat || null,
    lng: args.lng || null,
    address: args.address || "",
    courier: args.method === "Ambil di tempat" ? "Pickup di Dapur Pumeow" : "Driver Pumeow",
    tracking_number: null,
    shipping_date: null,
    estimated_delivery: null,
    delivered_at: null,
    createdAt: now,
    created_at: now,
    items: items.map((it) => ({
      product: it.product,
      quantity: it.quantity,
      price: it.product.price
    }))
  };

  // Add to local lists
  state.orders.unshift(orderRecord);

  // Sync purchaseHistory for compatibility
  items.forEach(({ product, quantity }) => {
    state.purchaseHistory.push({
      product,
      quantity,
      method,
      createdAt: now,
      orderId: orderId,
      lat: args.lat || null,
      lng: args.lng || null,
      address: args.address || "",
      status: "paid",
      total: total
    });
  });

  // 2. POTONG STOK PRODUK SECARA OTOMATIS
  items.forEach(({ product, quantity }) => {
    const prod = state.products.find((p) => p.id === product.id);
    if (prod) {
      prod.stock = Math.max(0, (typeof prod.stock === "number" ? prod.stock : 0) - quantity);
      if (prod.stock === 0) {
        prod.isAvailable = false;
      }
      firebaseSaveProduct(prod);
    }
  });

  // Simpan ke Firebase Firestore
  firebaseCreateOrder(orderRecord, items).catch((e) => console.warn(e));

  state.cart = {};
  saveState();

  return orderRecord;
}

// -------------------------------------------------------------
// UI RENDERING HELPERS
// -------------------------------------------------------------

function renderHeader(title, backRoute = null) {
  return `<div class="head-row"><h2 class="page-title">${title}</h2>${backRoute
      ? `<button class="btn btn-ghost small" data-action="go" data-route="${backRoute}">Kembali</button>`
      : ""
    }</div>`;
}

function renderStatusBadge(status) {
  const s = (status || "pending").toLowerCase();
  let label = s;
  switch (s) {
    case "pending":
      label = "Pesanan Dibuat";
      break;
    case "paid":
      label = "Dibayar";
      break;
    case "processing":
      label = "Diproses";
      break;
    case "shipped":
      label = "Dikirim";
      break;
    case "completed":
      label = "Selesai";
      break;
    case "cancelled":
      label = "Dibatalkan";
      break;
  }
  return `<span class="status-badge status-${s}">${label}</span>`;
}

function renderBottomNav() {
  return `
    <nav class="docked-nav" aria-label="Navigasi Utama">
      <div class="docked-nav-inner">
        <button class="nav-icon-btn" data-action="go" data-route="${ROUTES.PROFILE}" title="Profil">${icon("person")}</button>
        <button class="nav-icon-btn" data-action="go" data-route="${ROUTES.FAVORITES}" title="Favorit">${icon("favorite")}</button>
        <button class="nav-icon-btn" data-action="go" data-route="${ROUTES.CART}" title="Keranjang">${icon("shopping_cart")}</button>
        ${state.auth.isAdmin ? `<button class="nav-icon-btn" data-action="go" data-route="${ROUTES.ADMIN_DASHBOARD}" title="Admin">${icon("dashboard")}</button>` : ""}
      </div>
    </nav>
  `;
}

// -------------------------------------------------------------
// VIEWS
// -------------------------------------------------------------

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
            <div class="input-shell"><span class="field-icon">${icon("mail")}</span><input id="loginEmail" type="email" placeholder="you@example.com" value="${state.auth.email || ''}" required></div>
            <p class="error-text" id="loginEmailError"></p>
          </div>
          <div class="field-group">
            <label class="field-label" for="loginPassword">Password</label>
            <div class="input-shell"><span class="field-icon">${icon("lock")}</span><input id="loginPassword" type="password" placeholder="Enter password" required></div>
            <p class="error-text" id="loginPasswordError"></p>
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:-6px; margin-bottom:8px;">
            <a href="#${ROUTES.FORGOT_PASSWORD}" style="font-size:0.82rem; font-weight:600; color:var(--brown); text-decoration:none;" data-action="go" data-route="${ROUTES.FORGOT_PASSWORD}">Lupa Password?</a>
          </div>
          <button class="btn btn-primary" type="submit">${state.auth.isLoading ? "Loading..." : "Login"}</button>
        </form>
        <p class="inline-link"><a href="#" data-action="go" data-route="${ROUTES.REGISTER}">Belum punya akun? Register</a></p>
      </article>
    </section>
  `;
}

function renderForgotPassword() {
  return `
    <section class="view">
      ${renderHeader("Lupa Password", ROUTES.LOGIN)}
      <article class="card">
        <div style="text-align:center; padding:10px 0 6px;">
          <div style="width:52px; height:52px; border-radius:50%; background:var(--brown-soft); color:var(--brown); display:grid; place-items:center; margin:0 auto 10px;">
            ${icon("lock_reset")}
          </div>
          <h3 style="margin:0 0 6px; font-size:1.1rem; color:var(--dark-brown);">Lupa Password</h3>
          <p class="small muted" style="margin:0; line-height:1.5;">Masukkan email yang terdaftar untuk mendapatkan link reset password.</p>
        </div>

        ${state.forgotSuccessMessage ? `
          <div class="info-banner" style="margin:12px 0;">
            ${icon("check_circle", "small-icon")}
            <div>${state.forgotSuccessMessage}</div>
          </div>
        ` : ""}

        <form class="form" id="forgotPasswordForm" style="margin-top:12px;" novalidate>
          <div class="field-group">
            <label class="field-label" for="forgotEmail">Email</label>
            <div class="input-shell">
              <span class="field-icon">${icon("mail")}</span>
              <input id="forgotEmail" type="email" placeholder="you@example.com" value="${state.auth.email || ''}" required>
            </div>
            <p class="error-text" id="forgotEmailError"></p>
          </div>
          <button class="btn btn-primary" type="submit" id="btnForgotSubmit">
            ${state.auth.isLoading ? "Mengirim..." : "Kirim Link Reset Password"}
          </button>
        </form>
        <div style="text-align:center; margin-top:14px;">
          <a href="#${ROUTES.LOGIN}" style="font-size:0.85rem; font-weight:600; color:var(--brown); text-decoration:none;" data-action="go" data-route="${ROUTES.LOGIN}">Kembali ke Login</a>
        </div>
      </article>
    </section>
  `;
}

function renderResetPassword() {
  return `
    <section class="view">
      ${renderHeader("Reset Password", ROUTES.LOGIN)}
      <article class="card">
        <div style="text-align:center; padding:10px 0 6px;">
          <div style="width:52px; height:52px; border-radius:50%; background:var(--brown-soft); color:var(--brown); display:grid; place-items:center; margin:0 auto 10px;">
            ${icon("key")}
          </div>
          <h3 style="margin:0 0 6px; font-size:1.1rem; color:var(--dark-brown);">Password Baru</h3>
          <p class="small muted" style="margin:0; line-height:1.5;">Silakan masukkan password baru untuk akun Anda.</p>
        </div>

        ${state.resetSuccessMessage ? `
          <div class="info-banner" style="margin:12px 0;">
            ${icon("check_circle", "small-icon")}
            <div>${state.resetSuccessMessage}</div>
          </div>
        ` : ""}

        <form class="form" id="resetPasswordForm" style="margin-top:12px;" novalidate>
          <div class="field-group">
            <label class="field-label" for="newPassword">Password Baru</label>
            <div class="input-shell">
              <span class="field-icon">${icon("lock")}</span>
              <input id="newPassword" type="password" placeholder="Minimal 6 karakter" required>
            </div>
            <p class="error-text" id="newPasswordError"></p>
          </div>
          <div class="field-group">
            <label class="field-label" for="confirmNewPassword">Konfirmasi Password</label>
            <div class="input-shell">
              <span class="field-icon">${icon("lock")}</span>
              <input id="confirmNewPassword" type="password" placeholder="Ulangi password baru" required>
            </div>
            <p class="error-text" id="confirmNewPasswordError"></p>
          </div>
          <button class="btn btn-primary" type="submit" id="btnResetSubmit">
            ${state.auth.isLoading ? "Menyimpan..." : "Reset Password"}
          </button>
        </form>
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
          <button class="btn btn-primary" type="submit">${state.auth.isLoading ? "Loading..." : "REGISTER"}</button>
        </form>
      </article>
    </section>
  `;
}

function renderStockBadge(product) {
  const stock = typeof product.stock === "number" ? product.stock : 0;
  if (stock <= 0 || !product.isAvailable) {
    return `<span class="badge-stock out-of-stock">${icon("do_not_disturb_on", "small-icon")} Habis</span>`;
  }
  if (stock <= 3) {
    return `<span class="badge-stock low-stock">${icon("warning", "small-icon")} Sisa ${stock}</span>`;
  }
  return `<span class="badge-stock in-stock">${icon("check_circle", "small-icon")} Stok ${stock}</span>`;
}

function renderProductCard(product) {
  const isFavorite = state.favorites.has(product.id);
  const isOutOfStock = (product.stock ?? 0) <= 0 || !product.isAvailable;
  return `
    <article class="product-card" data-action="open-product" data-id="${product.id}">
      <img class="product-image" src="${product.imageAsset}" alt="${product.name}">
      <div>
        <div class="product-top">
          <span class="variant-pill">${product.variant.toUpperCase()}</span>
          <span style="margin-left:auto"></span>
          <button class="icon-btn ${isFavorite ? "active" : ""}" data-action="toggle-favorite" data-id="${product.id}">${icon(isFavorite ? "favorite" : "favorite_border")}</button>
          <button class="icon-btn ${isOutOfStock ? "btn-disabled" : ""}" data-action="add-cart" data-id="${product.id}" title="${isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}">
            ${icon(isOutOfStock ? "remove_shopping_cart" : "add_shopping_cart")}
          </button>
        </div>
        <div style="font-weight:800; margin-top:6px;">${product.name}</div>
        <div class="small muted">${icon("location_on", "small-icon")} ${product.location}</div>
        <div class="head-row" style="margin-top:8px;">
          <div class="small">${icon("star", "small-icon")} ${product.rating.toFixed(1)}</div>
          <div class="price">${formatPrice(product.price)}</div>
          ${renderStockBadge(product)}
        </div>
      </div>
    </article>
  `;
}

function renderHome() {
  const variants = ["Semua", "Vanilla", "Chocolate", "Mango", "Taro", "Pandan", "Buah"];
  const query = state.search.toLowerCase();
  const filtered = state.products.filter((p) => {
    const matchQuery =
      p.name.toLowerCase().includes(query) ||
      p.variant.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query);
    const matchFilter =
      state.selectedVariant === "Semua" || p.variant === state.selectedVariant;
    return matchQuery && matchFilter;
  });

  return `
    <section class="view home-view">
      <header class="home-head">
        <div>
          <div class="logo-title">${icon("pets", "logo-icon")} PumeowID</div>
          <div class="small muted">Pudding lembut khas Malang</div>
        </div>
        <button class="icon-btn" data-action="go" data-route="${ROUTES.MAP}" title="Pilih Lokasi">${icon("location_on")}</button>
      </header>

      <div class="search-box">
        ${icon("search")}
        <input id="searchInput" type="search" placeholder="Cari pudding..." value="${state.search}">
      </div>

      <div class="row-scroll chips">
        ${variants.map((v) => `<button class="chip ${state.selectedVariant === v ? "active" : ""}" data-action="set-variant" data-variant="${v}">${v}</button>`).join("")}
      </div>

      <div class="grid">
        ${filtered.length ? filtered.map(renderProductCard).join("") : `<div class="card muted">Tidak ada produk ditemukan.</div>`}
      </div>
    </section>
  `;
}

function renderProductDetail() {
  const p = currentProduct();
  const isOutOfStock = (p.stock ?? 0) <= 0 || !p.isAvailable;
  return `
    <section class="view">
      ${renderHeader(`${p.name} - ${p.variant}`, ROUTES.HOME)}
      <article class="card">
        <img class="product-image" style="width:100%; height:200px; object-fit:cover;" src="${p.imageAsset}" alt="${p.name}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
          <div class="variant-pill">${p.variant}</div>
          ${renderStockBadge(p)}
        </div>
        <h3 style="margin:10px 0 6px;">${p.name}</h3>
        <div class="small muted">${icon("location_on", "small-icon")} ${p.location}</div>
        <p class="small" style="line-height:1.55;">${p.description}</p>
        <div class="head-row">
          <strong class="price">${formatPrice(p.price)}</strong>
          <button class="btn btn-primary ${isOutOfStock ? "btn-disabled" : ""}" data-action="add-cart" data-id="${p.id}">
            ${isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
          </button>
        </div>
      </article>
    </section>
  `;
}

function renderCart() {
  const entries = cartEntries();
  const total = entries.reduce((s, e) => s + e.product.price * e.quantity, 0);
  const exceededStockItem = entries.find((e) => e.quantity > (typeof e.product.stock === "number" ? e.product.stock : 0));

  return `
    <section class="view">
      ${renderHeader("Keranjang", ROUTES.HOME)}
      ${entries.length ? entries.map(({ product, quantity }) => {
        const stock = typeof product.stock === "number" ? product.stock : 0;
        const isExceeded = quantity > stock;
        return `
          <div class="list-item" style="${isExceeded ? "border:1.5px solid #f87171; background:#fff5f5;" : ""}">
            <div>
              <div style="font-weight:700;">${product.name} - ${product.variant}</div>
              <div class="small muted">
                ${formatPrice(product.price)} x ${quantity} = <strong>${formatPrice(product.price * quantity)}</strong>
              </div>
              <div style="margin-top:4px;">
                ${isExceeded ? `<span class="badge-stock out-of-stock">Melebihi stok! (Tersedia ${stock})</span>` : renderStockBadge(product)}
              </div>
            </div>
            <div class="qty">
              <button data-action="dec-cart" data-id="${product.id}">-</button>
              <strong>${quantity}</strong>
              <button data-action="inc-cart" data-id="${product.id}">+</button>
            </div>
          </div>
        `;
      }).join("") : `<div class="card muted">Keranjang kosong</div>`}

      ${exceededStockItem ? `
        <div class="card" style="background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; font-size:0.85rem; margin-top:8px;">
          ⚠️ <strong>Stok tidak mencukupi!</strong> Jumlah pesanan untuk <em>"${exceededStockItem.product.name}"</em> (${exceededStockItem.quantity} pcs) melebihi stok yang tersedia (${exceededStockItem.product.stock} pcs). Silakan kurangi jumlah barang sebelum checkout.
        </div>
      ` : ""}

      ${entries.length ? `
        <article class="card" style="margin-top:8px;">
          <div style="display:flex; justify-content:space-between; font-weight:700;">
            <span>Total:</span>
            <span class="price">${formatPrice(total)}</span>
          </div>
        </article>
        ${exceededStockItem ? `
          <button class="btn btn-primary btn-disabled" type="button" disabled style="opacity:0.6; cursor:not-allowed;">
            Checkout Tidak Dapat Dilanjutkan (Stok Kurang)
          </button>
        ` : `
          <button class="btn btn-primary" data-action="go" data-route="${ROUTES.CHECKOUT}">Lanjut ke Checkout</button>
        `}
      ` : ""}
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
  const history = [...state.orders];
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

      <h3 class="page-title" style="font-size:1rem; margin-top:8px;">Riwayat Pesanan</h3>
      ${history.length ? history.map((order) => `
        <div class="card" style="margin-bottom:8px; padding:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="font-size:0.85rem; font-family:monospace; color:var(--dark-brown);">${order.id || order.orderId}</strong>
            ${renderStatusBadge(order.status)}
          </div>
          <div class="small muted">${order.createdAt ? new Date(order.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-"} • ${order.method || "Pengiriman"}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <strong class="price" style="font-size:0.95rem;">${formatPrice(order.total)}</strong>
            <button class="btn btn-ghost small" data-action="track-order" data-id="${order.id || order.orderId}">
              ${icon("local_shipping", "small-icon")} Lacak Pesanan
            </button>
          </div>
        </div>
      `).join("") : `<div class="card muted">Belum ada riwayat pesanan.</div>`}
    </section>
  `;
}

function renderCheckout() {
  return `
    <section class="view">
      ${renderHeader("Pilih Metode Pengiriman", ROUTES.CART)}
      <article class="card" style="display:flex; flex-direction:column; gap:12px;">
        <button class="btn btn-ghost" data-action="checkout-pickup" style="text-align:left; padding:14px; display:flex; align-items:center; gap:12px;">
          ${icon("store", "small-icon")}
          <div>
            <div style="font-weight:700;">Ambil di tempat</div>
            <div class="small muted">Datang langsung ke dapur Pumeow untuk ambil pesanan</div>
          </div>
        </button>
        <button class="btn btn-primary" data-action="checkout-delivery" style="text-align:left; padding:14px; display:flex; align-items:center; gap:12px;">
          ${icon("delivery_dining", "small-icon")}
          <div>
            <div style="font-weight:700;">Driver ke tujuan</div>
            <div class="small" style="opacity:0.9;">Kami antar ke lokasi kamu, pilih lokasi di peta</div>
          </div>
        </button>
      </article>
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
      <div style="display:flex; flex-direction:column; gap:8px;">
        <button class="btn btn-ghost" data-action="choose-payment" data-method="E-Wallet">E-Wallet (OVO, DANA, GoPay)</button>
        <button class="btn btn-ghost" data-action="choose-payment" data-method="Debit">Kartu Debit</button>
        <button class="btn btn-ghost" data-action="choose-payment" data-method="Virtual Account">Virtual Account</button>
        <button class="btn btn-ghost" data-action="choose-payment" data-method="QRIS">QRIS</button>
      </div>
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
        <p class="small muted">${method === "QRIS"
      ? "Scan kode QR (simulasi pembayaran)."
      : method === "Virtual Account"
        ? "No. VA (simulasi): 8808 1234 5678 9012"
        : method === "Debit"
          ? "Masukkan kartu pada EDC (simulasi)."
          : "Buka dompet digital lalu konfirmasi pembayaran (simulasi)."
    }</p>
      </article>
      <button class="btn btn-primary" data-action="confirm-payment">Konfirmasi Pembayaran (Simulasi)</button>
    </section>
  `;
}

// -------------------------------------------------------------
// FEATURE 2: PAYMENT SUCCESS / ORDER CONFIRMATION
// -------------------------------------------------------------

function renderPaymentSuccess() {
  const args = routeState[ROUTES.PAYMENT_SUCCESS] || {};
  const orderId = args.orderId || (state.orders.length ? state.orders[0].id : "ORD-001");
  const order = state.orders.find((o) => String(o.id) === String(orderId)) || args.order || {};
  const dateFormatted = order.createdAt || order.created_at
    ? new Date(order.createdAt || order.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
    : new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  const totalVal = order.total || args.total || 0;
  const paymentStatus = order.paymentStatus || "Lunas (Simulasi)";
  const orderStatus = order.status || "paid";

  return `
    <section class="view">
      <article class="card" style="text-align:center; padding:22px 16px;">
        <span class="material-symbols-outlined success-icon" style="color:#16a34a; font-size:64px;">check_circle</span>
        <h2 style="margin:10px 0 4px; font-size:1.2rem; font-weight:800; color:var(--dark-brown);">Pesanan Berhasil Dibuat</h2>
        <p class="small muted" style="margin-bottom:14px; line-height:1.45;">Terima kasih! Pesanan Anda telah tercatat dan sedang diproses.</p>

        <div style="background:#ffffff; border:1px solid var(--stroke); border-radius:14px; padding:12px; text-align:left; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span class="small muted">Nomor Pesanan</span>
            <strong class="small" style="font-family:monospace; color:var(--dark-brown);">${orderId}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span class="small muted">Tanggal Pesanan</span>
            <span class="small" style="font-weight:600;">${dateFormatted}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span class="small muted">Total Harga</span>
            <strong class="small price" style="color:var(--dark-brown);">${formatPrice(totalVal)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span class="small muted">Status Pembayaran</span>
            <span class="small" style="color:#16a34a; font-weight:700;">${paymentStatus}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="small muted">Status Pesanan</span>
            ${renderStatusBadge(orderStatus)}
          </div>
        </div>

        <button class="btn btn-primary" data-action="track-order" data-id="${orderId}" style="width:100%; margin-bottom:8px;">
          ${icon("local_shipping", "small-icon")} Lacak Pesanan
        </button>
        <button class="btn btn-ghost" data-action="go" data-route="${ROUTES.HOME}" style="width:100%;">
          Kembali ke Beranda
        </button>
      </article>
    </section>
  `;
}

// -------------------------------------------------------------
// FEATURE 2 & 3: ORDER TRACKING & CONFIRMATION
// -------------------------------------------------------------

function renderOrderTracking() {
  const hashData = parseHash();
  const orderId = hashData.params.id || routeState[ROUTES.ORDER_TRACKING]?.id || (state.orders.length ? state.orders[0].id : null);

  if (state.isLoadingOrder) {
    return `
      <section class="view">
        ${renderHeader("Track Pesanan", ROUTES.PROFILE)}
        <article class="card" style="text-align:center; padding:32px 16px;">
          <div style="display:inline-block; width:32px; height:32px; border:3px solid var(--stroke); border-top-color:var(--orange); border-radius:50%; animation:spin 1s linear infinite;"></div>
          <p class="small muted" style="margin-top:12px;">Memuat data pesanan dari Firebase...</p>
        </article>
      </section>
    `;
  }

  const order = state.trackingOrderData || state.orders.find((o) => String(o.id) === String(orderId));

  if (!order) {
    return `
      <section class="view">
        ${renderHeader("Track Pesanan", ROUTES.PROFILE)}
        <article class="card" style="text-align:center; padding:24px 16px;">
          ${icon("error_outline", "success-icon")}
          <h3 style="margin:10px 0 6px;">Pesanan Tidak Ditemukan</h3>
          <p class="small muted">Nomor pesanan ${orderId || "-"} tidak tersedia dalam database.</p>
          <button class="btn btn-primary" data-action="go" data-route="${ROUTES.HOME}" style="margin-top:12px;">Kembali ke Beranda</button>
        </article>
      </section>
    `;
  }

  // Ownership security check
  const userUid = state.auth.user?.uid || state.auth.user?.id;
  const isOwner = !order.user_id || !userUid || order.user_id === userUid || order.buyer_email === state.auth.email;
  if (!isOwner && !state.auth.isAdmin) {
    return `
      <section class="view">
        ${renderHeader("Track Pesanan", ROUTES.HOME)}
        <article class="card" style="text-align:center; padding:24px 16px;">
          ${icon("gpp_bad", "success-icon")}
          <h3 style="margin:10px 0 6px; color:var(--danger);">Akses Ditolak</h3>
          <p class="small muted">Anda tidak memiliki izin untuk melihat detail pesanan ini.</p>
          <button class="btn btn-primary" data-action="go" data-route="${ROUTES.HOME}" style="margin-top:12px;">Kembali ke Beranda</button>
        </article>
      </section>
    `;
  }

  const currentStatus = (order.status || "pending").toLowerCase();

  // Progress stepper mapping
  // Stages: 1: pending (Pesanan Dibuat), 2: paid (Pembayaran Dikonfirmasi), 3: processing (Pesanan Diproses), 4: shipped (Pesanan Dikirim), 5: completed (Pesanan Diterima)
  const steps = [
    { key: "pending", title: "Pesanan Dibuat", desc: "Pesanan telah diterima sistem", icon: "receipt_long" },
    { key: "paid", title: "Pembayaran Dikonfirmasi", desc: "Pembayaran telah terverifikasi", icon: "payments" },
    { key: "processing", title: "Pesanan Diproses", desc: "Dapur sedang menyiapkan pesanan", icon: "soup_kitchen" },
    { key: "shipped", title: "Pesanan Dikirim", desc: "Pesanan dalam perjalanan ke lokasi", icon: "local_shipping" },
    { key: "completed", title: "Pesanan Diterima", desc: "Pesanan telah selesai & diterima", icon: "verified" }
  ];

  const statusOrderIndex = {
    pending: 0,
    paid: 1,
    processing: 2,
    shipped: 3,
    completed: 4
  };

  const currentIndex = statusOrderIndex[currentStatus] !== undefined ? statusOrderIndex[currentStatus] : 1;

  // Has shipping details?
  const hasShipping = Boolean(order.courier || order.tracking_number || order.shipping_date || order.estimated_delivery || order.delivered_at);

  return `
    <section class="view">
      ${renderHeader("Track Pesanan", ROUTES.PROFILE)}

      <!-- Order Summary Card -->
      <article class="card" style="padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <span class="small muted">No. Pesanan</span>
            <div style="font-weight:800; font-family:monospace; color:var(--dark-brown);">${order.id}</div>
          </div>
          ${renderStatusBadge(currentStatus)}
        </div>
        <div class="order-meta-grid">
          <div class="order-meta-item">
            <span class="order-meta-label">Metode</span>
            <span class="order-meta-value">${order.method || "Pengiriman"}</span>
          </div>
          <div class="order-meta-item">
            <span class="order-meta-label">Total Pembayaran</span>
            <span class="order-meta-value price">${formatPrice(order.total)}</span>
          </div>
          <div class="order-meta-item">
            <span class="order-meta-label">Tanggal</span>
            <span class="order-meta-value">${order.createdAt || order.created_at ? new Date(order.createdAt || order.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-"}</span>
          </div>
          <div class="order-meta-item">
            <span class="order-meta-label">Pembeli</span>
            <span class="order-meta-value">${order.buyer_email || state.auth.email}</span>
          </div>
        </div>
      </article>

      <!-- Tracking Timeline Card -->
      <article class="card" style="padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <h3 style="margin:0; font-size:0.95rem; font-weight:800; color:var(--dark-brown);">Status Pengiriman</h3>
            <span style="display:inline-flex; align-items:center; gap:5px; font-size:0.7rem; color:#16a34a; font-weight:700; background:#f0fdf4; padding:2px 8px; border-radius:999px; border:1px solid #bbf7d0;">
              <span style="width:6px; height:6px; border-radius:50%; background:#16a34a; display:inline-block; animation:pulseDot 1.5s infinite;"></span> Live Realtime
            </span>
          </div>
          <button class="btn btn-ghost small" data-action="refresh-order" data-id="${order.id}">
            ${icon("refresh", "small-icon")} Refresh
          </button>
        </div>

        <div class="tracking-timeline">
          ${steps.map((st, idx) => {
    const isCompleted = currentStatus === "completed" || idx < currentIndex;
    const isActive = currentStatus !== "completed" && idx === currentIndex;
    const stateClass = isCompleted ? "completed" : isActive ? "active" : "upcoming";
    const iconName = isCompleted ? "check" : st.icon;

    return `
              <div class="timeline-item ${stateClass}">
                ${idx < steps.length - 1 ? `<div class="timeline-connector"></div>` : ""}
                <div class="timeline-marker">
                  ${icon(iconName, "small-icon")}
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">${st.title}</div>
                  <div class="timeline-desc">${st.desc}</div>
                </div>
              </div>
            `;
  }).join("")}
        </div>
      </article>

      <!-- Informasi Pengiriman (hanya tampil jika data tersedia di database) -->
      ${hasShipping ? `
        <article class="card" style="padding:14px;">
          <h3 style="margin:0 0 10px; font-size:0.95rem; font-weight:800; color:var(--dark-brown);">Informasi Pengiriman</h3>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${order.courier ? `
              <div style="display:flex; justify-content:space-between;">
                <span class="small muted">Kurir:</span>
                <span class="small" style="font-weight:600;">${order.courier}</span>
              </div>
            ` : ""}
            ${order.tracking_number ? `
              <div style="display:flex; justify-content:space-between;">
                <span class="small muted">Nomor Resi:</span>
                <strong class="small" style="font-family:monospace;">${order.tracking_number}</strong>
              </div>
            ` : ""}
            ${order.shipping_date ? `
              <div style="display:flex; justify-content:space-between;">
                <span class="small muted">Tanggal Pengiriman:</span>
                <span class="small">${new Date(order.shipping_date).toLocaleString("id-ID")}</span>
              </div>
            ` : ""}
            ${order.estimated_delivery ? `
              <div style="display:flex; justify-content:space-between;">
                <span class="small muted">Estimasi Tiba:</span>
                <span class="small">${order.estimated_delivery}</span>
              </div>
            ` : ""}
            ${order.delivered_at ? `
              <div style="display:flex; justify-content:space-between;">
                <span class="small muted">Diterima Pada:</span>
                <span class="small" style="color:#16a34a; font-weight:600;">${new Date(order.delivered_at).toLocaleString("id-ID")}</span>
              </div>
            ` : ""}
          </div>
        </article>
      ` : ""}

      <!-- FEATURE 3: TOMBOL KONFIRMASI PESANAN DITERIMA -->
      <!-- Hanya tampil ketika status === 'shipped' dan belum completed -->
      ${currentStatus === "shipped" ? `
        <article class="card" style="padding:14px; text-align:center; background:#f0fdf4; border:1px solid #bbf7d0;">
          <div style="font-weight:700; color:#166534; margin-bottom:4px;">Pesanan Anda Sudah Dikirim!</div>
          <p class="small muted" style="margin-bottom:12px;">Jika Anda telah menerima pesanan ini dengan baik, silakan lakukan konfirmasi.</p>
          <button class="btn btn-primary" data-action="open-confirm-modal" data-id="${order.id}" style="width:100%; background:#16a34a;">
            ${icon("task_alt", "small-icon")} Pesanan Sudah Diterima
          </button>
        </article>
      ` : ""}

      <!-- MODAL CONFIRMATION DIALOG -->
      ${state.showConfirmReceivedModal ? `
        <div class="confirm-overlay" role="dialog" aria-modal="true">
          <div class="confirm-card">
            <span class="material-symbols-outlined" style="font-size:42px; color:var(--brown); margin:0 auto;">verified</span>
            <h3>Konfirmasi Penerimaan</h3>
            <p>Apakah Anda yakin pesanan sudah diterima?</p>
            <div class="confirm-actions">
              <button class="btn btn-ghost" data-action="close-confirm-modal">Batal</button>
              <button class="btn btn-primary" data-action="confirm-received-order" data-id="${state.confirmingOrderId || order.id}" style="background:#16a34a;">
                Ya, Pesanan Sudah Diterima
              </button>
            </div>
          </div>
        </div>
      ` : ""}
    </section>
  `;
}

// -------------------------------------------------------------
// ADMIN DASHBOARD WITH ORDER STATUS MANAGEMENT
// -------------------------------------------------------------

// ─── Image Upload & Compression Helper ──────────────────────────
function compressAndConvertImage(file, maxWidth = 500, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = readerEvent.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderProductModal() {
  if (!state.showProductModal) return "";
  const isEdit = Boolean(state.editingProduct);
  const p = state.editingProduct || {};

  return `
    <div class="modal-overlay" role="dialog" aria-modal="true">
      <div class="modal-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 style="margin:0; font-size:1.15rem; color:var(--dark-brown); font-weight:800;">
            ${isEdit ? "Edit Produk" : "Tambah Produk Baru"}
          </h3>
          <button class="icon-btn" data-action="close-product-modal" type="button" title="Tutup">${icon("close")}</button>
        </div>
        <form class="form" id="productModalForm">
          <input type="hidden" id="prodModalId" value="${p.id || ""}">

          <div class="field-group">
            <label class="field-label" for="prodModalName">Nama Produk *</label>
            <input class="input-field" id="prodModalName" type="text" required value="${p.name || ""}" placeholder="Contoh: Pudding Coklat">
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <div class="field-group">
              <label class="field-label" for="prodModalVariant">Varian *</label>
              <input class="input-field" id="prodModalVariant" type="text" required value="${p.variant || ""}" placeholder="Contoh: Chocolate">
            </div>
            <div class="field-group">
              <label class="field-label" for="prodModalStock">Stok (pcs) *</label>
              <input class="input-field" id="prodModalStock" type="number" min="0" required value="${p.stock !== undefined ? p.stock : 20}">
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="prodModalPrice">Harga Satuan (Rp) *</label>
            <input class="input-field" id="prodModalPrice" type="number" min="0" required value="${p.price || 15000}">
          </div>

          <!-- UPLOAD GAMBAR DARI PERANGKAT & URL -->
          <div class="field-group">
            <label class="field-label">Foto Produk</label>
            <div style="display:flex; gap:12px; align-items:center; margin-bottom:8px;">
              <div style="width:70px; height:70px; border-radius:12px; overflow:hidden; border:2px dashed var(--border); display:grid; place-items:center; background:#faf7f5; flex-shrink:0;">
                <img id="prodModalImgPreview" src="${p.imageAsset || "assets/images/logo.png"}" alt="Preview" style="width:100%; height:100%; object-fit:cover;">
              </div>
              <div style="flex:1;">
                <input type="file" id="prodModalFileInput" accept="image/*" style="display:none;">
                <button type="button" class="btn btn-ghost small" id="btnTriggerUpload" style="width:100%; margin-bottom:4px; border:1.5px solid var(--border); display:flex; align-items:center; justify-content:center; gap:6px;">
                  ${icon("upload_file", "small-icon")} Upload dari HP / Laptop
                </button>
                <div class="small muted" style="font-size:0.75rem;">Mendukung PNG, JPG, WebP (kompresi otomatis)</div>
              </div>
            </div>

            <input type="hidden" id="prodModalImg" value="${p.imageAsset || "assets/images/logo.png"}">

            <details style="font-size:0.8rem; margin-top:4px;">
              <summary style="cursor:pointer; color:var(--brown); font-weight:600;">Atau masukkan URL / Path gambar manual</summary>
              <div style="margin-top:6px;">
                <input class="input-field" id="prodModalImgUrl" type="text" value="${p.imageAsset && !p.imageAsset.startsWith("data:") ? p.imageAsset : ""}" placeholder="assets/images/... atau https://...">
              </div>
            </details>
          </div>

          <div class="field-group">
            <label class="field-label" for="prodModalDesc">Deskripsi</label>
            <textarea class="input-field" id="prodModalDesc" rows="2" placeholder="Deskripsi rasa atau topping">${p.description || ""}</textarea>
          </div>

          <div class="field-group">
            <label class="field-label" for="prodModalLoc">Lokasi Pembuatan</label>
            <input class="input-field" id="prodModalLoc" type="text" value="${p.location || "Dapur Pumeow, Malang"}">
          </div>

          <div style="display:flex; align-items:center; gap:8px; margin:4px 0 12px;">
            <input type="checkbox" id="prodModalAvailable" ${(!isEdit || p.isAvailable !== false) ? "checked" : ""} style="width:18px; height:18px; accent-color:var(--brown); cursor:pointer;">
            <label for="prodModalAvailable" style="font-size:0.85rem; font-weight:600; cursor:pointer;">
              Tersedia untuk dibeli pelanggan
            </label>
          </div>

          <div style="display:flex; gap:10px; margin-top:8px;">
            <button class="btn btn-ghost" type="button" data-action="close-product-modal" style="flex:1;">Batal</button>
            <button class="btn btn-primary" type="submit" style="flex:1;">
              ${isEdit ? "Simpan Perubahan" : "Tambah Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderAdminDashboard() {
  return `
    <section class="view">
      ${renderHeader("Admin Dashboard", ROUTES.HOME)}
      <div class="head-row">
        <button class="btn btn-primary small" data-action="open-add-product-modal">${icon("add", "small-icon")} Tambah Produk</button>
        <button class="btn btn-ghost small" data-action="admin-refresh-all">${icon("refresh", "small-icon")} Refresh Data</button>
      </div>

      <h3 class="page-title" style="font-size:1rem; margin-top:8px;">Kelola Produk & Stok (${state.products.length})</h3>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${state.products.map((p) => `
          <div class="list-item">
            <div style="display:flex; gap:10px; align-items:center;">
              <img src="${p.imageAsset}" alt="${p.name}" style="width:42px; height:42px; border-radius:8px; object-fit:cover; background:#eee;">
              <div>
                <div style="font-weight:700;">${p.name} <span class="small muted">(${p.variant})</span></div>
                <div class="small muted" style="display:flex; gap:8px; align-items:center; margin-top:2px;">
                  <span>${formatPrice(p.price)}</span>
                  ${renderStockBadge(p)}
                </div>
              </div>
            </div>
            <div class="head-row">
              <button class="btn btn-ghost small" data-action="open-edit-product-modal" data-id="${p.id}" title="Edit Produk">${icon("edit", "small-icon")}</button>
              <button class="btn btn-danger small" data-action="admin-delete-product" data-id="${p.id}" title="Hapus Produk">${icon("delete", "small-icon")}</button>
            </div>
          </div>
        `).join("")}
      </div>

      <h3 class="page-title" style="font-size:1rem; margin-top:16px;">Pesanan Masuk (${state.orders.length})</h3>
      ${state.orders.length ? state.orders.map((o) => `
        <div class="card" style="margin-bottom:12px; padding:14px; border-left: 4px solid ${
          o.status === "completed" ? "#16a34a" : o.status === "shipped" ? "#0284c7" : o.status === "processing" ? "#f59e0b" : "#8b5cf6"
        };">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="font-family:monospace; color:var(--dark-brown); font-size:0.88rem;">${o.id || o.orderId}</strong>
            ${renderStatusBadge(o.status)}
          </div>
          <div class="small muted">Pembeli: <strong>${o.buyer_email || o.user_id || "-"}</strong></div>
          <div class="small muted">Metode: ${o.method || "Pengiriman"} • Total: <strong>${formatPrice(o.total)}</strong></div>
          ${o.tracking_number ? `<div class="small muted" style="margin-top:2px;">Kurir & Resi: <strong>${o.courier || "Driver"}</strong> (<code style="font-family:monospace;">${o.tracking_number}</code>)</div>` : ""}
          ${o.delivered_at ? `<div class="small" style="color:#16a34a; font-weight:700; margin-top:4px;">✓ Diterima: ${new Date(o.delivered_at).toLocaleString("id-ID")}</div>` : ""}

          <!-- Admin Workflow Action Buttons -->
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:12px; align-items:center; padding-top:8px; border-top:1px dashed var(--border);">
            <button class="btn btn-ghost small" data-action="track-order" data-id="${o.id || o.orderId}" title="Lihat Live Tracking">
              ${icon("visibility", "small-icon")} Lacak Live
            </button>

            <!-- 1. Konfirmasi Proses -->
            ${o.status === "paid" ? `
              <button class="btn btn-primary small" data-action="admin-set-status" data-id="${o.id || o.orderId}" data-status="processing" style="background:#f59e0b; border-color:#d97706;">
                ${icon("soup_kitchen", "small-icon")} Konfirmasi Diproses
              </button>
            ` : ""}

            <!-- 2. Konfirmasi Kirim -->
            ${o.status === "processing" ? `
              <button class="btn btn-primary small" data-action="admin-ship-order" data-id="${o.id || o.orderId}" style="background:#0284c7; border-color:#0369a1;">
                ${icon("local_shipping", "small-icon")} Konfirmasi Dikirim
              </button>
            ` : ""}

            <!-- 3. Konfirmasi Diterima / Selesai -->
            ${o.status === "shipped" ? `
              <button class="btn btn-primary small" data-action="admin-set-status" data-id="${o.id || o.orderId}" data-status="completed" style="background:#16a34a; border-color:#15803d;">
                ${icon("task_alt", "small-icon")} Konfirmasi Diterima (Selesai)
              </button>
              <button class="btn btn-ghost small" data-action="admin-ship-order" data-id="${o.id || o.orderId}" title="Edit Data Resi / Kurir">
                ${icon("edit", "small-icon")} Edit Resi
              </button>
            ` : ""}

            <!-- Dropdown ubah status manual jika admin butuh ganti bebas -->
            <select class="small" data-action="admin-select-status" data-id="${o.id || o.orderId}" style="padding:5px 8px; border-radius:8px; border:1px solid var(--border); font-size:0.75rem; background:#fff; margin-left:auto; cursor:pointer;" title="Ubah status manual">
              <option value="" disabled selected>Pilih Status ▾</option>
              <option value="paid" ${o.status === "paid" ? "disabled" : ""}>1. Pembayaran Dikonfirmasi</option>
              <option value="processing" ${o.status === "processing" ? "disabled" : ""}>2. Pesanan Diproses</option>
              <option value="shipped" ${o.status === "shipped" ? "disabled" : ""}>3. Pesanan Dikirim</option>
              <option value="completed" ${o.status === "completed" ? "disabled" : ""}>4. Pesanan Diterima (Selesai)</option>
            </select>
          </div>
        </div>
      `).join("") : `<div class="card muted">Belum ada data pesanan.</div>`}

      ${renderProductModal()}
    </section>
  `;
}

// -------------------------------------------------------------
// ROUTER & VIEW MOUNTING
// -------------------------------------------------------------

function render() {
  let route = getRoute();
  const authFree =
    route === ROUTES.LOGIN ||
    route === ROUTES.REGISTER ||
    route === ROUTES.FORGOT_PASSWORD ||
    route === ROUTES.RESET_PASSWORD;

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
    [ROUTES.FORGOT_PASSWORD]: renderForgotPassword,
    [ROUTES.RESET_PASSWORD]: renderResetPassword,
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
    [ROUTES.ORDER_TRACKING]: renderOrderTracking,
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

// -------------------------------------------------------------
// EVENT LISTENERS & USER ACTIONS
// -------------------------------------------------------------

document.addEventListener("click", async (event) => {
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

  if (action === "track-order") {
    event.preventDefault();
    const id = target.dataset.id;
    state.trackingOrderId = id;
    state.isLoadingOrder = true;
    navigate(ROUTES.ORDER_TRACKING, { id });
    subscribeOrderRealtime(id);
    return;
  }

  if (action === "refresh-order") {
    const id = target.dataset.id;
    state.isLoadingOrder = true;
    render();
    subscribeOrderRealtime(id);
    showSnackbar("Status pesanan tersinkronisasi realtime");
    return;
  }

  // Open confirmation modal for received order
  if (action === "open-confirm-modal") {
    state.confirmingOrderId = target.dataset.id;
    state.showConfirmReceivedModal = true;
    render();
    return;
  }

  // Close confirmation modal
  if (action === "close-confirm-modal") {
    state.showConfirmReceivedModal = false;
    state.confirmingOrderId = null;
    render();
    return;
  }

  // Confirm order received in Firebase
  if (action === "confirm-received-order") {
    const id = target.dataset.id;
    const now = new Date().toISOString();

    state.showConfirmReceivedModal = false;
    state.confirmingOrderId = null;

    await firebaseUpdateOrderStatus(id, "completed", {
      delivered_at: now
    });

    if (state.trackingOrderData && String(state.trackingOrderData.id) === String(id)) {
      state.trackingOrderData.status = "completed";
      state.trackingOrderData.delivered_at = now;
    }

    showSnackbar("Pesanan berhasil dikonfirmasi telah diterima!");
    render();
    return;
  }

  // Admin status update
  if (action === "admin-set-status") {
    const id = target.dataset.id;
    const nextStatus = target.dataset.status;
    const extra = {};
    if (nextStatus === "completed") {
      extra.delivered_at = new Date().toISOString();
    }
    await firebaseUpdateOrderStatus(id, nextStatus, extra);
    const statusLabels = {
      processing: "Pesanan Diproses",
      shipped: "Pesanan Dikirim",
      completed: "Pesanan Diterima (Selesai)"
    };
    showSnackbar(`Status pesanan berhasil diubah: ${statusLabels[nextStatus] || nextStatus}`);
    render();
    return;
  }

  // Admin ship order (with tracking info)
  if (action === "admin-ship-order") {
    const id = target.dataset.id;
    const courier = prompt("Nama Kurir / Pengantar:", "Driver Pumeow") || "Driver Pumeow";
    const resi = prompt("Nomor Resi / Tracking:", `PUM-${Date.now().toString().slice(-6)}`) || `PUM-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    await firebaseUpdateOrderStatus(id, "shipped", {
      courier,
      tracking_number: resi,
      shipping_date: now,
      estimated_delivery: "Hari ini (Sore)"
    });

    showSnackbar(`Pesanan ${id} dikirim dengan ${courier} (${resi})`);
    render();
    return;
  }

  if (action === "admin-refresh-all") {
    showSnackbar("Memuat pesanan dari Firebase...");
    await firebaseFetchAllOrders();
    render();
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
    if (cartIsEmpty()) {
      showSnackbar("Keranjang masih kosong");
      return;
    }
    const order = await doCheckout("Ambil di tempat");
    showSnackbar("Pesanan pickup berhasil dicatat");
    navigate(ROUTES.PAYMENT_SUCCESS, { orderId: order?.id, order, total: order?.total });
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
    const order = await doCheckout(args.method || "Pembayaran", args);
    navigate(ROUTES.PAYMENT_SUCCESS, {
      method: args.method || "Pembayaran",
      orderId: order?.id,
      order,
      total: order?.total
    });
    return;
  }

  if (action === "logout") {
    if (fbAuth) {
      try {
        await fbAuth.signOut();
      } catch (_) { }
    }
    state.auth = {
      email: "",
      password: "",
      isLoading: false,
      isLoggedIn: false,
      isAdmin: false,
      user: null
    };
    saveState();
    showSnackbar("Logout berhasil");
    navigate(ROUTES.LOGIN);
    return;
  }

  if (action === "open-add-product-modal") {
    state.editingProduct = null;
    state.showProductModal = true;
    render();
    return;
  }

  if (action === "open-edit-product-modal") {
    const id = Number(target.dataset.id);
    const product = state.products.find((p) => p.id === id);
    if (!product) return;
    state.editingProduct = { ...product };
    state.showProductModal = true;
    render();
    return;
  }

  if (action === "close-product-modal") {
    state.showProductModal = false;
    state.editingProduct = null;
    render();
    return;
  }

  if (event.target.id === "btnTriggerUpload" || event.target.closest("#btnTriggerUpload")) {
    const fileInput = document.getElementById("prodModalFileInput");
    if (fileInput) fileInput.click();
    return;
  }

  if (action === "admin-delete-product") {
    const id = Number(target.dataset.id);
    const prod = state.products.find((p) => p.id === id);
    if (!confirm(`Hapus produk "${prod ? prod.name : id}"?`)) return;
    state.products = state.products.filter((p) => p.id !== id);
    delete state.cart[String(id)];
    state.favorites.delete(id);
    saveState();
    firebaseDeleteProduct(id);
    showSnackbar("Produk berhasil dihapus");
    render();
    return;
  }
});

// Listener untuk upload gambar dari perangkat
document.addEventListener("change", async (event) => {
  if (event.target.id === "prodModalFileInput") {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showSnackbar("Harap pilih file gambar (JPG, PNG, WebP)");
      return;
    }

    try {
      showSnackbar("Memproses dan mengompres foto...");
      const compressedDataUrl = await compressAndConvertImage(file, 500, 0.82);
      const hiddenInput = document.getElementById("prodModalImg");
      const previewImg = document.getElementById("prodModalImgPreview");
      if (hiddenInput) hiddenInput.value = compressedDataUrl;
      if (previewImg) previewImg.src = compressedDataUrl;
      showSnackbar("Foto berhasil dimuat!");
    } catch (err) {
      console.error("Gagal membaca gambar:", err);
      showSnackbar("Gagal memuat gambar dari perangkat");
    }
  }

  // Admin dropdown status manual
  if (event.target.dataset?.action === "admin-select-status") {
    const id = event.target.dataset.id;
    const newStatus = event.target.value;
    if (!newStatus) return;

    if (newStatus === "shipped") {
      const courier = prompt("Nama Kurir / Pengantar:", "Driver Pumeow") || "Driver Pumeow";
      const resi = prompt("Nomor Resi / Tracking:", `PUM-${Date.now().toString().slice(-6)}`) || `PUM-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();
      await firebaseUpdateOrderStatus(id, "shipped", {
        courier,
        tracking_number: resi,
        shipping_date: now,
        estimated_delivery: "Hari ini (Sore)"
      });
      showSnackbar(`Status pesanan diubah: Pesanan Dikirim (${courier} - ${resi})`);
    } else {
      const extra = {};
      if (newStatus === "completed") {
        extra.delivered_at = new Date().toISOString();
      }
      await firebaseUpdateOrderStatus(id, newStatus, extra);
      const statusLabels = {
        paid: "Pembayaran Dikonfirmasi",
        processing: "Pesanan Diproses",
        completed: "Pesanan Diterima (Selesai)"
      };
      showSnackbar(`Status pesanan diubah: ${statusLabels[newStatus] || newStatus}`);
    }
    render();
    return;
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "searchInput") {
    state.search = event.target.value;
    saveState();
    render();
  }
  if (event.target.id === "prodModalImgUrl") {
    const val = event.target.value.trim();
    if (val) {
      const hiddenInput = document.getElementById("prodModalImg");
      const previewImg = document.getElementById("prodModalImgPreview");
      if (hiddenInput) hiddenInput.value = val;
      if (previewImg) previewImg.src = val;
    }
  }
});

// Form Submissions
document.addEventListener("submit", async (event) => {
  // 1. LOGIN FORM
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

    // Pastikan Firebase Auth sudah aktif
    if (!fbAuth) {
      state.auth.isLoading = false;
      const emailError = document.getElementById("loginEmailError");
      if (emailError) emailError.textContent = "Firebase belum terhubung. Periksa konfigurasi Firebase.";
      render();
      return;
    }

    // Validasi login langsung ke Firebase Auth
    let authUser = null;
    try {
      const cred = await fbAuth.signInWithEmailAndPassword(email, password);
      if (cred?.user) {
        authUser = cred.user;
      }
    } catch (err) {
      console.error("Firebase Login Error:", err);
      state.auth.isLoading = false;
      const emailError = document.getElementById("loginEmailError");
      const errMap = {
        "auth/operation-not-allowed": "Provider Email/Password belum diaktifkan di Firebase Console. Buka Authentication > Sign-in method lalu Enable Email/Password.",
        "auth/user-not-found": "Email belum terdaftar. Silakan daftar akun baru terlebih dahulu.",
        "auth/wrong-password": "Password salah.",
        "auth/invalid-email": "Format email tidak valid.",
        "auth/too-many-requests": "Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.",
        "auth/invalid-credential": "Email atau password salah."
      };
      if (emailError) emailError.textContent = errMap[err.code] || err.message || "Login gagal.";
      render();
      return;
    }

    if (!authUser) {
      state.auth.isLoading = false;
      const emailError = document.getElementById("loginEmailError");
      if (emailError) emailError.textContent = "Login gagal. Akun tidak valid.";
      render();
      return;
    }

    state.auth.email = email;
    state.auth.password = password;
    state.auth.isLoading = false;
    state.auth.isLoggedIn = true;
    state.auth.user = authUser;
    state.auth.isAdmin = email.toLowerCase() === "admin@gmail.com";
    saveState();

    showSnackbar("Login berhasil!");
    navigate(ROUTES.HOME);
    return;
  }

  // 2. REGISTER FORM
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

    state.auth.isLoading = true;
    render();

    if (!fbAuth) {
      state.auth.isLoading = false;
      const errEl = document.getElementById("regEmailError");
      if (errEl) errEl.textContent = "Firebase belum terhubung. Periksa konfigurasi Firebase.";
      render();
      return;
    }

    try {
      await fbAuth.createUserWithEmailAndPassword(email, password);
    } catch (err) {
      console.error("Firebase Register Error:", err);
      state.auth.isLoading = false;
      const errEl = document.getElementById("regEmailError");
      const errMap = {
        "auth/operation-not-allowed": "Provider Email/Password belum diaktifkan di Firebase Console. Buka Authentication > Sign-in method lalu Enable Email/Password.",
        "auth/email-already-in-use": "Email ini sudah terdaftar.",
        "auth/invalid-email": "Format email tidak valid.",
        "auth/weak-password": "Password terlalu lemah (minimal 6 karakter)."
      };
      if (errEl) errEl.textContent = errMap[err.code] || err.message || "Registrasi gagal.";
      render();
      return;
    }

    state.auth.isLoading = false;
    showSnackbar("Registrasi berhasil! Silakan login.");
    navigate(ROUTES.LOGIN);
    return;
  }

  // 3. FORGOT PASSWORD FORM (FEATURE 1)
  if (event.target.id === "forgotPasswordForm") {
    event.preventDefault();
    const emailInput = document.getElementById("forgotEmail");
    const errorEl = document.getElementById("forgotEmailError");
    const email = emailInput.value.trim();

    errorEl.textContent = "";

    if (!email) {
      errorEl.textContent = "Email wajib diisi";
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errorEl.textContent = "Format email tidak valid";
      return;
    }

    state.auth.isLoading = true;
    render();

    await firebaseResetPasswordForEmail(email);

    state.auth.isLoading = false;
    state.forgotSuccessMessage = "Instruksi dan tautan reset password telah dikirim ke email Anda jika terdaftar.";
    showSnackbar("Instruksi reset password dikirim");
    render();
    return;
  }

  // 4. RESET PASSWORD FORM (FEATURE 1)
  if (event.target.id === "resetPasswordForm") {
    event.preventDefault();
    const newPassInput = document.getElementById("newPassword");
    const confirmInput = document.getElementById("confirmNewPassword");
    const passError = document.getElementById("newPasswordError");
    const confirmError = document.getElementById("confirmNewPasswordError");

    const newPassword = newPassInput.value.trim();
    const confirmPassword = confirmInput.value.trim();

    passError.textContent = "";
    confirmError.textContent = "";

    let valid = true;
    if (!newPassword) {
      passError.textContent = "Password baru wajib diisi";
      valid = false;
    } else if (newPassword.length < 6) {
      passError.textContent = "Password minimal 6 karakter";
      valid = false;
    }

    if (!confirmPassword) {
      confirmError.textContent = "Konfirmasi password wajib diisi";
      valid = false;
    } else if (newPassword !== confirmPassword) {
      confirmError.textContent = "Konfirmasi password tidak cocok";
      valid = false;
    }

    if (!valid) return;

    state.auth.isLoading = true;
    render();

    try {
      await firebaseUpdateUserPassword(newPassword);
      state.auth.password = newPassword;
      state.resetSuccessMessage = "Password berhasil diubah!";
      showSnackbar("Password berhasil diubah");
      render();

      setTimeout(() => {
        state.resetSuccessMessage = "";
        navigate(ROUTES.LOGIN);
      }, 1800);
    } catch (err) {
      passError.textContent = err.message || "Gagal mengubah password";
    } finally {
      state.auth.isLoading = false;
      render();
    }
  }

  // 5. FORM MODAL PRODUK (TAMBAH & EDIT)
  if (event.target.id === "productModalForm") {
    event.preventDefault();
    const idVal = document.getElementById("prodModalId")?.value;
    const name = document.getElementById("prodModalName")?.value.trim();
    const variant = document.getElementById("prodModalVariant")?.value.trim() || "Regular";
    const price = Number(document.getElementById("prodModalPrice")?.value) || 0;
    const stock = Number(document.getElementById("prodModalStock")?.value) || 0;
    const description = document.getElementById("prodModalDesc")?.value.trim() || "";
    const imageAsset = document.getElementById("prodModalImg")?.value.trim() || "assets/images/pudding milk.png";
    const location = document.getElementById("prodModalLoc")?.value.trim() || "Dapur Pumeow, Malang";
    const isAvailable = document.getElementById("prodModalAvailable")?.checked ?? true;

    if (!name) {
      showSnackbar("Nama produk tidak boleh kosong");
      return;
    }

    if (idVal) {
      // EDIT PRODUK
      const id = Number(idVal);
      const product = state.products.find((p) => p.id === id);
      if (product) {
        Object.assign(product, {
          name,
          variant,
          price,
          stock,
          description,
          imageAsset,
          location,
          isAvailable: stock > 0 ? isAvailable : false
        });
        firebaseSaveProduct(product);
        showSnackbar(`Produk "${name}" berhasil diperbarui!`);
      }
    } else {
      // TAMBAH PRODUK BARU
      const nextId = Math.max(...state.products.map((p) => Number(p.id) || 0), 0) + 1;
      const newProduct = {
        id: nextId,
        name,
        variant,
        price,
        stock,
        description,
        imageAsset,
        location,
        rating: 5.0,
        isAvailable: stock > 0 ? isAvailable : false
      };
      state.products.push(newProduct);
      firebaseSaveProduct(newProduct);
      showSnackbar(`Produk baru "${name}" berhasil ditambahkan!`);
    }

    state.showProductModal = false;
    state.editingProduct = null;
    saveState();
    render();
    return;
  }
});

// Listener untuk URL hash navigation
window.addEventListener("hashchange", async () => {
  const parsed = parseHash();
  if (parsed.route === ROUTES.ORDER_TRACKING) {
    const orderId = parsed.params.id || routeState[ROUTES.ORDER_TRACKING]?.id || routeState[ROUTES.ORDER_TRACKING]?.orderId;
    if (orderId) {
      state.isLoadingOrder = true;
      render();
      subscribeOrderRealtime(orderId);
      return;
    }
  } else {
    // Matikan realtime order tracking saat meninggalkan halaman tracking
    if (orderRealtimeUnsub) {
      orderRealtimeUnsub();
      orderRealtimeUnsub = null;
    }
  }

  // Jika masuk ke Admin Dashboard, aktifkan realtime orders listener
  if (parsed.route === ROUTES.ADMIN_DASHBOARD && state.auth.isAdmin) {
    subscribeAllOrdersRealtime();
  }

  render();
});

if (startupClose && startupPopup) {
  startupClose.addEventListener("click", () => {
    startupPopup.classList.add("hidden");
  });
}

// Initial state load & Firebase Auth state listener
loadState();

// Ambil data produk terbaru dari Firestore jika terhubung
if (fbDb) {
  firebaseFetchProducts().then(() => render());
}

if (fbAuth) {
  try {
    fbAuth.onAuthStateChanged((user) => {
      if (user) {
        // User sudah login (terdeteksi dari sesi yang tersimpan)
        if (!state.auth.isLoggedIn) {
          state.auth.isLoggedIn = true;
          state.auth.user = user;
          state.auth.email = user.email || state.auth.email;
          state.auth.isAdmin = user.email?.toLowerCase() === "admin@gmail.com";
          saveState();
          if (state.auth.isAdmin) {
            subscribeAllOrdersRealtime();
          }
        }
      } else {
        // User tidak ada sesi di Firebase Auth
        if (state.auth.isLoggedIn) {
          state.auth.isLoggedIn = false;
          state.auth.user = null;
          state.auth.email = "";
          saveState();
          navigate(ROUTES.LOGIN);
        }
      }
    });
  } catch (e) {
    console.warn("Firebase auth state listener error:", e);
  }
}

const initialParsed = parseHash();
if (!window.location.hash) {
  window.location.hash = `#${state.auth.isLoggedIn ? ROUTES.HOME : ROUTES.LOGIN}`;
} else if (initialParsed.route === ROUTES.ORDER_TRACKING) {
  const orderId = initialParsed.params.id || routeState[ROUTES.ORDER_TRACKING]?.id || routeState[ROUTES.ORDER_TRACKING]?.orderId;
  if (orderId) {
    state.isLoadingOrder = true;
    subscribeOrderRealtime(orderId);
  }
} else if (initialParsed.route === ROUTES.ADMIN_DASHBOARD && state.auth.isAdmin) {
  subscribeAllOrdersRealtime();
}

render();

