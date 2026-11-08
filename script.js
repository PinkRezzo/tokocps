// ===================================
// KONFIGURASI TOKOCPS
// ===================================

const ADMIN_1_WA="085864582161";
const ADMIN_2_WA="085765732905";

const ADMINS={
 1:{name:"Booopa | TokoCPS.Store",phone:ADMIN_1_WA,online:true},
 2:{name:"WholeSale | TokoCPS.Store",phone:ADMIN_2_WA,online:true}
};

const PRICE_BGL_BUY=1100;
const PRICE_BGL_SELL=950;
const PRICE_BLACK_BUY=105000;
const PRICE_BLACK_SELL=97000;

const DISCORD_INVITE="https://discord.gg/Te7ZRPKQz";
document.getElementById("discordJoinButton").href=DISCORD_INVITE;

// FORMAT HARGA
function formatPrice(value){
 if(value>=1000)return (value/1000).toFixed(1)+"K";
 return value.toLocaleString("id-ID");
}

const ICON_CART='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 3.5h2.6l2.3 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5l1.6-6.6H6.1"/><circle cx="9.6" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>';
const ICON_SWAP='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/></svg>';

let transaction="Beli";
let qtyBGL=0;
let qtyBLACK=0;
let selectedAdmin=1;

function getPrices(){
 return transaction==="Beli"
 ?{bgl:PRICE_BGL_BUY,black:PRICE_BLACK_BUY}
 :{bgl:PRICE_BGL_SELL,black:PRICE_BLACK_SELL};
}

// ORDER
const overlay=document.getElementById("orderOverlay");
const sheet=document.getElementById("orderSheet");

function openOrder(product){
 overlay.classList.add("show");
 document.body.classList.add("sheet-open");

 if(product==="BGL"){qtyBGL=1;qtyBLACK=0}
 else if(product==="BLACK"){qtyBGL=0;qtyBLACK=1}
 else{qtyBGL=0;qtyBLACK=0}

 setTransaction("Beli");
 updateQuantity();
 updateSummary();
}

function closeOrder(){
 overlay.classList.remove("show");
 document.body.classList.remove("sheet-open");
 sheet.style.transform="";
}

overlay.addEventListener("click",e=>{
 if(e.target===overlay)closeOrder();
});

function setTransaction(type){
 transaction=type;
 document.getElementById("buyChoice").classList.toggle("active",type==="Beli");
 document.getElementById("sellChoice").classList.toggle("active",type==="Jual");

 document.getElementById("buyChoice").innerHTML=
 '<strong>'+ICON_CART+' Beli '+(type==="Beli"?'✓':'')+'</strong><span>Membeli BGL atau BLACK</span>';

 document.getElementById("sellChoice").innerHTML=
 '<strong>'+ICON_SWAP+' Jual '+(type==="Jual"?'✓':'')+'</strong><span>Menjual BGL atau BLACK</span>';

 document.getElementById("sellDetails").style.display=type==="Jual"?"block":"none";
 document.getElementById("paymentStep").textContent=type==="Jual"?"04":"03";
 document.getElementById("adminStep").textContent=type==="Jual"?"05":"04";
 updateSummary();
}

function changeQty(item,amount){
 if(item==="bgl")qtyBGL=Math.max(0,qtyBGL+amount);
 else qtyBLACK=Math.max(0,qtyBLACK+amount);
 updateQuantity();
 updateSummary();
}

function updateQuantity(){
 document.getElementById("qtyBGL").textContent=qtyBGL;
 document.getElementById("qtyBLACK").textContent=qtyBLACK;

 ["qtyBGL","qtyBLACK"].forEach(id=>{
  const el=document.getElementById(id);
  el.animate([{transform:"scale(1)"},{transform:"scale(1.18)"},{transform:"scale(1)"}],{duration:220,easing:"ease-out"});
 });
}

// ADMIN STATUS
function renderAdmins(){
 [1,2].forEach(id=>{
  const admin=ADMINS[id];
  const status=document.getElementById("adminStatus"+id);
  const card=document.getElementById("adminCard"+id);
  const check=document.getElementById("adminCheck"+id);

  status.textContent=admin.online?"● ONLINE":"● OFFLINE";
  status.className="admin-status "+(admin.online?"online":"offline");
  card.disabled=!admin.online;
  card.classList.toggle("active",selectedAdmin===id&&admin.online);
  check.style.display=selectedAdmin===id&&admin.online?"grid":"none";
 });
 updateSummary();
}

function selectAdmin(id){
 if(!ADMINS[id].online){
  alert("Admin sedang offline. Silakan pilih admin lain.");
  return;
 }
 selectedAdmin=id;
 renderAdmins();
}

