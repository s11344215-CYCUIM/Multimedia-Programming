<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="java.sql.*" %>
<%@ page import="jakarta.servlet.http.HttpServletRequest" %>
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

  private String escapeJs(String value) {
    if (value == null) return "";
    return value
      .replace("\\", "\\\\")
      .replace("\"", "\\\"")
      .replace("\r", "\\r")
      .replace("\n", "\\n")
      .replace("<", "\\u003C")
      .replace(">", "\\u003E")
      .replace("&", "\\u0026");
  }

  private String trimParam(HttpServletRequest request, String name) {
    String value = request.getParameter(name);
    return value == null ? "" : value.trim();
  }
%>
<%
  request.setCharacterEncoding("UTF-8");

  final String dbUrl = "jdbc:mysql://127.0.0.1:3306/drink_shop?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Taipei&useSSL=false&allowPublicKeyRetrieval=true";
  final String dbUser = "root";
  final String dbPassword = "1234";

  String message = "";
  boolean messageOk = false;
  String activeAuthPanel = "loginPanel";
  String action = trimParam(request, "action");

  if ("logout".equals(action)) {
    session.invalidate();
    response.sendRedirect("member.jsp?loggedOut=1");
    return;
  }

  if ("1".equals(request.getParameter("loggedOut"))) {
    message = "已登出。";
    messageOk = true;
  }

  if ("POST".equalsIgnoreCase(request.getMethod())) {
    try {
      Class.forName("com.mysql.cj.jdbc.Driver");

      if ("register".equals(action)) {
        activeAuthPanel = "registerPanel";
        String name = trimParam(request, "name");
        String email = trimParam(request, "email").toLowerCase();
        String password = request.getParameter("password") == null ? "" : request.getParameter("password");

        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
          throw new Exception("請完整填寫註冊資料。");
        }
        if (password.length() < 6) {
          throw new Exception("密碼至少需要 6 個字元。");
        }

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword)) {
          String existsSql = "SELECT user_id FROM users WHERE email = ?";
          try (PreparedStatement existsStmt = conn.prepareStatement(existsSql)) {
            existsStmt.setString(1, email);
            try (ResultSet rs = existsStmt.executeQuery()) {
              if (rs.next()) {
                throw new Exception("這個 Email 已經註冊過，請改用登入。");
              }
            }
          }

          String insertSql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
          try (PreparedStatement insertStmt = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
            insertStmt.setString(1, name);
            insertStmt.setString(2, email);
            insertStmt.setString(3, password);
            insertStmt.executeUpdate();

            try (ResultSet keys = insertStmt.getGeneratedKeys()) {
              if (!keys.next()) {
                throw new Exception("註冊失敗，請稍後再試。");
              }
              session.setAttribute("userId", keys.getInt(1));
              session.setAttribute("userName", name);
              session.setAttribute("userEmail", email);
            }
          }
        }

        message = "註冊完成，已自動登入。";
        messageOk = true;
      } else if ("login".equals(action)) {
        String email = trimParam(request, "email").toLowerCase();
        String password = request.getParameter("password") == null ? "" : request.getParameter("password");

        if (email.isEmpty() || password.isEmpty()) {
          throw new Exception("請輸入 Email 與密碼。");
        }

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword)) {
          String loginSql = "SELECT user_id, name, email, password FROM users WHERE email = ?";
          try (PreparedStatement loginStmt = conn.prepareStatement(loginSql)) {
            loginStmt.setString(1, email);
            try (ResultSet rs = loginStmt.executeQuery()) {
              if (!rs.next() || !password.equals(rs.getString("password"))) {
                throw new Exception("帳號或密碼錯誤。");
              }
              session.setAttribute("userId", rs.getInt("user_id"));
              session.setAttribute("userName", rs.getString("name"));
              session.setAttribute("userEmail", rs.getString("email"));
            }
          }
        }

        message = "登入成功。";
        messageOk = true;
      } else if ("updateProfile".equals(action)) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) {
          throw new Exception("請先登入。");
        }

        String name = trimParam(request, "name");
        String newPassword = request.getParameter("password") == null ? "" : request.getParameter("password");

        if (name.isEmpty()) {
          throw new Exception("姓名不可空白。");
        }
        if (!newPassword.isEmpty() && newPassword.length() < 6) {
          throw new Exception("新密碼至少需要 6 個字元。");
        }

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword)) {
          if (newPassword.isEmpty()) {
            String updateSql = "UPDATE users SET name = ? WHERE user_id = ?";
            try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
              updateStmt.setString(1, name);
              updateStmt.setInt(2, userId);
              updateStmt.executeUpdate();
            }
          } else {
            String updateSql = "UPDATE users SET name = ?, password = ? WHERE user_id = ?";
            try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
              updateStmt.setString(1, name);
              updateStmt.setString(2, newPassword);
              updateStmt.setInt(3, userId);
              updateStmt.executeUpdate();
            }
          }
        }

        session.setAttribute("userName", name);
        message = "會員資料已更新。";
        messageOk = true;
      }
    } catch (Exception ex) {
      message = ex.getMessage();
      messageOk = false;
    }
  }

  Integer currentUserId = (Integer) session.getAttribute("userId");
  String currentUserName = (String) session.getAttribute("userName");
  String currentUserEmail = (String) session.getAttribute("userEmail");
  boolean loggedIn = currentUserId != null;
