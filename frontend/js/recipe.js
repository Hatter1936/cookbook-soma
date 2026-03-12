document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');
    
    if (recipeId) {
        loadRecipe(recipeId);
    } else {
        document.querySelector('.onerecipe').innerHTML = '<p>Рецепт не найден</p>';
    }
    
    updateNavigation();
});

async function loadRecipe(recipeId) {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch(`http://localhost:8000/api/recipes/${recipeId}/`, {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error('Рецепт не найден');
        }
        
        const recipe = await response.json();
        console.log('Загружен рецепт:', recipe);
        
        displayRecipe(recipe);
    } catch (error) {
        console.error('Ошибка:', error);
        document.querySelector('.onerecipe').innerHTML = '<p>Ошибка загрузки рецепта</p>';
    }
}

function displayRecipe(recipe) {
    document.title = recipe.title;
    
    const infoBlock = document.querySelector('.onerecipe-info-maininfo');
    infoBlock.querySelector('h3').textContent = recipe.title;
    infoBlock.querySelector('p:first-of-type').textContent = recipe.description || 'Нет описания';
    infoBlock.querySelector('p:last-of-type').innerHTML = `
        ${recipe.category || 'Без категории'} • 
        ${recipe.price ? recipe.price + ' ₽' : 'Цена не указана'} • 
        ${recipe.cooking_time} мин.
    `;
    
    const mainImage = document.querySelector('.onerecipe-info img');
    if (recipe.photos && recipe.photos.length > 0) {
        let photoUrl = recipe.photos[0];
        if (!photoUrl.startsWith('http')) {
            if (photoUrl.startsWith('/media/')) {
                photoUrl = `http://localhost:8000${photoUrl}`;
            } else {
                photoUrl = `http://localhost:8000/media/${photoUrl}`;
            }
        }
        console.log('Главное фото URL:', photoUrl);
        mainImage.src = photoUrl;
        mainImage.onerror = function() {
            console.log('Ошибка загрузки главного фото');
            this.src = '../assets/images/default-recipe.jpg';
        };
    } else {
        mainImage.src = '../assets/images/default-recipe.jpg';
    }
    
    const ingredientsList = document.querySelector('.onerecipe-ingredients-list');
    ingredientsList.innerHTML = '';
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ing => {
            const ingredientDiv = document.createElement('div');
            ingredientDiv.className = 'onerecipe-ingredients-list-ingredient';
            ingredientDiv.innerHTML = `
                <div class="onerecipe-ingredients-list-ingredient-text">
                    <p>${escapeHtml(ing.name)}</p>
                </div>
                <div class="onerecipe-ingredients-list-ingredient-text">
                    <p>-</p>
                    <p>${ing.quantity}</p>
                    <p>${ing.unit}</p>
                </div>
            `;
            ingredientsList.appendChild(ingredientDiv);
        });
    } else {
        ingredientsList.innerHTML = '<p>Ингредиенты не указаны</p>';
    }
    
    const stepsList = document.querySelector('.onerecipe-steps-list');
    stepsList.innerHTML = '';
    
    if (recipe.steps && recipe.steps.length > 0) {
        recipe.steps.forEach(step => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'onerecipe-steps-list-step';
            
            let stepPhotoHtml = '';
            if (step.photo) {
                let photoUrl = step.photo;
                if (!photoUrl.startsWith('http')) {
                    if (photoUrl.startsWith('/media/')) {
                        photoUrl = `http://localhost:8000${photoUrl}`;
                    } else {
                        photoUrl = `http://localhost:8000/media/${photoUrl}`;
                    }
                }
                console.log(`Фото шага ${step.step_number}:`, photoUrl);
                
                stepPhotoHtml = `
                    <div class="onerecipe-steps-list-step-img">
                        <img src="${photoUrl}" alt="Шаг ${step.step_number}" 
                            onerror="console.log('Ошибка загрузки фото шага ${step.step_number}'); this.onerror=null; this.style.display='none';">
                    </div>
                `;
            }
            
            stepDiv.innerHTML = `
                <div class="onerecipe-steps-list-step-text">
                    <h4>Шаг ${step.step_number}</h4>
                    <p>${escapeHtml(step.description)}</p>
                </div>
                ${stepPhotoHtml}
            `;
            stepsList.appendChild(stepDiv);
        });
    } else {
        stepsList.innerHTML = '<p>Шаги не указаны</p>';
    }
    
    const userId = localStorage.getItem('user_id');
    if (userId && recipe.user_id && recipe.user_id.toString() === userId) {
        const buttonsDiv = document.querySelector('.onerecipe-buttons');
        if (buttonsDiv) {
            buttonsDiv.innerHTML = `
                <button class="onerecipe-editbutton" onclick="editRecipe(${recipe.id})">Редактировать рецепт</button>
                <button class="onerecipe-deletebutton" onclick="confirmDelete(${recipe.id})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
        }
    } else {
        const buttonsDiv = document.querySelector('.onerecipe-buttons');
        if (buttonsDiv) {
            buttonsDiv.innerHTML = '';
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function editRecipe(recipeId) {
    window.location.href = `editrecipe.html?id=${recipeId}`;
}

async function confirmDelete(recipeId) {
    if (!confirm('Вы уверены, что хотите удалить этот рецепт?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:8000/api/recipes/${recipeId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Рецепт удален');
            window.location.href = 'index.html';
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка при удалении');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка соединения с сервером');
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

window.getRandomRecipe = getRandomRecipe;
window.editRecipe = editRecipe;
window.confirmDelete = confirmDelete;