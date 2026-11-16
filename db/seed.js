const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const { hashPassword } = require('../lib/security');

const menu = [
  ['Muzzarella', 'Salsa de tomate, muzzarella y orégano.', 9500],
  ['Napolitana', 'Tomates frescos, ajo, muzzarella y perejil.', 10800],
  ['Fugazzeta', 'Cebolla al horno, muzzarella y aceite de oliva.', 11200],
  ['Cuatro quesos', 'Muzzarella, provolone, parmesano y queso azul.', 12500],
  ['Empanada de carne', 'Carne cortada a cuchillo, cebolla y pimentón.', 1800],
  ['Empanada de pollo', 'Pollo desmenuzado con morrón asado.', 1650],
  ['Empanada de humita', 'Choclo cremoso y cebolla de verdeo.', 1600],
  ['Empanada de jamón y queso', 'Jamón cocido y muzzarella en masa al horno.', 1700],
  ['Flan casero', 'Flan de vainilla con caramelo.', 2800],
  ['Brownie', 'Chocolate semiamargo con una costra crocante.', 3200],
  ['Tiramisú', 'Vainillas al café con crema de mascarpone y cacao.', 4100],
  ['Cheesecake', 'Crema de queso con frutos rojos y base de galletitas.', 3800],
];
async function seed() {
  const db = new Client({connectionString: process.env.DATABASE_URL});
  if (!process.env.DATABASE_URL) throw Error('Configurá DATABASE_URL.');
  await db.connect();
  try {
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock(80391)');
    await db.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    for (const [name, role, variable] of [
      ['cliente', 'Cliente', 'DEMO_CLIENT_PASSWORD'],
      ['empleado', 'Empleado', 'DEMO_STAFF_PASSWORD'],
      ['admin', 'Superadmin', 'DEMO_ADMIN_PASSWORD'],
    ]) {
      const email = name + '@foodstore.example';
      if ((await db.query('SELECT id FROM accounts WHERE email=$1', [email])).rowCount) continue;
      const password = process.env[variable];
      if (!password || password.length < 8) throw Error('Configurá ' + variable + ' con al menos 8 caracteres.');
      await db.query('INSERT INTO accounts(name,email,role,password_hash) VALUES ($1,$2,$3,$4)',
        [role + ' de prueba', email, role, await hashPassword(password)]);
    }
    // El catálogo inicial se carga una sola vez; reejecutar conserva las ediciones del equipo.
    if (!(await db.query('SELECT id FROM products LIMIT 1')).rowCount) {
      const ids = [];
      for (const category of ['Pizzas','Empanadas','Postres']) {
        const result = await db.query('INSERT INTO categories(name) VALUES ($1) ON CONFLICT(name) DO UPDATE SET name=excluded.name RETURNING id',[category]);
        ids.push(result.rows[0].id);
      }
      for (const [index, [name, description, price]] of menu.entries()) {
        await db.query('INSERT INTO products(name,description,price,category_id,image,stock,min_stock) VALUES($1,$2,$3,$4,$5,$6,3)',
          [name,description,price,ids[Math.floor(index/4)],'/images/'+(index+1)+'.jpg',index===6?3:20]);
      }
    }
    await db.query('COMMIT');
    console.log('Esquema y datos iniciales listos.');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally { await db.end(); }
}
seed().catch(error => { console.error(error.message); process.exitCode = 1; });
