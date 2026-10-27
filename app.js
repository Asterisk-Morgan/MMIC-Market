// GASウェブアプリのURLをここに貼り付け
const GAS_ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbysDQVYLZdBEOX1_hhccetBfB6oJVDDvYfBHZub2StlykDbFls3j8odIFMuaGtjZrfr3g/exec";

// モック商品データ
const products = [
  {
    id: 1,
    name: "メダル",
    category: "Medal",
    price: 5000,
    desc: "直径40mmの高品質なメダル(非塗装)",
    images: [
      "メダル.JPG",
      "メダル_デザイン.png"
    ]
  },
  {
    id: 2,
    name: "カートリッジ",
    category: "Cartridge",
    price: 4500,
    desc: "高靭性・高耐久レジンを使用したジャストサイズのカートリッジ",
    images: [
      "カートリッジ.png",
      "プリント直後.PNG"
    ]
  },
  {
    id: 3,
    name: "メダル＆カートリッジセット",
    category: "Set",
    price: 9000,
    desc: "メダルとカートリッジのセット、500円お得になります",
    images: [
      "メダルインカートリッジ.jpeg",
      "カートリッジ(初期型-血錆).jpg"
    ]
  }
];

let cart = [];
let activeProduct = null;

// DOM取得
const productGrid = document.getElementById("product-grid");
const productModal = document.getElementById("product-modal");
const cartModal = document.getElementById("cart-modal");
const cartCount = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutForm = document.getElementById("checkout-form");

// 初期描画
function renderProducts(category = "all") {
  productGrid.innerHTML = "";
  const filtered = category === "all" ? products : products.filter(p => p.category === category);
  
  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.images[0]}" alt="${p.name}">
      <div class="card-info">
        <h3>${p.name}</h3>
        <p>¥${p.price.toLocaleString()}</p>
      </div>
    `;
    card.addEventListener("click", () => openProductModal(p));
    productGrid.appendChild(card);
  });
}

// フィルター切り替え
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    renderProducts(e.target.dataset.category);
  });
});

// 商品詳細モーダル
function openProductModal(product) {
  activeProduct = product;
  document.getElementById("modal-title").textContent = product.name;
  document.getElementById("modal-price").textContent = `¥${product.price.toLocaleString()}`;
  document.getElementById("modal-desc").textContent = product.desc;

  const mainImg = document.getElementById("modal-main-img");
  mainImg.src = product.images[0];

  const thumbs = document.getElementById("modal-thumbnails");
  thumbs.innerHTML = "";
  product.images.forEach((imgSrc, idx) => {
    const thumb = document.createElement("img");
    thumb.src = imgSrc;
    if (idx === 0) thumb.classList.add("selected");
    thumb.addEventListener("click", () => {
      mainImg.src = imgSrc;
      thumbs.querySelectorAll("img").forEach(i => i.classList.remove("selected"));
      thumb.classList.add("selected");
    });
    thumbs.appendChild(thumb);
  });

  productModal.classList.remove("hidden");
}

document.getElementById("modal-close").addEventListener("click", () => productModal.classList.add("hidden"));

// カートへ追加
document.getElementById("add-to-cart-btn").addEventListener("click", () => {
  if (activeProduct) {
    cart.push(activeProduct);
    updateCartUI();
    productModal.classList.add("hidden");
  }
});

// カート更新処理
function updateCartUI() {
  cartCount.textContent = cart.length;

  cartItems.innerHTML = "";
  if (cart.length === 0) {
    cartItems.innerHTML = "<p>カートは空です。</p>";
    cartTotal.textContent = "¥0";
    checkoutForm.classList.add("hidden"); // カートが空ならレジに進めない
    return;
  }

  let total = 0;
  cart.forEach((item, index) => {
    total += item.price;
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <span>${item.name}</span>
      <span>¥${item.price.toLocaleString()} <button onclick="removeItem(${index})">&times;</button></span>
    `;
    cartItems.appendChild(row);
  });

  cartTotal.textContent = `¥${total.toLocaleString()}`;
  checkoutForm.classList.remove("hidden"); // カートに商品がある場合のみ注文フォーム表示
}

window.removeItem = function(index) {
  cart.splice(index, 1);
  updateCartUI();
};

document.getElementById("view-cart-btn").addEventListener("click", () => cartModal.classList.remove("hidden"));
document.getElementById("cart-close").addEventListener("click", () => cartModal.classList.add("hidden"));

// 注文確定とGAS送信
checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("submit-order-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "送信中...";

  const orderPayload = {
    customerName: document.getElementById("cust-name").value,
    customerEmail: document.getElementById("cust-email").value,
    items: cart.map(item => ({ name: item.name, price: item.price })),
    totalAmount: cart.reduce((sum, item) => sum + item.price, 0)
  };

  try {
    // GASはCORSリダイレクトを挟むため、no-corsモードまたはプレーンテキストPOSTで送信
    await fetch(GAS_ENDPOINT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(orderPayload)
    });

    alert("ご注文ありがとうございます！確認メールを送信しました。");
    cart = [];
    updateCartUI();
    checkoutForm.reset();
    cartModal.classList.add("hidden");
  } catch (err) {
    alert("送信中にエラーが発生しました。コンソールをご確認ください。");
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "購入を確定する";
  }
});

// 初期化
renderProducts();