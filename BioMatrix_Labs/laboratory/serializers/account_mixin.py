from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from laboratory.models import User
from laboratory.validators import validate_unsa_email


class AccountLinkedSerializerMixin:
    """Mixin para serializers de perfiles (Scientist/Assistant) que también
    dan de alta/gestionan la cuenta de acceso (User) vinculada 1 a 1.

    La subclase debe:
    - fijar `account_role` ('scientist' | 'assistant'),
    - declarar los campos `email` (EmailField, write_only), `password`
      (CharField, write_only) y `user_email` (SerializerMethodField,
      read_only) en su propia definición,
    - incluir esos tres nombres en Meta.fields (sin incluir 'user': se
      gestiona internamente, no es editable directo desde la API).
    """

    account_role = None

    def validate_email(self, value):
        value = value.strip().lower()
        try:
            validate_unsa_email(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate(self, attrs):
        # En creación, se está dando de alta la cuenta: email y password
        # son obligatorios. En edición son opcionales (solo se tocan si se
        # envían).
        if self.instance is None:
            if not attrs.get('email'):
                raise serializers.ValidationError({'email': 'Este campo es requerido para crear la cuenta de acceso.'})
            if not attrs.get('password'):
                raise serializers.ValidationError({'password': 'Este campo es requerido para crear la cuenta de acceso.'})
        return attrs

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def _upsert_user(self, existing_user, email, password):
        if existing_user:
            if email and email != existing_user.email:
                if User.objects.filter(email=email).exclude(pk=existing_user.pk).exists():
                    raise serializers.ValidationError({'email': 'Ya existe un usuario con este email.'})
                existing_user.email = email
            if password:
                existing_user.set_password(password)
            existing_user.save()
            return existing_user

        if not email:
            return None
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'Ya existe un usuario con este email.'})
        user = User(email=email, role=self.account_role, status='active')
        user.set_password(password)
        user.save()
        return user

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        with transaction.atomic():
            user = self._upsert_user(None, email, password)
            instance = self.Meta.model.objects.create(user=user, **validated_data)
        return instance

    def update(self, instance, validated_data):
        email = validated_data.pop('email', None)
        password = validated_data.pop('password', None)
        with transaction.atomic():
            if email or password:
                instance.user = self._upsert_user(instance.user, email, password)
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
        return instance
