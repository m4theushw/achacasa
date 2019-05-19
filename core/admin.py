from django.contrib import admin
from core.models import Property, City, Attachment, Photo

class AttachmentInline(admin.TabularInline):
    model = Attachment

class PhotoInline(admin.TabularInline):
    model = Photo

class PropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'city')
    inlines = [AttachmentInline, PhotoInline]

admin.site.register(City)
admin.site.register(Property, PropertyAdmin)
