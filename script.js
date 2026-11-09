// =====================================
// TOKOCPS CONFIGURATION
// =====================================

const ADMIN_1_WA = "085864582161";
const ADMIN_2_WA = "085765732905";

const ADMINS = {
  1: { name:"Booopa", phone:ADMIN_1_WA, qris:"qris-booopa.png" },
  2: { name:"Wholesale", phone:ADMIN_2_WA, qris:"qris-wholesale.png" }
};

const PRICE = {
  BGL: { buy:1100, sell:950 },
  BLACK: { buy:105000, sell:97000 }
};

// GANTI USERNAME DAN PASSWORD INI
// Catatan: ini login lokal, bukan autentikasi server.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Tokocps2026!";

const PRODUCT_KEY = "tokocps_extra_products";
const ORDER_KEY = "tokocps_orders";

let transaction = "Beli";
let selectedAdmin = 1;
let qty = { BGL:0, BLACK:0 };
let currentProduct = "BGL";
let currentOrder = null;
let adminLoggedIn = false;
let selectedImageData = "";


// =====================================
// BASIC FUNCTIONS
// =====================================

function rupiah(number){
  return "Rp" + Number(number || 0).toLocaleString("id-ID");
}

function getTotal(){
  const mode = transaction === "Beli" ? "buy" : "sell";
  return qty.BGL * PRICE.BGL[mode] + qty.BLACK * PRICE.BLACK[mode];
}

function getOrders(){
  try {
    const data = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveOrders(orders){
  localStorage.setItem(ORDER_KEY,JSON.stringify(orders));
}

function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g,char=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  })[char]);
}


// =====================================
// LOCAL MARKETPLACE PRODUCTS
// =====================================

