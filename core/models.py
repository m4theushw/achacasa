from django.db import models
from django.template.defaultfilters import slugify

class City(models.Model):
    id = models.BigIntegerField(primary_key=True)
    name = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)

    class Meta:
        verbose_name_plural = 'cities'

    def __str__(self):
        return '%s - %s' % (self.name, self.state)

class Property(models.Model):
    id = models.BigIntegerField(primary_key=True)
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=200)
    bedrooms = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    type = models.CharField(max_length=20)
    document = models.CharField(max_length=100, null=True, blank=True)
    evaluation_value = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    minimum_value = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    sale_value = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    private_area = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    site_area = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    total_area = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    latitude = models.DecimalField(max_digits=12, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=8, null=True)
    is_occupied = models.BooleanField(null=True)
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    slug = models.SlugField(max_length=150, unique=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'properties'

    def save(self, *args, **kwargs):
        self.slug = slugify('{}-{}'.format(self.id, self.name))
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Attachment(models.Model):
    url = models.CharField(max_length=255)
    property = models.ForeignKey(Property, related_name='attachments', on_delete=models.CASCADE)

class Photo(models.Model):
    url = models.CharField(max_length=255)
    property = models.ForeignKey(Property, related_name='photos', on_delete=models.CASCADE)
