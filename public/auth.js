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
            // Se ejecuta sólo una vez para evitar múltiples listeners
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();

                const user = users.find(u => u.username === username && u.password === password);
                if (user) {
                    window.currentUser = user; 
                    localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
                    loginModal.hide();
                    showAlert(`Bienvenido, ${window.currentUser.username}.`);
                    updateUIForRole();
                    updateSidebarUserInfo();
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

    function updateSidebarUserInfo() {
        // Muestra el nombre y rol del usuario en el sidebar
        const sidebarUsername = document.getElementById('sidebarUsername');
        const sidebarUserRole = document.getElementById('sidebarUserRole');

        if (window.currentUser) {
            sidebarUsername.textContent = window.currentUser.username;
            sidebarUserRole.textContent = window.currentUser.role;
        } else {
            sidebarUsername.textContent = 'User Name';
            sidebarUserRole.textContent = 'Role';
        }
    }
    
    function updateUIForRole() {
        // Referencias a los elementos del sidebar
        const configNavItem = document.getElementById('configNavItem');
        const inventarioNavItem = document.getElementById('inventarioNavItem');
        const soloEmpaqueNavItem = document.getElementById('soloEmpaqueNavItem');
        const soloEmpaqueMixItem = document.getElementById('soloEmpaqueMixItem');

        // Si no hay usuario logueado, ocultar todo
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
            if (configNavItem) configNavItem.style.display = 'block';
            if (inventarioNavItem) inventarioNavItem.style.display = 'block';
            if (soloEmpaqueNavItem) soloEmpaqueNavItem.style.display = 'block';
            if (soloEmpaqueMixItem) soloEmpaqueMixItem.style.display = 'block';
        } 
        else if (role === 'inventario') {
            if (inventarioNavItem) inventarioNavItem.style.display = 'block';
            // El rol 'inventario' no ve "Packing" ni "Packing Mix"
        }
        else if (role === 'empaque') {
            if (soloEmpaqueNavItem) soloEmpaqueNavItem.style.display = 'block';
            if (soloEmpaqueMixItem) soloEmpaqueMixItem.style.display = 'block';
        }
    }

    function logout() {
        window.currentUser = null;
        localStorage.removeItem('currentUser');
        showLoginModal();
        updateSidebarUserInfo();
        updateUIForRole();
    }

    // Cargar usuario almacenado
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        window.currentUser = JSON.parse(storedUser);
        updateUIForRole();
        updateSidebarUserInfo();
    } else {
        showLoginModal();
    }

    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Botón toggle para el sidebar (versión móvil)
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebarMenu = document.getElementById('sidebarMenu');
    if (toggleSidebarBtn && sidebarMenu) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebarMenu.classList.toggle('show');
        });
    }
});
