document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        alert('ID рецепта не указан');
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('recipeId').value = recipeId;

    const ingredientsContainer = document.getElementById('editingredients-container');
    const stepsContainer = document.getElementById('editsteps-container');
    const addIngredientBtn = document.getElementById('editaddingredient');
    const addStepBtn = document.getElementById('editaddstep');
    const editForm = document.getElementById('editRecipeForm');

    // Загружаем данные рецепта
    loadRecipeData();

    function createIngredientRow(ingredientData = { name: '', amount: '', unit: 'шт' }) {
        const row = document.createElement('div');
        row.className = 'addrecipe-element-rowelements ingredient-row';
        row.innerHTML = `
            <input type="text" class="addrecipe-field ingredient-name" placeholder="Название" value="${ingredientData.name || ''}" required>
            <input type="number" step="0.1" class="addrecipe-field ingredient-amount" placeholder="Количество" value="${ingredientData.amount || ''}" required>
            <select class="addrecipe-button ingredient-unit" required>
                <option value="шт" ${ingredientData.unit === 'шт' || ingredientData.unit === 'шт.' ? 'selected' : ''}>шт.</option>
                <option value="г" ${ingredientData.unit === 'г' ? 'selected' : ''}>г</option>
                <option value="кг" ${ingredientData.unit === 'кг' ? 'selected' : ''}>кг</option>
                <option value="мл" ${ingredientData.unit === 'мл' ? 'selected' : ''}>мл</option>
                <option value="л" ${ingredientData.unit === 'л' ? 'selected' : ''}>л</option>
                <option value="ст.л" ${ingredientData.unit === 'ст.л' || ingredientData.unit === 'ст.л.' ? 'selected' : ''}>ст.л.</option>
                <option value="ч.л" ${ingredientData.unit === 'ч.л' || ingredientData.unit === 'ч.л.' ? 'selected' : ''}>ч.л.</option>
            </select>
            <button type="button" class="add-icon remove-row" style="width:40px;height:40px;">
                <i class="fa-solid fa-minus"></i>
            </button>
        `;

        row.querySelector('.remove-row').addEventListener('click', () => row.remove());
        return row;
    }

    addIngredientBtn.addEventListener('click', function() {
        ingredientsContainer.appendChild(createIngredientRow());
    });

    function createStepRow(stepData = { number: 1, description: '', photo: null }) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'addrecipe-step step-row';
        
        // Добавляем отображение фото, если оно есть
        let photoHtml = '';
        if (stepData.photo) {
            const photoUrl = stepData.photo.startsWith('http') 
                ? stepData.photo 
                : `http://localhost:8000${stepData.photo}`;
            photoHtml = `
                <div class="step-photo-preview" style="margin-bottom: 15px;">
                    <img src="${photoUrl}" alt="Фото шага ${stepData.number}" style="max-width: 200px; max-height: 150px; border-radius: 15px; border: 3px solid var(--dark-brown);">
                    <p style="font-size: 14px; margin-top: 5px;">Текущее фото шага</p>
                </div>
            `;
        }
        
        stepDiv.innerHTML = `
            <label>Шаг ${stepData.number}</label>
            ${photoHtml}
            <div class="file-input-wrapper">
                <input type="file" class="step-image" accept="image/*">
                <div class="file-input-button">${stepData.photo ? 'Заменить фото' : 'Выбрать фото...'}</div>
            </div>
            <textarea class="addrecipe-field step-description" placeholder="Описание шага" rows="4" required>${stepData.description || ''}</textarea>
            <button type="button" class="add-icon remove-step" style="margin-top:15px;width:40px;height:40px;">
                <i class="fa-solid fa-minus"></i> Удалить шаг
            </button>
        `;

        stepDiv.querySelector('.remove-step').addEventListener('click', function() {
            stepDiv.remove();
            updateStepNumbers();
        });
        return stepDiv;
    }

    function updateStepNumbers() {
        const steps = document.querySelectorAll('#editsteps-container .step-row');
        steps.forEach((step, index) => {
            const label = step.querySelector('label');
            if (label) {
                label.textContent = `Шаг ${index + 1}`;
            }
        });
    }

    addStepBtn.addEventListener('click', function() {
        const stepNumber = stepsContainer.children.length + 1;
        stepsContainer.appendChild(createStepRow({ number: stepNumber, description: '', photo: null }));
    });

    async function loadCategories() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/recipes/categories/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const categories = await response.json();
            
            const select = document.getElementById('editcategory');
            select.innerHTML = '<option value="">Выберите категорию</option>';
            
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
            
            return categories;
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            return [];
        }
    }

    async function loadRecipeData() {
        try {
            // Сначала загружаем категории
            const categories = await loadCategories();
            
            // Затем загружаем рецепт
            const response = await fetch(`http://localhost:8000/api/recipes/${recipeId}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Ошибка загрузки рецепта');

            const recipe = await response.json();
            console.log('Загружен рецепт:', recipe);

            // Заполняем основные поля
            document.getElementById('edittitle').value = recipe.title || '';
            document.getElementById('editdescription').value = recipe.description || '';
            document.getElementById('editcost').value = recipe.price || '';
            document.getElementById('edittime').value = recipe.cooking_time || '';

            // Устанавливаем категорию
            const categorySelect = document.getElementById('editcategory');
            if (recipe.category_id) {
                categorySelect.value = recipe.category_id;
                console.log('Установлена категория:', recipe.category_id);
            }

            // Загружаем ингредиенты
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                recipe.ingredients.forEach(ing => {
                    ingredientsContainer.appendChild(createIngredientRow({
                        name: ing.name,
                        amount: ing.quantity,
                        unit: ing.unit
                    }));
                });
            } else {
                ingredientsContainer.appendChild(createIngredientRow());
            }

            // Загружаем шаги с фото
            if (recipe.steps && recipe.steps.length > 0) {
                recipe.steps.sort((a, b) => a.step_number - b.step_number).forEach(step => {
                    stepsContainer.appendChild(createStepRow({
                        number: step.step_number,
                        description: step.description,
                        photo: step.photo
                    }));
                });
            } else {
                stepsContainer.appendChild(createStepRow({ number: 1, description: '', photo: null }));
            }

        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить данные рецепта');
        }
    }

    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const categoryId = document.getElementById('editcategory').value;
        console.log('Выбранная категория ID:', categoryId);
        
        if (!categoryId) {
            alert('Выберите категорию');
            return;
        }

        try {
            // Собираем данные в JSON
            const recipeData = {
                title: document.getElementById('edittitle').value,
                description: document.getElementById('editdescription').value,
                category_id: parseInt(categoryId),
                cooking_time: parseInt(document.getElementById('edittime').value),
                ingredients: [],
                steps: []
            };

            // Добавляем цену, если есть
            const cost = document.getElementById('editcost').value;
            if (cost) {
                recipeData.price = parseFloat(cost);
            }

            // Собираем ингредиенты
            document.querySelectorAll('#editingredients-container .ingredient-row').forEach(row => {
                const name = row.querySelector('.ingredient-name').value;
                const amount = row.querySelector('.ingredient-amount').value;
                const unit = row.querySelector('.ingredient-unit').value;
                
                if (name && amount && unit) {
                    recipeData.ingredients.push({
                        name: name,
                        quantity: parseFloat(amount),
                        unit: unit
                    });
                }
            });

            // Собираем шаги
            document.querySelectorAll('#editsteps-container .step-row').forEach((row, index) => {
                const description = row.querySelector('.step-description').value;
                if (description) {
                    recipeData.steps.push({
                        step_number: index + 1,
                        description: description
                    });
                }
            });

            console.log('Отправка данных:', recipeData);

            const response = await fetch(`http://localhost:8000/api/recipes/${recipeId}/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recipeData)
            });

            if (response.ok) {
                alert('Рецепт успешно обновлён!');
                window.location.href = `recipe.html?id=${recipeId}`;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.detail || 'Ошибка при обновлении');
            }

        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка: ' + error.message);
        }
    });
});

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