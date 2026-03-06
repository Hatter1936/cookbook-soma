import jwt 
from django.conf import settings
from .models import User

def get_user_from_token(request):
    token = request.headers.get('Autorization', '').replace('Bearer', '')
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        user = User.objects.get(id=payload['user_id'])
        return user
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist):
        return None