from .models import Achievement, UserAchievement
from recipes.models import Recipe, Favorite, Recipe_ingredients, Recipe_steps
from django.utils import timezone
from datetime import timedelta
from django.db import models
from django.db.models.functions import Length

def check_achievements(user):
    earned_ids = UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True)
    
    available = Achievement.objects.exclude(id__in=earned_ids)
    
    for ach in available:
        condition = ach.condition
        earned = False
        
        if condition == 'recipe_count_1':
            earned = Recipe.objects.filter(user=user).count() >= 1
        elif condition == 'recipe_count_5':
            earned = Recipe.objects.filter(user=user).count() >= 5
        elif condition == 'recipe_count_10':
            earned = Recipe.objects.filter(user=user).count() >= 10
            
        elif condition == 'recipe_favorited':
            earned = Favorite.objects.filter(recipe__user=user).exists()
            
        elif condition == 'random_clicked':
            pass
            
        elif condition == 'recipe_deleted':
            pass
            
        elif condition == 'has_photo':
            recipes = Recipe.objects.filter(user=user)
            for recipe in recipes:
                if recipe.photos and len(recipe.photos) > 0:
                    earned = True
                    break
            
        elif condition == 'long_ingredient':
            earned = Recipe_ingredients.objects.filter(
                recipe__user=user
            ).annotate(
                name_length=Length('ingredient__name')
            ).filter(
                name_length__gt=20
            ).exists()
            
        elif condition == 'many_ingredients':
            earned = Recipe_ingredients.objects.filter(
                recipe__user=user
            ).values('recipe').annotate(
                count=models.Count('id')
            ).filter(count__gt=10).exists()
            
        elif condition == 'quick_cook':
            earned = Recipe.objects.filter(user=user, cooking_time__lt=10).exists()
            
        elif condition == 'slow_cook':
            earned = Recipe.objects.filter(user=user, cooking_time__gt=60).exists()
            
        elif condition == 'many_steps':
            earned = Recipe_steps.objects.filter(
                recipe__user=user
            ).values('recipe').annotate(
                count=models.Count('id')
            ).filter(count__gt=10).exists()
            
        elif condition == 'veteran':
            if user.created_at:
                earned = user.created_at <= timezone.now() - timedelta(days=30)
            else:
                earned = False
        
        if earned:
            UserAchievement.objects.create(user=user, achievement=ach)
            print(f"Достижение '{ach.title}' выдано пользователю {user.username}")