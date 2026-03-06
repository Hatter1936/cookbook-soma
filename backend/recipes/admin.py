from django.contrib import admin
from .models import Category, Recipe, Recipe_steps, Unit, Recipe_ingredients, Ingredient, Favorite

admin.site.register(Category)
admin.site.register(Recipe)
admin.site.register(Recipe_steps)
admin.site.register(Unit)
admin.site.register(Recipe_ingredients)
admin.site.register(Ingredient)
admin.site.register(Favorite)