
// =====================================
// TOKOCPS CONFIGURATION
// =====================================

const ADMIN_1_WA = "085864582161";
const ADMIN_2_WA = "085765732905";

const ADMINS = {
  1: {
    name: "Booopa",
    phone: ADMIN_1_WA,
    qris: "qris-booopa.png"
  },
  2: {
    name: "Wholesale",
    phone: ADMIN_2_WA,
    qris: "qris-wholesale.png"
  }
};

const PRICE = {
  BGL: { buy: 1100, sell: 950 },
  BLACK: { buy: 105000, sell: 97000 }
};

let transaction = "Beli";
let selectedAdmin = 1;
let qty = { BGL: 0, BLACK: 0 };
let currentProduct = "BGL";
let currentOrder = null;


// =====================================
// BASIC FUNCTIONS
// =====================================

function rupiah(number) {
  return "Rp" + Number(number).toLocaleString("id-ID");
}

function getTotal() {
  const mode = transaction === "Beli" ? "buy" : "sell";

  return (
    qty.BGL * PRICE.BGL[mode] +
    qty.BLACK * PRICE.BLACK[mode]
  );
}

function getOrders() {
  try {
    const data = JSON.parse(localStorage.getItem("tokocps_orders") || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem("tokocps_orders", JSON.stringify(orders));
}


// =====================================
// CHECKOUT
// =====================================

function openOrder(product) {
  currentProduct = product;
  transaction = "Beli";

  qty = {
    BGL: product === "BGL" ? 1 : 0,
    BLACK: product === "BLACK" ? 1 : 0
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

function closeOrder() {
  document.getElementById("orderOverlay").classList.remove("show");
  document.body.style.overflow = "";
}

function setTransaction(type) {
  transaction = type;

  document.getElementById("buyChoice").classList.toggle("active", type === "Beli");
  document.getElementById("sellChoice").classList.toggle("active", type === "Jual");

  document.getElementById("sellFields").style.display =
    type === "Jual" ? "block" : "none";

  updateSummary();
}

function changeQty(item, amount) {
  qty[item] = Math.max(0, Math.min(999, qty[item] + amount));
  updateSummary();
}

function selectAdmin(id) {
  selectedAdmin = id;

  document.getElementById("admin1").classList.toggle("active", id === 1);
  document.getElementById("admin2").classList.toggle("active", id === 2);

  updateSummary();
}

function updateSummary() {
  const mode = transaction === "Beli" ? "buy" : "sell";

  document.getElementById("qtyBGL").textContent = qty.BGL;
  document.getElementById("qtyBLACK").textContent = qty.BLACK;

  document.getElementById("priceBGL").textContent =
    rupiah(PRICE.BGL[mode]) + " / item";

  document.getElementById("priceBLACK").textContent =
    rupiah(PRICE.BLACK[mode]) + " / item";

  document.getElementById("sumType").textContent = transaction;
  document.getElementById("sumBGL").textContent = qty.BGL;
  document.getElementById("sumBLACK").textContent = qty.BLACK;
  document.getElementById("sumAdmin").textContent = ADMINS[selectedAdmin].name;
  document.getElementById("sumTotal").textContent = rupiah(getTotal());
}


// =====================================
// SUBMIT ORDER
// =====================================

function submitOrder() {
  if (qty.BGL + qty.BLACK === 0) {
    alert("Pilih minimal satu item.");
    return;
  }

  const world = document.getElementById("world").value.trim();
  const owner = document.getElementById("owner").value.trim();

  if (transaction === "Jual" && (!world || !owner)) {
    alert("Isi world dan nama owner terlebih dahulu.");
    return;
  }

  const admin = ADMINS[selectedAdmin];
  const total = getTotal();

  const id = "CPS-" + Date.now().toString(36).toUpperCase();

  currentOrder = {
    id,
    createdAt: new Date().toISOString(),
    transaction,
    qty: { ...qty },
    adminId: selectedAdmin,
    admin: admin.name,
    total,
    world,
    owner,
    status: "Menunggu Pembayaran"
  };

  const orders = getOrders();
  orders.unshift(currentOrder);
  saveOrders(orders);

  document.getElementById("checkoutForm").style.display = "none";
  document.getElementById("paymentPage").style.display = "block";

  document.getElementById("sheetTitle").textContent = "Pembayaran QRIS";
  document.getElementById("paymentAmount").textContent = rupiah(total);

  document.getElementById("paymentOrderId").textContent =
    "ID Pesanan: " + id + " • Admin: " + admin.name;

  document.getElementById("qrisImage").src = admin.qris;
  document.getElementById("qrisImage").alt = "QRIS " + admin.name;
}


// =====================================
// PAYMENT & WHATSAPP
// =====================================

function backToCheckout() {
  document.getElementById("checkoutForm").style.display = "block";
  document.getElementById("paymentPage").style.display = "none";
  document.getElementById("sheetTitle").textContent = "Checkout TOKOCPS";
}

function sendProof() {
  if (!currentOrder) {
    alert("Pesanan tidak ditemukan.");
    return;
  }

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
  const found = orders.find(order => order.id === currentOrder.id);

  if (found) {
    found.status = "Menunggu Konfirmasi";
    saveOrders(orders);
  }

  const phone = "62" + admin.phone.replace(/^0/, "").replace(/\D/g, "");
  const url = "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);

  window.open(url, "_blank");
}


// =====================================
// ORDER HISTORY
// =====================================

function showHistory() {
  closeOrder();

  document.getElementById("historyOverlay").classList.add("show");
  document.body.style.overflow = "hidden";

  const orders = getOrders();
  const list = document.getElementById("historyList");

  if (!orders.length) {
    list.innerHTML =
      "<p style='color:#c6d9ff;text-align:center;padding:25px'>Belum ada pesanan.</p>";
    return;
  }

  list.innerHTML = orders.map(order => {
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

function updateStatus(id, status) {
  const orders = getOrders();
  const order = orders.find(item => item.id === id);

  if (order) {
    order.status = status;
    saveOrders(orders);
    showHistory();
  }
}

function closeHistory() {
  document.getElementById("historyOverlay").classList.remove("show");
  document.body.style.overflow = "";
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}


// =====================================
// LOADING SCREEN
// =====================================

window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("loadingScreen");
    if (loader) loader.classList.add("hide");
  }, 650);
});


// =====================================
// FLOATING PARTICLES
// =====================================

(function createParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  const amount = window.innerWidth < 600 ? 18 : 32;

  for (let i = 0; i < amount; i++) {
    const particle = document.createElement("span");
    particle.className = "particle";

    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = (Math.random() * 100 + 100) + "%";
    particle.style.animationDuration = (8 + Math.random() * 13) + "s";
    particle.style.animationDelay = (-Math.random() * 18) + "s";
    particle.style.opacity = 0.3 + Math.random() * 0.6;

    container.appendChild(particle);
  }
})();


// =====================================
// CUSTOM CURSOR & LIGHT TRAIL
// =====================================

(function setupCursor() {
  const cursor = document.getElementById("cursorGlow");

  if (!cursor || !window.matchMedia("(pointer:fine)").matches) return;

  let lastTrail = 0;

  document.addEventListener("mousemove", event => {
    cursor.style.left = event.clientX + "px";
    cursor.style.top = event.clientY + "px";
    cursor.classList.add("active");

    const now = Date.now();

    if (now - lastTrail > 38) {
      lastTrail = now;

      const trail = document.createElement("span");
      trail.className = "cursor-trail";
      trail.style.left = event.clientX + "px";
      trail.style.top = event.clientY + "px";

      document.body.appendChild(trail);
      setTimeout(() => trail.remove(), 700);
    }
  });

  document.addEventListener("mouseout", event => {
    if (!event.relatedTarget) cursor.classList.remove("active");
  });

  document.addEventListener("mouseover", event => {
    if (event.target.closest("button,a,.developer-card")) {
      cursor.classList.add("hover");
    } else {
      cursor.classList.remove("hover");
    }
  });

  document.addEventListener("mousedown", () => {
    cursor.style.transform = "translate(-50%,-50%) scale(.75)";
  });

  document.addEventListener("mouseup", () => {
    cursor.style.transform = "translate(-50%,-50%) scale(1)";
  });
})();


// =====================================
// PRODUCT 3D TILT
// =====================================

(function setupTilt() {
  if (!window.matchMedia("(pointer:fine)").matches) return;

  const cards = document.querySelectorAll(".tilt-card");

  cards.forEach(card => {
    card.addEventListener("mousemove", event => {
      const rect = card.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const rotateY = ((x / rect.width) - 0.5) * 8;
      const rotateX = ((0.5 - y / rect.height) * 8);

      card.style.transform =
        `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
})();


// =====================================
// KEYBOARD
// =====================================

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeOrder();
    closeHistory();
  }
});
