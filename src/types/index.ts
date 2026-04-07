export type MesaEstado = 'libre' | 'ocupada' | 'reservada'
export type ReservaEstado = 'pendiente' | 'confirmada' | 'cancelada'

export interface Mesa {
  id: string
  numero: number
  estado: MesaEstado
  descripcion: string | null
}

export interface Reserva {
  id: string
  mesa_id: string
  nombre_cliente: string
  telefono: string
  email: string | null
  fecha: string        // ISO date: YYYY-MM-DD
  hora_inicio: string  // HH:MM
  hora_fin: string     // HH:MM
  estado: ReservaEstado
  notas: string | null
  created_at: string
  // join opcional
  mesas?: Mesa
}

export interface HorarioBloqueo {
  id: string
  mesa_id: string | null  // null = bloqueo global
  fecha: string
  hora_inicio: string
  hora_fin: string
  motivo: string | null
  created_at: string
}

// Formulario de nueva reserva (cliente)
export interface ReservaFormData {
  mesa_id: string
  nombre_cliente: string
  telefono: string
  email: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  notas: string
}

// Formulario de bloqueo (admin)
export interface BloqueoFormData {
  mesa_id: string | null
  fecha: string
  hora_inicio: string
  hora_fin: string
  motivo: string
}
