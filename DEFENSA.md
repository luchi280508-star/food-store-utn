# Defensa grupal · 15 minutos

Ensayen con la URL pública y datos ficticios. Usen perfiles de navegador distintos para cliente, empleado y superadmin. Dejen visibles el Issue y el commit de cada expositor. Reserven unos siete minutos y medio para el recorrido y el resto para explicar decisiones con el código abierto.

## Preparación

Identifiquen dos productos activos, X e Y, y anoten su precio y stock inicial. Para simplificar las cuentas, elijan productos con al menos cuatro unidades. Dejen preparados un pedido pendiente con X e Y y otro confirmado con X que puedan cancelar. Verifiquen que haya un único superadmin activo para el paso 11. Antes del ensayo y antes de entregar, comprueben desde incógnito y otro dispositivo que Vercel permite entrar y que las tres cuentas funcionan.

## Recorrido en vivo

| Paso | Acción | Qué debe poder ver la cátedra |
|---|---|---|
| 1 · Visitante | Buscar X, filtrar por su categoría, abrir el detalle y armar un carrito. Modificar una cantidad. | Foto, precio y categoría concuerdan con el detalle. El total responde a la cantidad. |
| 2 · Cliente | Registrar una cuenta ficticia, iniciar sesión y hacer un pedido con dirección. | El alta genera un Cliente y el pedido queda Pendiente. Se muestran cantidades, precios y envío. |
| 3 · Cliente | Rechazar el pago, mostrar el stock desde la sesión de empleado y aprobar el mismo pedido. | Tras el rechazo, estado y stock se mantienen. Al aprobar, el pedido queda Confirmado y se descuentan las cantidades exactas. |
| 4 · Cliente | Abrir el historial y editar teléfono y dirección. | Se ven los datos actualizados. El pedido conserva la dirección y los precios de la compra. |
| 5 · Empleado | Filtrar pedidos por estado y avanzar el del paso 3 hasta Entregado. | Se recorre Confirmado → En preparación → En camino → Entregado. En el historial se identifica quién y cuándo hizo cada cambio. |
| 6 · Empleado | Cambiar el precio de uno de los artículos vendidos. | Al consultar el pedido entregado sigue figurando el precio pactado. |
| 7 · Empleado | Dar de baja un tercer producto. Elegir otro producto activo y ajustar su stock para que sea igual al mínimo. | La baja se refleja en el catálogo y el producto activo en el mínimo aparece en la lista de reposición. |
| 8 · Empleado | Cancelar el pedido confirmado preparado para el ensayo y escribir el motivo. | Se identifica el motivo, queda Cancelado y vuelve al stock la cantidad descontada para ese pedido. |
| 9 · Cliente y empleado | En el pedido pendiente con X e Y, anotar el stock de X, poner Y en cero e intentar aprobar con el cliente. | Se informa falta de stock. El pedido sigue Pendiente, X conserva exactamente su cantidad e Y sigue en cero. |
| 10 · Superadmin | Crear una cuenta ficticia, cambiar su rol y darla de baja. Abrir el panel. | El permiso cambia, la baja bloquea el ingreso y el panel muestra el total vendido, pedidos por estado y producto más vendido. |
| 11 · Superadmin | Intentar quitarle el rol al único superadmin activo o desactivarlo. | El servidor rechaza la operación y la cuenta conserva sus permisos. |
| 12 · Cliente | Escribir manualmente la dirección protegida del panel de administración con la sesión del cliente. | El servidor deniega el acceso. El cliente conserva el acceso a sus propias compras. |

## Preguntas para practicar

1. **¿Qué pasaría si dos clientes pagan la última unidad al mismo tiempo?** Abran el código del pago e identifiquen cómo se ordenan los accesos al stock y cuándo se confirma o revierte la transacción.
2. **¿Por qué sólo el pago confirma el pedido?** Relacionen el cambio con el momento en que la empresa compromete mercadería. Muestren qué transiciones se permiten al empleado.
3. **¿Por qué se guarda el precio en cada línea?** Usen el ejemplo del paso 6 para distinguir el precio acordado y el precio actual.
4. **¿Qué pasa con las ventas anteriores al dar de baja un producto o usuario?** Muestren dónde se sigue consultando esa compra y qué impide volver a usar el registro dado de baja.
5. **¿Dónde se comprueban propiedad y rol?** Abran el código de una acción que maneje pedidos y expliquen qué control faltaría si sólo se ocultara el botón.
6. **¿Por qué se usa PostgreSQL externo?** Expliquen cómo las sesiones de dos navegadores ven la misma venta y qué ocurre con los datos cuando se vuelve a publicar la app.
7. **¿Cómo se calcula el total vendido?** Sigan un pedido pagado cuyo importe conocen y expliquen cómo influye en el panel antes y después de cancelarlo.
8. **¿Qué le corrigieron al agente?** Cada integrante elige una entrada real de su bitácora, la relaciona con un Issue propio y muestra la evidencia de su prueba.

## Cierre

Revisen el historial de contribuciones por persona, la asignación y el cierre de Issues y la bitácora. Completen el archivo privado para el aula con apellidos reales, usuarios, las dos URL y las credenciales ficticias. Guárdenlo fuera del repositorio público.
