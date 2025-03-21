document.addEventListener('DOMContentLoaded', () => {
    //Default settings for all categories
    const defaultConfigs = {
        VERONICA: {
            TJ: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
            NF: {
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
            },
            SU30: {
                bunchesPerProcona: 8,
                stemsPerBunch: 30
            }
        },
        HYPERICUM: {
            TJ: {
                bunchesPerProcona: 40,
                stemsPerBunch: 7
            },
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
            },
            SU30: {
                bunchesPerProcona: 8,
                stemsPerBunch: 30
            }
        },
        EUPATORIUM: {
            TJ: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
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
            },
            SU30: {
                bunchesPerProcona: 8,
                stemsPerBunch: 30
            }
        },
        PAPYRUS: {
            TJ: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
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
            },
            SU30: {
                bunchesPerProcona: 8,
                stemsPerBunch: 30
            }
        },
        ORIGANUM: {
            TJ: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
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
            },
            SU30: {
                bunchesPerProcona: 8,
                stemsPerBunch: 30
            }
        },
        MENTHA: {
            TJ: {
                bunchesPerProcona: 20,
                stemsPerBunch: 7
            },
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
            },
            SU30: {
                bunchesPerProcona: 8,
                stemsPerBunch: 30
            }
        }
    };

    // Function to perform a deep merge of objects
    function deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                // If the property is an object and not an array, merge recursively
                if (
                    source[key] &&
                    typeof source[key] === 'object' &&
                    !Array.isArray(source[key])
                ) {
                    // If the target does not have the key or is not an object, initialize it as an empty object
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    // Recursively merge the nested object
                    deepMerge(target[key], source[key]);
                } else {
                    // Otherwise, directly assign the value from the source to the target
                    target[key] = source[key];
                }
            }
        }
        return target;
    }


    //Load configuration from localStorage if it exists
    const savedConfig = JSON.parse(localStorage.getItem('config'));
    let config = {};

    if (savedConfig) {
        // Merge saved configurations with default settings
        config = deepMerge(JSON.parse(JSON.stringify(defaultConfigs)), savedConfig);
    } else {
        config = JSON.parse(JSON.stringify(defaultConfigs));
    }

    // Save the merged configuration back to localStorage to ensure its integrity
    localStorage.setItem('config', JSON.stringify(config));

    // ===================================
    // Function to open the settings modal
    // ===================================
    function openConfigModal() {
        // Dynamically create the modal with modern classes
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'configModalLabel');
        modal.setAttribute('aria-hidden', 'true');

        // Modal structure with an additional class "config-modal-content" for a modern style
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-scrollable modal-lg config-modal-dialog">
                <div class="modal-content config-modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title" id="configModalLabel">
                            <i class="fas fa-cog me-2"></i> Settings
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <form id="configForm">
                            <div class="mb-3">
                                <label for="configCategory" class="form-label fw-bold">Category</label>
                                <select class="form-select" id="configCategory" name="configCategory">
                                    <option value="" disabled selected>Select a Category</option>
                                    ${Object.keys(defaultConfigs).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                                </select>
                            </div>
                            <div id="categoryConfig" class="p-2 rounded" style="background-color: #f9f9f9;">
                                <!-- Configuración específica de la categoría seleccionada -->
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer border-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" id="saveConfigBtn" disabled>
                            <i class="fas fa-save me-1"></i> Guardar cambios
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        const saveConfigBtn = modal.querySelector('#saveConfigBtn');

        // Handle category change to load its configuration
        modal.querySelector('#configCategory').addEventListener('change', function() {
            const selectedCategory = this.value;
            const categoryConfigDiv = modal.querySelector('#categoryConfig');
            // Generate the specific form for the category
            categoryConfigDiv.innerHTML = generateSpecificConfigForm(selectedCategory);
            saveConfigBtn.disabled = !selectedCategory;
        });

        // Generate the specific form for the selected category
        function generateSpecificConfigForm(category) {
            if (!config[category]) {
                return '<p>No hay configuración disponible para esta categoría.</p>';
            }

            let formHtml = '';

            // // Include field types
            ['TJ', 'REG', 'WS10', 'NF', 'SU30'].forEach(tipo => {
                const tipoConfig = config[category][tipo] || {};
                formHtml += `<hr class="my-3"><h5 class="fw-bold">${tipo}</h5>`;
                // For REG
                if (tipo !== 'REG') {
                    formHtml += `
                        <div class="mb-3">
                            <label class="form-label">Bunches/Procona:</label>
                            <input type="number" class="form-control" 
                                   name="${category}_${tipo}_bunchesPerProcona" 
                                   value="${tipoConfig.bunchesPerProcona ?? 0}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Stems/Bunch:</label>
                            <input type="number" class="form-control" 
                                   name="${category}_${tipo}_stemsPerBunch" 
                                   value="${tipoConfig.stemsPerBunch ?? 0}">
                        </div>
                    `;
                } else {
                    formHtml += `
                        <div class="mb-3">
                            <label class="form-label">Stems/Bunch (Predeterminado):</label>
                            <input type="number" class="form-control"
                                   name="${category}_REG_stemsPerBunch_default"
                                   value="${tipoConfig.stemsPerBunch ?? 0}">
                        </div>
                        <h6 class="fw-semibold">Longitudes:</h6>
                    `;
                    const lengths = tipoConfig.lengths || {};
                    Object.keys(defaultConfigs[category].REG.lengths).forEach(long => {
                        const longConfig = lengths[long] || { bunchesPerProcona: 0, stemsPerBunch: '' };
                        formHtml += `
                            <div class="row mb-2">
                                <div class="col-6">
                                    <label class="form-label">Bunches/Procona para ${long} cm:</label>
                                    <input type="number" class="form-control"
                                           name="${category}_REG_bunchesPerProcona_${long}"
                                           value="${longConfig.bunchesPerProcona ?? 0}">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Stems/Bunch para ${long} cm:</label>
                                    <input type="number" class="form-control"
                                           name="${category}_REG_stemsPerBunch_${long}"
                                           value="${longConfig.stemsPerBunch ?? ''}">
                                </div>
                            </div>
                        `;
                    });
                }
            });

            return formHtml;
        }

        // Handle the save configuration button
        modal.querySelector('#saveConfigBtn').addEventListener('click', () => {
            const form = modal.querySelector('#configForm');
            const formData = new FormData(form);
            const selectedCategory = formData.get('configCategory');

            if (!selectedCategory) {
                showAlert('Categoría no seleccionada.', 'danger');
                return;
            }

            // // Update configuration for each type
            ['TJ', 'REG', 'WS10', 'NF', 'SU30'].forEach(tipo => {
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
                    // For REG
                    const stemsPerBunchDefaultKey = `${selectedCategory}_REG_stemsPerBunch_default`;
                    const stemsPerBunchDefaultValue = parseInt(formData.get(stemsPerBunchDefaultKey));
                    config[selectedCategory][tipo].stemsPerBunch = isNaN(stemsPerBunchDefaultValue) ? 0 : stemsPerBunchDefaultValue;

                    if (!config[selectedCategory][tipo].lengths) {
                        config[selectedCategory][tipo].lengths = {};
                    }
                    Object.keys(defaultConfigs[selectedCategory].REG.lengths).forEach(long => {
                        const bunchesKey = `${selectedCategory}_REG_bunchesPerProcona_${long}`;
                        const stemsPerBunchKey = `${selectedCategory}_REG_stemsPerBunch_${long}`;

                        const bunchesVal = parseInt(formData.get(bunchesKey));
                        const stemsVal = parseInt(formData.get(stemsPerBunchKey));

                        if (!config[selectedCategory][tipo].lengths[long]) {
                            config[selectedCategory][tipo].lengths[long] = {};
                        }

                        config[selectedCategory][tipo].lengths[long].bunchesPerProcona = isNaN(bunchesVal) ? 0 : bunchesVal;

                        if (!isNaN(stemsVal)) {
                            config[selectedCategory][tipo].lengths[long].stemsPerBunch = stemsVal;
                        } else {
                            delete config[selectedCategory][tipo].lengths[long].stemsPerBunch;
                        }
                    });
                }
            });

            // Update the configuration in localStorage
            localStorage.setItem('config', JSON.stringify(config));

            // If there are functions to recalculate/save data, call them here
            if (typeof window.saveTableData === 'function') {
                window.saveTableData();
            }
            if (typeof window.updateAllCalculations === 'function') {
                window.updateAllCalculations();
            }

            bootstrapModal.hide();
            modal.remove();
            showAlert('Configuración guardada correctamente.');
        });

        // Eliminar el modal del DOM al cerrarlo
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    // // Function to display alerts (similar to the one in main.js)
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

        // Auto-close after 3 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            alert.classList.add('hide');
            setTimeout(() => alert.remove(), 500);
        }, 3000);
    }

    // Event listener botón of configuration
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        configBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Justo admin can access
            if (window.currentUser && window.currentUser.role === 'admin') { 
                openConfigModal();
            } else {
                showAlert('No tienes permisos para acceder a la configuración.', 'danger');
            }
        });
    }
});
