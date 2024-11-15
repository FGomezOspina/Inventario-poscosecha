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
                // Obtener "Stems Total"
                const stemsTotalCell = row.querySelector('td[data-col="Stems Total"]');
                group.stemsTotal = stemsTotalCell ? parseInt(stemsTotalCell.innerText.trim()) : 0;
            }

            // Solo guardar datos de filas que contienen datos (excluye las celdas con rowspan y acciones)
            const rowData = {};
            const startIndex = isMainRow ? 3 : 0; // Ajuste por "Variety", "Tipo" y "Batch"
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
        // ... [El código de loadTableData permanece igual]
        const data = JSON.parse(localStorage.getItem('tableData'));
        const responsable = localStorage.getItem('responsable') || '';
        responsableInput.value = responsable;

        if (data && Object.keys(data).length > 0) {
            Object.keys(data).forEach(groupId => {
                const group = data[groupId];
                if (group.rows.length > 0) {
                    const mainRow = dataTable.insertRow();
                    mainRow.setAttribute('data-group-id', groupId);

                    // Crear celdas "Variety" y "Tipo" con rowspan igual al número de filas
                    const varietyCell = createVarietySelect(group.variety);
                    varietyCell.setAttribute('rowspan', group.rows.length);
                    mainRow.appendChild(varietyCell);

                    const tipoCell = document.createElement('td');
                    tipoCell.setAttribute('data-col', 'Tipo');
                    tipoCell.setAttribute('rowspan', group.rows.length);
                    tipoCell.innerText = group.tipo || '';
                    mainRow.appendChild(tipoCell);

                    // Crear celda "Batch"
                    const batchCell = createEditableCell('Batch', group.batch, group.rows.length);
                    mainRow.appendChild(batchCell);

                    // Agregar celdas de datos para la primera fila
                    addDataCellsToRow(mainRow, 0, groupId, true);

                    // Agregar la celda de "Stems Total" con rowspan
                    const stemsTotalCell = document.createElement('td');
                    stemsTotalCell.setAttribute('rowspan', group.rows.length);
                    stemsTotalCell.classList.add('text-center');
                    stemsTotalCell.setAttribute('data-col', 'Stems Total');
                    stemsTotalCell.innerText = group.stemsTotal || '0';

                    // Encontrar el índice de la celda "Notas"
                    const notasCell = mainRow.querySelector('td[data-col="Notas"]');
                    const notasIndex = Array.prototype.indexOf.call(mainRow.cells, notasCell);

                    // Insertar "Stems Total" antes de la celda "Notas"
                    mainRow.insertBefore(stemsTotalCell, mainRow.cells[notasIndex]);

                    // Agregar la celda de "Acciones" con rowspan
                    const actionCell = document.createElement('td');
                    actionCell.setAttribute('rowspan', group.rows.length);
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
                        const cellIndex = idx + 3; // Ajuste por "Variety", "Tipo" y "Batch"
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
                    for (let i = 1; i < group.rows.length; i++) {
                        const subRow = dataTable.insertRow();
                        subRow.setAttribute('data-group-id', groupId);
                        addDataCellsToRow(subRow, i, groupId, false);

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
                    const groupRows = dataTable.querySelectorAll(`tr[data-group-id="${groupId}"]`);
                    groupRows.forEach(row => {
                        updateCalculations(row);
                    });

                    // Actualizar "Stems Total" basado en los valores cargados
                    updateStemsTotal(groupId);
                }
            });
        }
    }

    // Función para generar el archivo Excel utilizando ExcelJS
    async function generateExcelFile() {
        const workbook = new ExcelJS.Workbook();

        // Generar la hoja principal
        const worksheet = workbook.addWorksheet('Inventario');

        // Añadir el Responsable del Conteo y la Fecha/Hora de generación
        const responsable = responsableInput.value.trim() || "Desconocido";
        const fechaHora = new Date().toLocaleString();

        worksheet.mergeCells('A1:S1');
        worksheet.getCell('A1').value = `Responsable del Conteo: ${responsable}`;
        worksheet.getCell('A1').font = { bold: true };

        worksheet.mergeCells('A2:S2');
        worksheet.getCell('A2').value = `Fecha y Hora de Generación: ${fechaHora}`;
        worksheet.getCell('A2').font = { bold: true };

        // Espacio en blanco
        worksheet.addRow([]);

        // Encabezados
        const headers = ["Variety", "Tipo", "Batch", "TJ - REG", "Long", "P1", "P2", "P3", "P4", "R1", "R2", "R3", "R4", "Bunches/Procona", "Bunches Total", "Stems", "Stems Total", "Notas"];
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

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowData = {};
            const excelRowData = [];
            const groupId = row.getAttribute('data-group-id');
            if (!groupId) continue; // Ignorar filas sin groupId

            const isMainRow = row.cells[0].getAttribute('data-col') === 'Variety';

            if (isMainRow) {
                const rowspan = parseInt(row.cells[0].getAttribute('rowspan')) || 1;

                // Agregar los datos de "Variety", "Tipo" y "Batch"
                variety = row.cells[0].querySelector('select').value;
                const tipo = row.cells[1].innerText.trim();
                batch = row.cells[2].innerText.trim();

                excelRowData.push(variety); // "Variety"
                excelRowData.push(tipo); // "Tipo"
                excelRowData.push(batch); // "Batch"

                // Registrar las celdas combinadas para "Variety", "Tipo" y "Batch"
                if (rowspan > 1) {
                    worksheet.mergeCells(rowIndex, 1, rowIndex + rowspan - 1, 1); // "Variety"
                    worksheet.mergeCells(rowIndex, 2, rowIndex + rowspan - 1, 2); // "Tipo"
                    worksheet.mergeCells(rowIndex, 3, rowIndex + rowspan - 1, 3); // "Batch"
                }
            } else {
                // Para subfilas, usamos el último valor de variety y batch
                excelRowData.push(""); // "Variety"
                excelRowData.push(""); // "Tipo"
                excelRowData.push(""); // "Batch"
            }

            // Obtener los demás datos
            const cells = row.querySelectorAll('td');
            const startIndex = isMainRow ? 3 : 0; // Ajuste para las celdas "Variety", "Tipo" y "Batch"

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
                    Stems: stemsValue
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
        bouquetSheet.addRow(bouquetHeaders).eachCell(cell => {
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
        lengthSheet.addRow(lengthHeaders).eachCell(cell => {
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
        const batchHeaders = ["Variety", "Batch", "Long", "Stems"];
        batchSheet.addRow(batchHeaders).eachCell(cell => {
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
            const key = `${item.Variety}_${item.Batch}_${item.Long}`;
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
                item.Stems
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
