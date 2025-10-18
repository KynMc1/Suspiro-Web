// public/admin-pedidos.js
const tabla = document.querySelector('#tablaPedidos tbody');
const buscador = document.getElementById('buscador');
let pedidos = [];

async function cargarPedidos(){
  const res = await fetch('/api/pedidos');
  pedidos = await res.json();
  renderPedidos(pedidos);
}

function renderPedidos(lista){
  tabla.innerHTML = '';
  if(lista.length === 0){
    tabla.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">No hay pedidos registrados.</td></tr>';
    return;
  }

  lista.sort((a,b)=>b.id - a.id); // más recientes arriba
  lista.forEach(p=>{
    const tr = document.createElement('tr');
    const estadoBadge = `<span class="badge ${p.estado}">${p.estado}</span>`;
    const productos = p.items.map(i=>`${i.qty}× ${i.name}`).join('<br>');
    const fecha = new Date(p.createdAt).toLocaleString('es-CL', { dateStyle:'short', timeStyle:'short' });

    tr.innerHTML = `
      <td>
        <strong>${p.nombre}</strong><br>
        <span class="small">${p.telefono}</span><br>
        <span class="small">${fecha}</span>
      </td>
      <td>
        ${productos}
        ${p.nota ? `<div class="resumen">📝 ${p.nota}</div>` : ''}
        ${p.metodo === 'envio' ? `<div class="resumen">📦 Envío a: ${p.direccion}</div>` : `<div class="resumen">🏠 Retiro en tienda</div>`}
      </td>
      <td><strong>$${p.total.toLocaleString('es-CL')}</strong></td>
      <td>${estadoBadge}</td>
      <td>
        <button class="action" onclick="marcarEntregado(${p.id})">✅ Entregar</button>
        <button class="action" onclick="enviarWhatsApp(${p.id})">💬 WhatsApp</button>
      </td>
    `;
    tabla.appendChild(tr);
  });
}

// Buscar
buscador.addEventListener('input', ()=>{
  const q = buscador.value.toLowerCase();
  const filtrado = pedidos.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    p.telefono.toLowerCase().includes(q) ||
    p.estado.toLowerCase().includes(q)
  );
  renderPedidos(filtrado);
});

// Marcar como entregado
async function marcarEntregado(id){
  const pedido = pedidos.find(p=>p.id===id);
  if(!pedido) return alert('Pedido no encontrado');
  pedido.estado = 'entregado';
  await guardarCambios();
  showToast('Pedido marcado como entregado ✅');
}

// Enviar resumen a WhatsApp
function enviarWhatsApp(id){
  const p = pedidos.find(p=>p.id===id);
  if(!p) return;
  const productos = p.items.map(i=>`• ${i.qty}× ${i.name}`).join('%0A');
  const msg = `🍰 *Pedido Suspiro*%0ACliente: ${p.nombre}%0ATeléfono: ${p.telefono}%0AMétodo: ${p.metodo}%0A${p.metodo==='envio'?'Dirección: '+p.direccion+'%0A':''}Total: CLP ${p.total.toLocaleString('es-CL')}%0A%0A*Productos:*%0A${productos}%0A%0AGracias por preferir Suspiro 💖`;
  const url = `https://wa.me/${p.telefono.replace(/[^0-9]/g,'')}?text=${msg}`;
  window.open(url, '_blank');
}

// Guardar cambios localmente en el server
async function guardarCambios(){
  try {
    await fetch('/api/pedido', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(pedidos) // enviamos lista entera
    });
    renderPedidos(pedidos);
  } catch(e){
    console.error(e);
    showToast('Error guardando cambios');
  }
}

// Toast bonito
function showToast(msg){
  const t=document.createElement('div');
  t.textContent=msg;
  Object.assign(t.style,{position:'fixed',bottom:'20px',right:'20px',background:'#333',color:'#fff',padding:'10px 16px',borderRadius:'10px',opacity:0,transition:'.3s'});
  document.body.appendChild(t);
  setTimeout(()=>t.style.opacity=1,10);
  setTimeout(()=>t.style.opacity=0,2500);
  setTimeout(()=>t.remove(),3000);
}

cargarPedidos();
