import uuid
from django.db import models
from .User import User
from .Sample import Sample
from .Test import Test
from .Assistant import Assistant
from .Scientist import Scientist

class SampleTest(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    samples = models.ForeignKey(Sample, on_delete=models.CASCADE, db_column='samples_id')
    tests = models.ForeignKey(Test, on_delete=models.CASCADE, db_column='tests_id')
    assistants = models.ForeignKey(Assistant, on_delete=models.SET_NULL, null=True, blank=True, db_column='assistants_id')
    scientists = models.ForeignKey(Scientist, on_delete=models.SET_NULL, null=True, blank=True, db_column='scientists_id')
    
    result_data = models.TextField(null=True, blank=True)
    test_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending')
    
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    created_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='st_created', db_column='created_id')
    modified_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='st_modified', db_column='modified_id')
    class Meta:
        db_table = 'samples_tests'

    def __str__(self):
        return f"Test {self.tests} para Muestra {self.samples}"

    # REDEFINICIÓN DEL SAVE (Para asegurar consistencia en la entrega)
    def save(self, *args, **kwargs):
        # Operación previa: Limpiar espacios del texto de resultados si existe
        if self.result_data:
            self.result_data = self.result_data.strip()
        super(SampleTest, self).save(*args, **kwargs)