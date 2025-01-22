document.addEventListener('DOMContentLoaded', () => {
    // ============================
    // Declaración de Variables
    // ============================
    const addGroupBtn = document.getElementById('addGroupBtn');
    const resetTableBtn = document.getElementById('resetTableBtn');
    const generateExcelBtn = document.getElementById('generateExcelBtn');
    const sendMailBtn = document.getElementById('sendMailBtn');
    const dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    const responsableInput = document.getElementById('responsable');
    const alertPlaceholder = document.getElementById('alertPlaceholder');

    // Secciones principales
    const inventarioSection = document.getElementById('inventarioSection');
    const empaqueSection = document.getElementById('empaqueSection');
    const packrateSection = document.getElementById('packrateSection');

    // Elementos del menú lateral
    const sidebarMenu = document.getElementById('sidebarMenu');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    // Botones del sidebar
    const inventarioBtn = document.getElementById('inventarioBtn');
    const empaqueBtn = document.getElementById('empaqueBtn');
    const packrateBtn = document.getElementById('packrateBtn');

    // Elementos para las tablas resumidas
    const toggleSummaryBtn = document.getElementById('toggleSummaryBtn');
    const summaryTablesContainer = document.getElementById('summaryTables');
    const summaryByLength = document.getElementById('summaryByLength').getElementsByTagName('tbody')[0];
    const summaryByBouquetType = document.getElementById('summaryByBouquetType').getElementsByTagName('tbody')[0];
    const summaryByBatch = document.getElementById('summaryByBatch').getElementsByTagName('tbody')[0];

    // Cargar config (si no existe, usa defaultConfig)
    let config = JSON.parse(localStorage.getItem('config')) || defaultConfig;

    // Opciones
    const longDefaults = [];
    const hypericumLongs = ['', ''];
    const tjRegOptions = ["TJ", "REG", "WS10", "NF"];

    // Variable global para guardar la configuración de PackRate (los "blocks") provenientes de Firebase
    let packRateData = [];


    // Campos de la tabla principal
    const fields = ["TJ - REG", "Long", "P1", "P2", "P3", "P4", "R1", "R2", "R3", "R4", "Bunches/Procona", "Bunches Total", "Stems", "Notas"];

    // Variedades
    const varietyOptions = {
        "VERONICA": ["ARTIST", "BIZARRE", "CAYA", "JUNE", "NAVY", "ROSWITHA"],
        "MENTHA": ["MENTHA", "MENTHA SPRAY"],
        "HYPERICUM": ["BELLIMO", "TANGO", "UNO"],
        "EUPATORIUM": ["MOMENTS", "PINK"],
        "PAPYRUS": ["MAXUS", "LUXUS"],
        "ORIGANUM": ["ORIGANUM"]
    };

    // ============================
    // Lógica de Menú Lateral
    // ============================

    // Botón para mostrar Inventario
    if (inventarioBtn) {
        inventarioBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Mostrar inventario
            if (inventarioSection) inventarioSection.style.display = 'block';
            // Ocultar empaque
            if (empaqueSection) empaqueSection.style.display = 'none';
            // Ocultar packrate
            if (packrateSection) packrateSection.style.display = 'none';
        });
    }

    // Botón para mostrar Empaque
    if (empaqueBtn) {
        empaqueBtn.addEventListener('click', async (e) => {
            e.preventDefault();
    
            // Si no hemos cargado packRateData, lo cargamos
            if (!packRateData || packRateData.length === 0) {
                await loadPackRateData();  // Esto llena packRateData con la info de Firebase
            }
    
            // Mostrar la sección de Empaque
            if (empaqueSection) empaqueSection.style.display = 'block';
            if (inventarioSection) inventarioSection.style.display = 'none';
            if (packrateSection) packrateSection.style.display = 'none';
        });
    }
    

    // Botón para mostrar Pack Rate
    if (packrateBtn) {
        packrateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Mostrar la sección de Pack Rate y ocultar las demás
            if (packrateSection) {
                packrateSection.style.display = 'block';
                // Llamar a la función para cargar los datos de Firebase
                loadPackRateData();
            }
            if (inventarioSection) inventarioSection.style.display = 'none';
            if (empaqueSection) empaqueSection.style.display = 'none';
        });
    }
    

    // ============================
    // Función para mostrar alertas
    // ============================
    function showAlert(message, type = 'success') {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show mt-2" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
        alertPlaceholder.append(wrapper);
        setTimeout(() => {
            wrapper.remove();
        }, 3000);
    }

    // Función para crear el select de Variety
    function createVarietySelect(selectedVariety = '') {
        const cell = document.createElement('td');
        cell.setAttribute('data-col', 'Variety');
        cell.setAttribute('tabindex', '0'); // Permitir que la celda reciba el foco

        const selectVariety = document.createElement('select');
        selectVariety.classList.add('form-select', 'form-select-sm');

        // Añadir una opción vacía
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.text = 'Seleccione Variety';
        selectVariety.appendChild(emptyOption);

        // Agregar las opciones de Variety
        Object.keys(varietyOptions).forEach(tipo => {
            const optGroup = document.createElement('optgroup');
            optGroup.label = tipo;

            varietyOptions[tipo].forEach(variety => {
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

        // Event listener para actualizar "Tipo" al cambiar "Variety"
        selectVariety.addEventListener('change', () => {
            const row = getRowFromCell(selectVariety);
            const groupId = row.getAttribute('data-group-id');
            const selectedVariety = selectVariety.value;
            const selectedTipo = getTipoForVariety(selectedVariety);
            const tipoCell = row.querySelector('td[data-col="Tipo"]');
            if (tipoCell) {
                tipoCell.innerText = selectedTipo || '';
            }

            // Actualizar cálculos para todas las filas del grupo
            const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
            groupRows.forEach(groupRow => {
                updateCalculations(groupRow);
            });

            // Guardar los datos actuales
            saveTableData();

            // Manejar la adición o eliminación de filas extra si la categoría es HYPERICUM
            if (selectedTipo === 'HYPERICUM') {
                // Verificar cuántas filas tiene actualmente el grupo
                const currentGroupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                if (currentGroupRows.length < 5) {
                    // === Aquí se agregan automáticamente 2 filas extra para HYPERICUM ===
                    addExtraRows(groupId, 2, true);
                }
            } else {
                // Si no es HYPERICUM, asegurarse de que solo haya 3 filas
                const currentGroupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                if (currentGroupRows.length > 3) {
                    removeExtraRows(groupId, currentGroupRows.length - 3); // Eliminar filas extra
                }
            }

            // Actualizar las tablas resumidas
            populateSummaryTables();
            // Actualizar el Gran Total
            updateGrandTotal();
        });

        cell.appendChild(selectVariety);
        return cell;
    }

    // Función para obtener el Tipo basado en el Variety seleccionado
    function getTipoForVariety(selectedVariety) {
        for (const tipo in varietyOptions) {
            if (varietyOptions[tipo].includes(selectedVariety)) {
                return tipo;
            }
        }
        return '';
    }

    // Función para crear el select de TJ - REG - WS10 - NF
    function createTJRegSelect(selectedValue = 'REG') { // 'REG' por defecto
        const select = document.createElement('select');
        select.classList.add('form-select', 'form-select-sm');
        select.style.minWidth = '100px';

        tjRegOptions.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.text = optionValue;
            if (optionValue === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // Event listener para actualizar cálculos al cambiar el valor de "TJ - REG"
        select.addEventListener('change', () => {
            const row = getRowFromCell(select);
            updateCalculations(row);
            saveTableData();

            // Actualizar las tablas resumidas
            populateSummaryTables();
            // Actualizar el Gran Total
            updateGrandTotal();
        });

        return select;
    }

    // Función para obtener la fila desde una celda
    function getRowFromCell(cell) {
        return cell.closest('tr');
    }

    // Función para crear una celda editable
    function createEditableCell(colName, value = '', rowspan = 1) {
        const cell = document.createElement('td');
        cell.contentEditable = true;
        cell.classList.add('editable');
        cell.setAttribute('data-col', colName);
        cell.setAttribute('tabindex', '0'); // Permitir que la celda reciba el foco
        if (rowspan > 1) {
            cell.setAttribute('rowspan', rowspan);
        }
        cell.innerText = value;

        // Validación específica para el campo "Batch"
        if (colName === 'Batch') {
            cell.addEventListener('input', () => {
                // Convertir todo a mayúsculas
                let text = cell.innerText.toUpperCase();
                // Eliminar caracteres que no sean letras o números
                text = text.replace(/[^A-Z0-9]/gi, '');
                // Limitar a 3 caracteres
                if (text.length > 3) {
                    text = text.substring(0, 3);
                }
                cell.innerText = text;
        
                // Mover el cursor al final de la celda
                moveCursorToEnd(cell);
        
                // Guardar y actualizar todo lo demás
                saveTableData();
                populateSummaryTables();
            });        
        } else if (colName === 'Long') {
            // Añadir evento para limitar a 2 dígitos numéricos y mantener el cursor al final
            cell.addEventListener('input', () => {
                let value = cell.innerText.trim();
                // Eliminar cualquier carácter que no sea dígito
                value = value.replace(/\D/g, '');
                // Limitar a 2 dígitos
                if (value.length > 2) {
                    value = value.substring(0, 2);
                }
                if (cell.innerText.trim() !== value) {
                    cell.innerText = value;
                    moveCursorToEnd(cell);
                }

                updateCalculations(cell.parentElement);
                saveTableData();
                // Actualizar las tablas resumidas
                populateSummaryTables();
                // Actualizar el Gran Total
                updateGrandTotal();
            });
        } else {
            cell.addEventListener('input', () => {
                saveTableData();
                // Actualizar las tablas resumidas
                populateSummaryTables();
                // Actualizar el Gran Total
                updateGrandTotal();
            });
        }

        return cell;
    }

    // Función para mover el cursor al final de una celda
    function moveCursorToEnd(element) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    // Función para crear una celda de fecha con input visible
    function createDateCell(colName, value = '', rowspan = 1) {
        const cell = document.createElement('td');
        cell.setAttribute('data-col', colName);
        cell.setAttribute('tabindex', '0'); // Permitir que la celda reciba el foco
        if (rowspan > 1) {
            cell.setAttribute('rowspan', rowspan);
        }

        // Crear el input de tipo date
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.classList.add('form-control', 'form-control-sm');
        dateInput.value = value || new Date().toISOString().split('T')[0]; // Fecha actual si no se proporciona
        dateInput.addEventListener('change', () => updateFecha(dateInput));

        // Agregar el input al cell
        cell.appendChild(dateInput);

        // Event Listener para actualizar tablas resumidas al cambiar la fecha
        dateInput.addEventListener('change', () => {
            populateSummaryTables();
            saveTableData();
        });

        return cell;
    }

    // Función para activar el selector de fecha (no se elimina aunque no se use)
    function triggerDatePicker(btn) {
        const input = btn.parentElement.querySelector('input[type="date"]');
        if (input) {
            input.classList.remove('d-none'); 
            input.focus(); 
        }
    }

    // Función para manejar la selección de fecha
    function updateFecha(input) {
        // La fecha ya se guarda en localStorage con saveTableData()
        const selectedDate = input.value;
        // Lógica adicional si fuera necesaria
    }

    // Función para agregar celdas de datos a una fila
    function addDataCellsToRow(row, index, groupId, isMainRow = true, longsArray) {
        const fieldsToUse = fields;
    
        fieldsToUse.forEach((field) => {
            const cell = document.createElement('td');
            cell.classList.add('editable');
            cell.setAttribute('data-col', field);
            cell.setAttribute('tabindex', '0'); // Permitir que la celda reciba el foco
    
            // Aplicar estilos a las columnas P y R
            if (["P1", "P2", "P3", "P4"].includes(field)) {
                cell.style.backgroundColor = '#D9E1F2'; // Color para P
                cell.style.border = '1px solid black'; 
            } else if (["R1", "R2", "R3", "R4"].includes(field)) {
                cell.style.backgroundColor = '#FCE4D6'; // Color para R
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
                // Estas celdas se calculan automáticamente, así que no son editables
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
    
        // Añadir botón de eliminación SÓLO para subfilas (isMainRow = false)
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

    function removeSingleRow(row) {
        const groupId = row.getAttribute('data-group-id');
        const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
    
        // Verificar si el grupo tiene al menos 4 filas (3 mínimas + esta extra)
        if (groupRows.length <= 3) {
            showAlert('No se puede eliminar esta línea. El grupo debe tener al menos 3 filas.', 'warning');
            return;
        }
    
        row.remove();
    
        // Ajustar el rowspan de la primera fila (Variety, Tipo, Batch, etc.)
        const newRowSpan = parseInt(groupRows[0].querySelector('[rowspan]').getAttribute('rowspan')) - 1;
        groupRows[0].querySelectorAll('[rowspan]').forEach(cell => {
            cell.setAttribute('rowspan', newRowSpan);
        });
    
        // Guardar y recalcular
        saveTableData();
        updateAllCalculations(); 
        populateSummaryTables();
    
        showAlert('Línea eliminada correctamente.', 'success');
    }

    // Función para agregar un nuevo grupo con 3 líneas por defecto
    function addGroup() {
        const longsArray = longDefaults; 
        const numRows = 3;

        const groupId = Date.now();
        const mainRow = dataTable.insertRow();
        mainRow.setAttribute('data-group-id', groupId);

        // Crear celdas "Variety" y "Tipo" con rowspan
        const varietyCell = createVarietySelect();
        varietyCell.setAttribute('rowspan', numRows);
        mainRow.appendChild(varietyCell);

        const tipoCell = document.createElement('td');
        tipoCell.setAttribute('data-col', 'Tipo');
        tipoCell.setAttribute('rowspan', numRows);
        tipoCell.innerText = ''; 
        tipoCell.setAttribute('tabindex', '0'); 
        mainRow.appendChild(tipoCell);

        // Celda "Batch"
        const batchCell = createEditableCell('Batch', '', numRows);
        mainRow.appendChild(batchCell);

        // Celda "Fecha" con fecha actual
        const today = new Date().toISOString().split('T')[0]; 
        const fechaCell = createDateCell('Fecha', today, numRows);
        mainRow.appendChild(fechaCell);

        // Agregar celdas de datos para la primera fila
        addDataCellsToRow(mainRow, 0, groupId, true, longsArray);

        // Celda "Stems Total" con rowspan
        const stemsTotalCell = document.createElement('td');
        stemsTotalCell.setAttribute('rowspan', numRows);
        stemsTotalCell.classList.add('text-center');
        stemsTotalCell.setAttribute('data-col', 'Stems Total');
        stemsTotalCell.innerText = '';
        stemsTotalCell.setAttribute('tabindex', '0');

        // Insertar la celda de Stems Total antes de "Notas"
        const notasCell = mainRow.querySelector('td[data-col="Notas"]');
        const notasIndex = Array.prototype.indexOf.call(mainRow.cells, notasCell);
        mainRow.insertBefore(stemsTotalCell, mainRow.cells[notasIndex]);

        // Celda de Acciones con rowspan
        const actionCell = document.createElement('td');
        actionCell.setAttribute('rowspan', numRows);
        actionCell.classList.add('text-center');

        // Botón Eliminar Grupo
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.title = 'Eliminar grupo';

        const handleDelete = () => {
            if (confirm('¿Estás seguro de que deseas eliminar este grupo?')) {
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

        // Botón Agregar Línea (para grupos que NO sean HYPERICUM)
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

        // Agregar subfilas para completar las 3 filas
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

    function addGroupEmpaque() {
        const empaqueTableBody = document.querySelector('#empaqueTable tbody');
        const groupId = Date.now().toString(); // ID único para el grupo
        const numRows = 3; // Creamos un grupo de 3 filas
    
        // 1) --- Fila Principal ---
        const mainRow = empaqueTableBody.insertRow();
        mainRow.setAttribute('data-group-id', groupId);
    
        // (a) Columna 1: Variety (select), con rowSpan=3
        const varietyCell = document.createElement('td');
        varietyCell.rowSpan = numRows;
        const varietySelect = createVarietySelect(); // Tu función para crear el select de Variety
        varietyCell.appendChild(varietySelect);
        mainRow.appendChild(varietyCell);
    
        // (b) Columna 2: Tipo de Ramo (select) – sin rowSpan, aparecerá en cada fila
        const tipoCell = document.createElement('td');
        const tipoSelect = createTJRegSelect(); // Tu función para crear el select TJ - REG - WS10 - NF
        tipoCell.appendChild(tipoSelect);
        mainRow.appendChild(tipoCell);
    
        // (c) Columna 3: Long (editable) – sin rowSpan
        const longCell = document.createElement('td');
        longCell.contentEditable = true;
        longCell.innerText = '';
        mainRow.appendChild(longCell);
    
        // (d) Columna 4: Caja (select)
        const cajaCell = document.createElement('td');
        const cajaSelect = document.createElement('select');
        cajaSelect.classList.add('form-select', 'form-select-sm');
        ["HB", "QB", "EB"].forEach(optVal => {
          const opt = document.createElement('option');
          opt.value = optVal;
          opt.text = optVal;
          cajaSelect.appendChild(opt);
        });
        cajaCell.appendChild(cajaSelect);
        mainRow.appendChild(cajaCell);
    
        // (e) Columna 5: # Cajas (editable)
        const numCajasCell = document.createElement('td');
        numCajasCell.contentEditable = true;
        numCajasCell.innerText = '';
        mainRow.appendChild(numCajasCell);
    
        // (f) Columna 6: Total UND (NO editable)
        const totalUNDCell = document.createElement('td');
        totalUNDCell.innerText = '';
        mainRow.appendChild(totalUNDCell);
    
        // === LISTENERS en la PRIMERA FILA (mainRow) ===
        numCajasCell.addEventListener('input', () => {
          updateEmpaqueRow(mainRow);
          updateEmpaqueGroupTotal(groupId);
          saveEmpaqueGroupData();
        });
        cajaSelect.addEventListener('change', () => {
          updateEmpaqueRow(mainRow);
          updateEmpaqueGroupTotal(groupId);
          saveEmpaqueGroupData();
        });
        longCell.addEventListener('input', () => {
          updateEmpaqueRow(mainRow);
          updateEmpaqueGroupTotal(groupId);
          saveEmpaqueGroupData();
        });
        tipoSelect.addEventListener('change', () => {
          // Se actualiza “Total Empaque” a 0 (evita que aparezca 'REG')
          totalEmpaqueCell.innerText = '0';
          updateEmpaqueRow(mainRow);
          updateEmpaqueGroupTotal(groupId);
          saveEmpaqueGroupData();
        });
    
        // (g) Columna 7: Total Empaque (rowSpan=3)
        const totalEmpaqueCell = document.createElement('td');
        totalEmpaqueCell.rowSpan = numRows;
        totalEmpaqueCell.classList.add('text-center');
        // Inicia en 0, no en 'REG'
        totalEmpaqueCell.innerText = '0';
        mainRow.appendChild(totalEmpaqueCell);
    
        // (h) Columna 8: Sobrante (rowSpan=3)
        const sobranteCell = document.createElement('td');
        sobranteCell.rowSpan = numRows;
        sobranteCell.classList.add('text-center');
        sobranteCell.innerText = '';
        mainRow.appendChild(sobranteCell);
    
        // (i) Columna 9: Proceso (rowSpan=3, editable)
        const procesoCell = document.createElement('td');
        procesoCell.rowSpan = numRows;
        procesoCell.contentEditable = true;
        procesoCell.classList.add('text-center');
        // Opcional: inicia con el mismo valor que 'cajaSelect'
        procesoCell.innerText = cajaSelect.value || '';
        mainRow.appendChild(procesoCell);
    
        // (j) Columna 10: Total Sobrante Futuro (rowSpan=3)
        const totalSobranteFCell = document.createElement('td');
        totalSobranteFCell.rowSpan = numRows;
        totalSobranteFCell.classList.add('text-center');
        totalSobranteFCell.innerText = '';
        mainRow.appendChild(totalSobranteFCell);
    
        // (k) Columna 11: Acciones (rowSpan=3)
        const accionesCell = document.createElement('td');
        accionesCell.rowSpan = numRows;
        accionesCell.classList.add('text-center');
        const deleteGroupBtn = document.createElement('button');
        deleteGroupBtn.innerHTML = '<i class="fa fa-trash"></i>';
        deleteGroupBtn.classList.add('delete-btn');
        deleteGroupBtn.title = 'Eliminar grupo de Empaque';
        deleteGroupBtn.addEventListener('click', () => {
          if (confirm('¿Está seguro de eliminar este grupo de empaque?')) {
            const rowsToDelete = empaqueTableBody.querySelectorAll(`tr[data-group-id="${groupId}"]`);
            rowsToDelete.forEach(r => r.remove());
            saveEmpaqueGroupData();
            showAlert('Grupo de Empaque eliminado.', 'warning');
          }
        });
        accionesCell.appendChild(deleteGroupBtn);
        mainRow.appendChild(accionesCell);
    
        // 2) --- Creación de las SUBFILAS (filas 2 y 3) ---
        for (let i = 1; i < numRows; i++) {
          const subRow = empaqueTableBody.insertRow();
          subRow.setAttribute('data-group-id', groupId);
    
          // Columna: Tipo de Ramo (select)
          const subTipoCell = document.createElement('td');
          const subTipoSelect = createTJRegSelect();
          subTipoCell.appendChild(subTipoSelect);
          subRow.appendChild(subTipoCell);
    
          // Columna: Long (editable)
          const subLongCell = document.createElement('td');
          subLongCell.contentEditable = true;
          subLongCell.innerText = '';
          subRow.appendChild(subLongCell);
    
          // Columna: Caja (select)
          const subCajaCell = document.createElement('td');
          const subCajaSelect = document.createElement('select');
          subCajaSelect.classList.add('form-select', 'form-select-sm');
          ["HB", "QB", "EB"].forEach(optVal => {
            const opt = document.createElement('option');
            opt.value = optVal;
            opt.text = optVal;
            subCajaSelect.appendChild(opt);
          });
          subCajaCell.appendChild(subCajaSelect);
          subRow.appendChild(subCajaCell);
    
          // Columna: # Cajas (editable)
          const subNumCajasCell = document.createElement('td');
          subNumCajasCell.contentEditable = true;
          subNumCajasCell.innerText = '';
          subRow.appendChild(subNumCajasCell);
    
          // Columna: Total UND (NO editable)
          const subTotalUNDCell = document.createElement('td');
          subTotalUNDCell.innerText = '';
          subRow.appendChild(subTotalUNDCell);
    
          // === LISTENERS en las SUBFILAS (2.ª y 3.ª) ===
          subTipoSelect.addEventListener('change', () => {
            updateEmpaqueRow(subRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
          });
          subLongCell.addEventListener('input', () => {
            updateEmpaqueRow(subRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
          });
          subCajaSelect.addEventListener('change', () => {
            updateEmpaqueRow(subRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
          });
          subNumCajasCell.addEventListener('input', () => {
            updateEmpaqueRow(subRow);
            updateEmpaqueGroupTotal(groupId);
            saveEmpaqueGroupData();
          });
        }
    
        // 3) Guardamos en localStorage y mostramos alerta
        saveEmpaqueGroupData();
        showAlert('Grupo de Empaque agregado correctamente.', 'success');
    }
    
  
    
    
      
        
    // =====================
    // Función para guardar datos del grupo de Empaque
    // =====================
    function saveEmpaqueGroupData() {
        const empaqueTableBody = document.querySelector('#empaqueTable tbody');
        const groups = {};
      
        Array.from(empaqueTableBody.rows).forEach(row => {
          const groupId = row.getAttribute('data-group-id');
          if (!groupId) return;
          groups[groupId] = {
            variety: row.cells[0].querySelector('select').value,
            tipoRamo: row.cells[1].querySelector('select').value,
            long: row.cells[2].innerText.trim(),
            caja: row.cells[3].querySelector('select').value,
            numCajas: row.cells[4].innerText.trim(),
            totalEmpaque: row.cells[5].innerText.trim(),
            sobrante: row.cells[6].innerText.trim(),
            proceso: row.cells[7].innerText.trim(),
            totalSobranteFuturo: row.cells[8].innerText.trim()
          };
        });
        
        localStorage.setItem('empaqueData', JSON.stringify(groups));
    }
      
    // =====================
    // Función para cargar la tabla de Empaque desde localStorage (opcional)
    // =====================
    function loadEmpaqueTableData() {
        const data = JSON.parse(localStorage.getItem('empaqueData')) || {};
        const empaqueTableBody = document.querySelector('#empaqueTable tbody');
        empaqueTableBody.innerHTML = '';
    
        // Recorremos cada groupId en el objeto data
        Object.keys(data).forEach(groupId => {
            const group = data[groupId];
    
            // Creamos la fila principal
            const row = empaqueTableBody.insertRow();
            row.setAttribute('data-group-id', groupId);
    
            // Col 1: Variety
            const varietyCell = document.createElement('td');
            varietyCell.rowSpan = 1; 
            varietyCell.classList.add('editable');
            const varietySelect = createVarietySelect(group.variety);
            varietyCell.appendChild(varietySelect);
            row.appendChild(varietyCell);
    
            // Col 2: Tipo de Ramo
            const tipoCell = document.createElement('td');
            const tipoSelect = createTJRegSelect(group.tipoRamo);
            tipoCell.appendChild(tipoSelect);
            row.appendChild(tipoCell);
    
            // Col 3: Long
            const longCell = document.createElement('td');
            longCell.contentEditable = true;
            longCell.setAttribute('data-col', 'Long');
            longCell.innerText = group.long;
            row.appendChild(longCell);
    
            // Col 4: Caja
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
            row.appendChild(cajaCell);
    
            // Col 5: # Cajas
            const numCajasCell = document.createElement('td');
            numCajasCell.contentEditable = true;
            numCajasCell.setAttribute('data-col', 'NumCajas');
            numCajasCell.innerText = group.numCajas;
            row.appendChild(numCajasCell);
    
            // Col 6: Total UND (NO editable)
            const totalUNDCell = document.createElement('td');
            totalUNDCell.setAttribute('data-col', 'Total UND');
            totalUNDCell.classList.add('text-center');
            totalUNDCell.innerText = ''; // Se recalcula abajo
            row.appendChild(totalUNDCell);
    
            // Col 7: Total Empaque
            const totalEmpaqueCell = document.createElement('td');
            totalEmpaqueCell.setAttribute('data-col', 'Total Empaque');
            totalEmpaqueCell.classList.add('text-center');
            totalEmpaqueCell.innerText = group.totalEmpaque || '0';
            row.appendChild(totalEmpaqueCell);
    
            // Col 8: Sobrante
            const sobranteCell = document.createElement('td');
            sobranteCell.setAttribute('data-col', 'Sobrante');
            sobranteCell.classList.add('text-center');
            sobranteCell.innerText = group.sobrante || '0';
            row.appendChild(sobranteCell);
    
            // Col 9: Proceso
            const procesoCell = document.createElement('td');
            procesoCell.contentEditable = true;
            procesoCell.setAttribute('data-col', 'Proceso');
            procesoCell.classList.add('text-center');
            procesoCell.innerText = group.proceso || '';
            row.appendChild(procesoCell);
    
            // Col 10: Total Sobrante Futuro
            const totalSobranteFCell = document.createElement('td');
            totalSobranteFCell.setAttribute('data-col', 'Total Sobrante Futuro');
            totalSobranteFCell.classList.add('text-center');
            totalSobranteFCell.innerText = group.totalSobranteFuturo || '0';
            row.appendChild(totalSobranteFCell);
    
            // Col 11: Acciones (botón eliminar grupo)
            const accionesCell = document.createElement('td');
            accionesCell.classList.add('text-center');
            const deleteGroupBtn = document.createElement('button');
            deleteGroupBtn.innerHTML = '<i class="fa fa-trash"></i>';
            deleteGroupBtn.classList.add('delete-btn');
            deleteGroupBtn.title = 'Eliminar grupo de Empaque';
            deleteGroupBtn.addEventListener('click', () => {
                if (confirm('¿Está seguro de eliminar este grupo de empaque?')) {
                    row.remove();
                    saveEmpaqueGroupData(); 
                    showAlert('Grupo de Empaque eliminado.', 'warning');
                }
            });
            accionesCell.appendChild(deleteGroupBtn);
            row.appendChild(accionesCell);
    
            // --------------------------------------
            // AHORA que la fila está completa,
            // recalculamos su "Total UND"
            updateEmpaqueRow(row);
            // y luego actualizamos la sumatoria "Total Empaque" del grupo
            updateEmpaqueGroupTotal(groupId);
            // --------------------------------------
        });
    }
    

    /**
     * Recalcula "Total UND" de una fila de Empaque,
     * según variety, tipoRamo, long, tipo de caja y #cajas.
     */
    function updateEmpaqueRow(row) {
        // 1) Obtenemos el groupId
        const groupId = row.getAttribute('data-group-id');
        if (!groupId) return;
    
        // 2) localizamos la fila principal (mainRow) de ese grupo
        const mainRow = document.querySelector(`#empaqueTable tr[data-group-id="${groupId}"]`);
        if (!mainRow) return;
    
        // 3) Verificamos si la fila que recibimos ES la principal
        const isMainRow = (row === mainRow);
    
        // -- Si es la fila principal, asumimos que:
        // col 0 = Variety, col 1 = Tipo Ramo, col 2 = Long, col 3 = Caja, col 4 = #Cajas, col 5 = Total UND, col 6 = ...
        // -- Si es subfila, asumimos:
        // col 0 = Tipo Ramo, col 1 = Long, col 2 = Caja, col 3 = #Cajas, col 4 = Total UND
        let tipoRamoCol;
        let longCol;
        let cajaCol;
        let numCajasCol;
        let totalUNDCol;
    
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
    
        // 4) Sacamos la variety (de la fila principal)
        //    Suponiendo que el select de variety está en col 0 de la fila principal
        const varietySelect = mainRow.cells[0]?.querySelector('select');
        const varietyName   = varietySelect ? varietySelect.value.trim() : '';
    
        // 5) Obtenemos los elementos de la fila actual (sea principal o subfila)
        const tipoRamoSelect = row.cells[tipoRamoCol]?.querySelector('select');
        const longCell       = row.cells[longCol];
        const cajaSelect     = row.cells[cajaCol]?.querySelector('select');
        const numCajasCell   = row.cells[numCajasCol];
        const totalUNDCell   = row.cells[totalUNDCol];
    
        if (!tipoRamoSelect || !longCell || !cajaSelect || !numCajasCell || !totalUNDCell) {
            return;
        }
    
        // 6) Leemos los valores
        const tipoRamo  = tipoRamoSelect.value.trim();
        const longValue = parseInt(longCell.innerText.trim()) || 0;
        const cajaType  = cajaSelect.value.trim();
        const numCajas  = parseInt(numCajasCell.innerText.trim()) || 0;
    
        // 7) Calculamos
        let totalUND = 0;
        // Solo si es "REG"
        if (tipoRamo === "REG") {
            const stemsPerCaja = getPackRateStems(varietyName, cajaType, longValue);
            totalUND = numCajas * stemsPerCaja;
        }
    
        // 8) Mostramos resultado en "Total UND" de esta fila
        totalUNDCell.innerText = totalUND.toString();
    }
    
    

    /**
     * Recalcula el "Total Empaque" de un grupo, sumando las celdas "Total UND".
     */
    function updateEmpaqueGroupTotal(groupId) {
        const allRows = document.querySelectorAll(`#empaqueTable tr[data-group-id="${groupId}"]`);
        if (!allRows.length) return;
    
        let sum = 0;
        let mainRow = allRows[0]; // asumiendo que allRows[0] es la fila principal
    
        // Recorremos cada fila (principal y subfilas)
        allRows.forEach(row => {
            // ¿Es la fila principal?
            const isMainRow = (row === mainRow);
    
            // localizamos el “Total UND”
            // repetimos la misma lógica de índices:
            let totalUNDCol = isMainRow ? 5 : 4; 
            // (coincidiendo con lo que hiciste en updateEmpaqueRow)
    
            // Leemos “Total UND”
            const totalUNDCell = row.cells[totalUNDCol];
            if (!totalUNDCell) return;
    
            const undValue = parseInt(totalUNDCell.innerText.trim()) || 0;
            sum += undValue;
        });
    
        // Ahora asignamos ese sum a la columna “Total Empaque” (digamos col 6) de la fila principal
        // Ajusta el índice según tu tabla
        const totalEmpaqueCell = mainRow.cells[6];
        if (totalEmpaqueCell) {
            totalEmpaqueCell.innerText = sum.toString();
        }
    }
    

      

   

    const addEmpaqueRowBtn = document.getElementById('addEmpaqueRowBtn');
    if (addEmpaqueRowBtn) {
        addEmpaqueRowBtn.addEventListener('click', () => {
            addGroupEmpaque();
        });
    }


    // Función addExtraRows CORREGIDA
    function addExtraRows(groupId, extraCount, isHypericum = true) {
        const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        const currentCount = groupRows.length;
        const newTotal = currentCount + extraCount;

        // Ajustar el rowspan de la primera fila
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
    // Función updateCalculations Corregida
    // ============================
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
        const tipoCell = mainRow.querySelector('td[data-col="Tipo"]');
        const tipo = tipoCell ? tipoCell.innerText.trim() : '';

        if (!tipo) {
            console.warn(`La fila principal del grupo ${groupId} no tiene definido el "Tipo".`);
            return;
        }

        if (!config[tipo]) {
            console.warn(`Configuración para la categoría "${tipo}" no encontrada en config.`);
            return;
        }

        const tjRegCell = row.querySelector('td[data-col="TJ - REG"] select');
        const longCell = row.querySelector('td[data-col="Long"]');
        const tjRegValue = tjRegCell ? tjRegCell.value : '';
        const longValue = parseInt(longCell ? longCell.innerText.trim() : '') || 0;

        const pFields = ["P1", "P2", "P3", "P4"];
        const rFields = ["R1", "R2", "R3", "R4"];

        let bunchesPerProcona = 0;
        let stemsPerBunch = 0;

        // Se agrega "NF" igual que "TJ" y "WS10"
        if (tjRegValue === "TJ" || tjRegValue === "WS10" || tjRegValue === "NF") {
            if (config[tipo][tjRegValue]) {
                bunchesPerProcona = config[tipo][tjRegValue].bunchesPerProcona || 0;
                stemsPerBunch = config[tipo][tjRegValue].stemsPerBunch || 0;
            } else {
                console.warn(`Configuración para tipo "${tipo}" y TJ - REG "${tjRegValue}" no encontrada en config.`);
            }
        } else if (tjRegValue === "REG") {
            if (config[tipo].REG) {
                const regConfig = config[tipo].REG;

                // Obtener stemsPerBunch
                if (regConfig.lengths && regConfig.lengths[longValue] && regConfig.lengths[longValue].stemsPerBunch !== undefined) {
                    stemsPerBunch = regConfig.lengths[longValue].stemsPerBunch;
                } else if (regConfig.stemsPerBunch !== undefined) {
                    stemsPerBunch = regConfig.stemsPerBunch;
                } else {
                    stemsPerBunch = 0;
                    console.warn(`stemsPerBunch no está definido para tipo "${tipo}" en REG.`);
                }

                // Obtener bunchesPerProcona
                if (regConfig.lengths && regConfig.lengths[longValue] && regConfig.lengths[longValue].bunchesPerProcona !== undefined) {
                    bunchesPerProcona = regConfig.lengths[longValue].bunchesPerProcona;
                } else if (regConfig.bunchesPerProcona !== undefined) {
                    bunchesPerProcona = regConfig.bunchesPerProcona;
                } else {
                    bunchesPerProcona = 0;
                    console.warn(`bunchesPerProcona no está definido para tipo "${tipo}" en REG y longitud ${longValue}.`);
                }
            } else {
                console.warn(`Configuración para tipo "${tipo}" y TJ - REG "REG" no encontrada en config.`);
            }
        } else {
            // Otros casos
            bunchesPerProcona = 0;
            stemsPerBunch = 0;
        }

        const bunchesPerProconaCell = row.querySelector('td[data-col="Bunches/Procona"]');
        if (bunchesPerProconaCell) {
            bunchesPerProconaCell.innerText = bunchesPerProcona;
        }

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

        const stemsCell = row.querySelector('td[data-col="Stems"]');
        if (stemsCell) {
            const stems = bunchesTotal * stemsPerBunch;
            stemsCell.innerText = stems;
        }

        updateStemsTotal(groupId);
    }

    function calculateEmpaqueRow(row) {
        const numCajasCell = row.querySelector('td[data-col="NumCajas"]');
        const sobranteCell = row.querySelector('td[data-col="Sobrante"]');
        const procesoCell = row.querySelector('td[data-col="Proceso"]');
        const totalEmpaqueCell = row.querySelector('td[data-col="TotalEmpaque"]');
        const totalSobranteFCell = row.querySelector('td[data-col="TotalSobranteFuturo"]');
    
        const numCajas = parseInt(numCajasCell?.innerText.trim()) || 0;
        const sobrante = parseInt(sobranteCell?.innerText.trim()) || 0;
        const proceso = parseInt(procesoCell?.innerText.trim()) || 0;
    
        // EJEMPLO de cálculo
        const totalEmpaque = numCajas * 10; 
        const totalSobranteFuturo = sobrante - proceso; 
    
        totalEmpaqueCell.innerText = totalEmpaque.toString();
        totalSobranteFCell.innerText = totalSobranteFuturo.toString();
    }

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
            const isMainRow = row.cells[0].getAttribute('data-col') === 'Variety';

            if (isMainRow) {
                group.variety = row.cells[0].querySelector('select').value;
                group.tipo = row.querySelector('td[data-col="Tipo"]').innerText.trim();
                group.batch = row.cells[2].innerText.trim();
                const fechaCell = row.querySelector('td[data-col="Fecha"]');
                const fechaInput = fechaCell ? fechaCell.querySelector('input') : null;
                group.fecha = fechaInput ? fechaInput.value : '';
                const stemsTotalCell = row.querySelector('td[data-col="Stems Total"]');
                group.stemsTotal = stemsTotalCell ? parseInt(stemsTotalCell.innerText.trim()) : 0;
            }

            const rowData = {};
            const startIndex = isMainRow ? 4 : 0;
            const endIndex = isMainRow ? row.cells.length - 2 : row.cells.length - 1;

            for (let i = startIndex; i < endIndex; i++) {
                const field = row.cells[i].getAttribute('data-col');
                const select = row.cells[i].querySelector('select');
                rowData[field] = select ? select.value : row.cells[i].innerText.trim();
            }
            group.rows.push(rowData);
        });

        localStorage.setItem('tableData', JSON.stringify(groups));
        localStorage.setItem('responsable', responsableInput.value.trim());
    }

    function loadTableData() {
        const data = JSON.parse(localStorage.getItem('tableData'));
        const responsable = localStorage.getItem('responsable') || '';
        responsableInput.value = responsable;

        if (data && Object.keys(data).length > 0) {
            Object.keys(data).forEach(groupId => {
                const group = data[groupId];
                if (group.rows.length > 0) {
                    const numRows = group.rows.length;
                    const longsArray = group.rows.map(row => row["Long"]);

                    const mainRow = dataTable.insertRow();
                    mainRow.setAttribute('data-group-id', groupId);

                    // Crear celdas "Variety" y "Tipo" con rowspan
                    const varietyCell = createVarietySelect(group.variety);
                    varietyCell.setAttribute('rowspan', numRows);
                    mainRow.appendChild(varietyCell);

                    const tipoCell = document.createElement('td');
                    tipoCell.setAttribute('data-col', 'Tipo');
                    tipoCell.setAttribute('rowspan', numRows);
                    const selectedTipo = getTipoForVariety(group.variety);
                    tipoCell.innerText = selectedTipo || '';
                    tipoCell.setAttribute('tabindex', '0');
                    mainRow.appendChild(tipoCell);

                    const batchCell = createEditableCell('Batch', group.batch, numRows);
                    mainRow.appendChild(batchCell);

                    const fechaValue = group.fecha || new Date().toISOString().split('T')[0];
                    const fechaCell = createDateCell('Fecha', fechaValue, numRows);
                    mainRow.appendChild(fechaCell);

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

                    // Celda de Acciones (borrar grupo + agregar línea)
                    const actionCell = document.createElement('td');
                    actionCell.setAttribute('rowspan', numRows);
                    actionCell.classList.add('text-center');

                    // Botón Eliminar Grupo
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

                    // Botón Agregar Línea (no para HYPERICUM)
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

                    const fieldsToUse = fields;
                    fieldsToUse.forEach((field, idx) => {
                        const cellIndex = idx + 4;
                        const cell = mainRow.cells[cellIndex];
                        if (cell) {
                            if (field === "TJ - REG") {
                                cell.querySelector('select').value = group.rows[0][field] || '';
                            } else {
                                cell.innerText = group.rows[0][field] || '';
                            }
                        }
                    });

                    for (let i = 1; i < numRows; i++) {
                        const subRow = dataTable.insertRow();
                        subRow.setAttribute('data-group-id', groupId);
                        addDataCellsToRow(subRow, i, groupId, false, longsArray);

                        fieldsToUse.forEach((field, idx) => {
                            const cell = subRow.cells[idx];
                            if (cell) {
                                if (field === "TJ - REG") {
                                    cell.querySelector('select').value = group.rows[i][field] || '';
                                } else {
                                    cell.innerText = group.rows[i][field] || '';
                                }
                            }
                        });
                    }

                    const groupRowsLoaded = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                    groupRowsLoaded.forEach(r => {
                        updateCalculations(r);
                    });

                    updateStemsTotal(groupId);
                }
            });

            updateAllCalculations();
            populateSummaryTables();
        }
    }

    
    
      

    // Función para generar el workbook de Excel
    async function generateExcelWorkbook() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventario');

        const responsable = responsableInput.value.trim() || "Desconocido";
        const fechaHora = new Date().toLocaleString();

        worksheet.mergeCells('A1:T1');
        worksheet.getCell('A1').value = `Responsable del Conteo: ${responsable}`;
        worksheet.getCell('A1').font = { bold: true };

        worksheet.mergeCells('A2:T2');
        worksheet.getCell('A2').value = `Fecha y Hora de Generación: ${fechaHora}`;
        worksheet.getCell('A2').font = { bold: true };

        worksheet.addRow([]);

        const headers = ["Variety", "Tipo", "Batch", "Fecha", "TJ - REG", "Long", "P1", "P2", "P3", "P4", "R1", "R2", "R3", "R4", "Bunches/Procona", "Bunches Total", "Stems", "Stems Total", "Notas"];
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
                } else if (dataCol === "Bunches Total") {
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
                } else if (dataCol === "Notas") {
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

            // Datos para hojas adicionales
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

        // Fila del Gran Total
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

        // Hoja "Por Tipo de Ramo"
        const bouquetSheet = workbook.addWorksheet('Por Tipo de Ramo');
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

        // Hoja "Por Longitud"
        const lengthSheet = workbook.addWorksheet('Por Longitud');
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

        // Hoja "Por Batch"
        const batchSheet = workbook.addWorksheet('Por Batch');
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

    async function generateExcelFile() {
        const workbook = await generateExcelWorkbook();
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'Inventario.xlsx');
    }

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

    function updateAllCalculations() {
        config = JSON.parse(localStorage.getItem('config')) || {};
        const allRows = dataTable.querySelectorAll('tr');
        allRows.forEach(row => {
            updateCalculations(row);
        });
        updateGrandTotal();
    }

    function reloadConfigAndRecalculate() {
        config = JSON.parse(localStorage.getItem('config')) || {};
        updateAllCalculations();
    }

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

                // Por Longitud
                const lengthKey = `${variety}_${long}`;
                if (!summaryDataByLength[lengthKey]) {
                    summaryDataByLength[lengthKey] = { Variety: variety, Long: long, Stems: 0 };
                }
                summaryDataByLength[lengthKey].Stems += stems;

                // Por Tipo de Ramo
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

                // Por Batch
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

    // Eventos del sidebar si existen
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

    // Cargar datos o crear un grupo por defecto
    if (!localStorage.getItem('tableData')) {
        addGroup();
    } else {
        loadTableData();
    }

    // Listener para recalcular todo cuando cambie el contenido editable
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

    // Guardar responsable inmediatamente al cambiar
    responsableInput.addEventListener('input', saveTableData);

    // Guardar datos antes de salir
    window.addEventListener('beforeunload', saveTableData);

    // Manejo de teclas (Enter, flechas) en celdas editables
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

    // Dejamos accesibles estas funciones en window por si se requieren en consola
    window.saveTableData = saveTableData;
    window.updateAllCalculations = updateAllCalculations;
    window.reloadConfigAndRecalculate = reloadConfigAndRecalculate;
    // Cargar datos de Empaque al iniciar
    // ======================================================================
    // main.js
    // ======================================================================

    // Carga la información de empaque (si es necesaria para otro fin)
    loadEmpaqueTableData();

    window.addEventListener('load', () => {
        // Aquí se garantiza que se carguen y rendericen los datos de Pack Rate desde Firebase
        loadPackRateData();
    });
      

    // Al cargar la página se intenta obtener los datos de Firebase.
    async function loadPackRateData() {
        try {
            const response = await fetch('/api/packrate');
            if (response.ok) {
                const blocks = await response.json();
                console.log("loadPackRateData - Datos recibidos desde Firebase:", blocks);
    
                // GUARDA EN LA VARIABLE GLOBAL
                packRateData = blocks;
    
                // Si existen bloques, se reconstruye la tabla packRate; si no, se genera la tabla base.
                if (blocks && blocks.length > 0) {
                    renderPackRateBlocks(blocks);
                } else {
                    generatePackRateTable();
                }
                // Actualiza los cálculos globales
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
    // FUNCIONES PARA LA TABLA PACK RATE
    // =============================================================

    // Función que genera la tabla base PackRate con valores en 0,
    // en caso de que Firebase aún no contenga datos.
    function generatePackRateTable() {
    const packrateTable = document.getElementById("packrateTable");
    if (!packrateTable) return;

    const tBody = packrateTable.querySelector("tbody");
    if (!tBody) return;
    tBody.innerHTML = "";

    const longColumns = [70, 60, 55, 50];
    const rowDefinitions = [
        { label: "HB", editable: true },
        { label: "STEMS", editable: false },
        { label: "QB", editable: true },
        { label: "STEMS", editable: false },
        { label: "EB", editable: true },
        { label: "STEMS", editable: false }
    ];

    // Se generan las filas base usando las variedades definidas en 'varietyOptions'
    let allVarieties = [];
    Object.keys(varietyOptions).forEach(tipo => {
        allVarieties = allVarieties.concat(varietyOptions[tipo]);
    });

    // Se asigna un “order” (índice) para cada variedad y se crea la tabla base.
    allVarieties.forEach((varName, orderIndex) => {
        let multiplierCellCreated = false;
        let varietyCellCreated = false;

        rowDefinitions.forEach((def, index) => {
        const row = tBody.insertRow();

        // En la primera fila del bloque se añade la celda del multiplicador (con rowspan)
        if (!multiplierCellCreated) {
            const cellMultiplier = row.insertCell();
            cellMultiplier.contentEditable = true;
            cellMultiplier.innerText = "25"; // Valor por defecto
            cellMultiplier.style.textAlign = "center";
            cellMultiplier.style.minWidth = "30px";
            cellMultiplier.rowSpan = rowDefinitions.length;
            multiplierCellCreated = true;
        }
        // En la primera fila del bloque se añade la celda de variedad (con rowspan)
        if (!varietyCellCreated) {
            const cellVariety = row.insertCell();
            cellVariety.innerText = varName;
            cellVariety.style.textAlign = "center";
            cellVariety.rowSpan = rowDefinitions.length;
            // Guardamos el order para preservar la posición
            row.setAttribute("data-order", orderIndex);
            // El data-group-id se asignará cuando se guarde en Firebase.
            varietyCellCreated = true;
        }

        // Se crea la celda de etiqueta usando el objeto actual def
        const cellLabel = row.insertCell();
        cellLabel.innerText = def.label; // Ahora se usa def.label (HB, STEMS, QB, STEMS, EB, STEMS)
        cellLabel.style.fontWeight = "bold";
        cellLabel.style.textAlign = "center";

        // Se crean las celdas correspondientes para cada longitud
        longColumns.forEach(() => {
            const cell = row.insertCell();
            cell.style.textAlign = "center";
            cell.contentEditable = def.editable; // STEMS tendrá false, cajas true
            cell.innerText = "0";
        });
        });
    });

    attachPackRateEvents();
    }


    // Función para renderizar la tabla a partir de los bloques obtenidos desde Firebase.
    function renderPackRateBlocks(blocks) {
        const packrateTable = document.getElementById("packrateTable");
        if (!packrateTable) return;
      
        const tBody = packrateTable.querySelector("tbody");
        tBody.innerHTML = "";
      
        const longColumns = [70, 60, 55, 50];
        const rowDefinitions = [
          { type: "HB", label: "HB", editable: true },
          { type: "HB", label: "STEMS", editable: false },
          { type: "QB", label: "QB", editable: true },
          { type: "QB", label: "STEMS", editable: false },
          { type: "EB", label: "EB", editable: true },
          { type: "EB", label: "STEMS", editable: false }
        ];
      
        // Ordenar los bloques según un campo "order" si existe
        blocks.sort((a, b) => {
          if (a.order === undefined || b.order === undefined) return 0;
          return a.order - b.order;
        });
      
        blocks.forEach(block => {
          const groupId = block.groupId; // Puede ser undefined si aún no se asignó
          let multiplierCellCreated = false;
          let varietyCellCreated = false;
      
          rowDefinitions.forEach(def => {
            const row = tBody.insertRow();
            if (groupId) {
              row.setAttribute("data-group-id", groupId);
            }
            // Primera fila: celda del multiplicador con rowspan
            if (!multiplierCellCreated) {
              const cellMultiplier = row.insertCell();
              cellMultiplier.contentEditable = true;
              cellMultiplier.innerText = (block.multiplier !== undefined) ? block.multiplier.toString() : "25";
              cellMultiplier.style.textAlign = "center";
              cellMultiplier.style.minWidth = "30px";
              cellMultiplier.rowSpan = rowDefinitions.length;
              multiplierCellCreated = true;
            }
            // Primera fila: celda de variedad con rowspan
            if (!varietyCellCreated) {
              const cellVariety = row.insertCell();
              cellVariety.innerText = block.variety ? block.variety : "";
              cellVariety.style.textAlign = "center";
              cellVariety.rowSpan = rowDefinitions.length;
              if (block.order !== undefined) {
                row.setAttribute("data-order", block.order);
              }
              varietyCellCreated = true;
            }
            // Celda de etiqueta
            const cellLabel = row.insertCell();
            cellLabel.innerText = def.label;
            cellLabel.style.fontWeight = "bold";
            cellLabel.style.textAlign = "center";
            // Celdas para cada longitud
            longColumns.forEach(long => {
              const cell = row.insertCell();
              cell.style.textAlign = "center";
              cell.contentEditable = def.editable;
              if (def.editable) {
                const value =
                  (block.cajas &&
                    block.cajas[def.type] &&
                    block.cajas[def.type][long] !== undefined)
                    ? block.cajas[def.type][long]
                    : "0";
                cell.innerText = value.toString();
              } else {
                const value =
                  (block.stems &&
                    block.stems[def.type] &&
                    block.stems[def.type][long] !== undefined)
                    ? block.stems[def.type][long]
                    : "0";
                cell.innerText = value.toString();
              }
            });
          });
        });
      
        // Una vez renderizada la tabla, aseguramos que se configuren los eventos y cálculos
        attachPackRateEvents();
        updateAllCalculations();
    }
      


    // Función que extrae los datos de la tabla (asumiendo bloques de 6 filas).
    // Se corrige el offset: la primera fila del bloque tiene 7 celdas y el resto 5.
    function extractPackRateData() {
    const packrateTable = document.getElementById("packrateTable");
    if (!packrateTable) return null;

    const tBody = packrateTable.querySelector("tbody");
    const rows = Array.from(tBody.querySelectorAll("tr"));
    const blocks = [];

    for (let i = 0; i < rows.length; i += 6) {
        const blockRows = rows.slice(i, i + 6);
        if (blockRows.length < 6) break;

        const mainRow = blockRows[0];
        const groupId = mainRow.getAttribute("data-group-id") || undefined;
        const multiplier = parseFloat(mainRow.cells[0].innerText) || 25;
        const variety = mainRow.cells[1].innerText.trim();
        let order = mainRow.getAttribute("data-order");
        order = order !== null ? parseInt(order, 10) : undefined;

        const longColumns = [70, 60, 55, 50];
        const tipos = ["HB", "QB", "EB"];
        const cajas = {};
        const stems = {};

        tipos.forEach((tipo, idx) => {
        cajas[tipo] = {};
        stems[tipo] = {};
        const rowCajas = blockRows[idx * 2];
        const rowStems = blockRows[idx * 2 + 1];

        // Determina el offset según la cantidad de celdas:
        const offsetCajas = (rowCajas.cells.length === 7) ? 3 : 1;
        const offsetStems = (rowStems.cells.length === 7) ? 3 : 1;

        longColumns.forEach((long, colIndex) => {
            const cajaCell = rowCajas.cells[colIndex + offsetCajas];
            const stemCell = rowStems.cells[colIndex + offsetStems];
            cajas[tipo][long] = cajaCell ? cajaCell.innerText.trim() : "0";
            stems[tipo][long] = stemCell ? stemCell.innerText.trim() : "0";
        });
        });

        blocks.push({
        groupId,
        multiplier,
        variety,
        cajas,
        stems,
        order, // Para preservar el orden.
        updatedAt: new Date().toISOString()
        });
    }

    return blocks;
    }

    function extractInventarioData() {
        const table = document.getElementById('dataTable');
        if (!table) return [];
      
        const rows = table.querySelectorAll('tbody tr');
        const result = [];
      
        rows.forEach(row => {
          const groupId = row.getAttribute('data-group-id');
          if (!groupId) return;
      
          // Se detecta si es la fila principal o una subfila
          const isMainRow = row.cells[0]?.getAttribute('data-col') === 'Variety';
      
          let variety = "";
          let tipoRamo = "";  // Aquí guardaremos el valor de "TJ - REG"
          
          if (isMainRow) {
            // La primera celda es Variety (que tiene el <select>)
            variety = row.cells[0]?.querySelector('select')?.value || '';
      
            // Buscamos en la misma fila el select de "TJ - REG"
            const tjRegSelect = row.querySelector('td[data-col="TJ - REG"] select');
            tipoRamo = tjRegSelect ? tjRegSelect.value : '';
          } else {
            // Si es subfila, encontramos la fila principal para Variety y TJ - REG
            const mainRow = document.querySelector(`tr[data-group-id="${groupId}"]`);
            if (mainRow) {
              variety = mainRow.cells[0]?.querySelector('select')?.value || '';
      
              const tjRegSelect = mainRow.querySelector('td[data-col="TJ - REG"] select');
              tipoRamo = tjRegSelect ? tjRegSelect.value : '';
            }
          }
      
          // Ahora la celda "Long" sí existe en cada fila (principal o subfila)
          const longCell = row.querySelector('td[data-col="Long"]');
          const longVal = longCell ? longCell.innerText.trim() : '';
      
          // Bunches Total
          const bunchesTotalCell = row.querySelector('td[data-col="Bunches Total"]');
          const bunchesTotal = bunchesTotalCell 
            ? parseInt(bunchesTotalCell.innerText.trim()) || 0 
            : 0;
      
          // Solo empujamos si variety, tipoRamo y long tienen valor
          if (variety && tipoRamo && longVal) {
            result.push({
              variety: variety,
              tipoRamo: tipoRamo, // En este campo irá "REG", "TJ", "WS10", "NF", etc.
              long: longVal,
              bunchesTotal: bunchesTotal
            });
          }
        });
      
        return result;
    }
      

    function extractInventarioDataSummarized() {
        const rawData = extractInventarioData(); // la función anterior
        const mapKeyed = {};
      
        rawData.forEach(item => {
          // item.tipoRamo ahora contiene "REG", "TJ", "WS10", "NF", etc.
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
      
      
      
    async function saveInventarioDataToFirebase() {
        const dataArray = extractInventarioDataSummarized();
        if (!dataArray.length) {
          showAlert("No hay filas en la tabla de Inventario para guardar.", "warning");
          return;
        }
      
        try {
          // Podrías mandar todo en un solo request, o uno por uno.
          // Aquí, uno por uno:
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

      


    // Función para guardar los datos en Firebase sin reconstruir la tabla completa.
    // Si se crea un nuevo documento (sin groupId), se actualiza el atributo data-group-id.
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
            if (result.id && !block.groupId) {
            const tBody = document.getElementById("packrateTable").querySelector("tbody");
            const rows = Array.from(tBody.querySelectorAll("tr"));
            for (let i = 0; i < rows.length; i += 6) {
                const currentVariety = rows[i].cells[1].innerText.trim();
                const currentOrder = rows[i].getAttribute("data-order");
                if (currentVariety === block.variety && (currentOrder == block.order)) {
                rows[i].setAttribute("data-group-id", result.id);
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
    // EVENTOS Y RECOMPUTACIÓN DE CAMPOS (STEMS)
    // =============================================================

    // Botón para guardar
    const savePackRateBtn = document.getElementById('savePackRateBtn');
    if (savePackRateBtn) {
    savePackRateBtn.addEventListener('click', async () => {
        savePackRateBtn.disabled = true;
        await savePackRateData();
        savePackRateBtn.disabled = false;
    });
    }


    // Asigna los eventos para recalcular los valores de STEMS mientras se edita la tabla.
    function attachPackRateEvents() {
    const packrateTable = document.getElementById("packrateTable");
    if (!packrateTable) return;
    const rows = packrateTable.querySelectorAll("tbody tr");

    // Se asume que cada bloque está compuesto por 6 filas consecutivas.
    for (let i = 0; i < rows.length; i += 6) {
        [0, 2, 4].forEach(offset => {
        const rowBoxes = rows[i + offset];
        const rowStems = rows[i + offset + 1];
        if (!rowBoxes || !rowStems) return;
        rowBoxes.addEventListener("input", () => {
            recalcPackRateRow(rowBoxes, rowStems, rows[i]);
        });
        });

        const firstRow = rows[i];
        const cellMultiplier = firstRow.cells[0];
        cellMultiplier.addEventListener("input", () => {
        recalcPackRateRow(rows[i + 0], rows[i + 1], firstRow); // HB
        recalcPackRateRow(rows[i + 2], rows[i + 3], firstRow); // QB
        recalcPackRateRow(rows[i + 4], rows[i + 5], firstRow); // EB
        });
    }
    }


    // Función que recalcula los valores de STEMS en función del multiplicador y de las cajas.
    function recalcPackRateRow(rowBoxes, rowStems, firstRow) {
    const multiplier = parseFloat(firstRow.cells[0].innerText) || 0;
    let offset;
    if (rowBoxes.cells.length === 7) {
        offset = 3;
    } else if (rowBoxes.cells.length === 5) {
        offset = 1;
    } else {
        console.warn("Estructura inesperada en la fila de cajas");
        return;
    }

    for (let col = offset; col < rowBoxes.cells.length; col++) {
        const cellBox = rowBoxes.cells[col];
        const valueBox = parseFloat(cellBox.innerText) || 0;
        const result = valueBox * multiplier;
        const stemDataIndex = col - offset + 1;
        if (rowStems.cells[stemDataIndex] !== undefined) {
        rowStems.cells[stemDataIndex].innerText = result.toString();
        }
    }
    }

    /**
     * Dado un nombre de variedad, tipo de caja (HB, QB, EB) y longitud (70, 60, 55, 50),
     * retorna el valor configurado que hay en packRateData (por defecto 0 si no existe).
     *
     * Ajusta la lectura de 'cajas' o 'stems' según tu estructura real en Firebase.
     */
    function getPackRateStems(varietyName, cajaType, longValue) {
        if (!packRateData || packRateData.length === 0) {
            return 0;
        }

        // Busca en packRateData el bloque que corresponda a la variedad
        // (ignora mayúsculas/minúsculas)
        const block = packRateData.find(b => 
            (b.variety || '').toUpperCase() === varietyName.toUpperCase()
        );

        if (!block) {
            return 0; // No se encontró variedad
        }

        // En tu tabla de packRate, guardas valores en block.cajas[...] o block.stems[...].
        // Revisa en 'renderPackRateBlocks' para ver cómo se guardan. Ej: 
        //   block.cajas["QB"]["60"] = "26"  (string)
        // ó block.stems["QB"]["60"] = "26"
        // Ajusta según tu caso real:
        // -------------------------------------

        // Supongamos que se guardan en block.cajas.
        // Si en tu caso se guardan en block.stems, cambia "block.cajas" a "block.stems".
        const stemsStr = block.cajas &&
                        block.cajas[cajaType] &&
                        block.cajas[cajaType][longValue]
                        ? block.cajas[cajaType][longValue]
                        : '0';

        return parseFloat(stemsStr) || 0;
    }


});
