from rest_framework.routers import DefaultRouter

# importar todas las views
from user.views import UserView, GroupView
from serie.views import SerieView, GeneroView
from interaccion.views import ComentarioView, ValoracionView
from social.views import AmistadView
from listas.views import ListaUsuarioView, ProgresoSerieView
from module.views import ModuleView

router = DefaultRouter()

# user
router.register(r'user', UserView, basename='user')
router.register(r'group', GroupView, basename='group')

# serie
router.register(r'serie', SerieView, basename='serie')
router.register(r'genero', GeneroView, basename='genero')

# interaccion
router.register(r'comentario', ComentarioView, basename='comentario')
router.register(r'valoracion', ValoracionView, basename='valoracion')

# social
router.register(r'amistad', AmistadView, basename='amistad')

# listas
router.register(r'listausuario', ListaUsuarioView, basename='listausuario')
router.register(r'progresoserie', ProgresoSerieView, basename='progresoserie')

# module
router.register(r'module', ModuleView, basename='module')