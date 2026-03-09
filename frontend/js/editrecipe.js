document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- Получение ID рецепта из URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        alert('ID рецепта не указан');
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('recipeId').value = recipeId;

    // --- Элементы формы ---
    const ingredientsContainer = document.getElementById('editingredients-container');
    const stepsContainer = document.getElementById('editsteps-container');
    const addIngredientBtn = document.getElementById('editaddingredient');
    const addStepBtn = document.getElementById('editaddstep');
    const editForm = document.getElementById('editRecipeForm');

    // --- Функции для управления ингредиентами (аналогично addrecipe.js) ---
    function createIngredientRow(ingredientData = { name: '', amount: '', unit: 'шт.' }) {
        const row = document.createElement('div');
        row.className = 'addrecipe-element-rowelements ingredient-row';
        row.innerHTML = `
            <input type="text" class="addrecipe-field ingredient-name" placeholder="Название" value="${ingredientData.name}" required>
            <input type="text" class="addrecipe-field ingredient-amount" placeholder="Количество" value="${ingredientData.amount}" required>
            <select class="addrecipe-button ingredient-unit" required>
                <option value="шт." ${ingredientData.unit === 'шт.' ? 'selected' : ''}>шт.</option>
                <option value="г" ${ingredientData.unit === 'г' ? 'selected' : ''}>г</option>
                <option value="кг" ${ingredientData.unit === 'кг' ? 'selected' : ''}>кг</option>
                <option value="мл" ${ingredientData.unit === 'мл' ? 'selected' : ''}>мл</option>
                <option value="л" ${ingredientData.unit === 'л' ? 'selected' : ''}>л</option>
                <option value="ст.л." ${ingredientData.unit === 'ст.л.' ? 'selected' : ''}>ст.л.</option>
                <option value="ч.л." ${ingredientData.unit === 'ч.л.' ? 'selected' : ''}>ч.л.</option>
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

    // --- Функции для управления шагами ---
    function createStepRow(stepData = { number: 1, description: '', image: null }) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'addrecipe-step step-row';
        stepDiv.innerHTML = `
            <label for="editstepimage-${stepData.number}">Шаг ${stepData.number}</label>
            <div class="file-input-wrapper">
                <input type="file" id="editstepimage-${stepData.number}" accept="image/*">
                <div class="file-input-button">${stepData.image ? 'Файл выбран' : 'Выбрать файл...'}</div>
            </div>
            <textarea class="addrecipe-field step-description" placeholder="Описание шага" rows="4" required>${stepData.description}</textarea>
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
            label.textContent = `Шаг ${index + 1}`;
            const input = step.querySelector('input[type="file"]');
            if (input) {
                input.id = `editstepimage-${index + 1}`;
            }
        });
    }

    addStepBtn.addEventListener('click', function() {
        const stepNumber = stepsContainer.children.length + 1;
        stepsContainer.appendChild(createStepRow({ number: stepNumber, description: '' }));
    });

    // --- Загрузка данных рецепта ---
    async function loadRecipeData() {
        try {
            const response = await fetch(`http://localhost:8000/api/recipes/${recipeId}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Ошибка загрузки рецепта');

            const recipe = await response.json();

            // Заполнение основных полей
            document.getElementById('edittitle').value = recipe.title || '';
            document.getElementById('editdescription').value = recipe.description || '';
            document.getElementById('editcategory').value = recipe.category || 'no_category';
            document.getElementById('editcost').value = recipe.cost || '';
            document.getElementById('edittime').value = recipe.cooking_time || '';

            // Загрузка ингредиентов
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                recipe.ingredients.forEach(ing => {
                    ingredientsContainer.appendChild(createIngredientRow(ing));
                });
            } else {
                // Если нет ингредиентов, добавить одну пустую строку
                ingredientsContainer.appendChild(createIngredientRow());
            }

            // Загрузка шагов
            if (recipe.steps && recipe.steps.length > 0) {
                recipe.steps.sort((a, b) => a.step_number - b.step_number).forEach(step => {
                    stepsContainer.appendChild(createStepRow({
                        number: step.step_number,
                        description: step.description,
                        image: step.image // предположим, что API возвращает информацию о фото
                    }));
                });
            } else {
                // Если нет шагов, добавить один пустой шаг
                stepsContainer.appendChild(createStepRow({ number: 1, description: '' }));
            }

        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить данные рецепта');
        }
    }

    // --- Отправка обновлённых данных ---
    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        try {
            const formData = new FormData();

            // Фото (основное)
            const photoFile = document.getElementById('editphoto').files[0];
            if (photoFile) {
                formData.append('photo', photoFile);
            }

            // Основные поля
            formData.append('title', document.getElementById('edittitle').value);
            formData.append('description', document.getElementById('editdescription').value);
            formData.append('category', document.getElementById('editcategory').value);
            formData.append('cost', document.getElementById('editcost').value);
            formData.append('cooking_time', document.getElementById('edittime').value);

            // Ингредиенты
            const ingredients = [];
            document.querySelectorAll('#editingredients-container .ingredient-row').forEach(row => {
                ingredients.push({
                    name: row.querySelector('.ingredient-name').value,
                    amount: row.querySelector('.ingredient-amount').value,
                    unit: row.querySelector('.ingredient-unit').value
                });
            });
            formData.append('ingredients', JSON.stringify(ingredients));

            // Шаги
            const steps = [];
            const stepRows = document.querySelectorAll('#editsteps-container .step-row');
            for (let i = 0; i < stepRows.length; i++) {
                const row = stepRows[i];
                const description = row.querySelector('.step-description').value;
                const imageFile = row.querySelector('input[type="file"]').files[0];

                steps.push({
                    step_number: i + 1,
                    description: description
                });

                if (imageFile) {
                    formData.append(`step_image_${i + 1}`, imageFile);
                }
            }
            formData.append('steps', JSON.stringify(steps));

            // Отправка PUT-запроса
            const response = await fetch(`http://localhost:8000/api/recipes/${recipeId}/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert('Рецепт успешно обновлён!');
                window.location.href = `recipe.html?id=${recipeId}`; // или index.html
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка при обновлении');
            }

        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка: ' + error.message);
        }
    });

    // --- Инициализация: загружаем данные ---
    loadRecipeData();
});