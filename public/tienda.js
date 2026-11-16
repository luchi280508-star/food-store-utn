import {$,esc,money,date,statuses,state,staff,page,empty,photo,api,toast,modal,close,errorBox,field,option,bind,loadCatalog} from './common.js';
import {inventory,admin} from './gestion.js';

try {const saved=JSON.parse(localStorage.getItem('food-cart-v1')||'{}');for(const [id,n] of Object.entries(saved||{}))if(/^\d+$/.test(id)&&Number.isSafeInteger(n)&&n>0)state.cart[id]=n}catch{}
const route=()=>decodeURIComponent(location.hash.slice(1)) || 'catalogo';
const totalUnits=()=>Object.values(state.cart).reduce((a,b)=>a+b,0);
function nav(){
  const r=route().split('/')[0], link=(id,label,url='#'+id)=>'<a href="'+url+'" class="'+(r===id?'active':'')+'">'+label+'</a>';
  let links=link('catalogo','Carta');
  if(state.user) {
    if(staff())links+=link('gestion','Inventario');
    links+=link('pedidos',staff()?'Pedidos':'Mis pedidos');
    if(state.user.role==='Superadmin')links+=link('admin','Control','/admin');
    links+=link('cuenta','Mi cuenta');
  }else links+=link('ingreso','Ingresar');
  $('#nav').innerHTML=links+'<a class="bag" href="#carrito">Carrito <b>'+totalUnits()+'</b></a>';
}
function changeCart(id,qty){
  if(qty<=0)delete state.cart[id];else state.cart[id]=qty;
  try{localStorage.setItem('food-cart-v1',JSON.stringify(state.cart))}catch{}
  nav()
}
const categoryName=id=>state.categories.find(c=>String(c.id)===String(id))?.name||'';
function addProduct(p){
  const n=state.cart[p.id]||0;
  if(n>=p.stock){toast('Ya agregaste todo el stock disponible.');return}
  changeCart(p.id,n+1);toast(p.name+' se agregó al carrito.');
}
function detail(p){
  modal(p.name,'<img class="detailimg" src="'+photo(p)+'" alt=""><p class="kicker">'+esc(categoryName(p.category_id))+'</p><p>'+esc(p.description)+'</p><p class="muted">'+esc(p.stock)+' unidades disponibles</p><div class="cardfoot"><span class="price">'+money(p.price)+'</span><button class="primary" id="detalle-add">Agregar al carrito</button></div>');
  $('#detalle-add').onclick=()=>{close();addProduct(p)};
}
let chosen='',query='';
function catalog(root){
  root.innerHTML='<section class="hero"><div class="herocopy"><span class="eyebrow"><i></i> Cocina de barrio</span><h1>La carta<br>de la casa.</h1><p>Pizzas, empanadas y algo dulce para compartir.</p></div><img alt="Pizza de la carta de Food Store" src="/images/1.jpg"></section><section><div class="cataloghead"><div><p class="kicker">Food Store</p><h2>Elegí tu pedido</h2></div><input class="search" type="search" aria-label="Buscar por nombre" placeholder="Buscar por nombre…" value="'+esc(query)+'"></div><div class="filters"></div><div id="productos"></div></section>';
  function filter(){
    $('.filters',root).innerHTML=[{id:'',name:'Todos'},...state.categories.filter(c=>c.active!==false)].map(c=>'<button class="chip '+(String(c.id)===chosen?'on':'')+'" aria-pressed="'+(String(c.id)===chosen)+'" data-cat="'+esc(c.id)+'">'+esc(c.name)+'</button>').join('');
    const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const products=state.products.filter(p=>(!chosen||String(p.category_id)===chosen)&&normalize(p.name).includes(normalize(query.trim())));
    $('#productos',root).innerHTML=products.length?'<div class="grid">'+products.map(p=>'<article class="card"><button class="openproduct" data-detail="'+p.id+'"><img loading="lazy" src="'+photo(p)+'" alt=""><div class="cardtext"><small>'+esc(categoryName(p.category_id))+'</small><h3>'+esc(p.name)+'</h3></div></button><div class="cardfoot"><span class="price">'+money(p.price)+'</span><button class="add" data-add="'+p.id+'" aria-label="Agregar '+esc(p.name)+'">+</button></div></article>').join('')+'</div>':empty('Sin resultados','Probá con otro nombre o categoría.');
  }
  $('.search',root).oninput=e=>{query=e.target.value;filter()};
  root.onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    if('cat' in b.dataset){chosen=b.dataset.cat;filter();return}
    const p=state.products.find(p=>String(p.id)===(b.dataset.add||b.dataset.detail));if(p){if('add'in b.dataset)addProduct(p);else detail(p)}
  };filter();
}
let afterLogin='catalogo';
function accountForm(root,registration=false){
  root.innerHTML=page('Cuenta',registration?'Creá tu cuenta':'Ingresá a Food Store')+'<form class="panel stack narrow">'+(registration?field('Nombre','name','','required autocomplete="name"'):'')+field('Correo electrónico','email','','type="email" required autocomplete="email"')+field('Contraseña','password','','type="password" required '+(registration?'minlength="8" autocomplete="new-password"':'autocomplete="current-password"'))+errorBox+'<div class="actions"><button class="primary" type="submit">'+(registration?'Crear cuenta':'Ingresar')+'</button><a href="'+(registration?'#ingreso':'#registro')+'">'+(registration?'Ya tengo cuenta':'Crear una cuenta')+'</a></div></form>';
  bind($('form',root),async fields=>{const result=await api(registration?'register':'login',fields);state.user=result.user;nav();const dest=afterLogin;afterLogin='catalogo';location.hash=dest;toast(registration?'Cuenta creada.':'Sesión iniciada.')});
}
function account(root){
  const u=state.user;if(!u)return accountForm(root);
  root.innerHTML=page('Mi cuenta',u.name)+'<div class="panel narrow"><p><strong>'+esc(u.email)+'</strong> · '+esc(u.role)+'</p>'+(u.role==='Cliente'?'<form class="stack">'+field('Teléfono','phone',u.phone,'type="tel" autocomplete="tel"')+field('Dirección','address',u.address,'autocomplete="street-address"')+errorBox+'<div><button class="primary" type="submit">Guardar cambios</button></div></form>':'')+'<p><button class="secondary" id="logout">Cerrar sesión</button></p></div>';
  if($('form',root))bind($('form',root),async f=>{state.user=(await api('profile',f)).user;toast('Datos actualizados.')});
  $('#logout',root).onclick=async()=>{try{await api('logout');state.user=null;location.hash='catalogo';toast('Sesión cerrada.')}catch(e){toast(e.message)}};
}
function cart(root){
  root.innerHTML=page('Tu selección','Carrito');
  if(!totalUnits()){root.innerHTML+=empty('Tu carrito está vacío','Elegí algún producto de la carta para empezar.')+'<a class="primary button" href="#catalogo">Ver la carta</a>';return}
  const lines=Object.entries(state.cart).map(([id,qty])=>({id,qty,p:state.products.find(p=>String(p.id)===id)}));
  const subtotal=lines.reduce((s,l)=>s+(l.p?l.qty*l.p.price:0),0), invalid=lines.some(l=>!l.p||l.qty>l.p.stock);
  root.innerHTML+='<div class="two"><section class="panel">'+lines.map(({id,qty,p})=>'<div class="lineitem"><div><strong>'+esc(p?.name||'Producto no disponible')+'</strong><br><small>'+(p?money(p.price)+' por unidad':'Quitalo para continuar')+'</small>'+(p&&qty>p.stock?'<br><small>Stock disponible: '+esc(p.stock)+'</small>':'')+'</div><div class="quantity"><button data-id="'+id+'" data-step="-1" aria-label="Restar una unidad">−</button><output>'+qty+'</output><button data-id="'+id+'" data-step="1" aria-label="Sumar una unidad">+</button><button class="link" data-id="'+id+'" data-step="0" aria-label="Quitar producto">×</button></div></div>').join('')+'</section><section class="panel"><h2>Resumen</h2><dl class="summary"><dt>Productos</dt><dd>'+money(subtotal)+'</dd><dt>Envío fijo</dt><dd>'+money(1500)+'</dd><dt><strong>Total</strong></dt><dd><strong>'+money(subtotal+1500)+'</strong></dd></dl><hr><form class="stack">'+(state.user?.role==='Cliente'?field('Dirección de entrega','address',state.user.address,'required autocomplete="street-address"'):'')+errorBox+(invalid?'<p>Ajustá los productos sin stock antes de continuar.</p>':staff()?'<p>Las compras se realizan con una cuenta de Cliente.</p>':'<button class="primary" type="submit">'+(state.user?'Crear pedido':'Ingresar para pedir')+'</button>')+'</form></section></div>';
  root.onclick=e=>{const b=e.target.closest('[data-step]');if(!b)return;const id=b.dataset.id,k=Number(b.dataset.step);if(k>0&&state.cart[id]>=Number(lines.find(x=>x.id===id)?.p?.stock||0)){toast('Stock insuficiente.');return}changeCart(id,k?state.cart[id]+k:0);cart(root)};
  bind($('form',root),async f=>{
    if(!state.user){afterLogin='carrito';location.hash='ingreso';return}
    if(invalid||staff())return;
    const {order}=await api('checkout',{address:f.address,items:lines.map(l=>({product_id:Number(l.id),quantity:l.qty}))});
    for(const id of Object.keys(state.cart))changeCart(id,0);
    location.hash='pedido/'+order.id;
  })
}
export async function render(){
  const ticket=++render.ticket;
  const root=document.createElement('div');const r=route(),[view,id]=r.split('/');
  nav();try {
    if(view==='catalogo'||view==='carrito')await loadCatalog();
    if(view==='catalogo')catalog(root);
    else if(view==='carrito')cart(root);
    else if(view==='ingreso'||view==='registro')state.user?account(root):accountForm(root,view==='registro');
    else if(view==='cuenta')account(root);
    else if(view==='pedidos')await orders(root);
    else if(view==='pedido')await single(root,id);
    else if(view==='gestion')await inventory(root,render);
    else if(view==='admin')await admin(root,render);
    else root.innerHTML=empty('Página desconocida','Podés volver desde el menú.');
  }catch(e){root.innerHTML=empty('No se pudo abrir esta pantalla',e.message)+'<button class="secondary" id="retry">Volver a intentar</button>';$('#retry',root).onclick=render}
  if(ticket===render.ticket){$('#principal').replaceChildren(root);document.title=(root.querySelector('h1')?.textContent||'Carta')+' · Food Store';}
}
render.ticket=0;
let statusFilter='';
async function orders(root){
  const canFilter=staff();const {orders:list}=await api('orders',canFilter&&statusFilter?{status:statusFilter}:{});
  root.innerHTML=page(canFilter?'Gestión':'Mi cuenta',canFilter?'Pedidos':'Mis pedidos')+(canFilter?'<label class="field narrow">Estado<select id="status">'+option('','Todos',statusFilter)+statuses.map(s=>option(s,s,statusFilter)).join('')+'</select></label><br>':'')+(list.length?'<section class="panel">'+list.map(o=>'<div class="lineitem"><div><a href="#pedido/'+o.id+'"><strong>Pedido #'+o.id+'</strong></a><br><small>'+esc(date(o.created_at))+(canFilter?' · '+esc(o.customer):'')+'</small></div><span class="pill">'+esc(o.status)+'</span><strong>'+money(o.total)+'</strong></div>').join('')+'</section>':empty('Sin pedidos',canFilter?'No hay pedidos para este filtro.':'Cuando hagas un pedido, vas a verlo acá.'));
  if(canFilter)$('#status',root).onchange=e=>{statusFilter=e.target.value;render()}
}
async function single(root,id){
  const {order:o}=await api('order',{id:Number(id)});const s=o.status,u=state.user;
  const canPay=u?.role==='Cliente'&&s==='Pendiente';
  const canCancel=s==='Pendiente'||(staff()&&s==='Confirmado')||(u?.role==='Superadmin'&&s==='En preparación');
  const next=staff()&&['Confirmado','En preparación','En camino'].includes(s)?statuses[statuses.indexOf(s)+1]:null;
  root.innerHTML=page('Detalle de pedido','Pedido #'+o.id,'<a href="#pedidos">Volver a pedidos</a>')+'<div class="two"><section class="panel"><span class="pill">'+esc(s)+'</span><p>'+esc(date(o.created_at))+' · '+esc(o.customer)+'</p><p>Entrega en <strong>'+esc(o.address)+'</strong></p>'+o.items.map(i=>'<div class="lineitem"><div><strong>'+esc(i.name)+'</strong><br><small>'+i.quantity+' × '+money(i.price)+'</small></div><strong>'+money(i.price*i.quantity)+'</strong></div>').join('')+'<dl class="summary"><dt>Envío fijo</dt><dd>'+money(o.shipping)+'</dd><dt class="amount">Total</dt><dd class="amount">'+money(o.total)+'</dd></dl></section><section class="panel"><h2>Historial</h2><ol class="history">'+o.history.map(h=>'<li><strong>'+esc(h.status)+'</strong><br><small>'+esc(date(h.created_at))+' · '+esc(h.actor)+'</small>'+(h.reason?'<br>'+esc(h.reason):'')+'</li>').join('')+'</ol></section></div>'+(canPay||next||canCancel?'<section class="panel narrow">'+(canPay?'<h2>Pago simulado</h2><p>Elegí el resultado del pago de prueba.</p>':'')+'<form class="actions">'+(canPay?'<button class="primary" name="approve" type="submit">Aprobar pago</button><button class="secondary" name="reject" type="submit">Rechazar pago</button>':'')+(next?'<button class="primary" name="advance" type="submit">Pasar a '+esc(next)+'</button>':'')+(canCancel?'<button class="danger" name="cancel" type="button">Cancelar pedido</button>':'')+errorBox+'</form></section>':'');
  const form=$('form',root);if(!form)return;
  bind(form,async(_,b)=>{const key=b.name;await api(key==='advance'?'advance':'pay',key==='advance'?{id:o.id}:{id:o.id,approve:key==='approve'});toast(key==='reject'?'Pago rechazado. Podés reintentarlo.':'Pedido actualizado.');await render()});
  const cb=$('[name=cancel]',form);if(cb)cb.onclick=()=>{
    modal('Cancelar pedido #'+o.id,'<form class="stack"><label class="field">Motivo<textarea name="reason" required maxlength="500"></textarea></label>'+errorBox+'<button class="danger" type="submit">Confirmar cancelación</button></form>');
    bind($('#dialogbody form'),async f=>{await api('cancel',{id:o.id,reason:f.reason});close();toast('Pedido cancelado.');await render()})
  }
}
$('#cerrar').onclick=close;
window.addEventListener('hashchange',()=>{if($('#dialogo').open)close();render();window.scrollTo(0,0)});
try{state.user=(await api('me')).user}catch(e){toast(e.message)}
await render();
