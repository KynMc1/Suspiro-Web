// public/app.js
// Productos demo (luego los puedes cargar desde server o JSON dinámico)
const PRODUCTS = [
  { id: 'p1', name: 'Cheesecake de frutos rojos', price: 18000, img: 'img/productos/cheesecake.png', desc: 'Cremoso y delicado' },
  { id: 'p2', name: 'Calzones Rotos (pack 6)', price: 8000, img: 'img/productos/calzon-roto.png', desc: 'Crujientes y con amor' },
  { id: 'p3', name: 'Torta personalizada (mediana)', price: 45000, img: 'img/productos/torta-cumple.png', desc: 'Diseño a tu gusto' }
];

// Utilidades
const formatCLP = n => `CLP ${n.toLocaleString('es-CL')}`;

// Estado del carrito (se persiste en localStorage)
const CART_KEY = 'suspiro_cart_v1';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

// Referencias DOM
const catalogEl = document.getElementById('catalog');
const cartItemsEl = document.getElementById('cartItems');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkout');

// Render catálogo
function renderCatalog(){
  if(!catalogEl) return;
  catalogEl.innerHTML = '';
  PRODUCTS.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '18px';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p style="color:#666">${p.desc}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
        <strong>${formatCLP(p.price)}</strong>
        <button data-id="${p.id}" class="btn add-btn">Agregar</button>
      </div>
    `;
    catalogEl.appendChild(card);
  });

  // listeners agregar
  document.querySelectorAll('.add-btn').forEach(b=>{
    b.onclick = ()=> {
      addToCart(b.dataset.id);
      showToast('Agregado al pedido 🍰');
    };
  });
}

// Carrito: añadir, quitar, cambiar qty
function addToCart(productId){
  const prod = PRODUCTS.find(p=>p.id === productId);
  if(!prod) return;
  const item = cart.find(c=>c.id === productId);
  if(item) item.qty++;
  else cart.push({ id: prod.id, name: prod.name, price: prod.price, qty: 1 });
  saveCart();
  renderCart();
}
function removeFromCart(productId){
  cart = cart.filter(c=>c.id !== productId);
  saveCart(); renderCart();
}
function changeQty(productId, delta){
  const item = cart.find(c=>c.id===productId);
  if(!item) return;
  item.qty += delta;
  if(item.qty < 1) removeFromCart(productId);
  saveCart(); renderCart();
}
function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

// Render carrito
function renderCart(){
  if(!cartItemsEl) return;
  cartItemsEl.innerHTML = '';
  if(cart.length === 0){
    cartItemsEl.innerHTML = `<div class="empty">Tu pedido está vacío. Añade productos desde la izquierda.</div>`;
    totalEl.textContent = formatCLP(0);
    return;
  }
  let total = 0;
  cart.forEach(item=>{
    total += item.price * item.qty;
    const row = document.createElement('div');
    row.className = 'product-row';
    row.innerHTML = `
      <img src="${(PRODUCTS.find(p=>p.id===item.id)||{}).img || 'img/productos/placeholder.png'}" alt="">
      <div class="meta">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${item.name}</strong>
          <span>${formatCLP(item.price)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <div class="qty">
            <button class="dec" data-id="${item.id}">-</button>
            <div style="padding:6px 10px; border-radius:8px; background:#fff;">${item.qty}</div>
            <button class="inc" data-id="${item.id}">+</button>
          </div>
          <button class="remove" data-id="${item.id}" style="background:transparent;border:none;color:#c33;cursor:pointer">Eliminar</button>
        </div>
      </div>
    `;
    cartItemsEl.appendChild(row);
  });
  totalEl.textContent = formatCLP(total);

  // listeners
  cartItemsEl.querySelectorAll('.inc').forEach(b=>b.onclick = ()=>{ changeQty(b.dataset.id, 1); });
  cartItemsEl.querySelectorAll('.dec').forEach(b=>b.onclick = ()=>{ changeQty(b.dataset.id, -1); });
  cartItemsEl.querySelectorAll('.remove').forEach(b=>b.onclick = ()=>{ removeFromCart(b.dataset.id); });
}

// Enviar pedido al servidor
checkoutBtn.onclick = async ()=>{
  const nombre = document.getElementById('clienteNombre').value.trim();
  const telefono = document.getElementById('clienteTelefono').value.trim();
  const metodo = document.getElementById('metodoEntrega').value;
  const direccion = document.getElementById('direccion').value.trim();
  const nota = document.getElementById('nota').value.trim();

  if(cart.length === 0){ showToast('Tu pedido está vacío'); return; }
  if(!nombre || !telefono){ showToast('Completa nombre y teléfono'); return; }
  if(metodo === 'envio' && !direccion){ showToast('Ingresa dirección para envío'); return; }

  const pedido = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    nombre, telefono, metodo, direccion, nota,
    items: cart,
    total: cart.reduce((s,i)=>s + i.price * i.qty, 0),
    estado: 'pendiente'
  };

  // Enviar al servidor
  try {
    const res = await fetch('/api/pedido',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(pedido) });
    const data = await res.json();
    if(data.ok){
      showToast('Pedido enviado 🎉');
      cart = []; saveCart(); renderCart();
      // limpiar formulario
      document.getElementById('clienteNombre').value='';
      document.getElementById('clienteTelefono').value='';
      document.getElementById('direccion').value='';
      document.getElementById('nota').value='';
    } else {
      showToast('Error al enviar pedido');
    }
  } catch(e){
    console.error(e); showToast('Error de red');
  }
};

// Mensaje toast sencillo
function showToast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, { position:'fixed', right:'20px', bottom:'20px', background:'#333', color:'#fff', padding:'10px 16px', borderRadius:'10px', zIndex:9999, opacity:0, transition:'all 0.3s' });
  document.body.appendChild(t);
  setTimeout(()=> t.style.opacity = 1, 10);
  setTimeout(()=> t.style.opacity = 0, 2500);
  setTimeout(()=> t.remove(), 3000);
}

// Init
renderCatalog();
renderCart();
