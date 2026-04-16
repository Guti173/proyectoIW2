from django.db import models
from user.models import User
from serie.models import Serie

class ListaUsuario(models.Model):
    tipoLista = models.CharField(max_length=255)
    fechaAgregado = models.DateField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    series = models.ManyToManyField(Serie)

class ProgresoSerie(models.Model):
    episodiosVistos = models.IntegerField()
    fechaInicio = models.DateField()
    fechaFin = models.DateField(null=True)
    ultimaActualizacion = models.DateField()
    estado = models.CharField(max_length=255)

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    serie = models.ForeignKey(Serie, on_delete=models.CASCADE)