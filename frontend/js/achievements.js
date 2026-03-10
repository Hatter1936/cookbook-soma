document.addEventListener('DOMContentLoaded', function() {
    loadAchievements();
});

async function loadAchievements() {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch('http://localhost:8000/api/user/achievements/', {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки достижений');
        }
        
        const data = await response.json();
        console.log('Загружены достижения:', data);
        
        displayAchievements(data);
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('achieved-list').innerHTML = '<p class="error">Ошибка загрузки достижений</p>';
        document.getElementById('unachieved-list').innerHTML = '<p class="error">Ошибка загрузки достижений</p>';
    }
}

function displayAchievements(data) {
    let achieved = [];
    let unachieved = [];
    
    if (Array.isArray(data)) {
        achieved = data.filter(ach => ach.achieved);
        unachieved = data.filter(ach => !ach.achieved);
    } else if (data.achieved && data.unachieved) {
        achieved = data.achieved;
        unachieved = data.unachieved;
    } else {
        console.error('Неизвестный формат данных:', data);
        return;
    }
    
    const achievedList = document.getElementById('achieved-list');
    achievedList.innerHTML = '';
    
    if (achieved.length === 0) {
        achievedList.innerHTML = '<p class="no-achievements">Пока нет полученных достижений</p>';
    } else {
        achieved.forEach(ach => {
            achievedList.appendChild(createAchievementElement(ach, true));
        });
    }
    
    const unachievedList = document.getElementById('unachieved-list');
    unachievedList.innerHTML = '';
    
    if (unachieved.length === 0) {
        unachievedList.innerHTML = '<p class="no-achievements">Все достижения получены!</p>';
    } else {
        unachieved.forEach(ach => {
            unachievedList.appendChild(createAchievementElement(ach, false));
        });
    }
}

function createAchievementElement(achievement, isAchieved) {
    const div = document.createElement('div');
    div.className = 'achievement-one';
    
    if (isAchieved) {
        div.innerHTML = `
            <h6 class="achievement-title">${escapeHtml(achievement.title)}</h6>
            <div class="achievement-hover-info">
                <p>${escapeHtml(achievement.title)}</p>
                <span>${escapeHtml(achievement.description)}</span>
                <span class="achievement-condition">Условие: ${escapeHtml(achievement.condition)}</span>
                ${achievement.achieved_date ? `<span class="achievement-date">Получено: ${formatDate(achievement.achieved_date)}</span>` : ''}
            </div>
        `;
    } else {
        div.innerHTML = `
            <h6 class="achievement-title">${escapeHtml(achievement.title)}</h6>
            <div class="achievement-hover-info not-achieved">
                <p>${escapeHtml(achievement.title)}</p>
                <span>${escapeHtml(achievement.description)}</span>
                <span class="achievement-condition">🔒 Условие: ${escapeHtml(achievement.condition)}</span>
            </div>
        `;
    }
    
    return div;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}