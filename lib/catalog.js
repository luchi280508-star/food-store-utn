const { fail,string,integer,bool,requireRole } = require('./validate');
const {states} = require('./orders');

async function read(db,actor,staff) {
  if (staff) requireRole(actor,'Empleado','Superadmin');
  const categories=await db.query('SELECT * FROM categories '+(staff?'':'WHERE active ')+'ORDER BY id');
  const products=await db.query(`SELECT p.*,c.name AS category FROM products p JOIN categories c ON c.id=p.category_id
    ${staff?'':'WHERE p.active AND c.active AND p.stock>0'} ORDER BY p.id`);
  return {products:products.rows.map(p=>({...p,price:Number(p.price)})),categories:categories.rows};
}
async function save(db,actor,data) {
  requireRole(actor,'Empleado','Superadmin');
  const name=string(data.name,'nombre',true,120),active=bool(data.active);
  const id=data.id==null?null:integer(data.id,'identificador',1);
  let result;
  if (data.action==='category') {
    result=id?await db.query('UPDATE categories SET name=$1,active=$2 WHERE id=$3',[name,active,id]):
      await db.query('INSERT INTO categories(name,active) VALUES($1,$2)',[name,active]);
  } else {
    const price=String(data.price);
    if (!/^\d{1,9}(\.\d{1,2})?$/.test(price)) fail('Ingresá un precio positivo o cero, con hasta dos decimales.');
    const image=string(data.image,'imagen',true,1500);
    if (!/^https?:\/\//i.test(image) && !/^\/images\/[\w.\/-]+$/.test(image)) fail('Ingresá una URL de imagen válida.');
    const values=[name,active,integer(data.category_id,'categoría',1),price,integer(data.stock,'stock'),integer(data.min_stock,'stock mínimo'),
      string(data.description,'descripción',true,1200),image];
    result=id?await db.query('UPDATE products SET name=$1,active=$2,category_id=$3,price=$4,stock=$5,min_stock=$6,description=$7,image=$8 WHERE id=$9',[...values,id]):
      await db.query('INSERT INTO products(name,active,category_id,price,stock,min_stock,description,image) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',values);
  }
  if (!result.rowCount) fail('El registro no existe.',404);
  return {ok:true};
}
async function dashboard(db,actor) {
  requireRole(actor,'Superadmin');
  const counts=Object.fromEntries(states.map(s=>[s,0]));
  const grouped=await db.query('SELECT status,count(*) AS n FROM orders GROUP BY status');
  for (const row of grouped.rows) counts[row.status]=Number(row.n);
  const paid="o.status IN ('Confirmado','En preparación','En camino','Entregado')";
  const {rows:[{total}]}=await db.query('SELECT coalesce(sum(o.total),0) AS total FROM orders o WHERE '+paid);
  const {rows:[top]}=await db.query(`SELECT p.name,sum(i.quantity) AS quantity FROM order_items i
    JOIN orders o ON o.id=i.order_id JOIN products p ON p.id=i.product_id WHERE ${paid}
    GROUP BY p.id,p.name ORDER BY quantity DESC,p.id LIMIT 1`);
  return {total:Number(total),counts,top:top?{name:top.name,quantity:Number(top.quantity)}:null};
}
module.exports={read,save,dashboard};
