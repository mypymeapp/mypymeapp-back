// subscriptionInvoiceTemplate.ts
export const subscriptionInvoiceTemplate = (
    name: string,
    amount: number,
    currency: string,
    validUntil: string,
) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
        body { font-family: Arial, sans-serif; background:#f9f9f9; margin:0; padding:0;}
        .container {
        max-width:600px; margin:0 auto; background:#fff; padding:20px; border-radius:8px;
        box-shadow:0 2px 6px rgba(0,0,0,0.1);
        }
        .header {
        text-align:center; background:#2c3e50; color:#fff; padding:20px; border-radius:8px 8px 0 0;
        }
        .header img { height:100px; width:auto; margin-bottom:10px; }
        .content { padding:20px; color:#333; line-height:1.6; }
        .footer { text-align:center; font-size:12px; color:#aaa; margin-top:20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
        <img src="https://res.cloudinary.com/dnoakcx0v/image/upload/v1758124300/logo-dark_wt62ll.png" alt="Logo MyPymeApp" />
        <h1>Factura de Suscripción</h1>
        </div>
        <div class="content">
        <h2>Hola ${name} 👋</h2>
        <p>Tu pago de suscripción <strong>PREMIUM</strong> se registró correctamente.</p>
        <p><strong>Monto pagado:</strong> ${amount.toFixed(2)} ${currency.toUpperCase()}</p>
        <p><strong>Válido hasta:</strong> ${validUntil}</p>
        <p>Gracias por confiar en <strong>MyPymeApp</strong>. 🎉</p>
        </div>
        <div class="footer">
        © ${new Date().getFullYear()} MyPymeApp. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
`;
