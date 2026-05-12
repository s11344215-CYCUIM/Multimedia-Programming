<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="java.sql.*" %>
<%@ page import="java.math.BigDecimal" %>
<%@ page import="java.util.*" %>
<%!
  private String escapeHtml(String value) {
    if (value == null) return "";
    return value
      .replace("&", "&amp;")
      .replace("<", "&lt;")
      .replace(">", "&gt;")
      .replace("\"", "&quot;")
      .replace("'", "&#39;");
  }

  private String valueAt(String[] values, int index) {
    if (values == null || index < 0 || index >= values.length || values[index] == null) {
      return "";
    }
    return values[index].trim();
  }

  private int parsePositiveInt(String value) {
    try {
      int parsed = Integer.parseInt(value);
      return parsed > 0 ? parsed : 0;
    } catch (Exception ex) {
      return 0;
    }
  }

  private BigDecimal optionExtra(String sizeName, String toppings) {
    BigDecimal extra = BigDecimal.ZERO;
    if (sizeName != null && sizeName.contains("10")) {
      extra = extra.add(new BigDecimal("10.00"));
    }
    if (toppings != null && !toppings.trim().isEmpty()) {
      int toppingCount = toppings.split(",").length;
      extra = extra.add(new BigDecimal(toppingCount * 10));
    }
    return extra;
  }
