from django.core.exceptions import ValidationError

def validate_unsa_email(value):
    if value and not value.endswith('@unsa.edu.pe'):
        raise ValidationError('El correo electrónico debe ser institucional (@unsa.edu.pe).')

def validate_shift_format(value):
    if value and len(value) < 4:
        raise ValidationError('El formato de turno debe ser descriptivo (Ej: "Mañana", "Tarde", "Noche").')

def validate_license_length(value):
    if value and len(value) < 5:
        raise ValidationError('El número de licencia científica debe tener al menos 5 caracteres.')

def validate_positive_budget(value):
    if value and value < 0:
        raise ValidationError('El presupuesto asignado al proyecto no puede ser un monto negativo.')

def validate_storage_temperature(value):
    if value is not None and value > 4.0:
        raise ValidationError('La temperatura de almacenamiento biológico no puede superar los 4.0°C.')

def validate_positive_duration(value):
    if value is not None and value <= 0:
        raise ValidationError('La duración estimada del protocolo debe ser mayor a 0 minutos.')