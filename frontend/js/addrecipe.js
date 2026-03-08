document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    console.log('Пользователь авторизован');

    const ingredientsContainer = document.getElementById('ingredients-container');
    const addIngredientBtn = document.getElementById('addingredient');
    
    addIngredientBtn.addEventListener('click', function() {
        const newRow = document.createElement('div');
        newRow.className = 'addrecipe-element-rowelements ingredient-row';
        newRow.innerHTML = `
            <input type="text" class="addrecipe-field ingredient-name" placeholder="Название" required>
            <input type="text" class="addrecipe-field ingredient-amount" placeholder="Количество" required>
            <select class="addrecipe-button ingredient-unit" required>
                <option value="шт.">шт.</option>
                <option value="г">г</option>
                <option value="кг">кг</option>
                <option value="мл">мл</option>
                <option value="л">л</option>
                <option value="ст.л.">ст.л.</option>
                <option value="ч.л.">ч.л.</option>
            </select>
            <button type="button" class="add-icon remove-row" style="width:40px;height:40px;">
                <i class="fa-solid fa-minus"></i>
            </button>
        `;
        ingredientsContainer.appendChild(newRow);
        
        newRow.querySelector('.remove-row').addEventListener('click', function() {
            newRow.remove();
        });
    });

    const stepsContainer = document.getElementById('steps-container');
    const addStepBtn = document.getElementById('addstep');
    let stepCount = 1;
    
    addStepBtn.addEventListener('click', function() {
        stepCount++;
        const stepNumber = stepsContainer.children.length + 1;
        const newStep = document.createElement('div');
        newStep.className = 'addrecipe-step step-row';
        newStep.innerHTML = `
            <label for="stepimage-${stepCount}">Шаг ${stepNumber}</label>
            <div class="file-input-wrapper">
                <input type="file" id="stepimage-${stepCount}" accept="image/*">
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
    });
    
    function updateStepNumbers() {
        const steps = document.querySelectorAll('.step-row');
        steps.forEach((step, index) => {
            const label = step.querySelector('label');
            if (label) {
                label.textContent = `Шаг ${index + 1}`;
                const input = step.querySelector('input[type="file"]');
                if (input) {
                    input.id = `stepimage-${index + 1}`;
                }
            }
        });
    }

    const recipeForm = document.getElementById('recipeForm');
    
    recipeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('Необходимо авторизоваться');
            window.location.href = 'login.html';
            return;
        }
        
        try {
            const formData = new FormData();
            
            const photo = document.getElementById('photo').files[0];
            if (photo) {
                formData.append('photo', photo);
            }
            
            formData.append('title', document.getElementById('title').value);
            formData.append('description', document.getElementById('description').value);
            
            formData.append('category', document.getElementById('category').value);
            
            formData.append('cost', document.getElementById('cost').value);
            formData.append('cooking_time', document.getElementById('time').value);
            
            const ingredients = [];
            document.querySelectorAll('.ingredient-row').forEach(row => {
                const name = row.querySelector('.ingredient-name')?.value;
                const amount = row.querySelector('.ingredient-amount')?.value;
                const unit = row.querySelector('.ingredient-unit')?.value;
                if (name && amount && unit) {
                    ingredients.push({
                        name: name,
                        amount: amount,
                        unit: unit
                    });
                }
            });
            formData.append('ingredients', JSON.stringify(ingredients));
            
            const steps = [];
            const stepRows = document.querySelectorAll('.step-row');
            
            for (let i = 0; i < stepRows.length; i++) {
                const row = stepRows[i];
                const description = row.querySelector('.step-description')?.value;
                const imageFile = row.querySelector('input[type="file"]')?.files[0];
                
                const stepData = {
                    step_number: i + 1,
                    description: description
                };
                
                steps.push(stepData);
                
                if (imageFile) {
                    formData.append(`step_image_${i + 1}`, imageFile);
                }
            }
            formData.append('steps', JSON.stringify(steps));
            
            const response = await fetch('http://localhost:8000/api/recipes/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Рецепт успешно добавлен!');
                window.location.href = 'index.html';
            } else {
                let errorMessage = 'Ошибка при добавлении рецепта';
                
                if (data.detail) {
                    errorMessage = data.detail;
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (typeof data === 'object') {
                    const errors = Object.entries(data)
                        .map(([field, message]) => `${field}: ${message}`)
                        .join('\n');
                    if (errors) {
                        errorMessage = errors;
                    }
                }
                
                alert('Ошибка: ' + errorMessage);
                console.error('Детали ошибки:', data);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения с сервером');
        }
    });
});