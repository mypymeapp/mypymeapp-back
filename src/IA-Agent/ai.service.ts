import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AiService {
  private openai: OpenAI;

  // Regex que permite temas de negocio (ventas, compras, productos, stock, proyecciones, promociones…)
  private allowedRegex =
    /(venta|ventas|compra|compras|proveedor(?:es)?|cliente(?:s)?|producto(?:s)?|art[ií]culo(?:s)?|servicio(?:s)?|categor[ií]a(?:s)?|stock|existencia(?:s)?|almac[eé]n|inventario(?:s)?|pedido(?:s)?|orden(?:es)?|devoluci[oó]n(?:es)?|proyecci[oó]n(?:es)?|promoci[oó]n(?:es)?|oferta(?:s)?|descuento(?:s)?|rebaja(?:s)?|campaña(?:s)?|facturaci[oó]n|ingreso(?:s)?|egreso(?:s)?|costo(?:s)?|gasto(?:s)?|ganancia(?:s)?|utilidad(?:es)?|margen(?:es)?|precio(?:s)?|pago(?:s)?|cobro(?:s)?|impuesto(?:s)?)/i;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  async ask(companyId: string, question: string) {
    // 1️⃣ Filtrar preguntas fuera del dominio permitido
    if (!this.allowedRegex.test(question)) {
      return 'Lo siento, sólo puedo responder preguntas sobre la gestión de tu negocio.';
    }

    // 2️⃣ Traer datos históricos relevantes de la empresa
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
      include: { items: { include: { product: true } }, customer: true },
    });

    const orders = await this.prisma.order.findMany({
      where: { companyId },
      include: { items: { include: { product: true } }, supplier: true },
    });

    // 3️⃣ Preparar resumen en texto
    const salesData = invoices
      .map(
        (inv) =>
          `Venta a ${inv.customer.name} el ${inv.issuedAt.toISOString()}: ${inv.items
            .map((i) => `${i.qty} x ${i.product.name} a ${i.price}`)
            .join(', ')}`,
      )
      .join('\n');

    const purchaseData = orders
      .map(
        (ord) =>
          `Compra a ${ord.supplier.name} el ${ord.date.toISOString()}: ${ord.items
            .map(
              (i) =>
                `${i.quantity} x ${i.product.name} a ${i.product.cost ?? 0}`,
            )
            .join(', ')}`,
      )
      .join('\n');

    // 4️⃣ Prompt reforzado
    const prompt = `
Eres un asistente experto en gestión de pequeñas empresas. 
Tu única función es analizar los datos de ventas, compras, stock, productos, proyecciones y promociones 
de la empresa y dar recomendaciones o responder preguntas sobre esos temas.

NO debes responder nada que no esté relacionado con la gestión de este negocio.

Aquí tienes los datos históricos de la empresa:

VENTAS:
${salesData || 'No hay ventas registradas.'}

COMPRAS:
${purchaseData || 'No hay compras registradas.'}

Pregunta del dueño: "${question}"

Responde de forma clara, concisa y enfocada únicamente en la gestión del negocio.
`;

    // 5️⃣ Llamar a OpenAI
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // puedes usar 'gpt-3.5-turbo' si prefieres
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    return response.choices[0].message?.content;
  }
}

