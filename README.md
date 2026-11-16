# Food Store

Trabajo Práctico Integrador de Organización Empresarial · Tecnicatura Universitaria en Programación · UTN Facultad Regional Mendoza · 2026.

## El negocio

Food Store vende comida a personas que eligen qué pedir desde su teléfono o computadora.  
El cliente necesita conocer los productos disponibles, el precio y cuánto pagará con envío.  
El carrito le permite comparar opciones y ajustar cantidades antes de hacer el pedido.  
Cuando confirma la compra, la tienda registra lo solicitado y conserva los precios de ese momento.  
El pago es simulado. Su aprobación compromete las unidades que el personal podrá preparar.  
El empleado coordina la preparación, la salida y la entrega, y puede consultar qué pasó ante un reclamo.  
El responsable del comercio controla quién puede operar y consulta las ventas para decidir qué reponer.

## Grupo y publicación

Completen la tabla con los datos y las tareas efectivamente realizadas. Si son dos, eliminen la tercera fila.

| Integrante | Usuario de GitHub | Parte que implementó y comprobó |
|---|---|---|
| [Nombre y apellido] | [@usuario] | [Issues y commits] |
| [Nombre y apellido] | [@usuario] | [Issues y commits] |
| [Tercer integrante, si corresponde] | [@usuario] | [Issues y commits] |

