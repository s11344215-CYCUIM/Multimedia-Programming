// ===========================
// 手機版漢堡選單開關
// ===========================
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
    });
  });
}

// ===========================
// 錨點平滑滾動（僅限同頁 # 開頭）
// ===========================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (!targetId || targetId === "#") return;
    if (targetId.length > 1 && document.querySelector(targetId)) {
      e.preventDefault();
      const target = document.querySelector(targetId);
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// ===========================
// 回到頂部按鈕
// ===========================
const backToTopBtn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (!backToTopBtn) return;
  if (window.scrollY > 400) {
    backToTopBtn.classList.add("show");
  } else {
    backToTopBtn.classList.remove("show");
  }
});

if (backToTopBtn) {
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ===========================
// 聯絡表單阻止真實送出（如果有）
// ===========================
const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("目前為期末專案前端示意，表單不會真的送出喔。");
  });
}

// ===========================
// 首頁廣告輪播
// ===========================
const adSlides = document.querySelectorAll(".ad-slide");
const adPrevBtn = document.querySelector(".ad-prev");
const adNextBtn = document.querySelector(".ad-next");

let currentAdIndex = 0;
let adTimer = null;
const AD_INTERVAL = 5000;

function showAd(index) {
  if (!adSlides.length) return;

  if (index < 0) {
    index = adSlides.length - 1;
  } else if (index >= adSlides.length) {
    index = 0;
  }

  adSlides.forEach((slide) => slide.classList.remove("active"));
  adSlides[index].classList.add("active");

  currentAdIndex = index;
}

function nextAd() {
  showAd(currentAdIndex + 1);
}

function prevAd() {
  showAd(currentAdIndex - 1);
}

function startAdAutoPlay() {
  stopAdAutoPlay();
  adTimer = setInterval(nextAd, AD_INTERVAL);
}

function stopAdAutoPlay() {
  if (adTimer) {
    clearInterval(adTimer);
    adTimer = null;
  }
}

if (adPrevBtn && adNextBtn) {
  adPrevBtn.addEventListener("click", () => {
    prevAd();
    startAdAutoPlay();
  });

  adNextBtn.addEventListener("click", () => {
    nextAd();
    startAdAutoPlay();
  });
}

if (adSlides.length) {
  showAd(0);
  startAdAutoPlay();
}

// ===========================
// 購物車共用工具（localStorage）
// ===========================
const CART_KEY = "site_cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getCartCount(cart) {
  return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  const cart = loadCart();
  badge.textContent = getCartCount(cart);
}

// 初始化購物車徽章
updateCartBadge();

// ===========================
// 訂購彈窗：開關、綁定菜單上的＋
// ===========================
const orderModalBackdrop = document.getElementById("orderModalBackdrop");
const orderModalCloseBtn = document.getElementById("orderModalClose");

const modalDrinkCard = orderModalBackdrop
  ? orderModalBackdrop.querySelector(".modal-drink-card")
  : null;

const modalDrinkNameEl = document.getElementById("modalDrinkName");
const modalDrinkDescEl = document.getElementById("modalDrinkDesc");
const modalDrinkPriceEl = document.getElementById("modalDrinkPrice");

function resetOrderModalFields() {
  if (!modalDrinkCard) return;

  const sizeSelect = modalDrinkCard.querySelector(".drink-size");
  const sugarRange = modalDrinkCard.querySelector(".drink-sugar-range");
  const iceRange = modalDrinkCard.querySelector(".drink-ice-range");
  const toppingCheckboxes = modalDrinkCard.querySelectorAll(".drink-topping");
  const noteEl = modalDrinkCard.querySelector(".drink-note");

  if (sizeSelect) sizeSelect.value = "中杯";
  if (sugarRange) sugarRange.value = 2;
  if (iceRange) iceRange.value = 3;

  toppingCheckboxes.forEach((cb) => {
    cb.checked = false;
  });

  if (noteEl) noteEl.value = "";
}

