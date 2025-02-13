// config.js

document.addEventListener('DOMContentLoaded', () => {
    const defaultConfigs = {
        VERONICA: {
            TJ: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
            // ==== NUEVA SECCIÓN NF (igual que TJ) ====
            NF: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
            REG: {
                stemsPerBunch: 25, // Valor predeterminado para REG
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
        },
        HYPERICUM: {
            TJ: {
                bunchesPerProcona: 40,
                stemsPerBunch: 7
            },
            // ==== NUEVA SECCIÓN NF (igual que TJ) ====
            NF: {
                bunchesPerProcona: 40,
                stemsPerBunch: 7
            },
            REG: {
                lengths: {
                    70: { bunchesPerProcona: 40, stemsPerBunch: 10 },
                    60: { bunchesPerProcona: 40, stemsPerBunch: 10 },
                    55: { bunchesPerProcona: 40, stemsPerBunch: 10 },
                    50: { bunchesPerProcona: 40, stemsPerBunch: 10 },
                    40: { bunchesPerProcona: 40, stemsPerBunch: 10 }
                }
            },
            WS10: {
                bunchesPerProcona: 40,
                stemsPerBunch: 10
            }
        },
        EUPATORIUM: {
            TJ: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
            // ==== NUEVA SECCIÓN NF (igual que TJ) ====
            NF: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
            REG: {
                lengths: {
                    70: { bunchesPerProcona: 10, stemsPerBunch: 10 },
                    60: { bunchesPerProcona: 10, stemsPerBunch: 10 },
                    55: { bunchesPerProcona: 0 },
                    50: { bunchesPerProcona: 0 },
                    40: { bunchesPerProcona: 0 }
                }
            },
            WS10: {
                bunchesPerProcona: 10,
                stemsPerBunch: 10
            }
        },
        PAPYRUS: {
            TJ: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
            // ==== NUEVA SECCIÓN NF (igual que TJ) ====
            NF: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
            REG: {
                lengths: {
                    70: { bunchesPerProcona: 8, stemsPerBunch: 20 },
                    60: { bunchesPerProcona: 0 },
                    55: { bunchesPerProcona: 0 },
                    50: { bunchesPerProcona: 0 },
                    40: { bunchesPerProcona: 0 }
                }
            },
            WS10: {
                bunchesPerProcona: 20,
                stemsPerBunch: 10
            }
        },
        ORIGANUM: {
            TJ: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
            // ==== NUEVA SECCIÓN NF (igual que TJ) ====
            NF: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
            REG: {
                lengths: {
                    70: { bunchesPerProcona: 10, stemsPerBunch: 25 },
                    60: { bunchesPerProcona: 10, stemsPerBunch: 20 },
                    55: { bunchesPerProcona: 0 },
                    50: { bunchesPerProcona: 0 },
                    40: { bunchesPerProcona: 0 }
                }
            },
            WS10: {
                bunchesPerProcona: 20,
                stemsPerBunch: 10
            }
        },
        MENTHA: {
            TJ: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
            // ==== NUEVA SECCIÓN NF (igual que TJ) ====
            NF: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
            REG: {
                lengths: {
                    70: { bunchesPerProcona: 8, stemsPerBunch: 20 },
                    60: { bunchesPerProcona: 8, stemsPerBunch: 25 },
                    55: { bunchesPerProcona: 8, stemsPerBunch: 25 },
                    50: { bunchesPerProcona: 4, stemsPerBunch: 25 },
                    40: { bunchesPerProcona: 0 }
                }
            },
            WS10: {
                bunchesPerProcona: 20,
                stemsPerBunch: 10
            }
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
        // Fusionar las configuraciones guardadas con las predeterminadas
        config = deepMerge(JSON.parse(JSON.stringify(defaultConfigs)), savedConfig);
    } else {
        config = JSON.parse(JSON.stringify(defaultConfigs));
    }

    // Guardar la configuración fusionada de nuevo en localStorage para asegurar su integridad
    localStorage.setItem('config', JSON.stringify(config));

    function openConfigModal() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'configModalLabel');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="configModalLabel">Configuración</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <form id="configForm">
                            <div class="mb-3">
                                <label for="configCategory" class="form-label">Categoría</label>
                                <select class="form-select" id="configCategory" name="configCategory">
                                    <option value="" disabled selected>Seleccione una categoría</option>
                                    ${Object.keys(defaultConfigs).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                                </select>
                            </div>
                            <div id="categoryConfig">
                                <!-- Configuración específica de la categoría seleccionada -->
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" id="saveConfigBtn" disabled>Guardar cambios</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        const saveConfigBtn = modal.querySelector('#saveConfigBtn');

        // Manejar el cambio de categoría para cargar su configuración
        modal.querySelector('#configCategory').addEventListener('change', function() {
            const selectedCategory = this.value;
            const categoryConfigDiv = modal.querySelector('#categoryConfig');
            // Generar el formulario específico para la categoría
            categoryConfigDiv.innerHTML = generateSpecificConfigForm(selectedCategory);
            saveConfigBtn.disabled = !selectedCategory;
        });

        // Función para generar el formulario específico para una categoría
        function generateSpecificConfigForm(category) {
            if (!config[category]) return '<p>No hay configuración disponible para esta categoría.</p>';

            let formHtml = '';

            // Se agrega NF al array de tipos
            ['TJ', 'REG', 'WS10', 'NF'].forEach(tipo => {
                const tipoConfig = config[category][tipo] || {};

                formHtml += `<h5>${tipo}</h5>`;

                if (tipo !== 'REG') {
                    formHtml += `
                        <div class="mb-3">
                            <label>Bunches/Procona:</label>
                            <input type="number" class="form-control" name="${category}_${tipo}_bunchesPerProcona" value="${tipoConfig.bunchesPerProcona !== undefined ? tipoConfig.bunchesPerProcona : 0}">
                        </div>
                        <div class="mb-3">
                            <label>Stems/Bunch:</label>
                            <input type="number" class="form-control" name="${category}_${tipo}_stemsPerBunch" value="${tipoConfig.stemsPerBunch !== undefined ? tipoConfig.stemsPerBunch : 0}">
                        </div>
                    `;
                } else {
                    // Para REG
                    formHtml += `
                        <div class="mb-3">
                            <label>Stems/Bunch (Predeterminado):</label>
                            <input type="number" class="form-control" name="${category}_REG_stemsPerBunch_default" value="${tipoConfig.stemsPerBunch !== undefined ? tipoConfig.stemsPerBunch : 0}">
                        </div>
                    `;
                    formHtml += '<h6>Longitudes:</h6>';
                    const lengths = tipoConfig.lengths || {};
                    // Utilizar las longitudes de defaultConfigs para asegurar todas las longitudes
                    Object.keys(defaultConfigs[category].REG.lengths).forEach(long => {
                        const longConfig = lengths[long] || { bunchesPerProcona: 0, stemsPerBunch: '' };
                        formHtml += `
                            <div class="mb-3">
                                <label>Bunches/Procona para ${long} cm:</label>
                                <input type="number" class="form-control" name="${category}_REG_bunchesPerProcona_${long}" value="${longConfig.bunchesPerProcona !== undefined ? longConfig.bunchesPerProcona : 0}">
                            </div>
                            <div class="mb-3">
                                <label>Stems/Bunch para ${long} cm:</label>
                                <input type="number" class="form-control" name="${category}_REG_stemsPerBunch_${long}" value="${longConfig.stemsPerBunch !== undefined ? longConfig.stemsPerBunch : ''}">
                            </div>
                        `;
                    });
                }
            });

            return formHtml;
        }

        // Manejar el botón de guardar configuración
        modal.querySelector('#saveConfigBtn').addEventListener('click', () => {
            const form = modal.querySelector('#configForm');
            const formData = new FormData(form);

            const selectedCategory = formData.get('configCategory');
            if (!selectedCategory) {
                showAlert('Categoría no seleccionada.', 'danger');
                return;
            }

            // Se agrega NF al array de tipos
            ['TJ', 'REG', 'WS10', 'NF'].forEach(tipo => {
                if (!config[selectedCategory][tipo]) {
                    config[selectedCategory][tipo] = {};
                }

                if (tipo !== 'REG') {
                    const bunchesKey = `${selectedCategory}_${tipo}_bunchesPerProcona`;
                    const stemsKey = `${selectedCategory}_${tipo}_stemsPerBunch`;

                    const bunchesValue = parseInt(formData.get(bunchesKey));
                    const stemsValue = parseInt(formData.get(stemsKey));

                    config[selectedCategory][tipo].bunchesPerProcona = isNaN(bunchesValue) ? 0 : bunchesValue;
                    config[selectedCategory][tipo].stemsPerBunch = isNaN(stemsValue) ? 0 : stemsValue;
                } else {
                    // REG
                    const stemsPerBunchDefaultKey = `${selectedCategory}_REG_stemsPerBunch_default`;
                    const stemsPerBunchDefaultValue = parseInt(formData.get(stemsPerBunchDefaultKey));
                    config[selectedCategory][tipo].stemsPerBunch = isNaN(stemsPerBunchDefaultValue) ? 0 : stemsPerBunchDefaultValue;

                    if (!config[selectedCategory][tipo].lengths) {
                        config[selectedCategory][tipo].lengths = {};
                    }
                    Object.keys(defaultConfigs[selectedCategory].REG.lengths).forEach(long => {
                        const bunchesKey = `${selectedCategory}_REG_bunchesPerProcona_${long}`;
                        const stemsPerBunchKey = `${selectedCategory}_REG_stemsPerBunch_${long}`;

                        const bunchesValue = parseInt(formData.get(bunchesKey));
                        const stemsPerBunchValue = parseInt(formData.get(stemsPerBunchKey));

                        if (!config[selectedCategory][tipo].lengths[long]) {
                            config[selectedCategory][tipo].lengths[long] = {};
                        }

                        config[selectedCategory][tipo].lengths[long].bunchesPerProcona = isNaN(bunchesValue) ? 0 : bunchesValue;

                        if (!isNaN(stemsPerBunchValue)) {
                            config[selectedCategory][tipo].lengths[long].stemsPerBunch = stemsPerBunchValue;
                        } else {
                            delete config[selectedCategory][tipo].lengths[long].stemsPerBunch;
                        }
                    });
                }
            });

            // Actualizar la configuración en localStorage
            localStorage.setItem('config', JSON.stringify(config));

            // Asegurar que estas funciones sean accesibles globalmente
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

            bootstrapModal.hide();
            modal.remove();
            showAlert('Configuración guardada correctamente.');
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    // Función para mostrar alertas (similar a la de main.js)
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

        // Cierra la alerta tras 3 segundos (puedes cambiar este tiempo)
        setTimeout(() => {
            alert.classList.remove('show');
            alert.classList.add('hide');
            setTimeout(() => alert.remove(), 500);
        }, 3000);
    }

    // Event listener para el botón de configuración
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        configBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Ejemplo de control de permisos
            if (window.currentUser && window.currentUser.role === 'admin') { 
                openConfigModal();
            } else {
                showAlert('No tienes permisos para acceder a la configuración.', 'danger');
            }
        });
    }
});
