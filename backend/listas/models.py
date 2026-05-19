from django.db import models
from user.models import User
from serie.models import Serie

class ListaUsuario(models.Model):
    tipoLista = models.CharField(max_length=255)
    descripcion = models.CharField(max_length=255, blank=True, default='')
    fechaAgregado = models.DateField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    series = models.ManyToManyField(Serie)

    def __str__(self):
        return f'{self.tipoLista} ({self.user})'

class ListaSerie(models.Model):
    lista = models.ForeignKey(
        ListaUsuario,
        on_delete=models.CASCADE,
        related_name='seriesRegistros',
    )
    serie = models.ForeignKey(Serie, on_delete=models.CASCADE)
    fechaAgregado = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['lista', 'serie'],
                name='unique_lista_serie_registro',
            )
        ]
        indexes = [
            models.Index(fields=['lista', '-fechaAgregado']),
        ]

    def __str__(self):
        return f'{self.lista} -> {self.serie}'

class ProgresoSerie(models.Model):
    episodiosVistos = models.IntegerField()
    fechaInicio = models.DateField()
    fechaFin = models.DateField(null=True)
    ultimaActualizacion = models.DateField()
    estado = models.CharField(max_length=255)

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    serie = models.ForeignKey(Serie, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'serie'],
                name='unique_user_serie_progress',
            )
        ]
