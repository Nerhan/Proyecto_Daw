from django.contrib import admin
# Importamos directamente del módulo de inicialización de la carpeta models
from .models import User, Scientist, Assistant, Project, Sample, Test, AssistantProject, SampleTest

# ============================================================================
# INLINES (Como pide la guía para relaciones complejas)
# ============================================================================
class AssistantProjectInline(admin.TabularInline):
    model = AssistantProject
    extra = 1

class SampleTestInline(admin.TabularInline):
    model = SampleTest
    extra = 1

# ============================================================================
# REGISTROS Y PERSONALIZACIÓN DE ADMIN VISTAS
# ============================================================================
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'status', 'created', 'modified')
    list_filter = ('role', 'status')
    search_fields = ('email',)
    date_hierarchy = 'created'

@admin.register(Scientist)
class ScientistAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'specialty', 'license_number', 'status')
    list_filter = ('specialty', 'status')
    search_fields = ('names', 'father_surname', 'license_number')
    
    def full_name(self, obj):
        return f"{obj.names} {obj.father_surname} {obj.mother_surname}"
    full_name.short_description = 'Nombre Completo'

@admin.register(Assistant)
class AssistantAdmin(admin.ModelAdmin):
    list_display = ('names', 'father_surname', 'laboratory_zone', 'shift_hours', 'status')
    list_filter = ('laboratory_zone', 'shift_hours', 'status')
    search_fields = ('names', 'father_surname')
    inlines = [AssistantProjectInline]

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('project_name', 'scientists', 'budget', 'status')
    list_filter = ('status',)
    search_fields = ('project_name', 'funding_source')
    
    fieldsets = (
        ('Información General', {
            'fields': ('project_name', 'description', 'scientists')
        }),
        ('Financiamiento', {
            'fields': ('funding_source', 'budget')
        }),
        ('Auditoría', {
            'fields': ('status', 'created_id', 'modified_id')
        }),
    )
    inlines = [AssistantProjectInline]

@admin.register(Sample)
class SampleAdmin(admin.ModelAdmin):
    list_display = ('sample_type', 'projects', 'storage_temperature', 'collection_date', 'status')
    list_filter = ('sample_type', 'status', 'collection_date')
    search_fields = ('sample_type', 'description')
    inlines = [SampleTestInline]

@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('test_name', 'estimated_duration', 'status')
    list_filter = ('status',)
    search_fields = ('test_name',)

@admin.register(AssistantProject)
class AssistantProjectAdmin(admin.ModelAdmin):
    list_display = ('assistants', 'projects', 'assignment_date', 'status')

@admin.register(SampleTest)
class SampleTestAdmin(admin.ModelAdmin):
    list_display = ('samples', 'tests', 'assistants', 'scientists', 'status', 'test_date')
    list_filter = ('status', 'test_date')
    search_fields = ('result_data',)