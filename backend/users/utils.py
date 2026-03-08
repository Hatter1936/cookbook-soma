import jwt 
from django.conf import settings
from .models import User

def get_user_from_token(request):
    auth_header = request.headers.get('Authorization', '')

    if not auth_header or not auth_header.startswith('Bearer'):
        return None
    
    token = auth_header.replace('Bearer', '')

    if not token:
        return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        user = User.objects.get(id=payload['user_id'])
        if not user:
            return None
            
        user = User.objects.get(id=user)
        return user
    except jwt.ExpiredSignatureError:
        print("Токен истек")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Неверный токен: {e}")
        return None
    except User.DoesNotExist:
        print("Пользователь не найден")
        return None