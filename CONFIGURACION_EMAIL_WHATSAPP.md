# Configuración de Email y WhatsApp

Este documento explica cómo configurar el envío de correos electrónicos y WhatsApp para la aplicación Confitería Quelita.

## 📧 Configuración de Gmail (SMTP)

### Paso 1: Habilitar Verificación en 2 Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com/security
2. En la sección "Cómo acceder a Google", selecciona **Verificación en 2 pasos**
3. Sigue los pasos para habilitarla (si aún no la tienes activada)

### Paso 2: Generar Contraseña de Aplicación

1. Una vez habilitada la verificación en 2 pasos, ve a: https://myaccount.google.com/apppasswords
2. Es posible que tengas que volver a iniciar sesión
3. En "Seleccionar app", elige **Correo**
4. En "Seleccionar dispositivo", elige **Otro (nombre personalizado)**
5. Escribe un nombre como "Confiteria Quelita Backend"
6. Haz clic en **Generar**
7. Google te mostrará una **contraseña de 16 caracteres** (ejemplo: `abcd efgh ijkl mnop`)
8. **¡IMPORTANTE!** Copia esta contraseña inmediatamente. No podrás verla de nuevo.

### Paso 3: Configurar Variables de Entorno

Edita tu archivo `.env` en la carpeta `backend/` y agrega:

```env
# Email / SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM_NAME=Confitería Quelita
SMTP_FROM_EMAIL=noreply@quelita.com
```

**Reemplaza:**
- `tu-email@gmail.com` → Tu dirección de Gmail
- `abcd efgh ijkl mnop` → La contraseña de 16 caracteres que generaste (sin espacios)

**Ejemplo correcto:**
```env
SMTP_USER=confiteriaquelita@gmail.com
SMTP_PASS=abcdefghijklmnop
```

### Paso 4: Verificar Configuración

1. Reinicia el servidor backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Verifica en los logs que aparezca:
   ```
   ✅ Email service configurado correctamente
   ✅ Conexión SMTP verificada
   ```

3. Si ves errores, revisa:
   - Que la contraseña no tenga espacios
   - Que el email sea correcto
   - Que tengas verificación en 2 pasos habilitada

## 💬 Configuración de WhatsApp Business

### Variables de Entorno

En el archivo `backend/.env`:

```env
# WhatsApp Business
WHATSAPP_BUSINESS_PHONE=56920178216
WHATSAPP_DEFAULT_MESSAGE=Hola, me gustaría hacer una consulta sobre
```

**Formato del número:**
- Incluye código de país (56 para Chile, 595 para Paraguay, etc.)
- Sin espacios, guiones ni caracteres especiales
- Ejemplo: `56920178216` (Chile), `595981234567` (Paraguay)

### Botón Flotante de WhatsApp

El botón flotante de WhatsApp ya está integrado en todas las páginas y:

- ✅ Es responsive (mobile y desktop)
- ✅ Tiene animaciones fluidas
- ✅ Se puede expandir para mostrar información
- ✅ Incluye horarios de atención
- ✅ Badge de notificación
- ✅ Animación de pulso

**Personalización del mensaje:**

El mensaje por defecto se puede cambiar en `frontend/components/shared/WhatsAppButton.tsx`:

```typescript
defaultMessage = 'Hola, me gustaría hacer una consulta sobre'
```

## 📨 Emails que se Envían Automáticamente

### 1. Confirmación de Pedido
**Cuándo:** Al crear una nueva orden
**Contenido:**
- Número de pedido
- Detalles del cliente
- Lista de productos
- Total a pagar
- Método de entrega y pago
- Botón para contactar por WhatsApp

### 2. Actualización de Estado
**Cuándo:** Al cambiar el estado de una orden (confirmado, en preparación, enviado, completado)
**Contenido:**
- Nuevo estado del pedido
- Mensaje descriptivo del estado
- Botón para contactar por WhatsApp

### 3. Cancelación de Pedido
**Cuándo:** Al cancelar una orden
**Contenido:**
- Número de pedido cancelado
- Motivo de cancelación (si existe)
- Invitación a contactar para más información

## 🔧 Solución de Problemas

### Emails no se envían

1. **Verificar credenciales SMTP:**
   ```bash
   # En backend/.env
   echo $SMTP_USER
   echo $SMTP_PASS
   ```

2. **Revisar logs del servidor:**
   ```
   ⚠️  Credenciales SMTP no configuradas → Falta configurar variables
   ❌ Error enviando email → Credenciales incorrectas o red bloqueada
   ✅ Email enviado: <message-id> → Todo OK
   ```

3. **Problemas comunes:**
   - **"Invalid login"**: Contraseña incorrecta o verificación en 2 pasos no habilitada
   - **"Connection timeout"**: Firewall bloqueando puerto 587
   - **"Self-signed certificate"**: Cambiar `SMTP_SECURE=false`

### WhatsApp no abre

1. **Verificar formato del número:**
   - ✅ Correcto: `56920178216`
   - ❌ Incorrecto: `+569 2017 8216`, `569-2017-8216`

2. **Revisar en el navegador:**
   - Debería abrir link: `https://wa.me/56920178216?text=...`
   - Si no abre, verificar que WhatsApp esté instalado

## 🚀 Testing

### Probar envío de email

1. Crea una orden de prueba desde el frontend
2. Verifica que llegue el email de confirmación
3. Cambia el estado de la orden desde el panel admin
4. Verifica que llegue el email de actualización

### Probar botón WhatsApp

1. Abre cualquier página del sitio
2. Verifica que aparezca el botón flotante verde en la esquina inferior derecha
3. Haz clic para expandir
4. Haz clic en "Iniciar Chat"
5. Debe abrir WhatsApp con el mensaje predefinido

## 📝 Notas Importantes

- **Límites de Gmail:** Gmail tiene límites de envío (aprox. 500 emails/día para cuentas gratuitas)
- **Para producción:** Considerar usar servicios dedicados como:
  - SendGrid
  - Amazon SES
  - Mailgun
  - Resend

- **WhatsApp Business API:** Para automatización avanzada, considerar WhatsApp Business API
- **Números de prueba:** Usa un número de WhatsApp real donde puedas recibir mensajes

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa los logs del servidor backend
2. Verifica las variables de entorno
3. Consulta la documentación de nodemailer: https://nodemailer.com/
4. Revisa la API de WhatsApp: https://faq.whatsapp.com/

---

✅ **Configuración completada exitosamente cuando:**
- Recibes emails de confirmación al crear órdenes
- El botón de WhatsApp aparece y funciona correctamente
- Los links de WhatsApp abren la app con el mensaje predefinido