%><!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <title>會員專區 - 檢茶官</title>
    <link rel="icon" href="images/logo.png" type="image/png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <link rel="stylesheet" href="style.css" />
    <script>
      window.CURRENT_USER = <%= loggedIn ? ("{name: \"" + escapeJs(currentUserName) + "\", email: \"" + escapeJs(currentUserEmail) + "\"}") : "null" %>;
    </script>
    <script src="script.js?v=20260512-3" defer></script>
  </head>

  <body>
    <header class="site-header">
      <div class="container nav-container">
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

    <main class="section member-page">
      <div class="container">
        <h1 class="page-title">會員專區</h1>

        <% if (!message.isEmpty()) { %>
          <div class="member-status" style="margin-bottom: 1.2rem;">
            <p><%= escapeHtml(message) %></p>
          </div>
        <% } %>

        <% if (!loggedIn) { %>
        <section id="memberAuth" class="member-auth" aria-label="會員登入註冊">
          <div class="member-layout">
            <div class="member-status" id="memberStatus">
              <p>目前尚未登入。</p>
            </div>

            <div class="member-tabs">
              <button
                type="button"
                class="member-tab-btn <%= "loginPanel".equals(activeAuthPanel) ? "active" : "" %>"
                data-tab-target="loginPanel"
              >
                會員登入
              </button>
              <button
                type="button"
                class="member-tab-btn <%= "registerPanel".equals(activeAuthPanel) ? "active" : "" %>"
                data-tab-target="registerPanel"
              >
                建立帳號
              </button>
            </div>

            <section class="member-panel <%= "loginPanel".equals(activeAuthPanel) ? "active" : "" %>" id="loginPanel">
              <form id="loginForm" class="member-form" method="post" action="member.jsp" data-backend-member="true">
                <input type="hidden" name="action" value="login" />
                <div class="member-form-group">
                  <label for="login-email">Email</label>
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    required
                    placeholder="請輸入 Email"
                  />
                </div>
                <div class="member-form-group">
                  <label for="login-password">密碼</label>
                  <input
                    type="password"
                    id="login-password"
                    name="password"
                    required
                    placeholder="請輸入密碼"
                  />
                </div>
                <button type="submit" class="btn primary-btn member-submit-btn">
                  登入
                </button>
              </form>
            </section>

            <section class="member-panel <%= "registerPanel".equals(activeAuthPanel) ? "active" : "" %>" id="registerPanel">
              <form id="registerForm" class="member-form" method="post" action="member.jsp" data-backend-member="true">
                <input type="hidden" name="action" value="register" />
                <div class="member-form-group">
                  <label for="register-name">姓名 / 暱稱</label>
                  <input
                    type="text"
                    id="register-name"
                    name="name"
                    required
                    placeholder="請輸入姓名"
                  />
                </div>
                <div class="member-form-group">
                  <label for="register-email">Email</label>
                  <input
                    type="email"
                    id="register-email"
                    name="email"
                    required
                    placeholder="登入用 Email"
                  />
                </div>
                <div class="member-form-group">
                  <label for="register-password">密碼</label>
                  <input
                    type="password"
                    id="register-password"
                    name="password"
                    required
                    minlength="6"
                    placeholder="至少 6 個字元"
                  />
                </div>
                <button type="submit" class="btn primary-btn member-submit-btn">
                  註冊並登入
                </button>
              </form>
            </section>
          </div>
        </section>
        <% } else { %>
        <section
          id="memberDashboard"
          class="member-dashboard"
          aria-label="會員中心"
        >
          <div class="member-center">
            <aside class="member-sidebar" aria-label="會員選單">
              <div class="member-profile">
                <div class="member-avatar" aria-hidden="true"></div>
                <div class="member-profile-text">
                  <div class="member-username" id="memberUsername"><%= escapeHtml(currentUserName) %></div>
                  <a href="#accountPanel" class="member-edit">編輯會員資料</a>
                </div>
              </div>

              <nav class="member-side-nav" aria-label="會員功能">
                <button type="button" class="member-side-link active" data-panel="account">
                  <span class="member-side-ico" aria-hidden="true">帳</span>
                  <span>帳戶資料</span>
                </button>
                <button type="button" class="member-side-link" data-panel="orders">
                  <span class="member-side-ico" aria-hidden="true">單</span>
                  <span>訂單紀錄</span>
                </button>
                <button type="button" class="member-side-link" data-panel="notice">
                  <span class="member-side-ico" aria-hidden="true">訊</span>
                  <span>通知中心</span>
                </button>
                <button type="button" class="member-side-link" data-panel="coupon">
                  <span class="member-side-ico" aria-hidden="true">券</span>
                  <span>優惠券</span>
                </button>
                <button type="button" class="member-side-link" data-panel="points">
                  <span class="member-side-ico" aria-hidden="true">點</span>
                  <span>會員點數</span>
                </button>
                <button type="button" class="member-side-link" data-panel="refund">
                  <span class="member-side-ico" aria-hidden="true">退</span>
                  <span>退貨退款</span>
                </button>
              </nav>

              <form method="post" action="member.jsp" data-backend-member="true">
                <input type="hidden" name="action" value="logout" />
                <button type="submit" class="btn secondary-btn member-logout-btn" id="logoutBtn">
                  登出
                </button>
              </form>
            </aside>

            <section class="member-main" aria-label="會員內容">
              <section class="member-panel active" data-panel="account" id="accountPanel">
                <h2>帳戶資料</h2>
                <div class="checkout-summary-item">
                  <div class="checkout-summary-item-main">
                    <div class="checkout-summary-item-name">會員名稱</div>
                    <div class="checkout-summary-item-options"><%= escapeHtml(currentUserName) %></div>
                  </div>
                </div>
                <div class="checkout-summary-item">
                  <div class="checkout-summary-item-main">
                    <div class="checkout-summary-item-name">Email</div>
                    <div class="checkout-summary-item-options"><%= escapeHtml(currentUserEmail) %></div>
                  </div>
                </div>

                <form class="member-form" method="post" action="member.jsp" data-backend-member="true" style="margin-top: 1.2rem;">
                  <input type="hidden" name="action" value="updateProfile" />
                  <div class="member-form-group">
                    <label for="profile-name">修改姓名</label>
                    <input id="profile-name" name="name" type="text" value="<%= escapeHtml(currentUserName) %>" required />
                  </div>
                  <div class="member-form-group">
                    <label for="profile-password">新密碼</label>
                    <input id="profile-password" name="password" type="password" placeholder="不修改密碼可留空" />
                  </div>
                  <button type="submit" class="btn primary-btn member-submit-btn">儲存會員資料</button>
                </form>
              </section>

              <section class="member-panel" data-panel="orders">
                <h2>訂單紀錄</h2>
                <div class="order-tabs" role="tablist" aria-label="訂單狀態">
                  <button class="order-tab active" type="button" data-order-tab="all">全部</button>
                  <button class="order-tab" type="button" data-order-tab="pay">待處理</button>
                  <button class="order-tab" type="button" data-order-tab="done">已完成</button>
                  <button class="order-tab" type="button" data-order-tab="cancel">已取消</button>
                </div>

                <div class="order-panel" id="orderPanel">
                  <%
                    int orderCount = 0;
                    try {
                      Class.forName("com.mysql.cj.jdbc.Driver");
                      try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword)) {
                        String orderSql =
                          "SELECT order_id, pickup_date, pickup_time, payment_method, total_amount, status, created_at " +
                          "FROM orders WHERE user_id = ? ORDER BY created_at DESC";
                        try (PreparedStatement orderStmt = conn.prepareStatement(orderSql)) {
                          orderStmt.setInt(1, currentUserId);
                          try (ResultSet rs = orderStmt.executeQuery()) {
                            while (rs.next()) {
                              orderCount++;
                  %>
                  <div class="checkout-summary-item">
                    <div class="checkout-summary-item-main">
                      <div class="checkout-summary-item-name">
                        訂單 #<%= rs.getInt("order_id") %> - <%= escapeHtml(rs.getString("status")) %>
                      </div>
                      <div class="checkout-summary-item-options">
                        取餐：<%= rs.getDate("pickup_date") %> <%= rs.getTime("pickup_time") %> /
                        付款：<%= escapeHtml(rs.getString("payment_method")) %> /
                        建立：<%= rs.getTimestamp("created_at") %>
                      </div>
                    </div>
                    <div class="checkout-summary-item-total">$<%= rs.getBigDecimal("total_amount").intValue() %></div>
                  </div>
                  <%
                            }
                          }
                        }
                      }
                    } catch (Exception ex) {
                  %>
                  <div class="order-empty">
                    <p class="order-empty-title">訂單讀取失敗：<%= escapeHtml(ex.getMessage()) %></p>
                  </div>
                  <%
                    }
                    if (orderCount == 0) {
                  %>
                  <div class="order-empty">
                    <div class="order-empty-illus" aria-hidden="true">單</div>
                    <p class="order-empty-title">目前尚未有訂單</p>
                  </div>
                  <% } %>
                </div>
              </section>

              <section class="member-panel" data-panel="notice">
                <h2>通知中心</h2>
                <div class="order-empty">
                  <p class="order-empty-title">目前沒有新的通知</p>
                </div>
              </section>

              <section class="member-panel" data-panel="coupon">
                <h2>優惠券</h2>
                <div class="order-empty">
                  <p class="order-empty-title">目前沒有可使用的優惠券</p>
                </div>
              </section>

              <section class="member-panel" data-panel="points">
                <h2>會員點數</h2>
                <div class="checkout-summary-item">
                  <div class="checkout-summary-item-main">
                    <div class="checkout-summary-item-name">目前點數</div>
                    <div class="checkout-summary-item-options">訂單完成後可依規則累積點數</div>
                  </div>
                  <div class="checkout-summary-item-total">0 點</div>
                </div>
              </section>

              <section class="member-panel" data-panel="refund">
                <h2>退貨退款</h2>
                <div class="order-empty">
                  <p class="order-empty-title">目前沒有退貨退款紀錄</p>
                </div>
              </section>
            </section>
          </div>
        </section>
        <% } %>
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

    <button
      type="button"
      id="cartBtn"
      class="fab cart-floating"
      aria-label="購物車"
    >
      🛒
      <span class="cart-count-badge" id="cartCount">0</span>
    </button>
  </body>
</html>