**Tienda publicada en Vercel** · Pendiente de cargar el enlace y verificarlo en incógnito.  
**Repositorio público en GitHub** · [luchi280508-star/food-store-utn](https://github.com/luchi280508-star/food-store-utn).

## Funciones y permisos

| Quién opera | Decisiones a su cargo |
|---|---|
| Visitante | Puede consultar y filtrar el catálogo, ver el detalle y armar un carrito. Para generar un pedido necesita registrarse e ingresar. |
| Cliente | Puede comprar, aprobar o rechazar su pago simulado y seguir sus pedidos. Puede cancelar un pedido propio pendiente y actualizar su teléfono y dirección. |
| Empleado | Mantiene productos, categorías y existencias. Consulta todos los pedidos, los filtra y registra el avance o una cancelación permitida. Puede recorrer el catálogo y armar un carrito. |
| Superadmin | Tiene acceso a la operación del empleado. También administra cuentas, asigna roles y consulta ventas, pedidos por estado y producto más vendido. |

Cada cuenta tiene un solo rol. El alta pública siempre crea un Cliente. El servidor verifica el permiso para cada operación y, en el caso del cliente, también la propiedad del pedido. De ese modo se separan tres decisiones de negocio: solicitar una compra, preparar mercadería y otorgar permisos.

## Ciclo del pedido

| Origen | Acción y responsable | Destino | Efecto |
|---|---|---|---|
| Carrito | El cliente registra su pedido con una dirección de entrega | Pendiente | Se comprueba disponibilidad y se guardan cantidades, precios y envío fijo de $1.500 argentinos. |
| Pendiente | El cliente rechaza el pago simulado | Pendiente | Puede reintentar. Las existencias se mantienen. |
| Pendiente | El cliente aprueba el pago y el sistema comprueba todas las líneas | Confirmado | Se descuentan todas las unidades juntas. |
| Confirmado | El empleado o superadmin inicia la preparación | En preparación | El historial identifica al operador y el momento. |
| En preparación | El empleado o superadmin despacha el pedido | En camino | El cliente puede seguir el avance. |
| En camino | El empleado o superadmin registra la recepción | Entregado | El pedido queda cerrado. |
| Pendiente, Confirmado o En preparación | Un usuario autorizado cancela con motivo | Cancelado | En Pendiente no hay mercadería que devolver. En los demás casos se reintegran las unidades. |

## Historias y criterios de aceptación

| Como… quiero… para… | Primera comprobación | Segunda comprobación |
|---|---|---|
| Visitante, quiero encontrar un plato para elegir mi almuerzo. | Al filtrar por categoría veo únicamente productos de esa categoría disponibles para la venta. | Puedo buscar por nombre y abrir su detalle con foto y precio. |
| Visitante, quiero ajustar el carrito para decidir cuánto gastar. | Cambiar una cantidad modifica el total de productos. | Quitar el último artículo deja el carrito vacío y conserva el stock. |
| Cliente, quiero registrar mi compra para que el comercio sepa qué entregar. | El pedido pendiente guarda artículos, cantidades, dirección, precios y envío fijo. | Si la cantidad supera el stock, el pedido se rechaza. |
| Cliente, quiero reintentar un pago para conservar lo que elegí. | Al rechazar, mi pedido sigue pendiente y el stock se mantiene. | Al aprobar con existencias suficientes, pasa a Confirmado y cada línea se descuenta una vez. |
| Cliente, quiero consultar mis pedidos y actualizar mi dirección para organizar mis compras. | Mi historial muestra mis pedidos y sus precios originales. | Puedo cambiar teléfono y dirección. El correo se conserva. |
| Empleado, quiero identificar existencias críticas para decidir qué reponer. | En la lista de stock bajo aparece un producto cuyo stock es exactamente el mínimo. | Cuando lo repongo por encima del mínimo, sale de la lista. |
| Empleado, quiero actualizar la carta para ofrecer lo que se prepara hoy. | Puedo cambiar nombre, categoría, precio y disponibilidad del producto. | Si lo doy de baja, desaparece del catálogo y su línea sigue visible en una venta anterior. |
| Empleado, quiero registrar el despacho para responder consultas del cliente. | Sólo puedo avanzar un paso por vez desde Confirmado. | El historial conserva operador y fecha de cada cambio, y el motivo de las cancelaciones. |
| Superadmin, quiero mantener las cuentas del personal para que cada persona tenga acceso acorde con su función. | Puedo crear una cuenta, modificarla y darle de baja conservando su historial. | Si queda un solo superadmin activo, el sistema impide quitarle el rol o desactivarlo. |
| Superadmin, quiero conocer el resultado de las ventas para planificar la oferta. | El panel muestra el monto de los pedidos pagados vigentes y cuántos pedidos hay por estado. | Puedo identificar el producto con más unidades vendidas. Una compra cancelada deja de contribuir a las ventas vigentes. |

## Reglas de negocio

| Regla | Condición que la tienda hace cumplir |
|---|---|
| R1 · Pago íntegro | Al aprobar se comprueba el stock de todos los productos. Si falta uno, el pedido sigue pendiente y ninguna línea se descuenta. |
| R2 · Reintento | Rechazar el pago conserva el pedido pendiente y permite otro intento. |
| R3 · Existencias | El stock nunca es negativo. Cancelar luego del descuento devuelve al inventario las cantidades compradas. |
| R4 · Precio histórico | Cada línea conserva el precio unitario pactado aunque cambie la carta. |
| R5 · Trazabilidad | El avance respeta el orden del circuito. Los cambios registran quién y cuándo. La cancelación exige un motivo. |
| R6 · Cancelaciones | El cliente cancela su pedido en Pendiente. El empleado puede cancelar en Pendiente y Confirmado. El superadmin también puede hacerlo en preparación. En camino, entregado o cancelado ya no se cancela. |
| R7 · Privacidad | Un cliente sólo accede a sus propios pedidos y datos. |
| R8 · Control de acceso | El servidor comprueba la identidad, vigencia de la cuenta y permiso para la acción solicitada. |
| R9 · Contraseñas | Se guardan mediante hash con sal. El inicio de sesión verifica la contraseña recibida contra ese valor. |
| R10 · Continuidad | Siempre debe quedar un superadmin activo para administrar las cuentas. |
| R11 · Baja lógica | La baja de un producto lo quita de la venta y preserva las líneas de pedidos anteriores. |
| Propia 1 · Identidad | Un correo identifica una sola cuenta. Se rechaza el segundo registro con ese correo. |
| Propia 2 · Unidades | Un pedido sólo acepta cantidades enteras mayores que cero. Se rechazan cantidades negativas o fraccionarias. |
| Propia 3 · Entrega | Para registrar el pedido se requiere una dirección de destino con contenido. |

## Tecnologías y uso

El navegador muestra la tienda con HTML, CSS y JavaScript. Una función de Node.js en Vercel comprueba permisos y ejecuta las operaciones del negocio. El servidor usa el controlador `pg` para conectarse a PostgreSQL en Neon. Una transacción agrupa los cambios de stock y de estado para que un fallo conserve los datos previos. La base externa permite que el cliente y el empleado vean el mismo pedido desde distintos dispositivos. Codex se usó para generar esta versión de trabajo.

- [Instalación, datos iniciales y publicación](INSTALACION.md)
- [Fichas para organizar los Issues](TAREAS.md)
- [Registro del trabajo con IA](BITACORA-IA.md)
- [Guion de defensa y pruebas](DEFENSA.md)
