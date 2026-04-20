export const STATUS_LABELS: Record<string, string> = {
  visitado_sem_foco:   'Sem achado',
  visitado_com_achado: 'Com achado',
  recusado:            'Recusado',
  fechado:             'Fechado',
  pendente:            'Pendente',
}

export const STATUS_COLORS: Record<string, string> = {
  visitado_sem_foco:   'bg-blue-50 text-blue-700',
  visitado_com_achado: 'bg-red-50 text-red-700',
  recusado:            'bg-orange-50 text-orange-700',
  fechado:             'bg-slate-100 text-slate-600',
  pendente:            'bg-yellow-50 text-yellow-700',
}
