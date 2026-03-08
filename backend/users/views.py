import json
from django.http import JsonResponse
from .models import User
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken

@csrf_exempt
def register(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Неверный формат JSON!'}, status=400, json_dumps_params={'ensure_ascii': False})
    
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return JsonResponse({'error': 'Никнейм и пароль обязательны!'}, status=400, json_dumps_params={'ensure_ascii': False})
    
    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'Пользователь с таким ником уже существует!'}, status=400, json_dumps_params={'ensure_ascii': False})
    
    hashed_password = make_password(password)

    user = User.objects.create(
        username=username,
        password=hashed_password
    )

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)

    return JsonResponse({
        'success': 'Пользователь создан!',
        'user_id': user.id,
        'access': access_token,
        'refresh': str(refresh)
    }, status=201, json_dumps_params={'ensure_ascii': False})

@csrf_exempt
def login(request):
    try: 
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Неверный формат JSON!'}, status=400, json_dumps_params={'ensure_ascii': False})
    
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return JsonResponse({'error': 'Никнейм и пароль обязательны!'}, status=400, json_dumps_params={'ensure_ascii': False})
    
    try: 
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Пользователь не найден!'}, status=401, json_dumps_params={'ensure_ascii': False})
    
    if check_password(password, user.password):
        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user_id': user.id,
            'username': user.username
        }, status=200, json_dumps_params={'ensure_ascii': False})
    else:
        return JsonResponse({'error': 'Неверный пароль!'}, status=401, json_dumps_params={'ensure_ascii': False})