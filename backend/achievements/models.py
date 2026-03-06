from django.db import models
from users.models import User

class Achievement(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    condition = models.TextField()

    class Meta:
        verbose_name = "Achievement"
        verbose_name_plural = "Achievements"

    def __str__(self):
        return self.title
    
class UserAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    achievement = models.ForeignKey(Achievement, on_delete=models.PROTECT)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "UserAchievement"
        verbose_name_plural = "UserAchievements"
        unique_together = ("user", 'achievement')

    def __str__(self):
        return f"{self.user.username} - {self.achievement.title}"