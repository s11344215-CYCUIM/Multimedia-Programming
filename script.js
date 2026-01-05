// ===========================
// 漢堡選單開關（全尺寸共用）
// - 點漢堡：切換 .open
// - 點選單項目：收起
// - 點畫面其他地方 / 按 ESC：收起
// ===========================
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

if (navToggle && mainNav) {
  const closeNav = () => mainNav.classList.remove("open");
  const toggleNav = () => mainNav.classList.toggle("open");

  navToggle.addEventListener("click", (e) => {
    e.stopPropagation(); // 避免被外部點擊事件立刻關掉
    toggleNav();
  });

  // 點到選單連結：收起
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeNav());
  });

  // 點到頁面其他地方：收起
  document.addEventListener("click", (e) => {
    if (!mainNav.classList.contains("open")) return;
    const clickedInside =
      mainNav.contains(e.target) || navToggle.contains(e.target);
    if (!clickedInside) closeNav();
  });

  // 按 ESC：收起
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
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
// 聯絡表單阻止真實送出
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

// 首頁廣告，點整張slide可跳轉
// 同頁錨點直接移過去
// 跨頁才做淡出轉場
adSlides.forEach((slide) => {
  slide.style.cursor = "pointer";

  slide.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;

    const link = slide.dataset.link;
    if (!link) return;

    // ✅ 同頁錨點：只滑動，不淡出（避免整頁變透明卡住）
    if (link.startsWith("#")) {
      const target = document.querySelector(link);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      } else {
        // 找不到就至少更新 hash（方便 debug）
        window.location.hash = link;
      }
      return;
    }

    // ✅ 其他情況：才做淡出換頁
    document.body.classList.add("page-leave");
    setTimeout(() => {
      window.location.href = link;
    }, 220);
  });
});

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
// 購物車彈窗（全站）
// - 點右下角購物車：打開彈窗
// - 維持 cart.html 可用作備援（JS 失效時仍能進頁面）
// ===========================

