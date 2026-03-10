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
        mainImage.src = recipe.photos[0];
    } else {
        mainImage.src = '../assets/images/default-recipe.jpg';
    }
    
    const ingredientsList = document.querySelector('.onerecipe-ingredients-list');
    ingredientsList.innerHTML = '';
    
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
    
    const stepsList = document.querySelector('.onerecipe-steps-list');
    stepsList.innerHTML = '';
    
    recipe.steps.forEach(step => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'onerecipe-steps-list-step';
        stepDiv.innerHTML = `
            <div class="onerecipe-steps-list-step-text">
                <h4>Шаг ${step.step_number}</h4>
                <p>${escapeHtml(step.description)}</p>
            </div>
            ${step.photo ? `
                <div class="onerecipe-steps-list-step-img">
                    <img src="${step.photo}" alt="Шаг ${step.step_number}">
                </div>
            ` : ''}
        `;
        stepsList.appendChild(stepDiv);
    });
    
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

window.editRecipe = editRecipe;
window.confirmDelete = confirmDelete;