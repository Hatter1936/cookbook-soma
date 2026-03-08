from django.urls import path
from . import views

urlpatterns = [
    path('', views.achievement_list, name='avhievement_list'),
    path('user/', views.user_achievements, name='user_achievements'),
]
