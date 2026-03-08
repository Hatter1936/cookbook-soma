from unicodedata import category
from django.views.decorators.csrf import csrf_exempt
from users.utils import get_user_from_token
from django.views import View
from django.http import JsonResponse
from .models import Recipe, Category, User, Favorite
import json
from django.utils.decorators import method_decorator
import random

def random_recipe(request):
    recipe_ids = list('id', flat=True)

    if not recipe_ids:
        return JsonResponse({'error': 'Нет рецептов'}, status=404, json_dumps_params={'ensure_ascii': False})

    random_id = random.choice(recipe_ids)

    recipe_view = RecipeView()
    return recipe_view.get(request, pk=random_id)

@method_decorator(csrf_exempt, name='dispatch')
class RecipeView(View):

    def get(self, request, pk=None):
        if pk:
            try:
                recipe = Recipe.objects.get(pk=pk)
                data = {
                    'id': recipe.id,
                    'title': recipe.title,
                    'description': recipe.description,
                    'cooking_time': recipe.cooking_time,
                    'price': str(recipe.price) if recipe.price else None,
                    'category': recipe.category.name if recipe.category else None,
                    'photos': recipe.photos,
                    'created_at': recipe.created_at,
                }
                return JsonResponse(data, json_dumps_params={'ensure_ascii': False})
            except Recipe.DoesNotExist: 
                return JsonResponse({'error': 'Рецепт не найден'}, status=404, json_dumps_params={'ensure_ascii': False})
        
        recipes = Recipe.objects.all()
        user = None

        category_id = request.GET.get('category')
        if category_id:
            recipes = recipes.filter(category_id=category_id)

        favorite_only = request.GET.get('favorites')
        if favorite_only and favorite_only.lower() == 'true':
            user = get_user_from_token(request)
            if user:
                recipes = recipes.filter(favorite__user=user)
            else:
                return JsonResponse([], safe=False)

        sort_time = request.GET.get('sort_time')
        if sort_time == 'asc':
            recipes = recipes.order_by('cooking_time')
        elif sort_time == 'desc':
            recipes = recipes.order_by('-cooking_time')

        sort_alpha = request.GET.get('sort_alpha')
        if sort_alpha == 'asc':
            recipes = recipes.order_by('title')
        elif sort_alpha == 'desc':
            recipes = recipes.order_by('-title')

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

        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
            
    def post(self, request):
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Не авторизован'}, status=401, json_dumps_params={'ensure_ascii': False})
        else: 
            data = json.loads(request.body)
            category = Category.objects.get(id=data['category_id'])

            recipe = Recipe.objects.create(
                title = data['title'],
                description = data.get('description', ''),
                cooking_time = data['cooking_time'],
                price = data.get('price'),
                user = user,
                category = category,
                photos = data.get('photos', [])
            )

            return JsonResponse({
                'id': recipe.id,
                'message': 'Рецепт создан'
            }, status=201, json_dumps_params={'ensure_ascii': False})
        
    def delete(self, request, pk=None):
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Не авторизован'}, status=401, json_dumps_params={'ensure_ascii': False})
        
        try:
            recipe = Recipe.objects.get(pk=pk)
        except Recipe.DoesNotExist:
            return JsonResponse({'error': 'Рецепт не найден'}, status=404, json_dumps_params={'ensure_ascii': False})
        
        if recipe.user.id != user.id:
            return JsonResponse({'error': 'Нет прав!'}, status=403, json_dumps_params={'ensure_ascii': False})
        
        recipe.delete()
        return JsonResponse({'message': 'Рецепт удалён'}, status=200, json_dumps_params={'ensure_ascii': False})

    def put(self, request, pk=None):
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Пользователь не авторизован!'}, status=401, json_dumps_params={'ensure_ascii': False})
        
        try:
            recipe = Recipe.objects.get(pk=pk)
        except Recipe.DoesNotExist:
            return JsonResponse({'error': 'Рецепт не найден'}, status=404, json_dumps_params={'ensure_ascii': False})
        
        if recipe.user.id != user.id:
            return JsonResponse({'error': 'Нет прав!'}, status=403, json_dumps_params={'ensure_ascii': False})
        
        data = json.loads(request.body)
        try: 
            if 'title' in data:
                recipe.title = data['title']
            if 'description' in data:
                recipe.description = data['description']
            if 'cooking_time' in data:
                recipe.cooking_time = data['cooking_time']
            if 'price' in data:
                recipe.price = data['price']
            if 'category_id' in data:
                recipe.category = Category.objects.get(id=data['category_id'])
            if 'photos' in data:
                recipe.photos = data['photos']

            recipe.save()
        except Category.DoesNotExist:
            return JsonResponse({'error': 'Такой категории не существует!'}, status=400, json_dumps_params={'ensure_ascii': False})

        return JsonResponse({
            'id': recipe.id,
            'title': recipe.title,
            'description': recipe.description,
            'cooking_time': recipe.cooking_time,
            'price': str(recipe.price) if recipe.price else None,
            'category': recipe.category.name if recipe.category else None,
            'photos': recipe.photos,
            'created_at': recipe.created_at,
        })
    
@csrf_exempt
def toggle_favorite(request, recipe_id):
    if request.method == 'POST':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Не авторизован!'}, status=401, json_dumps_params={'ensure_ascii': False})
        
        try:
            recipe = Recipe.objects.get(id=recipe_id)
        except Recipe.DoesNotExist:
            return JsonResponse({'error': 'Рецепт не найден!'}, status=404, json_dumps_params={'ensure_ascii': False})
        
        favorite, created = Favorite.objects.get_or_create(
            user=user,
            recipe=recipe
        )

        if created:
            return JsonResponse({'message': 'Добавлено в избранное!'}, status=201, json_dumps_params={'ensure_ascii': False})
        else:
            favorite.delete()
            return JsonResponse({'message': 'Удалено из избранного!'}, status=200, json_dumps_params={'ensure_ascii': False})
        
    elif request.method == 'DELETE':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Не авторизован!'}, status=401, json_dumps_params={'ensure_ascii': False})
        
        deleted = Favorite.objects.filter(
            user=user,
            recipe_id=recipe_id
        ).delete()

        if deleted[0] > 0:
            return JsonResponse({'message': 'Удалено из избранного'}, status=200, json_dumps_params={'ensure_ascii': False})
        else:
            return JsonResponse({'error': 'Не найдено в избранном!'}, status=404, json_dumps_params={'ensure_ascii': False})

def favorite_list(request):
    user = get_user_from_token(request)
    if not user:
        return JsonResponse({'error': 'Пользователь не авторизован!'}, status=401, json_dumps_params={'ensure_ascii': False})
    
    favorites = Favorite.objects.filter(user=user).select_related('recipe')

    data = []
    for fav in favorites:
        recipe = fav.recipe
        data.append({
            'id': fav.id,
            'recipe': {
                'id': recipe.id,
                'title': recipe.title,
                'description': recipe.description,
                'cooking_time': recipe.cooking_time,
                'price': str(recipe.price) if recipe.price else None,
                'category': recipe.category.name if recipe.category else None,
                'photos': recipe.photos,
            },
            'created_at': fav.created_at
        })

    return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})