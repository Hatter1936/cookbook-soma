document.addEventListener('DOMContentLoaded', function() {
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            showAddCategoryModal();
        });
    }
});

function showAddCategoryModal() {
    const modal = document.createElement('div');
    modal.className = 'category-modal';
    modal.innerHTML = `
        <div class="category-modal-content">
            <h3>Добавить новую категорию</h3>
            <input type="text" id="newCategoryName" placeholder="Название категории" class="addrecipe-field">
            <div class="category-modal-buttons">
                <button id="saveCategoryBtn" class="btn">Сохранить</button>
                <button id="cancelCategoryBtn" class="btn" style="background-color: var(--dark-brown); box-shadow: 0 6px 0 #44312b;">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const style = document.createElement('style');
    style.textContent = `
        .category-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        }
        
        .category-modal-content {
            background-color: var(--div-color);
            padding: 30px;
            border-radius: 50px;
            border: 3px solid var(--dark-brown);
            box-shadow: var(--shadow-div);
            width: 90%;
            max-width: 400px;
        }
        
        .category-modal-content h3 {
            font-size: 22px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .category-modal-content input {
            width: 100%;
            margin-bottom: 20px;
        }
        
        .category-modal-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .category-modal-buttons .btn {
            flex: 1;
            padding: 10px;
            font-size: 18px;
        }
    `;
    document.head.appendChild(style);
    
    document.getElementById('saveCategoryBtn').addEventListener('click', async function() {
        const categoryName = document.getElementById('newCategoryName').value.trim();
        if (!categoryName) {
            alert('Введите название категории');
            return;
        }
        
        await addCategory(categoryName);
        document.body.removeChild(modal);
    });
    
    document.getElementById('cancelCategoryBtn').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape' && document.body.contains(modal)) {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

async function addCategory(name) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Необходимо авторизоваться');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:8000/api/recipes/categories/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: name })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка при создании категории');
        }
        
        const category = await response.json();
        
        await loadCategoriesForFilter();
        
        const select = document.getElementById('filterCategory');
        if (select) {
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value == category.id) {
                    select.selectedIndex = i;
                    break;
                }
            }
        }
        
        alert('Категория успешно добавлена!');
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message || 'Ошибка при создании категории');
    }
}

async function loadCategoriesForFilter() {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch('http://localhost:8000/api/recipes/categories/', {
            headers: headers
        });
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