from django.urls import path
from . import views

urlpatterns = [
    path('', views.RecipeView.as_view()),
    path('<int:pk>/', views.RecipeView.as_view()),
]