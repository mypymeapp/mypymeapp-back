//Welcome mail
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
    .header img {
      height:100px; width:auto; margin-bottom:10px;
    }
    .content { padding:20px; color:#333; }
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
      <h1>¡Bienvenido!</h1>
    </div>
    <div class="content">
      <h2>Hola ${name} 👋</h2>
      <p>
        <p>
  Gracias por registrarte en <strong>MyPymeApp</strong>. Nos alegra tenerte a bordo. 
  Aquí podrás gestionar y hacer crecer tu negocio con nuestras herramientas.
</p>
<p>
  Desde ahora contarás con un panel intuitivo para administrar tus clientes, productos y servicios, 
  recibir reportes en tiempo real y optimizar tus procesos. 
</p>
<p>
  También iremos enviándote consejos y actualizaciones para que aproveches al máximo cada función de la plataforma. 
  Si necesitas ayuda, nuestro equipo de soporte está listo para acompañarte en cada paso.
</p>
<p>
  ¡Bienvenido a la comunidad de emprendedores y empresas que confían en <strong>MyPymeApp</strong> 
  para impulsar su crecimiento!
</p>

      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} MyPymeApp. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
`;

