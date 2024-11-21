document.addEventListener('DOMContentLoaded', () => {
    // ============================
    // Declaración de Variables
    // ============================
    const addGroupBtn = document.getElementById('addGroupBtn');
    const resetTableBtn = document.getElementById('resetTableBtn'); // Botón de reset
    const generateExcelBtn = document.getElementById('generateExcelBtn');
    const dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    const responsableInput = document.getElementById('responsable');
    const alertPlaceholder = document.getElementById('alertPlaceholder');

    // Elementos del menú lateral
    const sidebarMenu = document.getElementById('sidebarMenu');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    // Variables de configuración y datos
    let config = JSON.parse(localStorage.getItem('config')) || defaultConfig;

    const longDefaults = []; // Longitudes predeterminadas vacías
    const hypericumLongs = ['', '']; // Longitudes para Hypericum, establecidas a vacío por defecto
    const tjRegOptions = ["TJ", "REG", "WS10"];
    const fields = ["TJ - REG", "Long", "P1", "P2", "P3", "P4", "R1", "R2", "R3", "R4", "Bunches/Procona", "Bunches Total", "Stems", "Notas"];
    const varietyOptions = {
        "VERONICA": ["ARTIST", "BIZARRE", "CAYA", "JUNE", "NAVY", "ROSWITHA"],
        "MENTHA": ["MENTHA", "MENTHA SPRAY"],
        "HYPERICUM": ["BELLIMO", "TANGO", "UNO"],
        "EUPATORIUM": ["MOMENTS", "PINK"],
        "PAPYRUS": ["MAXUS", "LUXUS"],
        "ORIGANUM": ["ORIGANUM"]
    };

    // ============================
    // Declaración de Funciones
    // ============================

    // Función para mostrar alertas
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

            // Manejar la adición o eliminación de filas extra si la categoría es Hypericum
            if (selectedTipo === 'HYPERICUM') { // Cambiado de selectedVariety a selectedTipo
                // Verificar cuántas filas tiene actualmente el grupo
                const currentGroupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                if (currentGroupRows.length < 5) {
                    addExtraRows(groupId, 2); // Agregar 2 filas adicionales
                }
            } else {
                // Si no es Hypericum, asegurarse de que solo haya 3 filas
                const currentGroupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                if (currentGroupRows.length > 3) {
                    removeExtraRows(groupId, currentGroupRows.length - 3); // Eliminar filas extra
                }
            }

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

    // Función para crear el select de TJ/REG
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
                let text = cell.innerText.toUpperCase();
                // Eliminar caracteres que no sean letras o números
                text = text.replace(/[^A-Z0-9]/gi, '');
                // Limitar a dos caracteres
                if (text.length > 2) {
                    text = text.substring(0, 2);
                }
                cell.innerText = text;

                // Mover el cursor al final
                moveCursorToEnd(cell);

                saveTableData();
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

                    // Mover el cursor al final
                    moveCursorToEnd(cell);
                }

                updateCalculations(cell.parentElement);
                saveTableData();
            });
        } else {
            cell.addEventListener('input', () => {
                saveTableData();
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

        // Crear el input de tipo date visible
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.classList.add('form-control', 'form-control-sm');
        dateInput.value = value || new Date().toISOString().split('T')[0]; // Fecha actual si no se proporciona

        dateInput.addEventListener('change', () => updateFecha(dateInput));

        // Agregar el input al cell
        cell.appendChild(dateInput);

        return cell;
    }

    // Función para activar el selector de fecha
    function triggerDatePicker(btn) {
        // Encontrar el input de tipo date dentro de la misma celda
        const input = btn.parentElement.querySelector('input[type="date"]');
        if (input) {
            input.classList.remove('d-none'); // Mostrar el input
            input.focus(); // Enfocar el input para abrir el selector
        }
    }

    // Función para manejar la selección de fecha
    function updateFecha(input) {
        // Obtener la fecha seleccionada
        const selectedDate = input.value;
        // Aquí puedes realizar acciones adicionales si es necesario
        // Por ejemplo, actualizar algún campo o almacenar la fecha en una variable
        // Actualmente, la fecha ya se guarda en localStorage a través de saveTableData()
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
                cell.style.border = '1px solid black'; // Bordes negros
            } else if (["R1", "R2", "R3", "R4"].includes(field)) {
                cell.style.backgroundColor = '#FCE4D6'; // Color para R
                cell.style.border = '1px solid black'; // Bordes negros
            }

            if (field === "TJ - REG") {
                const select = createTJRegSelect();
                cell.appendChild(select);
            } else if (field === "Long") {
                cell.contentEditable = true;
                cell.innerText = longsArray && longsArray[index] !== undefined ? longsArray[index] : ''; // Establecer vacío por defecto
                cell.style.backgroundColor = '#FFFFCC'; // Color para 'Long'
                cell.style.border = '1px solid black'; // Bordes negros
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

                        // Mover el cursor al final
                        moveCursorToEnd(cell);
                    }

                    updateCalculations(row);
                    saveTableData();
                });
            } else if (["P1", "P2", "P3", "P4", "R1", "R2", "R3", "R4"].includes(field)) {
                cell.contentEditable = true;
                cell.innerText = ''; // Cambiado de '0' a ''
                cell.addEventListener('input', () => {
                    updateCalculations(row);
                    saveTableData();
                });
            } else if (["Bunches/Procona", "Bunches Total", "Stems"].includes(field)) {
                cell.contentEditable = false; // Campos calculados
                cell.innerText = '';
            } else {
                cell.contentEditable = true;
                cell.innerText = '';
                cell.addEventListener('input', () => {
                    saveTableData();
                });
            }

            row.appendChild(cell);
        });
    }

    // Función para agregar un nuevo grupo con 3 líneas por defecto
    function addGroup() {
        const longsArray = longDefaults; // Por defecto, usar longitudes vacías
        const numRows = 3; // Número de filas por defecto

        const groupId = Date.now();
        const mainRow = dataTable.insertRow();
        mainRow.setAttribute('data-group-id', groupId);

        // Crear celdas "Variety" y "Tipo" con rowspan dinámico
        const varietyCell = createVarietySelect();
        varietyCell.setAttribute('rowspan', numRows);
        mainRow.appendChild(varietyCell);

        const tipoCell = document.createElement('td');
        tipoCell.setAttribute('data-col', 'Tipo');
        tipoCell.setAttribute('rowspan', numRows);
        tipoCell.innerText = ''; // Inicialmente vacío
        tipoCell.setAttribute('tabindex', '0'); // Permitir que la celda reciba el foco
        mainRow.appendChild(tipoCell);

        // Crear celda "Batch"
        const batchCell = createEditableCell('Batch', '', numRows);
        mainRow.appendChild(batchCell);

        // Crear celda "Fecha" con fecha actual
        const today = new Date().toISOString().split('T')[0]; // Fecha actual
        const fechaCell = createDateCell('Fecha', today, numRows);
        mainRow.appendChild(fechaCell);

        // Agregar celdas de datos para la primera fila
        addDataCellsToRow(mainRow, 0, groupId, true, longsArray);

        // Agregar la celda de "Stems Total" con rowspan dinámico en la primera fila
        const stemsTotalCell = document.createElement('td');
        stemsTotalCell.setAttribute('rowspan', numRows);
        stemsTotalCell.classList.add('text-center');
        stemsTotalCell.setAttribute('data-col', 'Stems Total');
        stemsTotalCell.innerText = '';
        stemsTotalCell.setAttribute('tabindex', '0'); // Permitir que la celda reciba el foco

        // Encontrar el índice de la celda "Notas"
        const notasCell = mainRow.querySelector('td[data-col="Notas"]');
        const notasIndex = Array.prototype.indexOf.call(mainRow.cells, notasCell);

        // Insertar "Stems Total" antes de la celda "Notas"
        mainRow.insertBefore(stemsTotalCell, mainRow.cells[notasIndex]);

        // Agregar la celda de "Acciones" con rowspan dinámico en la primera fila
        const actionCell = document.createElement('td');
        actionCell.setAttribute('rowspan', numRows);
        actionCell.classList.add('text-center');
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.title = 'Eliminar grupo';

        // Agregar eventos para soportar mouse y táctil
        const handleDelete = () => {
            if (confirm('¿Estás seguro de que deseas eliminar este grupo?')) {
                const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                groupRows.forEach(row => dataTable.removeChild(row));
                saveTableData();
                showAlert('Grupo eliminado correctamente.', 'warning');

                // Actualizar el Gran Total
                updateGrandTotal();
            }
        };

        deleteBtn.addEventListener('click', handleDelete); // Soporte para clic
        deleteBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevenir el comportamiento predeterminado en táctiles
            handleDelete();
        });

        actionCell.appendChild(deleteBtn);
        mainRow.appendChild(actionCell);

        // Agregar subfilas según la cantidad de longitudes
        for (let i = 1; i < numRows; i++) {
            const subRow = dataTable.insertRow();
            subRow.setAttribute('data-group-id', groupId);
            addDataCellsToRow(subRow, i, groupId, false, longsArray);
        }

        updateCalculations(mainRow);
        updateStemsTotal(groupId);
        saveTableData();
        showAlert('Grupo agregado correctamente.');

        // Actualizar el Gran Total
        updateGrandTotal();
    }


    // Función para agregar filas extra a un grupo
    function addExtraRows(groupId, extraCount) {
        const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        const currentCount = groupRows.length;
        const newTotal = currentCount + extraCount;

        // Actualizar los atributos rowspan de las celdas que lo requieran
        ['Variety', 'Tipo', 'Batch', 'Fecha', 'Stems Total', 'Acciones'].forEach(col => {
            const cell = groupRows[0].querySelector(`td[data-col="${col}"]`) || groupRows[0].querySelector(`td[rowspan]`);
            if (cell) {
                const newRowspan = newTotal;
                cell.setAttribute('rowspan', newRowspan);
            }
        });

        // Insertar las filas adicionales inmediatamente después del último row del grupo actual
        for (let i = currentCount; i < newTotal; i++) {
            const subRow = dataTable.insertRow();
            subRow.setAttribute('data-group-id', groupId);
            addDataCellsToRow(subRow, i, groupId, false, hypericumLongs);
        }

        // Actualizar cálculos para todas las filas del grupo
        const updatedGroupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        updatedGroupRows.forEach(row => {
            updateCalculations(row);
        });

        // Actualizar el almacenamiento y el Gran Total
        saveTableData();
        updateGrandTotal();
        showAlert('Se han agregado filas adicionales para HYPERICUM.');
    }

    // Función para eliminar filas extra de un grupo
    function removeExtraRows(groupId, extraCount) {
        const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        const currentCount = groupRows.length;
        const newTotal = currentCount - extraCount;

        if (newTotal < 3) {
            showAlert('Un grupo debe tener al menos 3 filas.', 'danger');
            return;
        }

        // Eliminar las últimas filas
        for (let i = currentCount - 1; i >= newTotal; i--) {
            const rowToRemove = groupRows[i];
            if (rowToRemove) {
                dataTable.removeChild(rowToRemove);
            }
        }

        // Actualizar los atributos rowspan de las celdas que lo requieran
        ['Variety', 'Tipo', 'Batch', 'Fecha', 'Stems Total', 'Acciones'].forEach(col => {
            const cell = groupRows[0].querySelector(`td[data-col="${col}"]`) || groupRows[0].querySelector(`td[rowspan]`);
            if (cell) {
                const newRowspan = newTotal;
                cell.setAttribute('rowspan', newRowspan);
            }
        });

        // Actualizar cálculos para todas las filas del grupo
        const updatedGroupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        updatedGroupRows.forEach(row => {
            updateCalculations(row);
        });

        // Actualizar el almacenamiento y el Gran Total
        saveTableData();
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

        // Encontrar todas las filas del grupo
        const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
        if (!groupRows.length) {
            console.warn(`No se encontraron filas para el ID de grupo ${groupId}.`);
            return;
        }

        // Asumimos que la primera fila del grupo es la fila principal
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

        // Obtener valores de configuración basados en la categoría
        if (tjRegValue === "TJ" || tjRegValue === "WS10") {
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

        // Actualizar "Bunches/Procona"
        const bunchesPerProconaCell = row.querySelector('td[data-col="Bunches/Procona"]');
        if (bunchesPerProconaCell) {
            bunchesPerProconaCell.innerText = bunchesPerProcona;
        }

        // Calcular "Bunches Total"
        let bunchesTotal = 0;

        // Calcular para P1-P4
        pFields.forEach(field => {
            const cell = row.querySelector(`td[data-col="${field}"]`);
            const value = parseInt(cell ? cell.innerText.trim() : '') || 0;
            if (value > 0) {
                bunchesTotal += value * bunchesPerProcona;
            }
        });

        // Calcular para R1-R4 (sumar directamente)
        rFields.forEach(field => {
            const cell = row.querySelector(`td[data-col="${field}"]`);
            const value = parseInt(cell ? cell.innerText.trim() : '') || 0;
            if (value > 0) {
                bunchesTotal += value; // En todos los casos, los R se suman directamente
            }
        });

        // Actualizar "Bunches Total"
        const bunchesTotalCell = row.querySelector('td[data-col="Bunches Total"]');
        if (bunchesTotalCell) {
            bunchesTotalCell.innerText = bunchesTotal;
        }

        // Calcular "Stems"
        const stemsCell = row.querySelector('td[data-col="Stems"]');
        if (stemsCell) {
            const stems = bunchesTotal * stemsPerBunch;
            stemsCell.innerText = stems;
        }

        // Actualizar "Stems Total"
        updateStemsTotal(groupId);
    }

    // Función para actualizar el total de stems de un grupo
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

        // Actualizar la celda "Stems Total" en la primera fila del grupo
        const mainRow = dataTable.querySelector(`tr[data-group-id="${groupId}"]`);
        const stemsTotalCell = mainRow.querySelector('td[data-col="Stems Total"]');
        if (stemsTotalCell) {
            stemsTotalCell.innerText = totalStems;
        }

        // Actualizar el Gran Total
        updateGrandTotal();
    }

    // Función para calcular y actualizar el Gran Total
    function updateGrandTotal() {
        const grandTotalValue = document.getElementById('grandTotalValue');
        let grandTotal = 0;

        // Obtener todos los "Stems Total" de los grupos
        const stemsTotalCells = dataTable.querySelectorAll('td[data-col="Stems Total"]');
        stemsTotalCells.forEach(cell => {
            const value = parseInt(cell.innerText.trim()) || 0;
            grandTotal += value;
        });

        // Actualizar el valor en la tabla
        if (grandTotalValue) {
            grandTotalValue.innerText = grandTotal;
        }
    }

    // Función para guardar los datos de la tabla en el almacenamiento local
    function saveTableData() {
        const table = document.getElementById('dataTable');
        const groups = {};

        table.querySelectorAll('tbody tr').forEach(row => {
            const groupId = row.getAttribute('data-group-id');
            if (!groupId) return; // Ignorar filas sin groupId

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
                // Obtener "Fecha"
                const fechaCell = row.querySelector('td[data-col="Fecha"]');
                const fechaInput = fechaCell ? fechaCell.querySelector('input') : null;
                group.fecha = fechaInput ? fechaInput.value : '';
                // Obtener "Stems Total"
                const stemsTotalCell = row.querySelector('td[data-col="Stems Total"]');
                group.stemsTotal = stemsTotalCell ? parseInt(stemsTotalCell.innerText.trim()) : 0;
            }

            // Solo guardar datos de filas que contienen datos (excluye las celdas con rowspan y acciones)
            const rowData = {};
            const startIndex = isMainRow ? 4 : 0; // Ajuste por "Variety", "Tipo", "Batch" y "Fecha"
            const endIndex = isMainRow ? row.cells.length - 2 : row.cells.length - 1; // Ignorar "Acciones" en filas

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

    // Función para cargar los datos de la tabla desde el almacenamiento local
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

                    // Crear celdas "Variety" y "Tipo" con rowspan igual al número de filas
                    const varietyCell = createVarietySelect(group.variety);
                    varietyCell.setAttribute('rowspan', numRows);
                    mainRow.appendChild(varietyCell);

                    const tipoCell = document.createElement('td');
                    tipoCell.setAttribute('data-col', 'Tipo');
                    tipoCell.setAttribute('rowspan', numRows);
                    // Obtener el tipo basado en la variedad
                    const selectedTipo = getTipoForVariety(group.variety);
                    tipoCell.innerText = selectedTipo || '';
                    tipoCell.setAttribute('tabindex', '0'); // Permitir que la celda reciba el foco
                    mainRow.appendChild(tipoCell);

                    // Crear celda "Batch"
                    const batchCell = createEditableCell('Batch', group.batch, numRows);
                    mainRow.appendChild(batchCell);

                    // Crear celda "Fecha"
                    const fechaValue = group.fecha || new Date().toISOString().split('T')[0]; // Fecha actual si no está definida
                    const fechaCell = createDateCell('Fecha', fechaValue, numRows);
                    mainRow.appendChild(fechaCell);

                    // Agregar celdas de datos para la primera fila
                    addDataCellsToRow(mainRow, 0, groupId, true, longsArray);

                    // Agregar la celda de "Stems Total" con rowspan
                    const stemsTotalCell = document.createElement('td');
                    stemsTotalCell.setAttribute('rowspan', numRows);
                    stemsTotalCell.classList.add('text-center');
                    stemsTotalCell.setAttribute('data-col', 'Stems Total');
                    stemsTotalCell.innerText = group.stemsTotal || '';
                    stemsTotalCell.setAttribute('tabindex', '0'); // Permitir que la celda reciba el foco

                    // Encontrar el índice de la celda "Notas"
                    const notasCell = mainRow.querySelector('td[data-col="Notas"]');
                    const notasIndex = Array.prototype.indexOf.call(mainRow.cells, notasCell);

                    // Insertar "Stems Total" antes de la celda "Notas"
                    mainRow.insertBefore(stemsTotalCell, mainRow.cells[notasIndex]);

                    // Agregar la celda de "Acciones" con rowspan
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
                            groupRows.forEach(row => dataTable.removeChild(row));
                            saveTableData();
                            showAlert('Grupo eliminado correctamente.', 'warning');

                            // Actualizar el Gran Total
                            updateGrandTotal();
                        }
                    });
                    actionCell.appendChild(deleteBtn);
                    mainRow.appendChild(actionCell);

                    // Actualizar celdas con datos en la primera fila
                    const fieldsToUse = fields;
                    fieldsToUse.forEach((field, idx) => {
                        const cellIndex = idx + 4; // Ajuste por "Variety", "Tipo", "Batch" y "Fecha"
                        const cell = mainRow.cells[cellIndex];
                        if (cell) {
                            if (field === "TJ - REG") {
                                cell.querySelector('select').value = group.rows[0][field] || '';
                            } else {
                                cell.innerText = group.rows[0][field] || '';
                            }
                        }
                    });

                    // Agregar subfilas y actualizar celdas con datos
                    for (let i = 1; i < numRows; i++) {
                        const subRow = dataTable.insertRow();
                        subRow.setAttribute('data-group-id', groupId);
                        addDataCellsToRow(subRow, i, groupId, false, longsArray);

                        // Actualizar celdas con datos
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

                    // Actualizar cálculos basados en los valores cargados
                    const groupRowsLoaded = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                    groupRowsLoaded.forEach(row => {
                        updateCalculations(row);
                    });

                    // Actualizar "Stems Total" basado en los valores cargados
                    updateStemsTotal(groupId);
                }
            });

            // Después de cargar los datos, actualizar todos los cálculos
            updateAllCalculations();
        }
    } // <-- Cierre de la función loadTableData

    // Función para generar el archivo Excel utilizando ExcelJS
    async function generateExcelFile() {
        const workbook = new ExcelJS.Workbook();

        // Generar la hoja principal
        const worksheet = workbook.addWorksheet('Inventario');

        // Añadir el Responsable del Conteo y la Fecha/Hora de generación
        const responsable = responsableInput.value.trim() || "Desconocido";
        const fechaHora = new Date().toLocaleString();

        worksheet.mergeCells('A1:T1');
        worksheet.getCell('A1').value = `Responsable del Conteo: ${responsable}`;
        worksheet.getCell('A1').font = { bold: true };

        worksheet.mergeCells('A2:T2');
        worksheet.getCell('A2').value = `Fecha y Hora de Generación: ${fechaHora}`;
        worksheet.getCell('A2').font = { bold: true };

        // Espacio en blanco
        worksheet.addRow([]);

        // Encabezados
        const headers = ["Variety", "Tipo", "Batch", "Fecha", "TJ - REG", "Long", "P1", "P2", "P3", "P4", "R1", "R2", "R3", "R4", "Bunches/Procona", "Bunches Total", "Stems", "Stems Total", "Notas"];
        const headerRow = worksheet.addRow(headers);

        // Aplicar estilos a los encabezados
        headerRow.eachCell((cell, colNumber) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDDEBF7' } // Azul suave
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

        // Recopilar datos de la tabla
        const rows = dataTable.querySelectorAll('tr');
        let rowIndex = worksheet.rowCount + 1; // Siguiente fila disponible en el worksheet

        // Datos para las hojas adicionales
        let dataByBouquetType = [];
        let dataByLength = [];
        let dataByBatch = []; // Nueva variable para la hoja "Por Batch"

        let variety = '';
        let batch = '';
        let fechaValue = '';

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowData = {};
            const excelRowData = [];
            const groupId = row.getAttribute('data-group-id');
            if (!groupId) continue; // Ignorar filas sin groupId

            const isMainRow = row.cells[0].getAttribute('data-col') === 'Variety';

            if (isMainRow) {
                const rowspan = parseInt(row.cells[0].getAttribute('rowspan')) || 1;

                // Agregar los datos de "Variety", "Tipo", "Batch", "Fecha"
                variety = row.cells[0].querySelector('select').value;
                const tipo = row.cells[1].innerText.trim();
                batch = row.cells[2].innerText.trim();
                // Obtener "Fecha"
                const fechaCell = row.querySelector('td[data-col="Fecha"]');
                const fechaInput = fechaCell ? fechaCell.querySelector('input') : null;
                fechaValue = fechaInput ? fechaInput.value : '';

                excelRowData.push(variety); // "Variety"
                excelRowData.push(tipo); // "Tipo"
                excelRowData.push(batch); // "Batch"
                excelRowData.push(fechaValue); // "Fecha"

                // Registrar las celdas combinadas para "Variety", "Tipo", "Batch", "Fecha"
                if (rowspan > 1) {
                    worksheet.mergeCells(rowIndex, 1, rowIndex + rowspan - 1, 1); // "Variety"
                    worksheet.mergeCells(rowIndex, 2, rowIndex + rowspan - 1, 2); // "Tipo"
                    worksheet.mergeCells(rowIndex, 3, rowIndex + rowspan - 1, 3); // "Batch"
                    worksheet.mergeCells(rowIndex, 4, rowIndex + rowspan - 1, 4); // "Fecha"
                }
            } else {
                // Para subfilas, usamos el último valor de variety y batch
                excelRowData.push(""); // "Variety"
                excelRowData.push(""); // "Tipo"
                excelRowData.push(""); // "Batch"
                excelRowData.push(""); // "Fecha"
            }

            // Obtener los demás datos
            const cells = row.querySelectorAll('td');
            const startIndex = isMainRow ? 4 : 0; // Ajuste por "Variety", "Tipo", "Batch" y "Fecha"

            let tjRegValue = '';
            let longValue = '';
            let stemsValue = 0;
            let bunchesTotalValue = 0;

            for (let j = startIndex; j < cells.length; j++) {
                const cell = cells[j];
                const dataCol = cell.getAttribute('data-col');

                if (dataCol) {
                    if (dataCol === "TJ - REG") {
                        const select = cell.querySelector('select');
                        const value = select ? select.value : '';
                        excelRowData.push(value);
                        rowData['TJ - REG'] = value;
                        tjRegValue = value;
                    } else if (dataCol === "Long") {
                        const value = cell.innerText.trim();
                        excelRowData.push(value);
                        rowData['Long'] = value;
                        longValue = value;
                    } else if (dataCol === "Stems") {
                        const value = parseInt(cell.innerText.trim()) || 0;
                        excelRowData.push(value);
                        rowData['Stems'] = value;
                        stemsValue = value;
                    } else if (dataCol === "Bunches Total") {
                        const value = parseInt(cell.innerText.trim()) || 0;
                        excelRowData.push(value);
                        rowData['Bunches Total'] = value;
                        bunchesTotalValue = value;
                    } else if (dataCol === "Stems Total" && isMainRow) {
                        const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;
                        excelRowData.push(cell.innerText.trim());

                        // Registrar la celda combinada para "Stems Total"
                        if (rowspan > 1) {
                            const colIndex = headers.indexOf("Stems Total") + 1;
                            worksheet.mergeCells(rowIndex, colIndex, rowIndex + rowspan - 1, colIndex);
                        }
                    } else if (dataCol === "Notas") {
                        excelRowData.push(cell.innerText.trim());
                    } else if (dataCol === "Acciones" && isMainRow) {
                        // Ignorar la columna "Acciones" en el Excel
                    } else if (dataCol !== "Acciones") {
                        excelRowData.push(cell.innerText.trim());
                    }
                }
            }

            const excelRow = worksheet.addRow(excelRowData);

            // Aplicar estilos a las celdas
            excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Aplicar colores a columnas específicas
            const bunchesTotalColIndex = headers.indexOf("Bunches Total") + 1;
            const stemsTotalColIndex = headers.indexOf("Stems Total") + 1;

            // Color naranja suave para "Bunches Total"
            if (bunchesTotalColIndex > 0) {
                excelRow.getCell(bunchesTotalColIndex).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFCE4D6' } // Naranja suave
                };
            }

            // Color azul suave para "Stems Total"
            if (stemsTotalColIndex > 0) {
                excelRow.getCell(stemsTotalColIndex).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFDDEBF7' } // Azul suave
                };
            }

            // Agregar datos para las hojas adicionales
            if (tjRegValue && longValue && stemsValue > 0) {
                // Para la hoja "Por Tipo de Ramo"
                dataByBouquetType.push({
                    Variety: variety,
                    'TJ - REG': tjRegValue,
                    Long: longValue,
                    'Bunches Total': bunchesTotalValue,
                    Stems: stemsValue
                });
            }

            if (longValue && stemsValue > 0) {
                // Para la hoja "Por Longitud"
                dataByLength.push({
                    Variety: variety,
                    Long: longValue,
                    Stems: stemsValue
                });
            }

            if (variety && batch && longValue && stemsValue > 0) {
                // Para la hoja "Por Batch"
                dataByBatch.push({
                    Variety: variety,
                    Batch: batch,
                    Long: longValue,
                    Stems: stemsValue,
                    Fecha: fechaValue // Agregamos la fecha
                });
            }

            rowIndex++;
        }

        // Añadir la fila del Gran Total al final
        const grandTotalValueElement = document.getElementById('grandTotalValue');
        const grandTotalValue = grandTotalValueElement ? grandTotalValueElement.innerText.trim() : '0';
        const grandTotalRow = worksheet.addRow([]);

        // Combinar celdas para el texto del Gran Total
        const totalLabelCell = grandTotalRow.getCell(1);
        totalLabelCell.value = "Gran Total de Stems:";
        totalLabelCell.font = { bold: true };
        totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
        worksheet.mergeCells(grandTotalRow.number, 1, grandTotalRow.number, headers.length - 1);

        // Celda para el valor del Gran Total
        const totalValueCell = grandTotalRow.getCell(headers.length);
        totalValueCell.value = parseInt(grandTotalValue) || 0;
        totalValueCell.font = { bold: true };
        totalValueCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Aplicar estilos a la fila del Gran Total
        grandTotalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.border = {
                top: { style: 'double' },
                left: { style: 'thin' },
                bottom: { style: 'double' },
                right: { style: 'thin' }
            };
        });

        // Ajustar el ancho de las columnas
        worksheet.columns.forEach(column => {
            column.width = 15; // Puedes ajustar este valor según tus necesidades
        });

        // ============================
        // Generar la hoja "Por Tipo de Ramo"
        // ============================
        const bouquetSheet = workbook.addWorksheet('Por Tipo de Ramo');

        // Encabezados para la hoja "Por Tipo de Ramo"
        const bouquetHeaders = ["Variety", "TJ - REG", "Long", "Bunches Total", "Stems"];
        const bouquetHeaderRow = bouquetSheet.addRow(bouquetHeaders);

        // Aplicar estilos a los encabezados
        bouquetHeaderRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' }
            };
        });

        // Agrupar y sumar los datos
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

        // Agregar los datos agrupados a la hoja
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

        // Ajustar el ancho de las columnas
        bouquetSheet.columns.forEach(column => {
            column.width = 20; // Ajusta según tus necesidades
        });

        // ============================
        // Generar la hoja "Por Longitud"
        // ============================
        const lengthSheet = workbook.addWorksheet('Por Longitud');

        // Encabezados para la hoja "Por Longitud"
        const lengthHeaders = ["Variety", "Long", "Stems"];
        const lengthHeaderRow = lengthSheet.addRow(lengthHeaders);

        // Aplicar estilos a los encabezados
        lengthHeaderRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' }
            };
        });

        // Agrupar y sumar los datos
        const lengthDataMap = {};

        dataByLength.forEach(item => {
            const key = `${item.Variety}_${item.Long}`;
            if (!lengthDataMap[key]) {
                lengthDataMap[key] = { ...item };
            } else {
                lengthDataMap[key]['Stems'] += item['Stems'];
            }
        });

        // Agregar los datos agrupados a la hoja
        Object.values(lengthDataMap).forEach(item => {
            lengthSheet.addRow([
                item.Variety,
                item.Long,
                item.Stems
            ]).eachCell(cell => {
                cell.alignment = { horizontal: 'center' };
            });
        });

        // Ajustar el ancho de las columnas
        lengthSheet.columns.forEach(column => {
            column.width = 20; // Ajusta según tus necesidades
        });

        // ============================
        // Generar la hoja "Por Batch"
        // ============================
        const batchSheet = workbook.addWorksheet('Por Batch');

        // Encabezados para la hoja "Por Batch"
        const batchHeaders = ["Variety", "Batch", "Long", "Stems", "Fecha"];
        const batchHeaderRow = batchSheet.addRow(batchHeaders);

        // Aplicar estilos a los encabezados
        batchHeaderRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' }
            };
        });

        // Agrupar y sumar los datos
        const batchDataMap = {};

        dataByBatch.forEach(item => {
            const key = `${item.Variety}_${item.Batch}_${item.Long}_${item.Fecha}`;
            if (!batchDataMap[key]) {
                batchDataMap[key] = { ...item };
            } else {
                batchDataMap[key]['Stems'] += item['Stems'];
            }
        });

        // Agregar los datos agrupados a la hoja
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

        // Ajustar el ancho de las columnas
        batchSheet.columns.forEach(column => {
            column.width = 20; // Ajusta según tus necesidades
        });

        // Descargar el archivo Excel
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'Inventario.xlsx');
    }

    // Función para actualizar todas las calculaciones (usada después de cargar datos o cambiar configuración)
    function updateAllCalculations() {
        // Recargar la configuración
        config = JSON.parse(localStorage.getItem('config')) || {};

        const allRows = dataTable.querySelectorAll('tr');
        allRows.forEach(row => {
            updateCalculations(row);
        });
        updateGrandTotal();
    }

    // Función para recargar la configuración y recalcular todo
    function reloadConfigAndRecalculate() {
        config = JSON.parse(localStorage.getItem('config')) || {};
        updateAllCalculations();
    }

    // Función para resetear la tabla
    function resetTable() {
        if (confirm('¿Estás seguro de que deseas eliminar todos los grupos?')) {
            // Eliminar todas las filas de la tabla
            dataTable.innerHTML = '';
            // Limpiar el almacenamiento local
            localStorage.removeItem('tableData');
            // Resetear el Gran Total
            updateGrandTotal();
            showAlert('Todos los grupos han sido eliminados.', 'warning');
        }
    }

    // ============================
    // Event Listeners
    // ============================

    // Manejo del botón para cerrar el sidebar
    if (closeSidebarBtn && sidebarMenu) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebarMenu.classList.remove('show');
        });
    }

    // Event listener para el botón "Agregar Grupo"
    addGroupBtn.addEventListener('click', addGroup);

    // Event listener para el botón "Resetear Tabla"
    if (resetTableBtn) {
        resetTableBtn.addEventListener('click', resetTable);
    }

    // Event listener para el botón "Generar Excel"
    if (generateExcelBtn) {
        generateExcelBtn.addEventListener('click', () => {
            generateExcelFile();
        });
    }

    // Mostrar el menú lateral al hacer clic en el botón de toggle
    if (toggleSidebarBtn && sidebarMenu) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebarMenu.classList.add('show');
        });
    }

    // ============================
    // Inicializaciones
    // ============================

    // Cargar datos existentes o agregar un nuevo grupo si no existen
    if (!localStorage.getItem('tableData')) {
        addGroup();
    } else {
        loadTableData();
    }

    // Event Listener para cambios en las celdas
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

            // Actualizar el Gran Total
            updateGrandTotal();
        }
    });

    // Event Listener para el input de "Responsable"
    responsableInput.addEventListener('input', saveTableData);
    window.addEventListener('beforeunload', saveTableData);

    // Event Listener para las celdas editables con navegación por teclado
    dataTable.addEventListener('keydown', (event) => {
        const cell = event.target;
        if (cell.classList.contains('editable')) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Evitar salto de línea
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

    // Función para obtener la siguiente celda editable
    function getNextEditableCell(currentCell) {
        const cells = dataTable.querySelectorAll('.editable');
        const cellArray = Array.from(cells);
        const currentIndex = cellArray.indexOf(currentCell);

        if (currentIndex >= 0 && currentIndex < cellArray.length - 1) {
            return cellArray[currentIndex + 1];
        } else {
            // Si es la última celda, volver al inicio
            return cellArray[0];
        }
    }

    // Función para obtener la celda adyacente en una dirección específica
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

    // ============================
    // Exposición de Funciones Globales
    // ============================
    window.saveTableData = saveTableData;
    window.updateAllCalculations = updateAllCalculations;
    window.reloadConfigAndRecalculate = reloadConfigAndRecalculate;
});
