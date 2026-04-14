from rest_framework import serializers

from .models import Serie


class SerieSerializer(serializers.ModelSerializer):

    class Meta:
        model = Serie
        fields = (
            "pk",
            "titulo",
            "descripcion",
            "fechaEstreno",
            "fechaFin",
            "imagenPortada",
            "numeroEpisodios",
            "estado",
            "valoracionMedia",
            "totalValoraciones",
        )
