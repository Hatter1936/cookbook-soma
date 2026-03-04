from django.http import JsonResponse
from .models import Recipe

def recipe_list(request):
    recipes = Recipe.objects.all()

    data = []
    for recipe in recipes: 
        data.append({
            'id': recipe.id,
            'title': recipe.title,
            'description': recipe.description,
            'cooking_time': recipe.cooking_time,
            'price': str(recipe.price) if recipe.price else None,
            'category': recipe.category.name if recipe.category else None,
            'photos': recipe.photos,
            'created_at': recipe.created_at,
        })

    return JsonResponse(data, safe=False)