import type { ApiRecord, Role, Status, SampleTestStatus, UserStatus } from '../types/models'
import type { IconName } from '../components/Icon'

export interface SelectOption {
  value: string
  label: string
}

export type FieldType = 'text' | 'email' | 'password' | 'textarea' | 'number' | 'select' | 'ref'
export type ColumnType = 'status' | 'role' | 'date' | 'money' | 'mono' | 'ref' | 'temp' | undefined

export interface ColumnConfig {
  key: string
  label: string
  type?: ColumnType
  ref?: string
  optionLabel?: (obj: ApiRecord) => string
  sortable?: boolean
}

export interface FilterConfig {
  name: string
  label: string
  allLabel: string
  options?: SelectOption[]
  ref?: string
  optionLabel?: (obj: ApiRecord) => string
  default?: string
}

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  required?: boolean
  requiredOnCreate?: boolean
  optional?: boolean
  default?: string
  hint?: string
  step?: string
  options?: SelectOption[] | ((actingRole: Role | undefined) => SelectOption[])
  ref?: string
  optionLabel?: (obj: ApiRecord) => string
  sourceKey?: string
}

export interface ResourceConfig {
  key: string
  endpoint: string
  label: string
  singular: string
  icon: IconName
  group: string
  view: Role[]
  create: Role[]
  update: Role[]
  del: Role[]
  search: boolean
  columns: ColumnConfig[]
  fields: FieldConfig[]
  filters?: FilterConfig[]
  detail?: boolean
  kanban?: boolean
}

export const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export const USER_STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'suspended', label: 'Suspendido' },
]

export const ROLE_OPTIONS: SelectOption[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'scientist', label: 'Científico' },
  { value: 'assistant', label: 'Asistente' },
]

export const TEST_STATUS_OPTIONS: SelectOption[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'completed', label: 'Completado' },
  { value: 'rejected', label: 'Rechazado' },
]

const personName = (o: ApiRecord | undefined): string =>
  o ? `${o.names as string} ${(o.father_surname as string) || ''}`.trim() : ''

