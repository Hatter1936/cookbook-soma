import jwt 
from django.conf import settings
from .models import User

def get_user_from_token(request):
    auth_header = request.headers.get('Authorization', '')
    
    print(f"Auth header: {auth_header}")

    if not auth_header:
        print("Нет заголовка Authorization")
        return None
    
    if not auth_header.startswith('Bearer '):
        print("Заголовок не начинается с Bearer")
        return None
    
    try:
        token = auth_header.split(' ')[1]
        print(f"Токен: {token[:20]}...")
    except IndexError:
        print("Не удалось извлечь токен")
        return None

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        print(f"Payload: {payload}")
        
        user_id = payload.get('user_id')
        if not user_id:
            print("user_id не найден в payload")
            return None
        
        try:
            user = User.objects.get(id=user_id)
            print(f"Найден пользователь: {user.username}")
            return user
        except User.DoesNotExist:
            print(f"Пользователь с id {user_id} не найден")
            return None
            
    except jwt.ExpiredSignatureError:
        print("Токен истек")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Неверный токен: {e}")
        return None
    except Exception as e:
        print(f"Неожиданная ошибка: {e}")
        return None