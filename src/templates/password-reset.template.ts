export const passwordResetTemplate = (resetUrl: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
        body { font-family: Arial, sans-serif; background-color:#f9f9f9; margin:0; padding:0;}
        .container {
        max-width:600px; margin:0 auto; background:#ffffff; padding:20px; border-radius:8px;
        box-shadow:0 2px 6px rgba(0,0,0,0.1);
        }
        .header {
        text-align:center; background:#2c3e50; color:#fff; padding:20px; border-radius:8px 8px 0 0;
        }
        .header img {
        height:100px; width:auto; margin-bottom:10px;
        }
        .content { padding:20px; color:#333; }
        .btn {
        display:inline-block; margin-top:20px; background:#4CAF50; color:white; 
        padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold;
        }
        .footer {
        text-align:center; font-size:12px; color:#aaa; margin-top:20px;
        }
    </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
        <!-- Logo -->
        <img src="https://res.cloudinary.com/dnoakcx0v/image/upload/v1758124300/logo-dark_wt62ll.png" alt="Logo MyPymeApp" />
        <h1>Restablecer Contraseña</h1>
        </div>
        <div class="content">
        <h2>¿Olvidaste tu contraseña?</h2>
        <p>
            No te preocupes, aquí tienes un enlace para crear una nueva contraseña de forma segura:
        </p>
        <a href="${resetUrl}" target="_blank" class="btn">Restablecer contraseña</a>
        <p style="margin-top:20px; font-size:14px; color:#555;">
            Si no solicitaste este cambio, simplemente ignora este correo.
        </p>
        </div>
        <div class="footer">
        © ${new Date().getFullYear()} MyPymeApp. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
`;
