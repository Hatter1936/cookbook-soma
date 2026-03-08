document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    console.log('Форма отправлена');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log('Username:', username);
    console.log('Password length:', password.length);
    
    document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Заполните все поля!');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.access) {
                localStorage.setItem('token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('username', data.username);
            }

            window.location.href = 'index.html';
        } else {
            const errorMassage = data.detail || data.message || 'Неверный логин или пароль';
            alert('Ошибка: ' + errorMassage);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка соединения с сервером');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {
        console.log('Пользователь авторизован');
    }
});
});