function ensureCartModalExists() {
  if (document.getElementById("cartModalBackdrop")) return;

  const backdrop = document.createElement("div");
  backdrop.id = "cartModalBackdrop";
  backdrop.className = "cart-modal-backdrop";
  backdrop.innerHTML = `
    <div class="cart-modal" role="dialog" aria-modal="true" aria-label="購物車">
      <div class="cart-modal-card">
        <button type="button" class="cart-modal-close" id="cartModalClose" aria-label="關閉">×</button>
        <h3 class="cart-modal-title">購物車</h3>
        <div id="cartModalEmpty" class="cart-modal-empty" style="display:none">購物車目前是空的，<a href="menu.html">先去逛逛飲料</a>吧。</div>
        <div id="cartModalList" class="cart-modal-list"></div>
        <div id="cartModalSummary" class="cart-modal-summary" style="display:none">
          <div class="cart-modal-summary-row">
            <span>小計</span>
            <span id="cartModalSubtotal">$0</span>
          </div>
          <div class="cart-modal-actions">
            <a href="checkout.html" class="btn primary-btn" id="cartModalCheckout">前往結帳</a>
            <button type="button" class="btn secondary-btn" id="cartModalCloseBtn">繼續逛</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
}

function openCartModal() {
  ensureCartModalExists();
  const backdrop = document.getElementById("cartModalBackdrop");
  if (!backdrop) return;

  renderCartModal();
  backdrop.classList.add("show");
  document.body.classList.add("modal-open");
}

function closeCartModal() {
  const backdrop = document.getElementById("cartModalBackdrop");
  if (!backdrop) return;
  backdrop.classList.remove("show");
  document.body.classList.remove("modal-open");
}

function renderCartModal() {
  const listEl = document.getElementById("cartModalList");
  const emptyEl = document.getElementById("cartModalEmpty");
  const summaryEl = document.getElementById("cartModalSummary");
  const subtotalEl = document.getElementById("cartModalSubtotal");
  if (!listEl || !emptyEl || !summaryEl || !subtotalEl) return;

  const cart = loadCart();
  if (!cart.length) {
    emptyEl.style.display = "block";
    summaryEl.style.display = "none";
    listEl.innerHTML = "";
    subtotalEl.textContent = "$0";
    return;
  }

  emptyEl.style.display = "none";
  summaryEl.style.display = "block";

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

  listEl.innerHTML = html;
  subtotalEl.textContent = `$${subtotal}`;
}

// 綁定：右下角購物車 -> 開彈窗
const cartFloatingBtn = document.querySelector(".cart-floating");
if (cartFloatingBtn) {
  cartFloatingBtn.addEventListener("click", (e) => {
    // 讓 cart.html 仍可用作備援，所以只有在 JS 正常跑時才阻止跳頁
    e.preventDefault();
    openCartModal();
  });
}

// 彈窗事件（用委派，因為 DOM 會被動態插入）
document.addEventListener("click", (e) => {
  // 關閉：X、繼續逛
  if (e.target && e.target.id === "cartModalClose") {
    closeCartModal();
  }
  if (e.target && e.target.id === "cartModalCloseBtn") {
    closeCartModal();
  }

  // 點遮罩關閉
  const backdrop = document.getElementById("cartModalBackdrop");
  if (backdrop && e.target === backdrop) {
    closeCartModal();
  }
});

// 彈窗內 + / - / 刪除
document.addEventListener("click", (e) => {
  const listEl = document.getElementById("cartModalList");
  if (!listEl) return;
  if (!listEl.contains(e.target)) return;

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
  renderCartModal();
});

// ESC 關彈窗
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const backdrop = document.getElementById("cartModalBackdrop");
  if (backdrop && backdrop.classList.contains("show")) {
    closeCartModal();
  }
});


// ===========================
// 飲品菜單頁：人氣排行
// - 不用 order 重排，改用 transform
// - 點左右卡片會像輪盤轉到中間
// ===========================
const wheel = document.getElementById("rankingWheel");
const wheelCards = wheel ? Array.from(wheel.querySelectorAll(".rank-card")) : [];

if (wheel && wheelCards.length) {
  let activeIndex = 0;
  const total = wheelCards.length;

  function normalizeOffset(offset, n) {
    let x = ((offset % n) + n) % n;
    if (x > n / 2) x -= n;
    return x;
  }

  function renderWheel() {
    // 這裡的數字就是「輪盤的弧度與半徑」，想更像轉盤可調大一點
    const radiusX = 360; // 水平半徑（越大會更像輪盤）
    const liftY = 24;    // 垂直起伏（越大越有弧線感）
    const stepDeg = 38;  // 每轉一步的角度

    wheelCards.forEach((card, i) => {
      const offset = normalizeOffset(i - activeIndex, total);
      const abs = Math.abs(offset);

      const angle = offset * stepDeg * (Math.PI / 180);
      const x = Math.sin(angle) * radiusX;
      const y = -Math.cos(angle) * liftY; 

      const scale = offset === 0 ? 1.02 : abs === 1 ? 0.92 : 0.88;
      const opacity = offset === 0 ? 1 : abs === 1 ? 0.85 : 0.75;
      const z = 10 - abs;

      card.style.setProperty("--x", `${x}px`);
      card.style.setProperty("--y", `${y}px`);
      card.style.setProperty("--s", `${scale}`);
      card.style.setProperty("--o", `${opacity}`);
      card.style.setProperty("--z", `${z}`);

      card.classList.toggle("is-center", offset === 0);

      
    });
  }

  // 初始定位
  renderWheel();

  // 點卡片：輪盤轉到那張
  wheelCards.forEach((card, i) => {
    card.addEventListener("click", () => {
      if (i === activeIndex) return;

      activeIndex = i;
      requestAnimationFrame(renderWheel);
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
  if (!statusEl) return; // 不在 member.html 就跳出

  const authSection = document.getElementById("memberAuth");
  const dashboardSection = document.getElementById("memberDashboard");
  const nameEl = document.getElementById("memberUsername");
  const logoutBtn = document.getElementById("logoutBtn");

  const user = getCurrentUser();

  if (user) {
    // 會員已登入：顯示會員中心，收起登入/註冊
    if (authSection) authSection.style.display = "none";
    if (dashboardSection) dashboardSection.style.display = "block";
    if (nameEl) nameEl.textContent = user.name || "會員";

    // 會員中心的登出按鈕
    if (logoutBtn) logoutBtn.style.display = "inline-flex";

    statusEl.innerHTML = `
      <p>嗨，<strong>${user.name}</strong>，歡迎回來。</p>
      <p class="member-status-sub">你可以在菜單頁幫飲品評分</p>
    `;
  } else {
    // 尚未登入：顯示登入/註冊，收起會員中心
    if (authSection) authSection.style.display = "block";
    if (dashboardSection) dashboardSection.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";

    statusEl.innerHTML = `
      <p>目前尚未登入。</p>
      <p class="member-status-sub">註冊的資料只會保存在你的瀏覽器裡，不會傳到任何伺服器</p>
    `;
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

// 會員中心：右側訂單 tab
const orderTabs = document.querySelectorAll(".order-tab");
if (orderTabs.length) {
  const emptyTitle = document.querySelector(".order-empty-title");

  const tabLabelMap = {
    all: "尚未有訂單",
    pay: "尚未有待付款的訂單",
    ship: "尚未有待製作的訂單",
    receive: "尚未有待取的訂單",
    done: "尚未有已完成的訂單",
    cancel: "尚未有取消的訂單",
    refund: "尚未有退貨/退款的訂單",
  };

  orderTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      orderTabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const key = btn.dataset.orderTab;
      if (emptyTitle && key && tabLabelMap[key]) {
        emptyTitle.textContent = tabLabelMap[key];
      }
    });
  });
}

// 會員中心：編輯個人簡介（示意）
const memberEditBtn = document.getElementById("memberEditBtn");
if (memberEditBtn) {
  memberEditBtn.addEventListener("click", () => {
    alert("目前為期末專案前端示意");
  });
}

// ===========================
// 飲品評分（只有前端）
// ===========================
const RATINGS_KEY = "site_ratings";
// ===========================
// 預設假評價（第一次/或缺資料時補進 localStorage）
// - 不覆蓋已存在的真實評分
// - 只補「不存在的 drinkId」
// ===========================
function seedDefaultRatingsIfEmpty() {
  const defaults = {
    drink1: {
      userRatings: {
        "mika@demo.com": 5,
        "han@demo.com": 4,
        "yuzu@demo.com": 5,
      },
      userComments: {
        "mika@demo.com": "茶香很乾淨，尾韻有回甘",
        "han@demo.com": "不會澀，冰一點更順",
      },
    },
    drink2: {
      userRatings: {
        "riku@demo.com": 4,
        "noa@demo.com": 4,
        "sena@demo.com": 5,
        "kai@demo.com": 4,
      },
      userComments: {
        "sena@demo.com": "奶香跟茶底比例超舒服。",
      },
    },
    drink3: {
      userRatings: {
        "rina@demo.com": 5,
        "aoi@demo.com": 5,
        "tom@demo.com": 4,
      },
      userComments: {
        "rina@demo.com": "果香酸甜剛好，奶蓋很加分。",
      },
    },
    drink4: {
      userRatings: {
        "jay@demo.com": 4,
        "mei@demo.com": 3,
        "kyo@demo.com": 4,
      },
      userComments: {
        "kyo@demo.com": "甜度半糖最剛好。",
      },
    },
    drink5: {
      userRatings: {
        "zoe@demo.com": 5,
        "liam@demo.com": 4,
      },
      userComments: {
        "zoe@demo.com": "香氣很穩，熱飲也耐喝。",
      },
    },
  };

  // 讀現有資料
  let existing = {};
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    existing = raw ? JSON.parse(raw) : {};
    if (!existing || typeof existing !== "object") existing = {};
  } catch (e) {
    existing = {};
  }

  // 補齊缺的 drinkId
  let changed = false;
  Object.entries(defaults).forEach(([drinkId, payload]) => {
    if (existing[drinkId]) return;

    const ratings = payload.userRatings || {};
    const values = Object.values(ratings);
    const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0);
    const count = values.length;

    existing[drinkId] = {
      total,
      count,
      userRatings: ratings,
      userComments: payload.userComments || {},
    };

    changed = true;
  });

  if (changed) {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(existing));
  }
}

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
    if (trimmed) entry.userComments[userId] = trimmed;
    else delete entry.userComments[userId];
  }

  ratings[drinkId] = entry;
  saveRatings(ratings);
}

// 取消某位使用者對某杯飲料的評論
function deleteRatingForDrink(drinkId, userId) {
  const ratings = loadRatings();
  const entry = ratings[drinkId];
  if (!entry || !entry.userRatings || !(userId in entry.userRatings)) return;

  const prev = entry.userRatings[userId];
  entry.total -= prev;
  entry.count -= 1;

  delete entry.userRatings[userId];
  if (entry.userComments) delete entry.userComments[userId];

  if (entry.count <= 0) delete ratings[drinkId];
  else ratings[drinkId] = entry;

  saveRatings(ratings);
}

function getRatingInfo(drinkId, userId) {
  const ratings = loadRatings();
  const entry = ratings[drinkId];

  if (!entry) {
    return { avg: 0, count: 0, userRating: null, comment: "" };
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
    if (count === 0) textEl.textContent = "目前尚無評分";
    else {
      const base = `平均 ${avg.toFixed(1)} ★（${count} 筆評分）`;
      textEl.textContent = userRating ? `${base}，你給了 ${userRating}★` : base;
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

// 大家的評論
// 顯示「所有有評分的人」，沒文字就顯示提示
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderAllComments(drinkId, currentUserEmail) {
  const ratings = loadRatings();
  const entry = ratings[drinkId];

  const listEl = document.getElementById("ratingModalCommentsList");
  const countEl = document.getElementById("ratingModalCommentsCount");
  if (!listEl || !countEl) return;

  const userRatings = entry?.userRatings || {};
  const userComments = entry?.userComments || {};

  // 只要有評分或有留言，就列入
  const emails = Array.from(
    new Set([...Object.keys(userRatings), ...Object.keys(userComments)])
  );

  const items = emails.map((email) => ({
    email,
    rating: Number(userRatings[email] || 0),
    comment: (userComments[email] || "").trim(),
  }));

  // 自己置頂 → 有文字置前 → 星等高到低
  items.sort((a, b) => {
    const aMe = a.email === currentUserEmail ? 1 : 0;
    const bMe = b.email === currentUserEmail ? 1 : 0;
    if (aMe !== bMe) return bMe - aMe;

    const aHas = a.comment ? 1 : 0;
    const bHas = b.comment ? 1 : 0;
    if (aHas !== bHas) return bHas - aHas;

    return b.rating - a.rating;
  });

  countEl.textContent = String(items.length);

  if (!items.length) {
    listEl.innerHTML =
      `<div class="rating-comment-empty">目前還沒有任何評論。</div>`;
    return;
  }

  listEl.innerHTML = items
    .map((it) => {
      const isMe = it.email === currentUserEmail;
      const who = isMe ? "你" : escapeHtml(it.email);
      const stars =
        "★".repeat(it.rating) + "☆".repeat(Math.max(0, 5 - it.rating));
      const comment = it.comment
        ? escapeHtml(it.comment)
        : "（未留下文字評論）";

      return `
        <div class="rating-comment-item ${isMe ? "is-me" : ""}">
          <div class="rating-comment-top">
            <span class="rating-comment-user">${who}</span>
            <span class="rating-comment-stars">${stars}</span>
          </div>
          <div class="rating-comment-text">${comment}</div>
        </div>
      `;
    })
    .join("");
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

  if (ratingModalCommentEl) ratingModalCommentEl.value = "";
  if (ratingModalStatusEl) ratingModalStatusEl.textContent = "";

  // 清空大家的評論區（避免上一杯殘留）
  const listEl = document.getElementById("ratingModalCommentsList");
  const countEl = document.getElementById("ratingModalCommentsCount");
  if (listEl) listEl.innerHTML = "";
  if (countEl) countEl.textContent = "0";
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

  if (ratingModalCommentEl) ratingModalCommentEl.value = info.comment || "";

  if (ratingModalStatusEl) {
    if (info.userRating) {
      ratingModalStatusEl.textContent =
        `你之前給了 ${info.userRating}★，可以在這裡修改或刪除。`;
    } else if (info.count) {
      ratingModalStatusEl.textContent =
        `目前平均 ${info.avg.toFixed(1)}★，共有 ${info.count} 筆評分。`;
    } else {
      ratingModalStatusEl.textContent =
        "還沒有任何評分，成為第一個分享心得的人吧。";
    }
  }

  // 顯示大家的評論
  renderAllComments(drinkId, currentUser.email);

  ratingModalBackdrop.classList.add("show");
  document.body.classList.add("modal-open");
}

// 關閉彈窗（按 X）
if (ratingModalCloseBtn) {
  ratingModalCloseBtn.addEventListener("click", () => closeRatingModal());
}

// 點遮罩關閉
if (ratingModalBackdrop) {
  ratingModalBackdrop.addEventListener("click", (e) => {
    if (e.target === ratingModalBackdrop) closeRatingModal();
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

    if (currentRatingBlockEl) renderRatingElement(currentRatingBlockEl);

    // 立刻刷新評論牆
    renderAllComments(currentRatingDrinkId, currentUser.email);

    if (ratingModalStatusEl) ratingModalStatusEl.textContent = "已儲存你的評分與心得。";

    // 你想保留彈窗就註解掉 close；想自動關掉就保留
    setTimeout(() => closeRatingModal(), 600);
  });
}

// 刪除這位使用者對這杯飲料的紀錄（星星＋文字）
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

    if (currentRatingBlockEl) renderRatingElement(currentRatingBlockEl);

    // 刪完也刷新評論牆
    renderAllComments(currentRatingDrinkId, currentUser.email);

    closeRatingModal();
  });
}

// 初始化
function initRatings() {
  seedDefaultRatingsIfEmpty();

  const ratingBlocks = document.querySelectorAll(".drink-rating");
  if (!ratingBlocks.length) return;

  ratingBlocks.forEach((block) => {
    const drinkId = block.dataset.drinkId;
    if (!drinkId) return;

    renderRatingElement(block);

    block.style.cursor = "pointer";
    block.addEventListener("click", () => openRatingModalForBlock(block, drinkId));
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

  // 不處理新分頁、外部連結
  if (a.target === "_blank") return;
  if (/^(https?:)?\/\//i.test(href)) return;

  // 把 href 轉成完整 URL
  const url = new URL(href, window.location.href);

  const samePage = url.pathname === window.location.pathname;

  // 同頁且直接移動
  if (samePage && url.hash) {
    const target = document.querySelector(url.hash);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
      history.pushState(null, "", url.hash);
    }
    return;
  }

  if (href.startsWith("#")) return;

  // 跨頁淡出
  e.preventDefault();
  document.body.classList.add("page-leave");

  setTimeout(() => {
    window.location.href = url.href;
  }, 220);
});

// 進頁淡入
window.addEventListener("pageshow", () => {
  document.body.classList.remove("page-leave");
});


const cartBtn = document.getElementById('cartBtn');

if (cartBtn) {
  cartBtn.addEventListener('click', () => {
    openCartModal(); // 購物車彈出 function
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const sideLinks = document.querySelectorAll(".member-side-link[data-panel]");
  const panels = document.querySelectorAll(".member-panel[data-panel]");

  if (!sideLinks.length || !panels.length) return;

  sideLinks.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.panel;

      // 切換側欄 active
      sideLinks.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // 切換右側內容
      panels.forEach((panel) => {
        panel.classList.toggle(
          "active",
          panel.dataset.panel === target
        );
      });
    });
  });
});

// ===========================
// 首頁彈窗廣告
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  const promoModal = document.getElementById("promoModal");
  const promoClose = document.getElementById("promoModalClose");

  // 只在首頁執行
  if (!promoModal) return;

  setTimeout(() => {
    promoModal.classList.add("show");
  }, 600);

  const closePromo = () => {
    promoModal.classList.remove("show");
  };

  promoClose.addEventListener("click", closePromo);

  // 點背景關閉
  promoModal.addEventListener("click", (e) => {
    if (e.target === promoModal) {
      closePromo();
    }
  });
});
