from django.urls import path
from . import views

urlpatterns = [
    #Работа с рецептами
    path('', views.RecipeView.as_view()),
    path('<int:pk>/', views.RecipeView.as_view()),
    #Рандомный рецепт от Сомы 😎
    path('random/', views.random_recipe, name='random_recipe'),
    #Работа с избранным
    path('favorites/', views.favorite_list, name='favorite_list'),
    path('favorites/<int:recipe_id>/', views.toggle_favorite, name='toggle_favorite'),
    #Категории
    path('categories/', views.CategoryView.as_view(), name='categories'),
]