export const welcomeTemplate = (name: string) => `
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
    .content { padding:20px; color:#333; }
    .btn {
      display:inline-block; margin-top:20px; padding:10px 20px; background:#27ae60; 
      color:#fff; text-decoration:none; border-radius:4px;
    }
    .footer {
      text-align:center; font-size:12px; color:#aaa; margin-top:20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a MyPyme!</h1>
    </div>
    <div class="content">
      <h2>Hola ${name} 👋</h2>
      <p>Gracias por registrarte en <strong>MyPyme</strong>. Nos alegra tenerte a bordo. 
         Aquí podrás gestionar y hacer crecer tu negocio con nuestras herramientas.</p>
      <a href="https://mipyme.app" class="btn">Ir a MyPyme</a>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} MyPyme. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
`;

