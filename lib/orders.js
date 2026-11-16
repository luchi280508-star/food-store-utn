const { fail, integer, string, bool, requireRole } = require('./validate');
const states = ['Pendiente','Confirmado','En preparación','En camino','Entregado','Cancelado'];
const shipping = 1500;

async function list(db, actor, id, status) {
  requireRole(actor,'Cliente','Empleado','Superadmin');
  const args = [actor.role === 'Cliente' ? actor.id : null, id, status || null];
  const {rows: orders} = await db.query(`
    SELECT o.*, a.name AS customer FROM orders o JOIN accounts a ON a.id=o.user_id
    WHERE ($1::int IS NULL OR o.user_id=$1) AND ($2::int IS NULL OR o.id=$2)
      AND ($3::text IS NULL OR o.status=$3) ORDER BY o.id DESC`,args);
  if (id && !orders.length) fail('Pedido inexistente o sin acceso.',404);
  const ids = orders.map(row => row.id);
  const items = await db.query('SELECT * FROM order_items WHERE order_id=ANY($1::int[]) ORDER BY product_id',[ids]);
  const history = await db.query('SELECT * FROM order_history WHERE order_id=ANY($1::int[]) ORDER BY id',[ids]);
  const byId = new Map(orders.map(o => [o.id,{...o,shipping:Number(o.shipping),total:Number(o.total),items:[],history:[]}]));
  for (const i of items.rows) byId.get(i.order_id).items.push({...i,price:Number(i.price)});
  for (const h of history.rows) byId.get(h.order_id).history.push(h);
  return {orders:[...byId.values()]};
}
async function one(db, actor, id) {
  return {order:(await list(db,actor,id)).orders[0]};
}
async function record(db,id,status,actor,reason='',caption=actor.name) {
  await db.query('INSERT INTO order_history(order_id,status,actor_id,actor,reason) VALUES($1,$2,$3,$4,$5)',
    [id,status,actor.id,caption,reason]);
}
async function checkout(db,actor,data) {
  requireRole(actor,'Cliente');
  const address = string(data.address,'dirección',true,250);
  if (!Array.isArray(data.items) || !data.items.length || data.items.length>100) fail('Revisá el carrito.');
  const quantities = new Map();
  for (const row of data.items) {
    const id = integer(row?.product_id,'producto',1);
    if (quantities.has(id)) fail('El carrito contiene líneas duplicadas.');
    quantities.set(id,integer(row.quantity,'cantidad',1,999));
  }
  const products = await db.query(`SELECT p.* FROM products p JOIN categories c ON c.id=p.category_id
    WHERE p.id=ANY($1::int[]) AND p.active AND c.active ORDER BY p.id FOR SHARE OF p,c`,[[...quantities.keys()]]);
  if (products.rowCount !== quantities.size) fail('Algún producto ya no está disponible.',409);
  let totalCents = shipping * 100;
  for (const p of products.rows) {
    if (p.stock < quantities.get(p.id)) fail('Stock insuficiente para '+p.name+'.',409);
    totalCents += Math.round(Number(p.price)*100)*quantities.get(p.id);
  }
  if (!Number.isSafeInteger(totalCents)) fail('El total del pedido supera el límite.');
  const {rows:[order]} = await db.query("INSERT INTO orders(user_id,address,shipping,total,status) VALUES($1,$2,$3,$4,'Pendiente') RETURNING id",
    [actor.id,address,shipping,(totalCents/100).toFixed(2)]);
  for (const p of products.rows) {
    await db.query('INSERT INTO order_items(order_id,product_id,name,price,quantity) VALUES($1,$2,$3,$4,$5)',
      [order.id,p.id,p.name,p.price,quantities.get(p.id)]);
  }
  await record(db,order.id,'Pendiente',actor);
  return one(db,actor,order.id);
}
async function change(db,actor,data) {
  requireRole(actor,...(data.action==='pay'?['Cliente']:data.action==='advance'?['Empleado','Superadmin']:['Cliente','Empleado','Superadmin']));
  const id = integer(data.id,'pedido',1);
  const {rows:[order]} = await db.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id]);
  if (!order || (actor.role==='Cliente' && order.user_id!==actor.id)) fail('Pedido inexistente o sin acceso.',404);
  let next, reason='', delta=0, caption=actor.name;
  if (data.action==='pay') {
    if (order.status!=='Pendiente') fail('El pedido ya salió de Pendiente.',409);
    if (!bool(data.approve)) return one(db,actor,id);
    next='Confirmado';
    delta=-1;
    caption='Pago simulado · '+actor.name;
  } else if (data.action==='advance') {
    const index=states.indexOf(order.status);
    if (index<1 || index>3) fail('El pedido no admite ese avance.',409);
    next=states[index+1];
  } else {
    const permitted = {Cliente:['Pendiente'],Empleado:['Pendiente','Confirmado'],Superadmin:['Pendiente','Confirmado','En preparación']};
    if (!permitted[actor.role].includes(order.status)) fail('Tu rol no puede cancelar en este estado.',409);
    reason=string(data.reason,'motivo de cancelación');
    next='Cancelado';
    if (order.status!=='Pendiente') delta=1;
  }
  if (delta) {
    const {rows} = await db.query(`SELECT p.id,p.stock,p.name,p.active,c.active AS category_active,i.quantity FROM order_items i
      JOIN products p ON p.id=i.product_id JOIN categories c ON c.id=p.category_id
      WHERE i.order_id=$1 ORDER BY p.id FOR UPDATE OF p FOR SHARE OF c`,[id]);
    for (const row of rows) {
      if (delta<0 && (!row.active || !row.category_active || row.stock<row.quantity)) fail('Sin disponibilidad para '+row.name+'. El pedido sigue pendiente.',409);
    }
    await db.query(`UPDATE products p SET stock=p.stock + i.quantity * $2::int FROM order_items i
      WHERE i.order_id=$1 AND i.product_id=p.id`,[id,delta]);
  }
  await db.query('UPDATE orders SET status=$1 WHERE id=$2',[next,id]);
  await record(db,id,next,actor,reason,caption);
  return one(db,actor,id);
}
module.exports={list,one,checkout,change,states};
