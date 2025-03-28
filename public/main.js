document.addEventListener('DOMContentLoaded', async () => {
    // ============================
    // Variables declaration
    // ============================
    const addGroupBtn = document.getElementById('addGroupBtn');
    const resetTableBtn = document.getElementById('resetTableBtn');
    const generateExcelBtn = document.getElementById('generateExcelBtn');
    const sendMailBtn = document.getElementById('sendMailBtn');
    const dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    const responsableInput = document.getElementById('responsable');
    const alertPlaceholder = document.getElementById('alertPlaceholder');

    // Main sections
    const inventarioSection = document.getElementById('inventarioSection');
    const empaqueSection = document.getElementById('empaqueSection');
    const packrateSection = document.getElementById('packrateSection');
    const empaqueMixSection = document.getElementById('empaqueMixSection');
    const packrateMixSection = document.getElementById('packrateMixSection');


    // Elements Sidebar
    const sidebarMenu = document.getElementById('sidebarMenu');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    // Buttons sidebar
    const inventarioBtn = document.getElementById('inventarioBtn');
    const empaqueBtn = document.getElementById('empaqueBtn');
    const packrateBtn = document.getElementById('packrateBtn');
    const addEmpaqueMixGroupBtn = document.getElementById("addEmpaqueMixGroupBtn");
    const resetEmpaqueMixBtn = document.getElementById("resetEmpaqueMixBtn");
    const empaqueMixBtn = document.getElementById('empaqueMixBtn');
    const packrateMixBtn = document.getElementById('packrateMixBtn');

    //Elements to the summaries tables
    const toggleSummaryBtn = document.getElementById('toggleSummaryBtn');
    const summaryTablesContainer = document.getElementById('summaryTables');
    const summaryByLength = document.getElementById('summaryByLength').getElementsByTagName('tbody')[0];
    const summaryByBouquetType = document.getElementById('summaryByBouquetType').getElementsByTagName('tbody')[0];
    const summaryByBatch = document.getElementById('summaryByBatch').getElementsByTagName('tbody')[0];

    const packrateCells = document.querySelectorAll('#packrateTable td[contenteditable="true"]');
    const regCells = document.querySelectorAll('#packrateTable td[data-category="REG"]');
    const ws10Cells = document.querySelectorAll('#packrateTable td[data-category="WS10"]');


    // Load config (if doesnt exists, use defaultConfig)
    let config = JSON.parse(localStorage.getItem('config')) || defaultConfigs;
    // Variety
    let varietyOptions = {};

    // Options
    const longDefaults = [];
    const hypericumLongs = ['', ''];
    const tjRegOptions = ["TJ", "REG", "WS10", "NF", "SU30"];

    // Global variable to store the PackRate configuration ("blocks") from Firebase
    let packRateData = [];
    let empaqueMixGroupIdCounter = 1;

    // fields to the main table
    const fields = ["TJ - REG", "Long", "P1", "P2", "P3", "P4", "R1", "R2", "R3", "R4", "Bunches/Procona", "Bunches Total", "Stems", "Notas"];

    try {
        // 1. Cargar la configuración completa desde Firebase
        const firebaseConfig = await loadVarietyOptions(); 
        // 2. Reemplazar config con la versión de Firebase
        config = firebaseConfig;  
        // 3. Guardar en localStorage para fallback
        localStorage.setItem('config', JSON.stringify(config));  
    
        // 4. Extraer las varieties de config si así lo deseas
        varietyOptions = {};
        Object.keys(config).forEach(category => {
          varietyOptions[category] = config[category].varieties || [];
        });
    
        // 5. Cargar o crear la tabla
        if (!localStorage.getItem('tableData')) {
          addGroup();
        } else {
          loadTableData();
        }
    
      } catch (err) {
        console.error("Error al cargar la configuración desde Firebase:", err);
    }
    


    // Función para cargar las varieties dinámicamente desde Firebase usando el endpoint de configuración
    async function loadVarietyOptions() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
            throw new Error('Error en la respuesta de /api/config');
            }
            const configData = await response.json();
            
            // configData se asume que es un objeto donde cada clave (por ej. "VERONICA", "HYPERICUM", etc.)
            // contiene toda la configuración: .varieties, .TJ, .REG, etc.
            // Retornamos configData tal cual, sin sobrescribir solo con .varieties
            return configData;
            
        } catch (error) {
            console.error('Error al cargar la configuración desde Firebase:', error);
            // Fallback: Devuelve un objeto vacío o un default en caso de error
            return {};
        }
    }

  

    // Cargar las varieties al iniciar la aplicación
    loadVarietyOptions().then(data => {
        varietyOptions = data;
    });

    // ============================
    // Logic to the sidebar
    // ============================

    // button to show inventory
    if (inventarioBtn) {
        inventarioBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Show inventory
            if (inventarioSection) inventarioSection.style.display = 'block';
            // Hide packing
            if (empaqueSection) empaqueSection.style.display = 'none';
            // Hide packrate
            if (packrateSection) packrateSection.style.display = 'none';
            packrateMixSection.style.display = 'none';
            empaqueMixSection.style.display = 'none';
        });
    }

    // Button to show packing
    if (empaqueBtn) {
        empaqueBtn.addEventListener('click', async (e) => {
            e.preventDefault();
    
            // if it doesnt load packRateData, load
            if (!packRateData || packRateData.length === 0) {
                await loadPackRateData();  // // This fills packRateData with information from Firebase
            }
    
            // Show the packing section
            if (empaqueSection) empaqueSection.style.display = 'block';
            if (inventarioSection) inventarioSection.style.display = 'none';
            if (packrateSection) packrateSection.style.display = 'none';
            packrateMixSection.style.display = 'none';
            empaqueMixSection.style.display = 'none';
        });
    }

    if (empaqueMixBtn) {
        empaqueMixBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Hide others section
          inventarioSection.style.display = 'none';
          empaqueSection.style.display = 'none';
          packrateSection.style.display = 'none';
          packrateMixSection.style.display = 'none';
          // Show Packing Mix
          empaqueMixSection.style.display = 'block';
        });
    }

    // Button to show pack rate
    if (packrateBtn) {
        packrateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // // Show the Pack Rate section and hide the others
            if (packrateSection) {
                packrateSection.style.display = 'block';
                // // Call the function to load data from Firebase
                loadPackRateData();
            }
            if (inventarioSection) inventarioSection.style.display = 'none';
            if (empaqueSection) empaqueSection.style.display = 'none';
            packrateMixSection.style.display = 'none';
            empaqueMixSection.style.display = 'none';
        });
    }

    if (packrateMixBtn) {
        packrateMixBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Hide others sections
          inventarioSection.style.display = 'none';
          empaqueSection.style.display = 'none';
          packrateSection.style.display = 'none';
          empaqueMixSection.style.display = 'none';
          // Show only for Pack Rate Mix
          packrateMixSection.style.display = 'block';
          generatePackRateMixTable();
        });
    }

    if (addEmpaqueMixGroupBtn) {
        addEmpaqueMixGroupBtn.addEventListener("click", (e) => {
          e.preventDefault();
          createEmpaqueMixGroupFixed();
        });
    }

    if (resetEmpaqueMixBtn) {
        resetEmpaqueMixBtn.addEventListener("click", (e) => {
          e.preventDefault();
          resetEmpaqueMixTable();
        });
    }
      
    

   /**
     * Displays an alert in the corresponding container.
     * If the containerSelector parameter is not specified, it dynamically detects
     * which section (Inventory, Packaging, or Pack Rate) is visible and uses its container.
     *
     * @param {string} message - The message to display.
     * @param {string} [type='success'] - The type of alert (success, danger, warning, info, etc.).
     * @param {string} [containerSelector] - (Optional) The selector of the container where the alert will be inserted.
    */

    function showAlert(message, type = 'success', containerSelector) {
        let container;
        
        // If a selector is passed, we use it.
        if (containerSelector) {
        container = document.querySelector(containerSelector);
        } else {
        // Dynamically detect which section is visible:
        // We use offsetParent to check if the element is visible (not display: none)
        const inventarioSection = document.querySelector('#inventarioSection');
        const empaqueSection = document.querySelector('#empaqueSection');
        const packrateSection = document.querySelector('#packrateSection');
    
        if (inventarioSection && inventarioSection.offsetParent !== null) {
            container = document.querySelector('#alertInventario');
        } else if (empaqueSection && empaqueSection.offsetParent !== null) {
            container = document.querySelector('#alertEmpaque');
        } else if (packrateSection && packrateSection.offsetParent !== null) {
            container = document.querySelector('#alertPackrate');
        } else {
            // By default, if no section is visible, we use the Inventory container
            container = document.querySelector('#alertInventario');
        }
        }
        
        if (!container) return;
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show mt-2" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
        
        container.appendChild(wrapper);
        
        setTimeout(() => {
        wrapper.remove();
        }, 3000);
    }


    // / Function to create the Variety select dropdown
    function createVarietySelect(selectedVariety = '') {
        const cell = document.createElement('td');
        cell.setAttribute('data-col', 'Variety');
        cell.setAttribute('tabindex', '0');

        const selectVariety = document.createElement('select');
        selectVariety.classList.add('form-select', 'form-select-sm');

        // Agregamos una opción vacía
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.text = 'Seleccione Variety';
        selectVariety.appendChild(emptyOption);

        // Verificamos si varietyOptions existe y tiene categorías
        if (varietyOptions && Object.keys(varietyOptions).length > 0) {
            // Recorremos cada categoría para crear un <optgroup>
            Object.keys(varietyOptions).forEach(category => {
                // Obtenemos el array de variedades. Si no existe, tomamos un array vacío.
                const varietiesArr = varietyOptions[category].varieties || [];

                // Creamos el optgroup
                const optGroup = document.createElement('optgroup');
                optGroup.label = category;

                // Iteramos sobre el array de variedades
                varietiesArr.forEach(variety => {
                    const option = document.createElement('option');
                    option.value = variety;
                    option.text = variety;
                    if (variety === selectedVariety) {
                        option.selected = true;
                    }
                    optGroup.appendChild(option);
                });

                selectVariety.appendChild(optGroup);
            });

            // Si el valor seleccionado no se encontró entre las opciones, se agrega como opción extra
            let found = false;
            Object.keys(varietyOptions).forEach(category => {
                const varietiesArr = varietyOptions[category].varieties || [];
                if (varietiesArr.includes(selectedVariety)) {
                    found = true;
                }
            });
            if (!found && selectedVariety) {
                const extraOption = document.createElement('option');
                extraOption.value = selectedVariety;
                extraOption.text = selectedVariety;
                extraOption.selected = true;
                selectVariety.appendChild(extraOption);
            }
        } else {
            // Si no hay datos en varietyOptions, agregamos la opción actual (si existe)
            if (selectedVariety) {
                const option = document.createElement('option');
                option.value = selectedVariety;
                option.text = selectedVariety;
                option.selected = true;
                selectVariety.appendChild(option);
            }
        }

        // Evento: al cambiar la selección, se actualiza la celda "Tipo" y se recalculan datos
        selectVariety.addEventListener('change', () => {
            // Función auxiliar para ubicar la fila desde el <select>
            const row = getRowFromCell(selectVariety);  
            const groupId = row.getAttribute('data-group-id');
            const newSelected = selectVariety.value;
            const selectedTipo = getTipoForVariety(newSelected);

            // Actualizamos la celda "Tipo"
            const tipoCell = row.querySelector('td[data-col="Tipo"]');
            if (tipoCell) {
                tipoCell.innerText = selectedTipo || '';
            }

            // Recalculamos para todas las filas del mismo grupo
            const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
            groupRows.forEach(r => updateCalculations(r));

            // Guardamos los datos, actualizamos tablas resumidas y el gran total
            saveTableData();
            populateSummaryTables();
            updateGrandTotal();
        });

        // Insertamos el <select> en la celda y retornamos la celda completa
        cell.appendChild(selectVariety);
        return cell;
    }



    // // Function to get the Type based on the selected Variety
    function getTipoForVariety(variety) {
        if (!variety) return '';
        
        // Pasamos la cadena a mayúsculas para la comparación
        const varietyU = variety.toUpperCase();
        
        for (const category in varietyOptions) {
            // 1) Si la categoría en mayúsculas coincide exactamente
            //    con el nombre de la variedad en mayúsculas, retornamos esa categoría
            if (category.toUpperCase() === varietyU) {
            return category;
            }

            // 2) Verificamos si en la propiedad 'varieties' de esta categoría
            //    existe un array y si en él se encuentra la variedad
            const catObj = varietyOptions[category];
            if (catObj && Array.isArray(catObj.varieties)) {
            // Usamos .some() únicamente si 'varieties' es realmente un array
            if (catObj.varieties.some(v => v.toUpperCase() === varietyU)) {
                return category;
            }
            }
        }

        // Si no se encontró en ninguna categoría, devolvemos la 'variety' tal cual
        return variety;
    }



    /**
     * Crea un select dinámico con las opciones de tipos de ramo disponibles para una categoría.
     * @param {string} selectedValue - Valor seleccionado (opcional).
     * @param {string} category - Categoría a la que pertenece la fila.
     * @returns {HTMLElement} El elemento <select> con las opciones dinámicas.
     */
    function createTJRegSelect(selectedValue = '', category) {
        // Se obtiene la categoría. Si no se pasa, se usa la primera disponible en config.
        const cat = category || Object.keys(config)[0];
        if (!cat || !config[cat]) {
        console.error('No se encontró una categoría válida en config');
        return document.createElement('select');
        }
        // Extraer las claves que representan tipos de ramo (excluyendo propiedades internas)
        let bouquetTypes = Object.keys(config[cat]).filter(key =>
        !['varieties', 'createdAt', 'updatedAt'].includes(key)
        );
    
        // Si no hay opciones definidas, se usa un fallback
        if (bouquetTypes.length === 0) {
        bouquetTypes = ['REG'];
        }
    
        // Determinar el valor a seleccionar: si no se pasa, se usa 'REG' si existe, o el primero
        const value = selectedValue || (bouquetTypes.includes('REG') ? 'REG' : bouquetTypes[0]);
        const select = document.createElement('select');
        select.classList.add('form-select', 'form-select-sm');
        select.style.minWidth = '100px';
    
        bouquetTypes.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.text = optionValue;
        if (optionValue === value) {
            option.selected = true;
        }
        select.appendChild(option);
        });
    
        select.addEventListener('change', () => {
        const row = getRowFromCell(select);
        updateCalculations(row);
        saveTableData();
        populateSummaryTables();
        updateGrandTotal();
        });
        return select;
    }
  
    // Function to get the row from a cell.
    function getRowFromCell(cell) {
        return cell.closest('tr');
    }

    // Function to create an editable cell.
    function createEditableCell(colName, value = '', rowspan = 1) {
        const cell = document.createElement('td');
        cell.contentEditable = true;
        cell.classList.add('editable');
        cell.setAttribute('data-col', colName);
        cell.setAttribute('tabindex', '0'); // Allow the cell to receive focus.
        if (rowspan > 1) {
            cell.setAttribute('rowspan', rowspan);
        }
        cell.innerText = value;

        // Specific validation for the "Batch" field.
        if (colName === 'Batch') {
            cell.addEventListener('input', () => {
                // Convert everything to uppercase.
                let text = cell.innerText.toUpperCase();
                // Remove characters that are not letters or numbers.
                text = text.replace(/[^A-Z0-9]/gi, '');
                // Limit to 3 characters
                if (text.length > 3) {
                    text = text.substring(0, 3);
                }
                cell.innerText = text;
        
                // Move the cursor to the end of the cell.
                moveCursorToEnd(cell);
        
                // Save and update everything else.
                saveTableData();
                populateSummaryTables();
            });        
        } else if (colName === 'Long') {
            // Add an event to limit input to 2 numeric digits and keep the cursor at the end.
            cell.addEventListener('input', () => {
                let value = cell.innerText.trim();
                // Remove any character that is not a digit.
                value = value.replace(/\D/g, '');
                // Limit to 2 digits
                if (value.length > 2) {
                    value = value.substring(0, 2);
                }
                if (cell.innerText.trim() !== value) {
                    cell.innerText = value;
                    moveCursorToEnd(cell);
                }

                updateCalculations(cell.parentElement);
                saveTableData();
                // Update the summary tables
                populateSummaryTables();
                // Update grand total
                updateGrandTotal();
            });
        } else {
            cell.addEventListener('input', () => {
                saveTableData();
                // Update summary tables
                populateSummaryTables();
                // Update grand total
                updateGrandTotal();
            });
        }

        return cell;
    }

    //Function to move the cursor to the end of a cell.
    function moveCursorToEnd(element) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    // Function to create a date cell with a visible input.
    function createDateCell(colName, value = '', rowspan = 1) {
        const cell = document.createElement('td');
        cell.setAttribute('data-col', colName);
        cell.setAttribute('tabindex', '0'); // Allow the cell to receive focus.
        if (rowspan > 1) {
            cell.setAttribute('rowspan', rowspan);
        }

        // Crear el input de tipo date
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.classList.add('form-control', 'form-control-sm');
        dateInput.value = value || new Date().toISOString().split('T')[0]; // Current date if none is provided.
        dateInput.addEventListener('change', () => updateFecha(dateInput));

        // Add the input to the cell.
        cell.appendChild(dateInput);

        // Event Listener to update summary tables when the date changes.
        dateInput.addEventListener('change', () => {
            populateSummaryTables();
            saveTableData();
        });

        return cell;
    }

    // Function to activate the date picker (it is not removed even if not used).
    function triggerDatePicker(btn) {
        const input = btn.parentElement.querySelector('input[type="date"]');
        if (input) {
            input.classList.remove('d-none'); 
            input.focus(); 
        }
    }

    // Function to handle date selection.
    function updateFecha(input) {
        // The date is already saved in localStorage with `saveTableData()`.
        const selectedDate = input.value;
    }

    // Function to add data cells to a row.
    function addDataCellsToRow(row, index, groupId, isMainRow = true, longsArray) {
        const fieldsToUse = fields;
    
        fieldsToUse.forEach((field) => {
            const cell = document.createElement('td');
            cell.classList.add('editable');
            cell.setAttribute('data-col', field);
            cell.setAttribute('tabindex', '0'); // Allow the cell to receive focus.
    
            // Apply styles to columns P and R.
            if (["P1", "P2", "P3", "P4"].includes(field)) {
                cell.style.backgroundColor = '#D9E1F2'; // Color to P
                cell.style.border = '1px solid black'; 
            } else if (["R1", "R2", "R3", "R4"].includes(field)) {
                cell.style.backgroundColor = '#FCE4D6'; // Color to R
                cell.style.border = '1px solid black'; 
            }
    
            if (field === "TJ - REG") {
                const select = createTJRegSelect();
                cell.appendChild(select);
            } else if (field === "Long") {
                cell.contentEditable = true;
                cell.innerText = longsArray && longsArray[index] !== undefined ? longsArray[index] : '';
                cell.style.backgroundColor = '#FFFFCC';
                cell.style.border = '1px solid black';
                cell.addEventListener('input', () => {
                    let value = cell.innerText.trim();
                    value = value.replace(/\D/g, '');
                    if (value.length > 2) {
                        value = value.substring(0, 2);
                    }
                    if (cell.innerText.trim() !== value) {
                        cell.innerText = value;
                        moveCursorToEnd(cell);
                    }
                    updateCalculations(row);
                    saveTableData();
                    populateSummaryTables();
                    updateGrandTotal();
                });
            } else if (["P1", "P2", "P3", "P4", "R1", "R2", "R3", "R4"].includes(field)) {
                cell.contentEditable = true;
                cell.innerText = '';
                cell.addEventListener('input', () => {
                    updateCalculations(row);
                    saveTableData();
                    populateSummaryTables();
                    updateGrandTotal();
                });
            } else if (["Bunches/Procona", "Bunches Total", "Stems"].includes(field)) {
                // These cells are calculated automatically, so they are not editable.
                cell.contentEditable = false; 
                cell.innerText = '';
            } else {
                cell.contentEditable = true;
                cell.innerText = '';
                cell.addEventListener('input', () => {
                    saveTableData();
                    populateSummaryTables();
                });
            }
    
            row.appendChild(cell);
        });
    
        // Add a delete button ONLY for sub-rows (`isMainRow = false`).
        if (!isMainRow) {
            const deleteLineCell = document.createElement('td');
            deleteLineCell.classList.add('text-center');
    
            const deleteLineBtn = document.createElement('button');
            deleteLineBtn.innerHTML = '<i class="fa fa-trash"></i>';
            deleteLineBtn.classList.add('delete-line-btn');
            deleteLineBtn.title = 'Eliminar esta línea';
    
            deleteLineBtn.addEventListener('click', () => {
                removeSingleRow(row);
            });
    
            deleteLineCell.appendChild(deleteLineBtn);
            row.appendChild(deleteLineCell);
        }
    }

    /**
     * The function `removeSingleRow` removes a row from a table, adjusts the rowspan of the first row
     * in the group, saves data, recalculates, and displays a success message.
     * @param row - The `removeSingleRow` function takes a `row` parameter which represents a table row
     * element that you want to remove from a data table. The function first identifies the group to
     * which the row belongs by extracting the `data-group-id` attribute of the row.
     * @returns The `removeSingleRow` function returns either a warning message if the group has less
     * than 4 rows or a success message if the row is successfully removed.
     */
    function removeSingleRow(row) {
        const groupId = row.getAttribute('data-group-id');
        const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
    
        // Check if the group has at least 4 rows (3 minimum + this extra).
        if (groupRows.length <= 3) {
            showAlert('No se puede eliminar esta línea. El grupo debe tener al menos 3 filas.', 'warning');
            return;
        }
    
        row.remove();
    
        // Adjust the `rowspan` of the first row (Variety, Type, Batch, etc.).
        const newRowSpan = parseInt(groupRows[0].querySelector('[rowspan]').getAttribute('rowspan')) - 1;
        groupRows[0].querySelectorAll('[rowspan]').forEach(cell => {
            cell.setAttribute('rowspan', newRowSpan);
        });
    
        // Save and recalculate.
        saveTableData();
        updateAllCalculations(); 
        populateSummaryTables();
    
        showAlert('Línea eliminada correctamente.', 'success');
    }

    // Function to add a new group with 3 default lines.
    /**
     * The `addGroup` function adds a new group of rows to a table with specific cells and buttons for
     * managing the group.
     */
    function addGroup() {
        const longsArray = longDefaults; 
        // Por defecto se crean 3 filas
        let numRows = 3;
        
        const groupId = Date.now();
        const mainRow = dataTable.insertRow();
        mainRow.setAttribute('data-group-id', groupId);
        
        // Creamos la celda "Variety" usando createVarietySelect (la cual utiliza varietyOptions dinámico)
        const varietyCell = createVarietySelect();
        varietyCell.setAttribute('rowspan', numRows);
        mainRow.appendChild(varietyCell);
        
        // *** MODIFICACIÓN: Agregar listener para actualizar el número de filas según el tipo ***
        const varietySelect = varietyCell.querySelector('select');
        varietySelect.addEventListener('change', () => {
            const newValue = varietySelect.value;
            const newTipo = getTipoForVariety(newValue);
            // Obtener las filas actuales del grupo
            const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
            // Si es HYPERICUM y hay menos de 5 filas, agregar las faltantes
            if (newTipo === 'HYPERICUM' && groupRows.length < 5) {
                addExtraRows(groupId, 5 - groupRows.length, true);
            }
            // Si no es HYPERICUM y hay más de 3 filas, remover las filas extra
            else if (newTipo !== 'HYPERICUM' && groupRows.length > 3) {
                removeExtraRows(groupId, groupRows.length - 3);
            }
        });
        // *** FIN MODIFICACIÓN ***
        
        // Creamos la celda "Tipo"
        const tipoCell = document.createElement('td');
        tipoCell.setAttribute('data-col', 'Tipo');
        tipoCell.setAttribute('rowspan', numRows);
        tipoCell.innerText = ''; 
        tipoCell.setAttribute('tabindex', '0'); 
        mainRow.appendChild(tipoCell);
        
        // Celda "Batch"
        const batchCell = createEditableCell('Batch', '', numRows);
        mainRow.appendChild(batchCell);
        
        // Celda "Fecha"
        const today = new Date().toISOString().split('T')[0]; 
        const fechaCell = createDateCell('Fecha', today, numRows);
        mainRow.appendChild(fechaCell);
        
        // Agregar las celdas de datos para la primera fila
        addDataCellsToRow(mainRow, 0, groupId, true, longsArray);
        
        // Celda "Stems Total" con rowspan
        const stemsTotalCell = document.createElement('td');
        stemsTotalCell.setAttribute('rowspan', numRows);
        stemsTotalCell.classList.add('text-center');
        stemsTotalCell.setAttribute('data-col', 'Stems Total');
        stemsTotalCell.innerText = '';
        stemsTotalCell.setAttribute('tabindex', '0');
        
        // Insertar "Stems Total" antes de la celda "Notas"
        const notasCell = mainRow.querySelector('td[data-col="Notas"]');
        const notasIndex = Array.prototype.indexOf.call(mainRow.cells, notasCell);
        mainRow.insertBefore(stemsTotalCell, mainRow.cells[notasIndex]);
        
        // Celda "Acciones" con rowspan
        const actionCell = document.createElement('td');
        actionCell.setAttribute('rowspan', numRows);
        actionCell.classList.add('text-center');
        
        // Botón para eliminar el grupo
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.title = 'Eliminar grupo';
        const handleDelete = () => {
            if (confirm('¿Are you sure you want to delete this group?')) {
                const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                groupRows.forEach(row => dataTable.removeChild(row));
                saveTableData();
                showAlert('Grupo eliminado correctamente.', 'warning');
                populateSummaryTables();
                updateGrandTotal();
            }
        };
        deleteBtn.addEventListener('click', handleDelete);
        deleteBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDelete();
        });
        actionCell.appendChild(deleteBtn);
        
        // Botón para agregar línea (solo para grupos que no sean HYPERICUM)
        const addLineBtn = document.createElement('button');
        addLineBtn.innerHTML = '<i class="fa fa-plus"></i>';
        addLineBtn.classList.add('add-line-btn');
        addLineBtn.title = 'Agregar línea';
        addLineBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const mainRow = dataTable.querySelector(`tr[data-group-id="${groupId}"]`);
            const tipoCell = mainRow.querySelector('td[data-col="Tipo"]');
            const tipo = tipoCell ? tipoCell.innerText.trim() : '';
            if (tipo === 'HYPERICUM') {
                showAlert('No se pueden agregar líneas adicionales para el grupo HYPERICUM.', 'warning');
                return;
            }
            addExtraRows(groupId, 1, false);
            showAlert('Se agregó una nueva línea al grupo.', 'success');
        });
        actionCell.appendChild(addLineBtn);
        
        mainRow.appendChild(actionCell);
        
        // Agregar filas adicionales para completar el número de filas (por defecto 3)
        for (let i = 1; i < numRows; i++) {
            const subRow = dataTable.insertRow();
            subRow.setAttribute('data-group-id', groupId);
            addDataCellsToRow(subRow, i, groupId, false, longsArray);
        }
        
        updateCalculations(mainRow);
        updateStemsTotal(groupId);
        saveTableData();
        showAlert('Grupo agregado correctamente.');
        populateSummaryTables();
        updateGrandTotal();
    }

    

    /**
     * The `addGroupEmpaque` function dynamically creates a new row for a group in a table, allowing
     * users to input and manipulate data related to packaging.
     */
    function addGroupEmpaque() {
        const empaqueTableBody = document.querySelector('#empaqueTable tbody');
        const groupId = Date.now().toString(); // Unique ID for the group.
    
        // Create the main row of the group.
        const mainRow = empaqueTableBody.insertRow();
        mainRow.setAttribute('data-group-id', groupId);
    
        // (a) Column 1: Variety (select), with `rowspan = 1`.
        const varietyCell = document.createElement('td');
        varietyCell.setAttribute('data-col', 'Variety');
        const varietySelect = createVarietySelect();  
        varietyCell.appendChild(varietySelect);
        varietyCell.setAttribute('rowspan', 1); 
        mainRow.appendChild(varietyCell);
    
        // (b) Column 2: Bouquet type (select), with rowspan=1
        const tipoRamoCell = document.createElement('td');
        tipoRamoCell.setAttribute('data-col', 'Tipo de Ramo');
        const tipoRamoSelect = createTJRegSelect(); 
        tipoRamoCell.appendChild(tipoRamoSelect);
        tipoRamoCell.setAttribute('rowspan', 1); 
        mainRow.appendChild(tipoRamoCell);
    
        // (c) Column 3: Long (editable)
        const longCell = document.createElement('td');
        longCell.setAttribute('data-col', 'Long');
        longCell.contentEditable = true;
        longCell.innerText = '';
        mainRow.appendChild(longCell);
    
        // (d) Column 4: BOX (select)
        const tipoCajaCell = document.createElement('td');
        tipoCajaCell.setAttribute('data-col', 'Tipo de Caja');
        const tipoCajaSelect = document.createElement('select');
        tipoCajaSelect.classList.add('form-select', 'form-select-sm');
        ["HB", "QB", "EB"].forEach(optVal => {
            const opt = document.createElement('option');
            opt.value = optVal;
            opt.text = optVal;
            tipoCajaSelect.appendChild(opt);
        });
        tipoCajaCell.appendChild(tipoCajaSelect);
        mainRow.appendChild(tipoCajaCell);
    
        // (e) Column 5: # Number of boxes (editable)
        const numCajasCell = document.createElement('td');
        numCajasCell.setAttribute('data-col', '# Cajas');
        numCajasCell.contentEditable = true;
        numCajasCell.innerText = '';
        mainRow.appendChild(numCajasCell);
    
        // (f) Column 6: Total UND (NO editable)
        const totalUNDCell = document.createElement('td');
        totalUNDCell.setAttribute('data-col', 'Total UND');
        totalUNDCell.classList.add('text-center');
        totalUNDCell.innerText = '0';
        mainRow.appendChild(totalUNDCell);
    
        // (g) Column 7: Total packing (rowspan=1)
        const totalEmpaqueCell = document.createElement('td');
        totalEmpaqueCell.setAttribute('data-col', 'Total Empaque');
        totalEmpaqueCell.classList.add('text-center');
        totalEmpaqueCell.innerText = '0';
        totalEmpaqueCell.setAttribute('rowspan', 1); 
        mainRow.appendChild(totalEmpaqueCell);
    
        // (h) Column 8: Remainnig (rowspan=1)
        const sobranteCell = document.createElement('td');
        sobranteCell.setAttribute('data-col', 'Sobrante');
        sobranteCell.classList.add('text-center');
        sobranteCell.innerText = '0';
        sobranteCell.setAttribute('rowspan', 1);
        mainRow.appendChild(sobranteCell);
    
        // (i) Column 9: Process (editable, rowspan=1)
        const procesoCell = document.createElement('td');
        procesoCell.setAttribute('data-col', 'Proceso');
        procesoCell.classList.add('text-center');
        //procesoCell.contentEditable = true;
        procesoCell.innerText = '';
        procesoCell.setAttribute('rowspan', 1); 
        mainRow.appendChild(procesoCell);
    
        // (j) Column 10: Total avalaible (rowspan=1)
        const totalDisponibleCell = document.createElement('td');
        totalDisponibleCell.setAttribute('data-col', 'Total Disponible');
        totalDisponibleCell.classList.add('text-center');
        totalDisponibleCell.innerText = '0';
        totalDisponibleCell.setAttribute('rowspan', 1); 
        mainRow.appendChild(totalDisponibleCell);
    
        // (k) Column 11: Actions
        const accionesCell = document.createElement('td');
        accionesCell.setAttribute('data-col', 'Acciones');
        accionesCell.classList.add('text-center');
    
        // Button delete group
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
        deleteBtn.classList.add('delete-btn', 'btn', 'btn-danger', 'btn-sm');
        deleteBtn.title = 'Eliminar grupo de Empaque';
    
        deleteBtn.addEventListener('click', () => {
            if (confirm('¿Está seguro de eliminar este grupo de Empaque?')) {
                const rowsToDelete = empaqueTableBody.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                rowsToDelete.forEach(r => r.remove());
                saveEmpaqueGroupData();
                // Remover del estado de grupos bloqueados
                let lockedGroups = JSON.parse(localStorage.getItem('empaqueLockedGroups')) || [];
                if (lockedGroups.includes(groupId)) {
                    lockedGroups = lockedGroups.filter(id => id !== groupId);
                    localStorage.setItem('empaqueLockedGroups', JSON.stringify(lockedGroups));
                }
                showAlert('Grupo de Empaque eliminado.', 'warning');
            }
        });
    
        accionesCell.appendChild(deleteBtn);
    
        // "More" button to add rows.
        const addRowBtn = document.createElement('button');
        addRowBtn.innerHTML = '<i class="fa fa-plus"></i>'; 
        addRowBtn.classList.add('btn', 'btn-success', 'btn-sm', 'ms-2'); 
        addRowBtn.title = 'Agregar fila al grupo de Empaque';
    
        addRowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addExtraEmpaqueRow(groupId);
        });
    
        accionesCell.appendChild(addRowBtn);
    
        // Lock button.
        const lockBtn = document.createElement('button');
        lockBtn.innerHTML = '<i class="fa fa-lock-open"></i>'; // Initial state: unlocked.
        lockBtn.classList.add('lock-btn', 'btn', 'btn-secondary', 'btn-sm', 'ms-2'); 
        lockBtn.title = 'Bloquear este grupo';
    
        lockBtn.addEventListener('click', () => {
            toggleGroupLock(groupId, lockBtn);
        });
    
        accionesCell.appendChild(lockBtn);
    
        mainRow.appendChild(accionesCell);
    
        // Add event listeners to update calculations and save data.
        varietySelect.addEventListener('change', () => {
            updateEmpaqueRow(mainRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
        });
    
        tipoRamoSelect.addEventListener('change', () => {
            updateEmpaqueRow(mainRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
        });
    
        longCell.addEventListener('input', () => {
            updateEmpaqueRow(mainRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
        });
    
        tipoCajaSelect.addEventListener('change', () => {
            updateEmpaqueRow(mainRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
        });
    
        numCajasCell.addEventListener('input', () => {
            updateEmpaqueRow(mainRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
        });
    
        procesoCell.addEventListener('input', () => {
            updateEmpaqueRow(mainRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
        });
    
        // Set the lock state according to `localStorage`.
        setGroupLockState(groupId, lockBtn);
    
        // Save group data
        saveEmpaqueGroupData();
        showAlert('Grupo de Empaque agregado correctamente.', 'success');
    }
    

    /**
     * The function `addExtraEmpaqueRow` adds a new row to a table based on a specified group ID,
     * updating the table structure and content accordingly.
     * @param groupId - The `addExtraEmpaqueRow` function you provided seems to be adding a new row to
     * a table based on the `groupId` parameter. The function first locates the table body, filters the
     * rows based on the `groupId`, inserts a new row below the last row of the group, updates
     * @returns The `addExtraEmpaqueRow` function is returning nothing (`undefined`) explicitly. It
     * performs various operations to add a new row to a table based on the provided `groupId`, updates
     * the table structure, adds event listeners, calculates values, and displays a success message.
     */
    function addExtraEmpaqueRow(groupId) {
        const empaqueTableBody = document.querySelector('#empaqueTable tbody');
        // All tbody rows
        const allRows = Array.from(empaqueTableBody.querySelectorAll('tr'));
    
        // Filter the rows that belong to this groupId
        const groupRows = allRows.filter(r => r.getAttribute('data-group-id') === groupId);
        if (!groupRows.length) {
            console.warn("No se encontraron filas para el groupId =", groupId);
            return;
        }
    
        // The last row of the group where we will insert the new row just below it
        const lastRowOfGroup = groupRows[groupRows.length - 1];
        const lastRowIndex = allRows.indexOf(lastRowOfGroup);
    
        // We insert the new row AFTER the last row of the group
        const newRow = empaqueTableBody.insertRow(lastRowIndex + 1);
        newRow.setAttribute('data-group-id', groupId);
    
        // Increment the rowspan of cells spanning multiple rows (main row of the group).
        const mainRow = groupRows[0];
        ['Variety', 'Total Empaque', 'Sobrante', 'Proceso', 'Total Disponible'].forEach(col => {
            const cell = mainRow.querySelector(`td[data-col="${col}"]`);
            if (cell) {
                let currentRowSpan = parseInt(cell.getAttribute('rowspan')) || 1;
                cell.setAttribute('rowspan', currentRowSpan + 1);
            }
        });
    
        // ==== Create and configure cells for the new row ====
        // 1) Branch type (select)
        const tipoRamoCell = newRow.insertCell();
        tipoRamoCell.setAttribute('data-col', 'Tipo de Ramo');
        const tipoRamoSelect = createTJRegSelect();  
        tipoRamoCell.appendChild(tipoRamoSelect);
    
        // 2) Long (editable)
        const longCell = newRow.insertCell();
        longCell.setAttribute('data-col', 'Long');
        longCell.contentEditable = true;
        longCell.innerText = '';
    
        // 3) Type of box (select)
        const tipoCajaCell = newRow.insertCell();
        tipoCajaCell.setAttribute('data-col', 'Tipo de Caja');
        const tipoCajaSelect = document.createElement('select');
        tipoCajaSelect.classList.add('form-select', 'form-select-sm');
        ["HB", "QB", "EB"].forEach(optVal => {
            const opt = document.createElement('option');
            opt.value = optVal;
            opt.text = optVal;
            tipoCajaSelect.appendChild(opt);
        });
        tipoCajaCell.appendChild(tipoCajaSelect);
    
        // 4) # Boxes (editable)
        const numCajasCell = newRow.insertCell();
        numCajasCell.setAttribute('data-col', '# Cajas');
        numCajasCell.contentEditable = true;
        numCajasCell.innerText = '';
    
        // 5) Total UND (NO editable)
        const totalUNDCell = newRow.insertCell();
        totalUNDCell.setAttribute('data-col', 'Total UND');
        totalUNDCell.classList.add('text-center');
        totalUNDCell.innerText = '0';
    
        // 6) Actions (button delete row)
        const accionesCell = newRow.insertCell();
        accionesCell.setAttribute('data-col', 'Acciones');
        accionesCell.classList.add('text-center');
    
        const deleteLineBtn = document.createElement('button');
        deleteLineBtn.innerHTML = '<i class="fa fa-trash"></i>';
        deleteLineBtn.classList.add('delete-line-btn', 'btn', 'btn-danger', 'btn-sm');
        deleteLineBtn.title = 'Eliminar esta línea';
    
        deleteLineBtn.addEventListener('click', () => {
            removeEmpaqueRow(newRow, groupId);
        });
        accionesCell.appendChild(deleteLineBtn);
    
        // ============= Agregar los eventListeners =============
        tipoRamoSelect.addEventListener('change', () => {
            updateEmpaqueRow(newRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
        });
        longCell.addEventListener('input', () => {
            updateEmpaqueRow(newRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
        });
        tipoCajaSelect.addEventListener('change', () => {
            updateEmpaqueRow(newRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
        });
        numCajasCell.addEventListener('input', () => {
            updateEmpaqueRow(newRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
        });
    
        // We calculate the new row:
        updateEmpaqueRow(newRow);
        updateEmpaqueGroupTotal(groupId);
    
        // If the group is locked in localStorage, we lock the row
        const isLocked = isGroupLocked(groupId);
        if (isLocked) {
            lockEmpaqueRow(newRow);
        }
    
        showAlert('Nueva línea agregada correctamente debajo del grupo.', 'success');
    }    

    /**
     * The function `removeEmpaqueRow` removes a row from a table, updates calculations and data, and
     * displays a success message.
     * @param row - The `row` parameter in the `removeEmpaqueRow` function represents the specific row
     * element that needs to be removed from the table. This row is identified and selected based on
     * the provided `groupId`. The function first checks if there is more than one row in the group to
     * ensure that at least
     * @param groupId - The `groupId` parameter in the `removeEmpaqueRow` function is used to identify
     * the group to which the row belongs. This group is used to perform various operations such as
     * updating calculations, saving data, managing lock status, and displaying alerts related to the
     * specific group in the empaque table.
     * @returns The function `removeEmpaqueRow` returns nothing (`undefined`) as there is no explicit
     * return value specified in the function. The function performs various operations like removing a
     * row from a table, updating calculations, saving data, managing lock status, and displaying a
     * success message, but it does not return any specific value.
     */
    function removeEmpaqueRow(row, groupId) {
        const empaqueTableBody = document.querySelector('#empaqueTable tbody');
        const groupRows = empaqueTableBody.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        const currentCount = groupRows.length;
    
        if (currentCount <= 1) {
            showAlert('No se puede eliminar la única fila del grupo. Debe haber al menos una fila.', 'warning');
            return;
        }
    
        // Remove row
        row.remove();
    
        // Reduce the rowspan of cells spanning multiple rows
        const mainRow = empaqueTableBody.querySelector(`tr[data-group-id="${groupId}"]`);
        ['Variety', 'Total Empaque', 'Sobrante', 'Proceso', 'Total Disponible'].forEach(col => {
            const cell = mainRow.querySelector(`td[data-col="${col}"]`);
            if (cell) {
                const currentRowSpan = parseInt(cell.getAttribute('rowspan')) || 1;
                cell.setAttribute('rowspan', currentRowSpan - 1);
            }
        });
    
        // Update calculations and save data
        updateEmpaqueGroupTotal(groupId);
        updateAllCalculations();
        populateSummaryTables();
        updateGrandTotal();
        saveEmpaqueGroupData();
    
        // Manage lock status
        const isLocked = isGroupLocked(groupId);
        if (isLocked) {
            lockEmpaqueGroup(groupId);
        }
    
        showAlert('Fila eliminada del grupo de Empaque.', 'success');
    }
    
    // Function for toggling the locking status of a group
    function toggleGroupLock(groupId, lockBtn) {
        let lockedGroups = JSON.parse(localStorage.getItem('empaqueLockedGroups')) || [];
        const isLocked = lockedGroups.includes(groupId);

        if (isLocked) {
            // Unblock the group
            lockedGroups = lockedGroups.filter(id => id !== groupId);
            lockBtn.innerHTML = '<i class="fa fa-lock-open"></i>';
            lockBtn.title = 'Bloquear este grupo';

            // Remove blocking class and enable inputs
            const groupRows = document.querySelectorAll(`tr[data-group-id="${groupId}"]`);
            groupRows.forEach(row => {
                row.classList.remove('locked-group');
                const inputs = row.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    input.disabled = false;
                });
            });
        } else {
            // Block group
            lockedGroups.push(groupId);
            lockBtn.innerHTML = '<i class="fa fa-lock"></i>';
            lockBtn.title = 'Desbloquear este grupo';

            // Add blocked class and disable inputs
            const groupRows = document.querySelectorAll(`tr[data-group-id="${groupId}"]`);
            groupRows.forEach(row => {
                row.classList.add('locked-group');
                const inputs = row.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    input.disabled = true;
                });
            });
        }

        localStorage.setItem('empaqueLockedGroups', JSON.stringify(lockedGroups));
    }

    // Function for setting the lock status when loading groups
    function setGroupLockState(groupId, lockBtn) {
        let lockedGroups = JSON.parse(localStorage.getItem('empaqueLockedGroups')) || [];
        const isLocked = lockedGroups.includes(groupId);
        if (isLocked) {
            lockBtn.innerHTML = '<i class="fa fa-lock"></i>';
            lockBtn.title = 'Desbloquear este grupo';
            const groupRows = document.querySelectorAll(`tr[data-group-id="${groupId}"]`);
            groupRows.forEach(row => {
                row.classList.add('locked-group');
                const inputs = row.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    input.disabled = true;
                });
            });
        } else {
            lockBtn.innerHTML = '<i class="fa fa-lock-open"></i>';
            lockBtn.title = 'Bloquear este grupo';
            const groupRows = document.querySelectorAll(`tr[data-group-id="${groupId}"]`);
            groupRows.forEach(row => {
                row.classList.remove('locked-group');
                const inputs = row.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    input.disabled = false;
                });
            });
        }
    }
        
    // ============================
    // Packing Data Saving Function
    // ============================
    /**
     * The function `saveEmpaqueGroupData` saves data from an HTML table into local storage as a JSON
     * string.
     */
    function saveEmpaqueGroupData() {
        const empaqueTableBody = document.querySelector('#empaqueTable tbody');
        const groups = {};

        Array.from(empaqueTableBody.rows).forEach(row => {
            const groupId = row.getAttribute('data-group-id');
            if (!groupId) return;
            if (!groups[groupId]) {
                groups[groupId] = {
                    variety: row.cells[0].querySelector('select').value,
                    tipoRamo: row.cells[1].querySelector('select').value,
                    long: row.cells[2].innerText.trim(),
                    caja: row.cells[3].querySelector('select').value,
                    numCajas: row.cells[4].innerText.trim(),
                    totalUND: row.cells[5].innerText.trim(),
                    totalEmpaque: row.cells[6].innerText.trim(),
                    sobrante: row.cells[7].innerText.trim(),
                    proceso: row.cells[8].innerText.trim(),
                    totalDisponible: row.cells[9].innerText.trim()
                };
            }
        });

        localStorage.setItem('empaqueData', JSON.stringify(groups));
    }
      
    // ============================
    // Packing Data Upload Function
    // ============================
    /**
     * The function `loadEmpaqueTableData` populates an HTML table with data from localStorage and sets
     * up event listeners for updating and saving the data.
     */
    function loadEmpaqueTableData() {
        const data = JSON.parse(localStorage.getItem('empaqueData')) || {};
        const empaqueTableBody = document.querySelector('#empaqueTable tbody');
        empaqueTableBody.innerHTML = '';

        // We traverse each groupId in the data object
        Object.keys(data).forEach(groupId => {
            const group = data[groupId];

            // Create the main row
            const mainRow = empaqueTableBody.insertRow();
            mainRow.setAttribute('data-group-id', groupId);

            // (a) Column 1: Variety (select)
            const varietyCell = document.createElement('td');
            const varietySelect = createVarietySelect(group.variety); 
            varietyCell.appendChild(varietySelect);
            mainRow.appendChild(varietyCell);

            // (b) Column 2: Bouquet type (select)
            const tipoRamoCell = document.createElement('td');
            const tipoRamoSelect = createTJRegSelect(group.tipoRamo); 
            tipoRamoCell.appendChild(tipoRamoSelect);
            mainRow.appendChild(tipoRamoCell);

            // (c) Column 3: Long (editable)
            const longCell = document.createElement('td');
            longCell.contentEditable = true;
            longCell.innerText = group.long;
            mainRow.appendChild(longCell);

            // (d) Column 4: Type of box (select)
            const cajaCell = document.createElement('td');
            const cajaSelect = document.createElement('select');
            cajaSelect.classList.add('form-select', 'form-select-sm');
            ["HB", "QB", "EB"].forEach(optVal => {
                const opt = document.createElement('option');
                opt.value = optVal;
                opt.text = optVal;
                if (group.caja === optVal) opt.selected = true;
                cajaSelect.appendChild(opt);
            });
            cajaCell.appendChild(cajaSelect);
            mainRow.appendChild(cajaCell);

            // (e) Column 5: # Boxes (editable)
            const numCajasCell = document.createElement('td');
            numCajasCell.contentEditable = true;
            numCajasCell.innerText = group.numCajas;
            mainRow.appendChild(numCajasCell);

            // (f) Column 6: Total UND
            const totalUNDCell = document.createElement('td');
            totalUNDCell.innerText = group.totalUND || '0';
            mainRow.appendChild(totalUNDCell);

            // (g) Column 7: Total UND
            const totalEmpaqueCell = document.createElement('td');
            totalEmpaqueCell.classList.add('text-center');
            totalEmpaqueCell.innerText = group.totalEmpaque || '0';
            mainRow.appendChild(totalEmpaqueCell);

            // (h) Column 8: Remaining
            const sobranteCell = document.createElement('td');
            sobranteCell.classList.add('text-center');
            sobranteCell.innerText = group.sobrante || '';
            mainRow.appendChild(sobranteCell);

            // (i) Column 9: Process (editable)
            const procesoCell = document.createElement('td');
            //procesoCell.contentEditable = true;
            procesoCell.classList.add('text-center');
            procesoCell.innerText = group.proceso || '';
            mainRow.appendChild(procesoCell);

            // (j) Column 10: Total Avalaible
            const totalDisponibleCell = document.createElement('td');
            totalDisponibleCell.classList.add('text-center');
            totalDisponibleCell.innerText = group.totalDisponible || '0';
            mainRow.appendChild(totalDisponibleCell);

            // (k) Columna 11: Actions
            const accionesCell = document.createElement('td');
            accionesCell.classList.add('text-center');

            // Button delete group
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
            deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'me-2'); 
            deleteBtn.title = 'Eliminar grupo de Empaque';

            deleteBtn.addEventListener('click', () => {
                if (confirm('¿Está seguro de eliminar este grupo de Empaque?')) {
                    const rowsToDelete = empaqueTableBody.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                    rowsToDelete.forEach(r => r.remove());
                    saveEmpaqueGroupData();
                    // Remove from blocked groups status
                    let lockedGroups = JSON.parse(localStorage.getItem('empaqueLockedGroups')) || [];
                    if (lockedGroups.includes(groupId)) {
                        lockedGroups = lockedGroups.filter(id => id !== groupId);
                        localStorage.setItem('empaqueLockedGroups', JSON.stringify(lockedGroups));
                    }
                    showAlert('Grupo de Empaque eliminado.', 'warning');
                }
            });

            accionesCell.appendChild(deleteBtn);

            // Lock Button
            const lockBtn = document.createElement('button');
            lockBtn.innerHTML = '<i class="fa fa-lock-open"></i>'; 
            lockBtn.classList.add('btn', 'btn-secondary', 'btn-sm');
            lockBtn.title = 'Bloquear este grupo';

            lockBtn.addEventListener('click', () => {
                toggleGroupLock(groupId, lockBtn);
            });

            accionesCell.appendChild(lockBtn);

            mainRow.appendChild(accionesCell);

            // Set lock status according to localStorage
            setGroupLockState(groupId, lockBtn);

            // Adding event listeners to update calculations and save data
            varietySelect.addEventListener('change', () => {
                updateEmpaqueRow(mainRow);
                updateEmpaqueGroupTotal(groupId);
                saveEmpaqueGroupData();
            });
            tipoRamoSelect.addEventListener('change', () => {
                updateEmpaqueRow(mainRow);
                updateEmpaqueGroupTotal(groupId);
                saveEmpaqueGroupData();
            });
            longCell.addEventListener('input', () => {
                updateEmpaqueRow(mainRow);
                updateEmpaqueGroupTotal(groupId);
                saveEmpaqueGroupData();
            });
            cajaSelect.addEventListener('change', () => {
                updateEmpaqueRow(mainRow);
                updateEmpaqueGroupTotal(groupId);
                saveEmpaqueGroupData();
            });
            numCajasCell.addEventListener('input', () => {
                updateEmpaqueRow(mainRow);
                updateEmpaqueGroupTotal(groupId);
                saveEmpaqueGroupData();
            });
            procesoCell.addEventListener('input', () => {
                updateEmpaqueRow(mainRow);
                updateEmpaqueGroupTotal(groupId);
                saveEmpaqueGroupData();
            });
        })
    }

    // ============================
    // Function for Initializing the Lock Status on Page Load
    // ============================
    function initializeLockStates() {
        const lockedGroups = JSON.parse(localStorage.getItem('empaqueLockedGroups')) || [];
        lockedGroups.forEach(groupId => {
            const lockBtn = document.querySelector(`tr[data-group-id="${groupId}"] td:last-child .btn-secondary`);
            if (lockBtn) {
                toggleGroupLock(groupId, lockBtn);
            }
        });
    }

    loadEmpaqueTableData();
    initializeLockStates();

    /**
     * Recalculates “Total UND” of a Packing row,
     * according to variety, branch type, length, box type and #boxes.
     */
    function updateEmpaqueRow(row) {
        // 1) We get the groupId
        const groupId = row.getAttribute('data-group-id');
        if (!groupId) return;
    
        // 2) Locate the main row (mainRow) of that group
        const mainRow = document.querySelector(`#empaqueTable tr[data-group-id="${groupId}"]`);
        if (!mainRow) return;
    
        // 3) Determine if the current row is the main row or a subrow.
        const isMainRow = (row === mainRow);
    
        // - If main row:
        // col 0 = Variety, col 1 = Branch Type, col 2 = Long, col 3 = Box, col 4 = #Boxes, col 5 = Total UND, col 6 = ...
        // - If sub-row:
        // col 0 = Bouquet Type, col 1 = Long, col 2 = Box, col 3 = #Boxes, col 4 = Total UND.
        let tipoRamoCol, longCol, cajaCol, numCajasCol, totalUNDCol;
        if (isMainRow) {
            tipoRamoCol   = 1;
            longCol       = 2;
            cajaCol       = 3;
            numCajasCol   = 4;
            totalUNDCol   = 5;
        } else {
            tipoRamoCol   = 0;
            longCol       = 1;
            cajaCol       = 2;
            numCajasCol   = 3;
            totalUNDCol   = 4;
        }
    
        // 4) We obtain the name of the variety (from the main row)
        const varietySelect = mainRow.cells[0]?.querySelector('select');
        const varietyName = varietySelect ? varietySelect.value.trim() : '';
    
        // 5) We obtain the elements of the current row (either main or subrow).
        const tipoRamoSelect = row.cells[tipoRamoCol]?.querySelector('select');
        const longCell       = row.cells[longCol];
        const cajaSelect     = row.cells[cajaCol]?.querySelector('select');
        const numCajasCell   = row.cells[numCajasCol];
        const totalUNDCell   = row.cells[totalUNDCol];
    
        if (!tipoRamoSelect || !longCell || !cajaSelect || !numCajasCell || !totalUNDCell) {
            return;
        }
    
        // 6) We read the relevant values
        // the “Branch Type” select contains the values “REG” or “WS10”.
        const tipoRamo  = tipoRamoSelect.value.trim();
        const longValue = parseInt(longCell.innerText.trim()) || 0;
        const cajaType  = cajaSelect.value.trim();
        const numCajas  = parseInt(numCajasCell.innerText.trim()) || 0;
    
        // 7) We calculate the Total UND according to category
        let totalUND = 0;
        if (tipoRamo === "REG") {
            const stemsPerCaja = getPackRateStems(varietyName, "REG", cajaType, longValue);
            totalUND = numCajas * stemsPerCaja;
        } else if (tipoRamo === "WS10") {
            const stemsPerCaja = getPackRateStems(varietyName, "WS10", cajaType, longValue);
            totalUND = numCajas * stemsPerCaja;
        } else {
            totalUND = 0;
        }
    
        // 8) We update the “Total UND” cell with the result
        totalUNDCell.innerText = totalUND.toString();
    }

    /**
     * Recalculates the “Total Packing” of a group, adding the “Total UND” cells.
     */
    function updateEmpaqueGroupTotal(groupId) {
        const allRows = document.querySelectorAll(`#empaqueTable tr[data-group-id="${groupId}"]`);
        if (!allRows.length) return;
    
        let sum = 0;
        const mainRow = allRows[0]; // The main row
    
        // We scroll through each row (main and subrows) of the group
        allRows.forEach(row => {
            const isMainRow = (row === mainRow);
            const totalUNDCol = isMainRow ? 5 : 4;
            const totalUNDCell = row.cells[totalUNDCol];
            if (!totalUNDCell) return;
            const undValue = parseInt(totalUNDCell.innerText.trim()) || 0;
            sum += undValue;
        });
    
        // The total is assigned to the “Total Packing” (column 6) of the main row.
        const totalEmpaqueCell = mainRow.cells[6];
        if (totalEmpaqueCell) {
            totalEmpaqueCell.innerText = sum.toString();
        }
    
        // Other totals are updated if necessary
        updateStemsTotal(groupId);
    }
    
    const addEmpaqueRowBtn = document.getElementById('addEmpaqueRowBtn');
    if (addEmpaqueRowBtn) {
        addEmpaqueRowBtn.addEventListener('click', () => {
            addGroupEmpaque();
        });
    }

    /**
     * The `addExtraRows` function dynamically adds extra rows to a table group while adjusting the
     * rowspan of the first row and updating calculations, summary tables, and grand total.
     * @param groupId - The `groupId` parameter in the `addExtraRows` function is used to identify the
     * group of rows in the table to which the extra rows will be added. It is a unique identifier
     * associated with a specific group of rows in the table.
     * @param extraCount - The `extraCount` parameter in the `addExtraRows` function represents the
     * number of additional rows that you want to add to a specific group identified by `groupId`. This
     * function dynamically adds extra rows to a table based on the specified group ID and the count of
     * extra rows you provide.
     * @param [isHypericum=true] - The `isHypericum` parameter in the `addExtraRows` function is a
     * boolean parameter with a default value of `true`. This parameter is used to determine whether to
     * use `hypericumLongs` or `longDefaults` when adding data cells to the newly inserted rows. If `is
     */
    function addExtraRows(groupId, extraCount, isHypericum = true) {
        const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        const currentCount = groupRows.length;
        const newTotal = currentCount + extraCount;

        // Adjust the rowspan of the first row
        ['Variety', 'Tipo', 'Batch', 'Fecha', 'Stems Total', 'Acciones'].forEach(col => {
            const cell = groupRows[0].querySelector(`td[data-col="${col}"]`) ||
                        groupRows[0].querySelector(`td[rowspan]`);
            if (cell) {
                cell.setAttribute('rowspan', newTotal);
            }
        });

        const allRows = Array.from(dataTable.rows);
        const lastRowOfGroup = groupRows[groupRows.length - 1];
        let lastRowIndexInTbody = allRows.indexOf(lastRowOfGroup);

        for (let i = currentCount; i < newTotal; i++) {
            let insertIndex = lastRowIndexInTbody + 1;

            if (insertIndex > allRows.length) {
                insertIndex = -1;
            }

            const subRow = dataTable.insertRow(insertIndex);
            subRow.setAttribute('data-group-id', groupId);

            if (insertIndex === -1) {
                allRows.push(subRow);
                lastRowIndexInTbody = allRows.length - 1;
            } else {
                allRows.splice(insertIndex, 0, subRow);
                lastRowIndexInTbody++;
            }

            addDataCellsToRow(
                subRow,
                i,
                groupId,
                false,
                isHypericum ? hypericumLongs : longDefaults
            );
        }

        const updatedGroupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        updatedGroupRows.forEach(row => {
            updateCalculations(row);
        });

        saveTableData();
        populateSummaryTables();
        updateGrandTotal();
    }

    /**
     * The function `removeExtraRows` removes extra rows from a specified group in a data table while
     * ensuring that the group has at least 3 rows.
     * @param groupId - The `groupId` parameter in the `removeExtraRows` function is used to identify
     * the group of rows that need to have extra rows removed. It is a unique identifier associated
     * with a specific group of rows in the data table.
     * @param extraCount - The `extraCount` parameter in the `removeExtraRows` function represents the
     * number of extra rows that need to be removed from a specific group in a table. This function
     * removes the specified number of extra rows from the group identified by `groupId`. If the new
     * total number of rows in the group
     * @returns The function `removeExtraRows` returns either nothing (undefined) if the condition for
     * showing an alert is met (if `newTotal < 3`), or it returns a message indicating that extra rows
     * have been removed from the group.
     */
    function removeExtraRows(groupId, extraCount) {
        const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        const currentCount = groupRows.length;
        const newTotal = currentCount - extraCount;

        if (newTotal < 3) {
            showAlert('Un grupo debe tener al menos 3 filas.', 'danger');
            return;
        }

        for (let i = currentCount - 1; i >= newTotal; i--) {
            const rowToRemove = groupRows[i];
            if (rowToRemove) {
                dataTable.removeChild(rowToRemove);
            }
        }

        ['Variety', 'Tipo', 'Batch', 'Fecha', 'Stems Total', 'Acciones'].forEach(col => {
            const cell = groupRows[0].querySelector(`td[data-col="${col}"]`) || groupRows[0].querySelector(`td[rowspan]`);
            if (cell) {
                cell.setAttribute('rowspan', newTotal);
            }
        });

        const updatedGroupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        updatedGroupRows.forEach(row => {
            updateCalculations(row);
        });

        saveTableData();
        populateSummaryTables();
        updateGrandTotal();
        showAlert('Se han eliminado filas adicionales del grupo.');
    }

    // ============================
    // updateCalculations function
    // ============================
    /**
     * The function `updateCalculations` updates calculations based on data in a table row, considering
     * different configurations and values.
     * @param row - The `row` parameter in the `updateCalculations` function represents a table row
     * element in the HTML document. This function is designed to update calculations based on the data
     * within the specified row.
     * @returns The `updateCalculations` function does not have a return value specified. It performs
     * various calculations and updates the values in the DOM elements based on the input row data. The
     * function mainly logs warnings if certain conditions are not met, updates the displayed values
     * for bunches per Procona, total bunches, and total stems, and then calls the `updateStemsTotal`
     * function with the `groupId
     */
    function updateCalculations(row) {
        const groupId = row.getAttribute('data-group-id');
        if (!groupId) {
            console.warn('La fila no tiene un ID de grupo.');
            return;
        }
        const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        if (!groupRows.length) {
            console.warn(`No se encontraron filas para el ID de grupo ${groupId}.`);
            return;
        }
        const mainRow = groupRows[0];
        // La celda "Tipo" aquí se espera que contenga el nombre de la categoría (ej. VERONICA, HYPERICUM, etc.)
        const tipoCell = mainRow.querySelector('td[data-col="Tipo"]');
        const categoryName = tipoCell ? tipoCell.innerText.trim() : '';
        if (!categoryName) {
            console.warn(`La fila principal del grupo ${groupId} no tiene definido el "Tipo".`);
            return;
        }
        if (!config[categoryName]) {
            console.warn(`Configuración para la categoría "${categoryName}" no encontrada en config.`);
            return;
        }
        
        // Se obtiene el valor del select de "TJ - REG" y el valor de la celda "Long"
        const tjRegCell = row.querySelector('td[data-col="TJ - REG"] select');
        const longCell = row.querySelector('td[data-col="Long"]');
        const tjRegValue = tjRegCell ? tjRegCell.value : '';
        const longValue = parseInt(longCell ? longCell.innerText.trim() : '') || 0;
        const longKey = longValue.toString();
      
        const pFields = ["P1", "P2", "P3", "P4"];
        const rFields = ["R1", "R2", "R3", "R4"];
      
        let bunchesPerProcona = 0;
        let stemsPerBunch = 0;
      
        // Procesamiento según el tipo de ramo seleccionado en el dropdown
        if (tjRegValue === "TJ" || tjRegValue === "WS10" || tjRegValue === "NF") {
            if (config[categoryName][tjRegValue]) {
                bunchesPerProcona = config[categoryName][tjRegValue].bunchesPerProcona || 0;
                stemsPerBunch = config[categoryName][tjRegValue].stemsPerBunch || 0;
            } else {
                console.warn(`Configuración para categoría "${categoryName}" y tipo "${tjRegValue}" no encontrada en config.`);
            }
        } else if (tjRegValue === "SU30") {
            if (config[categoryName] && config[categoryName]["SU30"]) {
                bunchesPerProcona = config[categoryName]["SU30"].bunchesPerProcona || 0;
                stemsPerBunch = config[categoryName]["SU30"].stemsPerBunch || 0;
            } else {
                console.warn(`Configuración para categoría "${categoryName}" y SU30 no encontrada en config.`);
            }
        } 
        // Aquí se procesan tanto REG como los nuevos tipos que se han creado (marcados con newType)
        else if (tjRegValue === "REG" || (config[categoryName][tjRegValue] && config[categoryName][tjRegValue].newType)) {
            // Si se trata de REG se usa la configuración de REG; si es un nuevo tipo, se usa esa entrada
            const extConfig = (tjRegValue === "REG") ? config[categoryName].REG : config[categoryName][tjRegValue];
            if (extConfig) {
                if (extConfig.lengths && extConfig.lengths[longKey] && extConfig.lengths[longKey].stemsPerBunch !== undefined) {
                    stemsPerBunch = extConfig.lengths[longKey].stemsPerBunch;
                } else if (extConfig.stemsPerBunch !== undefined) {
                    stemsPerBunch = extConfig.stemsPerBunch;
                } else {
                    stemsPerBunch = 0;
                    console.warn(`stemsPerBunch no está definido para categoría "${categoryName}" en ${tjRegValue}.`);
                }
                if (extConfig.lengths && extConfig.lengths[longKey] && extConfig.lengths[longKey].bunchesPerProcona !== undefined) {
                    bunchesPerProcona = extConfig.lengths[longKey].bunchesPerProcona;
                } else if (extConfig.bunchesPerProcona !== undefined) {
                    bunchesPerProcona = extConfig.bunchesPerProcona;
                } else {
                    bunchesPerProcona = 0;
                    console.warn(`bunchesPerProcona no está definido para categoría "${categoryName}" en ${tjRegValue} y longitud ${longValue}.`);
                }
            } else {
                console.warn(`Configuración para categoría "${categoryName}" y tipo "${tjRegValue}" no encontrada en config.`);
            }
        } else {
            bunchesPerProcona = 0;
            stemsPerBunch = 0;
        }
      
        // Actualización de la celda "Bunches/Procona" en la fila actual
        const bunchesPerProconaCell = row.querySelector('td[data-col="Bunches/Procona"]');
        if (bunchesPerProconaCell) {
            bunchesPerProconaCell.innerText = bunchesPerProcona;
        }
      
        // Cálculo del total de bunches utilizando los campos P y R
        let bunchesTotal = 0;
        pFields.forEach(field => {
            const cell = row.querySelector(`td[data-col="${field}"]`);
            const value = parseInt(cell ? cell.innerText.trim() : '') || 0;
            if (value > 0) {
                bunchesTotal += value * bunchesPerProcona;
            }
        });
        rFields.forEach(field => {
            const cell = row.querySelector(`td[data-col="${field}"]`);
            const value = parseInt(cell ? cell.innerText.trim() : '') || 0;
            if (value > 0) {
                bunchesTotal += value;
            }
        });
      
        const bunchesTotalCell = row.querySelector('td[data-col="Bunches Total"]');
        if (bunchesTotalCell) {
            bunchesTotalCell.innerText = bunchesTotal;
        }
      
        // Cálculo y actualización del total de stems (bunchesTotal * stemsPerBunch)
        const stemsCell = row.querySelector('td[data-col="Stems"]');
        if (stemsCell) {
            const stems = bunchesTotal * stemsPerBunch;
            stemsCell.innerText = stems;
        }
      
        updateStemsTotal(groupId);
    }
    
      

    /**
     * The function `updateStemsTotal` calculates the total number of stems for a specific group and
     * updates the corresponding cell in the table.
     * @param groupId - The `groupId` parameter is used to identify a specific group within a data
     * table. The function `updateStemsTotal(groupId)` calculates the total number of stems for all
     * rows belonging to the specified group identified by `groupId` in the data table.
     */
    function updateStemsTotal(groupId) {
        const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        let totalStems = 0;
    
        groupRows.forEach(row => {
            const stemsCell = row.querySelector('td[data-col="Stems"]');
            if (stemsCell) {
                const stemsValue = parseInt(stemsCell.innerText.trim()) || 0;
                totalStems += stemsValue;
            }
        });
    
        const mainRow = dataTable.querySelector(`tr[data-group-id="${groupId}"]`);
        const stemsTotalCell = mainRow.querySelector('td[data-col="Stems Total"]');
        if (stemsTotalCell) {
            stemsTotalCell.innerText = totalStems;
        }
    
        updateGrandTotal();
    }

    /**
     * The function `updateGrandTotal` calculates the sum of values in cells with the attribute
     * `data-col="Stems Total"` and updates the grand total value displayed on the webpage.
     */
    function updateGrandTotal() {
        const grandTotalValue = document.getElementById('grandTotalValue');
        let grandTotal = 0;
    
        const stemsTotalCells = dataTable.querySelectorAll('td[data-col="Stems Total"]');
        stemsTotalCells.forEach(cell => {
            const value = parseInt(cell.innerText.trim()) || 0;
            grandTotal += value;
        });
    
        if (grandTotalValue) {
            grandTotalValue.innerText = grandTotal;
        }
    }

    /**
     * The function `saveTableData` retrieves data from an HTML table, organizes it by group, and saves
     * it to local storage along with a responsible person's input.
     */
    function saveTableData() {
        const table = document.getElementById('dataTable');
        const groups = {};

        table.querySelectorAll('tbody tr').forEach(row => {
            const groupId = row.getAttribute('data-group-id');
            if (!groupId) return;

            if (!groups[groupId]) {
            groups[groupId] = {
                variety: '',
                tipo: '',
                batch: '',
                fecha: '',
                stemsTotal: 0,
                rows: []
            };
            }
            const group = groups[groupId];

            // Se considera que la fila principal tiene la celda "Variety" en el índice 0
            const mainCell = row.cells[0];
            const isMainRow = mainCell && mainCell.getAttribute('data-col') === 'Variety';

            if (isMainRow) {
            // Extraemos el valor del select de Variety
            const varietySelect = mainCell.querySelector('select');
            group.variety = varietySelect ? varietySelect.value : '';
            // Calculamos el tipo (usando getTipoForVariety, que tú defines)
            group.tipo = getTipoForVariety(group.variety);
            // Extraer "Batch" (asumimos que está en la celda 3, índice 2)
            group.batch = row.cells[2] ? row.cells[2].innerText.trim() : '';
            // Extraer la fecha desde la celda "Fecha"
            const fechaCell = row.querySelector('td[data-col="Fecha"]');
            const fechaInput = fechaCell ? fechaCell.querySelector('input') : null;
            group.fecha = fechaInput ? fechaInput.value : '';
            // Extraer "Stems Total"
            const stemsTotalCell = row.querySelector('td[data-col="Stems Total"]');
            group.stemsTotal = stemsTotalCell ? parseInt(stemsTotalCell.innerText.trim(), 10) || 0 : 0;
            }

            // Recorremos las celdas de la fila para extraer el resto de datos
            const rowData = {};
            const startIndex = isMainRow ? 4 : 0; // En fila principal se omiten las primeras 4 celdas
            const endIndex = row.cells.length - 1; // Se omite la celda de acciones
            for (let i = startIndex; i < endIndex; i++) {
            const cell = row.cells[i];
            if (!cell) continue;
            const field = cell.getAttribute('data-col');
            const select = cell.querySelector('select');
            rowData[field] = select ? select.value : cell.innerText.trim();
            }
            group.rows.push(rowData);
        });

        localStorage.setItem('tableData', JSON.stringify(groups));
        localStorage.setItem('responsable', responsableInput.value.trim());
        console.log("Datos guardados en localStorage:", groups);
    }

    /**
     * The `loadTableData` function retrieves saved data from local storage and dynamically populates a
     * table with the retrieved data, including creating rows, cells, and handling user actions like
     * deleting groups or adding lines.
     */
    function loadTableData() {
        // Limpiar la tabla
        dataTable.innerHTML = "";
        const data = JSON.parse(localStorage.getItem('tableData'));
        const responsable = localStorage.getItem('responsable') || '';
        responsableInput.value = responsable;

        if (data && Object.keys(data).length > 0) {
            Object.keys(data).forEach(groupId => {
                const group = data[groupId];
                if (group.rows && group.rows.length > 0) {
                    const numRows = group.rows.length;
                    const longsArray = group.rows.map(row => row["Long"]);

                    const mainRow = dataTable.insertRow();
                    mainRow.setAttribute('data-group-id', groupId);

                    // Crear la celda "Variety" usando createVarietySelect() con el valor guardado
                    // Se reconstruye el select con todas las opciones dinámicas (varietyOptions)
                    const varietyCell = createVarietySelect(group.variety || "");
                    varietyCell.setAttribute('rowspan', numRows);
                    mainRow.appendChild(varietyCell);

                    // Crear la celda "Tipo" usando el valor guardado o calculado
                    const tipoCell = document.createElement('td');
                    tipoCell.setAttribute('data-col', 'Tipo');
                    tipoCell.setAttribute('rowspan', numRows);
                    // Se utiliza el valor guardado en group.tipo, o si no existe se calcula con getTipoForVariety
                    tipoCell.innerText = group.tipo || getTipoForVariety(group.variety) || '';
                    tipoCell.setAttribute('tabindex', '0');
                    mainRow.appendChild(tipoCell);

                    const batchCell = createEditableCell('Batch', group.batch, numRows);
                    mainRow.appendChild(batchCell);

                    const fechaValue = group.fecha || new Date().toISOString().split('T')[0];
                    const fechaCell = createDateCell('Fecha', fechaValue, numRows);
                    mainRow.appendChild(fechaCell);

                    // Agregar las celdas de datos para la fila principal
                    addDataCellsToRow(mainRow, 0, groupId, true, longsArray);

                    const stemsTotalCell = document.createElement('td');
                    stemsTotalCell.setAttribute('rowspan', numRows);
                    stemsTotalCell.classList.add('text-center');
                    stemsTotalCell.setAttribute('data-col', 'Stems Total');
                    stemsTotalCell.innerText = group.stemsTotal || '';
                    stemsTotalCell.setAttribute('tabindex', '0');

                    const notasCell = mainRow.querySelector('td[data-col="Notas"]');
                    const notasIndex = Array.prototype.indexOf.call(mainRow.cells, notasCell);
                    mainRow.insertBefore(stemsTotalCell, mainRow.cells[notasIndex]);

                    // Celda de Acciones (botones eliminar grupo y agregar línea)
                    const actionCell = document.createElement('td');
                    actionCell.setAttribute('rowspan', numRows);
                    actionCell.classList.add('text-center');

                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
                    deleteBtn.classList.add('delete-btn');
                    deleteBtn.title = 'Eliminar grupo';
                    deleteBtn.addEventListener('click', () => {
                        if (confirm('¿Estás seguro de que deseas eliminar este grupo?')) {
                            const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                            groupRows.forEach(r => dataTable.removeChild(r));
                            saveTableData();
                            showAlert('Grupo eliminado correctamente.', 'warning');
                            populateSummaryTables();
                            updateGrandTotal();
                        }
                    });
                    actionCell.appendChild(deleteBtn);
                    const addLineBtn = document.createElement('button');
                    addLineBtn.innerHTML = '<i class="fa fa-plus"></i>';
                    addLineBtn.classList.add('add-line-btn');
                    addLineBtn.title = 'Agregar línea';
                    addLineBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        addExtraRows(groupId, 1, false);
                        showAlert('Se agregó una nueva línea al grupo.', 'success');
                    });
                    actionCell.appendChild(addLineBtn);
                    mainRow.appendChild(actionCell);

                    // Para la fila principal, asignar los datos almacenados en las celdas
                    const fieldsToUse = fields;
                    fieldsToUse.forEach((field, idx) => {
                        const cellIndex = idx + 4;
                        const cell = mainRow.cells[cellIndex];
                        if (cell) {
                            if (field === "TJ - REG") {
                                // Asumimos que el select existe y se le asigna el valor guardado
                                cell.querySelector('select').value = group.rows[0][field] || 'REG';
                            } else {
                                cell.innerText = group.rows[0][field] || '';
                            }
                        }
                    });

                    // Reconstruir las subfilas según los datos guardados
                    for (let i = 1; i < numRows; i++) {
                        const subRow = dataTable.insertRow();
                        subRow.setAttribute('data-group-id', groupId);
                        addDataCellsToRow(subRow, i, groupId, false, longsArray);
                        fieldsToUse.forEach((field, idx) => {
                            const cell = subRow.cells[idx];
                            if (cell) {
                                if (field === "TJ - REG") {
                                    cell.querySelector('select').value = group.rows[i][field] || 'REG';
                                } else {
                                    cell.innerText = group.rows[i][field] || '';
                                }
                            }
                        });
                    }
                    // Recalcular totales para el grupo
                    const groupRowsLoaded = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                    groupRowsLoaded.forEach(r => updateCalculations(r));
                    updateStemsTotal(groupId);
                }
            });
            updateAllCalculations();
            populateSummaryTables();
            updateGrandTotal();

            // Finalmente, actualizamos todos los selects de Variety para que se reconstruyan con todas las opciones
            updateAllVarietySelects();
        }
    }

    function updateAllVarietySelects() {
        // Recorremos cada celda con data-col="Variety" en la tabla
        console.log("Actualizando selects de Variety. varietyOptions:", varietyOptions);
        const varietyCells = dataTable.querySelectorAll('td[data-col="Variety"]');
        varietyCells.forEach(cell => {
            const oldSelect = cell.querySelector('select');
            if (oldSelect) {
                const currentValue = oldSelect.value; // Valor guardado
                // Crear un nuevo select con el valor actual utilizando createVarietySelect()
                const newSelectWrapper = createVarietySelect(currentValue);
                const newSelect = newSelectWrapper.querySelector('select');
                // Reemplazar el contenido de la celda por el nuevo select (que contendrá todas las opciones dinámicas)
                cell.innerHTML = "";
                cell.appendChild(newSelect);
            }
        });
    }


    // Function to generate the Excel workbook
    async function generateExcelWorkbook() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventory');

        const responsable = responsableInput.value.trim() || "Desconocido";
        const fechaHora = new Date().toLocaleString();

        worksheet.mergeCells('A1:T1');
        worksheet.getCell('A1').value = `Master: ${responsable}`;
        worksheet.getCell('A1').font = { bold: true };

        worksheet.mergeCells('A2:T2');
        worksheet.getCell('A2').value = `Date: ${fechaHora}`;
        worksheet.getCell('A2').font = { bold: true };

        worksheet.addRow([]);

        const headers = ["Variety", "Type", "Block", "Date", "TJ - REG", "Long", "P1", "P2", "P3", "P4", "B1", "B2", "B3", "B4", "Bunch/Bucket", "Total Bunches", "Stems", "Stems Total", "Notes"];
        const headerRow = worksheet.addRow(headers);

        headerRow.eachCell((cell, colNumber) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDDEBF7' }
            };
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        const rows = dataTable.querySelectorAll('tr');
        let rowIndex = worksheet.rowCount + 1;

        let dataByBouquetType = [];
        let dataByLength = [];
        let dataByBatch = [];

        let variety = '';
        let batch = '';
        let fechaValue = '';

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const groupId = row.getAttribute('data-group-id');
            if (!groupId) continue;

            const isMainRow = row.cells[0].getAttribute('data-col') === 'Variety';
            const excelRowData = [];

            if (isMainRow) {
                const rowspan = parseInt(row.cells[0].getAttribute('rowspan')) || 1;
                variety = row.cells[0].querySelector('select').value;
                const tipo = row.cells[1].innerText.trim();
                batch = row.cells[2].innerText.trim();
                const fechaCell = row.querySelector('td[data-col="Fecha"]');
                const fechaInput = fechaCell ? fechaCell.querySelector('input') : null;
                fechaValue = fechaInput ? fechaInput.value : '';

                excelRowData.push(variety);
                excelRowData.push(tipo);
                excelRowData.push(batch);
                excelRowData.push(fechaValue);

                if (rowspan > 1) {
                    worksheet.mergeCells(rowIndex, 1, rowIndex + rowspan - 1, 1);
                    worksheet.mergeCells(rowIndex, 2, rowIndex + rowspan - 1, 2);
                    worksheet.mergeCells(rowIndex, 3, rowIndex + rowspan - 1, 3);
                    worksheet.mergeCells(rowIndex, 4, rowIndex + rowspan - 1, 4);
                }
            } else {
                excelRowData.push("");
                excelRowData.push("");
                excelRowData.push("");
                excelRowData.push("");
            }

            const cells = row.querySelectorAll('td');
            const startIndex = isMainRow ? 4 : 0;

            let tjRegValue = '';
            let longValue = '';
            let stemsValue = 0;
            let bunchesTotalValue = 0;

            for (let j = startIndex; j < cells.length; j++) {
                const cell = cells[j];
                const dataCol = cell.getAttribute('data-col');
                if (!dataCol) continue;

                if (dataCol === "TJ - REG") {
                    const select = cell.querySelector('select');
                    const value = select ? select.value : '';
                    excelRowData.push(value);
                    tjRegValue = value;
                } else if (dataCol === "Long") {
                    const value = cell.innerText.trim();
                    excelRowData.push(value);
                    longValue = value;
                } else if (dataCol === "Stems") {
                    const value = parseInt(cell.innerText.trim()) || 0;
                    excelRowData.push(value);
                    stemsValue = value;
                } else if (dataCol === "Total Bunches") {
                    const value = parseInt(cell.innerText.trim()) || 0;
                    excelRowData.push(value);
                    bunchesTotalValue = value;
                } else if (dataCol === "Stems Total" && isMainRow) {
                    const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;
                    excelRowData.push(cell.innerText.trim());
                    if (rowspan > 1) {
                        const colIndex = headers.indexOf("Stems Total") + 1;
                        worksheet.mergeCells(rowIndex, colIndex, rowIndex + rowspan - 1, colIndex);
                    }
                } else if (dataCol === "Notes") {
                    excelRowData.push(cell.innerText.trim());
                } else if (dataCol !== "Acciones") {
                    excelRowData.push(cell.innerText.trim());
                }
            }

            const excelRow = worksheet.addRow(excelRowData);
            excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            const bunchesTotalColIndex = headers.indexOf("Bunches Total") + 1;
            const stemsTotalColIndex = headers.indexOf("Stems Total") + 1;

            if (bunchesTotalColIndex > 0) {
                excelRow.getCell(bunchesTotalColIndex).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFCE4D6' }
                };
            }
            if (stemsTotalColIndex > 0) {
                excelRow.getCell(stemsTotalColIndex).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFDDEBF7' }
                };
            }

            // Data for additional sheets
            if (tjRegValue && longValue && stemsValue > 0) {
                dataByBouquetType.push({
                    Variety: variety,
                    'TJ - REG': tjRegValue,
                    Long: longValue,
                    'Bunches Total': bunchesTotalValue,
                    Stems: stemsValue
                });
            }
            if (longValue && stemsValue > 0) {
                dataByLength.push({
                    Variety: variety,
                    Long: longValue,
                    Stems: stemsValue
                });
            }
            if (variety && batch && longValue && stemsValue > 0) {
                dataByBatch.push({
                    Variety: variety,
                    Batch: batch,
                    Long: longValue,
                    Stems: stemsValue,
                    Fecha: fechaValue
                });
            }

            rowIndex++;
        }

        // Grand Total Row
        const grandTotalValueElement = document.getElementById('grandTotalValue');
        const grandTotalValue = grandTotalValueElement ? grandTotalValueElement.innerText.trim() : '0';
        const grandTotalRow = worksheet.addRow([]);

        const totalLabelCell = grandTotalRow.getCell(1);
        totalLabelCell.value = "Gran Total de Stems:";
        totalLabelCell.font = { bold: true };
        totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
        worksheet.mergeCells(grandTotalRow.number, 1, grandTotalRow.number, headers.length - 1);

        const totalValueCell = grandTotalRow.getCell(headers.length);
        totalValueCell.value = parseInt(grandTotalValue) || 0;
        totalValueCell.font = { bold: true };
        totalValueCell.alignment = { horizontal: 'center', vertical: 'middle' };

        grandTotalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.border = {
                top: { style: 'double' },
                left: { style: 'thin' },
                bottom: { style: 'double' },
                right: { style: 'thin' }
            };
        });

        worksheet.columns.forEach(column => {
            column.width = 15;
        });

        // Sheet “By Industry Type”.
        const bouquetSheet = workbook.addWorksheet('Bunches');
        const bouquetHeaders = ["Variety", "TJ - REG", "Long", "Bunches Total", "Stems"];
        const bouquetHeaderRow = bouquetSheet.addRow(bouquetHeaders);

        bouquetHeaderRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' }
            };
        });

        const bouquetDataMap = {};
        dataByBouquetType.forEach(item => {
            const key = `${item.Variety}_${item['TJ - REG']}_${item.Long}`;
            if (!bouquetDataMap[key]) {
                bouquetDataMap[key] = { ...item };
            } else {
                bouquetDataMap[key]['Bunches Total'] += item['Bunches Total'];
                bouquetDataMap[key]['Stems'] += item['Stems'];
            }
        });

        Object.values(bouquetDataMap).forEach(item => {
            bouquetSheet.addRow([
                item.Variety,
                item['TJ - REG'],
                item.Long,
                item['Bunches Total'],
                item.Stems
            ]).eachCell(cell => {
                cell.alignment = { horizontal: 'center' };
            });
        });

        bouquetSheet.columns.forEach(column => {
            column.width = 20;
        });

        // Sheet “By Length”.
        const lengthSheet = workbook.addWorksheet('Stems');
        const lengthHeaders = ["Variety", "Long", "Stems"];
        const lengthHeaderRow = lengthSheet.addRow(lengthHeaders);

        lengthHeaderRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' }
            };
        });

        const lengthDataMap = {};
        dataByLength.forEach(item => {
            const key = `${item.Variety}_${item.Long}`;
            if (!lengthDataMap[key]) {
                lengthDataMap[key] = { ...item };
            } else {
                lengthDataMap[key]['Stems'] += item['Stems'];
            }
        });

        Object.values(lengthDataMap).forEach(item => {
            lengthSheet.addRow([
                item.Variety,
                item.Long,
                item.Stems
            ]).eachCell(cell => {
                cell.alignment = { horizontal: 'center' };
            });
        });

        lengthSheet.columns.forEach(column => {
            column.width = 20;
        });

        // Sheet “By Length”.
        const batchSheet = workbook.addWorksheet('Block');
        const batchHeaders = ["Variety", "Batch", "Long", "Stems", "Fecha"];
        const batchHeaderRow = batchSheet.addRow(batchHeaders);

        batchHeaderRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' }
            };
        });

        const batchDataMap = {};
        dataByBatch.forEach(item => {
            const key = `${item.Variety}_${item.Batch}_${item.Long}_${item.Fecha}`;
            if (!batchDataMap[key]) {
                batchDataMap[key] = { ...item };
            } else {
                batchDataMap[key]['Stems'] += item['Stems'];
            }
        });

        Object.values(batchDataMap).forEach(item => {
            batchSheet.addRow([
                item.Variety,
                item.Batch,
                item.Long,
                item.Stems,
                item.Fecha
            ]).eachCell(cell => {
                cell.alignment = { horizontal: 'center' };
            });
        });

        batchSheet.columns.forEach(column => {
            column.width = 20;
        });

        return workbook;
    }

    /**
     * The function `generateExcelFile` generates an Excel file with the name 'Inventario.xlsx' using a
     * workbook and saves it as a Blob.
     */
    async function generateExcelFile() {
        const workbook = await generateExcelWorkbook();
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'Inventario.xlsx');
    }

    /**
     * The `sendEmail` function sends an Excel file via email using data from local storage and
     * displays alerts for different scenarios.
     * @returns The `sendEmail` function is an asynchronous function that sends an email with an Excel
     * file attachment. It first retrieves data from the localStorage, generates an Excel workbook,
     * prompts the user for an email address, creates a FormData object with the Excel file and email
     * address, and then sends a POST request to '/send-email' endpoint with the FormData.
     */
    async function sendEmail() {
        const data = JSON.parse(localStorage.getItem('tableData'));
        if (!data || Object.keys(data).length === 0) {
            showAlert('No hay datos para enviar.', 'warning');
            return;
        }

        const workbook = await generateExcelWorkbook();
        const buffer = await workbook.xlsx.writeBuffer();

        const emailTo = prompt('Ingrese el correo electrónico de destino:');
        if (!emailTo) {
            showAlert('Correo electrónico no especificado.', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('file', new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Inventario.xlsx');
        formData.append('toEmail', emailTo);

        fetch('/send-email', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            showAlert('Correo enviado exitosamente.', 'success');
        })
        .catch(error => {
            console.error('Error al enviar el correo:', error);
            showAlert('Error al enviar el correo.', 'danger');
        });
    }

    /**
     * The function `updateAllCalculations` updates calculations for each row in a data table and then
     * updates the grand total.
     */
    function updateAllCalculations() {
        config = JSON.parse(localStorage.getItem('config')) || {};
        const allRows = dataTable.querySelectorAll('tr');
        allRows.forEach(row => {
            updateCalculations(row);
        });
        updateGrandTotal();
    }

    /**
     * The function `reloadConfigAndRecalculate` retrieves a configuration from local storage, parses
     * it as JSON, and then updates all calculations based on the new configuration.
     */
    function reloadConfigAndRecalculate() {
        config = JSON.parse(localStorage.getItem('config')) || {};
        updateAllCalculations();
    }

    /**
     * The function `resetTable` clears all data in a table after confirming with the user and updates
     * related information.
     */
    function resetTable() {
        if (confirm('¿Estás seguro de que deseas eliminar todos los grupos?')) {
            dataTable.innerHTML = '';
            localStorage.removeItem('tableData');
            updateGrandTotal();
            showAlert('Todos los grupos han sido eliminados.', 'warning');
            summaryByLength.innerHTML = '';
            summaryByBouquetType.innerHTML = '';
            summaryByBatch.innerHTML = '';
        }
    }

    /**
     * The function `populateSummaryTables` parses data from localStorage and generates summary tables
     * based on different criteria such as length, bouquet type, and batch.
     * @returns The `populateSummaryTables` function populates summary tables based on the data stored
     * in the localStorage under the key 'tableData'. It processes the data to generate summaries by
     * length, bouquet type, and batch. The function returns nothing explicitly (i.e., it does not have
     * a return statement), but it updates the HTML content of the summary tables `summaryByLength`,
     * `summaryByBouquet
     */
    function populateSummaryTables() {
        summaryByLength.innerHTML = '';
        summaryByBouquetType.innerHTML = '';
        summaryByBatch.innerHTML = '';

        const data = JSON.parse(localStorage.getItem('tableData'));
        if (!data || Object.keys(data).length === 0) {
            return;
        }

        const summaryDataByLength = {};
        const summaryDataByBouquetType = {};
        const summaryDataByBatch = {};

        Object.values(data).forEach(group => {
            const variety = group.variety;
            const tipo = group.tipo;
            const batch = group.batch;
            const fecha = group.fecha;

            group.rows.forEach(row => {
                const tjReg = row["TJ - REG"];
                const long = row["Long"];
                const bunchesTotal = parseInt(row["Bunches Total"]) || 0;
                const stems = parseInt(row["Stems"]) || 0;

                // Per Long
                const lengthKey = `${variety}_${long}`;
                if (!summaryDataByLength[lengthKey]) {
                    summaryDataByLength[lengthKey] = { Variety: variety, Long: long, Stems: 0 };
                }
                summaryDataByLength[lengthKey].Stems += stems;

                // Per bouquet type
                const bouquetKey = `${variety}_${tjReg}_${long}`;
                if (!summaryDataByBouquetType[bouquetKey]) {
                    summaryDataByBouquetType[bouquetKey] = {
                        Variety: variety,
                        "TJ - REG": tjReg,
                        Long: long,
                        "Bunches Total": 0,
                        Stems: 0
                    };
                }
                summaryDataByBouquetType[bouquetKey]["Bunches Total"] += bunchesTotal;
                summaryDataByBouquetType[bouquetKey].Stems += stems;

                // Per Batch
                const batchKey = `${variety}_${batch}_${long}_${fecha}`;
                if (!summaryDataByBatch[batchKey]) {
                    summaryDataByBatch[batchKey] = {
                        Variety: variety,
                        Batch: batch,
                        Long: long,
                        Stems: 0,
                        Fecha: fecha
                    };
                }
                summaryDataByBatch[batchKey].Stems += stems;
            });
        });

        Object.values(summaryDataByLength).forEach(item => {
            const row = summaryByLength.insertRow();
            row.innerHTML = `
                <td>${item.Variety}</td>
                <td>${item.Long}</td>
                <td>${item.Stems}</td>
            `;
        });

        Object.values(summaryDataByBouquetType).forEach(item => {
            const row = summaryByBouquetType.insertRow();
            row.innerHTML = `
                <td>${item.Variety}</td>
                <td>${item["TJ - REG"]}</td>
                <td>${item.Long}</td>
                <td>${item["Bunches Total"]}</td>
                <td>${item.Stems}</td>
            `;
        });

        Object.values(summaryDataByBatch).forEach(item => {
            const row = summaryByBatch.insertRow();
            row.innerHTML = `
                <td>${item.Variety}</td>
                <td>${item.Batch}</td>
                <td>${item.Long}</td>
                <td>${item.Stems}</td>
                <td>${item.Fecha}</td>
            `;
        });
    }

    // Sidebar events if they exist
    if (closeSidebarBtn && sidebarMenu) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebarMenu.classList.remove('show');
        });
    }

    addGroupBtn.addEventListener('click', addGroup);

    if (resetTableBtn) {
        resetTableBtn.addEventListener('click', resetTable);
    }

    if (generateExcelBtn) {
        generateExcelBtn.addEventListener('click', () => {
            generateExcelFile();
        });
    }

    if (sendMailBtn) {
        sendMailBtn.addEventListener('click', sendEmail);
    }

    if (toggleSummaryBtn && summaryTablesContainer) {
        toggleSummaryBtn.addEventListener('click', () => {
            if (summaryTablesContainer.style.display === 'none' || summaryTablesContainer.style.display === '') {
                summaryTablesContainer.style.display = 'block';
                toggleSummaryBtn.innerText = 'Ocultar Resúmenes';
            } else {
                summaryTablesContainer.style.display = 'none';
                toggleSummaryBtn.innerText = 'Mostrar Resúmenes';
            }
        });
    }

    if (toggleSidebarBtn && sidebarMenu) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebarMenu.classList.add('show');
        });
    }

    // Load data or create a default group
    if (!localStorage.getItem('tableData')) {
        addGroup();
    } else {
        loadTableData();
    }

    // Listener to recalculate everything when editable content changes
    dataTable.addEventListener('input', (event) => {
        const cell = event.target;
        if (cell.classList.contains('editable')) {
            const col = cell.getAttribute('data-col');
            const row = getRowFromCell(cell);
            const groupId = row.getAttribute('data-group-id');

            if (["P1", "P2", "P3", "P4", "R1", "R2", "R3", "R4", "Long"].includes(col)) {
                updateCalculations(row);
                updateStemsTotal(groupId);
            }

            saveTableData();
            populateSummaryTables();
            updateGrandTotal();
        }
    });

    // Keep responsible immediately when changing
    responsableInput.addEventListener('input', saveTableData);

    // Save data before exiting
    window.addEventListener('beforeunload', saveTableData);

    // Keystroke handling (Enter, arrows) in editable cells
    dataTable.addEventListener('keydown', (event) => {
        const cell = event.target;
        if (cell.classList.contains('editable')) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const nextCell = getNextEditableCell(cell);
                if (nextCell) {
                    nextCell.focus();
                }
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                const nextCell = getAdjacentCell(cell, 'right');
                if (nextCell) {
                    nextCell.focus();
                }
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                const nextCell = getAdjacentCell(cell, 'left');
                if (nextCell) {
                    nextCell.focus();
                }
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                const nextCell = getAdjacentCell(cell, 'up');
                if (nextCell) {
                    nextCell.focus();
                }
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                const nextCell = getAdjacentCell(cell, 'down');
                if (nextCell) {
                    nextCell.focus();
                }
            }
        }
    });

    /**
     * The function `getNextEditableCell` returns the next editable cell in a table based on the
     * current cell provided.
     * @param currentCell - The `currentCell` parameter is the cell element that is currently selected
     * or being edited in a data table. This function `getNextEditableCell` is designed to find and
     * return the next editable cell in the data table based on the current cell provided as input.
     * @returns The function `getNextEditableCell` returns the next editable cell in the `dataTable`
     * after the `currentCell`. If there is a next editable cell after the `currentCell`, it returns
     * that cell. Otherwise, it returns the first editable cell in the `dataTable`.
     */
    function getNextEditableCell(currentCell) {
        const cells = dataTable.querySelectorAll('.editable');
        const cellArray = Array.from(cells);
        const currentIndex = cellArray.indexOf(currentCell);

        if (currentIndex >= 0 && currentIndex < cellArray.length - 1) {
            return cellArray[currentIndex + 1];
        } else {
            return cellArray[0];
        }
    }

    /**
     * The function `getAdjacentCell` returns the adjacent editable cell in a specified direction
     * relative to a given current cell in a table.
     * @param currentCell - The `currentCell` parameter represents the cell element in a table where
     * you want to find an adjacent editable cell based on the specified direction.
     * @param direction - The `direction` parameter in the `getAdjacentCell` function specifies the
     * direction in which you want to find the adjacent cell. It can have one of the following values:
     * @returns The function `getAdjacentCell` returns the target cell that is adjacent to the current
     * cell based on the specified direction ('right', 'left', 'up', 'down'). If there is a valid
     * adjacent cell in the specified direction that is also editable (has the class 'editable'), then
     * that cell is returned. Otherwise, `null` is returned.
     */
    function getAdjacentCell(currentCell, direction) {
        const cellIndex = currentCell.cellIndex;
        const row = currentCell.parentElement;
        let targetCell = null;

        if (direction === 'right') {
            if (currentCell.nextElementSibling && currentCell.nextElementSibling.classList.contains('editable')) {
                targetCell = currentCell.nextElementSibling;
            }
        } else if (direction === 'left') {
            if (currentCell.previousElementSibling && currentCell.previousElementSibling.classList.contains('editable')) {
                targetCell = currentCell.previousElementSibling;
            }
        } else if (direction === 'up') {
            const previousRow = row.previousElementSibling;
            if (previousRow) {
                const cellAbove = previousRow.cells[cellIndex];
                if (cellAbove && cellAbove.classList.contains('editable')) {
                    targetCell = cellAbove;
                }
            }
        } else if (direction === 'down') {
            const nextRow = row.nextElementSibling;
            if (nextRow) {
                const cellBelow = nextRow.cells[cellIndex];
                if (cellBelow && cellBelow.classList.contains('editable')) {
                    targetCell = cellBelow;
                }
            }
        }

        return targetCell;
    }

    // We leave these functions accessible in window in case they are needed in console
    window.saveTableData = saveTableData;
    window.updateAllCalculations = updateAllCalculations;
    window.reloadConfigAndRecalculate = reloadConfigAndRecalculate;
    // Load Packing data at startup
    // Load packaging information (if needed for other purpose)
    loadEmpaqueTableData();

    window.addEventListener('load', () => {
        // This ensures that Pack Rate data is loaded and rendered from Firebase.
        loadPackRateData();
    });
      
    // When the page is loaded, an attempt is made to get the data from Firebase.
    async function loadPackRateData() {
        try {
            const response = await fetch('/api/packrate');
            if (response.ok) {
                const blocks = await response.json();
                console.log("loadPackRateData - Datos recibidos desde Firebase:", blocks);
    
                // Save in the global variable (if you use it for further calculations)
                packRateData = blocks;
    
                // If blocks exist, rebuild the table; otherwise, generate the base table.
                if (blocks && blocks.length > 0) {
                    renderPackRateBlocks(blocks);
                } else {
                    generatePackRateTable();
                }
                // If blocks exist, rebuild the table; otherwise, generate the base table.
                updateAllCalculations();
            } else {
                console.error("Error en la respuesta de /api/packrate");
                generatePackRateTable();
            }
        } catch (error) {
            console.error("Error en loadPackRateData:", error);
            generatePackRateTable();
        }
    }

    // =============================================================
    // FUNCTIONS FOR THE PACK RATE TABLE
    // =============================================================

    // Function that generates the base table PackRate with values in 0,
    // in case Firebase does not contain data yet.
    function generatePackRateTable() {
        const packrateTable = document.getElementById("packrateTable");
        if (!packrateTable) return;
    
        const tBody = packrateTable.querySelector("tbody");
        if (!tBody) return;
        tBody.innerHTML = "";
    
        // Define the lengths and types of boxes to be used
        const longColumns = [70, 60, 55, 50, 40]; 
        const boxTypes = ["HB", "QB", "EB"];
    
        // The base rows are generated using the varieties defined in 'varietyOptions'.
        let allVarieties = [];
        Object.keys(varietyOptions).forEach(tipo => {
            allVarieties = allVarieties.concat(varietyOptions[tipo]);
        });
    
        // For each variety a block of 5 rows (one for each length) is created.
        allVarieties.forEach((varName, orderIndex) => {
            for (let i = 0; i < longColumns.length; i++) {
                const row = tBody.insertRow();
    
                // In the first row of the block the STEMS (multiplier) cell is added with rowspan=5
                // and the Variety (name) cell also with rowspan=5.
                if (i === 0) {
                    //const cellStems = row.insertCell();
                    //cellStems.contentEditable = true;
                    //cellStems.innerText = "25"; // Valor por defecto
                    //cellStems.style.textAlign = "center";
                    //cellStems.style.minWidth = "30px";
                    //cellStems.rowSpan = longColumns.length;
    
                    const cellVariety = row.insertCell();
                    cellVariety.innerText = varName;
                    cellVariety.style.textAlign = "center";
                    cellVariety.rowSpan = longColumns.length;
                    row.setAttribute("data-order", orderIndex);
                }
                // In each row (of the block) the cell is created to show the length
                const cellLong = row.insertCell();
                cellLong.innerText = longColumns[i];
                cellLong.style.textAlign = "center";
                cellLong.contentEditable = false;
                cellLong.setAttribute("data-col", "long");
    
                // --- Cells for box types are created ---
                // First for the REG group:
                boxTypes.forEach(type => {
                    const cell = row.insertCell();
                    cell.style.textAlign = "center";
                    cell.contentEditable = true; 
                    cell.innerText = "0";
                    cell.setAttribute("data-type", type);
                    cell.setAttribute("data-col", longColumns[i]); 
                    cell.setAttribute("data-category", "REG");
                });
            
                boxTypes.forEach(type => {
                    const cell = row.insertCell();
                    cell.style.textAlign = "center";
                    cell.contentEditable = true;
                    cell.innerText = "0";
                    cell.setAttribute("data-type", type);
                    cell.setAttribute("data-col", longColumns[i]);
                    cell.setAttribute("data-category", "WS10"); 
                });
            }
        });
    
        attachPackRateEvents();
    }

    /**
     * The function `generatePackRateMixTable` creates a table with specific rows and columns for
     * different bouquet types and lengths.
     * @returns The `generatePackRateMixTable` function is generating and populating a table with rows
     * containing information about different bouquets and their corresponding pack rates and lengths.
     * The function is not explicitly returning any value, but it is manipulating the DOM by populating
     * the table with the specified data.
     */
    function generatePackRateMixTable() {
        const table = document.getElementById("packrateMixTable");
        if (!table) return;
        const tbody = table.querySelector("tbody");
        tbody.innerHTML = ""; // Clears previous content
      
        //We define an array with the names of the editable columns.
        const editableCols = ["ARTIST", "CAYA", "JUNE", "NAVY", "ROSWiTHA"];
      
        // --- Auxiliary function to create a row ---
        function createRow(ramo, boxes, longVal) {
          const tr = document.createElement("tr");
          // Column BOUQUET
          const tdRamo = document.createElement("td");
          tdRamo.innerText = ramo;
          tr.appendChild(tdRamo);
          // Column PACKRATE MIX BOXES
          const tdBoxes = document.createElement("td");
          tdBoxes.innerText = boxes;
          tr.appendChild(tdBoxes);
          // Columna LONG
          const tdLong = document.createElement("td");
          tdLong.innerText = longVal;
          tr.appendChild(tdLong);
          // Columns editables
          editableCols.forEach(colName => {
            const td = document.createElement("td");
            td.contentEditable = true;
            td.innerText = ""; 
            tr.appendChild(td);
          });
          return tr;
        }
      
        // --- Generate rows as indicated ---
      
        // 1. For BOUQUE “TJ”: 8 rows with LONG = 60
        for (let i = 1; i <= 8; i++) {
          tbody.appendChild(createRow("TJ", "Smart MIX TJ " + i, "60"));
        }
        // 2. For BOUQUET "TJ": 8 rows with LONG = 55
        for (let i = 1; i <= 8; i++) {
          tbody.appendChild(createRow("TJ", "Smart MIX TJ " + i, "55"));
        }
        // 3. For BOUQUET "NF": 8 rows with LONG = 55
        for (let i = 1; i <= 8; i++) {
          tbody.appendChild(createRow("NF", "Smart MIX NF " + i, "55"));
        }
        // 4. For BOUQUET "NF": 8 rows with LONG = 50
        for (let i = 1; i <= 8; i++) {
          tbody.appendChild(createRow("NF", "Smart MIX NF " + i, "50"));
        }
        // 5. For BOUQUET "REG": 3 rows for LONG = 60 (HB, QB, EB)
        const regTypes = ["HB", "QB", "EB"];
        regTypes.forEach(type => {
          tbody.appendChild(createRow("REG", "Smart MIX " + type, "60"));
        });
        // 6. for BOUQUET "REG": 3 rows for LONG = 55
        regTypes.forEach(type => {
          tbody.appendChild(createRow("REG", "Smart MIX " + type, "55"));
        });
        // 7. for BOUQUET "REG": 3 rows for LONG = 50
        regTypes.forEach(type => {
          tbody.appendChild(createRow("REG", "Smart MIX " + type, "50"));
        });
        // 8. for BOUQUET "WS10": 3 rows for each LONG (60, 55, 50) – Total 9 rows.
        const ws10Types = ["HB", "QB", "EB"];
        [60, 55, 50].forEach(longVal => {
          ws10Types.forEach(type => {
            tbody.appendChild(createRow("WS10", "Smart MIX WS10 " + type, longVal.toString()));
          });
        });
    }
      
    /**
     * The function `createBoxSelect` generates a select element with options for packrate mix boxes,
     * allowing for a default selected value to be specified.
     * @param [selectedValue] - The `selectedValue` parameter in the `createBoxSelect` function is used
     * to specify a default value that should be pre-selected in the dropdown select box. If a
     * `selectedValue` is provided when calling the function, the corresponding option in the dropdown
     * will be marked as selected. If no `
     * @returns The `createBoxSelect` function returns a `<select>` element with options for packrate
     * mix boxes. The selected option will be set based on the `selectedValue` parameter passed to the
     * function.
     */
    function createBoxSelect(selectedValue = "") {
        const select = document.createElement("select");
        select.classList.add("form-select", "form-select-sm");
        // Example of options to packrate mix boxes
        const packrateMixBoxes = [
          "Smart MIX TJ 1", "Smart MIX TJ 2", "Smart MIX TJ 3", "Smart MIX TJ 4",
          "Smart MIX TJ 5", "Smart MIX TJ 6", "Smart MIX TJ 7", "Smart MIX TJ 8",
          "Smart MIX NF 1", "Smart MIX NF 2", "Smart MIX NF 3", "Smart MIX NF 4",
          "Smart MIX NF 5", "Smart MIX NF 6", "Smart MIX NF 7", "Smart MIX NF 8",
          "Smart MIX WS10 HB", "Smart MIX WS10 QB", "Smart MIX WS10 EB"
        ];
        // Empty option
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.text = "Seleccione BOX";
        select.appendChild(emptyOption);
        packrateMixBoxes.forEach(function(box) {
          const option = document.createElement("option");
          option.value = box;
          option.text = box;
          if (box === selectedValue) {
            option.selected = true;
          }
          select.appendChild(option);
        });
        return select;
    }
      

    /**
     * The function `createEmpaqueMixGroupFixed` generates a group of rows with fixed values for
     * certain columns in a table, allowing for editing of specific fields within the group.
     * @param [data] - The `createEmpaqueMixGroupFixed` function you provided is used to dynamically
     * create a group of rows in a table based on the given data. The function creates a group with a
     * fixed set of varieties ("ARTIST", "CAYA", "JUNE", "NAVY", "RO
     */
    function createEmpaqueMixGroupFixed(data = {}) {
        // Fixed values for column VARIETY
        const fixedVarieties = ["ARTIST", "CAYA", "JUNE", "NAVY", "ROSWITHA"];
        
        // Assigns a unique ID to the group
        const groupId = "empaqueMixGroup-" + (empaqueMixGroupIdCounter++);
        const tbody = document.querySelector("#empaqueMixTable tbody");
        
        // --- Create the header row (first row of the group) --- ---
        const trHeader = document.createElement("tr");
        trHeader.setAttribute("data-group-id", groupId);
        
        // BOX column (first) with rowspan=5
        const tdBox = document.createElement("td");
        tdBox.rowSpan = 5;  
        tdBox.appendChild(createBoxSelect(data.box || ""));
        trHeader.appendChild(tdBox);
        
        // Column #BOXES (second) with rowspan=5
        const tdNumBoxes = document.createElement("td");
        tdNumBoxes.rowSpan = 5;
        tdNumBoxes.contentEditable = true;
        tdNumBoxes.innerText = data.numBoxes || "";
        trHeader.appendChild(tdNumBoxes);
        
        // VARIETY column for the first row: assign fixedVarieties[0] (“artist”)
        const tdVariety = document.createElement("td");
        tdVariety.innerText = fixedVarieties[0];
        trHeader.appendChild(tdVariety);
        
        // BUNCHES/BOX column for the first row
        const tdBunches = document.createElement("td");
        tdBunches.contentEditable = true;
        tdBunches.innerText = (data.bunchesPerBox && data.bunchesPerBox[0]) ? data.bunchesPerBox[0] : "";
        trHeader.appendChild(tdBunches);
        
        // Column ACTIONS with rowspan=5
        const tdActions = document.createElement("td");
        tdActions.rowSpan = 5; 
        tdActions.classList.add("text-center");
        
        // Button to delete the entire group
        const deleteGroupBtn = document.createElement("button");
        deleteGroupBtn.innerHTML = '<i class="fa fa-trash"></i>';
        deleteGroupBtn.classList.add("btn", "btn-danger", "btn-sm");
        deleteGroupBtn.title = "Eliminar grupo completo";
        deleteGroupBtn.addEventListener("click", (e) => {
          e.preventDefault();
          // Deletes all rows with the same groupId
          const groupRows = tbody.querySelectorAll(`tr[data-group-id="${groupId}"]`);
          groupRows.forEach(row => row.remove());
        });
        tdActions.appendChild(deleteGroupBtn);
        trHeader.appendChild(tdActions);
        
        // Add header row to tbody
        tbody.appendChild(trHeader);
        
        // --- Create the remaining 4 sub rows (to complete the 5 rows) --- ---
        for (let i = 1; i < 5; i++) {
          const tr = document.createElement("tr");
          tr.setAttribute("data-group-id", groupId);
          
          // In these subrows the columns BOX, #BOXES and ACTIONS are not created (since they were merged).
          
          // VARIETY column: assigns the corresponding fixed value
          const tdVar = document.createElement("td");
          tdVar.innerText = fixedVarieties[i];
          tr.appendChild(tdVar);
          
          // BUNCHES/BOX column: editable
          const tdBunch = document.createElement("td");
          tdBunch.contentEditable = true;
          tdBunch.innerText = (data.bunchesPerBox && data.bunchesPerBox[i]) ? data.bunchesPerBox[i] : "";
          tr.appendChild(tdBunch);
          
          // (The ACTIONS column is not added in these subrows)
          tbody.appendChild(tr);
        }
    }
      
      

    /**
     * The function `resetEmpaqueMixTable` clears the content of the table body with the id
     * "empaqueMixTable".
     */
    function resetEmpaqueMixTable() {
        const tbody = document.querySelector("#empaqueMixTable tbody");
        tbody.innerHTML = "";
    }
      
      
      

    // Function to render the table from the blocks obtained from Firebase.
    function renderPackRateBlocks(blocks) {
        const packrateTable = document.getElementById("packrateTable");
        if (!packrateTable) return;
      
        const tBody = packrateTable.querySelector("tbody");
        tBody.innerHTML = "";
      
        // Define the lengths and types of boxes to be used
        const longColumns = [70, 60, 55, 50, 40];
        const boxTypes = ["HB", "QB", "EB"];
      
        // Create an array with all the varieties defined in varietyOptions
        let allVarieties = [];
        Object.keys(varietyOptions).forEach(tipo => {
          allVarieties = allVarieties.concat(varietyOptions[tipo]);
        });
      
        // We sort the blocks by 'order' (if any)
        blocks.sort((a, b) => {
          if (a.order === undefined || b.order === undefined) return 0;
          return a.order - b.order;
        });
      
        // For each block (corresponding to a variety), 5 rows are created (one for each length).
        blocks.forEach(block => {
          const groupId = block.groupId;
          for (let i = 0; i < longColumns.length; i++) {
            const row = tBody.insertRow();
            if (groupId) {
              row.setAttribute("data-group-id", groupId);
            }
            if (i === 0) {
              // In the first row of the block the cell that will show the variety is inserted.
              const cellVariety = row.insertCell();
              // If block.variety is a number (e.g. 70) or is empty, we use the “order” index
              // to get the correct variety from allVarieties.
              let varietyName = "";
              if (block.variety && isNaN(block.variety)) {
                varietyName = block.variety;
              } else {
                varietyName = allVarieties[block.order] || "";
              }
              cellVariety.innerText = varietyName;
              cellVariety.style.textAlign = "center";
              cellVariety.rowSpan = longColumns.length;
              if (block.order !== undefined) {
                row.setAttribute("data-order", block.order);
              }
            }
            // Cell for long 
            const cellLong = row.insertCell();
            cellLong.innerText = longColumns[i];
            cellLong.style.textAlign = "center";
            cellLong.contentEditable = false;
            cellLong.setAttribute("data-col", "long");
      
            // Cell for REG
            boxTypes.forEach(type => {
              const cell = row.insertCell();
              cell.style.textAlign = "center";
              cell.contentEditable = true;
              let value = "0";
              if (
                block.cajas &&
                block.cajas.REG &&
                block.cajas.REG[type] &&
                block.cajas.REG[type][longColumns[i]] !== undefined
              ) {
                value = block.cajas.REG[type][longColumns[i]].toString();
              }
              cell.innerText = value;
              cell.setAttribute("data-type", type);
              cell.setAttribute("data-col", longColumns[i]);
              cell.setAttribute("data-category", "REG");
            });
            // Cell for ws10
            boxTypes.forEach(type => {
              const cell = row.insertCell();
              cell.style.textAlign = "center";
              cell.contentEditable = true;
              let value = "0";
              if (
                block.cajas &&
                block.cajas.WS10 &&
                block.cajas.WS10[type] &&
                block.cajas.WS10[type][longColumns[i]] !== undefined
              ) {
                value = block.cajas.WS10[type][longColumns[i]].toString();
              }
              cell.innerText = value;
              cell.setAttribute("data-type", type);
              cell.setAttribute("data-col", longColumns[i]);
              cell.setAttribute("data-category", "WS10");
            });
          }
        });
      
        attachPackRateEvents();
        updateAllCalculations();
    }
      
    // Function that extracts the data from the table (assuming blocks of 6 rows).
    // The offset is corrected: the first row of the block has 7 cells and the rest 5.
    function extractPackRateData() {
        const packrateTable = document.getElementById("packrateTable");
        if (!packrateTable) return null;
        const tBody = packrateTable.querySelector("tbody");
        if (!tBody) return null;
        const rows = Array.from(tBody.querySelectorAll("tr"));
        const blocks = [];
        const longColumns = [70, 60, 55, 50, 40];
        const boxTypes = ["HB", "QB", "EB"];
        
        // Each block is made up of 5 rows
        for (let i = 0; i < rows.length; i += 5) {
            const blockRows = rows.slice(i, i + 5);
            if (blockRows.length < 5) break; 
            
            const firstRow = blockRows[0];
            // Now, in firstRow:
            // cell[0] contains the Variety name (since STEMS was removed).
            // cell[1] contains the value of Long (for the first row)
            const varietyCell = firstRow.cells[0];
            const variety = varietyCell ? varietyCell.innerText.trim() : "";
            const order = firstRow.getAttribute("data-order") || null;
            const groupId = firstRow.getAttribute("data-group-id") || null;
            
            // Extract the value of Long from the first row
            const longValue = parseInt(firstRow.cells[1].innerText.trim()) || 0;
        
            // Initialize the object “boxes” for REG and WS10
            const cajas = {
                REG: { HB: {}, QB: {}, EB: {} },
                WS10: { HB: {}, QB: {}, EB: {} }
            };
        
            // Iterate over the 5 rows (each row represents a length)
            for (let j = 0; j < blockRows.length; j++) {
                const currentRow = blockRows[j];
                let currentLong;
                if (j === 0) {
                    // In the first row, we already have long in cell[1].
                    currentLong = longValue;
                } else {
                    // In subsequent rows, cell 0 is Long
                    currentLong = parseInt(currentRow.cells[0].innerText.trim()) || 0;
                }
                // For REG and WS10:
                // In the first row: 
                // - REG values are in cells [2], [3] and [4].
                // - WS10 values are in cells [5], [6] and [7] // In subsequent rows: // - REG values are in cells [2], [3] and [4].
                // In subsequent rows:
                // - REG values are in cells [1], [2] and [3].
                // - WS10 values are in cells [4], [5] and [6] // - WS10 values are in cells [4], [5] and [6].
                const regStartIndex = (j === 0) ? 2 : 1;
                const ws10StartIndex = (j === 0) ? 5 : 4;
                boxTypes.forEach((type, k) => {
                    // Extract REG
                    const cellREG = currentRow.cells[regStartIndex + k];
                    const regValue = cellREG ? cellREG.innerText.trim() : "0";
                    cajas.REG[type][currentLong] = regValue;
                    // Extract WS10
                    const cellWS10 = currentRow.cells[ws10StartIndex + k];
                    const ws10Value = cellWS10 ? cellWS10.innerText.trim() : "0";
                    cajas.WS10[type][currentLong] = ws10Value;
                });
            }
        
            const blockObj = {
                groupId: groupId,
                variety: variety,
                order: order,
                cajas: cajas
            };
        
            blocks.push(blockObj);
        }
        console.log("Datos extraídos para PackRate:", JSON.stringify(blocks, null, 2));
        return blocks;
    }
    
    /**
     * The function `extractInventarioData` retrieves data from a table, extracting variety, type of
     * ramo, length, and total bunches for each row.
     * @returns The function `extractInventarioData` returns an array of objects, where each object
     * represents a row of data extracted from a table with the id 'dataTable'. Each object in the
     * array contains the following properties:
     * - `variety`: The variety value extracted from the row.
     * - `tipoRamo`: The value of the select element with the label "TJ - REG" extracted from the row
     */
    function extractInventarioData() {
        const table = document.getElementById('dataTable');
        if (!table) return [];
    
        const rows = table.querySelectorAll('tbody tr');
        const result = [];
    
        rows.forEach(row => {
            const groupId = row.getAttribute('data-group-id');
            if (!groupId) return;
    
            // We detect if it is a main row or a subrow.
            const isMainRow = row.cells[0]?.getAttribute('data-col') === 'Variety';
    
            let variety = "";
            let tipoRamo = ""; // Value of the select “TJ - REG”.
    
            if (isMainRow) {
                // For the main row: we obtain the variety and type of the same row
                variety = row.cells[0]?.querySelector('select')?.value || '';
                const tjRegSelect = row.querySelector('td[data-col="TJ - REG"] select');
                tipoRamo = tjRegSelect ? tjRegSelect.value : '';
            } else {
                // For subrow: we try to get the select “TJ - REG” of this same row
                const tjRegSelect = row.querySelector('td[data-col="TJ - REG"] select');
                if (tjRegSelect) {
                    tipoRamo = tjRegSelect.value;
                } else {
                    // If not found, you can choose to get it from the main row (as fallback).
                    const mainRow = document.querySelector(`tr[data-group-id="${groupId}"]`);
                    tipoRamo = mainRow ? (mainRow.querySelector('td[data-col="TJ - REG"] select')?.value || '') : '';
                }
                // The variety is probably not in the subrow (due to rowspan) and is obtained from the main row.
                const mainRow = document.querySelector(`tr[data-group-id="${groupId}"]`);
                variety = mainRow ? (mainRow.cells[0]?.querySelector('select')?.value || '') : '';
            }
    
            // The value of “Long” is obtained
            const longCell = row.querySelector('td[data-col="Long"]');
            const longVal = longCell ? longCell.innerText.trim() : '';
    
            // The value of “Bunches Total” is extracted.
            const bunchesTotalCell = row.querySelector('td[data-col="Bunches Total"]');
            const bunchesTotal = bunchesTotalCell
                ? parseInt(bunchesTotalCell.innerText.trim()) || 0
                : 0;
    
            // Only added if all three values exist
            if (variety && tipoRamo && longVal) {
                result.push({
                    variety: variety,
                    tipoRamo: tipoRamo,
                    long: longVal,
                    bunchesTotal: bunchesTotal
                });
            }
        });
    
        return result;
    }
    
    
    /**
     * The function `extractInventarioDataSummarized` processes raw inventory data to summarize and
     * group it by variety, type of branch, and length, calculating the total number of bunches for
     * each unique combination.
     * @returns The function `extractInventarioDataSummarized()` is returning an array of objects that
     * contain summarized data from the raw inventory data. Each object in the array represents a
     * unique combination of variety, tipoRamo, and long values from the raw data. The object includes
     * the variety, tipoRamo, long, and the total number of bunches for that specific combination.
     */
    function extractInventarioDataSummarized() {
        const rawData = extractInventarioData(); 
        const mapKeyed = {};
    
        rawData.forEach(item => {
            // The key is constructed: VARIETY_TIPODERAMO_LONG (e.g. ARTIST_WS10_60)
            const key = `${item.variety.toUpperCase()}_${item.tipoRamo.toUpperCase()}_${item.long}`;
    
            if (!mapKeyed[key]) {
                mapKeyed[key] = {
                    variety: item.variety,
                    tipoRamo: item.tipoRamo,
                    long: item.long,
                    bunchesTotal: 0
                };
            }
            mapKeyed[key].bunchesTotal += item.bunchesTotal;
        });
    
        return Object.values(mapKeyed);
    }
    
        
    /**
     * The function `saveInventarioDataToFirebase` saves summarized inventory data to Firebase by
     * sending each item separately via a POST request.
     * @returns The `saveInventarioDataToFirebase` function is an asynchronous function that saves
     * summarized inventory data to Firebase. It first extracts the summarized inventory data, then
     * checks if there are any rows in the data array. If there are no rows, it shows a warning alert
     * and returns early.
     */
    async function saveInventarioDataToFirebase() {
        const dataArray = extractInventarioDataSummarized();
        if (!dataArray.length) {
            showAlert("No hay filas en la tabla de Inventario para guardar.", "warning");
            return;
        }
    
        try {
            // We ship each item separately
            for (const item of dataArray) {
                const response = await fetch('/api/inventario', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(item)
                });
                if (!response.ok) {
                    console.error('Error guardando item inventario:', item);
                }
            }
            showAlert("Datos guardados.", "success");
        } catch (error) {
            console.error("Error al guardar inventario en Firebase:", error);
            showAlert("Error al guardar inventario en Firebase.", "danger");
        }
    }
    

    const saveInventarioFirebaseBtn = document.getElementById('saveInventarioFirebaseBtn');
    if (saveInventarioFirebaseBtn) {
    saveInventarioFirebaseBtn.addEventListener('click', () => {
        saveInventarioDataToFirebase();
    });
    }

    // Function to save the data in Firebase without rebuilding the whole table.
    // If a new document is created (without groupId), the data-group-id attribute is updated.
    async function savePackRateData() {
        const blocks = extractPackRateData();
        if (!blocks || blocks.length === 0) {
            showAlert("No se encontró información en la tabla PackRate.", "warning");
            return;
        }
        try {
            for (const block of blocks) {
                const response = await fetch('/api/packrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(block)
                });
                if (response.ok) {
                    const result = await response.json();
                    // If Firebase returns an ID and no groupId has been assigned in the table yet,
                    // it is assigned to all rows in the block.
                    if (result.id && !block.groupId) {
                        const tBody = document.getElementById("packrateTable").querySelector("tbody");
                        const rows = Array.from(tBody.querySelectorAll("tr"));
                        // Iterate in blocks of 5 rows
                        for (let i = 0; i < rows.length; i += 5) {
                            const firstRow = rows[i];
                            const varietyCell = firstRow.cells[1];
                            const orderAttr = firstRow.getAttribute("data-order");
                            if (varietyCell &&
                                varietyCell.innerText.trim() === block.variety &&
                                orderAttr == block.order) {
                                // Assign groupId to all rows in the block
                                for (let j = i; j < i + 5; j++) {
                                    rows[j].setAttribute("data-group-id", result.id);
                                }
                                break;
                            }
                        }
                    }
                } else {
                    const errorData = await response.json();
                    console.error("Error guardando bloque PackRate:", errorData);
                }
            }
            showAlert("Datos de PackRate guardados en Firebase.", "success");
        } catch (error) {
            console.error("Error en savePackRateData:", error);
            showAlert("Error al guardar PackRate en Firebase.", "danger");
        }
    }

    // =============================================================
    // EVENTS AND FIELD RECOMPUTATION (STEMS)
    // =============================================================

    // Button to save
    const savePackRateBtn = document.getElementById('savePackRateBtn');
    if (savePackRateBtn) {
    savePackRateBtn.addEventListener('click', async () => {
        savePackRateBtn.disabled = true;
        await savePackRateData();
        savePackRateBtn.disabled = false;
    });
    }

    // Example of function to assign events to all cells (REG and WS10)
    function attachPackRateEvents() {
        const packrateTable = document.getElementById("packrateTable");
        if (!packrateTable) return;
        const rows = packrateTable.querySelectorAll("tbody tr");
        const totalRows = rows.length;
        // Each block consists of 5 rows
        for (let i = 0; i < totalRows; i += 5) {
            const blockFirstRow = rows[i];
            // IMPORTANT: NO event listener is assigned to blockFirstRow.cells[0] (Variety)
            // We assign listeners to the other cells in the block.
            for (let j = 0; j < 5; j++) {
                const row = rows[i + j];
                let startIndexREG, startIndexWS10;
                if (j === 0) {
                    // For the first row of the block:
                    // cell[0]: Variety, cell[1]: Long, cells[2–4]: REG, cells[5–7]: WS10
                    startIndexREG = 2;
                    startIndexWS10 = 5;
                } else {
                    // For subsequent rows:
                    // cell[0]: Long, cells[1–3]: REG, cells[4–6]: WS10
                    startIndexREG = 1;
                    startIndexWS10 = 4;
                }
                // We assign the listener “input” to each cell of REG and WS10.
                for (let k = 0; k < 3; k++) {
                    const cellREG = row.cells[startIndexREG + k];
                    if (cellREG) {
                        cellREG.addEventListener("input", () => {
                            recalcPackRateRow(blockFirstRow);
                        });
                    }
                    const cellWS10 = row.cells[startIndexWS10 + k];
                    if (cellWS10) {
                        cellWS10.addEventListener("input", () => {
                            recalcPackRateRow(blockFirstRow);
                        });
                    }
                }
            }
        }
    }
    
    /**
     * Recalculates the STEMS values in the Pack Rate table.
     * @param {HTMLElement} rowBoxes - The row containing the box cells.
     * @param {HTMLElement} rowStems - The row containing the STEMS cells.
     * @param {HTMLElement} firstRow - The main row of the block (HB).
     */
    function recalcPackRateRow(firstRow) {
        // We obtain the container (tbody) and determine the 5 rows of the block
        const tbody = firstRow.parentElement;
        const allRows = Array.from(tbody.querySelectorAll("tr"));
        const startIndex = allRows.indexOf(firstRow);
        const blockRows = allRows.slice(startIndex, startIndex + 5);
    
        let totalStems = 0;
        const boxTypesCount = 3; // Three columns for REG y three for WS10
    
        // For the first row of the block:
        // Structure: cell[0]=Variety, cell[1]=Long, cells[2-4]=REG, cells[5-7]=WS10.
        {
            let rowTotal = 0;
            // Add values of REG (cells 2, 3, 4)
            for (let k = 0; k < boxTypesCount; k++) {
                const cellREG = firstRow.cells[2 + k];
                rowTotal += cellREG ? (parseFloat(cellREG.innerText.trim()) || 0) : 0;
            }
            // Add values of WS10 (cells 5, 6, 7)
            for (let k = 0; k < boxTypesCount; k++) {
                const cellWS10 = firstRow.cells[5 + k];
                rowTotal += cellWS10 ? (parseFloat(cellWS10.innerText.trim()) || 0) : 0;
            }
            totalStems += rowTotal;
        }
    
        // For rows 2 to 5 of the block:
        // Estructure: cell[0]=Long, cells[1-3]=REG, cells[4-6]=WS10.
        for (let i = 1; i < blockRows.length; i++) {
            const row = blockRows[i];
            let rowTotal = 0;
            // Add values of REG (cells 1, 2, 3)
            for (let k = 0; k < boxTypesCount; k++) {
                const cellREG = row.cells[1 + k];
                rowTotal += cellREG ? (parseFloat(cellREG.innerText.trim()) || 0) : 0;
            }
            // Add values from WS10 (cells 4, 5, 6)
            for (let k = 0; k < boxTypesCount; k++) {
                const cellWS10 = row.cells[4 + k];
                rowTotal += cellWS10 ? (parseFloat(cellWS10.innerText.trim()) || 0) : 0;
            }
            totalStems += rowTotal;
        }
    }

    /**
     * Gets the value of stems per box from packRateData,
     * according to variety, bunch category (e.g. “REG” or “WS10”),
     * box type (e.g. “HB”, “QB”, “EB”) and length.
     */
    function getPackRateStems(varietyName, bouquetCategory, boxType, longValue) {
        if (!packRateData || packRateData.length === 0) {
            console.warn("packRateData está vacío o no está definido.");
            return 0;
        }
        // Search for the block corresponding to the variety (case insensitive)
        const block = packRateData.find(b => (b.variety || '').toUpperCase() === varietyName.toUpperCase());
        if (!block) {
            console.warn(`Variedad "${varietyName}" no encontrada en packRateData.`);
            return 0;
        }
        // Verify that the requested category and type exists in the block
        if (!block.cajas ||
            !block.cajas[bouquetCategory] ||
            !block.cajas[bouquetCategory][boxType] ||
            block.cajas[bouquetCategory][boxType][longValue] === undefined) {
            console.warn(`No se encontraron datos para ${boxType} en longitud ${longValue} en la categoría "${bouquetCategory}".`);
            return 0;
        }
        const stemsStr = block.cajas[bouquetCategory][boxType][longValue];
        const stems = parseFloat(stemsStr);
        if (isNaN(stems)) {
            console.warn(`Valor de stems inválido para ${boxType} en longitud ${longValue} y categoría "${bouquetCategory}":`, stemsStr);
            return 0;
        }
        return stems;
    }

    // Button to update the Total Available in Pack table
    const updateTableBtn = document.getElementById('updateTableBtn');
    if (updateTableBtn) {
        updateTableBtn.addEventListener('click', async () => {
            console.log('Botón "Actualizar la Tabla" presionado.');
            await updateTotalDisponible();
        });
    } else {
        console.error('No se encontró el botón con id "updateTableBtn".');
    }

    // Function to reset the packing table
    function resetEmpaqueTable() {
        if (confirm('¿Estás seguro de que deseas eliminar TODOS los grupos de Empaque? Esta acción no se puede deshacer.')) {
            const empaqueTableBody = document.querySelector('#empaqueTable tbody');
            if (empaqueTableBody) {
                empaqueTableBody.innerHTML = ''; 
            }

            // Delete Packing data stored in localStorage
            localStorage.removeItem('empaqueData');
            localStorage.removeItem('empaqueLockedGroups');

            // Update summary tables if they exist (adjust according to your implementation)
            // For example, if you have specific summary tables for Empaque, limit them here.
            // If the summary tables for Packing are integrated in populateSummaryTables, simply call it
            populateSummaryTables();

            // Update the Grand Total if necessary
            updateGrandTotal();

            // Show a confirmation alert
            showAlert('Todos los grupos de Empaque han sido eliminados.', 'warning');
        }
    }

    // Assign the event listener to the reset button Packing
    const resetEmpaqueTableBtn = document.getElementById('resetEmpaqueTableBtn');
    if (resetEmpaqueTableBtn) {
        resetEmpaqueTableBtn.addEventListener('click', resetEmpaqueTable);
    } else {
        console.error('No se encontró el botón con id "resetEmpaqueTableBtn".');
    }

    /*************************************************************
     
     *************************************************************/
    /**
     * The function `updateTotalDisponible` processes data from a table, makes API calls to update
     * availability information, and updates the interface accordingly.
     * @returns The `updateTotalDisponible` function is an asynchronous function that updates the total
     * available quantity for different groups based on the data in a table. It performs the following
     * steps:
     */
    async function updateTotalDisponible() {
        // 1. Select Packing table
        const empaqueTable = document.querySelector('#empaqueTable');
        if (!empaqueTable) {
            showAlert('No se encontró la tabla de Empaque.', 'danger');
            return;
        }
        
        const empaqueTableBody = empaqueTable.querySelector('tbody');
        if (!empaqueTableBody) {
            showAlert('No se encontró el cuerpo de la tabla de Empaque.', 'danger');
            return;
        }
        
        // 2. Obtain blocked groups
        const lockedGroups = JSON.parse(localStorage.getItem('empaqueLockedGroups')) || [];
        
        // 3. Traverse rows and group by groupId
        const rows = empaqueTableBody.querySelectorAll('tr');
        console.log(`Número de filas encontradas: ${rows.length}`);
        
        const groups = {}; 
        // Structure: 
        // groups[groupId] = { variety, typeBranch, long, totalPack, surplusCell, processCell, totalAvailableCell }
        
        rows.forEach(row => {
            const groupId = row.getAttribute("data-group-id");
            if (!groupId) return; 
            if (lockedGroups.includes(groupId)) return; 
        
            // Check if the group already exists in “groups”.
            if (!groups[groupId]) {
                // Take main cells
                const varietyCell           = row.querySelector('td[data-col="Variety"]');
                const tipoRamoCell         = row.querySelector('td[data-col="Tipo de Ramo"]');
                const longCell             = row.querySelector('td[data-col="Long"]');
                const totalEmpaqueCell     = row.querySelector('td[data-col="Total Empaque"]');
                const sobranteCell         = row.querySelector('td[data-col="Sobrante"]');
                const procesoCell          = row.querySelector('td[data-col="Proceso"]');
                const totalDisponibleCell  = row.querySelector('td[data-col="Total Disponible"]');
        
                // Obtain values
                const varietySelect = varietyCell.querySelector('select');
                const variety = varietySelect
                    ? varietySelect.value.trim()
                    : varietyCell.innerText.trim();
        
                const tipoRamoSelect = tipoRamoCell.querySelector('select');
                const tipoRamo = tipoRamoSelect
                    ? tipoRamoSelect.value.trim()
                    : tipoRamoCell.innerText.trim();
        
                const longInput = longCell.querySelector('[contenteditable="true"]');
                const longValue = longInput
                    ? longInput.innerText.trim()
                    : longCell.innerText.trim();
        
                const totalEmpaque = parseInt(totalEmpaqueCell.innerText.trim(), 10) || 0;
        
                groups[groupId] = {
                    variety,
                    tipoRamo,
                    long: longValue,
                    totalEmpaque,
                    sobranteCell,
                    procesoCell,
                    totalDisponibleCell
                };
            } else {
                // If it already exists, we accumulate the totalPackage for that group.
                const totalEmpaqueCell = row.querySelector('td[data-col="Total Empaque"]');
                const totalEmpaque = totalEmpaqueCell
                    ? parseInt(totalEmpaqueCell.innerText.trim(), 10) || 0
                    : 0;
                groups[groupId].totalEmpaque += totalEmpaque;
            }
        });
        
        console.log(`Grupos únicos a procesar (Ayer/Hoy): ${Object.keys(groups).length}`);
        
        if (Object.keys(groups).length === 0) {
            showAlert('No hay grupos válidos para actualizar (Ayer/Hoy).', 'warning');
            return;
        }
        
        // 4. Show spinner and disable button during operation
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'inline-block';
        }
        const updateTableBtn = document.getElementById('updateTableBtn');
        if (updateTableBtn) {
            updateTableBtn.disabled = true;
        }
        showAlert('Actualizando (disponible_ayer/disponible_hoy)...', 'info');
        
        try {
            // 5. Iterate each group and call the endpoint
            for (const [groupId, group] of Object.entries(groups)) {
                const {
                    variety,
                    tipoRamo,
                    long,
                    totalEmpaque,
                    sobranteCell,
                    procesoCell,
                    totalDisponibleCell
                } = group;
        
                // Validate that totalPackage is not negative
                if (totalEmpaque < 0) {
                    console.warn(`Total Empaque negativo para ${groupId}. Saltando actualización (Ayer/Hoy).`);
                    sobranteCell.innerText = '0';
                    procesoCell.innerText = '';
                    totalDisponibleCell.innerText = '0';
                    continue;
                }
        
                // Prepare the data to be sent
                const payload = { variety, tipoRamo, long, totalEmpaque };
        
                // Call to server
                const response = await fetch('/api/total-disponible', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
        
                if (response.ok) {
                    // Now the answer includes: surplus, bunchesTotal, availableYesterday, availableToday
                    const data = await response.json();
                    const { sobrante, bunchesTotal, disponibleAyer, disponibleHoy } = data;
        
                    // Update cells in the interface
                    if (typeof sobrante === 'number') {
                        sobranteCell.innerText = sobrante;
                    } else {
                        sobranteCell.innerText = '0';
                    }
                    
                    if (typeof bunchesTotal === 'number') {
                        procesoCell.innerText = bunchesTotal;
                    } else {
                        procesoCell.innerText = '';
                    }
        
                    // totalAvailable would now become “availableToday”.
                    if (typeof disponibleHoy === 'number') {
                        totalDisponibleCell.innerText = disponibleHoy;
                    } else {
                        totalDisponibleCell.innerText = '0';
                    }
                    
                    console.log(
                        `[${groupId}] Ayer: ${disponibleAyer}, Hoy: ${disponibleHoy}, sobrante: ${sobrante}, bTotal: ${bunchesTotal}`
                    );
        
                } else {
                    let errorMessage = 'Error desconocido (Ayer/Hoy).';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorMessage;
                    } catch (e) {
                        console.error('Error al parsear la respuesta de error (Ayer/Hoy):', e);
                    }
                    console.error(`Error en la actualización (Ayer/Hoy) para ${variety}, ${tipoRamo}, ${long}:`, errorMessage);
                    showAlert(
                        `Error al actualizar (disponible_ayer/disponible_hoy) para ${variety}, ${tipoRamo}, ${long}: ${errorMessage}`,
                        'danger'
                    );
                }
            }
            
            showAlert('(Ayer/Hoy) actualizados correctamente.', 'success');
        } catch (error) {
            console.error('Error en updateTotalDisponibleAyerHoy:', error);
            showAlert('Ocurrió un error al actualizar (Ayer/Hoy).', 'danger');
        } finally {
            // 6. Hiding the spinner and enabling the button
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
            if (updateTableBtn) {
                updateTableBtn.disabled = false;
            }
        }
    }
    
});
