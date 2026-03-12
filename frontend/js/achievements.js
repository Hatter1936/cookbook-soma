document.addEventListener('DOMContentLoaded', function() {
    loadAchievements();
    updateNavigation();
});

async function loadAchievements() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const allResponse = await fetch('http://localhost:8000/api/achievements/', {
            headers: headers
        });
        
        if (!allResponse.ok) {
            throw new Error('Ошибка загрузки достижений');
        }
        
        const allAchievements = await allResponse.json();
        console.log('Все достижения:', allAchievements);
        
        const userResponse = await fetch('http://localhost:8000/api/achievements/user/', {
            headers: headers
        });
        
        if (!userResponse.ok) {
            throw new Error('Ошибка загрузки достижений пользователя');
        }
        
        const userAchievements = await userResponse.json();
        console.log('Достижения пользователя:', userAchievements);
        
        const earnedIds = userAchievements.map(ua => ua.achievement.id);
        
        const achieved = allAchievements.filter(ach => earnedIds.includes(ach.id));
        const unachieved = allAchievements.filter(ach => !earnedIds.includes(ach.id));
        
        displayAchievements(achieved, unachieved);
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('achieved-list').innerHTML = '<p class="error">Ошибка загрузки достижений</p>';
        document.getElementById('unachieved-list').innerHTML = '<p class="error">Ошибка загрузки достижений</p>';
    }
}

function displayAchievements(achieved, unachieved) {
    const achievedList = document.getElementById('achieved-list');
    const unachievedList = document.getElementById('unachieved-list');
    
    if (!achievedList || !unachievedList) return;
    
    if (achieved.length === 0) {
        achievedList.innerHTML = '<p class="no-achievements">Пока нет полученных достижений</p>';
    } else {
        achievedList.innerHTML = '';
        achieved.forEach(ach => {
            achievedList.appendChild(createAchievementElement(ach, true));
        });
    }
    
    if (unachieved.length === 0) {
        unachievedList.innerHTML = '<p class="no-achievements">Все достижения получены!</p>';
    } else {
        unachievedList.innerHTML = '';
        unachieved.forEach(ach => {
            unachievedList.appendChild(createAchievementElement(ach, false));
        });
    }
}

function createAchievementElement(achievement, isAchieved) {
    const div = document.createElement('div');
    div.className = 'achievement-one';
    
    const icon = getIconForAchievement(achievement.condition);
    
    if (isAchieved) {
        div.innerHTML = `
            <i class="fas ${icon}" style="font-size: 24px; margin-bottom: 10px;"></i>
            <h6 class="achievement-title">${escapeHtml(achievement.title)}</h6>
            <div class="achievement-hover-info">
                <p>${escapeHtml(achievement.title)}</p>
                <span>${escapeHtml(achievement.description)}</span>
                <span class="achievement-condition">Условие: ${escapeHtml(achievement.condition)}</span>
                <span class="achievement-date">Получено</span>
            </div>
        `;
    } else {
        div.innerHTML = `
            <i class="fas ${icon}" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
            <h6 class="achievement-title" style="opacity: 0.7;">${escapeHtml(achievement.title)}</h6>
            <div class="achievement-hover-info not-achieved">
                <p>${escapeHtml(achievement.title)}</p>
                <span>${escapeHtml(achievement.description)}</span>
                <span class="achievement-condition">Условие: ${escapeHtml(achievement.condition)}</span>
                <span class="achievement-date">Не получено</span>
            </div>
        `;
    }
    
    return div;
}

function getIconForAchievement(condition) {
    const icons = {
        'recipe_count_1': 'fa-utensils',
        'recipe_count_5': 'fa-utensil-spoon',
        'recipe_count_10': 'fa-crown',
        'recipe_favorited': 'fa-star',
        'random_clicked': 'fa-dice',
        'recipe_deleted': 'fa-trash',
        'has_photo': 'fa-camera',
        'long_ingredient': 'fa-pencil-alt',
        'many_ingredients': 'fa-list',
        'quick_cook': 'fa-clock',
        'slow_cook': 'fa-hourglass',
        'many_steps': 'fa-stairs',
        'veteran': 'fa-calendar-alt'
    };
    return icons[condition] || 'fa-medal';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateNavigation() {
    const token = localStorage.getItem('token');
    const headerIcons = document.querySelector('.header-icons');
    
    if (headerIcons) {
        if (token) {
            headerIcons.innerHTML = `
                <span class="username">${localStorage.getItem('username') || 'Пользователь'}</span>
                <button onclick="logout()" class="btn" style="font-family: 'Chiron GoRound TC'; font-size: 18px;">Выйти</button>
            `;
        } else {
            headerIcons.innerHTML = `
                <a href="login.html" class="slowhover">Вход</a>
                <a href="register.html" class="btn">Регистрация</a>
            `;
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

async function getRandomRecipe() {
    try {
        const response = await fetch('http://localhost:8000/api/recipes/random/');
        
        if (!response.ok) {
            throw new Error('Не удалось получить случайный рецепт');
        }
        
        const recipe = await response.json();
        window.location.href = `recipe.html?id=${recipe.id}`;
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось получить случайный рецепт');
    }
}

window.getRandomRecipe = getRandomRecipe;