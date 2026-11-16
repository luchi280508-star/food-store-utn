export const $ = (s, root=document) => root.querySelector(s);
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:2,minimumFractionDigits:0}).format(Number(n));
export const date = s => new Date(s).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'});
export const statuses = ['Pendiente','Confirmado','En preparación','En camino','Entregado','Cancelado'];
export const state = {user:null,products:[],categories:[],cart:{}};
export const staff = () => ['Empleado','Superadmin'].includes(state.user?.role);
export const page = (k,t,extra='') => '<div class="pagehead"><div><p class="kicker">'+esc(k)+'</p><h1>'+esc(t)+'</h1></div>'+extra+'</div>';
export const empty = (title,body='') => '<div class="empty"><h3>'+esc(title)+'</h3><p>'+esc(body)+'</p></div>';
export function photo(p) {
  const path=String(p.image || '');
  return esc(/^(https?:\/\/|\/images\/)/i.test(path) ? path : '/images/1.jpg');
}
export async function api(action,fields={}) {
  const response=await fetch('/api/index',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({...fields,action})});
  let data; try{data=await response.json()}catch{throw Error('El servidor no devolvió una respuesta válida.')}
  if(!response.ok||data.error)throw Error(data.error || 'No se pudo completar la operación.');
  return data;
}
let toastTimer;
export function toast(message){clearTimeout(toastTimer);$('#aviso').textContent=message;toastTimer=setTimeout(()=>$('#aviso').textContent='',3700)}
export function modal(title,content){
  $('#dialogtitle').textContent=title;$('#dialogbody').innerHTML=content;
  if(!$('#dialogo').open)$('#dialogo').showModal();
}
export const close = ()=>$('#dialogo').close();
export const errorBox='<div role="alert" class="error"></div>';
export const field=(label,name,val='',attrs='')=>'<label class="field">'+esc(label)+'<input name="'+name+'" value="'+esc(val)+'" '+attrs+'></label>';
export const option=(val,label,selected)=>'<option value="'+esc(val)+'" '+(String(val)===String(selected)?'selected':'')+'>'+esc(label)+'</option>';
export function bind(form,handler) {
  form.onsubmit=async e=>{
    e.preventDefault();const btn=e.submitter || $('button[type=submit]',form);
    if(form.dataset.busy)return;form.dataset.busy='1';if(btn)btn.disabled=true;
    const error=$('.error',form);if(error)error.textContent='';
    try{await handler(Object.fromEntries(new FormData(form)),e.submitter)}
    catch(err){if(error)error.textContent=err.message;else toast(err.message)}
    finally{delete form.dataset.busy;if(btn)btn.disabled=false}
  }
}
export async function loadCatalog(){const c=await api('catalog');state.products=c.products;state.categories=c.categories}
