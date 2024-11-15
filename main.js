// main.js

document.addEventListener('DOMContentLoaded', () => {
    // ============================
    // Declaración de Variables
    // ============================
    const addGroupBtn = document.getElementById('addGroupBtn');
    const generateExcelBtn = document.getElementById('generateExcelBtn');
    const dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    const responsableInput = document.getElementById('responsable');
    const alertPlaceholder = document.getElementById('alertPlaceholder');

    // Elementos del menú lateral
    const sidebarMenu = document.getElementById('sidebarMenu');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    // Variables de configuración y datos
    let config = JSON.parse(localStorage.getItem('config')) || {};

    const longDefaults = [70, 60, 55]; // Puedes ajustar las longitudes predeterminadas aquí
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
            const tipoCell = row.querySelector('td[data-col="Tipo"]');
            const selectedTipo = getTipoForVariety(selectVariety.value);
            if (tipoCell) {
                tipoCell.innerText = selectedTipo || '';
            }

            // Actualizar cálculos para todas las filas del grupo
            const groupId = row.getAttribute('data-group-id');
            const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
            groupRows.forEach(groupRow => {
                updateCalculations(groupRow);
            });

            saveTableData();
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
    function createTJRegSelect(selectedValue = '') {
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
        if (rowspan > 1) {
            cell.setAttribute('rowspan', rowspan);
        }
        cell.innerText = value;
        return cell;
    }

    // Función para agregar celdas de datos a una fila
    function addDataCellsToRow(row, index, groupId, isMainRow = true) {
        const fieldsToUse = fields;

        fieldsToUse.forEach((field) => {
            const cell = document.createElement('td');
            cell.classList.add('editable');
            cell.setAttribute('data-col', field);

            if (field === "TJ - REG") {
                const select = createTJRegSelect();
                cell.appendChild(select);
            } else if (field === "Long") {
                cell.contentEditable = true;
                cell.innerText = longDefaults[index] || '';
                cell.addEventListener('input', () => {
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
                cell.innerText = '0';
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

    // Función para agregar un nuevo grupo
    function addGroup() {
        const groupId = Date.now();
        const mainRow = dataTable.insertRow();
        mainRow.setAttribute('data-group-id', groupId);

        // Crear celdas "Variety" y "Tipo" con rowspan=3
        const varietyCell = createVarietySelect();
        varietyCell.setAttribute('rowspan', 3);
        mainRow.appendChild(varietyCell);

        const tipoCell = document.createElement('td');
        tipoCell.setAttribute('data-col', 'Tipo');
        tipoCell.setAttribute('rowspan', 3);
        tipoCell.innerText = ''; // Inicialmente vacío
        mainRow.appendChild(tipoCell);

        // Crear celda "Batch"
        const batchCell = createEditableCell('Batch', '', 3);
        mainRow.appendChild(batchCell);

        // Agregar celdas de datos para la primera fila
        addDataCellsToRow(mainRow, 0, groupId, true);

        // Agregar la celda de "Stems Total" con rowspan=3 en la primera fila
        const stemsTotalCell = document.createElement('td');
        stemsTotalCell.setAttribute('rowspan', 3);
        stemsTotalCell.classList.add('text-center');
        stemsTotalCell.setAttribute('data-col', 'Stems Total');
        stemsTotalCell.innerText = '0';

        // Encontrar el índice de la celda "Notas"
        const notasCell = mainRow.querySelector('td[data-col="Notas"]');
        const notasIndex = Array.prototype.indexOf.call(mainRow.cells, notasCell);

        // Insertar "Stems Total" antes de la celda "Notas"
        mainRow.insertBefore(stemsTotalCell, mainRow.cells[notasIndex]);

        // Agregar la celda de "Acciones" con rowspan=3 en la primera fila
        const actionCell = document.createElement('td');
        actionCell.setAttribute('rowspan', 3);
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

        // Agregar dos subfilas
        for (let i = 1; i < 3; i++) {
            const subRow = dataTable.insertRow();
            subRow.setAttribute('data-group-id', groupId);
            addDataCellsToRow(subRow, i, groupId, false);
        }

        updateCalculations(mainRow);
        updateStemsTotal(groupId);
        saveTableData();
        showAlert('Grupo agregado correctamente.');

        // Actualizar el Gran Total
        updateGrandTotal();
    }

    // Función para actualizar cálculos en una fila
    function updateCalculations(row) {
        const groupId = row.getAttribute('data-group-id');
        if (!groupId) {
            console.warn('La fila no tiene un ID de grupo.');
            return;
        }

        // Encontrar la fila principal del grupo
        const mainRow = dataTable.querySelector(`tr[data-group-id="${groupId}"]`);
        if (!mainRow) {
            console.warn(`No se encontró la fila principal para el ID de grupo ${groupId}.`);
            return;
        }

        const tipoCell = mainRow.querySelector('td[data-col="Tipo"]');
        const tipo = tipoCell ? tipoCell.innerText.trim() : '';

        if (!tipo || !config[tipo]) {
            console.warn(`Configuración para la categoría "${tipo}" no encontrada.`);
            return;
        }

        const tjRegCell = row.querySelector('td[data-col="TJ - REG"] select');
        const longCell = row.querySelector('td[data-col="Long"]');
        const tjRegValue = tjRegCell ? tjRegCell.value : '';
        const longValue = parseInt(longCell ? longCell.innerText.trim() : '0');

        const pFields = ["P1", "P2", "P3", "P4"];
        const rFields = ["R1", "R2", "R3", "R4"];

        let bunchesPerProcona = 0;
        let stemsPerBunch = 0;

        // Obtener valores de configuración basados en la categoría
        if (tjRegValue === "TJ" || tjRegValue === "WS10") {
            bunchesPerProcona = config[tipo][tjRegValue].bunchesPerProcona;
            stemsPerBunch = config[tipo][tjRegValue].stemsPerBunch;
            // En TJ y WS10, la longitud no importa para Bunches/Procona o StemsPerBunch
        } else if (tjRegValue === "REG") {
            // Para REG, la longitud puede afectar BunchesPerProcona y StemsPerBunch
            const regConfig = config[tipo].REG;

            // Obtener stemsPerBunch
            if (regConfig.lengths && regConfig.lengths[longValue] && regConfig.lengths[longValue].stemsPerBunch !== undefined) {
                stemsPerBunch = regConfig.lengths[longValue].stemsPerBunch;
            } else if (regConfig.stemsPerBunch !== undefined) {
                stemsPerBunch = regConfig.stemsPerBunch;
            } else {
                stemsPerBunch = 0;
            }

            // Obtener bunchesPerProcona
            if (regConfig.lengths && regConfig.lengths[longValue] && regConfig.lengths[longValue].bunchesPerProcona !== undefined) {
                bunchesPerProcona = regConfig.lengths[longValue].bunchesPerProcona;
            } else {
                bunchesPerProcona = 0;
                console.warn(`Longitud ${longValue} no está definida en config.${tipo}.REG.lengths.`);
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
            const value = parseInt(cell ? cell.innerText.trim() : '0') || 0;
            if (value > 0) {
                bunchesTotal += value * bunchesPerProcona;
            }
        });

        // Calcular para R1-R4 (sumar directamente)
        rFields.forEach(field => {
            const cell = row.querySelector(`td[data-col="${field}"]`);
            const value = parseInt(cell ? cell.innerText.trim() : '0') || 0;
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
        // ... [El código de saveTableData permanece igual]
    }

    // Función para cargar los datos de la tabla desde el almacenamiento local
    function loadTableData() {
        // ... [El código de loadTableData permanece igual]

        // Después de cargar los datos, actualizar los cálculos
        updateAllCalculations();
    }

    // Función para generar el archivo Excel utilizando ExcelJS
    async function generateExcelFile() {
        // ... [El código de generateExcelFile permanece igual]
    }

    // Función para actualizar todas las calculaciones (usada después de cargar datos o cambiar configuración)
    function updateAllCalculations() {
        const allRows = dataTable.querySelectorAll('tr');
        allRows.forEach(row => {
            updateCalculations(row);
        });
        updateGrandTotal();
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

    // Event Listeners para las celdas
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

    responsableInput.addEventListener('input', saveTableData);
    window.addEventListener('beforeunload', saveTableData);

    // ============================
    // Exposición de Funciones Globales
    // ============================
    window.saveTableData = saveTableData;
    window.updateAllCalculations = updateAllCalculations;
});
