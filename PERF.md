# Registro de rendimiento

Medición: `npm run build`, misma estación local y compilación Vite de producción.

| Cambio | Antes → después | Veredicto | Motivo |
|---|---:|---|---|
| Carga diferida de modales y gráfica | JS inicial 208,39 kB gzip → 87,07 kB gzip | Conservado | Reducción de 58%; presupuesto < 200 kB cumplido |
| Gráfica solo con serie temporal | Recharts fuera del chunk inicial; 107,25 kB gzip bajo demanda | Conservado | La dependencia se descarga cuando existe información que graficar |
| CSS del laboratorio premium | 7,01 kB gzip → 9,61 kB gzip | Conservado | +2,60 kB por estados responsive, foco, evidencia y diálogos; CSS total sigue < 50 kB |
| Consola de datos públicos | JS inicial 87,07 → 87,69 kB gzip; CSS 9,61 → 10,75 kB gzip | Conservado | La consola permanece en un chunk diferido de 7,62 kB gzip y el presupuesto inicial sigue cumplido |

Los nombres de archivos incluyen hash y pueden cambiar entre compilaciones; los tamaños gzip son el guard verificable.

## Integración de datos públicos

- Caché: memoria por proceso, TTL 30 minutos, máximo 32 combinaciones `fuente:asentamiento`.
- Antiestampida: llamadas concurrentes a la misma combinación comparten una única promesa.
- Límites: 1,5 MB por respuesta, 18 segundos por proveedor y 50 eventos USGS como máximo.
- Estrategia: la sincronización es explícita desde el observatorio; la carga inicial no consulta proveedores externos.
