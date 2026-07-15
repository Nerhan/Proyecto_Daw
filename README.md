# BioMatrix Labs

API REST (Django + Django REST Framework) para la gestión de un laboratorio científico/clínico: científicos, asistentes, proyectos de investigación, muestras y pruebas de laboratorio con sus resultados.

## Stack

- Django 6.0 + Django REST Framework
- Autenticación JWT (`djangorestframework-simplejwt`), conectada al modelo de dominio `laboratory.User` (no al `User` interno de Django, que solo se usa para `/admin/`)
- PostgreSQL (Supabase) en producción/desarrollo, SQLite en memoria para tests
- Documentación interactiva con `drf-spectacular` (Swagger / Redoc)

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

1. **Registro:** `POST /api/users/` (abierto, sin token) con `email`, `password`, `role`.
2. **Login:** `POST /api/token/` con `email` y `password` → devuelve `access` y `refresh`.
3. **Refresh:** `POST /api/token/refresh/` con `refresh` → devuelve un nuevo `access`.
4. Usar el token en cada request: header `Authorization: Bearer <access_token>`.

## Permisos por rol

`laboratory.User.role` puede ser `admin`, `scientist` o `assistant`.

- **Lectura** (`GET`): cualquier usuario autenticado.
- **Escritura en personal, proyectos y catálogo de tests** (`Scientist`, `Assistant`, `Project`, `Test`, `AssistantProject`): solo `admin` o `scientist`.
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

- No hay permisos a nivel de objeto en `UserViewSet` (por ejemplo, cualquier usuario autenticado podría editar el `role` de otro usuario vía `PATCH /api/users/<id>/`); sería el siguiente paso natural si el proyecto crece.
- El campo `status` de cada modelo (soft-delete) no filtra automáticamente los querysets: un registro `inactive` sigue siendo visible en la API salvo que se filtre explícitamente con `?status=active`.
