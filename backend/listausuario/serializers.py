from rest_framework import serializers

from serie.models import Serie

from .models import ListaUsuario


class ListaUsuarioSerializer(serializers.ModelSerializer):
    series = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Serie.objects.all(), required=False
    )

    class Meta:
        model = ListaUsuario
        fields = ("pk", "idUser", "tipoLista", "fechaAgregado", "series")