%>
<%
  request.setCharacterEncoding("UTF-8");

  final String dbUrl = "jdbc:mysql://127.0.0.1:3306/drink_shop?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Taipei&useSSL=false&allowPublicKeyRetrieval=true";
  final String dbUser = "root";
  final String dbPassword = "1234";

  Integer currentUserId = (Integer) session.getAttribute("userId");
  boolean orderSuccess = false;
  String orderMessage = "";

  if ("POST".equalsIgnoreCase(request.getMethod())) {
    String customerName = valueAt(new String[] { request.getParameter("name") }, 0);
    String phone = valueAt(new String[] { request.getParameter("phone") }, 0);
    String pickupDate = valueAt(new String[] { request.getParameter("date") }, 0);
    String pickupTime = valueAt(new String[] { request.getParameter("time") }, 0);
    String payment = valueAt(new String[] { request.getParameter("payment") }, 0);
    String orderNote = valueAt(new String[] { request.getParameter("note") }, 0);

    String[] productIds = request.getParameterValues("product_id");
    String[] quantities = request.getParameterValues("quantity");
    String[] sizeNames = request.getParameterValues("size_name");
    String[] sugarLevels = request.getParameterValues("sugar_level");
    String[] iceLevels = request.getParameterValues("ice_level");
    String[] toppingsList = request.getParameterValues("toppings");
    String[] itemNotes = request.getParameterValues("item_note");

    Connection conn = null;

    try {
      if (customerName.isEmpty() || phone.isEmpty() || pickupDate.isEmpty() || pickupTime.isEmpty()) {
        throw new Exception("請完整填寫取餐資料。");
      }
      if (productIds == null || productIds.length == 0) {
        throw new Exception("購物車目前是空的，請先加入商品。");
      }

      Class.forName("com.mysql.cj.jdbc.Driver");
      conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
      conn.setAutoCommit(false);

      List<Object[]> orderItems = new ArrayList<>();
      BigDecimal totalAmount = BigDecimal.ZERO;

      String productSql = "SELECT name, price, stock FROM products WHERE product_id = ? AND is_active = 1 FOR UPDATE";
      try (PreparedStatement productStmt = conn.prepareStatement(productSql)) {
        for (int i = 0; i < productIds.length; i++) {
          int productId = parsePositiveInt(valueAt(productIds, i));
          int quantity = parsePositiveInt(valueAt(quantities, i));
          if (productId <= 0 || quantity <= 0) {
            throw new Exception("購物車資料不完整，請重新加入商品。");
          }

          productStmt.setInt(1, productId);

          try (ResultSet rs = productStmt.executeQuery()) {
            if (!rs.next()) {
              throw new Exception("商品不存在或已下架。");
            }

            String productName = rs.getString("name");
            BigDecimal basePrice = rs.getBigDecimal("price");
            int stock = rs.getInt("stock");

            if (stock < quantity) {
              throw new Exception(productName + " 庫存不足，目前只剩 " + stock + " 件。");
            }

            String sizeName = valueAt(sizeNames, i);
            String sugarLevel = valueAt(sugarLevels, i);
            String iceLevel = valueAt(iceLevels, i);
            String toppings = valueAt(toppingsList, i);
            String itemNote = valueAt(itemNotes, i);
            BigDecimal unitPrice = basePrice.add(optionExtra(sizeName, toppings));
            BigDecimal subtotal = unitPrice.multiply(new BigDecimal(quantity));

            totalAmount = totalAmount.add(subtotal);
            orderItems.add(new Object[] {
              productId, productName, unitPrice, quantity, sizeName,
              sugarLevel, iceLevel, toppings, itemNote, subtotal
            });
          }
        }
      }

      int orderId;
      String orderSql =
        "INSERT INTO orders (user_id, customer_name, phone, pickup_date, pickup_time, payment_method, note, total_amount) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

      try (PreparedStatement orderStmt = conn.prepareStatement(orderSql, Statement.RETURN_GENERATED_KEYS)) {
        if (currentUserId == null) {
          orderStmt.setNull(1, Types.INTEGER);
        } else {
          orderStmt.setInt(1, currentUserId);
        }
        orderStmt.setString(2, customerName);
        orderStmt.setString(3, phone);
        orderStmt.setDate(4, java.sql.Date.valueOf(pickupDate));
        orderStmt.setTime(5, java.sql.Time.valueOf(pickupTime + ":00"));
        orderStmt.setString(6, payment);
        orderStmt.setString(7, orderNote);
        orderStmt.setBigDecimal(8, totalAmount);
        orderStmt.executeUpdate();

        try (ResultSet keys = orderStmt.getGeneratedKeys()) {
          if (!keys.next()) {
            throw new Exception("訂單建立失敗，請稍後再試。");
          }
          orderId = keys.getInt(1);
        }
      }

      String itemSql =
        "INSERT INTO order_items " +
        "(order_id, product_id, product_name, unit_price, quantity, size_name, sugar_level, ice_level, toppings, note, subtotal) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      String stockSql = "UPDATE products SET stock = stock - ? WHERE product_id = ? AND stock >= ?";

      try (
        PreparedStatement itemStmt = conn.prepareStatement(itemSql);
        PreparedStatement stockStmt = conn.prepareStatement(stockSql)
      ) {
        for (Object[] item : orderItems) {
          int productId = (Integer) item[0];
          int quantity = (Integer) item[3];

          itemStmt.setInt(1, orderId);
          itemStmt.setInt(2, productId);
          itemStmt.setString(3, (String) item[1]);
          itemStmt.setBigDecimal(4, (BigDecimal) item[2]);
          itemStmt.setInt(5, quantity);
          itemStmt.setString(6, (String) item[4]);
          itemStmt.setString(7, (String) item[5]);
          itemStmt.setString(8, (String) item[6]);
          itemStmt.setString(9, (String) item[7]);
          itemStmt.setString(10, (String) item[8]);
          itemStmt.setBigDecimal(11, (BigDecimal) item[9]);
          itemStmt.addBatch();

          stockStmt.setInt(1, quantity);
          stockStmt.setInt(2, productId);
          stockStmt.setInt(3, quantity);
          if (stockStmt.executeUpdate() != 1) {
            throw new Exception("庫存更新失敗，請重新確認商品庫存。");
          }
        }
        itemStmt.executeBatch();
      }

      conn.commit();
      orderSuccess = true;
      orderMessage = "訂單已建立，訂單編號：" + orderId + "，總金額 $" + totalAmount.intValue();
    } catch (Exception ex) {
      if (conn != null) {
        try {
          conn.rollback();
        } catch (SQLException ignore) {}
      }
      orderMessage = ex.getMessage();
    } finally {
      if (conn != null) {
        try {
          conn.close();
        } catch (SQLException ignore) {}
      }
    }
  }
