from django.db import models


class Serie(models.Model):
    titulo = models.CharField(blank=False, null=False, max_length=240)
    descripcion = models.TextField(blank=True, null=True)
    fechaEstreno = models.DateField(blank=False, null=False)
    fechaFin = models.DateField(blank=True, null=True)
    imagenPortada = models.URLField(blank=True, null=True)
    numeroEpisodios = models.IntegerField(blank=False, null=False, default=1)
    estado = models.CharField(blank=False, null=False, max_length=50)
    valoracionMedia = models.FloatField(blank=False, null=False, default=0)
    totalValoraciones = models.IntegerField(blank=False, null=False, default=0)

    def __str__(self):
        return self.titulo