// RINGKASAN
function updateSummary(){
 const prices=getPrices();
 const total=qtyBGL*prices.bgl+qtyBLACK*prices.black;
 const world=document.getElementById("world").value.trim();
 const owner=document.getElementById("owner").value.trim();

 document.getElementById("sumBGL").textContent=qtyBGL;
 document.getElementById("sumBLACK").textContent=qtyBLACK;
 document.getElementById("sumType").textContent=transaction;
 document.getElementById("sumWorld").textContent=transaction==="Jual"?(world||"—"):"—";
 document.getElementById("sumOwner").textContent=transaction==="Jual"?(owner||"—"):"—";
 document.getElementById("sumPriceBGL").textContent=qtyBGL?formatPrice(prices.bgl)+"/BGL":"—";
 document.getElementById("sumPriceBLACK").textContent=qtyBLACK?formatPrice(prices.black):"—";
 document.getElementById("sumTotal").textContent=formatPrice(total);
 document.getElementById("sumPayment").textContent=document.getElementById("payment").value||"—";
 document.getElementById("sumAdmin").textContent=ADMINS[selectedAdmin].name.replace(" | TokoCPS.Store","");
}

document.getElementById("world").addEventListener("input",updateSummary);
document.getElementById("owner").addEventListener("input",updateSummary);

// WHATSAPP CHECKOUT
function submitOrder(){
 if(qtyBGL===0&&qtyBLACK===0){alert("Silakan pilih minimal satu produk.");return}

 const payment=document.getElementById("payment").value;
 if(!payment){alert("Silakan pilih metode pembayaran.");return}

 const admin=ADMINS[selectedAdmin];
 if(!admin.online){alert("Admin sedang offline.");return}
 if(!admin.phone){alert("Nomor WhatsApp admin belum diatur.");return}

 const world=document.getElementById("world").value.trim();
 const owner=document.getElementById("owner").value.trim();

 if(transaction==="Jual"){
  if(!world){alert("Silakan isi nama World terlebih dahulu.");document.getElementById("world").focus();return}
  if(!owner){alert("Silakan isi nama Owner World terlebih dahulu.");document.getElementById("owner").focus();return}
 }

 const prices=getPrices();
 const totalBGL=qtyBGL*prices.bgl;
 const totalBLACK=qtyBLACK*prices.black;
 const total=totalBGL+totalBLACK;

 const message=[
  "Halo "+admin.name+", saya ingin "+transaction.toLowerCase()+" melalui TOKOCPS.","",
  "=== DETAIL TRANSAKSI TOKOCPS ===",
  "Jenis transaksi: "+transaction,"",
  "Blue Gem Lock (BGL): "+qtyBGL,
  "Harga BGL: "+formatPrice(prices.bgl)+"/BGL",
  "Subtotal BGL: "+formatPrice(totalBGL),"",
  "Black Gem Lock (BLACK): "+qtyBLACK,
  "Harga BLACK: "+formatPrice(prices.black),
  "Subtotal BLACK: "+formatPrice(totalBLACK),"",
  ...(transaction==="Jual"?["=== INFORMASI WORLD ===","World: "+world,"Owner: "+owner,""]:[]),
  "Metode pembayaran: "+payment,
  "Estimasi total: "+formatPrice(total),
  "Admin: "+admin.name,"",
  "Mohon konfirmasi stok dan transaksi saya. Terima kasih."
 ].join("\n");

 const phone=String(admin.phone).replace(/\D/g,"").replace(/^0/,"62");
 window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(message),"_blank");
}

// DRAG BOTTOM SHEET
const dragArea=document.getElementById("dragArea");
let dragStartY=0,dragCurrentY=0,dragging=false;

dragArea.addEventListener("pointerdown",e=>{
 dragging=true;dragStartY=e.clientY;dragCurrentY=0;
 sheet.style.transition="none";
 dragArea.setPointerCapture(e.pointerId);
});

dragArea.addEventListener("pointermove",e=>{
 if(!dragging)return;
 dragCurrentY=e.clientY-dragStartY;
 sheet.style.transform="translateY("+Math.max(0,dragCurrentY)+"px)";
});

function finishDrag(){
 if(!dragging)return;
 dragging=false;
 sheet.style.transition="transform .3s ease";
 if(dragCurrentY>120)closeOrder();
 else sheet.style.transform="translateY(0)";
}
dragArea.addEventListener("pointerup",finishDrag);
dragArea.addEventListener("pointercancel",finishDrag);

// DISCORD POPUP
const discordPopup=document.getElementById("tokocpsDiscordPopup");

function showDiscordPopup(){
 try{if(sessionStorage.getItem("tokocpsDiscordDismissed")==="yes")return}catch(e){}
 discordPopup.classList.add("show");
}

function closeDiscordPopup(){
 discordPopup.classList.remove("show");
 try{sessionStorage.setItem("tokocpsDiscordDismissed","yes")}catch(e){}
}

