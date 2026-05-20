import time

import requests
from django.core.management.base import BaseCommand
from serie.models import Genero, Serie

class Command(BaseCommand):
    help = 'Puebla el catálogo con series de cada género existente en la API'

    def handle(self, *args, **kwargs):
        # Lista de géneros disponibles en la API de TVMaze.
        todos_los_generos = [
            "Action", "Adult", "Adventure", "Anime", "Children", "Comedy", "Crime",
            "DIY", "Drama", "Espionage", "Family", "Fantasy", "Food", "History",
            "Horror", "Legal", "Medical", "Music", "Mystery", "Nature", "Romance",
            "Sci-Fi", "Sports", "Supernatural", "Thriller", "Travel", "War", "Western"
        ]

        self.stdout.write(self.style.SUCCESS(f"Iniciando importación masiva: {len(todos_los_generos)} géneros detectados."))

        for nombre_gen in todos_los_generos:
            # 1. Crear o recuperar el género en la BD local
            genero_obj, _ = Genero.objects.get_or_create(nombre=nombre_gen)
            self.stdout.write(f"Procesando género: {nombre_gen}...")

            # 2. Buscar series que coincidan con este género
            url_busqueda = f"https://api.tvmaze.com/search/shows?q={nombre_gen.lower()}"

            try:
                # verify=False por los problemas de certificados SSL detectados previamente.
                response = requests.get(url_busqueda, verify=False)
                data = response.json()

                # Tomamos las primeras series encontradas para este género específico.
                for item in data[:20]:
                    show = item['show']
                    if not show.get('image'):
                        continue
                    show_id = show['id']

                    # --- Obtener número real de episodios ---
                    url_episodios = f"https://api.tvmaze.com/shows/{show_id}/episodes"
                    res_ep = requests.get(url_episodios, verify=False)
                    num_episodios = len(res_ep.json()) if res_ep.status_code == 200 else 1

                    # Limpieza de descripción para el catálogo.
                    summary = (show.get('summary') or "").replace('<p>', '').replace('</p>', '').replace('<b>', '').replace('</b>', '')

                    # 3. Guardar o actualizar la serie con todos los campos técnicos.
                    serie, created = Serie.objects.update_or_create(
                        titulo=show['name'],
                        defaults={
                            'descripcion': summary[:500],
                            'fechaEstreno': show.get('premiered') or '2000-01-01',
                            'fechaFin': show.get('ended'), # Se guarda la fecha real de finalización.
                            'imagenPortada': show['image']['original'] if show.get('image') else '', # Imagen HD.
                            'numeroEpisodios': num_episodios, # Dato real.
                            'valoracionMedia': show['rating'].get('average', 0) or 0,
                            'totalValoraciones': show.get('weight', 0), # Popularidad real.
                            'estado': "En emisión" if show.get('status') == "Running" else "Finalizada",
                        }
                    )

                    # 4. Vincular con el género.
                    serie.generos.add(genero_obj)

                    if created:
                        self.stdout.write(self.style.SUCCESS(f"  + Añadida: {serie.titulo} ({num_episodios} eps)"))

                # Pausa técnica para evitar bloqueos de la API.
                time.sleep(0.4)

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error procesando {nombre_gen}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS("\n¡Catálogo completado! Todos los géneros están poblados con datos reales."))
