// config.js

document.addEventListener('DOMContentLoaded', () => {
    const defaultConfig = {
        TJ: {
            bunchesPerProcona: 20,
            stemsPerBunch: 7
        },
        REG: {
            stemsPerBunch: 25,
            lengths: {
                70: { bunchesPerProcona: 8 },
                60: { bunchesPerProcona: 8 },
                55: { bunchesPerProcona: 8 },
                50: { bunchesPerProcona: 4 },
                40: { bunchesPerProcona: 8 }
            }
        },
        WS10: {
            bunchesPerProcona: 20,
            stemsPerBunch: 10
        }
    };

    // Función para realizar una fusión profunda de objetos
    function deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (
                    source[key] &&
                    typeof source[key] === 'object' &&
                    !Array.isArray(source[key])
                ) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    // Cargar configuración desde localStorage si existe
    const savedConfig = JSON.parse(localStorage.getItem('config'));
    let config = {};

    if (savedConfig) {
        config = deepMerge(JSON.parse(JSON.stringify(defaultConfig)), savedConfig);
    } else {
        config = JSON.parse(JSON.stringify(defaultConfig));
    }

    // **Asegurar que config.REG.lengths contiene todas las longitudes necesarias**
    const requiredLengths = ['70', '60', '55', '50', '40'];
    if (!config.REG || typeof config.REG !== 'object') {
        config.REG = JSON.parse(JSON.stringify(defaultConfig.REG));
    } else {
        if (!config.REG.lengths || typeof config.REG.lengths !== 'object') {
            config.REG.lengths = JSON.parse(JSON.stringify(defaultConfig.REG.lengths));
        } else {
            requiredLengths.forEach(length => {
                if (!config.REG.lengths.hasOwnProperty(length)) {
                    config.REG.lengths[length] = JSON.parse(JSON.stringify(defaultConfig.REG.lengths[length]));
                }
            });
        }
    }

    // **Guardar la configuración fusionada de nuevo en localStorage para asegurar su integridad**
    localStorage.setItem('config', JSON.stringify(config));

    function openConfigModal() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-scrollable" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Configuración</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <form id="configForm">
                            ${generateConfigForm()}
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" id="saveConfigBtn">Guardar cambios</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        document.getElementById('saveConfigBtn').addEventListener('click', () => {
            saveConfigFromForm();
            bootstrapModal.hide();
            modal.remove();
            showAlert('Configuración guardada correctamente.');
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    function generateConfigForm() {
        let html = '';

        ["TJ", "WS10"].forEach(type => {
            html += `
                <h5>${type}</h5>
                <div class="mb-3">
                    <label>Bunches/Procona:</label>
                    <input type="number" class="form-control" name="${type}_bunchesPerProcona" value="${config[type].bunchesPerProcona}">
                </div>
                <div class="mb-3">
                    <label>Stems/Bunch:</label>
                    <input type="number" class="form-control" name="${type}_stemsPerBunch" value="${config[type].stemsPerBunch}">
                </div>
            `;
        });

        html += `
            <h5>REG</h5>
            <div class="mb-3">
                <label>Stems/Bunch:</label>
                <input type="number" class="form-control" name="REG_stemsPerBunch" value="${config.REG.stemsPerBunch}">
            </div>
        `;

        Object.keys(config.REG.lengths).forEach(length => {
            html += `
                <div class="mb-3">
                    <label>Bunches/Procona para ${length} cm:</label>
                    <input type="number" class="form-control" name="REG_bunchesPerProcona_${length}" value="${config.REG.lengths[length].bunchesPerProcona}">
                </div>
            `;
        });

        return html;
    }

    function saveConfigFromForm() {
        const form = document.getElementById('configForm');
        const formData = new FormData(form);

        ["TJ", "WS10"].forEach(type => {
            config[type].bunchesPerProcona = parseInt(formData.get(`${type}_bunchesPerProcona`)) || 0;
            config[type].stemsPerBunch = parseInt(formData.get(`${type}_stemsPerBunch`)) || 0;
        });

        config.REG.stemsPerBunch = parseInt(formData.get('REG_stemsPerBunch')) || 0;

        Object.keys(config.REG.lengths).forEach(length => {
            config.REG.lengths[length].bunchesPerProcona = parseInt(formData.get(`REG_bunchesPerProcona_${length}`)) || 0;
        });

        localStorage.setItem('config', JSON.stringify(config));

        // **Asegurar que estas funciones sean accesibles globalmente**
        if (typeof window.saveTableData === 'function') {
            window.saveTableData();
        } else {
            console.warn('saveTableData no está definido.');
        }

        if (typeof window.updateAllCalculations === 'function') {
            window.updateAllCalculations();
        } else {
            console.warn('updateAllCalculations no está definido.');
        }
    }

    // Event listener para el botón de configuración
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        configBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.currentUser && window.currentUser.role === 'admin') { // Acceder a currentUser global
                openConfigModal();
            } else {
                showAlert('No tienes permisos para acceder a la configuración.', 'danger');
            }
        });
    }

    // Función para mostrar alertas (similar a la de main.js)
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
});
