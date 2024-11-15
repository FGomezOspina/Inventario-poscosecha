// config.js

document.addEventListener('DOMContentLoaded', () => {
    const defaultConfigs = {
        VERONICA: {
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
        },
        HYPERICUM: {
            TJ: {
                bunchesPerProcona: 0,
                stemsPerBunch: 0
            },
            REG: {
                stemsPerBunch: 0,
                lengths: {
                    70: { bunchesPerProcona: 0 },
                    60: { bunchesPerProcona: 0 },
                    55: { bunchesPerProcona: 0 },
                    50: { bunchesPerProcona: 0 },
                    40: { bunchesPerProcona: 0 }
                }
            },
            WS10: {
                bunchesPerProcona: 0,
                stemsPerBunch: 0
            }
        },
        ORIGANUM: {
            TJ: {
                bunchesPerProcona: 0,
                stemsPerBunch: 0
            },
            REG: {
                stemsPerBunch: 0,
                lengths: {
                    70: { bunchesPerProcona: 0 },
                    60: { bunchesPerProcona: 0 },
                    55: { bunchesPerProcona: 0 },
                    50: { bunchesPerProcona: 0 },
                    40: { bunchesPerProcona: 0 }
                }
            },
            WS10: {
                bunchesPerProcona: 0,
                stemsPerBunch: 0
            }
        },
        MENTHA: {
            TJ: {
                bunchesPerProcona: 0,
                stemsPerBunch: 0
            },
            REG: {
                stemsPerBunch: 0,
                lengths: {
                    70: { bunchesPerProcona: 0 },
                    60: { bunchesPerProcona: 0 },
                    55: { bunchesPerProcona: 0 },
                    50: { bunchesPerProcona: 0 },
                    40: { bunchesPerProcona: 0 }
                }
            },
            WS10: {
                bunchesPerProcona: 0,
                stemsPerBunch: 0
            }
        },
        EUPATORIUM: {
            TJ: {
                bunchesPerProcona: 0,
                stemsPerBunch: 0
            },
            REG: {
                stemsPerBunch: 0,
                lengths: {
                    70: { bunchesPerProcona: 0 },
                    60: { bunchesPerProcona: 0 },
                    55: { bunchesPerProcona: 0 },
                    50: { bunchesPerProcona: 0 },
                    40: { bunchesPerProcona: 0 }
                }
            },
            WS10: {
                bunchesPerProcona: 0,
                stemsPerBunch: 0
            }
        },
        PAPYRUS: {
            TJ: {
                bunchesPerProcona: 0,
                stemsPerBunch: 0
            },
            REG: {
                stemsPerBunch: 0,
                lengths: {
                    70: { bunchesPerProcona: 0 },
                    60: { bunchesPerProcona: 0 },
                    55: { bunchesPerProcona: 0 },
                    50: { bunchesPerProcona: 0 },
                    40: { bunchesPerProcona: 0 }
                }
            },
            WS10: {
                bunchesPerProcona: 0,
                stemsPerBunch: 0
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

    // **Guardar la configuración fusionada de nuevo en localStorage para asegurar su integridad**
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
                                <select class="form-select" id="configCategory">
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
                        <button type="button" class="btn btn-primary" id="saveConfigBtn">Guardar cambios</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Manejar el cambio de categoría para cargar su configuración
        modal.querySelector('#configCategory').addEventListener('change', function() {
            const selectedCategory = this.value;
            const categoryConfigDiv = modal.querySelector('#categoryConfig');
            // Generar el formulario específico para la categoría
            categoryConfigDiv.innerHTML = generateSpecificConfigForm(selectedCategory);
        });

        // Función para generar el formulario específico para una categoría
        function generateSpecificConfigForm(category) {
            if (!config[category]) return '<p>No hay configuración disponible para esta categoría.</p>';

            let formHtml = '';

            ['TJ', 'REG', 'WS10'].forEach(tipo => {
                const tipoConfig = config[category][tipo] || { bunchesPerProcona: 0, stemsPerBunch: 0 };
                formHtml += `
                    <h5>${tipo}</h5>
                    <div class="mb-3">
                        <label>Bunches/Procona:</label>
                        <input type="number" class="form-control" name="${category}_${tipo}_bunchesPerProcona" value="${tipoConfig.bunchesPerProcona !== undefined ? tipoConfig.bunchesPerProcona : 0}">
                    </div>
                    <div class="mb-3">
                        <label>Stems/Bunch:</label>
                        <input type="number" class="form-control" name="${category}_${tipo}_stemsPerBunch" value="${tipoConfig.stemsPerBunch !== undefined ? tipoConfig.stemsPerBunch : 0}">
                    </div>
                `;

                if (tipo === 'REG') {
                    formHtml += '<h6>Longitudes:</h6>';
                    const lengths = tipoConfig.lengths || {};
                    // Utilizar las longitudes de defaultConfigs para asegurar todas las longitudes
                    Object.keys(defaultConfigs[category].REG.lengths).forEach(long => {
                        const longConfig = lengths[long] || { bunchesPerProcona: 0 };
                        formHtml += `
                            <div class="mb-3">
                                <label>Bunches/Procona para ${long} cm:</label>
                                <input type="number" class="form-control" name="${category}_REG_bunchesPerProcona_${long}" value="${longConfig.bunchesPerProcona !== undefined ? longConfig.bunchesPerProcona : 0}">
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

            ['TJ', 'REG', 'WS10'].forEach(tipo => {
                const bunchesKey = `${selectedCategory}_${tipo}_bunchesPerProcona`;
                const stemsKey = `${selectedCategory}_${tipo}_stemsPerBunch`;

                const bunchesValue = parseInt(formData.get(bunchesKey));
                const stemsValue = parseInt(formData.get(stemsKey));

                config[selectedCategory][tipo].bunchesPerProcona = isNaN(bunchesValue) ? 0 : bunchesValue;
                config[selectedCategory][tipo].stemsPerBunch = isNaN(stemsValue) ? 0 : stemsValue;

                if (tipo === 'REG') {
                    Object.keys(config[selectedCategory][tipo].lengths).forEach(long => {
                        const longKey = `${selectedCategory}_REG_bunchesPerProcona_${long}`;
                        const longValue = parseInt(formData.get(longKey));
                        config[selectedCategory][tipo].lengths[long].bunchesPerProcona = isNaN(longValue) ? 0 : longValue;
                    });
                }
            });

            // Actualizar la configuración en localStorage
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

    // Event listener para el botón de configuración
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        configBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // **Asegúrate de que 'currentUser' esté definido globalmente y tenga una propiedad 'role'**
            if (window.currentUser && window.currentUser.role === 'admin') { 
                openConfigModal();
            } else {
                showAlert('No tienes permisos para acceder a la configuración.', 'danger');
            }
        });
    }
});
