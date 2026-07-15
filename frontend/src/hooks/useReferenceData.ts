import { useEffect, useState } from 'react'
import api from '../api/client'
import type { ResourceConfig } from '../config/resources'
import type { ApiRecord, Paginated } from '../types/models'

export interface ReferenceBucket {
  items: ApiRecord[]
  byId: Record<string, ApiRecord>
}

export type ReferenceMap = Record<string, ReferenceBucket>

/**
 * Carga las listas de todos los endpoints referenciados (FK) por un recurso,
 * tanto en columnas como en campos de formulario.
 */
export function useReferenceData(resource: ResourceConfig | undefined): { refs: ReferenceMap; loading: boolean } {
  const [refs, setRefs] = useState<ReferenceMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!resource) {
      setRefs({})
      setLoading(false)
      return
    }

    const endpoints = new Set<string>()
    ;[...(resource.columns || []), ...(resource.fields || [])].forEach((f) => {
      if (f.type === 'ref' && f.ref) endpoints.add(f.ref)
    })

    if (endpoints.size === 0) {
      setRefs({})
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all(
      [...endpoints].map((ep) =>
        api
          .get<Paginated<ApiRecord> | ApiRecord[]>(`/${ep}/`, { params: { page_size: 200 } })
          .then((res): [string, ReferenceBucket] => {
            const items = Array.isArray(res.data) ? res.data : res.data.results
            const byId: Record<string, ApiRecord> = {}
            items.forEach((it) => {
              byId[it.id] = it
            })
            return [ep, { items, byId }]
          })
          .catch((): [string, ReferenceBucket] => [ep, { items: [], byId: {} }])
      )
    ).then((entries) => {
      if (!cancelled) {
        setRefs(Object.fromEntries(entries))
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource?.key])

  return { refs, loading }
}
