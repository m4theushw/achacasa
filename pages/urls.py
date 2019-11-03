from django.urls import re_path
from .views import home

app_name = 'pages'

urlpatterns = [
    re_path(r'^(?:.*)$', home, name='home')
]
