"""Carga datos de demostración realistas para grabar videos, exponer y tomar capturas.

Uso:
    python manage.py seed_demo           # carga los datos
    python manage.py seed_demo --undo    # elimina exactamente lo que cargó
    python manage.py seed_demo --force   # vuelve a cargar aunque ya exista una carga previa

Los identificadores de todo lo creado se guardan en `.seed_demo_ids.json` (junto a
manage.py), de modo que `--undo` borra solo estos registros y nunca toca los datos
reales del laboratorio.
"""

import json
import os
import random
import secrets
import string
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from laboratory.models import (
    User, Scientist, Assistant, Project, Sample, Test, SampleTest, AssistantProject
)

IDS_FILE = settings.BASE_DIR / '.seed_demo_ids.json'


def build_password(explicit=None):
    """Contraseña de las cuentas de demostración.

    Nunca se escribe una contraseña en el código: se toma de --password, de la
    variable de entorno SEED_DEMO_PASSWORD o, en su defecto, se genera una
    aleatoria que el comando muestra al terminar.
    """
    if explicit:
        return explicit
    from_env = os.environ.get('SEED_DEMO_PASSWORD')
    if from_env:
        return from_env
    alphabet = string.ascii_letters + string.digits
    return 'Lab' + ''.join(secrets.choice(alphabet) for _ in range(9))

SCIENTISTS = [
    ('Elena', 'Quispe', 'Mamani', 'Microbiología Clínica', 'LIC-10234', '958441207', 'elena.quispe'),
    ('Rodrigo', 'Salas', 'Ticona', 'Bioquímica Molecular', 'LIC-20871', '947220518', 'rodrigo.salas'),
    ('Carmen', 'Huanca', 'Apaza', 'Genética Humana', 'LIC-30598', '931665742', 'carmen.huanca'),
]

ASSISTANTS = [
    ('Diego', 'Mamani', 'Ccama', 'Zona A', 'Mañana (08:00-14:00)', '955102384', 'diego.mamani'),
    ('Lucía', 'Ramos', 'Choque', 'Zona B', 'Tarde (14:00-20:00)', '918773460', 'lucia.ramos'),
    ('Bruno', 'Vilca', 'Condori', 'Zona A', 'Noche (20:00-02:00)', '972340916', 'bruno.vilca'),
    ('Ana', 'Torres', 'Pinto', 'Zona C', 'Mañana (08:00-14:00)', '966518273', 'ana.torres'),
]

PROJECTS = [
    ('Resistencia antimicrobiana en cepas hospitalarias', 'CONCYTEC', 85000,
     'Vigilancia de perfiles de resistencia en aislamientos clínicos de hospitales de Arequipa.', 0, 7),
    ('Perfil genético de poblaciones altoandinas', 'UNSA Investiga', 120000,
     'Caracterización de variantes genéticas asociadas a la adaptación a la altura.', 2, 5),
    ('Biomarcadores en enfermedad renal crónica', 'FONDECYT', 96500,
     'Identificación de biomarcadores tempranos en pacientes con daño renal progresivo.', 1, 4),
    ('Calidad microbiológica de agua en Arequipa', 'Municipalidad Provincial', 42000,
     'Monitoreo de contaminación microbiológica en fuentes de agua de consumo humano.', 0, 3),
    ('Detección temprana de tuberculosis resistente', 'MINSA', 150000,
     'Implementación de métodos moleculares rápidos para detectar cepas multirresistentes.', 1, 3),
]

TESTS = [
    ('Cultivo bacteriano en agar sangre', 2880,
     'Siembra en placa de agar sangre e incubación a 37 °C durante 48 horas. Lectura de morfología colonial y hemólisis.'),
    ('Antibiograma por difusión en disco', 1080,
     'Método de Kirby-Bauer sobre agar Mueller-Hinton. Medición de halos de inhibición según normativa CLSI.'),
    ('Extracción de ADN genómico', 180,
     'Lisis celular, precipitación con etanol y resuspensión en buffer TE. Control de pureza por absorbancia 260/280.'),
    ('PCR en tiempo real', 240,
     'Amplificación con sondas fluorescentes. Incluye control positivo, control negativo y curva de calibración.'),
    ('Electroforesis en gel de agarosa', 90,
     'Corrida en gel al 1.5 % a 100 V durante 45 minutos. Visualización bajo transiluminador UV.'),
    ('Espectrofotometría de proteínas', 60,
     'Cuantificación por método de Bradford con curva estándar de albúmina sérica bovina.'),
]

SAMPLE_TYPES = [
    ('sangre venosa', 4.0), ('suero', 3.8), ('plasma', 3.9), ('hisopado nasofaríngeo', 3.5),
    ('orina', 4.0), ('biopsia tisular', -20.0), ('esputo', 3.6), ('líquido cefalorraquídeo', -20.0),
    ('agua potable', 3.9), ('aspirado bronquial', 2.5), ('hisopado faríngeo', 3.8),
    ('sangre total EDTA', 4.0), ('tejido congelado', -80.0), ('saliva', 3.4),
]

