import settings
from django.shortcuts import render

def home(request):
    context = {
        'google_maps_api_key': settings.GOOGLE_MAPS_API_KEY
    }
    return render(request, 'home.html', context=context)
