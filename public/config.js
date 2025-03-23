document.addEventListener('DOMContentLoaded', () => {
    // Default settings for all categories
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
    

    // Function to perform a deep merge of objects (si llegas a necesitar fusionar configuraciones)
    function deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
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

    // Cargar configuración desde el servidor. Si falla, se usa la configuración por defecto.
    let config = {};
    fetch('/api/config')
        .then(response => response.json())
        .then(data => {
            // Si no se devuelve nada, usamos defaultConfigs
            config = Object.keys(data).length ? data : JSON.parse(JSON.stringify(defaultConfigs));
            window.config = config;
        })
        .catch(error => {
            console.error('Error al cargar configuración desde el servidor:', error);
            config = JSON.parse(JSON.stringify(defaultConfigs));
            window.config = config;
        });

    // ===================================
    // Function to open the settings modal
    // ===================================
    function openConfigModal() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'configModalLabel');
        modal.setAttribute('aria-hidden', 'true');

        // Modal structure with a "Crear Categoría" button
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-scrollable modal-lg config-modal-dialog">
                <div class="modal-content config-modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title" id="configModalLabel">
                            <i class="fas fa-cog me-2"></i> Settings
                        </h5>
                        <button id="createCategoryBtn" class="btn btn-outline-primary me-2">Crear Categoría</button>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <form id="configForm">
                            <div class="mb-3">
                                <label for="configCategory" class="form-label fw-bold">Category</label>
                                <select class="form-select" id="configCategory" name="configCategory">
                                    <option value="" disabled selected>Select a Category</option>
                                    ${Object.keys(config).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
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

        // Al cambiar de categoría, se carga su configuración en el formulario
        modal.querySelector('#configCategory').addEventListener('change', function() {
            const selectedCategory = this.value;
            const categoryConfigDiv = modal.querySelector('#categoryConfig');
            categoryConfigDiv.innerHTML = generateSpecificConfigForm(selectedCategory);
            saveConfigBtn.disabled = !selectedCategory;
        });

        // Función para generar el formulario específico para la categoría seleccionada
        function generateSpecificConfigForm(category) {
            // Verifica si la categoría existe
            if (!config[category]) {
                return '<p>No hay configuración disponible para esta categoría.</p>';
            }
        
            let formHtml = '';
        
            // Recorre los tipos y genera el formulario para cada uno
            ['TJ', 'REG', 'WS10', 'NF', 'SU30'].forEach(tipo => {
                const tipoConfig = config[category][tipo] || {}; // Si no existe, se usa un objeto vacío
                formHtml += `<hr class="my-3"><h5 class="fw-bold">${tipo}</h5>`;
        
                if (tipo !== 'REG') {
                    formHtml += `
                        <div class="mb-3">
                            <label class="form-label">Bunches/Procona:</label>
                            <input type="number" class="form-control" 
                                   name="${category}_${tipo}_bunchesPerProcona" 
                                   value="${tipoConfig.bunchesPerProcona ?? ''}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Stems/Bunch:</label>
                            <input type="number" class="form-control" 
                                   name="${category}_${tipo}_stemsPerBunch" 
                                   value="${tipoConfig.stemsPerBunch ?? ''}">
                        </div>
                    `;
                } else {
                    // Para 'REG', mostramos los campos de Stems/Bunch y Longitudes
                    formHtml += `
                        <div class="mb-3">
                            <label class="form-label">Stems/Bunch (Predeterminado):</label>
                            <input type="number" class="form-control"
                                   name="${category}_REG_stemsPerBunch_default"
                                   value="${tipoConfig.stemsPerBunch ?? ''}">
                        </div>
                        <h6 class="fw-semibold">Longitudes:</h6>
                    `;
        
                    // Si no hay longitudes en 'tipoConfig', las inicializamos con un objeto vacío
                    const lengths = tipoConfig.lengths || {};
        
                    // Iteramos sobre las longitudes predefinidas (70, 60, 55, 50, 40)
                    const predefinedLengths = [70, 60, 55, 50, 40];
                    predefinedLengths.forEach(long => {
                        const longConfig = lengths[long] || { bunchesPerProcona: '', stemsPerBunch: '' };
                        formHtml += `
                            <div class="row mb-2">
                                <div class="col-6">
                                    <label class="form-label">Bunches/Procona para ${long} cm:</label>
                                    <input type="number" class="form-control"
                                           name="${category}_REG_bunchesPerProcona_${long}"
                                           value="${longConfig.bunchesPerProcona ?? ''}">
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
        

        // Manejador del botón "Crear Categoría"
        modal.querySelector('#createCategoryBtn').addEventListener('click', () => {
            openCreateCategoryModal();
        });

        // Guardar cambios: se actualiza el objeto config y se envía al servidor
        saveConfigBtn.addEventListener('click', () => {
            const form = modal.querySelector('#configForm');
            const formData = new FormData(form);
            const selectedCategory = formData.get('configCategory');

            if (!selectedCategory) {
                showAlert('Categoría no seleccionada.', 'danger');
                return;
            }

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
                    const stemsPerBunchDefaultKey = `${selectedCategory}_REG_stemsPerBunch_default`;
                    const stemsPerBunchDefaultValue = parseInt(formData.get(stemsPerBunchDefaultKey));
                    config[selectedCategory][tipo].stemsPerBunch = isNaN(stemsPerBunchDefaultValue) ? 0 : stemsPerBunchDefaultValue;
                    if (!config[selectedCategory][tipo].lengths) {
                        config[selectedCategory][tipo].lengths = {};
                    }
                    // Usamos un objeto fallback en caso de que no exista la configuración por defecto para la categoría
                    const defaultLengths = (defaultConfigs[selectedCategory] &&
                                            defaultConfigs[selectedCategory].REG &&
                                            defaultConfigs[selectedCategory].REG.lengths)
                                        || {70: {}, 60: {}, 55: {}, 50: {}, 40: {}};
                    Object.keys(defaultLengths).forEach(long => {
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

            // Enviar la configuración actualizada al servidor
            fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: selectedCategory,
                    configData: config[selectedCategory]
                })
            })
            .then(response => response.json())
            .then(result => {
                bootstrapModal.hide();
                modal.remove();
                showAlert(result.message);
            })
            .catch(error => {
                console.error('Error al guardar la configuración:', error);
                showAlert('Error al guardar la configuración', 'danger');
            });
        });


        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    // Modal para crear una nueva categoría
    function openCreateCategoryModal() {
        const createModal = document.createElement('div');
        createModal.classList.add('modal', 'fade');
        createModal.setAttribute('tabindex', '-1');
        createModal.setAttribute('aria-labelledby', 'createCategoryModalLabel');
        createModal.setAttribute('aria-hidden', 'true');
      
        createModal.innerHTML = `
          <div class="modal-dialog modal-dialog-scrollable modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="createCategoryModalLabel">Crear Nueva Categoría</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body">
                <form id="createCategoryForm">
                  <div class="mb-3">
                    <label for="newCategoryName" class="form-label">Nombre de la Categoría</label>
                    <input type="text" class="form-control" id="newCategoryName" required>
                  </div>
                  <h6>Configurar Tipos (TJ, NF, REG, WS10, SU30):</h6>
                  <div id="categoryConfig" class="p-2 rounded" style="background-color: #f9f9f9;">
                    <!-- Aquí se generarán los campos para cada tipo -->
                    ${generateEmptyConfigForm()}
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                <button type="button" class="btn btn-primary" id="saveNewCategoryBtn">Crear Categoría</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(createModal);
        const newBootstrapModal = new bootstrap.Modal(createModal);
        newBootstrapModal.show();
      
        // Manejador del botón "Crear Categoría"
        createModal.querySelector('#saveNewCategoryBtn').addEventListener('click', () => {
            const form = createModal.querySelector('#createCategoryForm');
            const newCategoryName = form.querySelector('#newCategoryName').value.trim();
            if (!newCategoryName) {
            showAlert('El nombre de la categoría es obligatorio', 'danger');
            return;
            }
        
            // Extraer datos del formulario
            const formData = new FormData(form);
            const newCategoryConfig = {};
        
            // Procesar tipos que no son REG
            ['TJ', 'NF', 'WS10', 'SU30'].forEach(tipo => {
            newCategoryConfig[tipo] = {
                bunchesPerProcona: parseInt(formData.get(`${tipo}_bunchesPerProcona`)) || 0,
                stemsPerBunch: parseInt(formData.get(`${tipo}_stemsPerBunch`)) || 0
            };
            });
        
            // Procesar el tipo REG
            newCategoryConfig['REG'] = {
            stemsPerBunch: parseInt(formData.get('REG_stemsPerBunch_default')) || 0,
            lengths: {}
            };
            // Predefinir longitudes (se pueden ajustar según la necesidad)
            [70, 60, 55, 50, 40].forEach(long => {
            newCategoryConfig['REG'].lengths[long] = {
                bunchesPerProcona: parseInt(formData.get(`REG_bunchesPerProcona_${long}`)) || 0,
                stemsPerBunch: parseInt(formData.get(`REG_stemsPerBunch_${long}`)) || 0
            };
            });
        
            // Enviar la nueva categoría al servidor
            fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category: newCategoryName,
                configData: newCategoryConfig
            })
            })
            .then(res => res.json())
            .then(result => {
            showAlert(result.message);
            newBootstrapModal.hide();
            createModal.remove();
            // Actualiza el select de categorías en el modal principal
            const configCategorySelect = document.querySelector('#configCategory');
            const newOption = document.createElement('option');
            newOption.value = newCategoryName;
            newOption.text = newCategoryName;
            configCategorySelect.appendChild(newOption);
            // También actualiza la variable global config (se almacena en mayúsculas)
            config[newCategoryName.toUpperCase()] = newCategoryConfig;
            })
            .catch(error => {
            console.error('Error al crear la categoría:', error);
            showAlert('Error al crear la categoría', 'danger');
            });
        });
  
      
        createModal.addEventListener('hidden.bs.modal', () => {
          createModal.remove();
        });
    }
      
    function generateEmptyConfigForm() {
        // Genera el formulario vacío para la nueva categoría
        let formHtml = '';
        ['TJ', 'NF', 'REG', 'WS10', 'SU30'].forEach(tipo => {
          formHtml += `<hr class="my-3"><h5 class="fw-bold">${tipo}</h5>`;
          if (tipo !== 'REG') {
            formHtml += `
              <div class="mb-3">
                <label class="form-label">Bunches/Procona:</label>
                <input type="number" class="form-control" name="${tipo}_bunchesPerProcona" value="">
              </div>
              <div class="mb-3">
                <label class="form-label">Stems/Bunch:</label>
                <input type="number" class="form-control" name="${tipo}_stemsPerBunch" value="">
              </div>
            `;
          } else {
            formHtml += `
              <div class="mb-3">
                <label class="form-label">Stems/Bunch (Predeterminado):</label>
                <input type="number" class="form-control" name="REG_stemsPerBunch_default" value="">
              </div>
              <h6 class="fw-semibold">Longitudes:</h6>
              <div id="REG_lengths">
                <div class="row mb-2">
                  <div class="col-6">
                    <label class="form-label">Bunches/Procona para 70 cm:</label>
                    <input type="number" class="form-control" name="REG_bunchesPerProcona_70" value="">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Stems/Bunch para 70 cm:</label>
                    <input type="number" class="form-control" name="REG_stemsPerBunch_70" value="">
                  </div>
                </div>
                <div class="row mb-2">
                  <div class="col-6">
                    <label class="form-label">Bunches/Procona para 60 cm:</label>
                    <input type="number" class="form-control" name="REG_bunchesPerProcona_60" value="">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Stems/Bunch para 60 cm:</label>
                    <input type="number" class="form-control" name="REG_stemsPerBunch_60" value="">
                  </div>
                </div>
                <div class="row mb-2">
                  <div class="col-6">
                    <label class="form-label">Bunches/Procona para 55 cm:</label>
                    <input type="number" class="form-control" name="REG_bunchesPerProcona_55" value="">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Stems/Bunch para 55 cm:</label>
                    <input type="number" class="form-control" name="REG_stemsPerBunch_55" value="">
                  </div>
                </div>
                <div class="row mb-2">
                  <div class="col-6">
                    <label class="form-label">Bunches/Procona para 50 cm:</label>
                    <input type="number" class="form-control" name="REG_bunchesPerProcona_50" value="">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Stems/Bunch para 50 cm:</label>
                    <input type="number" class="form-control" name="REG_stemsPerBunch_50" value="">
                  </div>
                </div>
                <div class="row mb-2">
                  <div class="col-6">
                    <label class="form-label">Bunches/Procona para 40 cm:</label>
                    <input type="number" class="form-control" name="REG_bunchesPerProcona_40" value="">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Stems/Bunch para 40 cm:</label>
                    <input type="number" class="form-control" name="REG_stemsPerBunch_40" value="">
                  </div>
                </div>
              </div>
            `;
          }
        });
        return formHtml;
    }
      
      
      

    // Función para mostrar alertas
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

    // Event listener para el botón de configuración
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        configBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.currentUser && window.currentUser.role === 'admin') {
                openConfigModal();
            } else {
                showAlert('No tienes permisos para acceder a la configuración.', 'danger');
            }
        });
    }
});
