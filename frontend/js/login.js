document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:8000/api/auth/users/login/', {
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
            } else if (data.token) {
                localStorage.setItem('token', data.token);
            }

            window.location.href = 'index.html';
        } else {
            alert('Ошибка: ' + (data.detail || data.message || 'Неверный логин или пароль'));
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
    }
});