from django.contrib.sitemaps import Sitemap
from core.models import Property

STATES = ['ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go',
          'ma', 'mg', 'ms', 'mt', 'pa', 'pb', 'pe', 'pi', 'pr',
          'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to']

class PropertySitemap(Sitemap):
    def __init__(self, state):
        self.state = state

    def items(self):
        return Property.objects.filter(
            city__state=self.state,
            latitude__isnull=False,
            longitude__isnull=False
        ).order_by('created')

    def location(self, obj):
        return '/' + obj.slug

sitemaps = {state: PropertySitemap(state) for state in STATES}
