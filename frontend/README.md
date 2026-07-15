# BioMatrix Labs — Frontend

Interfaz web (React + TypeScript + Vite) para la API de BioMatrix Labs. Estética
futurista de laboratorio con temas claro/oscuro, autenticación JWT y vistas
diferenciadas por rol (administrador, científico, asistente).

## Requisitos

- Node.js 18+ (probado con Node 24)
- El backend Django corriendo (por defecto en `http://localhost:8000`)

## Instalación y arranque

```bash
cd frontend
npm install

cp .env.example .env       # ajusta VITE_API_URL si tu backend no está en :8000
npm run dev
```

La app queda en `http://localhost:5173`.

```bash
npm run typecheck   # tsc -b --noEmit, sin generar archivos
npm run build        # tsc -b && vite build → genera dist/
npm run preview       # sirve el build localmente
```

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base de la API de Django | `http://localhost:8000/api` |

> El backend debe tener el origen del frontend en `CORS_ALLOWED_ORIGINS`
> (ya viene configurado para `http://localhost:5173`).

## Primer uso

No existe auto-registro público: dar de alta cuentas es una acción de gestión.

1. Levanta el backend y crea el primer admin:
   ```bash
   cd BioMatrix_Labs
   python manage.py migrate
   python manage.py create_admin   # pide email y password por consola
   python manage.py runserver
   ```
2. Levanta el frontend: `cd frontend && npm run dev`.
3. Abre `http://localhost:5173` e inicia sesión con la cuenta admin creada.
4. Desde el panel de **Usuarios**, ese admin puede dar de alta cuentas de
   científico o asistente. Un científico logueado también puede dar de alta
   asistentes (pero no otros científicos ni admins).

## Roles y permisos (reflejan los del backend)

| Sección | Admin | Científico | Asistente |
|---|:---:|:---:|:---:|
| Usuarios | Ver + crear (cualquier rol) + editar + borrar | Ver + crear (solo asistente) | Sin acceso |
| Científicos | CRUD | CRUD | Solo lectura |
| Asistentes | CRUD | CRUD | Solo lectura |
| Proyectos | CRUD | CRUD | Solo lectura |
| Protocolos (tests) | CRUD | CRUD | Solo lectura |
| Asignaciones | CRUD | CRUD | Solo lectura |
| Muestras | CRUD | CRUD | CRUD |
| Resultados de pruebas | CRUD | CRUD | CRUD |

Los permisos de creación/edición/borrado son independientes entre sí (por
ejemplo, un científico puede *crear* usuarios pero no *editarlos* ni
*borrarlos*): ver `create` / `update` / `del` en cada recurso de
[src/config/resources.ts](src/config/resources.ts). Al crear un usuario, el
selector de rol se restringe automáticamente a "Asistente" si quien está
logueado es un científico. Los ítems de solo lectura aparecen en el menú con
un candado. Aunque se intentara forzar una escritura, el backend la rechaza
con 403.

## Arquitectura

El frontend es **config-driven**: [src/config/resources.ts](src/config/resources.ts)
declara cada recurso (campos, columnas, permisos por rol) y una sola página
genérica [src/pages/ResourcePage.tsx](src/pages/ResourcePage.tsx) genera el CRUD
completo (tabla, búsqueda, paginación, formularios en modal, confirmación de
borrado). Para añadir o modificar un recurso normalmente basta con editar el
archivo de configuración. Todo el proyecto está en TypeScript con `strict: true`.

```
src/
├── types/models.ts             Interfaces de los modelos del backend (User, Project, ...)
├── api/client.ts                Axios + JWT + refresh transparente ante 401
├── config/resources.ts          Definición declarativa de todos los recursos y sus permisos
├── context/                     Auth · Theme (claro/oscuro) · Toast
├── components/                  Layout, DataTable, Modal, ResourceForm, Icon
├── hooks/useReferenceData.ts    Carga de opciones para selects de claves foráneas
├── pages/                       Login · Dashboard · ResourcePage
└── styles/index.css             Sistema de diseño (variables de tema + estética)
```

## Temas

El botón sol/luna (arriba a la derecha) alterna claro/oscuro. La preferencia se
guarda en `localStorage` y respeta el `prefers-color-scheme` del sistema en el
primer acceso.
