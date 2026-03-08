from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from users.utils import get_user_from_token
from .models import Achievement, UserAchievement

@csrf_exempt
def achievement_list(request):
    achievements = Achievement.objects.all()
    data = []
    for ach in achievements:
        data.append({
            'id': ach.id,
            'title': ach.title,
            'description': ach.description,
            'condition': ach.condition,
        })
    return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})

@csrf_exempt
def user_achievements(request):
    user = get_user_from_token(request)
    if not user:
        return JsonResponse({'error': 'Не авторизован'}, status=401, json_dumps_params={'ensure_ascii': False})
    
    user_achievements = UserAchievement.objects.filter(user=user).select_related('achievement')
    data = []
    for ua in user_achievements:
        data.append({
            'id': ua.id,
            'achievement': {
                'id': ua.achievement.id,
                'title': ua.achievement.title,
                'description': ua.achievement.description,
            },
            'earned_at': ua.earned_at,
        })
    return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})