import json
import random
import os
import uuid
from django.views.decorators.csrf import csrf_exempt
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.db.models import Q
from django.conf import settings
from achievements.utils import check_achievements
from achievements.models import Achievement, UserAchievement
from users.utils import get_user_from_token
from .models import Ingredient, Recipe, Category, Recipe_ingredients, Recipe_steps, Unit, Favorite

def random_recipe(request):
    recipe_ids = list(Recipe.objects.values_list('id', flat=True))

    if not recipe_ids:
        return JsonResponse({'error': 'Нет рецептов'}, status=404, json_dumps_params={'ensure_ascii': False})

    random_id = random.choice(recipe_ids)

    user = get_user_from_token(request)
    if user:
        try:
            from achievements.models import Achievement, UserAchievement
            ach = Achievement.objects.filter(condition='random_clicked').first()
            if ach and not UserAchievement.objects.filter(user=user, achievement=ach).exists():
                UserAchievement.objects.create(user=user, achievement=ach)
        except Exception as e:
            print(f"Ошибка при выдаче достижения: {e}")
    recipe_view = RecipeView()
    return recipe_view.get(request, pk=random_id)

@method_decorator(csrf_exempt, name='dispatch')
class RecipeView(View):

    def get(self, request, pk=None):
        if pk:
            try:
                recipe = Recipe.objects.get(pk=pk)

                recipe_ingredients = Recipe_ingredients.objects.filter(recipe=recipe).select_related('ingredient', 'unit')
                ingredients = []
                for ri in recipe_ingredients:
                    ingredients.append({
                        'name': ri.ingredient.name,
                        'quantity': float(ri.quantity),
                        'unit': ri.unit.name
                    })
                
                steps = Recipe_steps.objects.filter(recipe=recipe).order_by('step_number')
                steps_data = []
                for step in steps:
                    steps_data.append({
                        'step_number': step.step_number,
                        'description': step.description,
                        'photo': step.photo.url if step.photo else None
                    })
                
                user = get_user_from_token(request)
                is_favorite = False
                if user:
                    is_favorite = Favorite.objects.filter(user=user, recipe=recipe).exists()

                data = {
                    'id': recipe.id,
                    'title': recipe.title,
                    'description': recipe.description,
                    'cooking_time': recipe.cooking_time,
                    'price': str(recipe.price) if recipe.price else None,
                    'category': recipe.category.name if recipe.category else None,
                    'category_id': recipe.category.id if recipe.category else None,
                    'photos': recipe.photos,
                    'ingredients': ingredients,
                    'steps': steps_data,
                    'is_favorite': is_favorite,
                    'user_id': recipe.user.id if recipe.user else None,
                    'user_name': recipe.user.username if recipe.user else None,
                    'created_at': recipe.created_at,
                }
                return JsonResponse(data, json_dumps_params={'ensure_ascii': False})
            except Recipe.DoesNotExist: 
                return JsonResponse({'error': 'Рецепт не найден'}, status=404, json_dumps_params={'ensure_ascii': False})
        
        user = get_user_from_token(request)
        
        if user:
            recipes = Recipe.objects.filter(Q(user=user) | Q(user__isnull=True))
        else:
            recipes = Recipe.objects.filter(user__isnull=True)

        category_id = request.GET.get('category')
        if category_id:
            recipes = recipes.filter(category_id=category_id)

        favorite_only = request.GET.get('favorites')
        if favorite_only and favorite_only.lower() == 'true' and user:
            recipes = recipes.filter(favorite__user=user)

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
            is_favorite = False
            if user:
                is_favorite = Favorite.objects.filter(user=user, recipe=recipe).exists()
            
            data.append({
                'id': recipe.id,
                'title': recipe.title,
                'description': recipe.description,
                'cooking_time': recipe.cooking_time,
                'price': str(recipe.price) if recipe.price else None,
                'category': recipe.category.name if recipe.category else None,
                'photos': recipe.photos,
                'is_favorite': is_favorite,
                'is_owner': user and recipe.user and recipe.user.id == user.id,
                'created_at': recipe.created_at,
            })

        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
            
    def post(self, request):
        print("="*50)
        print("Получен POST запрос на создание рецепта")
        
        user = get_user_from_token(request)
        print(f"User from token: {user}")
        
        if not user:
            return JsonResponse({'error': 'Не авторизован'}, status=401)
        
        try:
            if request.content_type and 'multipart/form-data' in request.content_type:
                title = request.POST.get('title')
                description = request.POST.get('description', '')
                cooking_time = request.POST.get('cooking_time')
                category_id = request.POST.get('category_id')
                price = request.POST.get('price')
                ingredients = json.loads(request.POST.get('ingredients', '[]'))
                steps = json.loads(request.POST.get('steps', '[]'))
                
                from django.core.files.storage import default_storage
                from django.core.files.base import ContentFile
                
                photos = []
                if 'main_photo' in request.FILES:
                    main_photo = request.FILES['main_photo']
                    ext = os.path.splitext(main_photo.name)[1]
                    filename = f'recipes/{uuid.uuid4()}{ext}'
                    saved_path = default_storage.save(filename, ContentFile(main_photo.read()))
                    photo_url = default_storage.url(saved_path)
                    if photo_url.startswith('/media/'):
                        photo_url = photo_url[7:]
                    photos.append(photo_url)
                
                step_photos = {}
                for key, file in request.FILES.items():
                    if key.startswith('step_photo_'):
                        step_num = key.replace('step_photo_', '')
                        ext = os.path.splitext(file.name)[1]
                        filename = f'steps/{uuid.uuid4()}{ext}'
                        saved_path = default_storage.save(filename, ContentFile(file.read()))
                        photo_url = default_storage.url(saved_path)
                        if photo_url.startswith('/media/'):
                            photo_url = photo_url[7:]
                        step_photos[f'step_photo_{step_num}'] = photo_url
                
                data = {
                    'title': title,
                    'description': description,
                    'cooking_time': int(cooking_time) if cooking_time else None,
                    'category_id': int(category_id) if category_id else None,
                    'price': float(price) if price else None,
                    'ingredients': ingredients,
                    'steps': steps,
                    'photos': photos,
                    'step_photos': step_photos
                }
            else:
                data = json.loads(request.body)
                data['step_photos'] = {}
            
            print(f"Получены данные: {data}")
        
            if not data.get('title'):
                return JsonResponse({'error': 'Название обязательно'}, status=400)
        
            if not data.get('cooking_time'):
                return JsonResponse({'error': 'Время приготовления обязательно'}, status=400)
        
            if not data.get('category_id'):
                return JsonResponse({'error': 'Категория обязательна'}, status=400)
        
            try:
                category = Category.objects.get(id=data['category_id'])
            except Category.DoesNotExist:
                return JsonResponse({'error': f'Категория с id {data["category_id"]} не найдена'}, status=400)
        
            recipe = Recipe.objects.create(
                title=data['title'],
                description=data.get('description', ''),
                cooking_time=int(data['cooking_time']),
                price=float(data['price']) if data.get('price') else None,
                user=user,
                category=category,
                photos=data.get('photos', [])
            )
        
            print(f"Создан рецепт: {recipe.id}")
            
            ingredients_data = data.get('ingredients', [])
            print(f"Ингредиенты: {ingredients_data}")
            
            for ing_data in ingredients_data:
                ingredient, _ = Ingredient.objects.get_or_create(name=ing_data['name'])
                unit, _ = Unit.objects.get_or_create(name=ing_data['unit'])
                Recipe_ingredients.objects.create(
                    recipe=recipe,
                    ingredient=ingredient,
                    quantity=float(ing_data['quantity']),
                    unit=unit
                )
            
            steps_data = data.get('steps', [])
            step_photos = data.get('step_photos', {})
            print(f"Шаги: {steps_data}")
            print(f"Фото шагов: {step_photos}")
            
            for i, step_data in enumerate(steps_data):
                step_number = step_data.get('step_number', i + 1)
                step_photo_url = step_photos.get(f'step_photo_{step_number}')
                
                Recipe_steps.objects.create(
                    recipe=recipe,
                    step_number=step_number,
                    description=step_data['description'],
                    photo=step_photo_url
                )
                
                if step_photo_url:
                    print(f"Фото для шага {step_number}: {step_photo_url}")
            
            try:
                from achievements.utils import check_achievements
                check_achievements(user)
            except Exception as e:
                print(f"Ошибка при проверке достижений: {e}")
            
            return JsonResponse({
                'id': recipe.id,
                'message': 'Рецепт создан'
            }, status=201, json_dumps_params={'ensure_ascii': False})
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Неверный формат JSON'}, status=400)
        except KeyError as e:
            return JsonResponse({'error': f'Отсутствует обязательное поле: {str(e)}'}, status=400)
        except Exception as e:
            print(f"Ошибка при создании рецепта: {str(e)}")
            import traceback
            traceback.print_exc() 
            return JsonResponse({'error': f'Внутренняя ошибка сервера: {str(e)}'}, status=500)
        
    def delete(self, request, pk=None):
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Не авторизован'}, status=401, json_dumps_params={'ensure_ascii': False})
        
        try:
            recipe = Recipe.objects.get(pk=pk)
        except Recipe.DoesNotExist:
            return JsonResponse({'error': 'Рецепт не найден'}, status=404, json_dumps_params={'ensure_ascii': False})
        
        if recipe.user and recipe.user.id != user.id:
            return JsonResponse({'error': 'Нет прав!'}, status=403, json_dumps_params={'ensure_ascii': False})

        for photo_path in recipe.photos:
            if photo_path:
                print(f"Обработка главного фото: {photo_path}")
                if photo_path.startswith('/media/'):
                    filename = os.path.basename(photo_path)
                    possible_paths = [
                        os.path.join(settings.MEDIA_ROOT, 'recipes', filename),
                        os.path.join(settings.MEDIA_ROOT, filename)
                    ]
                    for full_path in possible_paths:
                        if os.path.exists(full_path):
                            os.remove(full_path)
                            print(f"Удалён файл: {full_path}")
                            break
        
        steps = Recipe_steps.objects.filter(recipe=recipe)
        print(f"Найдено шагов: {steps.count()}")
        for step in steps:
            if step.photo:
                print(f"Фото шага {step.step_number}: {step.photo}")
                try:
                    if hasattr(step.photo, 'path'):
                        full_path = step.photo.path
                    else:
                        photo_str = str(step.photo)
                        if photo_str.startswith('/media/'):
                            filename = os.path.basename(photo_str)
                            full_path = os.path.join(settings.MEDIA_ROOT, 'steps', filename)
                        else:
                            full_path = os.path.join(settings.MEDIA_ROOT, photo_str)
                    
                    print(f"Пытаемся удалить: {full_path}")
                    if os.path.exists(full_path):
                        os.remove(full_path)
                        print(f"Удалён файл шага: {full_path}")
                    else:
                        print(f"Файл шага не найден: {full_path}")
                except Exception as e:
                    print(f"Ошибка при удалении фото шага: {e}")
        
        recipe.delete()
        
        ach = Achievement.objects.filter(condition='recipe_deleted').first()
        if ach and not UserAchievement.objects.filter(user=user, achievement=ach).exists():
            UserAchievement.objects.create(user=user, achievement=ach)
        
        return JsonResponse({'message': 'Рецепт удалён'}, status=200, json_dumps_params={'ensure_ascii': False})

    def put(self, request, pk=None):
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Пользователь не авторизован!'}, status=401, json_dumps_params={'ensure_ascii': False})
        
        try:
            recipe = Recipe.objects.get(pk=pk)
        except Recipe.DoesNotExist:
            return JsonResponse({'error': 'Рецепт не найден'}, status=404, json_dumps_params={'ensure_ascii': False})
        
        if recipe.user and recipe.user.id != user.id:
            return JsonResponse({'error': 'Нет прав!'}, status=403, json_dumps_params={'ensure_ascii': False})
        
        try:
            if request.content_type and 'multipart/form-data' in request.content_type:
                title = request.POST.get('title')
                description = request.POST.get('description', '')
                cooking_time = request.POST.get('cooking_time')
                category_id = request.POST.get('category_id')
                price = request.POST.get('price')
                ingredients = json.loads(request.POST.get('ingredients', '[]'))
                steps = json.loads(request.POST.get('steps', '[]'))
                
                print(f"ОТЛАДКА: category_id из формы = {category_id}")
                
                from django.core.files.storage import default_storage
                from django.core.files.base import ContentFile
                
                photos = recipe.photos
                
                if 'main_photo' in request.FILES:
                    main_photo = request.FILES['main_photo']
                    ext = os.path.splitext(main_photo.name)[1]
                    filename = f'recipes/{uuid.uuid4()}{ext}'
                    saved_path = default_storage.save(filename, ContentFile(main_photo.read()))
                    photo_url = default_storage.url(saved_path)
                    if photo_url.startswith('/media/'):
                        photo_url = photo_url[7:]
                    photos = [photo_url]
                
                step_photos = {}
                for key, file in request.FILES.items():
                    if key.startswith('step_photo_'):
                        step_num = key.replace('step_photo_', '')
                        ext = os.path.splitext(file.name)[1]
                        filename = f'steps/{uuid.uuid4()}{ext}'
                        saved_path = default_storage.save(filename, ContentFile(file.read()))
                        photo_url = default_storage.url(saved_path)
                        if photo_url.startswith('/media/'):
                            photo_url = photo_url[7:]
                        step_photos[f'step_photo_{step_num}'] = photo_url
                
                data = {
                    'title': title,
                    'description': description,
                    'cooking_time': int(cooking_time) if cooking_time else None,
                    'category_id': int(category_id) if category_id else None,
                    'price': float(price) if price else None,
                    'ingredients': ingredients,
                    'steps': steps,
                    'photos': photos,
                    'step_photos': step_photos,
                }
            else:
                data = json.loads(request.body)
                data['step_photos'] = {}
            
            print(f"ОТЛАДКА: data['category_id'] = {data.get('category_id')}")
            
            if 'title' in data:
                recipe.title = data['title']
            if 'description' in data:
                recipe.description = data['description']
            if 'cooking_time' in data:
                recipe.cooking_time = data['cooking_time']
            if 'price' in data:
                recipe.price = data['price']
            if 'category_id' in data:
                try:
                    category = Category.objects.get(id=data['category_id'])
                    recipe.category = category
                    print(f"ОТЛАДКА: Категория найдена: {category.name}")
                except Category.DoesNotExist:
                    print(f"ОТЛАДКА: Категория с id {data['category_id']} НЕ НАЙДЕНА!")
                    return JsonResponse({'error': f'Категория с id {data["category_id"]} не существует!'}, status=400, json_dumps_params={'ensure_ascii': False})
            if 'photos' in data:
                recipe.photos = data['photos']

            recipe.save()
            
            Recipe_ingredients.objects.filter(recipe=recipe).delete()
            
            ingredients_data = data.get('ingredients', [])
            for ing_data in ingredients_data:
                ingredient, _ = Ingredient.objects.get_or_create(name=ing_data['name'])
                unit, _ = Unit.objects.get_or_create(name=ing_data['unit'])
                Recipe_ingredients.objects.create(
                    recipe=recipe,
                    ingredient=ingredient,
                    quantity=float(ing_data['quantity']),
                    unit=unit
                )
            
            Recipe_steps.objects.filter(recipe=recipe).delete()
            
            steps_data = data.get('steps', [])
            step_photos = data.get('step_photos', {})
            
            for i, step_data in enumerate(steps_data):
                step_number = step_data.get('step_number', i + 1)
                step_photo_url = step_photos.get(f'step_photo_{step_number}')
                
                Recipe_steps.objects.create(
                    recipe=recipe,
                    step_number=step_number,
                    description=step_data['description'],
                    photo=step_photo_url
                )
            
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
            
        except Category.DoesNotExist:
            return JsonResponse({'error': 'Такой категории не существует!'}, status=400, json_dumps_params={'ensure_ascii': False})
        except Exception as e:
            print(f"Ошибка при обновлении рецепта: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)
    
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
            ach = Achievement.objects.filter(condition='recipe_favorited').first()
            if ach and not UserAchievement.objects.filter(user=user, achievement=ach).exists():
                UserAchievement.objects.create(user=user, achievement=ach)
            
            try:
                from achievements.utils import check_achievements
                check_achievements(user)
            except Exception as e:
                print(f"Ошибка при проверке достижений: {e}")
                
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

class CategoryView(View):
    def get(self, request): 
        user = get_user_from_token(request)
        
        if user:
            categories = Category.objects.filter(
                Q(is_global=True) | Q(user=user)
            ).distinct()
        else:
            categories = Category.objects.filter(is_global=True)
            
        data = [{'id': cat.id, 'name': cat.name, 'is_global': cat.is_global} for cat in categories]
        return JsonResponse(data, safe=False)
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Не авторизован'}, status=401, json_dumps_params={'ensure_ascii': False})
        
        try:
            data = json.loads(request.body)
            name = data.get('name')
            
            if not name:
                return JsonResponse({'error': 'Название категории обязательно'}, status=400)
            
            if Category.objects.filter(name=name, is_global=True).exists():
                return JsonResponse({'error': 'Общая категория с таким названием уже существует'}, status=400)
            
            if Category.objects.filter(name=name, user=user).exists():
                return JsonResponse({'error': 'У вас уже есть категория с таким названием'}, status=400)
            
            category = Category.objects.create(
                name=name,
                user=user,
                is_global=False
            )
            
            return JsonResponse({
                'id': category.id,
                'name': category.name,
                'is_global': category.is_global,
                'message': 'Категория создана'
            }, status=201, json_dumps_params={'ensure_ascii': False})
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Неверный формат JSON'}, status=400)
        except Exception as e:
            print(f"Ошибка при создании категории: {e}")
            return JsonResponse({'error': str(e)}, status=500)