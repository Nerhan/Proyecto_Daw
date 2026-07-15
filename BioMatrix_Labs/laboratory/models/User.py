import uuid
from django.db import models
from laboratory.validators import validate_unsa_email

class User(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.EmailField(unique=True, validators=[validate_unsa_email])
    password_hash = models.TextField()
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('scientist', 'Scientist'),
        ('assistant', 'Assistant'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='assistant')
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    created_id = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='users_created', db_column='created_id')
    modified_id = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='users_modified', db_column='modified_id')
    
    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.email} ({self.role})"

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        super(User, self).save(*args, **kwargs)