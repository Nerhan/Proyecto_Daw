from django.db import DataError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None and isinstance(exc, DataError):
        return Response(
            {'detail': 'Uno de los valores enviados no es válido para este recurso.'},
            status=400,
        )
    return response
