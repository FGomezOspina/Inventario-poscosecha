// config.js

document.addEventListener('DOMContentLoaded', () => {
    let config = {
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

    // Cargar configuración desde localStorage si existe
    const savedConfig = JSON.parse(localStorage.getItem('config'));
    if (savedConfig) {
        config = savedConfig;
    }

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
        saveTableData(); // Asegúrate de que esta función esté accesible globalmente
        updateAllCalculations(); // Asegúrate de que esta función esté accesible globalmente
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
});