RESULT_OK = [
    'Crecimiento bacteriano positivo. Colonias beta-hemolíticas compatibles con Streptococcus pyogenes.',
    'Halo de inhibición de 22 mm frente a ciprofloxacino. Cepa sensible según puntos de corte CLSI.',
    'Concentración de ADN: 84.6 ng/µL. Relación 260/280 = 1.87, pureza adecuada para amplificación.',
    'Amplificación positiva con Ct = 27.4. Control negativo sin señal. Resultado validado.',
    'Bandas nítidas en el rango esperado de 480 pb. Marcador de peso molecular conforme.',
    'Concentración proteica total: 6.2 g/dL. Valor dentro del rango de referencia.',
    'Ausencia de crecimiento tras 48 horas de incubación. Resultado negativo.',
    'Halo de inhibición de 9 mm frente a ampicilina. Cepa resistente.',
]

RESULT_BAD = [
    'Muestra hemolizada. Se descarta el procesamiento y se solicita nueva toma al paciente.',
    'Contaminación cruzada detectada en el control negativo. Se repite la corrida completa.',
    'Volumen de muestra insuficiente para completar el protocolo. Registro anulado.',
    'Cadena de frío interrumpida durante el traslado. Muestra no apta para análisis.',
    'Curva de amplificación anómala, sin meseta definida. Resultado no interpretable.',
]