function getProducts(){
  try {
    const data = JSON.parse(localStorage.getItem(PRODUCT_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveProducts(products){
  try {
    localStorage.setItem(PRODUCT_KEY,JSON.stringify(products));
    return true;
  } catch(error) {
    alert("Penyimpanan penuh. Gunakan foto yang lebih kecil.");
    return false;
  }
}

function renderMarketplace(){
  const grid = document.getElementById("marketGrid");
  const empty = document.getElementById("marketEmpty");
  if(!grid || !empty) return;

  const products = getProducts();

  empty.style.display = products.length ? "none" : "block";

  grid.innerHTML = products.map(product=>{
    const stock = Number(product.stock) || 0;

    return `
      <article class="market-product">
        <img class="market-product-image"
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}">

        <div class="market-product-name">${escapeHTML(product.name)}</div>
        <div class="market-product-description">${escapeHTML(product.description || "Produk TOKOCPS.")}</div>
        <div class="market-product-price">${rupiah(product.price)}</div>
        <div class="market-product-stock">
          ${stock > 0 ? "Stok tersedia: " + stock : "Stok habis"}
        </div>

        <button class="market-buy-button"
          ${stock <= 0 ? "disabled" : ""}
          onclick="buyExtraProduct('${escapeHTML(product.id)}')">
          ${stock > 0 ? "BELI SEKARANG ↗" : "STOK HABIS"}
        </button>
      </article>
    `;
  }).join("");
}

function buyExtraProduct(id){
  const product = getProducts().find(item=>item.id === id);
  if(!product) return alert("Produk tidak ditemukan.");

  if(Number(product.stock) <= 0){
    return alert("Maaf, stok produk sedang habis.");
  }

  const message = [
    "Halo admin TOKOCPS, saya ingin membeli produk.",
    "",
    "Produk: " + product.name,
    "Harga: " + rupiah(product.price),
    "Mohon info cara pembeliannya."
  ].join("\n");

  const phone = "62" + ADMIN_1_WA.replace(/^0/,"").replace(/\D/g,"");
  window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(message),"_blank");
}


// =====================================
// ADMIN LOGIN
// =====================================

function openAdminLogin(){
  document.getElementById("adminLoginOverlay").classList.add("show");
  document.body.style.overflow = "hidden";
  document.getElementById("adminLoginError").textContent = "";
}

function closeAdminLogin(){
  document.getElementById("adminLoginOverlay").classList.remove("show");
  document.body.style.overflow = "";
}

function adminLogin(){
  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;
  const error = document.getElementById("adminLoginError");

  if(username === ADMIN_USERNAME && password === ADMIN_PASSWORD){
    adminLoggedIn = true;
    document.getElementById("adminUsername").value = "";
    document.getElementById("adminPassword").value = "";
    error.textContent = "";
    closeAdminLogin();
    openAdminDashboard();
  } else {
    error.textContent = "Username atau password salah.";
  }
}

function openAdminDashboard(){
  if(!adminLoggedIn) return;

  document.getElementById("adminDashboard").classList.add("show");
  document.body.style.overflow = "hidden";
  renderAdminProducts();
}

function closeAdminDashboard(){
  document.getElementById("adminDashboard").classList.remove("show");
  document.body.style.overflow = "";
}

function adminLogout(){
  adminLoggedIn = false;
  resetProductForm();
  closeAdminDashboard();
}


// =====================================
// ADMIN PRODUCT FORM
// =====================================

const productImageInput = document.getElementById("productImage");

productImageInput.addEventListener("change",function(){
  const file = this.files && this.files[0];
  if(!file) return;

  if(!file.type.startsWith("image/")){
    alert("File harus berupa gambar.");
    this.value = "";
    return;
  }

  if(file.size > 5 * 1024 * 1024){
    alert("Ukuran foto maksimal 5 MB.");
    this.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function(event){
    const image = new Image();

    image.onload = function(){
      const maxSize = 700;
      const ratio = Math.min(1,maxSize / Math.max(image.width,image.height));
      const canvas = document.createElement("canvas");

      canvas.width = Math.round(image.width * ratio);
      canvas.height = Math.round(image.height * ratio);

      const context = canvas.getContext("2d");
      context.drawImage(image,0,0,canvas.width,canvas.height);

      selectedImageData = canvas.toDataURL("image/jpeg",0.78);

      const preview = document.getElementById("productPreview");
      preview.src = selectedImageData;
      preview.hidden = false;
    };

    image.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

document.getElementById("productForm").addEventListener("submit",function(event){
  event.preventDefault();

  if(!adminLoggedIn) return alert("Silakan login admin.");

  const id = document.getElementById("editProductId").value;
  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const description = document.getElementById("productDescription").value.trim();

  if(!name || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0){
    return alert("Periksa nama, harga, dan stok produk.");
  }

  const products = getProducts();
  const oldProduct = id ? products.find(item=>item.id === id) : null;
  const image = selectedImageData || (oldProduct && oldProduct.image);

  if(!image){
    return alert("Silakan upload foto produk terlebih dahulu.");
  }

  const product = {
    id: id || ("PROD-" + Date.now()),
    name,
    price,
    stock,
    description,
    image,
    updatedAt: new Date().toISOString()
  };

  if(id){
    const index = products.findIndex(item=>item.id === id);
    if(index < 0) return alert("Produk tidak ditemukan.");
    products[index] = product;
  } else {
    products.unshift(product);
  }

  if(!saveProducts(products)) return;

  resetProductForm();
  renderMarketplace();
  renderAdminProducts();

  alert(id ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.");
});

function resetProductForm(){
  const form = document.getElementById("productForm");
  if(form) form.reset();

  document.getElementById("editProductId").value = "";
  document.getElementById("productFormTitle").textContent = "Tambah Produk Baru";
  document.getElementById("saveProductButton").textContent = "SIMPAN PRODUK";

  selectedImageData = "";

  const preview = document.getElementById("productPreview");
  preview.src = "";
  preview.hidden = true;
}

function renderAdminProducts(){
  const list = document.getElementById("adminProductList");
  const count = document.getElementById("adminProductCount");
  if(!list || !count) return;

  const products = getProducts();
  count.textContent = products.length + " produk";

  if(!products.length){
    list.innerHTML = '<p class="order-note">Belum ada produk tambahan.</p>';
    return;
  }

  list.innerHTML = products.map(product=>`
    <div class="admin-product-item">
      <img src="${escapeHTML(product.image)}" alt="">
      <div class="admin-product-details">
        <b>${escapeHTML(product.name)}</b>
        <small>${rupiah(product.price)} • Stok: ${Number(product.stock)}</small>
      </div>
      <div class="admin-product-actions">
        <button class="edit-product-button" onclick="editProduct('${escapeHTML(product.id)}')">EDIT</button>
        <button class="delete-product-button" onclick="deleteProduct('${escapeHTML(product.id)}')">HAPUS</button>
      </div>
    </div>
  `).join("");
}

function editProduct(id){
  if(!adminLoggedIn) return;

  const product = getProducts().find(item=>item.id === id);
  if(!product) return alert("Produk tidak ditemukan.");

  document.getElementById("editProductId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productStock").value = product.stock;
  document.getElementById("productDescription").value = product.description || "";

  selectedImageData = product.image;

  const preview = document.getElementById("productPreview");
  preview.src = product.image;
  preview.hidden = false;

  document.getElementById("productFormTitle").textContent = "Edit Produk";
  document.getElementById("saveProductButton").textContent = "SIMPAN PERUBAHAN";

  document.getElementById("productFormTitle").scrollIntoView({
    behavior:"smooth",
    block:"center"
  });
}

function deleteProduct(id){
  if(!adminLoggedIn) return;

  if(!confirm("Yakin ingin menghapus produk ini?")) return;

  const products = getProducts().filter(item=>item.id !== id);

  if(!saveProducts(products)) return;

  renderMarketplace();
  renderAdminProducts();
  resetProductForm();
}


// =====================================
// CHECKOUT BGL / BLACK
// =====================================

function openOrder(product){
  currentProduct = product;
  transaction = "Beli";

  qty = {
    BGL:product === "BGL" ? 1 : 0,
    BLACK:product === "BLACK" ? 1 : 0
  };

  selectedAdmin = 1;

  document.getElementById("orderOverlay").classList.add("show");
  document.body.style.overflow = "hidden";

  document.getElementById("buyChoice").classList.add("active");
  document.getElementById("sellChoice").classList.remove("active");
  document.getElementById("sellFields").style.display = "none";

  document.getElementById("admin1").classList.add("active");
  document.getElementById("admin2").classList.remove("active");

  backToCheckout();
  updateSummary();
}

function closeOrder(){
  document.getElementById("orderOverlay").classList.remove("show");
  document.body.style.overflow = "";
}

function setTransaction(type){
  transaction = type;

  document.getElementById("buyChoice").classList.toggle("active",type === "Beli");
  document.getElementById("sellChoice").classList.toggle("active",type === "Jual");

  document.getElementById("sellFields").style.display =
    type === "Jual" ? "block" : "none";

  updateSummary();
}

function changeQty(item,amount){
  qty[item] = Math.max(0,Math.min(999,qty[item] + amount));
  updateSummary();
}

function selectAdmin(id){
  selectedAdmin = id;

  document.getElementById("admin1").classList.toggle("active",id === 1);
  document.getElementById("admin2").classList.toggle("active",id === 2);

  updateSummary();
}

function updateSummary(){
  const mode = transaction === "Beli" ? "buy" : "sell";

  document.getElementById("qtyBGL").textContent = qty.BGL;
  document.getElementById("qtyBLACK").textContent = qty.BLACK;

  document.getElementById("priceBGL").textContent = rupiah(PRICE.BGL[mode]) + " / item";
  document.getElementById("priceBLACK").textContent = rupiah(PRICE.BLACK[mode]) + " / item";

  document.getElementById("sumType").textContent = transaction;
  document.getElementById("sumBGL").textContent = qty.BGL;
  document.getElementById("sumBLACK").textContent = qty.BLACK;
  document.getElementById("sumAdmin").textContent = ADMINS[selectedAdmin].name;
  document.getElementById("sumTotal").textContent = rupiah(getTotal());
}


// =====================================
// SUBMIT ORDER
// =====================================

function submitOrder(){
  if(qty.BGL + qty.BLACK === 0){
    alert("Pilih minimal satu item.");
    return;
  }

  const world = document.getElementById("world").value.trim();
  const owner = document.getElementById("owner").value.trim();

  if(transaction === "Jual" && (!world || !owner)){
    alert("Isi world dan nama owner terlebih dahulu.");
    return;
  }

  const admin = ADMINS[selectedAdmin];
  const total = getTotal();
  const id = "CPS-" + Date.now().toString(36).toUpperCase();

  currentOrder = {
    id,
    createdAt:new Date().toISOString(),
    transaction,
    qty:{...qty},
    adminId:selectedAdmin,
    admin:admin.name,
    total,
    world,
    owner,
    status:"Menunggu Pembayaran"
  };

  const orders = getOrders();
  orders.unshift(currentOrder);
  saveOrders(orders);

  document.getElementById("checkoutForm").style.display = "none";
  document.getElementById("paymentPage").style.display = "block";
  document.getElementById("sheetTitle").textContent = "Pembayaran QRIS";
  document.getElementById("paymentAmount").textContent = rupiah(total);
  document.getElementById("paymentOrderId").textContent = "ID Pesanan: " + id + " • Admin: " + admin.name;
  document.getElementById("qrisImage").src = admin.qris;
  document.getElementById("qrisImage").alt = "QRIS " + admin.name;
}


// =====================================
// PAYMENT & WHATSAPP
// =====================================

function backToCheckout(){
  document.getElementById("checkoutForm").style.display = "block";
  document.getElementById("paymentPage").style.display = "none";
  document.getElementById("sheetTitle").textContent = "Checkout TOKOCPS";
}

function sendProof(){
  if(!currentOrder) return alert("Pesanan tidak ditemukan.");

  const admin = ADMINS[currentOrder.adminId];

  const message = [
    `Halo ${admin.name}, saya ingin konfirmasi pembayaran TOKOCPS.`,
    "",
    `ID Pesanan: ${currentOrder.id}`,
    `Transaksi: ${currentOrder.transaction}`,
    `BGL: ${currentOrder.qty.BGL}`,
    `BLACK: ${currentOrder.qty.BLACK}`,
    `Total: ${rupiah(currentOrder.total)}`,
    currentOrder.world ? `World: ${currentOrder.world}` : "",
    currentOrder.owner ? `Owner: ${currentOrder.owner}` : "",
    "",
    "Saya akan melampirkan bukti pembayaran di chat ini. Mohon dicek."
  ].filter(Boolean).join("\n");

  const orders = getOrders();
  const found = orders.find(order=>order.id === currentOrder.id);

  if(found){
    found.status = "Menunggu Konfirmasi";
    saveOrders(orders);
  }

  const phone = "62" + admin.phone.replace(/^0/,"").replace(/\D/g,"");
  window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(message),"_blank");
}


// =====================================
// ORDER HISTORY
// =====================================

function showHistory(){
  closeOrder();

  document.getElementById("historyOverlay").classList.add("show");
  document.body.style.overflow = "hidden";

  const orders = getOrders();
  const list = document.getElementById("historyList");

  if(!orders.length){
    list.innerHTML = "<p style='color:#c6d9ff;text-align:center;padding:25px'>Belum ada pesanan.</p>";
    return;
  }

  list.innerHTML = orders.map(order=>{
    const statusClass =
      order.status === "Sukses" ? "success" :
      order.status === "Ditolak" ? "rejected" : "";

    return `
      <div class="history-item">
        <b>${escapeHTML(order.id)}</b>
        <p>${escapeHTML(order.transaction)} • ${Number(order.qty.BGL)} BGL • ${Number(order.qty.BLACK)} BLACK</p>
        <p>Admin: ${escapeHTML(order.admin)}</p>
        <p>Total: <b>${rupiah(order.total)}</b></p>
        <span class="status ${statusClass}">${escapeHTML(order.status)}</span>
        <p style="margin-top:12px">Ubah status (lokal):</p>
        <select class="field-input" onchange="updateStatus('${escapeHTML(order.id)}',this.value)">
          <option ${order.status === "Menunggu Pembayaran" ? "selected" : ""}>Menunggu Pembayaran</option>
          <option ${order.status === "Menunggu Konfirmasi" ? "selected" : ""}>Menunggu Konfirmasi</option>
          <option ${order.status === "Sukses" ? "selected" : ""}>Sukses</option>
          <option ${order.status === "Ditolak" ? "selected" : ""}>Ditolak</option>
        </select>
      </div>
    `;
  }).join("");
}

function updateStatus(id,status){
  const orders = getOrders();
  const order = orders.find(item=>item.id === id);

  if(order){
    order.status = status;
    saveOrders(orders);
    showHistory();
  }
}

function closeHistory(){
  document.getElementById("historyOverlay").classList.remove("show");
  document.body.style.overflow = "";
}


// =====================================
// LOADING SCREEN
// =====================================

window.addEventListener("load",()=>{
  setTimeout(()=>{
    const loader = document.getElementById("loadingScreen");
    if(loader) loader.classList.add("hide");
  },650);
});


// =====================================
// FLOATING PARTICLES
// =====================================

(function createParticles(){
  const container = document.getElementById("particles");
  if(!container) return;

  const amount = window.innerWidth < 600 ? 18 : 32;

  for(let i=0;i<amount;i++){
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = (Math.random() * 100 + 100) + "%";
    particle.style.animationDuration = (8 + Math.random() * 13) + "s";
    particle.style.animationDelay = (-Math.random() * 18) + "s";
    container.appendChild(particle);
  }
})();


// =====================================
// CUSTOM CURSOR & LIGHT TRAIL
// =====================================

(function setupCursor(){
  const cursor = document.getElementById("cursorGlow");

  if(!cursor || !window.matchMedia("(pointer:fine)").matches) return;

  let lastTrail = 0;

  document.addEventListener("mousemove",event=>{
    cursor.style.left = event.clientX + "px";
    cursor.style.top = event.clientY + "px";
    cursor.classList.add("active");

    const now = Date.now();

    if(now - lastTrail > 38){
      lastTrail = now;

      const trail = document.createElement("span");
      trail.className = "cursor-trail";
      trail.style.left = event.clientX + "px";
      trail.style.top = event.clientY + "px";

      document.body.appendChild(trail);
      setTimeout(()=>trail.remove(),700);
    }
  });

  document.addEventListener("mouseout",event=>{
    if(!event.relatedTarget) cursor.classList.remove("active");
  });

  document.addEventListener("mouseover",event=>{
    if(event.target.closest("button,a,.developer-card")){
      cursor.classList.add("hover");
    } else {
      cursor.classList.remove("hover");
    }
  });

  document.addEventListener("mousedown",()=>{
    cursor.style.transform = "translate(-50%,-50%) scale(.75)";
  });

  document.addEventListener("mouseup",()=>{
    cursor.style.transform = "translate(-50%,-50%) scale(1)";
  });
})();


// =====================================
// PRODUCT 3D TILT
// =====================================

(function setupTilt(){
  if(!window.matchMedia("(pointer:fine)").matches) return;

  document.querySelectorAll(".tilt-card").forEach(card=>{
    card.addEventListener("mousemove",event=>{
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const rotateY = ((x / rect.width) - .5) * 8;
      const rotateX = ((.5 - y / rect.height) * 8);

      card.style.transform =
        `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });

    card.addEventListener("mouseleave",()=>{
      card.style.transform = "";
    });
  });
})();


// =====================================
// KEYBOARD & INITIALIZE
// =====================================

document.addEventListener("keydown",event=>{
  if(event.key === "Escape"){
    closeOrder();
    closeHistory();
    closeAdminLogin();
    closeAdminDashboard();
  }
});

document.getElementById("adminLoginOverlay").addEventListener("click",event=>{
  if(event.target.id === "adminLoginOverlay") closeAdminLogin();
});

document.getElementById("adminDashboard").addEventListener("click",event=>{
  if(event.target.id === "adminDashboard") closeAdminDashboard();
});

document.addEventListener("DOMContentLoaded",()=>{
  renderMarketplace();
});