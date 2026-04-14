from django.db import models

from user.models import User


class ListaUsuario(models.Model):
    idUser = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listasUsuario")
    tipoLista = models.CharField(blank=False, null=False, max_length=100)
    fechaAgregado = models.DateField(blank=False, null=False)
    series = models.ManyToManyField("serie.Serie", blank=True, related_name="listasUsuario")

    def __str__(self):
        return self.tipoLista