function openOrderModal(drinkId, drinkName, drinkPrice) {
  if (!orderModalBackdrop || !modalDrinkCard) return;

  // 設定 data-* 給加入購物車用
  modalDrinkCard.dataset.id = drinkId || "";
  modalDrinkCard.dataset.name = drinkName || "";
  modalDrinkCard.dataset.price = String(drinkPrice || 60);

  if (modalDrinkNameEl) modalDrinkNameEl.textContent = drinkName || "飲料名稱";
  if (modalDrinkPriceEl)
    modalDrinkPriceEl.textContent = `價格：$${drinkPrice || 60}`;

  resetOrderModalFields();

  orderModalBackdrop.classList.add("show");
  document.body.classList.add("modal-open");
}

function closeOrderModal() {
  if (!orderModalBackdrop) return;
  orderModalBackdrop.classList.remove("show");
  document.body.classList.remove("modal-open");
}

// 關閉按鈕
if (orderModalCloseBtn) {
  orderModalCloseBtn.addEventListener("click", () => {
    closeOrderModal();
  });
}

// 點遮罩關閉
if (orderModalBackdrop) {
  orderModalBackdrop.addEventListener("click", (e) => {
    if (e.target === orderModalBackdrop) {
      closeOrderModal();
    }
  });
}

// 菜單上的加號按鈕
const menuAddButtons = document.querySelectorAll(".menu-add-btn");

if (menuAddButtons.length && orderModalBackdrop) {
  menuAddButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const drinkId = btn.dataset.drinkId || "";
      const drinkName = btn.dataset.drinkName || "飲料";
      const drinkPrice = Number(btn.dataset.drinkPrice) || 60;

      openOrderModal(drinkId, drinkName, drinkPrice);
    });
  });
}

// ===========================
// 訂購：加入購物車（共用：訂購頁 / 菜單彈窗）
// ===========================
const sugarLevels = ["無糖", "微糖", "半糖", "正常糖"];
const iceLevels = ["去冰", "微冰", "少冰", "正常冰", "熱飲"];

const addToCartButtons = document.querySelectorAll("[data-add-to-cart]");

if (addToCartButtons.length) {
  addToCartButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".drink-card");
      if (!card) return;

      const id = card.dataset.id;
      const name = card.dataset.name;
      let price = Number(card.dataset.price) || 0;

      const sizeSelect = card.querySelector(".drink-size");
      const sugarRange = card.querySelector(".drink-sugar-range");
      const iceRange = card.querySelector(".drink-ice-range");
      const toppingCheckboxes = card.querySelectorAll(".drink-topping");
      const noteEl = card.querySelector(".drink-note");

      const size = sizeSelect ? sizeSelect.value : "";

      const sugarIndex = sugarRange ? Number(sugarRange.value) : null;
      const iceIndex = iceRange ? Number(iceRange.value) : null;

      const sugar = sugarIndex != null ? sugarLevels[sugarIndex] || "" : "";
      const ice = iceIndex != null ? iceLevels[iceIndex] || "" : "";

      // 加料選項
      const toppings = [];
      toppingCheckboxes.forEach((cb) => {
        if (cb.checked) {
          const label = cb.dataset.label || "加料";
          toppings.push(label);
        }
      });

      const note = noteEl ? noteEl.value.trim() : "";

      // 大杯 +10 元
      if (
        size === "大杯（+$10）" ||
        size === "大杯(+10)" ||
        size === "大杯（+$10）"
      ) {
        price += 10;
      }

      // 每項加料 +10 元
      price += toppings.length * 10;

      const newItem = {
        id,
        name,
        price,
        size,
        sugar,
        ice,
        toppings,
        note,
        quantity: 1,
      };

      const cart = loadCart();
      cart.push(newItem);
      saveCart(cart);
      updateCartBadge();

      // 按鈕小動畫
      btn.textContent = "已加入購物車";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = "加入購物車";
        btn.disabled = false;
      }, 900);

      // 如果是在彈窗裡加入，就順便關掉彈窗
      if (card.classList.contains("modal-drink-card")) {
        closeOrderModal();
      }
    });
  });
}

