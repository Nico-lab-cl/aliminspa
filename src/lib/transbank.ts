import { Environment, IntegrationApiKeys, IntegrationCommerceCodes, Options, WebpayPlus } from 'transbank-sdk'

/**
 * Webpay Plus, el mismo comercio de Transbank que usa aliminlomasdelmar.com
 * (21-11-2026: Nico confirmó que Arena y Sol se cobra con la misma razón
 * social). Las claves van solo en EasyPanel:
 *
 *   TBK_ENV=production
 *   TBK_API_KEY_ID      (código de comercio)
 *   TBK_API_KEY_SECRET  (llave secreta)
 *
 * Sin TBK_ENV=production se usa el ambiente de integración de Transbank, que
 * no cobra nada y acepta solo las tarjetas de prueba publicadas por Transbank.
 */
export function webpayEnProduccion() {
    return process.env.TBK_ENV === 'production'
}

function transaccion() {
    if (webpayEnProduccion()) {
        const id = process.env.TBK_API_KEY_ID
        const secreto = process.env.TBK_API_KEY_SECRET
        if (!id || !secreto) throw new Error('Faltan TBK_API_KEY_ID o TBK_API_KEY_SECRET para Webpay en producción.')
        return new WebpayPlus.Transaction(new Options(id, secreto, Environment.Production))
    }
    return new WebpayPlus.Transaction(
        new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration)
    )
}

export async function webpayCrear(a: { buyOrder: string; sessionId: string; monto: number; returnUrl: string }) {
    const r = (await transaccion().create(a.buyOrder, a.sessionId, a.monto, a.returnUrl)) as { token: string; url: string }
    return { token: r.token, url: r.url }
}

export interface ResultadoWebpay {
    status: string
    response_code: number
    amount: number
    buy_order: string
    authorization_code?: string
    payment_type_code?: string
    installments_number?: number
    card_detail?: { card_number?: string }
}

export async function webpayConfirmar(token: string): Promise<ResultadoWebpay> {
    return (await transaccion().commit(token)) as ResultadoWebpay
}

export const pagoAprobado = (r: ResultadoWebpay) => r.status === 'AUTHORIZED' && r.response_code === 0
