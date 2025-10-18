document.getElementById('btnEnviarResena').onclick = async () => {
  const nombre = document.getElementById('resenaNombre').value;
  const comentario = document.getElementById('resenaComentario').value;
  const msg = document.getElementById('msgResena');

  if(!nombre || !comentario){ msg.textContent='Completa todos los campos'; return; }

  const res = await fetch('/api/resenas', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ nombre, comentario })
  });

  const data = await res.json();
  if(data.ok){
    msg.textContent='Reseña enviada!';
    document.getElementById('resenaNombre').value='';
    document.getElementById('resenaComentario').value='';
    cargarResenas(); // recargar la lista
  } else {
    msg.textContent='Error al enviar';
  }
}
