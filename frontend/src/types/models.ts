/** Roles de usuario, reflejan laboratory.User.ROLE_CHOICES en el backend. */
export type Role = 'admin' | 'scientist' | 'assistant'

export type UserStatus = 'active' | 'inactive' | 'suspended'
export type Status = 'active' | 'inactive'
export type SampleTestStatus = 'pending' | 'in_progress' | 'completed'

/** Registro genérico devuelto por la API: siempre tiene id, el resto varía por recurso. */
export interface ApiRecord {
  id: string
  [key: string]: unknown
}

export interface User extends ApiRecord {
  email: string
  role: Role
  status: UserStatus
  created: string
  modified: string
}

export interface Scientist extends ApiRecord {
  names: string
  father_surname: string
  mother_surname: string
  specialty: string
  license_number: string
  phone: string | null
  user: string | null
  status: Status
}

export interface Assistant extends ApiRecord {
  names: string
  father_surname: string
  mother_surname: string
  laboratory_zone: string | null
  shift_hours: string | null
  phone: string | null
  user: string | null
  status: Status
}

export interface Project extends ApiRecord {
  project_name: string
  funding_source: string | null
  budget: string | null
  description: string | null
  scientists: string | Scientist
  status: Status
}

export interface Sample extends ApiRecord {
  sample_type: string
  storage_temperature: string | null
  collection_date: string
  description: string | null
  projects: string | Project
  status: Status
}

export interface LabTest extends ApiRecord {
  test_name: string
  protocol_description: string
  estimated_duration: number | null
  status: Status
}

export interface SampleTest extends ApiRecord {
  samples: string | Sample
  tests: string | LabTest
  assistants: string | Assistant | null
  scientists: string | Scientist | null
  result_data: string | null
  test_date: string
  status: SampleTestStatus
}

export interface AssistantProject extends ApiRecord {
  assistants: string | Assistant
  projects: string | Project
  assignment_date: string
  status: Status
}

/** Forma paginada estándar de DRF (PageNumberPagination). */
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface LoginResponse {
  access: string
  refresh: string
  role: Role
}
