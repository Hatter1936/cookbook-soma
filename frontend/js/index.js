document.addEventListener('DOMContentLoaded', function() {
    loadRecipes();
    updateNavigation();

    const luckyBtn = document.querySelector('a[href=""]');
    if (luckyBtn) {
        luckyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            getRandomRecipe();
        });
        luckyBtn.textContent = 'Мне повезёт';
    }

    const addBtn = document.getElementById('addrecipe');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            window.location.href = 'addrecipe.html';
        });
    }

    const applyBtn = document.getElementById('applyFilters');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
    }

    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }

    loadCategoriesForFilter();
});

async function loadCategoriesForFilter() {
    try {
        const response = await fetch('http://localhost:8000/api/recipes/categories/');
        const categories = await response.json();
        
        const select = document.getElementById('filterCategory');
        if (select) {
            const currentValue = select.value;
            
            select.innerHTML = '<option value="">Все категории</option>';
            
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
    }
}

async function applyFilters() {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const params = new URLSearchParams();
    
    const category = document.getElementById('filterCategory')?.value;
    if (category) {
        params.append('category', category);
    }
    
    const sortTime = document.getElementById('sortTime')?.value;
    if (sortTime) {
        params.append('sort_time', sortTime);
    }
    
    const sortAlpha = document.getElementById('sortAlpha')?.value;
    if (sortAlpha) {
        params.append('sort_alpha', sortAlpha);
    }
    
    const favoritesOnly = document.getElementById('favoritesOnly')?.checked;
    if (favoritesOnly) {
        params.append('favorites', 'true');
    }
    
    const url = `http://localhost:8000/api/recipes/?${params.toString()}`;
    console.log('Запрос с фильтрами:', url);
    
    try {
        const response = await fetch(url, { headers });
        const recipes = await response.json();
        displayRecipes(recipes);
    } catch (error) {
        console.error('Ошибка при фильтрации:', error);
        showErrorMessage('Ошибка при применении фильтров');
    }
}

function resetFilters() {
    document.getElementById('filterCategory').value = '';
    document.getElementById('sortTime').value = '';
    document.getElementById('sortAlpha').value = '';
    document.getElementById('favoritesOnly').checked = false;
    
    loadRecipes();
}

async function loadRecipes() {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch('http://localhost:8000/api/recipes/', {
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки рецептов');
        }

        const recipes = await response.json();
        console.log('Загруженные рецепты:', recipes);

        displayRecipes(recipes);
    } catch (error) {
        console.error('Ошибка:', error);
        showErrorMessage('Не удалось загрузить рецепты');
    }
}

function displayRecipes(recipes) {
    const container = document.querySelector('.recipes');
    if (!container) return;

    if (!recipes || recipes.length === 0) {
        container.innerHTML = `
            <div class="no-recipes">
                <p>Рецептов пока нет</p>
                ${localStorage.getItem('token') ? 
                    '<a href="addrecipe.html" class="btn">Добавить первый рецепт</a>' : 
                    '<a href="login.html" class="btn">Войдите, чтобы добавить рецепт</a>'}
            </div>
        `;
        return;
    }

    container.innerHTML = recipes.map(recipe => {
        const photo = recipe.photos && recipe.photos.length > 0
            ? recipe.photos[0]
            : '../assets/images/default-recipe.jpg';

        const imageUrl = photo || '../assets/images/salat_moskovskiy_s_kopchenoy_kolbasoy.jpg';
        
        const favoriteIconClass = recipe.is_favorite ? 'fa-solid' : 'fa-regular';

        return `
            <a href="recipe.html?id=${recipe.id}" class="recipes-element">
                <img src="${imageUrl}" alt="${escapeHtml(recipe.title)}" class="recipes-image">
                <div class="recipes-content">
                    <div class="recipes-text">
                        <h3 class="recipes-text-title">${escapeHtml(recipe.title)}</h3>
                        <p class="recipes-text-description">${escapeHtml(recipe.description || '')}</p>
                        <div class="recipes-meta">
                            <span class="recipes-category">${escapeHtml(recipe.category || 'Без категории')}</span>
                            ${recipe.price ? `<span class="recipes-price">${parseFloat(recipe.price).toFixed(0)} ₽</span>` : ''}
                            <span class="recipes-time">${recipe.cooking_time} мин.</span>
                        </div>
                    </div>
                    ${localStorage.getItem('token') ? `
                        <button class="recipes-favorite" onclick="toggleFavorite(${recipe.id}, event)" aria-label="Добавить в избранное">
                            <i class="${favoriteIconClass} fa-star"></i>
                        </button>
                    ` : ''}
                </div>
            </a>
        `;
    }).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showErrorMessage(message) {
    const container = document.querySelector('.recipes');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button onclick="location.reload()" class="btn">Повторить</button>
            </div>
        `;
    }
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

async function toggleFavorite(recipeId, event) {
    event.preventDefault();
    event.stopPropagation();
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const button = event.currentTarget;
    if (!button) {
        console.error('Кнопка не найдена');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:8000/api/recipes/favorites/${recipeId}/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const icon = button.querySelector('i');
            
            if (response.status === 201) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
            } else if (response.status === 200) {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
            }
            
            const data = await response.json();
            console.log(data.message);
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка соединения с сервером');
    }
}

window.toggleFavorite = toggleFavorite;

document.addEventListener('DOMContentLoaded', function() {
    loadRecipes();
    updateNavigation();

    const filterButton = document.getElementById('filter-button');
    const filterDropdown = document.getElementById('filterDropdown');
    const filterContent = document.querySelector('.filter-dropdown-content');
    
    let isMenuOpen = false;
    
    function openMenu() {
        filterContent.classList.add('show');
        document.body.classList.add('menu-open');
        isMenuOpen = true;
    }
    
    function closeMenu() {
        filterContent.classList.remove('show');
        document.body.classList.remove('menu-open');
        isMenuOpen = false;
    }
    
    if (filterButton) {
        filterButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (isMenuOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        if (isMenuOpen && 
            filterDropdown && 
            !filterDropdown.contains(e.target) && 
            filterButton && 
            !filterButton.contains(e.target)) {
            closeMenu();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });
    
    if (filterDropdown) {
        filterDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    const luckyBtn = document.querySelector('a[href=""]');
    if (luckyBtn) {
        luckyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            getRandomRecipe();
        });
        luckyBtn.textContent = 'Мне повезёт';
    }

    const addBtn = document.getElementById('addrecipe');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            window.location.href = 'addrecipe.html';
        });
    }

    const applyBtn = document.getElementById('applyFilters');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            applyFilters();
            closeMenu();
        });
    }

    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetFilters();
            closeMenu();
        });
    }

    loadCategoriesForFilter();
});