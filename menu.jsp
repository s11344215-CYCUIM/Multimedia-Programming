<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="java.sql.*" %>
<%@ page import="java.math.BigDecimal" %>
<%@ page import="java.util.*" %>
<%!
  private static class RatingEntry {
    int total = 0;
    int count = 0;
    Map<String, Integer> userRatings = new LinkedHashMap<>();
    Map<String, String> userComments = new LinkedHashMap<>();
    Map<String, String> userCommentDates = new LinkedHashMap<>();
  }

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

  private String trimParam(String value) {
    return value == null ? "" : value.trim();
  }

  private int parsePositiveInt(String value) {
    try {
      int parsed = Integer.parseInt(value);
      return parsed > 0 ? parsed : 0;
    } catch (Exception ex) {
      return 0;
    }
  }

  private boolean productMatchesKeyword(String[] product, String keyword) {
    if (keyword == null || keyword.trim().isEmpty()) return true;
    String loweredKeyword = keyword.trim().toLowerCase();
    return product[1].toLowerCase().contains(loweredKeyword) ||
      product[2].toLowerCase().contains(loweredKeyword);
  }
%>
<%
  request.setCharacterEncoding("UTF-8");
  String keyword = request.getParameter("keyword");
  if (keyword == null) keyword = "";
  keyword = keyword.trim();

  final String dbServerUrl = "jdbc:mysql://127.0.0.1:3306/?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Taipei&useSSL=false&allowPublicKeyRetrieval=true";
  final String dbUrl = "jdbc:mysql://127.0.0.1:3306/drink_shop?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Taipei&useSSL=false&allowPublicKeyRetrieval=true";
  final String dbUser = "root";
  final String dbPassword = "1234";
  String currentUserName = (String) session.getAttribute("userName");
  String currentUserEmail = (String) session.getAttribute("userEmail");
  Integer currentUserId = (Integer) session.getAttribute("userId");
  boolean loggedIn = currentUserId != null;
  String[][] fallbackProducts = {
    { "1", "莓你不行", "草莓風味季節飲品。", "90", "100", "images/莓你不行.png" },
    { "2", "伯爵鮮奶茶", "伯爵茶香搭配鮮奶。", "60", "100", "images/伯爵鮮奶茶.png" },
    { "3", "焙韻厚奶", "焙茶香氣與厚奶口感。", "80", "100", "images/焙韻厚奶.png" },
    { "4", "百香QQ綠", "百香果綠茶搭配 QQ 配料。", "75", "100", "images/百香QQ綠.png" },
    { "5", "青韻綠茶", "清爽綠茶基本款。", "50", "100", "images/青韻綠茶.png" }
  };

  try {
    Class.forName("com.mysql.cj.jdbc.Driver");

    try (Connection serverConn = DriverManager.getConnection(dbServerUrl, dbUser, dbPassword);
         Statement serverStmt = serverConn.createStatement()) {
      serverStmt.executeUpdate(
        "CREATE DATABASE IF NOT EXISTS drink_shop " +
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
      );
    }

    try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword)) {
      try (Statement initStmt = conn.createStatement()) {
        initStmt.executeUpdate(
          "CREATE TABLE IF NOT EXISTS users (" +
          "user_id INT AUTO_INCREMENT PRIMARY KEY, " +
          "name VARCHAR(100) NOT NULL, " +
          "email VARCHAR(150) NOT NULL UNIQUE, " +
          "password VARCHAR(255) NOT NULL, " +
          "role VARCHAR(20) NOT NULL DEFAULT 'member', " +
          "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" +
          ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        initStmt.executeUpdate(
          "CREATE TABLE IF NOT EXISTS categories (" +
          "category_id INT AUTO_INCREMENT PRIMARY KEY, " +
          "name VARCHAR(50) NOT NULL UNIQUE" +
          ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        initStmt.executeUpdate(
          "CREATE TABLE IF NOT EXISTS products (" +
          "product_id INT AUTO_INCREMENT PRIMARY KEY, " +
          "category_id INT NOT NULL, " +
          "name VARCHAR(100) NOT NULL, " +
          "description TEXT, " +
          "price DECIMAL(10, 2) NOT NULL, " +
          "stock INT NOT NULL DEFAULT 0, " +
          "image_url VARCHAR(255), " +
          "is_active TINYINT(1) NOT NULL DEFAULT 1, " +
          "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
          "CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id)" +
          ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        initStmt.executeUpdate(
          "CREATE TABLE IF NOT EXISTS comments (" +
          "comment_id INT AUTO_INCREMENT PRIMARY KEY, " +
          "product_id INT NOT NULL, " +
          "user_id INT NOT NULL, " +
          "rating TINYINT NULL, " +
          "content TEXT, " +
          "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
          "CONSTRAINT fk_comments_product FOREIGN KEY (product_id) REFERENCES products(product_id), " +
          "CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(user_id), " +
          "UNIQUE KEY uk_comments_product_user (product_id, user_id), " +
          "INDEX idx_comments_product_date (product_id, created_at)" +
          ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
      }

      try (Statement seedStmt = conn.createStatement()) {
        seedStmt.executeUpdate("INSERT IGNORE INTO categories (category_id, name) VALUES (1, '飲品'), (2, '周邊商品')");
        seedStmt.executeUpdate(
          "INSERT IGNORE INTO products (product_id, category_id, name, description, price, stock, image_url, is_active) VALUES " +
          "(1, 1, '莓你不行', '草莓風味季節飲品。', 90.00, 100, 'images/莓你不行.png', 1), " +
          "(2, 1, '伯爵鮮奶茶', '伯爵茶香搭配鮮奶。', 60.00, 100, 'images/伯爵鮮奶茶.png', 1), " +
          "(3, 1, '焙韻厚奶', '焙茶香氣與厚奶口感。', 80.00, 100, 'images/焙韻厚奶.png', 1), " +
          "(4, 1, '百香QQ綠', '百香果綠茶搭配 QQ 配料。', 75.00, 100, 'images/百香QQ綠.png', 1), " +
          "(5, 1, '青韻綠茶', '清爽綠茶基本款。', 50.00, 100, 'images/青韻綠茶.png', 1), " +
          "(6, 2, '環保杯', '品牌環保杯。', 799.00, 50, 'images/環保杯.png', 1), " +
          "(7, 2, '保冰袋', '品牌保冰袋。', 179.00, 50, 'images/保冰袋.png', 1), " +
          "(8, 2, '杯套', '品牌杯套。', 129.00, 50, 'images/杯套.png', 1)"
        );
      }
    }
  } catch (Exception ex) {
    // 商品列表下方會顯示正式的資料庫讀取錯誤，這裡只避免初始化中斷整頁。
  }

  if ("POST".equalsIgnoreCase(request.getMethod())) {
    String action = trimParam(request.getParameter("action"));

    if ("saveComment".equals(action) || "deleteComment".equals(action)) {
      if (!loggedIn) {
        response.sendRedirect("member.jsp");
        return;
      }

      int productId = parsePositiveInt(request.getParameter("product_id"));

      try {
        if (productId <= 0) {
          throw new Exception("商品資料不完整，請重新操作。");
        }

        Class.forName("com.mysql.cj.jdbc.Driver");

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword)) {
          if ("deleteComment".equals(action)) {
            String deleteSql = "DELETE FROM comments WHERE product_id = ? AND user_id = ?";
            try (PreparedStatement deleteStmt = conn.prepareStatement(deleteSql)) {
              deleteStmt.setInt(1, productId);
              deleteStmt.setInt(2, currentUserId);
              deleteStmt.executeUpdate();
            }
          } else {
            int rating = parsePositiveInt(request.getParameter("rating"));
            String content = trimParam(request.getParameter("content"));

            if (rating < 1 || rating > 5) {
              throw new Exception("請選擇 1 到 5 顆星。");
            }

            String updateSql =
              "UPDATE comments SET rating = ?, content = ?, created_at = CURRENT_TIMESTAMP " +
              "WHERE product_id = ? AND user_id = ?";
            try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
              updateStmt.setInt(1, rating);
              updateStmt.setString(2, content);
              updateStmt.setInt(3, productId);
              updateStmt.setInt(4, currentUserId);

              if (updateStmt.executeUpdate() == 0) {
                String insertSql = "INSERT INTO comments (product_id, user_id, rating, content) VALUES (?, ?, ?, ?)";
                try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                  insertStmt.setInt(1, productId);
                  insertStmt.setInt(2, currentUserId);
                  insertStmt.setInt(3, rating);
                  insertStmt.setString(4, content);
                  insertStmt.executeUpdate();
                }
              }
            }
          }
        }

        response.sendRedirect("menu.jsp#productCommentsBoard");
        return;
      } catch (Exception ex) {
        response.sendRedirect("menu.jsp?commentError=1#productCommentsBoard");
        return;
      }
    }
  }

  Map<String, RatingEntry> serverRatings = new LinkedHashMap<>();

  try {
    Class.forName("com.mysql.cj.jdbc.Driver");

    String commentsSql =
      "SELECT c.product_id, c.rating, c.content, c.created_at, u.email " +
      "FROM comments c " +
      "JOIN users u ON c.user_id = u.user_id " +
      "JOIN products p ON c.product_id = p.product_id " +
      "WHERE p.category_id = 1 AND p.is_active = 1 " +
      "ORDER BY c.created_at DESC, c.comment_id DESC";

    try (
      Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
      PreparedStatement stmt = conn.prepareStatement(commentsSql);
      ResultSet rs = stmt.executeQuery()
    ) {
      while (rs.next()) {
        int productId = rs.getInt("product_id");
        String drinkId = "drink" + productId;
        String email = rs.getString("email");
        if (email == null || email.trim().isEmpty()) continue;

        RatingEntry entry = serverRatings.get(drinkId);
        if (entry == null) {
          entry = new RatingEntry();
          serverRatings.put(drinkId, entry);
        }

        if (entry.userRatings.containsKey(email) || entry.userComments.containsKey(email)) {
          continue;
        }

        int rating = rs.getInt("rating");
        String content = trimParam(rs.getString("content"));
        Timestamp createdAt = rs.getTimestamp("created_at");

        if (rating > 0) {
          entry.userRatings.put(email, rating);
          entry.total += rating;
          entry.count += 1;
        }
        if (!content.isEmpty()) {
          entry.userComments.put(email, content);
        }
        entry.userCommentDates.put(email, createdAt == null ? "" : createdAt.toString());
      }
    }
  } catch (Exception ex) {
    serverRatings.clear();
  }

  StringBuilder serverRatingsJson = new StringBuilder("{");
  boolean firstDrink = true;
  for (Map.Entry<String, RatingEntry> ratingMapEntry : serverRatings.entrySet()) {
    if (!firstDrink) serverRatingsJson.append(",");
    firstDrink = false;

    String drinkId = ratingMapEntry.getKey();
    RatingEntry entry = ratingMapEntry.getValue();
    serverRatingsJson
      .append("\"").append(escapeJs(drinkId)).append("\":{")
      .append("\"total\":").append(entry.total).append(",")
      .append("\"count\":").append(entry.count).append(",")
      .append("\"userRatings\":{");

    boolean firstUser = true;
    for (Map.Entry<String, Integer> userRating : entry.userRatings.entrySet()) {
      if (!firstUser) serverRatingsJson.append(",");
      firstUser = false;
      serverRatingsJson
        .append("\"").append(escapeJs(userRating.getKey())).append("\":")
        .append(userRating.getValue());
    }

    serverRatingsJson.append("},\"userComments\":{");
    firstUser = true;
    for (Map.Entry<String, String> userComment : entry.userComments.entrySet()) {
      if (!firstUser) serverRatingsJson.append(",");
      firstUser = false;
      serverRatingsJson
        .append("\"").append(escapeJs(userComment.getKey())).append("\":\"")
        .append(escapeJs(userComment.getValue())).append("\"");
    }

    serverRatingsJson.append("},\"userCommentDates\":{");
    firstUser = true;
    for (Map.Entry<String, String> userDate : entry.userCommentDates.entrySet()) {
      if (!firstUser) serverRatingsJson.append(",");
      firstUser = false;
      serverRatingsJson
        .append("\"").append(escapeJs(userDate.getKey())).append("\":\"")
        .append(escapeJs(userDate.getValue())).append("\"");
    }

    serverRatingsJson.append("}}");
  }
  serverRatingsJson.append("}");
