import nodemailer, { Transporter } from 'nodemailer';
import { ENV } from '../config/env';
import { IOrder } from '../models/Order';

/**
 * Email Service
 * Manejo centralizado de envío de emails
 */

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Inicializa el transporter de nodemailer
   */
  private initializeTransporter(): void {
    // Verificar si las credenciales SMTP están configuradas
    if (!ENV.SMTP_HOST || !ENV.SMTP_USER || !ENV.SMTP_PASS) {
      console.warn('⚠️  Credenciales SMTP no configuradas. Los emails no se enviarán.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_PORT === 465, // true para 465, false para otros puertos
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service configurado correctamente');
    } catch (error) {
      console.error('❌ Error configurando email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Verifica la conexión SMTP
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Conexión SMTP verificada');
      return true;
    } catch (error) {
      console.error('❌ Error verificando conexión SMTP:', error);
      return false;
    }
  }

  /**
   * Envía un email genérico
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('⚠️  Email service no configurado. Email no enviado.');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Confitería Quelita" <${ENV.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback: strip HTML
      });

      console.log(`📧 Email enviado: ${info.messageId} a ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return false;
    }
  }

  /**
   * Envía email de reset de contraseña
   */
  async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean> {
    const resetUrl = `${ENV.FRONTEND_URL}/reset-password/${resetToken}`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #e91e63;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      background-color: #e91e63;
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .button:hover {
      background-color: #c2185b;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 10px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍬 Confitería Quelita</h1>
    </div>
    <div class="content">
      <h2>Hola ${userName},</h2>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
      <center>
        <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
      </center>
      <div class="warning">
        <strong>⚠️ Importante:</strong>
        <ul>
          <li>Este enlace expira en <strong>1 hora</strong></li>
          <li>Solo puede ser usado <strong>una vez</strong></li>
          <li>Si no solicitaste este cambio, ignora este email</li>
        </ul>
      </div>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
    </div>
    <div class="footer">
      <p>Este es un email automático, por favor no respondas.</p>
      <p>&copy; ${new Date().getFullYear()} Confitería Quelita. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Restablecer Contraseña - Confitería Quelita',
      html,
    });
  }

  /**
   * Envía email de "pedido recibido" inmediatamente después de crear la orden.
   * Se envía antes de que el funcionario confirme y calcule el costo de envío,
   * por lo que el total puede no incluir todavía el envío.
   */
  async sendOrderReceivedEmail(order: IOrder, userEmail: string, userName: string): Promise<boolean> {
    const orderUrl = `${ENV.FRONTEND_URL}/mis-ordenes/${order.orderNumber}`;
    const whatsappNumber = ENV.WHATSAPP_BUSINESS_NUMBER;

    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productSnapshot.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.pricePerUnit.toLocaleString('es-CL')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.subtotal.toLocaleString('es-CL')}</td>
      </tr>
    `
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Pedido Recibido</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; }
    .container { background-color: #f9f9f9; border-radius: 10px; padding: 30px; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { color: #e91e63; margin: 0; }
    .content { background: white; padding: 25px; border-radius: 8px; }
    .order-number { background: #e91e63; color: white; padding: 15px; border-radius: 5px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
    .info-box { background: #fff8e1; border-left: 4px solid #ffb300; padding: 12px 15px; margin: 15px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f5f5f5; padding: 12px; text-align: left; }
    .total-row { background: #f5f5f5; font-weight: bold; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍬 Confitería Quelita</h1>
      <p style="color:#ffb300; font-size: 18px;">📥 Pedido recibido</p>
    </div>
    <div class="content">
      <h2>¡Gracias por tu pedido, ${userName}!</h2>
      <p>Recibimos tu pedido. En breve nos contactaremos contigo por WhatsApp para confirmar los detalles y coordinar el envío.</p>

      <div class="order-number">Pedido #${order.orderNumber}</div>

      <div class="info-box">
        <strong>⏳ Estado actual:</strong> Pendiente de confirmación.<br>
        Te avisaremos por WhatsApp${userEmail ? ' y por email' : ''} cuando esté confirmado y conozcamos el costo de envío.
      </div>

      <h3>Detalle del pedido</h3>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th style="text-align:center;">Cantidad</th>
            <th style="text-align:right;">Precio Unit.</th>
            <th style="text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr><td colspan="3" style="padding:10px; text-align:right;">Subtotal:</td><td style="padding:10px; text-align:right;">$${order.subtotal.toLocaleString('es-CL')}</td></tr>
          <tr><td colspan="3" style="padding:10px; text-align:right; color:#666;">Envío:</td><td style="padding:10px; text-align:right; color:#666;">Por confirmar</td></tr>
          <tr class="total-row"><td colspan="3" style="padding:15px; text-align:right;">Total estimado:</td><td style="padding:15px; text-align:right;">$${order.total.toLocaleString('es-CL')}</td></tr>
        </tfoot>
      </table>

      <p style="text-align:center;">
        <a href="${orderUrl}" style="display:inline-block; background:#e91e63; color:white; padding:12px 28px; border-radius:5px; text-decoration:none; font-weight:bold;">Ver mi pedido</a>
      </p>
    </div>
    <div class="footer">
      <p>Si tienes preguntas, contáctanos por WhatsApp: ${whatsappNumber}</p>
      <p>&copy; ${new Date().getFullYear()} Confitería Quelita. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `📥 Pedido recibido #${order.orderNumber} - Confitería Quelita`,
      html,
    });
  }

  /**
   * Envía email de confirmación de pedido
   */
  async sendOrderConfirmationEmail(order: IOrder, userEmail: string, userName: string): Promise<boolean> {
    const orderUrl = `${ENV.FRONTEND_URL}/mis-ordenes/${order.orderNumber}`;

    // Formatear items del pedido
    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productSnapshot.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.pricePerUnit.toLocaleString('es-CL')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.subtotal.toLocaleString('es-CL')}</td>
      </tr>
    `
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Pedido</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #e91e63;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .order-number {
      background-color: #e91e63;
      color: white;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background-color: #f5f5f5;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    .total-row {
      background-color: #f5f5f5;
      font-weight: bold;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      background-color: #e91e63;
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
    .info-box {
      background-color: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍬 Confitería Quelita</h1>
      <p style="color: #4caf50; font-size: 20px; margin: 10px 0;">✓ Pedido Confirmado</p>
    </div>
    <div class="content">
      <h2>¡Gracias por tu compra, ${userName}!</h2>
      <p>Tu pedido ha sido recibido y está siendo procesado.</p>

      <div class="order-number">
        Pedido #${order.orderNumber}
      </div>

      <div class="info-box">
        <strong>📍 Dirección de entrega:</strong><br>
        ${order.customer.address?.street} ${order.customer.address?.number}<br>
        ${order.customer.address?.neighborhood ? order.customer.address.neighborhood + '<br>' : ''}
        ${order.customer.address?.city}<br>
        ${order.customer.address?.reference ? 'Ref: ' + order.customer.address.reference : ''}
      </div>

      <h3>Detalle del Pedido</h3>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th style="text-align: center;">Cantidad</th>
            <th style="text-align: right;">Precio Unit.</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3" style="padding: 15px; text-align: right;">Total:</td>
            <td style="padding: 15px; text-align: right;">$${order.total.toLocaleString('es-CL')}</td>
          </tr>
        </tfoot>
      </table>

      <center>
        <a href="${orderUrl}" class="button">Ver Detalle del Pedido</a>
      </center>

      <p style="margin-top: 30px; color: #666;">
        <strong>Estado del pedido:</strong> ${this.getStatusLabel(order.status)}<br>
        <strong>Método de pago:</strong> ${this.getPaymentMethodLabel(order.paymentMethod)}
      </p>
    </div>
    <div class="footer">
      <p>Si tienes alguna pregunta, contáctanos por WhatsApp: ${ENV.WHATSAPP_BUSINESS_NUMBER}</p>
      <p>&copy; ${new Date().getFullYear()} Confitería Quelita. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `🎉 Pedido Confirmado #${order.orderNumber} - Confitería Quelita`,
      html,
    });
  }

  /**
   * Envía email de actualización de estado del pedido
   */
  async sendOrderStatusUpdateEmail(
    order: IOrder,
    userEmail: string,
    userName: string,
    newStatus: string
  ): Promise<boolean> {
    const orderUrl = `${ENV.FRONTEND_URL}/mis-ordenes/${order.orderNumber}`;
    const statusInfo = this.getStatusInfo(newStatus);

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Actualización de Pedido</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #e91e63;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .status-badge {
      background-color: ${statusInfo.color};
      color: white;
      padding: 15px 25px;
      border-radius: 25px;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background-color: #e91e63;
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍬 Confitería Quelita</h1>
    </div>
    <div class="content">
      <h2>Hola ${userName},</h2>
      <p>Tu pedido <strong>#${order.orderNumber}</strong> ha sido actualizado.</p>

      <div class="status-badge">
        ${statusInfo.icon} ${statusInfo.label}
      </div>

      <p>${statusInfo.message}</p>

      <center>
        <a href="${orderUrl}" class="button">Ver Detalles del Pedido</a>
      </center>
    </div>
    <div class="footer">
      <p>Si tienes alguna pregunta, contáctanos por WhatsApp: ${ENV.WHATSAPP_BUSINESS_NUMBER}</p>
      <p>&copy; ${new Date().getFullYear()} Confitería Quelita. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `📦 Actualización de Pedido #${order.orderNumber} - ${statusInfo.label}`,
      html,
    });
  }

  /**
   * Helper: Obtiene etiqueta de estado en español
   */
  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'En Preparación',
      ready: 'Listo para Entrega',
      delivering: 'En Camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  /**
   * Helper: Obtiene etiqueta de método de pago en español
   */
  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'cash-on-delivery': 'Efectivo contra entrega',
      transfer: 'Transferencia bancaria',
      card: 'Tarjeta de crédito/débito',
    };
    return labels[method] || method;
  }

  /**
   * Helper: Obtiene información detallada del estado
   */
  private getStatusInfo(status: string): { label: string; color: string; icon: string; message: string } {
    const statusMap: Record<string, { label: string; color: string; icon: string; message: string }> = {
      pending: {
        label: 'Pendiente',
        color: '#ff9800',
        icon: '⏳',
        message: 'Tu pedido está siendo revisado. Te confirmaremos pronto.',
      },
      confirmed: {
        label: 'Confirmado',
        color: '#2196f3',
        icon: '✓',
        message: 'Tu pedido ha sido confirmado y pronto comenzaremos a prepararlo.',
      },
      preparing: {
        label: 'En Preparación',
        color: '#9c27b0',
        icon: '👨‍🍳',
        message: 'Estamos preparando tu pedido con mucho cariño.',
      },
      ready: {
        label: 'Listo para Entrega',
        color: '#4caf50',
        icon: '📦',
        message: 'Tu pedido está listo y pronto saldrá para entrega.',
      },
      delivering: {
        label: 'En Camino',
        color: '#00bcd4',
        icon: '🚚',
        message: 'Tu pedido va en camino. ¡Llegaremos pronto!',
      },
      delivered: {
        label: 'Entregado',
        color: '#4caf50',
        icon: '🎉',
        message: '¡Tu pedido ha sido entregado! Esperamos que lo disfrutes.',
      },
      cancelled: {
        label: 'Cancelado',
        color: '#f44336',
        icon: '✗',
        message: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
      },
    };

    return (
      statusMap[status] || {
        label: status,
        color: '#757575',
        icon: '•',
        message: 'El estado de tu pedido ha cambiado.',
      }
    );
  }

  /**
   * Envía email de cancelación de pedido
   */
  async sendOrderCancellationEmail(order: IOrder, userEmail: string, userName: string): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido Cancelado</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #e91e63;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .alert {
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .order-number {
      background-color: #e91e63;
      color: white;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍬 Confitería Quelita</h1>
    </div>
    <div class="content">
      <h2>Hola ${userName},</h2>

      <div class="alert">
        <strong>✗ Pedido Cancelado</strong>
      </div>

      <div class="order-number">
        Pedido #${order.orderNumber}
      </div>

      <p>Tu pedido ha sido cancelado.</p>

      ${
        order.cancellationReason
          ? `
      <p><strong>Motivo de cancelación:</strong><br>
      ${order.cancellationReason}</p>
      `
          : ''
      }

      <p>Si tienes alguna pregunta o deseas realizar un nuevo pedido, no dudes en contactarnos por WhatsApp.</p>
    </div>
    <div class="footer">
      <p>Si tienes alguna pregunta, contáctanos por WhatsApp: ${ENV.WHATSAPP_BUSINESS_NUMBER}</p>
      <p>&copy; ${new Date().getFullYear()} Confitería Quelita. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `❌ Pedido Cancelado #${order.orderNumber} - Confitería Quelita`,
      html,
    });
  }

  /**
   * Envía email de orden editada (con lista de productos actualizada)
   */
  async sendOrderEditedEmail(order: IOrder, userEmail: string, userName: string): Promise<boolean> {
    const orderUrl = `${ENV.FRONTEND_URL}/mis-ordenes/${order.orderNumber}`;

    // Formatear items del pedido
    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productSnapshot.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.pricePerUnit.toLocaleString('es-CL')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.subtotal.toLocaleString('es-CL')}</td>
      </tr>
    `
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido Actualizado</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #e91e63;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .order-number {
      background-color: #ff9800;
      color: white;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0;
    }
    .info-box {
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 15px;
      margin: 15px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background-color: #f5f5f5;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    .total-row {
      background-color: #f5f5f5;
      font-weight: bold;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      background-color: #e91e63;
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍬 Confitería Quelita</h1>
      <p style="color: #ff9800; font-size: 20px; margin: 10px 0;">✏️ Pedido Actualizado</p>
    </div>
    <div class="content">
      <h2>Hola ${userName},</h2>
      <p>Tu pedido ha sido modificado. A continuación te mostramos los detalles actualizados:</p>

      <div class="order-number">
        Pedido #${order.orderNumber}
      </div>

      <div class="info-box">
        <strong>ℹ️ Información:</strong><br>
        Los productos de tu pedido han sido actualizados. Revisa el detalle a continuación.
      </div>

      <h3>Productos Actuales</h3>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th style="text-align: center;">Cantidad</th>
            <th style="text-align: right;">Precio Unit.</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;">Subtotal:</td>
            <td style="padding: 10px; text-align: right;">$${order.subtotal.toLocaleString('es-CL')}</td>
          </tr>
          ${order.shippingCost > 0 ? `
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;">Envío:</td>
            <td style="padding: 10px; text-align: right;">$${order.shippingCost.toLocaleString('es-CL')}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td colspan="3" style="padding: 15px; text-align: right;">Total:</td>
            <td style="padding: 15px; text-align: right;">$${order.total.toLocaleString('es-CL')}</td>
          </tr>
        </tfoot>
      </table>

      <center>
        <a href="${orderUrl}" class="button">Ver Detalle del Pedido</a>
      </center>

      <p style="margin-top: 20px; color: #666;">
        Si tienes alguna duda sobre los cambios realizados, no dudes en contactarnos.
      </p>
    </div>
    <div class="footer">
      <p>Si tienes alguna pregunta, contáctanos por WhatsApp: ${ENV.WHATSAPP_BUSINESS_NUMBER}</p>
      <p>&copy; ${new Date().getFullYear()} Confitería Quelita. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `✏️ Pedido Actualizado #${order.orderNumber} - Confitería Quelita`,
      html,
    });
  }

  /**
   * Envía email de bienvenida a nuevo cliente
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    const whatsappNumber = ENV.WHATSAPP_BUSINESS_NUMBER;
    const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\+/g, '')}`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido a Confitería Quelita!</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #dc2626;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
    }
    .welcome-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
    .whatsapp-button {
      display: inline-block;
      background-color: #25D366;
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: bold;
      font-size: 16px;
    }
    .whatsapp-button:hover {
      background-color: #128C7E;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍬 Confitería Quelita</h1>
    </div>
    <div class="content">
      <div class="welcome-icon">🎉</div>
      <h2>¡Bienvenido/a, ${userName}!</h2>
      <p>Gracias por registrarte en Confitería Quelita.</p>
      <p>Estamos felices de tenerte con nosotros. Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos:</p>

      <a href="${whatsappLink}" class="whatsapp-button">
        💬 Escríbenos por WhatsApp
      </a>

      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        ${whatsappNumber}
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Confitería Quelita. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 ¡Bienvenido/a a Confitería Quelita!',
      html,
    });
  }
}

// Exportar instancia singleton
export const emailService = new EmailService();
