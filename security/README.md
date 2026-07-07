# security/ — herramientas de evaluación de seguridad

Utilidades para auditar el despliegue de Quelita. Complementan las suites de
regresión en `backend/src/__tests__/security/` (esas corren en CI con Mongo en
memoria; esto sondea un despliegue **en vivo**).

## `live-scan.mjs` — escáner activo de caja negra

Batería automatizada contra un despliegue real: security headers, política CORS
(incluye orígenes maliciosos y bypass por sufijo), bypass de rate-limit vía
claim `role` no verificado, acceso no autenticado a rutas protegidas, JWT
`alg:none`/basura, inyección NoSQL en login, info disclosure, traversal en
`/uploads` y enumeración de usuarios.

```bash
# No-mutante (solo lectura + probes que fallan a propósito):
node security/live-scan.mjs http://192.168.6.14

# --deep: incluye pruebas que CREAN datos (orden de prueba para IDOR):
node security/live-scan.mjs http://192.168.6.14 --deep
```

- Requiere **Node 18+** (usa `fetch` global). Sin dependencias.
- Imprime un resumen rankeado por severidad y escribe `scan-results.json` con
  toda la evidencia (incluidos los checks que pasaron).
- La IP de la VM es DHCP: si cambió, pasá la nueva como primer argumento (ver
  `DEPLOY-VM.md` → "Paso 0" para escanearla).

## Alcance y ética

Estas herramientas son para auditar **infraestructura propia y autorizada**
(la VM de test / futuros VPS del proyecto). No apuntar a sistemas de terceros.
`scan-results.json` puede contener detalles sensibles del despliegue: tratarlo
como material interno (queda fuera del alcance de commits si lo añades a
`.gitignore`).

## Ver también

- `SECURITY-ASSESSMENT-2026-07.md` (raíz) — reporte de hallazgos + remediación.
- `PERF-VM-REPORT.md` (raíz) — tiempos de carga / UX.
- `backend/src/__tests__/security/` — regresión (injection, IDOR, mass-assignment, headers/CORS, hardening).