%><!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <!-- 網頁分頁名稱和logo圖示 -->
    <title>結帳資訊 - 檢茶官</title>
    <link rel="icon" href="images/logo.png" type="image/png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="style.css" />
    <script src="script.js?v=20260512-3" defer></script>
  </head>

  <body>
    <header class="site-header">
      <div class="container nav-container">
        <!-- 主畫面左上Logo跟檢茶官品牌名稱 -->
        <a href="index.html#adSlider" class="logo">
          <img src="images/logo.png" alt="檢茶官" class="logo-icon" />
          <span class="logo-text">檢茶官</span>
        </a>

        <div class="nav-menu-wrapper">
          <button class="nav-toggle" id="navToggle" aria-label="切換選單">
            <span class="nav-toggle-line"></span>
            <span class="nav-toggle-line"></span>
            <span class="nav-toggle-line"></span>
          </button>

          <nav class="main-nav" id="mainNav">
            <a href="index.html#adSlider">首頁</a>
            <a href="index.html#limited">季節新品</a>
            <a href="index.html#story">品牌故事</a>
            <a href="index.html#craftsmen">匠心職人</a>
            <a href="menu.jsp">飲品菜單</a>
            <a href="merch.html">周邊商品</a>
            <a href="index.html#about">關於我們</a>
            <a href="member.jsp">會員專區</a>
          </nav>
        </div>
      </div>
    </header>

    <main class="section checkout-page">
      <div class="container">
        <h1 class="page-title">結帳資訊</h1>
        <p class="page-subtitle">
          再確認一次品項與數量，並填寫基本聯絡資訊<br />
        </p>

        <% if (!orderMessage.isEmpty()) { %>
          <div class="cart-empty-message" style="display: block;">
            <%= escapeHtml(orderMessage) %>
          </div>
        <% } %>
        <!-- 如果購物車是空的 -->
        <div id="checkoutEmpty" class="cart-empty-message">
          目前沒有任何品項可以結帳，<a href="menu.jsp">回去加點幾杯飲料</a>吧
        </div>

        <!-- 結帳內容 -->
        <div id="checkoutContent" class="checkout-content">
          <!-- 左邊：訂單摘要 -->
          <section class="checkout-summary-section">
            <h2 class="checkout-section-title">訂單明細</h2>
            <div id="checkoutSummary" class="checkout-summary-list">
              <!-- 由 script.js 的 renderCheckoutPage() 填入每一項 -->
            </div>
            <div class="checkout-summary-total">
              <span>總金額</span>
              <span id="checkoutTotal">$0</span>
            </div>
          </section>

          <!-- 右邊：填寫資料 -->
          <section class="checkout-form-section">
            <h2 class="checkout-section-title">取餐與付款資訊</h2>

            <form
              id="checkoutForm"
              class="checkout-form"
              method="post"
              action="checkout.jsp"
              data-backend-checkout="true"
            >
              <div class="checkout-form-group">
                <label for="checkout-name">姓名</label>
                <input
                  type="text"
                  id="checkout-name"
                  name="name"
                  required
                  placeholder="請輸入姓名"
                />
              </div>

              <div class="checkout-form-group">
                <label for="checkout-phone">聯絡電話</label>
                <input
                  type="tel"
                  id="checkout-phone"
                  name="phone"
                  required
                  placeholder="請輸入手機號碼"
                />
              </div>

              <div class="checkout-form-group">
                <label for="checkout-date">取餐日期</label>
                <input type="date" id="checkout-date" name="date" required />
              </div>

              <div class="checkout-form-group">
                <label for="checkout-time">預計取餐時間</label>
                <input type="time" id="checkout-time" name="time" required />
              </div>

              <div class="checkout-form-group">
                <label>付款方式</label>
                <div class="payment-options">
                  <label class="payment-option">
                    <input type="radio" name="payment" value="cash" checked />
                    <span>現金支付</span>
                  </label>
                  <label class="payment-option">
                    <input type="radio" name="payment" value="apple_pay" />
                    <span>Apple&nbsp;Pay</span>
                  </label>
                  <label class="payment-option">
                    <input type="radio" name="payment" value="line_pay" />
                    <span>LINE&nbsp;Pay</span>
                  </label>
                </div>
              </div>

              <div class="checkout-form-group">
                <label for="checkout-note">備註</label>
                <textarea
                  id="checkout-note"
                  name="note"
                  rows="5"
                  placeholder="例如：不要塑膠袋、到店前再製作、需要分開裝、或其他需求"
                ></textarea>
              </div>

              <button type="submit" class="btn primary-btn">送出訂單</button>
            </form>
          </section>
        </div>
      </div>
    </main>

    <footer class="site-footer">
      <div class="container footer-content">
        <div class="footer-info">
          <h3 class="footer-title">品牌總部資訊</h3>
          <p>地址：桃園市中壢區中北路200號</p>
          <p>電話：03-000-0000</p>
          <p>
            營業時間：平日10:30-21:30&nbsp;&nbsp;&nbsp;&nbsp;假日11:00-21:30
          </p>
          <p>Email：cycutea@gmail.com</p>
        </div>
        <div class="footer-links">
          <a
            href="https://www.cycu.edu.tw"
            target="_blank"
            rel="noopener"
            class="footer-social-link"
          >
            <span class="footer-ig-icon" aria-hidden="true"></span>
            <span>Instagram</span>
          </a>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container">
          <p>© 2025 CYCUTEA All Rights Reserved.</p>
        </div>
      </div>
    </footer>

    <!-- 懸浮購物車 -->
    <button
    type="button"
    id="cartBtn"
    class="fab cart-floating"
    aria-label="購物車"
    >
    🛒
    <span class="cart-count-badge" id="cartCount">0</span>
    </button>
    <% if (orderSuccess) { %>
    <script>
      localStorage.removeItem("site_cart");
    </script>
    <% } %>
  </body>
</html>
