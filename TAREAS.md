# Fichas para GitHub Issues

Cada fila corresponde a un Issue que el grupo puede crear en GitHub. Copien el título, el alcance y la prueba de aceptación. En **Assignees**, seleccionen a la persona que se hará cargo. Los códigos T01 a T15 identifican estas fichas; GitHub asignará sus propios números.

Si son tres, A puede trabajar en la tienda, B en operaciones y C en cuentas y control. Si son dos, A puede tomar el registro y el pago, y B puede tomar permisos y panel. Repartan también la puesta en marcha y las pruebas. Anoten en el README los nombres y usuarios una vez acordado el reparto.

| Ficha y título | Alcance de la tarea | Se cierra cuando… | Responsable sugerido (3 / 2) |
|---|---|---|---|
| T01 · Revisar el análisis | Describir los clientes del comercio y acordar reglas e historias. | Otro integrante puede ubicar cada rol, diez historias con dos criterios y tres reglas propias en el README. | A / A |
| T02 · Publicar desde GitHub | Crear el repositorio público, incorporar al grupo, conectar Vercel y registrar el enlace. | Un dispositivo sin sesión abre la tienda desde la URL y puede cargar el catálogo. | C / B |
| T03 · Conectar PostgreSQL | Crear la base externa y configurar la conexión del servidor. | Un cambio de stock hecho por un empleado se ve desde otra sesión y se conserva después de un nuevo despliegue. | B / B |
| T04 · Preparar la demostración | Inicializar el catálogo y las cuentas ficticias. | Hay por lo menos 12 productos en tres categorías y cada cuenta abre las opciones que le corresponden. Las credenciales están en el archivo privado del aula. | B / B |
| T05 · Registro, ingreso y perfil | Crear clientes y permitir que editen teléfono y dirección. | Un registro nuevo siempre es Cliente. Dos altas con el mismo correo se rechazan y los cambios del perfil persisten al reingresar. | C / A |
| T06 · Comprobar permisos del servidor | Revisar cada operación protegida con clientes, personal y cuentas inactivas. | Un cliente recibe una denegación al consultar el panel y al abrir un pedido ajeno. Una cuenta dada de baja no puede operar. | C / B |
| T07 · Recorrer el catálogo | Mostrar el detalle de cada producto y combinar la búsqueda con el filtro. | Al buscar dentro de una categoría aparecen sólo coincidencias disponibles. Un producto dado de baja desaparece de la tienda. | A / A |
| T08 · Armar el carrito | Agregar y quitar unidades y mostrar el importe de productos. | El cálculo cambia cuando se edita una cantidad y quitar todas las unidades deja el carrito vacío. El stock se mantiene. | A / A |
| T09 · Registrar la compra | Confirmar artículos, destino y envío fijo al crear el pedido. | Queda Pendiente con sus precios y dirección. Un pedido con cantidad excesiva o destino vacío se rechaza. | A / A |
| T10 · Aprobar o rechazar el pago | Comprobar reintento y descuento de stock dentro de una transacción. | El rechazo permite reintentar. Si falla la segunda línea de un pedido, la primera conserva su stock y el pedido sigue pendiente. | A / A |
| T11 · Consultar el historial del cliente | Mostrar productos, cantidades, precios, envío y estado. | Cada cliente ve sólo sus pedidos. Cambiar un precio del catálogo conserva el valor del pedido anterior. | A / A |
| T12 · Gestionar carta y reposición | Mantener categorías y productos y consultar el stock bajo. | Crear, modificar y desactivar funciona para ambos tipos de registro. Un stock igual al mínimo aparece en la alerta y sale al reponerlo. | B / B |
| T13 · Operar los pedidos | Aplicar transiciones, filtros de estado, cancelación y trazabilidad. | El personal puede llegar a Entregado en orden. Una cancelación permitida conserva motivo y, si ya se había pagado, repone exactamente las unidades. | B / B |
| T14 · Administrar usuarios e indicadores | Probar cambios de rol, baja, protección del último administrador y resultados del panel. | El cambio de rol se aplica en el servidor. El último administrador permanece activo. Aprobar y cancelar un pedido produce los cambios esperados en los indicadores. | C / B |
| T15 · Ensayar en la URL publicada | Ejecutar los doce pasos de DEFENSA.md y repartir la exposición. | Cada paso tiene evidencia observada en Vercel y cada integrante puede explicar una tarea propia mostrando el commit y el código. | C / A |

Antes de cerrar, dejen un comentario con el caso probado, resultado y enlace al commit o PR del integrante. Si usan `Closes #N` en el commit o en la descripción del PR, reemplacen N por el número real de GitHub. Revisen que cada integrante tenga por lo menos tres Issues cerrados con sus propios commits relacionados.