%><!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <!-- 網頁分頁名稱和logo圖示 -->
    <title>飲品菜單 - 檢茶官</title>
    <link rel="icon" href="images/logo.png" type="image/png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <link rel="stylesheet" href="style.css" />
    <script>
      window.CURRENT_USER = <%= loggedIn ? ("{name: \"" + escapeJs(currentUserName) + "\", email: \"" + escapeJs(currentUserEmail) + "\"}") : "null" %>;
      window.SERVER_RATINGS = <%= serverRatingsJson.toString() %>;
    </script>
    <script src="script.js?v=20260512-3" defer></script>
  </head>

  <body>
    <header class="site-header">
      <div class="container nav-container">
        <!-- 主畫面左上Logo跟檢茶官品牌名稱 -->
        <a href="index.jsp#adSlider" class="logo">
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
            <a href="index.jsp#adSlider">首頁</a>
            <a href="index.jsp#limited">季節新品</a>
            <a href="index.jsp#story">品牌故事</a>
            <a href="index.jsp#craftsmen">匠心職人</a>
            <a href="menu.jsp">飲品菜單</a>
            <a href="merch.jsp">周邊商品</a>
            <a href="index.jsp#about">關於我們</a>
            <a href="member.jsp">會員專區</a>
          </nav>
        </div>
      </div>
    </header>

    <main class="section menu-page">
      <div class="container">
        <h1 class="page-title">飲品菜單</h1>

        <!-- 熱銷排行榜 -->
        <section class="menu-ranking">
          <h2 class="menu-section-title">人氣排行</h2>

          <!-- 輪盤 -->
          <div
            class="ranking-wheel"
            id="rankingWheel"
            aria-label="人氣排行輪盤"
          >
            <article class="rank-card">
              <img
                src="images/焙韻厚奶.png"
                alt="焙韻厚奶"
                class="menu-drink-image-img"
              />
              <span class="rank-tag">Top 1</span>
              <h3 class="rank-name">焙韻厚奶</h3>
              <p class="rank-desc">
                深焙茶香直接衝出來搭配濃到不行的奶香一喝就愛上
              </p>
            </article>

            <article class="rank-card">
              <img
                src="images/百香QQ綠.png"
                alt="百香QQ綠"
                class="menu-drink-image-img"
              />
              <span class="rank-tag">Top 2</span>
              <h3 class="rank-name">百香QQ綠</h3>
              <p class="rank-desc">
                百香果酸甜大爆發配上清爽綠茶和QQ口感超級解渴
              </p>
            </article>

            <article class="rank-card">
              <img
                src="images/伯爵鮮奶茶.png"
                alt="伯爵鮮奶茶"
                class="menu-drink-image-img"
              />
              <span class="rank-tag">Top 3</span>
              <h3 class="rank-name">伯爵鮮奶茶</h3>
              <p class="rank-desc">
                伯爵茶佛手柑香氣超明顯加上鮮奶順到可以一直喝
              </p>
            </article>
          </div>
        </section>

        <div class="menu-divider"></div>

        <!-- 全部飲品列表 -->
        <section class="menu-all" id="menu-all">
          <h2 class="menu-section-title">全部飲品</h2>

          <form class="member-form" method="get" action="menu.jsp" style="margin: 0 0 1.5rem;">
            <div class="member-form-group">
              <label for="keyword">商品搜尋</label>
              <input
                type="search"
                id="keyword"
                name="keyword"
                value="<%= escapeHtml(keyword) %>"
                placeholder="輸入飲品名稱或介紹關鍵字"
              />
            </div>
            <button type="submit" class="btn primary-btn">搜尋</button>
            <% if (!keyword.isEmpty()) { %>
              <a href="menu.jsp#menu-all" class="btn secondary-btn">清除搜尋</a>
            <% } %>
          </form>

          <div class="menu-drink-list">
            <%
              String productSql =
                "SELECT product_id, name, description, price, stock, image_url " +
                "FROM products " +
                "WHERE category_id = 1 AND is_active = 1";

              if (!keyword.isEmpty()) {
                productSql += " AND (name COLLATE utf8mb4_unicode_ci LIKE ? OR description COLLATE utf8mb4_unicode_ci LIKE ?)";
              }

              productSql += " ORDER BY product_id";

              boolean hasProducts = false;

              try {
                Class.forName("com.mysql.cj.jdbc.Driver");

                try (
                  Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
                  PreparedStatement stmt = conn.prepareStatement(productSql)
                ) {
                  if (!keyword.isEmpty()) {
                    String likeKeyword = "%" + keyword + "%";
                    stmt.setString(1, likeKeyword);
                    stmt.setString(2, likeKeyword);
                  }

                  try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                      hasProducts = true;
                      int productId = rs.getInt("product_id");
                      String drinkId = "drink" + productId;
                      String productName = rs.getString("name");
                      String description = rs.getString("description");
                      String imageUrl = rs.getString("image_url");
                      BigDecimal priceValue = rs.getBigDecimal("price");
                      int price = priceValue == null ? 0 : priceValue.intValue();
                      int stock = rs.getInt("stock");
            %>
            <div class="menu-drink-row">
              <div class="menu-drink-image">
                <img
                  src="<%= escapeHtml(imageUrl) %>"
                  alt="<%= escapeHtml(productName) %>"
                  class="menu-drink-image-img"
                />
              </div>
              <div class="menu-drink-text">
                <div class="menu-drink-header">
                  <h3><%= escapeHtml(productName) %></h3>
                  <button
                    class="menu-add-btn"
                    type="button"
                    aria-label="加入<%= escapeHtml(productName) %>"
                    data-drink-id="<%= escapeHtml(drinkId) %>"
                    data-product-id="<%= productId %>"
                    data-drink-name="<%= escapeHtml(productName) %>"
                    data-drink-price="<%= price %>"
                    <%= stock <= 0 ? "disabled" : "" %>
                  >
                    ＋
                  </button>
                </div>
                <p><%= escapeHtml(description) %></p>
                <p class="menu-drink-meta">價格：$<%= price %>　庫存：<%= stock %></p>
                <div class="drink-rating" data-drink-id="<%= escapeHtml(drinkId) %>" data-product-id="<%= productId %>">
                  <div class="rating-stars">
                    <span class="rating-star" data-star="1">★</span>
                    <span class="rating-star" data-star="2">★</span>
                    <span class="rating-star" data-star="3">★</span>
                    <span class="rating-star" data-star="4">★</span>
                    <span class="rating-star" data-star="5">★</span>
                  </div>
                  <span class="rating-text" data-rating-text>尚未評分</span>
                  <p
                    class="my-rating-comment"
                    data-my-comment
                    style="display: none"
                  ></p>
                </div>
              </div>
            </div>
            <%
                    }
                  }
                }
              } catch (Exception ex) {
              }

              if (!hasProducts) {
                boolean hasFallbackProducts = false;

                for (String[] product : fallbackProducts) {
                  if (!productMatchesKeyword(product, keyword)) continue;
                  hasFallbackProducts = true;

                  int productId = parsePositiveInt(product[0]);
                  String drinkId = "drink" + productId;
                  String productName = product[1];
                  String description = product[2];
                  int price = parsePositiveInt(product[3]);
                  int stock = parsePositiveInt(product[4]);
                  String imageUrl = product[5];
            %>
            <div class="menu-drink-row">
              <div class="menu-drink-image">
                <img
                  src="<%= escapeHtml(imageUrl) %>"
                  alt="<%= escapeHtml(productName) %>"
                  class="menu-drink-image-img"
                />
              </div>
              <div class="menu-drink-text">
                <div class="menu-drink-header">
                  <h3><%= escapeHtml(productName) %></h3>
                  <button
                    class="menu-add-btn"
                    type="button"
                    aria-label="加入<%= escapeHtml(productName) %>"
                    data-drink-id="<%= escapeHtml(drinkId) %>"
                    data-product-id="<%= productId %>"
                    data-drink-name="<%= escapeHtml(productName) %>"
                    data-drink-price="<%= price %>"
                    <%= stock <= 0 ? "disabled" : "" %>
                  >
                    ＋
                  </button>
                </div>
                <p><%= escapeHtml(description) %></p>
                <p class="menu-drink-meta">價格：$<%= price %>　庫存：<%= stock %></p>
                <div class="drink-rating" data-drink-id="<%= escapeHtml(drinkId) %>" data-product-id="<%= productId %>">
                  <div class="rating-stars">
                    <span class="rating-star" data-star="1">★</span>
                    <span class="rating-star" data-star="2">★</span>
                    <span class="rating-star" data-star="3">★</span>
                    <span class="rating-star" data-star="4">★</span>
                    <span class="rating-star" data-star="5">★</span>
                  </div>
                  <span class="rating-text" data-rating-text>尚未評分</span>
                  <p
                    class="my-rating-comment"
                    data-my-comment
                    style="display: none"
                  ></p>
                </div>
              </div>
            </div>
            <%
                }

                if (!hasFallbackProducts) {
            %>
              <div class="cart-empty-message">
                沒有找到符合條件的商品。
              </div>
            <%
                }
              }
            %>          </div>

          <section class="product-comments-board" id="productCommentsBoard" aria-label="顧客留言">
            <div class="product-comments-head">
              <div>
                <p class="section-tag">REVIEWS</p>
                <h2 class="menu-section-title">顧客留言</h2>
                <p class="product-comments-sub">選擇已購買或想看的產品，最新留言會排在最左邊。</p>
              </div>
              <a href="checkout.jsp" class="btn secondary-btn">查看購物車結帳</a>
            </div>
            <% if ("1".equals(request.getParameter("commentError"))) { %>
              <p class="product-comments-alert">留言儲存失敗，請確認資料庫連線後再試一次。</p>
            <% } %>
            <div class="product-comment-filters" id="productCommentFilters"></div>
            <div class="product-comments-list" id="productCommentsList"></div>
          </section>
        </section>
      </div>
    </main>

    <!-- 單一共用的訂購彈窗（點每個＋都用這一個） -->
    <div
      class="order-modal-backdrop"
      id="orderModalBackdrop"
      aria-hidden="true"
    >
      <div class="order-modal">
        <article
          class="drink-card modal-drink-card"
          data-id=""
          data-name=""
          data-price="60"
        >
          <button
            type="button"
            class="order-modal-close"
            id="orderModalClose"
            aria-label="關閉"
          >
            ×
          </button>

          <h2 class="drink-name" id="modalDrinkName">飲料名稱</h2>
          <p class="drink-desc" id="modalDrinkDesc">簡短描述這杯飲料的特色</p>
          <p class="drink-price" id="modalDrinkPrice">價格：$60</p>

          <div class="drink-options">
            <!-- 大小 -->
            <div class="option-group">
              <span class="option-label">大小</span>
              <select class="drink-size">
                <option value="中杯">中杯</option>
                <option value="大杯（+$10）">大杯（+$10）</option>
              </select>
            </div>

            <!-- 甜度 -->
            <div class="option-group">
              <span class="option-label">甜度</span>
              <div class="option-slider">
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value="2"
                  class="drink-sugar-range"
                />
                <div class="slider-labels">
                  <span>無糖</span>
                  <span>微糖</span>
                  <span>半糖</span>
                  <span>正常糖</span>
                </div>
              </div>
            </div>

            <!-- 冰塊 -->
            <div class="option-group">
              <span class="option-label">冰塊</span>
              <div class="option-slider">
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value="3"
                  class="drink-ice-range"
                />
                <div class="slider-labels">
                  <span>去冰</span>
                  <span>微冰</span>
                  <span>少冰</span>
                  <span>正常冰</span>
                  <span>熱飲</span>
                </div>
              </div>
            </div>

            <!-- 加料 -->
            <div class="option-group option-toppings">
              <span class="option-label">加料（每項 +10）</span>
              <div class="toppings-row">
                <label>
                  <input
                    type="checkbox"
                    class="drink-topping"
                    data-label="珍珠"
                  />
                  珍珠 +10
                </label>
                <label>
                  <input
                    type="checkbox"
                    class="drink-topping"
                    data-label="椰果"
                  />
                  椰果 +10
                </label>
                <label>
                  <input
                    type="checkbox"
                    class="drink-topping"
                    data-label="茶凍"
                  />
                  茶凍 +10
                </label>
                <label>
                  <input
                    type="checkbox"
                    class="drink-topping"
                    data-label="粉粿"
                  />
                  粉粿 +10
                </label>
              </div>
            </div>

            <!-- 備註 -->
            <div class="option-group">
              <span class="option-label">備註</span>
              <textarea
                class="drink-note"
                placeholder="例如：去冰、分開裝、不要塑膠袋…"
              ></textarea>
            </div>
          </div>

          <button class="btn primary-btn drink-add-btn" data-add-to-cart>
            加入購物車
          </button>
        </article>
      </div>
    </div>

    <!-- 評分彈窗 -->
    <div
      class="rating-modal-backdrop"
      id="ratingModalBackdrop"
      aria-hidden="true"
    >
      <div class="rating-modal">
        <article class="rating-card">
          <button
            type="button"
            class="rating-modal-close"
            id="ratingModalClose"
            aria-label="關閉"
          >
            ×
          </button>

          <h2 class="rating-modal-title" id="ratingModalDrinkName">
            為這杯飲料評分
          </h2>
          <p class="rating-modal-sub" id="ratingModalHint">
            留下你對這杯飲料的想法
          </p>

          <!-- 星星評分 -->
          <div class="rating-modal-stars" id="ratingModalStars">
            <span class="rating-star" data-star="1">★</span>
            <span class="rating-star" data-star="2">★</span>
            <span class="rating-star" data-star="3">★</span>
            <span class="rating-star" data-star="4">★</span>
            <span class="rating-star" data-star="5">★</span>
          </div>

          <!-- 評論文字 -->
          <textarea
            id="ratingModalComment"
            class="rating-modal-comment"
            name="content"
            placeholder="說說你的想法"
          ></textarea>

          <form id="ratingServerForm" method="post" action="menu.jsp#productCommentsBoard">
            <input type="hidden" name="action" id="ratingServerAction" value="saveComment" />
            <input type="hidden" name="product_id" id="ratingServerProductId" value="" />
            <input type="hidden" name="rating" id="ratingServerRating" value="" />
            <input type="hidden" name="content" id="ratingServerContent" value="" />
          </form>

          <div class="rating-modal-actions">
            <button
              type="button"
              class="btn secondary-btn"
              id="ratingModalDelete"
            >
              取消評論
            </button>
            <button type="button" class="btn primary-btn" id="ratingModalSave">
              送出評分
            </button>
          </div>

          <p class="rating-modal-note" id="ratingModalStatus"></p>
          <!-- 大家的評論 -->
          <section class="rating-comments">
            <div class="rating-comments-head">
              <h4>大家的評論</h4>
              <span id="ratingModalCommentsCount">0</span>
            </div>

            <div id="ratingModalCommentsList" class="rating-comments-list"></div>
          </section>
          
        </article>
      </div>
    </div>

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
  </body>
</html>