// ===========================
// 購物車頁：顯示 / 調整 / 刪除
// ===========================
const cartListEl = document.getElementById("cartList");
const cartEmptyEl = document.getElementById("cartEmpty");
const cartSummaryEl = document.getElementById("cartSummary");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const checkoutBtn = document.getElementById("checkoutBtn");

function renderCartPage() {
  if (!cartListEl || !cartEmptyEl || !cartSummaryEl || !cartSubtotalEl) return;

  const cart = loadCart();

  if (!cart.length) {
    cartEmptyEl.style.display = "block";
    cartSummaryEl.style.display = "none";
    cartListEl.innerHTML = "";
    if (checkoutBtn) checkoutBtn.classList.add("disabled");
    return;
  }

  cartEmptyEl.style.display = "none";
  cartSummaryEl.style.display = "block";
  if (checkoutBtn) checkoutBtn.classList.remove("disabled");

  let html = "";
  let subtotal = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const parts = [item.size, item.ice, item.sugar];
    if (item.toppings && item.toppings.length) {
      parts.push("加料：" + item.toppings.join("、"));
    }
    if (item.note) {
      parts.push("備註：" + item.note);
    }
    const optionsText = parts.filter(Boolean).join(" / ");

    html += `
        <div class="cart-item" data-index="${index}">
            <div class="cart-item-main">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-options">${optionsText || ""}</div>
            </div>
            <div class="cart-item-side">
                <span class="cart-item-price">$${item.price}</span>
                <div class="cart-item-qty">
                    <button type="button" data-action="decrease">-</button>
                    <span class="cart-item-qty-value">${item.quantity}</span>
                    <button type="button" data-action="increase">+</button>
                </div>
                <button type="button" class="cart-item-remove" data-action="remove">刪除</button>
            </div>
        </div>
        `;
  });

  cartListEl.innerHTML = html;
  cartSubtotalEl.textContent = `$${subtotal}`;
}

// 事件委派：處理 + / - / 刪除
if (cartListEl) {
  cartListEl.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    const itemEl = e.target.closest(".cart-item");
    if (!itemEl) return;
    const index = Number(itemEl.dataset.index);
    const cart = loadCart();
    const item = cart[index];
    if (!item) return;

    if (action === "increase") {
      item.quantity += 1;
    } else if (action === "decrease") {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        cart.splice(index, 1);
      }
    } else if (action === "remove") {
      cart.splice(index, 1);
    }

    saveCart(cart);
    updateCartBadge();
    renderCartPage();
  });

  // 載入購物車頁時渲染
  renderCartPage();
}

// ===========================
// 飲品菜單頁：熱銷榜卡片互動
// ===========================
const rankCards = Array.from(document.querySelectorAll(".rank-card"));

if (rankCards.length) {
  function setFeatured(featuredIndex) {
    const total = rankCards.length;

    const leftIndex = (featuredIndex + 1) % total;
    const rightIndex = (featuredIndex + 2) % total;

    rankCards.forEach((card, i) => {
      const isFeatured = i === featuredIndex;
      card.classList.toggle("rank-featured", isFeatured);

      if (i === leftIndex) {
        card.style.order = 1;
      } else if (i === featuredIndex) {
        card.style.order = 2;
      } else if (i === rightIndex) {
        card.style.order = 3;
      }
    });
  }

  setFeatured(0);

  rankCards.forEach((card) => {
    card.addEventListener("click", () => {
      const idx = rankCards.indexOf(card);
      setFeatured(idx);
    });
  });
}

