# BioMatrix Labs

Sistema de gestión de un laboratorio científico/clínico: científicos, asistentes, proyectos de investigación, muestras y pruebas de laboratorio con sus resultados. Consta de un **backend** (API REST con Django) y un **frontend** (React + Vite).

- **Backend** (este directorio + `BioMatrix_Labs/`): API REST documentada en esta guía.
- **Frontend** ([`frontend/`](frontend/)): interfaz web con estética futurista de laboratorio, temas claro/oscuro y vistas diferenciadas por rol. Ver [frontend/README.md](frontend/README.md).

## Stack

- Django 6.0 + Django REST Framework
- Autenticación JWT (`djangorestframework-simplejwt`), conectada al modelo de dominio `laboratory.User` (no al `User` interno de Django, que solo se usa para `/admin/`)
- PostgreSQL (Supabase) en producción/desarrollo, SQLite en memoria para tests
- Documentación interactiva con `drf-spectacular` (Swagger / Redoc)
- CORS habilitado (`django-cors-headers`) para el frontend
- Frontend: React 18 + TypeScript + Vite 6 + React Router + Axios

## Requisitos previos

- Python 3.12+
- Una base de datos Postgres (por ejemplo, un proyecto de [Supabase](https://supabase.com)) o una `DATABASE_URL` ya provisionada

## Instalación

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt

cp BioMatrix_Labs/.env.example BioMatrix_Labs/.env
# Editar BioMatrix_Labs/.env con tus propios valores (ver tabla de abajo)

cd BioMatrix_Labs
python manage.py migrate
python manage.py create_admin   # crea el primer usuario admin (ver "Autenticación")
python manage.py runserver
```

## Variables de entorno

Se leen desde `BioMatrix_Labs/.env` (no se commitea; ver `.env.example`).

| Variable | Descripción |
|---|---|
| `SECRET_KEY` | Clave secreta de Django. Generar una nueva por entorno, nunca reusar la de otro proyecto. |
| `DEBUG` | `True` solo en desarrollo local. En producción debe ser `False`. |
| `ALLOWED_HOSTS` | Lista separada por comas de hosts permitidos. |
| `DATABASE_URL` | Si está definida (típico en Render/Heroku), tiene prioridad sobre las variables `DB_*`. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Credenciales directas de Postgres, usadas solo si `DATABASE_URL` no está definida. |

**Nota de seguridad:** la contraseña de Supabase que este proyecto usó originalmente estuvo hardcodeada en `settings.py` y fue commiteada al repositorio público. Si no la has rotado ya, hazlo desde el panel de Supabase (Settings → Database → Reset password) y actualiza tu `.env` local; el valor viejo debe considerarse comprometido de forma permanente aunque se haya borrado del código.

## Autenticación

El login no usa el `TokenObtainPairView` por defecto de `simplejwt` porque este proyecto tiene su propio modelo de usuario de dominio (`laboratory.User`, con `role` y `password_hash`), separado del `User` interno de Django.

**No existe auto-registro ni alta directa de cuentas.** `POST /api/users/` está deshabilitado (405) para todos, incluido admin. Las cuentas se crean como efecto secundario de crear un perfil:

1. **Bootstrap del primer admin:** `python manage.py create_admin` (comando de management, se corre desde el servidor/terminal, no vía HTTP). Es la única forma de crear una cuenta `role=admin`.
2. **Alta de un científico:** `POST /api/scientists/` (solo `admin`) con los datos del perfil **más** `email` y `password` → crea el perfil *y* su cuenta `role=scientist` en la misma operación transaccional.
3. **Alta de un asistente:** `POST /api/assistants/` (`admin` o `scientist`) con los datos del perfil **más** `email` y `password` → crea el perfil *y* su cuenta `role=assistant`.
4. **Login:** `POST /api/token/` con `email` y `password` → devuelve `access`, `refresh` y `role`.
5. **Refresh:** `POST /api/token/refresh/` con `refresh` → devuelve un nuevo `access`.
6. Usar el token en cada request: header `Authorization: Bearer <access_token>`.

`/api/users/` sigue existiendo, pero solo para que `admin` administre cuentas ya creadas (listar, activar/suspender, cambiar email o contraseña, eliminar) — ver `laboratory/serializers/account_mixin.py` para la lógica de alta/actualización transaccional del `User` vinculado.

## Permisos por rol

`laboratory.User.role` puede ser `admin`, `scientist` o `assistant`.

- **Gestión de cuentas** (`/api/users/`): reservada por completo a `admin` (leer/editar/borrar); `scientist` y `assistant` no tienen acceso. Nadie puede crear (`POST`) directamente aquí.
- **Científicos** (`/api/scientists/`): crear/editar/borrar reservado a `admin` (implica gestionar la cuenta de acceso del científico); lectura para cualquier autenticado.
- **Asistentes** (`/api/assistants/`): crear/editar/borrar para `admin` o `scientist` (implica gestionar la cuenta de acceso del asistente); lectura para cualquier autenticado.
- **Escritura en proyectos y catálogo de tests** (`Project`, `Test`, `AssistantProject`): solo `admin` o `scientist`.
- **Escritura en trabajo de banco** (`Sample`, `SampleTest`): cualquier usuario autenticado, incluido `assistant`, ya que registrar muestras y resultados es su trabajo diario.

## Endpoints principales

| Recurso | Ruta |
|---|---|
| Usuarios | `/api/users/` |
| Científicos | `/api/scientists/` |
| Asistentes | `/api/assistants/` |
| Proyectos | `/api/projects/` |
| Muestras | `/api/samples/` |
| Tests (catálogo de protocolos) | `/api/tests/` |
| Resultados de tests sobre muestras | `/api/sample-tests/` |
| Asignación de asistentes a proyectos | `/api/assistant-projects/` |
| Login | `/api/token/` |
| Refresh de token | `/api/token/refresh/` |
| Documentación Swagger | `/api/docs/swagger/` |
| Documentación Redoc | `/api/docs/redoc/` |

Todos los listados soportan paginación (`?page=`), búsqueda (`?search=`) y filtros por campo (`?status=active`, etc.); ver `filterset_fields`/`search_fields` en `laboratory/views.py` para el detalle por recurso.

## Tests

```bash
cd BioMatrix_Labs
python manage.py test
```

Los tests corren contra SQLite en memoria (configurado en `settings.py`), así que no dependen de permisos de `CREATE DATABASE` en Postgres/Supabase ni de conectividad de red.

## Limitaciones conocidas

- `admin` no tiene restricciones adicionales sobre `UserViewSet` (puede editar el `role` o `status` de cualquier usuario, incluido otro admin); es el rol de máxima confianza del sistema, por diseño.
- El campo `status` de cada modelo (soft-delete) no filtra automáticamente los querysets: un registro `inactive` sigue siendo visible en la API salvo que se filtre explícitamente con `?status=active`.
