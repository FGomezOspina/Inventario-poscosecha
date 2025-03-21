// auth.js

document.addEventListener('DOMContentLoaded', () => {
    /* The `const users` array is storing user objects with their respective usernames, passwords, and
    roles. Each object represents a user with properties `username`, `password`, and `role`. This
    array is used for authentication purposes in the application to verify user credentials during
    the login process. */
    const users = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'inventario', password: 'inventario123', role: 'inventario' },
        { username: 'empaque', password: 'empaque123', role: 'empaque'}
    ];
    
    /* `window.currentUser = null;` is initializing a global variable `currentUser` to `null`. This
    variable is used to store the currently logged-in user object. By setting it to `null`
    initially, it indicates that no user is logged in when the script first runs. This variable will
    be updated with the user object when a user successfully logs in, and it will be set back to
    `null` when the user logs out. */
    window.currentUser = null;

    /**
     * The function `showLoginModal` displays a login modal, validates user input, and performs login
     * actions based on the input.
     */
    function showLoginModal() {
        const loginModalElement = document.getElementById('loginModal');
        const loginModal = new bootstrap.Modal(loginModalElement);
        loginModal.show();

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            // It runs only once to avoid multiple listeners.
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();

                const user = users.find(u => u.username === username && u.password === password);
                if (user) {
                    window.currentUser = user; 
                    localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
                    loginModal.hide();
                    showAlert(`Welcome, ${window.currentUser.username}.`);
                    updateUIForRole();
                    updateSidebarUserInfo();
                } else {
                    showAlert('Incorrect username or password.', 'danger');
                }
            }, { once: true });
        }
    }

    /**
     * The function `showAlert` dynamically creates and displays alert messages on a web page with a
     * specified message and type, automatically removing them after 3 seconds.
     * @param message - The `message` parameter in the `showAlert` function is the text that you want
     * to display in the alert message box. It is the main content that you want to communicate to the
     * user, such as a success message, an error message, or any other information you want to convey.
     * @param [type=success] - The `type` parameter in the `showAlert` function is used to specify the
     * type of alert to be displayed. It has a default value of `'success'`, but you can also pass
     * other values such as `'info'`, `'warning'`, or `'danger'` to customize the appearance
     */
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

    /**
     * The function `updateSidebarUserInfo` updates the user's name and role displayed in the sidebar
     * based on the `window.currentUser` object.
     */
    function updateSidebarUserInfo() {
        // Display the user's name and role in the sidebar.
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
    
    /**
     * The function `updateUIForRole` dynamically updates the visibility of sidebar elements based on
     * the role of the current user.
     * @returns The function `updateUIForRole` returns nothing explicitly. It updates the visibility of
     * sidebar elements based on the role of the current user.
     */
    function updateUIForRole() {
        // References to the sidebar elements.
        const configNavItem = document.getElementById('configNavItem');
        const inventarioNavItem = document.getElementById('inventarioNavItem');
        const soloEmpaqueNavItem = document.getElementById('soloEmpaqueNavItem');
        const soloEmpaqueMixItem = document.getElementById('soloEmpaqueMixItem');

        // If no user is logged in, hide everything.
        if (!window.currentUser) {
            if (configNavItem) configNavItem.style.display = 'none';
            if (inventarioNavItem) inventarioNavItem.style.display = 'none';
            if (soloEmpaqueNavItem) soloEmpaqueNavItem.style.display = 'none';
            if (soloEmpaqueMixItem) soloEmpaqueMixItem.style.display = 'none';
            return;
        }
      
        const role = window.currentUser.role;
      
        // Hide everything by default.
        if (configNavItem) configNavItem.style.display = 'none';
        if (inventarioNavItem) inventarioNavItem.style.display = 'none';
        if (soloEmpaqueNavItem) soloEmpaqueNavItem.style.display = 'none';
        if (soloEmpaqueMixItem) soloEmpaqueMixItem.style.display = 'none';
      
        // Role-based rules.
        if (role === 'admin') {
            if (configNavItem) configNavItem.style.display = 'block';
            if (inventarioNavItem) inventarioNavItem.style.display = 'block';
            if (soloEmpaqueNavItem) soloEmpaqueNavItem.style.display = 'block';
            if (soloEmpaqueMixItem) soloEmpaqueMixItem.style.display = 'block';
        } 
        else if (role === 'inventario') {
            if (inventarioNavItem) inventarioNavItem.style.display = 'block';
        }
        else if (role === 'empaque') {
            if (soloEmpaqueNavItem) soloEmpaqueNavItem.style.display = 'block';
            if (soloEmpaqueMixItem) soloEmpaqueMixItem.style.display = 'block';
        }
    }

    /**
     * The `logout` function clears the current user data, removes it from local storage, shows the
     * login modal, updates sidebar user info, and updates the UI based on the user's role.
     */
    function logout() {
        window.currentUser = null;
        localStorage.removeItem('currentUser');
        showLoginModal();
        updateSidebarUserInfo();
        updateUIForRole();
    }

    // Load stored user.
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        window.currentUser = JSON.parse(storedUser);
        updateUIForRole();
        updateSidebarUserInfo();
    } else {
        showLoginModal();
    }

    // Logout button.
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Toggle button for the sidebar (mobile version).
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebarMenu = document.getElementById('sidebarMenu');
    if (toggleSidebarBtn && sidebarMenu) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebarMenu.classList.toggle('show');
        });
    }
});