// ===========================
// 結帳頁：顯示訂單與送出
// ===========================
const checkoutContentEl = document.getElementById("checkoutContent");
const checkoutEmptyEl2 = document.getElementById("checkoutEmpty");
const checkoutSummaryEl = document.getElementById("checkoutSummary");
const checkoutTotalEl = document.getElementById("checkoutTotal");
const checkoutFormEl = document.getElementById("checkoutForm");

function renderCheckoutPage() {
  if (
    !checkoutContentEl ||
    !checkoutEmptyEl2 ||
    !checkoutSummaryEl ||
    !checkoutTotalEl
  )
    return;

  const cart = loadCart();
  if (!cart.length) {
    checkoutEmptyEl2.style.display = "block";
    checkoutContentEl.style.display = "none";
    return;
  }

  checkoutEmptyEl2.style.display = "none";
  checkoutContentEl.style.display = "grid";

  let html = "";
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const parts = [item.size, item.ice, item.sugar];
    if (item.toppings && item.toppings.length) {
      parts.push("加料：" + item.toppings.join("、"));
    }
    if (item.note) {
      parts.push("備註：" + item.note);
    }
    const optionsText = parts.filter(Boolean).join(" / ");

    html += `
        <div class="checkout-summary-item">
            <div class="checkout-summary-item-main">
                <div class="checkout-summary-item-name">${item.name} x ${
      item.quantity
    }</div>
                <div class="checkout-summary-item-options">${
                  optionsText || ""
                }</div>
            </div>
            <div class="checkout-summary-item-total">$${itemTotal}</div>
        </div>
        `;
  });

  checkoutSummaryEl.innerHTML = html;
  checkoutTotalEl.textContent = `$${total}`;
}

if (checkoutContentEl) {
  renderCheckoutPage();
}

if (checkoutFormEl) {
  checkoutFormEl.addEventListener("submit", (e) => {
    e.preventDefault();

    alert("已完成下單，但這只是示意，所以不會真的送出訂單或儲存資料");

    saveCart([]);
    updateCartBadge();

    window.location.href = "index.html#adSlider";
  });
}

// ===========================
// 會員系統（只有前端）
// ===========================
const USERS_KEY = "site_users";
const CURRENT_USER_KEY = "site_current_user";

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

// 會員頁 UI 更新
function updateMemberStatusUI() {
  const statusEl = document.getElementById("memberStatus");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!statusEl) return; // 不在 member.html 就跳出

  const user = getCurrentUser();
  if (user) {
    statusEl.innerHTML = `
            <p>嗨，<strong>${user.name}</strong>，歡迎回來。</p>
            <p class="member-status-sub">你可以在菜單頁幫飲品評分</p>
        `;
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
  } else {
    statusEl.innerHTML = `
            <p>目前尚未登入。</p>
            <p class="member-status-sub">註冊的資料只會保存在你的瀏覽器裡，不會傳到任何伺服器</p>
        `;
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

// 綁定註冊表單
const registerFormEl = document.getElementById("registerForm");
if (registerFormEl) {
  registerFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("register-name").value.trim();
    const email = document
      .getElementById("register-email")
      .value.trim()
      .toLowerCase();
    const password = document.getElementById("register-password").value;

    if (!name || !email || !password) {
      alert("請填寫註冊資料");
      return;
    }

    const users = loadUsers();
    const exists = users.find((u) => u.email === email);
    if (exists) {
      alert("這個 Email 已經註冊過了，請改用其他帳號登入");
      return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser({ name, email });

    alert("註冊完成，已自動登入。");
    updateMemberStatusUI();
  });
}

// 綁定登入表單
const loginFormEl = document.getElementById("loginForm");
if (loginFormEl) {
  loginFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document
      .getElementById("login-email")
      .value.trim()
      .toLowerCase();
    const password = document.getElementById("login-password").value;

    const users = loadUsers();
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      alert("帳號或密碼錯誤，或尚未註冊。");
      return;
    }

    setCurrentUser({ name: user.name, email: user.email });
    alert(`登入成功，歡迎回來，${user.name}。`);
    updateMemberStatusUI();
  });
}

