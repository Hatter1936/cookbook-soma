from django.urls import path
from . import views

urlpatterns = [
    #Работа с рецептами
    path('', views.RecipeView.as_view()),
    path('<int:pk>/', views.RecipeView.as_view()),
    #Работа с избранным
    path('favorites/', views.favorite_list, name='favorite_list'),
    path('favorites/<int:recipe_pk>/', views.toggle_favorite, name='toggle_favorite'),
]