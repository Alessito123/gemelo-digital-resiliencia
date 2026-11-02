# Interfaz React sobre motor Python

React reemplaza la entrada Streamlit como interfaz principal. Se conservan Streamlit y el frontend histórico como referencias, sin borrar su implementación. Las decisiones de simulación, ML y asistente se ejecutan exclusivamente mediante los contratos actuales de FastAPI. Vite reenvía /api a la API local configurable; la compilación se puede servir desde FastAPI.

Capacidades: ES/EN, blanco/negro, navegación con guía de requisitos, maqueta Three.js con estados temporales individuales y selección accesible, configuración y observaciones opcionales, métricas/traza/exportación/protocolo, metodología CRISP-DM, EDA, entrenamiento asíncrono 5×5, ranking/parámetros/estadística/predicción, consultas públicas y chat flotante contextual. Las vistas pesadas usan importación diferida. Se cancelan consultas abandonadas y se limpian WebGL y temporizadores. Errores y ausencia de ejecución se explican; no se presentan resultados históricos como entrenamientos activos.

Verificación: TypeScript, compilación Vite, suite Python y navegación real de simulación, guía, EDA, entrenamiento/predicción y chat. Se preservan las limitaciones científicas y la separación entre incendios observados y población sintética.

## Exportación de figuras

Cada visualización ofrece PNG de 1920 o 3840 px de ancho. Three.js renderiza la escena de nuevo, conservando cámara, selección, capas y estados temporales, y restaura el visor después de capturar. La imagen incluye título, leyenda y aclaración de maqueta sintética. El navegador limita las dimensiones según capacidad gráfica para evitar fallos de memoria e informa las dimensiones efectivas.

Histograma, matriz de correlaciones, comparación de modelos y dispersión real/predicha se descargan como PNG de alta resolución o SVG vectorial. Los archivos incorporan estilos, título y procedencia, sin barras de herramientas ni chat. Se conserva el tema actual. La resolución se expresa en píxeles, sin prometer una densidad física de impresión que no se haya codificado.

## Tablas y lectura científica

Todas las tablas del frontend activo requieren título, explicación, interpretación y procedencia en su contrato. Descargan XLSX con los registros completos de esa tabla en «Datos» y el contexto en «Lectura». Se preservan números, booleanos, identificadores textuales, nulos y todas las columnas. No se convierten entradas externas en fórmulas ni enlaces ejecutables. Una muestra de 30 registros exporta esos 30, sin presentarse como dataset completo.

Las figuras y la maqueta muestran explicación e interpretación, también incorporadas a sus PNG/SVG. La lectura numérica depende del experimento activo y distingue resultados sintéticos, benchmark observado, selección y significancia. La guía integra un cotejo de los IDs de la revisión docente, sin declarar realizado un depósito, una validación de usuarios o una corrección de manuscrito no verificada.