// 登出
const logoutBtnEl = document.getElementById("logoutBtn");
if (logoutBtnEl) {
  logoutBtnEl.addEventListener("click", () => {
    setCurrentUser(null);
    alert("已登出。");
    updateMemberStatusUI();
  });
}

// 會員頁 Tab 切換
const memberTabButtons = document.querySelectorAll(".member-tab-btn");
if (memberTabButtons.length) {
  memberTabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tabTarget;
      if (!targetId) return;

      memberTabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".member-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === targetId);
      });
    });
  });
}

// 若在 member.html，初始化狀態
updateMemberStatusUI();

// ===========================
// 飲品評分（只有前端） – 彈窗版
// ===========================
const RATINGS_KEY = "site_ratings";

function loadRatings() {
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function saveRatings(ratings) {
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

// 設定 / 更新某位使用者對某杯飲料的評分＋心得
function setRatingForDrink(drinkId, userId, rating, comment) {
  const ratings = loadRatings();

  if (!ratings[drinkId]) {
    ratings[drinkId] = {
      total: 0,
      count: 0,
      userRatings: {},
      userComments: {},
    };
  }

  const entry = ratings[drinkId];
  if (!entry.userRatings) entry.userRatings = {};
  if (!entry.userComments) entry.userComments = {};

  const prev = entry.userRatings[userId];

  if (prev != null) {
    entry.total -= prev;
    entry.total += rating;
  } else {
    entry.total += rating;
    entry.count += 1;
  }

  entry.userRatings[userId] = rating;

  if (typeof comment === "string") {
    const trimmed = comment.trim();
    if (trimmed) {
      entry.userComments[userId] = trimmed;
    } else {
      delete entry.userComments[userId];
    }
  }

  ratings[drinkId] = entry;
  saveRatings(ratings);
}

// 取消某位使用者對某杯飲料的評論（星星＋文字都刪掉）
function deleteRatingForDrink(drinkId, userId) {
  const ratings = loadRatings();
  const entry = ratings[drinkId];
  if (!entry || !entry.userRatings || !(userId in entry.userRatings)) return;

  const prev = entry.userRatings[userId];
  entry.total -= prev;
  entry.count -= 1;

  delete entry.userRatings[userId];
  if (entry.userComments) {
    delete entry.userComments[userId];
  }

  if (entry.count <= 0) {
    delete ratings[drinkId];
  } else {
    ratings[drinkId] = entry;
  }

  saveRatings(ratings);
}

function getRatingInfo(drinkId, userId) {
  const ratings = loadRatings();
  const entry = ratings[drinkId];

  if (!entry) {
    return {
      avg: 0,
      count: 0,
      userRating: null,
      comment: "",
    };
  }

  const avg = entry.count ? entry.total / entry.count : 0;
  const userRating =
    userId && entry.userRatings ? entry.userRatings[userId] || null : null;
  const comment =
    userId && entry.userComments ? entry.userComments[userId] || "" : "";

  return { avg, count: entry.count, userRating, comment };
}

// 更新菜單上「那條評分文字」
function renderRatingElement(ratingEl) {
  if (!ratingEl) return;

  const drinkId = ratingEl.dataset.drinkId;
  if (!drinkId) return;

  const currentUser = getCurrentUser();
  const userId = currentUser ? currentUser.email : null;

  const { avg, count, userRating, comment } = getRatingInfo(drinkId, userId);

  const stars = ratingEl.querySelectorAll(".rating-star");
  const textEl = ratingEl.querySelector("[data-rating-text]");
  const myCommentEl = ratingEl.querySelector("[data-my-comment]");

  const activeValue = userRating || Math.round(avg);

  stars.forEach((star) => {
    const val = Number(star.dataset.star) || 0;
    star.classList.toggle("active", val <= activeValue && activeValue > 0);
  });

  if (textEl) {
    if (count === 0) {
      textEl.textContent = "目前尚無評分";
    } else {
      const base = `平均 ${avg.toFixed(1)} ★（${count} 筆評分）`;
      if (userRating) {
        textEl.textContent = `${base}，你給了 ${userRating}★`;
      } else {
        textEl.textContent = base;
      }
    }
  }

  // 顯示 / 隱藏「你的評論」
  if (myCommentEl) {
    if (comment && comment.trim()) {
      myCommentEl.style.display = "block";
      myCommentEl.textContent = `你的評論：${comment.trim()}`;
    } else {
      myCommentEl.style.display = "none";
      myCommentEl.textContent = "";
    }
  }
}

// ===== 評分彈窗 DOM 變數與狀態 =====
const ratingModalBackdrop = document.getElementById("ratingModalBackdrop");
const ratingModalCloseBtn = document.getElementById("ratingModalClose");
const ratingModalDrinkNameEl = document.getElementById("ratingModalDrinkName");
const ratingModalStarsEl = document.getElementById("ratingModalStars");
const ratingModalCommentEl = document.getElementById("ratingModalComment");
const ratingModalSaveBtn = document.getElementById("ratingModalSave");
const ratingModalDeleteBtn = document.getElementById("ratingModalDelete");
const ratingModalStatusEl = document.getElementById("ratingModalStatus");

let currentRatingDrinkId = null;
let currentRatingBlockEl = null;
let currentRatingValue = 0;

function resetRatingModalUI() {
  currentRatingValue = 0;

  if (ratingModalStarsEl) {
    ratingModalStarsEl.querySelectorAll(".rating-star").forEach((star) => {
      star.classList.remove("active");
    });
  }

  if (ratingModalCommentEl) {
    ratingModalCommentEl.value = "";
  }

  if (ratingModalStatusEl) {
    ratingModalStatusEl.textContent = "";
  }
}

function closeRatingModal() {
  if (!ratingModalBackdrop) return;
  ratingModalBackdrop.classList.remove("show");
  document.body.classList.remove("modal-open");
  currentRatingDrinkId = null;
  currentRatingBlockEl = null;
  resetRatingModalUI();
}

function openRatingModalForBlock(block, drinkId) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("請先登入會員，再幫飲品評分喔。");
    window.location.href = "member.html";
    return;
  }

  if (!ratingModalBackdrop) {
    alert("目前尚未設定評分彈窗。");
    return;
  }

  currentRatingDrinkId = drinkId;
  currentRatingBlockEl = block;
  resetRatingModalUI();

  // 從 DOM 抓飲料名稱
  const titleEl = block.closest(".menu-drink-text")?.querySelector("h3");
  const drinkName = titleEl ? titleEl.textContent.trim() : "這杯飲料";

  if (ratingModalDrinkNameEl) {
    ratingModalDrinkNameEl.textContent = `為「${drinkName}」評分`;
  }

  const info = getRatingInfo(drinkId, currentUser.email);
  currentRatingValue = info.userRating || 0;

  // 如果之前評過分，幫他把星星跟評論填回來
  if (ratingModalStarsEl) {
    ratingModalStarsEl.querySelectorAll(".rating-star").forEach((star) => {
      const val = Number(star.dataset.star) || 0;
      star.classList.toggle(
        "active",
        val <= currentRatingValue && currentRatingValue > 0
      );
    });
  }

  if (ratingModalCommentEl) {
    ratingModalCommentEl.value = info.comment || "";
  }

  if (ratingModalStatusEl) {
    if (info.userRating) {
      ratingModalStatusEl.textContent = `你之前給了 ${info.userRating}★，可以在這裡修改或刪除。`;
    } else if (info.count) {
      ratingModalStatusEl.textContent = `目前平均 ${info.avg.toFixed(
        1
      )}★，共有 ${info.count} 筆評分。`;
    } else {
      ratingModalStatusEl.textContent =
        "還沒有任何評分，成為第一個分享心得的人吧。";
    }
  }

  ratingModalBackdrop.classList.add("show");
  document.body.classList.add("modal-open");
}