window.addEventListener("load",()=>{
 setTimeout(showDiscordPopup,1500);
});

// AI OPEN / CLOSE
const aiPanel=document.getElementById("aiPanel");
const aiSwipe=document.getElementById("aiSwipe");
const aiSwipeKnob=document.getElementById("aiSwipeKnob");

let aiDragging=false,aiStartX=0,aiCurrentX=0;

function toggleAI(){
 aiPanel.classList.toggle("show");
 document.body.style.overflow=aiPanel.classList.contains("show")?"hidden":"";
}

function resetAISlider(){
 aiCurrentX=0;
 aiSwipeKnob.style.transition="left .25s ease";
 aiSwipeKnob.style.left="7px";
}

aiSwipeKnob.addEventListener("pointerdown",e=>{
 aiDragging=true;aiStartX=e.clientX;
 aiSwipeKnob.style.transition="none";
 aiSwipeKnob.setPointerCapture(e.pointerId);
});

aiSwipeKnob.addEventListener("pointermove",e=>{
 if(!aiDragging)return;
 const max=aiSwipe.clientWidth-aiSwipeKnob.offsetWidth-18;
 aiCurrentX=Math.max(0,Math.min(max,e.clientX-aiStartX));
 aiSwipeKnob.style.left=(7+aiCurrentX)+"px";
});

aiSwipeKnob.addEventListener("pointerup",()=>{
 if(!aiDragging)return;
 aiDragging=false;
 const max=aiSwipe.clientWidth-aiSwipeKnob.offsetWidth-18;
 if(aiCurrentX>=max*.78){resetAISlider();toggleAI()}
 else resetAISlider();
});

aiSwipeKnob.addEventListener("pointercancel",()=>{
 aiDragging=false;resetAISlider();
});

// AI CHAT
const aiWelcome=document.getElementById("aiWelcome");
const aiMessages=document.getElementById("aiMessages");

function addMessage(text,type){
 const div=document.createElement("div");
 div.className="ai-message "+type;
 div.textContent=text;
 aiMessages.appendChild(div);
 aiMessages.scrollTop=aiMessages.scrollHeight;
}

function startChat(message){
 aiWelcome.style.display="none";
 aiMessages.classList.add("show");
 if(message)askAI(message);
}

function newAIChat(){
 aiMessages.innerHTML='<div class="ai-message bot">Halo! 👋 Selamat datang kembali di TOKOCPS AI. Ada yang bisa saya bantu?</div>';
 aiMessages.classList.remove("show");
 aiWelcome.style.display="block";
}

function toggleAIMenu(){
 alert("TOKOCPS AI · Menu bantuan\n\n• Informasi harga\n• Pembelian BGL / BLACK\n• Penjualan BGL / BLACK\n• Kalkulator Growtopia\n• Hubungi admin");
}

function aiAction(action){
 if(action==="beli"){toggleAI();openOrder("BGL");return}
 if(action==="jual"){toggleAI();openOrder();setTransaction("Jual");return}

 const questions={
  kalkulator:"Bantu saya menghitung konversi BGL, DL dan WL.",
  aman:"Bagaimana tips transaksi aman di TOKOCPS?",
  menu:"Apa saja fitur TOKOCPS?"
 };
 startChat(questions[action]||"Apa saja fitur TOKOCPS?");
}

