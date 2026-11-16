# Abrir la tienda y preparar la entrega

## Probar en esta computadora

Abrí `Abrir-tienda.cmd` desde la carpeta del proyecto en Windows. Cuando la consola indique que está lista, entrá en http://127.0.0.1:3180. Para copiar el proyecto a otra computadora, descomprimí el ZIP e instalá primero Node.js 24 con npm. La instalación inicial descarga PostgreSQL para la demo y requiere internet.

En macOS o Linux, desde la raíz del proyecto con Node.js 24:

```sh
npm ci
npm ci --prefix local
npm run demo
```

La demo levanta un servidor PostgreSQL accesible sólo desde esta computadora. Los pedidos se conservan al reiniciar. Las cuentas ya están cargadas. Buscá sus contraseñas en el archivo privado `.local/claves.json` que genera la primera ejecución.

| Rol | Correo | Campo de la contraseña en el archivo |
|---|---|---|
| Cliente | cliente@foodstore.example | DEMO_CLIENT_PASSWORD |
| Empleado | empleado@foodstore.example | DEMO_STAFF_PASSWORD |
| Superadmin | admin@foodstore.example | DEMO_ADMIN_PASSWORD |

Para ensayar, abrí la tienda en dos perfiles de navegador. En uno comprá como cliente y en el otro consultá el pedido como empleado. La carpeta `.local` contiene datos y claves de la demo y queda excluida de Git y del despliegue.

## Publicar con cuentas del equipo

1. En GitHub, creen un repositorio público o usen el repositorio del proyecto si ya está creado. Suban el contenido de esta carpeta como raíz. Agreguen como colaboradores a los demás integrantes. El archivo privado para el aula queda fuera del repositorio.
2. Creen un proyecto PostgreSQL en Neon. Desde **Connect**, copien en privado su cadena de conexión con agrupación de conexiones y TLS. Mantengan los parámetros de conexión que indica Neon. [Conexión a Neon](https://neon.com/docs/connect/connect-from-any-app)
3. En la computadora, copien `.env.example` con el nombre `.env`. Completen `DATABASE_URL` con esa cadena y elijan tres contraseñas inventadas distintas de al menos ocho caracteres en los campos `DEMO_…_PASSWORD`.
4. Desde la carpeta del proyecto ejecuten `npm ci` y `npm run seed`. Esto crea las tablas, doce productos, tres categorías y las cuentas ficticias en la base seleccionada. Al volver a ejecutarlo conserva los productos y las cuentas existentes. Para revisar esa base desde la compu se puede usar `npm start` con el puerto 3180 libre.
5. En Vercel, importen ese repositorio como proyecto personal. Seleccionen el preset **Other**, la raíz del repositorio y Node.js 24. El archivo `vercel.json` señala `public` como salida. La función vive en `api/index.js`. En las variables de entorno de producción, carguen únicamente `DATABASE_URL` y desplieguen. Si cambian esa variable, hagan un nuevo deploy. [Funciones de Node.js en Vercel](https://vercel.com/docs/functions/runtimes/node-js)
6. Abran la URL publicada en incógnito y prueben las tres cuentas y el guion de `DEFENSA.md`. Anoten el enlace en el README. Si la página abre pero el catálogo falla, revisen la variable, los logs de la función y que el seed haya corrido contra esa misma base.
7. Completen las fichas de GitHub con el responsable real. Cada integrante registra sus cambios, sus pruebas y sus decisiones en la bitácora. Completen la plantilla privada para el aula con enlaces, nombres y claves de las cuentas **de la base publicada**.

## Mapa para la defensa

| Pregunta | Dónde mirar |
|---|---|
| ¿Quién puede entrar al panel? | `api/index.js` valida la sesión y la ruta del panel. `lib/validate.js` contiene las comprobaciones de rol. |
| ¿Cuándo baja el stock? | `lib/orders.js` bloquea las filas del pedido y productos antes de aprobar el pago. La función API confirma o revierte la transacción. |
| ¿Cómo se conserva el precio? | `db/schema.sql` define `order_items`. El checkout copia el precio del catálogo a esa tabla. |
| ¿De dónde salen los indicadores? | `lib/catalog.js` calcula los tres indicadores sobre la base. |
| ¿Dónde se guardan las claves? | `lib/security.js` transforma las contraseñas en hashes. La conexión se obtiene de una variable de entorno del servidor. |

