import { Resend } from 'resend'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Reserva } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'StrikePool <reservas@strikepool.com>'

function formatFecha(fecha: string) {
  return format(new Date(fecha + 'T00:00:00'), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
}

export async function sendConfirmacionReserva(reserva: Reserva & { mesas: { numero: number } }) {
  const fechaTexto = formatFecha(reserva.fecha)

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a1a;">¡Reserva confirmada! 🎱</h1>
      <p>Hola <strong>${reserva.nombre_cliente}</strong>,</p>
      <p>Tu reserva en <strong>StrikePool</strong> ha sido confirmada.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr>
          <td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Mesa</td>
          <td style="padding: 8px;">Mesa ${reserva.mesas.numero}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Fecha</td>
          <td style="padding: 8px; text-transform: capitalize;">${fechaTexto}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Hora</td>
          <td style="padding: 8px;">${reserva.hora_inicio} – ${reserva.hora_fin}</td>
        </tr>
      </table>

      <p>Si necesitas cancelar o modificar tu reserva, llámanos por teléfono.</p>
      <p style="color: #666; font-size: 14px;">StrikePool — Bar de Billar</p>
    </div>
  `

  return resend.emails.send({
    from: FROM,
    to: reserva.email!,
    subject: `Reserva confirmada — Mesa ${reserva.mesas.numero} el ${fechaTexto}`,
    html,
  })
}

export async function sendRecordatorioReserva(reserva: Reserva & { mesas: { numero: number } }) {
  const fechaTexto = formatFecha(reserva.fecha)

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a1a;">Recordatorio de reserva 🎱</h1>
      <p>Hola <strong>${reserva.nombre_cliente}</strong>,</p>
      <p>Te recordamos que tienes una reserva en <strong>StrikePool</strong> en <strong>1 hora</strong>.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr>
          <td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Mesa</td>
          <td style="padding: 8px;">Mesa ${reserva.mesas.numero}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Fecha</td>
          <td style="padding: 8px; text-transform: capitalize;">${fechaTexto}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Hora</td>
          <td style="padding: 8px;">${reserva.hora_inicio} – ${reserva.hora_fin}</td>
        </tr>
      </table>

      <p>¡Te esperamos!</p>
      <p style="color: #666; font-size: 14px;">StrikePool — Bar de Billar</p>
    </div>
  `

  return resend.emails.send({
    from: FROM,
    to: reserva.email!,
    subject: `Recordatorio — Tu reserva empieza en 1 hora`,
    html,
  })
}
