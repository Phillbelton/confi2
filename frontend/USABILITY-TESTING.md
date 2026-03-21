# 🧪 Usability Testing Guide - Confitería Quelita

**Versión:** 1.0.0
**Última actualización:** 3 de Diciembre, 2025
**Objetivo:** Validar la experiencia de usuario antes del deploy a producción

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Objetivos del Testing](#objetivos-del-testing)
3. [Preparación](#preparación)
4. [Reclutamiento de Participantes](#reclutamiento-de-participantes)
5. [Tareas de Prueba](#tareas-de-prueba)
6. [Protocolo de Testing](#protocolo-de-testing)
7. [Métricas y Observables](#métricas-y-observables)
8. [Template de Reporte](#template-de-reporte)
9. [Análisis y Priorización](#análisis-y-priorización)
10. [Checklist Pre-Deploy](#checklist-pre-deploy)

---

## 🎯 Introducción

Esta guía te ayudará a realizar **tests de usabilidad** con usuarios reales para identificar problemas y oportunidades de mejora antes del lanzamiento en producción.

### ¿Por qué Testing de Usabilidad?

- ✅ **Detectar problemas** antes que los usuarios reales
- ✅ **Validar decisiones de diseño** con feedback real
- ✅ **Mejorar conversión** al eliminar fricciones
- ✅ **Reducir costos** de soporte post-lanzamiento

### Recursos Necesarios

- **Tiempo:** 6 horas totales (2h prep + 3h tests + 1h análisis)
- **Participantes:** 3-5 usuarios
- **Equipo:** 1 moderador (tú) + 1 observador opcional
- **Herramientas:** Grabación de pantalla, notas, dispositivos móviles

---

## 🎯 Objetivos del Testing

### Objetivos Principales

1. **Validar flujo de compra completo**
   - ¿Los usuarios pueden encontrar y comprar productos?
   - ¿El checkout es claro y sin fricciones?

2. **Evaluar navegación y arquitectura de información**
   - ¿Los usuarios encuentran lo que buscan?
   - ¿Los filtros son intuitivos?

3. **Medir percepción de marca y calidad**
   - ¿La UI se siente premium?
   - ¿Genera confianza para comprar?

4. **Identificar problemas técnicos**
   - ¿Hay bugs o errores?
   - ¿La performance es aceptable?

### Métricas de Éxito

- **Task Success Rate:** >80% (4 de 5 tareas completadas)
- **Time on Task:** <2 minutos por tarea
- **Error Rate:** <10% (menos de 1 error cada 10 interacciones)
- **Satisfaction Score:** >4/5 en escala Likert

---

## 🛠️ Preparación (2 horas)

### Paso 1: Configurar Entorno de Testing

```bash
# 1. Levantar el proyecto en local
cd frontend
npm run dev

# 2. Verificar que todo funciona
# - Productos cargando correctamente
# - Carrito funcional
# - Checkout simulado (sin pagar realmente)
# - Admin accesible con credenciales de prueba
```

**URLs a probar:**
- Home: http://localhost:3000
- Productos: http://localhost:3000/productos
- Producto individual: http://localhost:3000/productos/[slug]
- Carrito: Click en ícono del carrito
- Checkout: http://localhost:3000/checkout
- Admin: http://localhost:3000/admin (opcional)

### Paso 2: Preparar Datos de Prueba

**Crear productos de prueba:**
- ✅ Al menos 20 productos visibles
- ✅ Con imágenes reales
- ✅ Con variantes (tamaños, sabores)
- ✅ Con descuentos activos
- ✅ Con stock disponible

**Credenciales de prueba:**
```
Usuario Cliente:
Email: test@quelita.com
Password: Test1234!

Usuario Admin (opcional):
Email: admin@quelita.com
Password: Admin1234!
```

### Paso 3: Preparar Herramientas de Grabación

**Opción A: Windows** (Recomendado)
- Windows Game Bar: `Win + G` → Grabar
- OBS Studio: https://obsproject.com/ (gratuito)

**Opción B: Mac**
- QuickTime: File → New Screen Recording

**Opción C: Online**
- Loom (gratuito 5 min): https://loom.com
- Zoom (con screen share)

### Paso 4: Preparar Scripts y Materiales

Imprimir o tener en pantalla:
- [ ] Script de introducción
- [ ] Lista de tareas
- [ ] Cuestionario post-test
- [ ] Hoja de observaciones

---

## 👥 Reclutamiento de Participantes

### Perfil Ideal (3-5 usuarios)

**Segmentación:**
- **2 usuarios:** Target principal (mujeres/hombres 25-45 que compran dulces)
- **1 usuario:** Usuario senior (50+) para accesibilidad
- **1 usuario:** Usuario joven (18-24) nativos digitales
- **1 usuario:** Usuario móvil-first (usa smartphone principalmente)

**Criterios de exclusión:**
- ❌ Desarrolladores web (muy técnicos)
- ❌ Familiares directos (bias)
- ❌ Personas que conocen el proyecto

**Dónde reclutar:**
- Amigos de amigos
- Grupos de Facebook locales
- Compañeros de trabajo
- Clientes actuales del negocio (si aplica)

### Incentivos (Opcional)

- $5-10 USD en crédito para la tienda
- Descuento del 20% en primera compra
- Producto gratis pequeño

---

## 📝 Tareas de Prueba

### Tarea 1: Exploración Inicial (5 min)

**Objetivo:** Evaluar primera impresión y navegación libre

**Script:**
> "Imagina que acabas de descubrir esta tienda de dulces online. Explora libremente durante 2 minutos y cuéntame en voz alta qué llama tu atención y qué piensas."

**Observables:**
- ✓ ¿Dónde mira primero?
- ✓ ¿Hace scroll inmediatamente?
- ✓ ¿Comenta sobre diseño/colores?
- ✓ ¿Hace click en productos?

**Preguntas post-tarea:**
- "¿Qué opinas de la apariencia general?"
- "¿Confiarías en comprar aquí?"
- "¿Algo te confunde o te parece raro?"

---

### Tarea 2: Buscar Producto Específico (3 min)

**Objetivo:** Evaluar búsqueda y filtros

**Script:**
> "Quieres comprar **chocolates** para regalar. Encuentra algún producto de chocolate que te guste."

**Observables:**
- ✓ ¿Usa el buscador o navega por categorías?
- ✓ ¿Encuentra los filtros?
- ✓ ¿Los filtros son claros?
- ✓ ¿Tiempo para encontrar un producto?

**Variaciones:**
- "Encuentra un producto en **oferta**"
- "Encuentra productos de la marca **X**"
- "Filtra por precio de menor a mayor"

**Métricas:**
- ⏱️ Tiempo: <1 minuto (éxito), 1-2 min (aceptable), >2 min (problema)
- ✅ Success Rate: >80%

---

### Tarea 3: Agregar al Carrito (2 min)

**Objetivo:** Evaluar flujo de add-to-cart

**Script:**
> "Agrega al carrito **2 unidades** de este producto que acabas de encontrar."

**Observables:**
- ✓ ¿Encuentra el botón de agregar?
- ✓ ¿Nota la animación de confetti?
- ✓ ¿Cambia la cantidad antes o después de agregar?
- ✓ ¿Ve el badge del carrito actualizándose?
- ✓ ¿Comenta sobre las animaciones?

**Preguntas post-tarea:**
- "¿Notaste algún cambio visual al agregar?"
- "¿Fue claro que el producto se agregó?"
- "¿La experiencia te resultó agradable o molesta?"

---

### Tarea 4: Revisar y Modificar Carrito (3 min)

**Objetivo:** Evaluar carrito y gestión de productos

**Script:**
> "Ahora revisa tu carrito de compras. Cambia la cantidad de uno de los productos y elimina otro."

**Observables:**
- ✓ ¿Encuentra cómo abrir el carrito?
- ✓ ¿Los controles de cantidad son claros?
- ✓ ¿Encuentra el botón de eliminar?
- ✓ ¿Nota las animaciones del cart drawer?
- ✓ ¿Revisa el total antes de continuar?

**Preguntas post-tarea:**
- "¿Fue fácil modificar las cantidades?"
- "¿El total se actualiza claramente?"
- "¿Algo te confundió en el carrito?"

---

### Tarea 5: Completar Checkout (5 min)

**Objetivo:** Evaluar flujo de pago (sin pagar realmente)

**Script:**
> "Procede al checkout como si fueras a comprar. **NO** completes el pago real, solo llena los formularios hasta el final."

**Observables:**
- ✓ ¿Los campos del formulario son claros?
- ✓ ¿La validación es útil o molesta?
- ✓ ¿Confía en ingresar datos de pago?
- ✓ ¿Lee el resumen del pedido?
- ✓ ¿Le preocupa algo antes de "pagar"?

**Formularios a evaluar:**
- Datos personales (nombre, email, teléfono)
- Dirección de envío
- Método de pago (visual)
- Resumen del pedido

**Métricas:**
- ⏱️ Tiempo: <3 minutos (éxito)
- ❌ Errores de validación: <2
- ✅ Success Rate: >75%

---

### Tarea 6: Testing Móvil (5 min)

**Objetivo:** Evaluar experiencia en smartphone

**Script:**
> "Ahora vamos a probar en tu teléfono. Repite las mismas tareas: busca un producto, agrégalo al carrito, y revisa el checkout."

**Dispositivos a probar:**
- iOS (iPhone)
- Android (Samsung, Xiaomi, etc.)
- Tablet (opcional)

**Observables específicos móvil:**
- ✓ ¿Botones suficientemente grandes? (touch targets >44px)
- ✓ ¿Scroll fluido?
- ✓ ¿Modales/drawers funcionan bien?
- ✓ ¿Teclado no tapa campos importantes?
- ✓ ¿Imágenes cargan rápido?

---

## 📋 Protocolo de Testing

### Pre-Test (5 min por participante)

**1. Bienvenida y Contexto**

> "Hola [nombre], gracias por ayudarme. Voy a mostrarte un sitio web de una confitería online y me gustaría que lo pruebes como si fueras a comprar. No hay respuestas correctas o incorrectas - lo que quiero es ver cómo interactúas naturalmente con el sitio."

**2. Consentimiento**

> "Voy a grabar la pantalla para revisar después. ¿Estás de acuerdo? Tus datos serán anónimos y solo usaré esta información para mejorar el sitio."

**3. Instrucciones**

> "Por favor, **piensa en voz alta** mientras navegas. Dime qué estás mirando, qué piensas hacer, y cualquier duda o confusión que tengas. No te preocupes por ofenderme - cualquier crítica es súper valiosa."

### Durante el Test (30-40 min por participante)

**Técnicas de moderación:**

✅ **HACER:**
- Escuchar activamente sin interrumpir
- Tomar notas de observaciones
- Hacer preguntas abiertas: "¿Qué piensas de esto?"
- Dejar silencios cómodos (no llenar cada pausa)
- Preguntar "por qué" para entender razonamiento

❌ **NO HACER:**
- Dar pistas o ayudar ("haz click ahí")
- Defender decisiones de diseño
- Interrumpir el flujo del usuario
- Hacer preguntas leading: "¿No crees que esto es claro?"

**Si el usuario se atasca:**

> "¿Qué esperarías que pasara ahora?"
> "¿Dónde buscarías esa función?"
> "Si esto fuera tu sitio favorito, ¿cómo funcionaría?"

### Post-Test (10 min por participante)

**Cuestionario de Satisfacción:**

1. **Apariencia General** (1-5)
   - "¿Cómo calificarías el diseño visual del sitio?"

2. **Facilidad de Uso** (1-5)
   - "¿Qué tan fácil fue encontrar y comprar productos?"

3. **Confianza** (1-5)
   - "¿Qué tan cómodo te sentirías comprando aquí con tu tarjeta?"

4. **Velocidad** (1-5)
   - "¿El sitio te pareció rápido o lento?"

5. **Recomendación** (1-5)
   - "¿Recomendarías este sitio a un amigo?"

**Preguntas Abiertas:**

1. "¿Qué fue lo que MÁS te gustó del sitio?"
2. "¿Qué fue lo que MENOS te gustó o te frustró?"
3. "¿Algo te confundió o no sabías cómo usar?"
4. "Si pudieras cambiar UNA cosa, ¿qué sería?"
5. "¿Hay algo que esperabas encontrar pero no viste?"

---

## 📊 Métricas y Observables

### Métricas Cuantitativas

| Métrica | Objetivo | Cómo Medir |
|---------|----------|------------|
| **Task Success Rate** | >80% | Tareas completadas / Total tareas |
| **Time on Task** | <2 min/tarea | Cronómetro por tarea |
| **Error Rate** | <10% | Clicks erróneos / Total clicks |
| **Satisfaction Score** | >4/5 | Promedio del cuestionario |

### Métricas Cualitativas

**Nivel de Frustración:**
- 😊 **Bajo:** Usuario sonríe, comenta positivamente
- 😐 **Medio:** Pausas, dudas, "mmm..."
- 😤 **Alto:** Suspiros, quejas, "¿dónde está?"

**Comentarios Espontáneos:**
- 💬 Positivos: "Me gusta", "Está bonito", "Qué bueno"
- 💬 Negativos: "No entiendo", "Esto es raro", "Esperaba..."
- 💬 Sugerencias: "Sería mejor si...", "Debería..."

### Template de Observación

```markdown
## Sesión #[X] - [Fecha]

**Participante:** [Nombre/Alias]
**Perfil:** [Edad, ocupación, nivel técnico]
**Dispositivo:** [Desktop/Móvil, SO, navegador]
**Duración:** [XX min]

### Tarea 1: Exploración Inicial
- ⏱️ Tiempo: XX:XX
- ✅/❌ Completada: Sí/No
- 💬 Comentarios: "..."
- 🐛 Problemas: ...

### Tarea 2: Buscar Producto
- ⏱️ Tiempo: XX:XX
- ✅/❌ Completada: Sí/No
- 💬 Comentarios: "..."
- 🐛 Problemas: ...

[...resto de tareas]

### Observaciones Generales
- Nivel de frustración: Bajo/Medio/Alto
- Comentarios destacados: ...
- Bugs encontrados: ...

### Scores Post-Test
- Apariencia: [1-5]
- Facilidad: [1-5]
- Confianza: [1-5]
- Velocidad: [1-5]
- Recomendación: [1-5]

**Promedio:** X.X/5
```

---

## 📈 Análisis y Priorización

### Paso 1: Consolidar Findings (1 hora)

Después de las 3-5 sesiones, agrupa los problemas encontrados:

**Ejemplo de consolidación:**

```markdown
## Problemas Encontrados

### Problema #1: Filtros no se ven en móvil
- **Severidad:** Alta
- **Frecuencia:** 4/5 usuarios
- **Impacto:** No pueden filtrar productos en móvil
- **Evidencia:** "No encuentro cómo filtrar por precio"

### Problema #2: Badge de descuento poco visible
- **Severidad:** Media
- **Frecuencia:** 3/5 usuarios
- **Impacto:** No notan las ofertas
- **Evidencia:** "No vi que había descuento"

### Problema #3: Confusión en variantes
- **Severidad:** Media
- **Frecuencia:** 2/5 usuarios
- **Impacto:** Agregan producto equivocado
- **Evidencia:** "Pensé que era tamaño grande"
```

### Paso 2: Matriz de Priorización

| Problema | Severidad | Frecuencia | Esfuerzo | Prioridad |
|----------|-----------|------------|----------|-----------|
| Filtros móvil | Alta | 4/5 | 4h | 🔴 CRÍTICO |
| Badge descuento | Media | 3/5 | 1h | 🟡 MEDIO |
| Variantes | Media | 2/5 | 2h | 🟢 BAJO |

**Fórmula de prioridad:**
```
Prioridad = (Severidad × Frecuencia) / Esfuerzo

Severidad: 1 (baja), 2 (media), 3 (alta), 4 (crítica)
Frecuencia: 1-5 (número de usuarios)
Esfuerzo: 1 (< 2h), 2 (2-4h), 3 (4-8h), 4 (>8h)
```

### Paso 3: Plan de Acción

**Problemas Críticos (Fix antes del deploy):**
- [ ] Problema con frecuencia >3/5 usuarios
- [ ] Severidad alta que bloquea tareas
- [ ] Bugs que rompen funcionalidad

**Problemas Importantes (Fix en iteración 1 post-launch):**
- [ ] Frecuencia 2-3/5 usuarios
- [ ] Severidad media
- [ ] UX improvements

**Nice-to-Have (Backlog):**
- [ ] Frecuencia <2/5 usuarios
- [ ] Severidad baja
- [ ] Sugerencias de features nuevas

---

## ✅ Checklist Pre-Deploy

### Tests Funcionales

- [ ] ✅ Flujo de compra completo funciona (inicio a fin)
- [ ] ✅ Carrito persiste en refresh
- [ ] ✅ Filtros funcionan correctamente
- [ ] ✅ Búsqueda devuelve resultados relevantes
- [ ] ✅ Imágenes cargan correctamente
- [ ] ✅ Formularios validan campos
- [ ] ✅ Animaciones no causan bugs

### Tests de Compatibilidad

**Navegadores:**
- [ ] Chrome (última versión)
- [ ] Firefox (última versión)
- [ ] Safari (Mac/iOS)
- [ ] Edge (última versión)

**Dispositivos:**
- [ ] Desktop 1920x1080
- [ ] Laptop 1366x768
- [ ] Tablet 768px
- [ ] Móvil 375px (iPhone SE)
- [ ] Móvil 414px (iPhone Plus)

### Tests de Performance

- [ ] Lighthouse Score >85 en Performance
- [ ] LCP <3s
- [ ] FID <100ms
- [ ] CLS <0.1
- [ ] Sin errores de consola en producción

### Tests de Accesibilidad

- [ ] Navegación por teclado funciona (Tab, Enter, Esc)
- [ ] Screen reader compatible (probar con NVDA/JAWS)
- [ ] Contraste de colores WCAG AA
- [ ] Focus states visibles
- [ ] Alt text en todas las imágenes

### Tests de SEO

- [ ] Meta tags presentes en todas las páginas
- [ ] Open Graph tags configurados
- [ ] robots.txt accesible
- [ ] sitemap.xml generado
- [ ] URLs amigables (sin parámetros raros)

---

## 📄 Template de Reporte Final

```markdown
# Reporte de Usability Testing - Confitería Quelita

**Fecha:** [DD/MM/YYYY]
**Moderador:** [Tu nombre]
**Participantes:** 5 usuarios

---

## 📊 Resumen Ejecutivo

- **Task Success Rate:** XX% (objetivo: >80%)
- **Satisfaction Score:** X.X/5 (objetivo: >4/5)
- **Problemas Críticos Encontrados:** X
- **Problemas Importantes:** X
- **Sugerencias de Mejora:** X

**Recomendación:** ✅ Listo para deploy / ⚠️ Fixes menores / ❌ Requiere trabajo

---

## 🎯 Findings Principales

### 1. [Título del problema]
- **Severidad:** Alta/Media/Baja
- **Frecuencia:** X/5 usuarios
- **Descripción:** ...
- **Evidencia:** "Quote del usuario"
- **Recomendación:** ...

### 2. [Título del problema]
...

---

## 💡 Insights Positivos

- ✅ "El diseño es muy bonito y profesional" (5/5 usuarios)
- ✅ "Las animaciones son agradables, no molestas" (4/5 usuarios)
- ✅ "El carrito es muy claro" (4/5 usuarios)

---

## 🔧 Plan de Acción

### Pre-Deploy (Crítico)
- [ ] Fix problema #1
- [ ] Fix problema #2

### Post-Deploy Iteración 1 (2 semanas)
- [ ] Mejora #1
- [ ] Mejora #2

### Backlog (Futuro)
- [ ] Feature #1
- [ ] Feature #2

---

## 📎 Anexos

- Grabaciones de sesiones: [Link]
- Hoja de observaciones: [Link]
- Cuestionarios completados: [Link]
```

---

## 🎓 Tips Finales

### Antes del Test

1. **Practica con un colega** primero (dry run)
2. **Prepara backup** (si falla el servidor, tener capturas)
3. **Ten agua/café** para los participantes
4. **Configura "No molestar"** en tu computadora

### Durante el Test

1. **No te pongas defensivo** ante críticas
2. **Deja que se equivoquen** (es información valiosa)
3. **Graba todo** (pantalla + audio)
4. **Toma notas de timestamps** para revisar después

### Después del Test

1. **Revisa grabaciones mismo día** (mientras está fresco)
2. **Agradece a participantes** con email de seguimiento
3. **Comparte findings** con el equipo rápido
4. **Prioriza fixes** antes que agregues features nuevas

---

**¡Éxito con tus tests!** 🚀

Recuerda: **5 usuarios encuentran el 85% de los problemas de usabilidad**. No necesitas 50 personas, 3-5 usuarios bien seleccionados son suficientes para un MVP.

---

**Última actualización:** 3 de Diciembre, 2025
**Autor:** Equipo Confitería Quelita
**Versión:** 1.0.0