// 關閉彈窗（按 X）
if (ratingModalCloseBtn) {
  ratingModalCloseBtn.addEventListener("click", () => {
    closeRatingModal();
  });
}

// 點遮罩關閉（不會刪除原本已經存好的評論）
if (ratingModalBackdrop) {
  ratingModalBackdrop.addEventListener("click", (e) => {
    if (e.target === ratingModalBackdrop) {
      closeRatingModal();
    }
  });
}

// 在彈窗裡點星星
if (ratingModalStarsEl) {
  ratingModalStarsEl.addEventListener("click", (e) => {
    const star = e.target.closest(".rating-star");
    if (!star) return;

    const value = Number(star.dataset.star) || 0;
    if (!value) return;
    currentRatingValue = value;

    ratingModalStarsEl.querySelectorAll(".rating-star").forEach((s) => {
      const v = Number(s.dataset.star) || 0;
      s.classList.toggle("active", v <= currentRatingValue);
    });
  });
}

// 送出評分＋評論
if (ratingModalSaveBtn) {
  ratingModalSaveBtn.addEventListener("click", () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert("請先登入會員，再評分。");
      window.location.href = "member.html";
      return;
    }

    if (!currentRatingDrinkId) return;

    if (!currentRatingValue) {
      alert("請先點選星星給一個評分。");
      return;
    }

    const comment = ratingModalCommentEl ? ratingModalCommentEl.value : "";
    setRatingForDrink(
      currentRatingDrinkId,
      currentUser.email,
      currentRatingValue,
      comment
    );

    if (currentRatingBlockEl) {
      renderRatingElement(currentRatingBlockEl);
    }

    if (ratingModalStatusEl) {
      ratingModalStatusEl.textContent = "已儲存你的評分與心得。";
    }

    setTimeout(() => {
      closeRatingModal();
    }, 600);
  });
}

