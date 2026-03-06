from django.views.decorators.csrf import csrf_exempt
from django.views import View
from django.http import JsonResponse
from .models import Recipe, Category, User
import json
from django.utils.decorators import method_decorator
from users.utils import get_user_from_token

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
                return JsonResponse(data)
            except Recipe.DoesNotExist: 
                return JsonResponse({'error': 'Рецепт не найден'}, status=404)
        
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
            
    def post(self, request):
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Не авторизован'}, status=401)
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
            }, status=201)
        
    def delete(self, request, pk=None):
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Не авторизован'}, status=401)
        
        try:
            recipe = Recipe.objects.get(pk=pk)
        except Recipe.DoesNotExist:
            return JsonResponse({'error': 'Рецепт не найден'}, status=404)
        
        if recipe.user.id != user.id:
            return JsonResponse({'error': 'Нет прав!'}, status=403)
        
        recipe.delete()
        return JsonResponse({'message': 'Рецепт удалён'}, status=200)

    def put(self, request, pk=None):
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Пользователь не авторизован!'}, status=401)
        
        try:
            recipe = Recipe.objects.get(pk=pk)
        except Recipe.DoesNotExist:
            return JsonResponse({'error': 'Рецепт не найден'}, status=404)
        
        if recipe.user.id != user.id:
            return JsonResponse({'error': 'Нет прав!'}, status=403)
        
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
            return JsonResponse({'error': 'Такой категории не сущесвтует!'}, status=400)

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