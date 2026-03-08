document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    if (password !== confirmPassword) {
        alert('Пароли не совпадают!');
        return;
    }

    if (password.length < 6) {
        alert('Пароль не может быть меньше 6 символов!');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/auth/register/', {
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
                localStorage.setItem('username', username);
            }

            alert('Регистрация прошла успешно!');
            window.location.href = 'index.html';
        } else {
            const errorMassage = data.error || data.detail || 'Ошибка при регистрации';
            alert('Ошибка: ' + errorMassage);
        } 
    } catch (error) {
        console.error('Ошибка: ', error);
        alert('Ошибка соединения с сервером')
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'index.html';
    }
})