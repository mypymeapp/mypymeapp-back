export const dailyReportTemplate = (
    companyName: string,
    members: string[],
    categories: string[],
    products: string[],
    salesCount: number,
    totalSales: number,
    currency: string,
    invoicesCount: number,
    customers: string[],
    lowStock: { name: string; qty: number }[],
    suppliers: { name: string; category: string }[], // 👈 ahora objetos con categoría
) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <style>
        body { font-family: Arial, sans-serif; background:#f9f9f9; padding:0; margin:0; }
        .container { max-width:600px; margin:0 auto; background:#fff; padding:20px; border-radius:8px; }
        .header { text-align:center; background:#2c3e50; color:#fff; padding:20px; border-radius:8px 8px 0 0; }
        .content { padding:20px; color:#333; }
        ul { margin:0; padding-left:20px; }
        .footer { text-align:center; font-size:12px; color:#aaa; margin-top:20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
        <img src="https://res.cloudinary.com/dnoakcx0v/image/upload/v1758124300/logo-dark_wt62ll.png" height="60" />
        <h1>📊 Resumen Diario - ${companyName}</h1>
        </div>

        <div class="content">
        <h2>🧑‍🤝‍🧑 Nuevos miembros</h2>
        <ul>${members.map(m => `<li>${m}</li>`).join('') || '<li>Ninguno</li>'}</ul>

        <h2>📂 Categorías nuevas</h2>
        <ul>${categories.map(c => `<li>${c}</li>`).join('') || '<li>Ninguna</li>'}</ul>

        <h2>📦 Nuevos productos</h2>
        <ul>${products.map(p => `<li>${p}</li>`).join('') || '<li>Ninguno</li>'}</ul>

        <h2>💰 Ventas del día</h2>
        <p>${salesCount} transacciones (Total: ${totalSales.toFixed(2)} ${currency || ''})</p>

        <h2>🧾 Facturas emitidas</h2>
        <p>${invoicesCount}</p>

        <h2>🧑‍💼 Clientes nuevos</h2>
        <ul>${customers.map(c => `<li>${c}</li>`).join('') || '<li>Ninguno</li>'}</ul>

        <h2>⚠️ Productos con stock bajo (&lt; 5)</h2>
        <ul>${lowStock.map(p => `<li>${p.name} - Stock: ${p.qty}</li>`).join('') || '<li>Ninguno</li>'}</ul>

        <h2>🏭 Proveedores nuevos</h2>
        <ul>${suppliers.map(s => `<li>${s.name} (Categoría: ${s.category})</li>`).join('') || '<li>Ninguno</li>'}</ul>
        </div>

        <div class="footer">
        © ${new Date().getFullYear()} MyPymeApp. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
`;
