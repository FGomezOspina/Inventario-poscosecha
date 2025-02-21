// auth.js

document.addEventListener('DOMContentLoaded', () => {
    const users = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'inventario', password: 'inventario123', role: 'inventario' },
        { username: 'empaque', password: 'empaque123', role: 'empaque'}
    ];
    
    // Definir currentUser globalmente
    window.currentUser = null;

    function showLoginModal() {
        const loginModalElement = document.getElementById('loginModal');
        const loginModal = new bootstrap.Modal(loginModalElement);
        loginModal.show();

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            // Solo se ejecuta una vez para evitar múltiples "submit" event listeners
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
        let alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'alertContainer';
            document.body.prepend(alertContainer);
        }
    
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
    
        alertContainer.appendChild(alert);
    
        setTimeout(() => {
            alert.classList.remove('show');
            alert.classList.add('hide');
            setTimeout(() => alert.remove(), 500);
        }, 3000);
    }
    
    function updateUIForRole() {
        // Referencias a los elementos del sidebar
        const configNavItem = document.getElementById('configNavItem');      // <li> de Configuración
        const inventarioNavItem = document.getElementById('inventarioNavItem'); // <li> de Inventario
        const soloEmpaqueNavItem = document.getElementById('soloEmpaqueNavItem'); // <li> de Empaque
        const soloEmpaqueMixItem = document.getElementById('soloEmpaqueMixItem')
      
        // Si no hay usuario logueado, ocultar todo (salvo "Cerrar Sesión" si quieres mantenerlo)
        if (!window.currentUser) {
            if (configNavItem) configNavItem.style.display = 'none';
            if (inventarioNavItem) inventarioNavItem.style.display = 'none';
            if (soloEmpaqueNavItem) soloEmpaqueNavItem.style.display = 'none';
            if (soloEmpaqueMixItem) soloEmpaqueMixItem.style.display = 'none';
            return;
        }
      
        const role = window.currentUser.role;
      
        // Ocultar todo por defecto
        if (configNavItem) configNavItem.style.display = 'none';
        if (inventarioNavItem) inventarioNavItem.style.display = 'none';
        if (soloEmpaqueNavItem) soloEmpaqueNavItem.style.display = 'none';
        if (soloEmpaqueMixItem) soloEmpaqueMixItem.style.display = 'none';
      
        // Reglas por rol
        if (role === 'admin') {
            // Admin ve todo
            if (configNavItem) configNavItem.style.display = 'block';
            if (inventarioNavItem) inventarioNavItem.style.display = 'block';
            if (soloEmpaqueNavItem) soloEmpaqueNavItem.style.display = 'block';
            if (soloEmpaqueMixItem) soloEmpaqueMixItem.style.display = 'block';
        } 
        else if (role === 'inventario') {
            // Solo inventario
            if (inventarioNavItem) inventarioNavItem.style.display = 'block';
            if (soloEmpaqueMixItem) soloEmpaqueMixItem.style.display = 'none';
        }
        else if (role === 'empaque') {
            // Solo empaque
            if (soloEmpaqueNavItem) soloEmpaqueNavItem.style.display = 'block';
            if (soloEmpaqueMixItem) soloEmpaqueMixItem.style.display = 'block';
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
