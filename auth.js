// auth.js

document.addEventListener('DOMContentLoaded', () => {
    const users = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'user', password: 'user123', role: 'user' }
    ];
    
    // Definir currentUser globalmente
    window.currentUser = null;

    function showLoginModal() {
        const loginModalElement = document.getElementById('loginModal');
        const loginModal = new bootstrap.Modal(loginModalElement);
        loginModal.show();

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();

                const user = users.find(u => u.username === username && u.password === password);
                if (user) {
                    window.currentUser = user; // Asignar al objeto global
                    localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
                    loginModal.hide();
                    showAlert(`Bienvenido, ${window.currentUser.username}.`);
                    updateUIForRole();
                } else {
                    showAlert('Usuario o contraseña incorrectos.', 'danger');
                }
            }, { once: true });
        }
    }

    function showAlert(message, type = 'success') {
        // Obtén el contenedor de alertas o crea uno si no existe
        let alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'alertContainer';
            document.body.prepend(alertContainer);
        }
    
        // Crea el elemento de alerta
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
    
        // Añade la alerta al contenedor
        alertContainer.appendChild(alert);
    
        // Configura un temporizador para cerrar la alerta después de unos segundos
        setTimeout(() => {
            alert.classList.remove('show');
            alert.classList.add('hide');
            setTimeout(() => alert.remove(), 500); // Permite que la animación de cierre termine
        }, 3000); // Cambia este valor si quieres que dure más o menos tiempo
    }
    
    function updateUIForRole() {
        const configBtn = document.getElementById('configBtn');
        if (configBtn) {
            if (window.currentUser && window.currentUser.role === 'admin') {
                configBtn.style.display = 'block';
            } else {
                configBtn.style.display = 'none';
            }
        }
    }

    function logout() {
        window.currentUser = null;
        localStorage.removeItem('currentUser');
        showLoginModal();
    }

    // Mostrar el modal de inicio de sesión si no hay usuario almacenado
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        window.currentUser = JSON.parse(storedUser);
        updateUIForRole();
    } else {
        showLoginModal();
    }

    // Event listener para el botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});
