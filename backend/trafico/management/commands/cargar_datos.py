import csv
import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import LineString
from trafico.models import Segmento, MedicionTrafico 
from datetime import datetime

class Command(BaseCommand):
    help = 'Carga datos de tráfico desde un CSV'

    def handle(self, *args, **kwargs):
        # Use pathlib to build a robust path relative to the project's base directory
        # Assumes your CSV is in backend/api/dataset/dataset1.csv
        csv_file_path = Path(__file__).resolve().parent.parent.parent.parent / 'api' / 'dataset' / 'dataset1.csv'
        
        # Verificacion visual de la ruta
        print(f"Buscando archivo en: {csv_file_path}")

        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f'ERROR FATAL: No se encontró el archivo en: {csv_file_path}'))
            return

        try:
            with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                count_mediciones = 0
                
                print("Iniciando lectura del CSV...")
                
                for row in reader:
                    # 1. Crear geometría
                    try:
                        p1 = (float(row['lng_inicio']), float(row['lat_inicio']))
                        p2 = (float(row['lng_fin']), float(row['lat_fin']))
                        linea = LineString(p1, p2, srid=4326)
                    except ValueError as e:
                        self.stdout.write(self.style.WARNING(f"Error coordenadas fila {row.get('segmento_id')}: {e}"))
                        continue

                    # 2. Crear Segmento
                    segmento, created = Segmento.objects.get_or_create(
                        segmento_id=int(row['segmento_id']),
                        defaults={
                            'nombre': row['segmento_nombre'],
                            'geometria': linea
                        }
                    )

                    if created:
                        self.stdout.write(self.style.SUCCESS(f'Nuevo Segmento: {segmento.nombre}'))

                    # 3. Crear Medición
                    try:
                        fecha_str = row['fecha_hora']
                        # Ajuste para formato con microsegundos si es necesario
                        fecha_obj = datetime.strptime(fecha_str, '%Y-%m-%d %H:%M:%S.%f')
                        
                        MedicionTrafico.objects.create(
                            segmento=segmento,
                            fecha_hora=fecha_obj,
                            velocidad_promedio=float(row['velocidad_promedio']),
                            nivel_congestion=int(row['nivel_congestion'])
                        )
                        count_mediciones += 1
                        
                        # Mostrar progreso cada 100 registros
                        if count_mediciones % 100 == 0:
                            print(f"... procesados {count_mediciones} registros")
                            
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f"Error guardando medicion: {e}"))

                self.stdout.write(self.style.SUCCESS(f'¡ÉXITO! Total mediciones cargadas: {count_mediciones}'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error abriendo el archivo CSV: {e}'))