// 取消這次評論（把這位使用者對這杯飲料的紀錄整個刪掉）
if (ratingModalDeleteBtn) {
  ratingModalDeleteBtn.addEventListener("click", () => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentRatingDrinkId) {
      closeRatingModal();
      return;
    }

    const ok = confirm("確定要刪除你對這杯飲料的評分與心得嗎？");
    if (!ok) return;

    deleteRatingForDrink(currentRatingDrinkId, currentUser.email);

    if (currentRatingBlockEl) {
      renderRatingElement(currentRatingBlockEl);
    }

    closeRatingModal();
  });
}

// 初始化：讓菜單上的評分區變成「點了就跳出彈窗」
function initRatings() {
  const ratingBlocks = document.querySelectorAll(".drink-rating");
  if (!ratingBlocks.length) return;

  ratingBlocks.forEach((block) => {
    const drinkId = block.dataset.drinkId;
    if (!drinkId) return;

    // 一開始先根據 localStorage 把平均分 / 你的分數算出來
    renderRatingElement(block);

    // 點整條評分區就打開彈窗（星星 + 文字）
    block.style.cursor = "pointer";
    block.addEventListener("click", () => {
      openRatingModalForBlock(block, drinkId);
    });
  });
}

// 在有評分區塊的頁面初始化
initRatings();

// 換頁淡出轉場
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;

  const href = a.getAttribute("href");
  if (!href) return;

  // 不處理的情況：新分頁、外部連結、純錨點
  if (a.target === "_blank") return;
  if (href.startsWith("http")) return;
  if (href.startsWith("#")) return;

  e.preventDefault();
  document.body.classList.add("page-leave");

  setTimeout(() => {
    window.location.href = href;
  }, 220);
});

// 進頁淡入，確保回到正常
window.addEventListener("pageshow", () => {
  document.body.classList.remove("page-leave");
});
