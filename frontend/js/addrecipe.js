document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    loadCategories();
    
    initIngredientHandlers();
    initStepHandlers();
    
    document.getElementById('recipeForm').addEventListener('submit', handleSubmit);
});

async function loadCategories() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/recipes/categories/', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки категорий');
        }
        
        const categories = await response.json();
        console.log('Загруженные категории:', categories);
        
        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        showStaticCategories();
    }
}

function showStaticCategories() {
    console.log('Используем статические категории');
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = `
        <option value="">Выберите категорию</option>
        <option value="1">Закуска</option>
        <option value="2">Горячее</option>
        <option value="3">Холодное</option>
        <option value="4">Салат</option>
        <option value="5">Десерт</option>
    `;
}

function initIngredientHandlers() {
    const ingredientsContainer = document.getElementById('ingredients-container');
    const addIngredientBtn = document.getElementById('addingredient');
    
    if (ingredientsContainer.children.length === 0) {
        addIngredientRow();
    }
    
    addIngredientBtn.addEventListener('click', addIngredientRow);
}

function addIngredientRow() {
    const ingredientsContainer = document.getElementById('ingredients-container');
    const newRow = document.createElement('div');
    newRow.className = 'addrecipe-element-rowelements ingredient-row';
    newRow.innerHTML = `
        <input type="text" class="addrecipe-field ingredient-name" placeholder="Название" required>
        <input type="number" step="0.1" class="addrecipe-field ingredient-amount" placeholder="Количество" required>
        <select class="addrecipe-button ingredient-unit" required>
            <option value="шт">шт.</option>
            <option value="г">г</option>
            <option value="кг">кг</option>
            <option value="мл">мл</option>
            <option value="л">л</option>
            <option value="ст.л">ст.л.</option>
            <option value="ч.л">ч.л.</option>
        </select>
        <button type="button" class="add-icon remove-row" style="width:40px;height:40px;">
            <i class="fa-solid fa-minus"></i>
        </button>
    `;
    ingredientsContainer.appendChild(newRow);
    
    newRow.querySelector('.remove-row').addEventListener('click', function() {
        newRow.remove();
    });
}

function initStepHandlers() {
    const stepsContainer = document.getElementById('steps-container');
    const addStepBtn = document.getElementById('addstep');
    
    if (stepsContainer.children.length === 0) {
        addStepRow();
    }
    
    addStepBtn.addEventListener('click', addStepRow);
}

function addStepRow() {
    const stepsContainer = document.getElementById('steps-container');
    const stepNumber = stepsContainer.children.length + 1;
    const newStep = document.createElement('div');
    newStep.className = 'addrecipe-step step-row';
    newStep.innerHTML = `
        <label>Шаг ${stepNumber}</label>
        <div class="file-input-wrapper">
            <input type="file" class="step-image" accept="image/*">
            <div class="file-input-button">Выбрать файл...</div>
        </div>
        <textarea class="addrecipe-field step-description" placeholder="Описание шага" rows="4" required></textarea>
        <button type="button" class="add-icon remove-step" style="margin-top:15px;width:40px;height:40px;">
            <i class="fa-solid fa-minus"></i>
        </button>
    `;
    stepsContainer.appendChild(newStep);
    
    newStep.querySelector('.remove-step').addEventListener('click', function() {
        newStep.remove();
        updateStepNumbers(); 
    });
}

function updateStepNumbers() {
    const steps = document.querySelectorAll('.step-row');
    steps.forEach((step, index) => {
        const label = step.querySelector('label');
        if (label) {
            label.textContent = `Шаг ${index + 1}`;
        }
    });
}

function validateForm() {
    const title = document.getElementById('title').value.trim();
    const time = document.getElementById('time').value.trim();
    const category = document.getElementById('category').value;
    
    if (!title) {
        alert('Введите название рецепта');
        return false;
    }
    
    if (!time || isNaN(parseInt(time)) || parseInt(time) <= 0) {
        alert('Введите корректное время приготовления');
        return false;
    }
    
    if (!category) {
        alert('Выберите категорию');
        return false;
    }
    
    const ingredientRows = document.querySelectorAll('.ingredient-row');
    if (ingredientRows.length === 0) {
        alert('Добавьте хотя бы один ингредиент');
        return false;
    }
    
    for (let row of ingredientRows) {
        const name = row.querySelector('.ingredient-name')?.value.trim();
        const amount = row.querySelector('.ingredient-amount')?.value.trim();
        if (!name) {
            alert('Заполните название ингредиента');
            return false;
        }
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            alert('Заполните корректное количество ингредиента');
            return false;
        }
    }
    
    const stepRows = document.querySelectorAll('.step-row');
    if (stepRows.length === 0) {
        alert('Добавьте хотя бы один шаг приготовления');
        return false;
    }
    
    for (let row of stepRows) {
        const description = row.querySelector('.step-description')?.value.trim();
        if (!description) {
            alert('Заполните описание для всех шагов');
            return false;
        }
    }
    
    return true;
}

async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const formData = new FormData();
        
        formData.append('title', document.getElementById('title').value.trim());
        formData.append('description', document.getElementById('description').value.trim() || '');
        formData.append('cooking_time', parseInt(document.getElementById('time').value));
        formData.append('category_id', parseInt(document.getElementById('category').value));
        
        const cost = document.getElementById('cost').value.trim();
        if (cost) {
            formData.append('price', parseFloat(cost));
        }
        
        const mainPhoto = document.getElementById('photo').files[0];
        if (mainPhoto) {
            formData.append('main_photo', mainPhoto);
        }
        
        const ingredients = [];
        document.querySelectorAll('.ingredient-row').forEach(row => {
            const name = row.querySelector('.ingredient-name')?.value.trim();
            const amount = parseFloat(row.querySelector('.ingredient-amount')?.value);
            const unit = row.querySelector('.ingredient-unit')?.value;
            
            if (name && !isNaN(amount) && unit) {
                ingredients.push({
                    name: name,
                    quantity: amount,
                    unit: unit
                });
            }
        });
        formData.append('ingredients', JSON.stringify(ingredients));
        
        const steps = [];
        const stepRows = document.querySelectorAll('.step-row');
        
        for (let i = 0; i < stepRows.length; i++) {
            const row = stepRows[i];
            const description = row.querySelector('.step-description')?.value.trim();
            const stepImage = row.querySelector('.step-image')?.files[0];
            
            if (description) {
                steps.push({
                    step_number: i + 1,
                    description: description
                });
                
                if (stepImage) {
                    formData.append(`step_photo_${i + 1}`, stepImage);
                }
            }
        }
        formData.append('steps', JSON.stringify(steps));
        
        console.log('Отправка FormData...');
        
        const response = await fetch('http://localhost:8000/api/recipes/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Сервер вернул не JSON:', text.substring(0, 200));
            throw new Error('Сервер вернул ошибку');
        }
        
        if (response.ok) {
            alert('Рецепт успешно добавлен!');
            window.location.href = 'index.html';
        } else {
            alert('Ошибка: ' + (data.error || data.message || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
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