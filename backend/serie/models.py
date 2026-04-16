from django.db import models

class Genero(models.Model):
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()

class Serie(models.Model):
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField()
    fechaEstreno = models.DateField()
    fechaFin = models.DateField(null=True)
    imagenPortada = models.CharField(max_length=255, null=True, blank=True)
    numeroEpisodios = models.IntegerField()
    valoracionMedia = models.FloatField()
    totalValoraciones = models.IntegerField()
    estado = models.CharField(max_length=255)

    generos = models.ManyToManyField(Genero)