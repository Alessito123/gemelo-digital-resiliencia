# Modelo de amenazas conciso

## Activos

- Clave de Gemini y presupuesto de consumo.
- Integridad de resultados, protocolos y etiquetas de evidencia.
- Datasets de investigación importados en memoria.
- Disponibilidad del servidor y de la simulación.

## Límites de confianza

1. Navegador → Express: JSON y archivos elegidos por el usuario son no confiables.
2. Express → Gemini: los datos pueden contener inyección de prompt.
3. Gemini → Express → React: la salida del modelo es no confiable hasta validar su forma.
4. Portal externo de datasets: enlace informativo; el servidor no descarga URLs proporcionadas por usuarios.
5. Express → OSM/USGS/NASA: las respuestas públicas son externas y no confiables hasta su normalización.

## Abusos y controles

| Riesgo STRIDE | Escenario | Control |
|---|---|---|
| Manipulación | Porcentajes fuera de rango o metadata falsa | Validación en el seam de importación; procedencia obligatoria |
| Divulgación | Traza o secreto expuesto en error | Errores estructurados y genéricos; secretos solo por entorno |
| Denegación | Cuerpos enormes o llamadas repetidas a IA | 64 KB en HTTP, 1 MB en archivo, 5.000 filas y 15 solicitudes/minuto/IP |
| Elevación/Agencia | Respuesta LLM usada como comando | Solo texto validado; no `eval`, shell, SQL ni HTML sin escapar |
| Suplantación de evidencia | Dataset sintético marcado como prueba real | Nivel visible y limitaciones; la autenticidad de la fuente requiere revisión humana |
| Repudio | Resultado imposible de repetir | Semilla, configuración, fuente, fecha y licencia visibles |
| SSRF | Manipular el conector para consultar red interna | IDs y asentamientos permitidos; orígenes HTTPS fijos; no se acepta URL del cliente; redirecciones prohibidas |
| Denegación externa | Respuesta enorme, servicio lento o estampida de caché | 1,5 MB, timeout de 18 s, caché acotada a 32 entradas y una promesa en vuelo por fuente/asentamiento |
| Datos externos corruptos | Coordenadas, magnitudes o conteos malformados | Parsers con rangos, listas permitidas, descarte de registros inválidos y salida normalizada |

## Riesgos residuales

- No hay autenticación porque el prototipo no persiste datos ni expone administración. Antes de añadir almacenamiento multiusuario se requieren identidad, autorización y auditoría.
- La clasificación `observed` es declarada por quien importa el archivo; el software no puede certificar su autenticidad.
- El limitador en memoria opera por proceso. Un despliegue distribuido requiere un almacén compartido.
- La caché de datos públicos es por proceso y admite hasta 30 minutos de antigüedad; un despliegue distribuido debería usar caché compartida y observabilidad de proveedores.
- OSM es colaborativo, USGS es contexto regional y POWER es señal satélite/modelo; ninguno sustituye cartografía validada, microzonificación o estaciones locales.
