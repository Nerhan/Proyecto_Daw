import { useState, type FormEvent } from 'react'
import { resolveOptions, type FieldConfig, type ResourceConfig } from '../config/resources'
import type { ReferenceMap } from '../hooks/useReferenceData'
import type { ApiRecord, Role } from '../types/models'

/** Extrae el id de un valor FK que puede venir como id plano u objeto anidado. */
function refValue(v: unknown): string {
  if (v && typeof v === 'object' && 'id' in v) return String((v as { id: unknown }).id)
  return v == null ? '' : String(v)
}

type FormState = Record<string, string>

/** Construye el estado inicial del formulario a partir de la config y (opcional) el registro. */
function buildInitial(fields: FieldConfig[], record: ApiRecord | null): FormState {
  const state: FormState = {}
  fields.forEach((f) => {
    if (record) {
      // Campos write_only (password, o email en Científicos/Asistentes) no
      // vienen en la respuesta con su propio nombre; sourceKey apunta a la
      // versión legible (p. ej. 'user_email') para precargar el valor.
      const raw = record[f.sourceKey ?? f.name]
      state[f.name] = f.type === 'ref' ? refValue(raw) : raw == null ? '' : String(raw)
    } else {
      state[f.name] = f.default ?? ''
    }
  })
  return state
}

interface ResourceFormProps {
  resource: ResourceConfig
  record: ApiRecord | null
  refs: ReferenceMap
  actingRole: Role | undefined
  onSubmit: (payload: Record<string, unknown>) => void
  onCancel: () => void
  submitting: boolean
}

export function ResourceForm({
  resource,
  record,
  refs,
  actingRole,
  onSubmit,
  onCancel,
  submitting,
}: ResourceFormProps) {
  const isEdit = !!record
  const [form, setForm] = useState<FormState>(() => buildInitial(resource.fields, record))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setField = (name: string, value: string) => setForm((f) => ({ ...f, [name]: value }))

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    resource.fields.forEach((f) => {
      const val = form[f.name]
      const empty = val === '' || val == null
      if (f.required && empty) errs[f.name] = 'Requerido'
      if (f.requiredOnCreate && !isEdit && empty) errs[f.name] = 'Requerido'
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // Construye el payload: omite vacíos opcionales; password vacío no se envía.
    const payload: Record<string, unknown> = {}
    resource.fields.forEach((f) => {
      const val = form[f.name]
      if (f.type === 'password' && (val === '' || val == null)) return
      const isOptionalField = f.optional || (!f.required && !f.requiredOnCreate)
      if (isOptionalField && (val === '' || val == null)) {
        // Los FK opcionales vacíos se envían como null para poder desvincular.
        if (f.type === 'ref') {
          payload[f.name] = null
          return
        }
        if (f.type === 'number') return
      }
      payload[f.name] = f.type === 'ref' && val === '' ? null : val
    })

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      {resource.fields.map((f) => {
        const err = errors[f.name]
        const inputId = `f_${f.name}`
        const commonProps = {
          id: inputId,
          value: form[f.name] ?? '',
        }
        return (
          <div className="field" key={f.name}>
            <label htmlFor={inputId}>
              {f.label}
              {(f.required || (f.requiredOnCreate && !isEdit)) && <span className="req"> *</span>}
            </label>

            {f.type === 'textarea' ? (
              <textarea
                className="textarea"
                {...commonProps}
                onChange={(e) => setField(f.name, e.target.value)}
              />
            ) : f.type === 'select' ? (
              <select
                className="select"
                {...commonProps}
                onChange={(e) => setField(f.name, e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {resolveOptions(f, actingRole).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === 'ref' ? (
              <select
                className="select"
                {...commonProps}
                onChange={(e) => setField(f.name, e.target.value)}
              >
                <option value="">{f.optional ? '— Ninguno —' : '— Seleccionar —'}</option>
                {(refs[f.ref ?? '']?.items || []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {f.optionLabel ? f.optionLabel(o) : o.id}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                type={
                  f.type === 'password' ? 'password' : f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'
                }
                step={f.step}
                autoComplete={f.type === 'password' ? 'new-password' : 'off'}
                {...commonProps}
                onChange={(e) => setField(f.name, e.target.value)}
              />
            )}

            {err && <span className="field-error">{err}</span>}
            {!err && f.hint && (
              <span className="field-error" style={{ color: 'var(--text-faint)' }}>
                {f.hint}
              </span>
            )}
          </div>
        )
      })}

      <div className="modal-foot" style={{ margin: '4px -22px -22px', borderRadius: '0 0 14px 14px' }}>
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
