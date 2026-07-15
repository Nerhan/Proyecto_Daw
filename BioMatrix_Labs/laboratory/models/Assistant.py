import uuid
from django.db import models
from .User import User
from laboratory.validators import validate_shift_format

class Assistant(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    names = models.CharField(max_length=100)
    father_surname = models.CharField(max_length=100)
    mother_surname = models.CharField(max_length=100)
    laboratory_zone = models.CharField(max_length=50, null=True, blank=True)
    shift_hours = models.CharField(max_length=50, null=True, blank=True, validators=[validate_shift_format], db_column='shift_hours')
    phone = models.CharField(max_length=20, null=True, blank=True)
    
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, db_column='user_id')
    
    status = models.CharField(max_length=20, default='active')
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    created_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assistants_created', db_column='created_id')
    modified_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assistants_modified', db_column='modified_id')

    class Meta:
        db_table = 'assistants'

    def __str__(self):
        return f"Asistente: {self.names} {self.father_surname} [{self.laboratory_zone}]"

    def save(self, *args, **kwargs):
        if self.laboratory_zone:
            self.laboratory_zone = self.laboratory_zone.upper()
        super(Assistant, self).save(*args, **kwargs)