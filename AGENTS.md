# Food Store

Leé README.md para conocer el negocio y DEFENSA.md para ver cómo se comprueba. Trabajá sobre el Issue que indique el integrante y sus criterios de aceptación. Explicá los cambios en español y vinculá la comprobación con una regla del negocio.

## Arquitectura

La interfaz usa HTML, CSS y JavaScript. La API corre en Node.js y accede a PostgreSQL con pg. El destino de publicación es Vercel con una base externa en Neon. Sólo el carrito puede conservarse en el navegador. Los pedidos, cuentas, permisos, precios pactados, historial y stock residen en la base.

## Controles que debe respetar cada cambio

- Consultá identidad, rol activo y propiedad del recurso en el servidor.
- Confirmá los pedidos exclusivamente mediante el pago simulado. Conservá la transacción que engloba todas las líneas y el historial.
- Calculá precios y totales en el servidor y guardá una copia en el pedido.
- Conservá los datos históricos al dar de baja una cuenta, una categoría o un producto.
- Leé credenciales desde variables de entorno. Las cuentas ficticias para el aula se entregan por separado.
- Pedí sólo una decisión de aprobación o rechazo en el pago.
- Al cerrar el Issue, indicá los archivos relevantes, el resultado observado y el caso de error que se comprobó. Documentá quién hizo realmente el cambio.