export const RESOURCES: ResourceConfig[] = [
  {
    key: 'users',
    endpoint: 'users',
    label: 'Usuarios',
    singular: 'Usuario',
    icon: 'users',
    group: 'Administración',
    view: ['admin'],
    create: [],
    update: ['admin'],
    del: ['admin'],
    search: false,
    filters: [
      { name: 'role', label: 'Rol', allLabel: 'Todos los roles', options: ROLE_OPTIONS },
      { name: 'status', label: 'Estado', allLabel: 'Todos los estados', options: USER_STATUS_OPTIONS },
    ],
    columns: [
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Rol', type: 'role' },
      { key: 'status', label: 'Estado', type: 'status' },
      { key: 'created', label: 'Creado', type: 'date' },
    ],
    fields: [
      { name: 'email', label: 'Email institucional', type: 'email', required: true, hint: 'Debe terminar en @unsa.edu.pe' },
      { name: 'password', label: 'Contraseña', type: 'password', optional: true, hint: 'Dejar vacío para no cambiarla' },
      { name: 'role', label: 'Rol', type: 'select', options: ROLE_OPTIONS, required: true },
      { name: 'status', label: 'Estado', type: 'select', options: USER_STATUS_OPTIONS, default: 'active' },
    ],
  },
  {
    key: 'scientists',
    endpoint: 'scientists',
    label: 'Científicos',
    singular: 'Científico',
    icon: 'scientist',
    group: 'Personal',
    view: ['admin', 'scientist', 'assistant'],
    create: ['admin'],
    update: ['admin'],
    del: ['admin'],
    search: true,
    filters: [
      { name: 'status', label: 'Estado', allLabel: 'Todos los estados', options: STATUS_OPTIONS, default: 'active' },
    ],
    columns: [
      { key: 'names', label: 'Nombres' },
      { key: 'father_surname', label: 'Apellido' },
      { key: 'specialty', label: 'Especialidad' },
      { key: 'license_number', label: 'Licencia', type: 'mono' },
      { key: 'user_email', label: 'Cuenta de acceso', type: 'mono', sortable: false },
      { key: 'status', label: 'Estado', type: 'status' },
    ],
    fields: [
      { name: 'names', label: 'Nombres', type: 'text', required: true },
      { name: 'father_surname', label: 'Apellido paterno', type: 'text', required: true },
      { name: 'mother_surname', label: 'Apellido materno', type: 'text', required: true },
      { name: 'specialty', label: 'Especialidad', type: 'text', required: true },
      { name: 'license_number', label: 'N.º de licencia', type: 'text', required: true, hint: 'Mínimo 5 caracteres' },
      { name: 'phone', label: 'Teléfono', type: 'text' },
      { name: 'email', label: 'Email institucional (cuenta de acceso)', type: 'email', requiredOnCreate: true, sourceKey: 'user_email', hint: 'Con este email y contraseña el científico inicia sesión' },
      { name: 'password', label: 'Contraseña', type: 'password', requiredOnCreate: true, hint: 'Al editar, dejar vacío para no cambiarla' },
      { name: 'status', label: 'Estado', type: 'select', options: STATUS_OPTIONS, default: 'active' },
    ],
  },
  {
    key: 'assistants',
    endpoint: 'assistants',
    label: 'Asistentes',
    singular: 'Asistente',
    icon: 'assistant',
    group: 'Personal',
    view: ['admin', 'scientist', 'assistant'],
    create: ['admin', 'scientist'],
    update: ['admin', 'scientist'],
    del: ['admin', 'scientist'],
    search: true,
    filters: [
      { name: 'status', label: 'Estado', allLabel: 'Todos los estados', options: STATUS_OPTIONS, default: 'active' },
    ],
    columns: [
      { key: 'names', label: 'Nombres' },
      { key: 'father_surname', label: 'Apellido' },
      { key: 'laboratory_zone', label: 'Zona' },
      { key: 'shift_hours', label: 'Turno' },
      { key: 'user_email', label: 'Cuenta de acceso', type: 'mono', sortable: false },
      { key: 'status', label: 'Estado', type: 'status' },
    ],
    fields: [
      { name: 'names', label: 'Nombres', type: 'text', required: true },
      { name: 'father_surname', label: 'Apellido paterno', type: 'text', required: true },
      { name: 'mother_surname', label: 'Apellido materno', type: 'text', required: true },
      { name: 'laboratory_zone', label: 'Zona de laboratorio', type: 'text' },
      { name: 'shift_hours', label: 'Turno', type: 'text', hint: 'Ej: Mañana, Tarde, Noche (mín. 4 caracteres)' },
      { name: 'phone', label: 'Teléfono', type: 'text' },
      { name: 'email', label: 'Email institucional (cuenta de acceso)', type: 'email', requiredOnCreate: true, sourceKey: 'user_email', hint: 'Con este email y contraseña el asistente inicia sesión' },
      { name: 'password', label: 'Contraseña', type: 'password', requiredOnCreate: true, hint: 'Al editar, dejar vacío para no cambiarla' },
      { name: 'status', label: 'Estado', type: 'select', options: STATUS_OPTIONS, default: 'active' },
    ],
  },
  {
    key: 'projects',
    endpoint: 'projects',
    label: 'Proyectos',
    singular: 'Proyecto',
    icon: 'project',
    group: 'Investigación',
    view: ['admin', 'scientist', 'assistant'],
    create: ['admin', 'scientist'],
    update: ['admin', 'scientist'],
    del: ['admin', 'scientist'],
    search: true,
    detail: true,
    filters: [
      { name: 'status', label: 'Estado', allLabel: 'Todos los estados', options: STATUS_OPTIONS, default: 'active' },
      { name: 'scientists', label: 'Investigador', allLabel: 'Todos los investigadores', ref: 'scientists', optionLabel: personName },
    ],
    columns: [
      { key: 'project_name', label: 'Proyecto' },
      { key: 'scientists', label: 'Investigador principal', type: 'ref', ref: 'scientists', optionLabel: personName },
      { key: 'budget', label: 'Presupuesto', type: 'money' },
      { key: 'funding_source', label: 'Financiamiento' },
      { key: 'status', label: 'Estado', type: 'status' },
    ],
    fields: [
      { name: 'project_name', label: 'Nombre del proyecto', type: 'text', required: true },
      { name: 'scientists', label: 'Investigador principal', type: 'ref', ref: 'scientists', optionLabel: personName, required: true },
      { name: 'funding_source', label: 'Fuente de financiamiento', type: 'text' },
      { name: 'budget', label: 'Presupuesto (S/.)', type: 'number', step: '0.01', hint: 'No puede ser negativo' },
      { name: 'description', label: 'Descripción', type: 'textarea' },
      { name: 'status', label: 'Estado', type: 'select', options: STATUS_OPTIONS, default: 'active' },
    ],
  },
  {
    key: 'samples',
    endpoint: 'samples',
    label: 'Muestras',
    singular: 'Muestra',
    icon: 'sample',
    group: 'Investigación',
    view: ['admin', 'scientist', 'assistant'],
    create: ['admin', 'scientist', 'assistant'],
    update: ['admin', 'scientist', 'assistant'],
    del: ['admin', 'scientist', 'assistant'],
    search: true,
    filters: [
      { name: 'status', label: 'Estado', allLabel: 'Todos los estados', options: STATUS_OPTIONS, default: 'active' },
      { name: 'projects', label: 'Proyecto', allLabel: 'Todos los proyectos', ref: 'projects', optionLabel: (o) => o.project_name as string },
    ],
    columns: [
      { key: 'sample_type', label: 'Tipo de muestra' },
      { key: 'projects', label: 'Proyecto', type: 'ref', ref: 'projects', optionLabel: (o) => o.project_name as string },
      { key: 'storage_temperature', label: 'Temp. (°C)', type: 'temp' },
      { key: 'collection_date', label: 'Recolección', type: 'date' },
      { key: 'status', label: 'Estado', type: 'status' },
    ],
    fields: [
      { name: 'sample_type', label: 'Tipo de muestra', type: 'text', required: true },
      { name: 'projects', label: 'Proyecto', type: 'ref', ref: 'projects', optionLabel: (o) => o.project_name as string, required: true },
      { name: 'storage_temperature', label: 'Temperatura de almacenamiento (°C)', type: 'number', step: '0.01', hint: 'No puede superar 4.0 °C' },
      { name: 'description', label: 'Descripción', type: 'textarea' },
      { name: 'status', label: 'Estado', type: 'select', options: STATUS_OPTIONS, default: 'active' },
    ],
  },
  {
    key: 'tests',
    endpoint: 'tests',
    label: 'Protocolos',
    singular: 'Protocolo',
    icon: 'test',
    group: 'Investigación',
    view: ['admin', 'scientist', 'assistant'],
    create: ['admin', 'scientist'],
    update: ['admin', 'scientist'],
    del: ['admin', 'scientist'],
    search: true,
    filters: [
      { name: 'status', label: 'Estado', allLabel: 'Todos los estados', options: STATUS_OPTIONS, default: 'active' },
    ],
    columns: [
      { key: 'test_name', label: 'Protocolo' },
      { key: 'estimated_duration', label: 'Duración (min)', type: 'mono' },
      { key: 'status', label: 'Estado', type: 'status' },
    ],
    fields: [
      { name: 'test_name', label: 'Nombre del protocolo', type: 'text', required: true },
      { name: 'protocol_description', label: 'Descripción del protocolo', type: 'textarea', required: true },
      { name: 'estimated_duration', label: 'Duración estimada (min)', type: 'number', hint: 'Debe ser mayor a 0' },
      { name: 'status', label: 'Estado', type: 'select', options: STATUS_OPTIONS, default: 'active' },
    ],
  },
  {
    key: 'sample-tests',
    endpoint: 'sample-tests',
    label: 'Resultados',
    singular: 'Resultado de prueba',
    icon: 'results',
    group: 'Investigación',
    view: ['admin', 'scientist', 'assistant'],
    create: ['admin', 'scientist', 'assistant'],
    update: ['admin', 'scientist', 'assistant'],
    del: ['admin', 'scientist', 'assistant'],
    search: true,
    kanban: true,
    filters: [
      { name: 'status', label: 'Estado', allLabel: 'Todos los estados', options: TEST_STATUS_OPTIONS },
      { name: 'tests', label: 'Protocolo', allLabel: 'Todos los protocolos', ref: 'tests', optionLabel: (o) => o.test_name as string },
    ],
    columns: [
      { key: 'samples', label: 'Muestra', type: 'ref', ref: 'samples', optionLabel: (o) => o.sample_type as string },
      { key: 'tests', label: 'Protocolo', type: 'ref', ref: 'tests', optionLabel: (o) => o.test_name as string },
      { key: 'assistants', label: 'Asistente', type: 'ref', ref: 'assistants', optionLabel: personName },
      { key: 'test_date', label: 'Fecha', type: 'date' },
      { key: 'status', label: 'Estado', type: 'status' },
    ],
    fields: [
      { name: 'samples', label: 'Muestra', type: 'ref', ref: 'samples', optionLabel: (o) => `${o.sample_type as string}`, required: true },
      { name: 'tests', label: 'Protocolo aplicado', type: 'ref', ref: 'tests', optionLabel: (o) => o.test_name as string, required: true },
      { name: 'assistants', label: 'Asistente responsable', type: 'ref', ref: 'assistants', optionLabel: personName, optional: true },
      { name: 'scientists', label: 'Científico supervisor', type: 'ref', ref: 'scientists', optionLabel: personName, optional: true },
      { name: 'result_data', label: 'Datos del resultado', type: 'textarea' },
      { name: 'status', label: 'Estado', type: 'select', options: TEST_STATUS_OPTIONS, default: 'pending' },
    ],
  },
  {
    key: 'assistant-projects',
    endpoint: 'assistant-projects',
    label: 'Asignaciones',
    singular: 'Asignación',
    icon: 'link',
    group: 'Investigación',
    view: ['admin', 'scientist', 'assistant'],
    create: ['admin', 'scientist'],
    update: ['admin', 'scientist'],
    del: ['admin', 'scientist'],
    search: false,
    filters: [
      { name: 'status', label: 'Estado', allLabel: 'Todos los estados', options: STATUS_OPTIONS, default: 'active' },
      { name: 'projects', label: 'Proyecto', allLabel: 'Todos los proyectos', ref: 'projects', optionLabel: (o) => o.project_name as string },
    ],
    columns: [
      { key: 'assistants', label: 'Asistente', type: 'ref', ref: 'assistants', optionLabel: personName },
      { key: 'projects', label: 'Proyecto', type: 'ref', ref: 'projects', optionLabel: (o) => o.project_name as string },
      { key: 'assignment_date', label: 'Asignado', type: 'date' },
      { key: 'status', label: 'Estado', type: 'status' },
    ],
    fields: [
      { name: 'assistants', label: 'Asistente', type: 'ref', ref: 'assistants', optionLabel: personName, required: true },
      { name: 'projects', label: 'Proyecto', type: 'ref', ref: 'projects', optionLabel: (o) => o.project_name as string, required: true },
      { name: 'status', label: 'Estado', type: 'select', options: STATUS_OPTIONS, default: 'active' },
    ],
  },
]

export const RESOURCE_BY_KEY: Record<string, ResourceConfig> = Object.fromEntries(
  RESOURCES.map((r) => [r.key, r])
)

export function resourcesForRole(role: Role | undefined): ResourceConfig[] {
  if (!role) return []
  return RESOURCES.filter((r) => r.view.includes(role))
}

export function canCreate(resource: ResourceConfig, role: Role | undefined): boolean {
  return !!role && resource.create.includes(role)
}

export function canUpdate(resource: ResourceConfig, role: Role | undefined): boolean {
  return !!role && resource.update.includes(role)
}

export function canDelete(resource: ResourceConfig, role: Role | undefined): boolean {
  return !!role && resource.del.includes(role)
}

export function resolveOptions(field: FieldConfig, actingRole: Role | undefined): SelectOption[] {
  if (!field.options) return []
  return typeof field.options === 'function' ? field.options(actingRole) : field.options
}

export type { Status, SampleTestStatus, UserStatus }