class Command(BaseCommand):
    help = 'Carga datos de demostración para videos, exposición y capturas del informe.'

    def add_arguments(self, parser):
        parser.add_argument('--undo', action='store_true',
                            help='Elimina exactamente los registros creados por una carga previa.')
        parser.add_argument('--force', action='store_true',
                            help='Carga de nuevo aunque ya exista una carga previa registrada.')
        parser.add_argument('--password',
                            help='Contraseña de las cuentas de demostración. Si se omite se usa '
                                 'SEED_DEMO_PASSWORD o se genera una aleatoria.')

    # ── utilidades ──────────────────────────────────────────────
    def _load_ids(self):
        if IDS_FILE.exists():
            return json.loads(IDS_FILE.read_text(encoding='utf-8'))
        return None

    def _save_ids(self, ids):
        IDS_FILE.write_text(json.dumps(ids, indent=2), encoding='utf-8')

    def _make_user(self, local_part, role, creator):
        email = f'{local_part}@unsa.edu.pe'
        user = User(email=email, role=role, status='active',
                    created_id=creator, modified_id=creator)
        user.set_password(self.password)
        user.save()
        return user

    # ── comando ─────────────────────────────────────────────────
    def handle(self, *args, **options):
        if options['undo']:
            return self._undo()

        existing = self._load_ids()
        if existing and not options['force']:
            raise CommandError(
                'Ya existe una carga de demostración previa (.seed_demo_ids.json).\n'
                'Ejecuta "python manage.py seed_demo --undo" para eliminarla, '
                'o añade --force para cargar otra encima.'
            )

        self.password = build_password(options.get('password'))
        random.seed(20260723)
        now = timezone.now()
        ids = {'users': [], 'scientists': [], 'assistants': [], 'projects': [],
               'tests': [], 'samples': [], 'sample_tests': [], 'assistant_projects': []}

        with transaction.atomic():
            admin = User.objects.filter(role='admin', status='active').order_by('created').first()
            if admin is None:
                raise CommandError(
                    'No hay ningún administrador activo. Crea uno primero con:\n'
                    '  python manage.py create_admin'
                )
            self.stdout.write(f'Auditoría a nombre de: {admin.email}')

            # Científicos
            scientists = []
            for names, fs, ms, spec, lic, phone, mail in SCIENTISTS:
                u = self._make_user(mail, 'scientist', admin)
                ids['users'].append(str(u.id))
                s = Scientist.objects.create(
                    names=names, father_surname=fs, mother_surname=ms, specialty=spec,
                    license_number=lic, phone=phone, user=u, status='active',
                    created_id=admin, modified_id=admin)
                ids['scientists'].append(str(s.id))
                scientists.append(s)

            # Asistentes
            assistants = []
            for i, (names, fs, ms, zone, shift, phone, mail) in enumerate(ASSISTANTS):
                u = self._make_user(mail, 'assistant', admin)
                ids['users'].append(str(u.id))
                creator = scientists[i % len(scientists)].user or admin
                a = Assistant.objects.create(
                    names=names, father_surname=fs, mother_surname=ms, laboratory_zone=zone,
                    shift_hours=shift, phone=phone, user=u, status='active',
                    created_id=creator, modified_id=creator)
                ids['assistants'].append(str(a.id))
                assistants.append(a)

            # Protocolos
            tests = []
            for name, dur, desc in TESTS:
                t = Test.objects.create(
                    test_name=name, protocol_description=desc, estimated_duration=dur,
                    status='active', created_id=admin, modified_id=admin)
                ids['tests'].append(str(t.id))
                tests.append(t)

            # Proyectos
            projects = []
            for pname, fund, budget, desc, sci_idx, _n in PROJECTS:
                sci = scientists[sci_idx]
                creator = sci.user or admin
                p = Project.objects.create(
                    project_name=pname, funding_source=fund, budget=budget, description=desc,
                    scientists=sci, status='active', created_id=creator, modified_id=creator)
                ids['projects'].append(str(p.id))
                projects.append(p)

            # Asignación de asistentes a proyectos
            pairs = [(0, 0), (1, 0), (0, 1), (2, 1), (1, 2), (3, 2), (2, 3), (3, 4), (0, 4)]
            for a_i, p_i in pairs:
                creator = projects[p_i].scientists.user or admin
                ap = AssistantProject.objects.create(
                    assistants=assistants[a_i], projects=projects[p_i], status='active',
                    created_id=creator, modified_id=creator)
                ids['assistant_projects'].append(str(ap.id))

            # Muestras (repartidas de forma desigual para que las barras tengan contraste)
            samples = []
            type_cycle = list(SAMPLE_TYPES)
            k = 0
            for p_i, (_n1, _n2, _n3, _n4, _n5, n_samples) in enumerate(PROJECTS):
                for _ in range(n_samples):
                    stype, temp = type_cycle[k % len(type_cycle)]
                    k += 1
                    creator = random.choice(assistants).user or admin
                    s = Sample.objects.create(
                        sample_type=stype, storage_temperature=temp,
                        description=f'Muestra recepcionada en {projects[p_i].project_name.title()}.',
                        projects=projects[p_i], status='active',
                        created_id=creator, modified_id=creator)
                    ids['samples'].append(str(s.id))
                    samples.append(s)

            # Resultados de pruebas con los tres estados
            plan = ['completed'] * 15 + ['pending'] * 12 + ['rejected'] * 5
            random.shuffle(plan)
            sample_tests = []
            for i, status in enumerate(plan):
                sample = samples[i % len(samples)]
                test = tests[i % len(tests)]
                assistant = assistants[i % len(assistants)]
                scientist = sample.projects.scientists
                if status == 'completed':
                    data = random.choice(RESULT_OK)
                elif status == 'rejected':
                    data = random.choice(RESULT_BAD)
                else:
                    data = None
                creator = assistant.user or admin
                st = SampleTest.objects.create(
                    samples=sample, tests=test, assistants=assistant, scientists=scientist,
                    result_data=data, status=status,
                    created_id=creator, modified_id=creator)
                ids['sample_tests'].append(str(st.id))
                sample_tests.append(st)

            # Retrodatar fechas: la gráfica de tendencia agrupa por collection_date y
            # test_date, que son auto_now_add. .update() los reescribe sin disparar auto.
            weights = [1, 2, 3, 4, 5, 6]          # actividad creciente en 6 meses
            self._spread(Sample, samples, 'collection_date', weights, now)
            self._spread(SampleTest, sample_tests, 'test_date', weights, now)

        self._save_ids(ids)
        self._report(ids)

    def _spread(self, model, objs, date_field, weights, now):
        """Reparte los objetos en los últimos 6 meses según los pesos dados."""
        buckets = []
        total_w = sum(weights)
        for month_back, w in enumerate(reversed(weights)):
            share = max(1, round(len(objs) * w / total_w))
            buckets.extend([5 - month_back] * share)
        for obj, months_ago in zip(objs, buckets[:len(objs)]):
            when = now - timedelta(days=30 * months_ago + random.randint(0, 27),
                                   hours=random.randint(0, 23))
            model.objects.filter(pk=obj.pk).update(**{date_field: when, 'created': when})

    def _undo(self):
        ids = self._load_ids()
        if not ids:
            raise CommandError('No hay ninguna carga de demostración registrada (.seed_demo_ids.json).')

        order = [
            ('sample_tests', SampleTest), ('assistant_projects', AssistantProject),
            ('samples', Sample), ('projects', Project), ('tests', Test),
            ('assistants', Assistant), ('scientists', Scientist), ('users', User),
        ]
        with transaction.atomic():
            for key, model in order:
                n, _ = model.objects.filter(id__in=ids.get(key, [])).delete()
                self.stdout.write(f'  {key:20s} eliminados: {n}')
        IDS_FILE.unlink(missing_ok=True)
        self.stdout.write(self.style.SUCCESS('\nDatos de demostración eliminados.'))

    def _report(self, ids):
        self.stdout.write(self.style.SUCCESS('\nDatos de demostración cargados:'))
        for k, v in ids.items():
            self.stdout.write(f'  {k:20s} {len(v)}')
        self.stdout.write('\nCuentas creadas (todas con la misma contraseña):')
        self.stdout.write(self.style.WARNING(f'  Contraseña: {self.password}'))
        self.stdout.write('  (anótala: no queda guardada en ningún archivo)')
        for _n, _f, _m, _s, _l, _p, mail in SCIENTISTS:
            self.stdout.write(f'  científico  {mail}@unsa.edu.pe')
        for _n, _f, _m, _z, _sh, _p, mail in ASSISTANTS:
            self.stdout.write(f'  asistente   {mail}@unsa.edu.pe')
        self.stdout.write('\nPara revertir todo:  python manage.py seed_demo --undo')
