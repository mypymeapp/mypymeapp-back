export function passwordResetTemplate(resetUrl: string) {
    return `
        <h1>Restablecer tu contraseña</h1>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}" target="_blank"
        style="background:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
        Restablecer contraseña
        </a>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
    `;
}
