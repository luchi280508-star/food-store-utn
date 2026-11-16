import {$,esc,money,statuses,page,empty,api,toast,modal,close,errorBox,field,option,bind} from './common.js';

const action=(id,label,kind='edit')=>'<button class="secondary" data-'+kind+'="'+esc(id)+'">'+esc(label)+'</button>';
const flag=(label,on)=>'<label class="check"><input type="checkbox" name="active" '+(on?'checked':'')+'>'+esc(label)+'</label>';
const save=errorBox+'<div><button class="primary" type="submit">Guardar</button></div>';
function table(headers,rows){return '<div class="tablewrap"><table><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>'}
function editor(title,body,submit,refresh){
  modal(title,'<form class="stack">'+body+save+'</form>');
  bind($('#dialogbody form'),async fields=>{await submit({...fields,active:fields.active==='on'});close();toast('Cambios guardados.');await refresh()})
}
let inventoryView='productos';
export async function inventory(root,refresh){
  const {products,categories}=await api('inventory');
  const cats=Object.fromEntries(categories.map(c=>[c.id,c.name]));
  const views=[['productos','Productos'],['bajo','Stock bajo'],['categorias','Categorías']];
  root.innerHTML=page('Gestión','Inventario')+'<div class="filters">'+views.map(([k,l])=>'<button class="chip '+(k===inventoryView?'on':'')+'" data-view="'+k+'">'+l+'</button>').join('')+'</div><section class="panel" id="lista"></section>';
  const section=$('#lista',root),isCategory=inventoryView==='categorias',low=inventoryView==='bajo';
  if(isCategory){
    section.innerHTML='<div class="pagehead"><h2>Categorías</h2>'+action('new','Crear categoría','cat')+'</div>'+table(['Nombre','Estado','Acción'],categories.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+ (c.active?'Activa':'De baja')+'</td><td>'+action(c.id,'Editar','cat')+'</td></tr>'));
  }else{
    const list=low?products.filter(p=>p.stock<=p.min_stock):products;
    section.innerHTML='<div class="pagehead"><h2>'+(low?'Stock bajo':'Productos')+'</h2>'+(!low?action('new','Crear producto','prod'):'')+'</div>'+(low?'<p class="muted">Productos con stock igual o inferior al mínimo.</p>':'')+(list.length?table(['Nombre','Categoría','Precio','Stock / mín.','Venta','Acción'],list.map(p=>'<tr><td>'+esc(p.name)+'</td><td>'+esc(cats[p.category_id])+'</td><td>'+money(p.price)+'</td><td><span class="pill '+(p.stock<=p.min_stock?'warn':'')+'">'+p.stock+' / '+p.min_stock+'</span></td><td>'+(p.active?'Disponible':'De baja')+'</td><td>'+action(p.id,'Editar','prod')+'</td></tr>')):empty('Sin productos para mostrar'));
  }
  root.onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.view){inventoryView=b.dataset.view;refresh();return}
    if(b.dataset.cat){const cat=categories.find(c=>String(c.id)===b.dataset.cat);
      editor(cat?'Editar categoría':'Crear categoría',field('Nombre','name',cat?.name,'required')+flag('Categoría activa',cat?.active??true), f=>api('category',{...f,...(cat?{id:cat.id}:{})}),refresh)
    }
    if(b.dataset.prod){
      const p=products.find(p=>String(p.id)===b.dataset.prod),available=categories.filter(c=>c.active||p?.category_id===c.id);
      if(!available.length){toast('Creá una categoría activa para cargar productos.');return}
      const body=field('Nombre','name',p?.name,'required')+'<label class="field">Descripción<textarea name="description" required>'+esc(p?.description)+'</textarea></label><label class="field">Categoría<select name="category_id" required>'+available.map(c=>option(c.id,c.name,p?.category_id)).join('')+'</select></label>'+field('Precio en pesos','price',p?.price,'type="number" min="0" step="0.01" required')+'<div class="split">'+field('Stock','stock',p?.stock??0,'type="number" min="0" step="1" required')+field('Stock mínimo','min_stock',p?.min_stock??0,'type="number" min="0" step="1" required')+'</div>'+field('URL o ruta de imagen','image',p?.image,'required')+flag('Disponible para la venta',p?.active??true);
      editor(p?'Editar producto':'Crear producto',body,f=>api('product',{...f,...(p?{id:p.id}:{}),category_id:Number(f.category_id),price:Number(f.price),stock:Number(f.stock),min_stock:Number(f.min_stock)}),refresh)
    }
  }
}
let adminView='panel';
export async function admin(root,refresh){
  const data=adminView==='panel'?await api('dashboard'):await api('users');
  root.innerHTML=page('Superadmin','Control de la tienda')+'<div class="filters"><button class="chip '+(adminView==='panel'?'on':'')+'" data-view="panel">Panel</button><button class="chip '+(adminView==='usuarios'?'on':'')+'" data-view="usuarios">Usuarios</button></div>';
  if(adminView==='panel'){
    root.innerHTML+='<div class="stats"><section class="panel"><p class="kicker">Total vendido</p><span class="amount">'+money(data.total)+'</span><p class="muted">Pedidos pagados vigentes, con envío.</p></section><section class="panel"><p class="kicker">Producto más vendido</p><span class="amount">'+esc(data.top?.name||'Sin ventas')+'</span>'+(data.top?'<p>'+esc(data.top.quantity)+' unidades</p>':'')+'</section></div><section class="panel"><h2>Pedidos por estado</h2>'+table(['Estado','Pedidos'],statuses.map(s=>'<tr><td>'+esc(s)+'</td><td>'+esc(data.counts[s]||0)+'</td></tr>'))+'</section>';
  }else{
    root.innerHTML+='<div class="panel"><div class="pagehead"><h2>Usuarios</h2>'+action('new','Crear usuario','user')+'</div>'+table(['Nombre','Correo','Rol','Estado','Acción'],data.users.map(u=>'<tr><td>'+esc(u.name)+'</td><td>'+esc(u.email)+'</td><td>'+esc(u.role)+'</td><td>'+(u.active?'Activo':'De baja')+'</td><td>'+action(u.id,'Editar','user')+'</td></tr>'))+'</div>';
  }
  root.onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.view){adminView=b.dataset.view;refresh();return}
    if(!b.dataset.user)return;
    const u=data.users.find(u=>String(u.id)===b.dataset.user);
    const body=field('Nombre','name',u?.name,'required')+field('Correo electrónico','email',u?.email,'type="email" required')+field(u?'Nueva contraseña (opcional)':'Contraseña','password','','type="password" autocomplete="new-password" minlength="8" '+(u?'':'required'))+
      '<label class="field">Rol<select name="role">'+['Cliente','Empleado','Superadmin'].map(r=>option(r,r,u?.role||'Cliente')).join('')+'</select></label>'+field('Teléfono','phone',u?.phone,'type="tel"')+field('Dirección','address',u?.address)+flag('Cuenta activa',u?.active??true);
    editor(u?'Editar usuario':'Crear usuario',body,f=>{if(!f.password)delete f.password;return api('user',{...f,...(u?{id:u.id}:{})})},refresh);
  }
}
