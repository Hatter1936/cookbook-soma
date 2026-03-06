import json
from django.http import JsonResponse
from .models import User
from django.contrib.auth.hashers import make_password, check_password

def register(request):
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return JsonResponse({'error': 'Никнейм и пароль обязательны!'}, status=400)
    
    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'Пользователь с таким ником уже существует!'}, status=400)
    
    hashed_password = make_password(password)

    user = User.objects.create(
        username=username,
        password=hashed_password
    )

    return JsonResponse({
        'success': 'Пользователь создан!',
        'user_id': user.id
        }, status=201)

def login(request):
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')

    user = User.objects.filter(username=username).first()

    if not user:
        return JsonResponse({'error': 'Такого пользователя не существует!'}, status=400)
    
    if check_password(password, user.password):
        return JsonResponse({'message': 'Вход произошёл успешно!'}, status=200)
    else:
        return JsonResponse({'error': 'Пароль неверный!'}, status=400)