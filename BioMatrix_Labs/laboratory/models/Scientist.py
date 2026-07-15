import uuid
from django.db import models
from .User import User
from laboratory.validators import validate_license_length

class Scientist(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    names = models.CharField(max_length=100)
    father_surname = models.CharField(max_length=100)
    mother_surname = models.CharField(max_length=100)
    specialty = models.CharField(max_length=150)
    license_number = models.CharField(max_length=50, unique=True, validators=[validate_license_length], db_column='license_number')
    phone = models.CharField(max_length=20, null=True, blank=True)
    
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, db_column='user_id')
    
    status = models.CharField(max_length=20, default='active')
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    created_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scientists_created', db_column='created_id')
    modified_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scientists_modified', db_column='modified_id')

    class Meta:
        db_table = 'scientists'

    def __str__(self):
        return f"Dr(a). {self.names} {self.father_surname} - {self.specialty}"

    def save(self, *args, **kwargs):
        if self.father_surname:
            self.father_surname = self.father_surname.upper()
        if self.mother_surname:
            self.mother_surname = self.mother_surname.upper()
        super(Scientist, self).save(*args, **kwargs)