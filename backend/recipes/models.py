from django.db import models
from users.models import User

class Category(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name

class Recipe(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cooking_time = models.IntegerField()
    price = models.DecimalField(max_digits=9, decimal_places=2, null=True, blank=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    category = models.ForeignKey('Category', on_delete=models.SET_DEFAULT, default=1, null=True)
    photos = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'recipe')

    def __str__(self):
        return f"{self.user.username} -> {self.recipe.title}"