function askAI(question){
 startChat();
 addMessage(question,"user");

 let answer="";
 const q=question.toLowerCase();

 if(q.includes("bgl")){
  answer="Harga BGL TOKOCPS:\n\n🛒 Beli: "+formatPrice(PRICE_BGL_BUY)+"/BGL\n💰 Jual: "+formatPrice(PRICE_BGL_SELL)+"/BGL\n\nHarga dapat berubah. Silakan konfirmasi kepada admin.";
 }else if(q.includes("black")){
  answer="Harga BLACK TOKOCPS:\n\n🛒 Beli: "+formatPrice(PRICE_BLACK_BUY)+"\n💰 Jual: "+formatPrice(PRICE_BLACK_SELL)+"\n\nHubungi admin untuk memastikan stok.";
 }else if(q.includes("beli")||q.includes("order")){
  answer="Cara membeli di TOKOCPS:\n\n1. Buka form order.\n2. Pilih Beli.\n3. Pilih BGL atau BLACK.\n4. Atur quantity.\n5. Pilih metode pembayaran.\n6. Pilih admin.\n7. Konfirmasi melalui WhatsApp.";
 }else if(q.includes("jual")){
  answer="Cara menjual di TOKOCPS:\n\n1. Buka form order.\n2. Pilih Jual.\n3. Pilih jumlah BGL atau BLACK.\n4. Masukkan nama World.\n5. Masukkan Owner World.\n6. Pilih pembayaran dan admin.\n7. Kirim detail melalui WhatsApp.";
 }else if(q.includes("stok")){
  answer="Untuk informasi stok terbaru, silakan hubungi admin TOKOCPS melalui WhatsApp atau komunitas Discord kami.";
 }else if(q.includes("pembayaran")){
  answer="Metode pembayaran TOKOCPS:\n\n• QRIS\n• DANA\n• GoPay\n• OVO\n• Transfer Bank\n• Diskusi dengan Admin\n\nPilih metode yang tersedia di form transaksi.";
 }else if(q.includes("aman")){
  answer="Tips transaksi aman:\n\n1. Gunakan admin resmi TOKOCPS.\n2. Periksa kembali detail transaksi.\n3. Jangan membagikan password akun.\n4. Pastikan pembayaran dan nominal benar.\n5. Simpan bukti transaksi.\n\nSelalu konfirmasi melalui kontak resmi TOKOCPS.";
 }else if(q.includes("kalkulator")||q.includes("hitung")||q.includes("dl")||q.includes("wl")){
  answer="Kalkulator dasar Growtopia:\n\n1 DL = 100 WL\n1 BGL = 100 DL\n1 BGL = 10.000 WL\n\nContoh:\n2 BGL = 200 DL = 20.000 WL.";
 }else if(q.includes("partner")){
  answer="TOKOCPS membuka kesempatan kerja sama partner. Hubungi admin untuk informasi lebih lanjut.";
 }else if(q.includes("panduan")){
  answer="Selamat datang di panduan TOKOCPS!\n\nKamu bisa menggunakan form Beli dan Jual untuk melakukan transaksi. Untuk penjualan, isi juga World dan Owner World.";
 }else if(q.includes("tools")){
  answer="TOKOCPS menyediakan informasi dan bantuan seputar Growtopia. Untuk tools dan fitur tambahan, silakan tanyakan kepada admin.";
 }else if(q.includes("pesanan")){
  answer="Untuk mengecek pesanan, silakan hubungi admin yang menangani transaksi kamu dan sertakan bukti atau detail order.";
 }else{
  answer="Terima kasih sudah menghubungi TOKOCPS AI! ✨\n\nSaya bisa membantu informasi harga BGL, BLACK, cara transaksi, kalkulator DL/WL, pembayaran dan panduan TOKOCPS.\n\nSilakan tanyakan sesuatu atau hubungi admin kami.";
 }

 setTimeout(()=>addMessage(answer,"bot"),350);
}

function sendAI(event){
 event.preventDefault();
 const input=document.getElementById("aiInput");
 const question=input.value.trim();
 if(!question)return;
 input.value="";
 askAI(question);
}

// UPDATE HARGA
document.getElementById("aiBuyPrice").textContent=formatPrice(PRICE_BGL_BUY);
document.getElementById("aiSellPrice").textContent=formatPrice(PRICE_BGL_SELL);
document.getElementById("aiBlackPrice").textContent=formatPrice(PRICE_BLACK_BUY);

document.getElementById("blackPrice").textContent=formatPrice(PRICE_BLACK_BUY);
document.getElementById("blackSellPrice").textContent=formatPrice(PRICE_BLACK_SELL);
document.getElementById("bglPrice").textContent=formatPrice(PRICE_BGL_BUY);
document.getElementById("bglSellPrice").textContent=formatPrice(PRICE_BGL_SELL)+"/BGL";

document.getElementById("itemBGLPrice").textContent=
 "Beli: "+formatPrice(PRICE_BGL_BUY)+" · Jual: "+formatPrice(PRICE_BGL_SELL);

document.getElementById("itemBLACKPrice").textContent=
 "Beli: "+formatPrice(PRICE_BLACK_BUY)+" · Jual: "+formatPrice(PRICE_BLACK_SELL);

// PARTICLES
(function(){
 const particles=document.createElement("div");
 particles.id="tokocpsParticles";
 document.body.prepend(particles);

 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const count=reduced?0:(window.innerWidth<600?16:30);

 for(let i=0;i<count;i++){
  const p=document.createElement("span");
  p.className="particle";
  p.style.left=Math.random()*100+"%";
  p.style.animationDuration=(8+Math.random()*12)+"s";
  p.style.animationDelay=(-Math.random()*15)+"s";
  const size=(2+Math.random()*3)+"px";
  p.style.width=size;
  p.style.height=size;
  particles.appendChild(p);
 }
})();

// KEYBOARD ESCAPE
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"){
  if(aiPanel.classList.contains("show"))toggleAI();
  else if(overlay.classList.contains("show"))closeOrder();
  else if(discordPopup.classList.contains("show"))closeDiscordPopup();
 }
});

// INITIALIZE
renderAdmins();
updateSummary();