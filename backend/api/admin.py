from django.contrib import admin
from .models import Company, User, Board, Stage, Tag, Card

# Registrando nossas tabelas para aparecerem no Painel
admin.site.register(Company)
admin.site.register(User)
admin.site.register(Board)
admin.site.register(Stage)
admin.site.register(Tag)
admin.site.register(Card)