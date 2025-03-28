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

    window.defaultConfigs = defaultConfigs;
    
    // Función para cargar la configuración desde Firebase
    async function loadConfigFromFirebase() {
        try {
            const response = await fetch('/api/config'); // Endpoint que retorna la configuración dinámica
            const data = await response.json();
            // Si no se retornan datos, se usa el fallback
            return Object.keys(data).length ? data : defaultConfigs;
        } catch (error) {
            console.error('Error al cargar configuración desde Firebase:', error);
            return defaultConfigs;
        }
    }

    // Cargar la configuración de forma global
    loadConfigFromFirebase().then(loadedConfig => {
        window.config = loadedConfig;
        config = loadedConfig;
    });

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
    async function openConfigModal() {
        // Cargar la configuración dinámica desde Firebase
        config = await loadConfigFromFirebase();
        window.config = config;
    
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'configModalLabel');
        modal.setAttribute('aria-hidden', 'true');
    
        // Estructura del modal con el botón "Crear Categoría"
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-scrollable modal-lg config-modal-dialog">
                <div class="modal-content config-modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title" id="configModalLabel">
                            <i class="fas fa-cog me-2"></i> Settings
                        </h5>
                        <button id="createCategoryBtn" class="btn btn-outline-primary me-2">Create Category</button>
                        <!-- Nuevo botón global para crear tipo de ramo -->
                        <button id="createNewBouquetTypeGlobalBtn" class="btn btn-outline-primary me-2">Create new bouquet type</button>
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
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="saveConfigBtn" disabled>
                            <i class="fas fa-save me-1"></i> Save changes
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
            
            // Generar el formulario específico para la categoría (incluye todos los tipos existentes)
            categoryConfigDiv.innerHTML = generateSpecificConfigForm(selectedCategory);
            
            
            
            // Agregar la sección de Varieties
            categoryConfigDiv.innerHTML += `
              <hr class="my-3">
              <h5 class="fw-bold">Varieties</h5>
              <div class="input-group mb-3">
                <input type="text" class="form-control" id="newVarietyInput" placeholder="Enter variety">
                <button class="btn btn-outline-secondary" type="button" id="addVarietyBtn">Add Variety</button>
              </div>
              <ul class="list-group" id="varietiesList"></ul>
            `;
          
            // Si ya existen variedades en la configuración, se cargan en la lista; de lo contrario, se inicializa a vacío.
            if (!config[selectedCategory].varieties) {
                config[selectedCategory].varieties = [];
            }
            updateVarietiesList(config[selectedCategory].varieties);
          
            // Evento para agregar nueva variedad
            categoryConfigDiv.querySelector('#addVarietyBtn').addEventListener('click', () => {
                const newVarietyInput = categoryConfigDiv.querySelector('#newVarietyInput');
                const newVariety = newVarietyInput.value.trim();
                if (newVariety && !config[selectedCategory].varieties.includes(newVariety)) {
                    config[selectedCategory].varieties.push(newVariety);
                    updateVarietiesList(config[selectedCategory].varieties);
                    newVarietyInput.value = '';
                }
            });
          
          
            // Función para actualizar la lista de variedades en la interfaz
            function updateVarietiesList(varietiesArray) {
                const varietiesListEl = categoryConfigDiv.querySelector('#varietiesList');
                varietiesListEl.innerHTML = '';
                varietiesArray.forEach((variety, index) => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    li.innerHTML = `<span>${variety}</span>`;
                    // Botón para eliminar la variedad
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'btn btn-sm btn-danger';
                    removeBtn.textContent = 'Delete';
                    removeBtn.addEventListener('click', () => {
                        config[selectedCategory].varieties.splice(index, 1);
                        updateVarietiesList(config[selectedCategory].varieties);
                    });
                    li.appendChild(removeBtn);
                    varietiesListEl.appendChild(li);
                });
            }
          
            // Habilitar el botón de guardar solo si se seleccionó una categoría
            saveConfigBtn.disabled = !selectedCategory;
        });
         
        // Función para generar el formulario específico para la categoría seleccionada
        function generateSpecificConfigForm(category) {
            if (!config[category]) {
                return '<p>No hay configuración disponible para esta categoría.</p>';
            }
            
            let formHtml = '';
        
            // Recorremos las claves de la categoría y omitimos las que no sean tipos (como "createdAt" o "updatedAt")
            Object.keys(config[category]).forEach(tipo => {
                if (tipo === 'varieties' || tipo === 'createdAt' || tipo === 'updatedAt') return;
                
                const tipoConfig = config[category][tipo];
                formHtml += `<hr class="my-3"><h5 class="fw-bold">${tipo}</h5>`;
                
                // Si es REG o si se marca como un nuevo tipo (con la propiedad newType)
                if (tipo === 'REG' || tipoConfig.newType) {
                    formHtml += `
                        <div class="mb-3">
                            <label class="form-label">Stems/Bunch (Predeterminado):</label>
                            <input type="number" class="form-control"
                                   name="${category}_${tipo}_stemsPerBunch_default"
                                   value="${tipoConfig.stemsPerBunch ?? ''}">
                        </div>
                        <h6 class="fw-semibold">Longitudes:</h6>
                    `;
                    const predefinedLengths = [70, 60, 55, 50, 40];
                    predefinedLengths.forEach(long => {
                        const longConfig = (tipoConfig.lengths && tipoConfig.lengths[long]) || { bunchesPerProcona: '', stemsPerBunch: '' };
                        formHtml += `
                            <div class="row mb-2">
                                <div class="col-6">
                                    <label class="form-label">Bunches/Procona para ${long} cm:</label>
                                    <input type="number" class="form-control"
                                           name="${category}_${tipo}_bunchesPerProcona_${long}"
                                           value="${longConfig.bunchesPerProcona ?? ''}">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Stems/Bunch para ${long} cm:</label>
                                    <input type="number" class="form-control"
                                           name="${category}_${tipo}_stemsPerBunch_${long}"
                                           value="${longConfig.stemsPerBunch ?? ''}">
                                </div>
                            </div>
                        `;
                    });
                } else {
                    // Para tipos existentes sin estructura completa, se muestran únicamente los campos que ya existen
                    if (tipoConfig.bunchesPerProcona !== undefined) {
                        formHtml += `
                            <div class="mb-3">
                                <label class="form-label">Bunches/Procona:</label>
                                <input type="number" class="form-control" 
                                       name="${category}_${tipo}_bunchesPerProcona"
                                       value="${tipoConfig.bunchesPerProcona}">
                            </div>
                        `;
                    }
                    if (tipoConfig.stemsPerBunch !== undefined) {
                        formHtml += `
                            <div class="mb-3">
                                <label class="form-label">Stems/Bunch:</label>
                                <input type="number" class="form-control" 
                                       name="${category}_${tipo}_stemsPerBunch"
                                       value="${tipoConfig.stemsPerBunch}">
                            </div>
                        `;
                    }
                }
            });
        
            // Este formulario NO incluirá el botón para crear un nuevo tipo aquí, ya que ese botón se moverá a la cabecera
            return formHtml;
        }
        

        function openGlobalCreateNewBouquetTypeModal() {
            const globalTypeModal = document.createElement('div');
            globalTypeModal.classList.add('modal', 'fade');
            globalTypeModal.setAttribute('tabindex', '-1');
            globalTypeModal.setAttribute('aria-labelledby', 'globalCreateNewTypeModalLabel');
            globalTypeModal.setAttribute('aria-hidden', 'true');
        
            globalTypeModal.innerHTML = `
              <div class="modal-dialog modal-dialog-scrollable modal-lg">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="globalCreateNewTypeModalLabel">Create new bouquet type</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                  </div>
                  <div class="modal-body">
                    <form id="globalCreateNewTypeForm">
                      <div class="mb-3">
                        <label for="globalNewTypeName" class="form-label">Name of the new type</label>
                        <input type="text" class="form-control" id="globalNewTypeName" name="globalNewTypeName" required>
                      </div>
                    </form>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" id="saveGlobalNewTypeBtn">Save type</button>
                  </div>
                </div>
              </div>
            `;
        
            document.body.appendChild(globalTypeModal);
            const globalBootstrapModal = new bootstrap.Modal(globalTypeModal);
            globalBootstrapModal.show();
        
            globalTypeModal.querySelector('#saveGlobalNewTypeBtn').addEventListener('click', () => {
                const form = globalTypeModal.querySelector('#globalCreateNewTypeForm');
                const formData = new FormData(form);
                const newTypeName = formData.get('globalNewTypeName').trim();
                if (!newTypeName) {
                    showAlert('El nombre del nuevo tipo es obligatorio', 'danger');
                    return;
                }
        
                // Definir la configuración por defecto para el nuevo tipo (similar a REG)
                const newTypeDefaultConfig = {
                    newType: true, // Para identificarlo en el renderizado
                    stemsPerBunch: 0, // Puedes definir un valor predeterminado o dejarlo en 0
                    lengths: {}
                };
                [70, 60, 55, 50, 40].forEach(long => {
                    newTypeDefaultConfig.lengths[long] = {
                        bunchesPerProcona: 0,
                        stemsPerBunch: 0
                    };
                });
        
                // Actualizar todas las categorías agregando el nuevo tipo
                Object.keys(config).forEach(category => {
                    // Ignoramos propiedades que no sean objetos (por ejemplo, si hubiera createdAt o updatedAt globales)
                    if (typeof config[category] !== 'object') return;
                    // Si el tipo ya existe en alguna categoría, aquí se podría decidir actualizarlo o ignorarlo
                    if (!config[category][newTypeName]) {
                        config[category][newTypeName] = JSON.parse(JSON.stringify(newTypeDefaultConfig));
                    }
                });
        
                // Enviar la configuración actualizada para cada categoría
                const updateRequests = Object.keys(config).map(category => {
                    if (typeof config[category] !== 'object') return Promise.resolve();
                    return fetch('/api/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            category: category,
                            configData: config[category]
                        })
                    });
                });
        
                Promise.all(updateRequests)
                    .then(responses => Promise.all(responses.map(r => r.json())))
                    .then(results => {
                        globalBootstrapModal.hide();
                        globalTypeModal.remove();
                        showAlert("New type created in all categories");
                        // Opcional: refrescar la interfaz si el modal de configuración principal se encuentra abierto
                    })
                    .catch(error => {
                        console.error("Error al actualizar globalmente", error);
                        showAlert("Error al actualizar globalmente", "danger");
                    });
            });
        
            globalTypeModal.addEventListener('hidden.bs.modal', () => {
                globalTypeModal.remove();
            });
        }
        
        
        

        // Manejador del botón "Crear Categoría"
        modal.querySelector('#createCategoryBtn').addEventListener('click', () => {
            openCreateCategoryModal();
        });
        
        const createNewBouquetTypeGlobalBtn = document.getElementById('createNewBouquetTypeGlobalBtn');
        if (createNewBouquetTypeGlobalBtn) {
            createNewBouquetTypeGlobalBtn.addEventListener('click', () => {
                openGlobalCreateNewBouquetTypeModal();
            });
        }


        // Guardar cambios: se actualiza el objeto config y se envía al servidor
        saveConfigBtn.addEventListener('click', () => {
            const form = modal.querySelector('#configForm');
            const formData = new FormData(form);
            const selectedCategory = formData.get('configCategory');
        
            if (!selectedCategory) {
                showAlert('Categoría no seleccionada.', 'danger');
                return;
            }
        
            // Iterar sobre las propiedades de la categoría, ignorando campos internos
            Object.keys(config[selectedCategory]).forEach(tipo => {
                if (['varieties', 'createdAt', 'updatedAt'].includes(tipo)) return;
                const tipoConfig = config[selectedCategory][tipo] || {};
        
                // Si es REG o un nuevo tipo (marcado con newType) se actualiza con la estructura completa
                if (tipo === 'REG' || tipoConfig.newType) {
                    const stemsPerBunchDefaultKey = `${selectedCategory}_${tipo}_stemsPerBunch_default`;
                    const stemsPerBunchDefaultValue = parseInt(formData.get(stemsPerBunchDefaultKey));
                    config[selectedCategory][tipo].stemsPerBunch = isNaN(stemsPerBunchDefaultValue) ? 0 : stemsPerBunchDefaultValue;
        
                    // Aseguramos que exista el objeto de longitudes
                    if (!config[selectedCategory][tipo].lengths) {
                        config[selectedCategory][tipo].lengths = {};
                    }
        
                    [70, 60, 55, 50, 40].forEach(long => {
                        const bunchesKey = `${selectedCategory}_${tipo}_bunchesPerProcona_${long}`;
                        const stemsKey = `${selectedCategory}_${tipo}_stemsPerBunch_${long}`;
                        const bunchesVal = parseInt(formData.get(bunchesKey));
                        const stemsVal = parseInt(formData.get(stemsKey));
                        config[selectedCategory][tipo].lengths[long] = {
                            bunchesPerProcona: isNaN(bunchesVal) ? 0 : bunchesVal,
                            stemsPerBunch: isNaN(stemsVal) ? 0 : stemsVal
                        };
                    });
                } else {
                    // Para los tipos que tienen estructura básica, se actualizan únicamente los campos existentes
                    const bunchesKey = `${selectedCategory}_${tipo}_bunchesPerProcona`;
                    const stemsKey = `${selectedCategory}_${tipo}_stemsPerBunch`;
                    const bunchesValue = parseInt(formData.get(bunchesKey));
                    const stemsValue = parseInt(formData.get(stemsKey));
                    config[selectedCategory][tipo].bunchesPerProcona = isNaN(bunchesValue) ? 0 : bunchesValue;
                    config[selectedCategory][tipo].stemsPerBunch = isNaN(stemsValue) ? 0 : stemsValue;
                }
            });
        
            // Actualizar la lista de varieties si existe
            const varietiesListEl = modal.querySelector('#varietiesList');
            if (varietiesListEl) {
                const varietyItems = Array.from(varietiesListEl.children);
                config[selectedCategory].varieties = varietyItems.map(li => li.querySelector('span').textContent.trim());
            }
        
            // Enviar la configuración actualizada de la categoría al servidor
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
                <h5 class="modal-title" id="createCategoryModalLabel">Create New Category</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="createCategoryForm">
                  <div class="mb-3">
                    <label for="newCategoryName" class="form-label">Name category</label>
                    <input type="text" class="form-control" id="newCategoryName" required>
                  </div>
                  <div id="categoryConfig" class="p-2 rounded" style="background-color: #f9f9f9;">
                    <!-- Aquí se generarán los campos para cada tipo, pero ahora se incluirán todos los tipos existentes -->
                    ${generateEmptyConfigFormForNewCategory()}
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="saveNewCategoryBtn">Create category</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(createModal);
        const newBootstrapModal = new bootstrap.Modal(createModal);
        newBootstrapModal.show();
    
        // Manejador del botón "Crear categoría"
        createModal.querySelector('#saveNewCategoryBtn').addEventListener('click', () => {
            const form = createModal.querySelector('#createCategoryForm');
            const newCategoryName = form.querySelector('#newCategoryName').value.trim();
            if (!newCategoryName) {
                showAlert('El nombre de la categoría es obligatorio', 'danger');
                return;
            }
    
            // Construir la configuración de la nueva categoría:
            // Se toma como referencia los tipos de una categoría existente (si hay alguna)
            const referenceCategoryKey = Object.keys(config).find(key => typeof config[key] === 'object');
            let bouquetTypes = [];
            if (referenceCategoryKey) {
                // Se toman las claves existentes filtrando campos internos (por ejemplo, varieties, createdAt, updatedAt)
                bouquetTypes = Object.keys(config[referenceCategoryKey]).filter(tipo => 
                    !['varieties', 'createdAt', 'updatedAt'].includes(tipo)
                );
            } else {
                // Si no existe ninguna categoría, se usan unos valores por defecto
                bouquetTypes = ['TJ', 'NF', 'REG', 'WS10', 'SU30'];
            }
    
            // Ahora, para cada tipo existente, se crea la configuración por defecto
            const newCategoryConfig = {};
            bouquetTypes.forEach(tipo => {
                // Si el tipo es REG o se detecta que es un nuevo tipo (por ejemplo, tiene la propiedad newType) se crea la estructura completa
                if (tipo === 'REG' || (referenceCategoryKey && config[referenceCategoryKey][tipo] && config[referenceCategoryKey][tipo].newType)) {
                    newCategoryConfig[tipo] = {
                        // Si es un nuevo tipo, marcamos la propiedad para que se renderice completo
                        newType: tipo !== 'REG' ? true : undefined,
                        stemsPerBunch: 0,
                        lengths: {}
                    };
                    [70, 60, 55, 50, 40].forEach(long => {
                        newCategoryConfig[tipo].lengths[long] = {
                            bunchesPerProcona: 0,
                            stemsPerBunch: 0
                        };
                    });
                } else {
                    // Para tipos básicos (predefinidos que no tengan estructura completa)
                    newCategoryConfig[tipo] = {
                        bunchesPerProcona: 0,
                        stemsPerBunch: 0
                    };
                }
            });
    
            // Enviar la nueva categoría al servidor usando el formato que espera el endpoint
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
                // Actualizar el select de categorías en el modal principal
                const configCategorySelect = document.querySelector('#configCategory');
                const newOption = document.createElement('option');
                newOption.value = newCategoryName;
                newOption.text = newCategoryName;
                configCategorySelect.appendChild(newOption);
                // Actualiza la variable global config (usando, por ejemplo, el nombre en mayúsculas)
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
    
    // Función para generar el formulario vacío para la nueva categoría
    // Aquí se recorren los tipos globales (según los obtenidos de una categoría de referencia)
    function generateEmptyConfigFormForNewCategory() {
        const referenceCategoryKey = Object.keys(config).find(key => typeof config[key] === 'object');
        let bouquetTypes = [];
        if (referenceCategoryKey) {
            bouquetTypes = Object.keys(config[referenceCategoryKey]).filter(tipo =>
                !['varieties', 'createdAt', 'updatedAt'].includes(tipo)
            );
        } else {
            bouquetTypes = ['TJ', 'NF', 'REG', 'WS10', 'SU30'];
        }
    
        let formHtml = '';
        bouquetTypes.forEach(tipo => {
            if (tipo === 'REG' || (referenceCategoryKey && config[referenceCategoryKey][tipo] && config[referenceCategoryKey][tipo].newType)) {
                formHtml += `<hr class="my-3"><h5 class="fw-bold">${tipo}</h5>`;
                formHtml += `
                  <div class="mb-3">
                    <label class="form-label">Stems/Bunch (Predeterminado):</label>
                    <input type="number" class="form-control" name="${tipo}_stemsPerBunch_default" value="0">
                  </div>
                  <h6 class="fw-semibold">Longitudes:</h6>
                `;
                [70, 60, 55, 50, 40].forEach(long => {
                    formHtml += `
                      <div class="row mb-2">
                          <div class="col-6">
                              <label class="form-label">Bunches/Procona para ${long} cm:</label>
                              <input type="number" class="form-control" name="${tipo}_bunchesPerProcona_${long}" value="0">
                          </div>
                          <div class="col-6">
                              <label class="form-label">Stems/Bunch para ${long} cm:</label>
                              <input type="number" class="form-control" name="${tipo}_stemsPerBunch_${long}" value="0">
                          </div>
                      </div>
                    `;
                });
            } else {
                formHtml += `<hr class="my-3"><h5 class="fw-bold">${tipo}</h5>`;
                formHtml += `
                  <div class="mb-3">
                    <label class="form-label">Bunches/Procona:</label>
                    <input type="number" class="form-control" name="${tipo}_bunchesPerProcona" value="0">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Stems/Bunch:</label>
                    <input type="number" class="form-control" name="${tipo}_stemsPerBunch" value="0">
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
