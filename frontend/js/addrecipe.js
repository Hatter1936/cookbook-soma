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
            <i class="fa-solid fa-minus"></i> Удалить шаг
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
        const recipeData = {
            title: document.getElementById('title').value.trim(),
            description: document.getElementById('description').value.trim() || '',
            cooking_time: parseInt(document.getElementById('time').value),
            category_id: parseInt(document.getElementById('category').value),
            ingredients: [],
            steps: []
        };
        
        const cost = document.getElementById('cost').value.trim();
        if (cost) {
            recipeData.price = parseFloat(cost);
        }
        
        document.querySelectorAll('.ingredient-row').forEach(row => {
            const name = row.querySelector('.ingredient-name')?.value.trim();
            const amount = parseFloat(row.querySelector('.ingredient-amount')?.value);
            const unit = row.querySelector('.ingredient-unit')?.value;
            
            if (name && !isNaN(amount) && unit) {
                recipeData.ingredients.push({
                    name: name,
                    quantity: amount,
                    unit: unit
                });
            }
        });
        
        document.querySelectorAll('.step-row').forEach((row, index) => {
            const description = row.querySelector('.step-description')?.value.trim();
            if (description) {
                recipeData.steps.push({
                    step_number: index + 1,
                    description: description
                });
            }
        });
        
        console.log('Отправляемые данные:', JSON.stringify(recipeData, null, 2));
        
        const response = await fetch('http://localhost:8000/api/recipes/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recipeData)
        });
        
        const contentType = response.headers.get('content-type');
        
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Сервер вернул не JSON:', text.substring(0, 200));
            throw new Error('Сервер вернул ошибку. Проверьте консоль Django.');
        }
        
        if (response.ok) {
            alert('Рецепт успешно добавлен!');
            window.location.href = 'index.html';
        } else {
            let errorMessage = 'Ошибка при добавлении рецепта';
            
            if (data.error) {
                errorMessage = data.error;
            } else if (data.detail) {
                errorMessage = data.detail;
            } else if (data.message) {
                errorMessage = data.message;
            }
            
            alert('Ошибка: ' + errorMessage);
            console.error('Детали ошибки:', data);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
}