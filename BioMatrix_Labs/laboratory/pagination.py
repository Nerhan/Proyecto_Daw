from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """Paginación por defecto de la API.

    Permite que el cliente pida un tamaño de página distinto con
    ?page_size=N (útil para poblar selects del frontend), con un tope de
    seguridad para no permitir descargas ilimitadas.
    """

    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 200
