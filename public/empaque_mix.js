document.addEventListener('DOMContentLoaded', () => {
    const empaqueMixBtn = document.getElementById('empaqueMixBtn');
    const empaqueMixSection = document.getElementById('empaqueMixSection');

    const addEmpaqueMixGroupBtn = document.getElementById("addEmpaqueMixGroupBtn");
    const resetEmpaqueMixBtn = document.getElementById("resetEmpaqueMixBtn");

    // Obtén el botón y la sección correspondiente
    const packrateMixBtn = document.getElementById('packrateMixBtn');
    const packrateMixSection = document.getElementById('packrateMixSection');

    let empaqueMixGroupIdCounter = 1;

    if (empaqueMixBtn) {
        empaqueMixBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Ocultar otras secciones (suponiendo que ya tienes inventarioSection, empaqueSection, packrateSection)
          inventarioSection.style.display = 'none';
          empaqueSection.style.display = 'none';
          packrateSection.style.display = 'none';
          packrateMixSection.style.display = 'none';
          // Mostrar Empaque Mix
          empaqueMixSection.style.display = 'block';
        });
    }

    if (packrateMixBtn) {
        packrateMixBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Ocultar otras secciones
          inventarioSection.style.display = 'none';
          empaqueSection.style.display = 'none';
          packrateSection.style.display = 'none';
          empaqueMixSection.style.display = 'none';
          // Mostrar solo Pack Rate Mix
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

    function generatePackRateMixTable() {
        const table = document.getElementById("packrateMixTable");
        if (!table) return;
        const tbody = table.querySelector("tbody");
        tbody.innerHTML = ""; // Limpia el contenido previo
      
        // Definimos un array con los nombres de las columnas editables
        const editableCols = ["ARTIST", "CAYA", "JUNE", "NAVY", "ROSWiTHA"];
      
        // --- Función auxiliar para crear una fila ---
        function createRow(ramo, boxes, longVal) {
          const tr = document.createElement("tr");
          // Columna RAMO
          const tdRamo = document.createElement("td");
          tdRamo.innerText = ramo;
          tr.appendChild(tdRamo);
          // Columna PACKRATE MIX BOXES
          const tdBoxes = document.createElement("td");
          tdBoxes.innerText = boxes;
          tr.appendChild(tdBoxes);
          // Columna LONG
          const tdLong = document.createElement("td");
          tdLong.innerText = longVal;
          tr.appendChild(tdLong);
          // Columnas editables
          editableCols.forEach(colName => {
            const td = document.createElement("td");
            td.contentEditable = true;
            td.innerText = ""; // valor inicial vacío
            tr.appendChild(td);
          });
          return tr;
        }
      
        // --- Generar filas según las indicaciones ---
      
        // 1. Para RAMO "TJ": 8 filas con LONG = 60
        for (let i = 1; i <= 8; i++) {
          tbody.appendChild(createRow("TJ", "Smart MIX TJ " + i, "60"));
        }
        // 2. Para RAMO "TJ": 8 filas con LONG = 55
        for (let i = 1; i <= 8; i++) {
          tbody.appendChild(createRow("TJ", "Smart MIX TJ " + i, "55"));
        }
        // 3. Para RAMO "NF": 8 filas con LONG = 55
        for (let i = 1; i <= 8; i++) {
          tbody.appendChild(createRow("NF", "Smart MIX NF " + i, "55"));
        }
        // 4. Para RAMO "NF": 8 filas con LONG = 50
        for (let i = 1; i <= 8; i++) {
          tbody.appendChild(createRow("NF", "Smart MIX NF " + i, "50"));
        }
        // 5. Para RAMO "REG": 3 filas para LONG = 60 (HB, QB, EB)
        const regTypes = ["HB", "QB", "EB"];
        regTypes.forEach(type => {
          tbody.appendChild(createRow("REG", "Smart MIX " + type, "60"));
        });
        // 6. Para RAMO "REG": 3 filas para LONG = 55
        regTypes.forEach(type => {
          tbody.appendChild(createRow("REG", "Smart MIX " + type, "55"));
        });
        // 7. Para RAMO "REG": 3 filas para LONG = 50
        regTypes.forEach(type => {
          tbody.appendChild(createRow("REG", "Smart MIX " + type, "50"));
        });
        // 8. Para RAMO "WS10": 3 filas para cada LONG (60, 55, 50) – Total 9 filas.
        const ws10Types = ["HB", "QB", "EB"];
        [60, 55, 50].forEach(longVal => {
          ws10Types.forEach(type => {
            tbody.appendChild(createRow("WS10", "Smart MIX WS10 " + type, longVal.toString()));
          });
        });
    }

    function createEmpaqueMixGroupFixed(data = {}) {
        // Valores fijos para la columna VARIETY
        const fixedVarieties = ["ARTIST", "CAYA", "JUNE", "NAVY", "ROSWITHA"];
        
        // Asigna un ID único al grupo
        const groupId = "empaqueMixGroup-" + (empaqueMixGroupIdCounter++);
        const tbody = document.querySelector("#empaqueMixTable tbody");
        
        // --- Crear la fila header (primera fila del grupo) ---
        const trHeader = document.createElement("tr");
        trHeader.setAttribute("data-group-id", groupId);
        
        // Columna BOX (primera) con rowspan=5
        const tdBox = document.createElement("td");
        tdBox.rowSpan = 5;  
        tdBox.appendChild(createBoxSelect(data.box || ""));
        trHeader.appendChild(tdBox);
        
        // Columna #BOXES (segunda) con rowspan=5
        const tdNumBoxes = document.createElement("td");
        tdNumBoxes.rowSpan = 5;
        tdNumBoxes.contentEditable = true;
        tdNumBoxes.innerText = data.numBoxes || "";
        trHeader.appendChild(tdNumBoxes);
        
        // Columna VARIETY para la primera fila: asigna fixedVarieties[0] ("artist")
        const tdVariety = document.createElement("td");
        tdVariety.innerText = fixedVarieties[0];
        trHeader.appendChild(tdVariety);
        
        // Columna BUNCHES/BOX para la primera fila
        const tdBunches = document.createElement("td");
        tdBunches.contentEditable = true;
        tdBunches.innerText = (data.bunchesPerBox && data.bunchesPerBox[0]) ? data.bunchesPerBox[0] : "";
        trHeader.appendChild(tdBunches);
        
        // Columna ACCIONES con rowspan=5
        const tdActions = document.createElement("td");
        tdActions.rowSpan = 5; // Se establece rowspan=5
        tdActions.classList.add("text-center");
        
        // Botón para eliminar el grupo completo
        const deleteGroupBtn = document.createElement("button");
        deleteGroupBtn.innerHTML = '<i class="fa fa-trash"></i>';
        deleteGroupBtn.classList.add("btn", "btn-danger", "btn-sm");
        deleteGroupBtn.title = "Eliminar grupo completo";
        deleteGroupBtn.addEventListener("click", (e) => {
          e.preventDefault();
          // Elimina todas las filas que tengan el mismo groupId
          const groupRows = tbody.querySelectorAll(`tr[data-group-id="${groupId}"]`);
          groupRows.forEach(row => row.remove());
        });
        tdActions.appendChild(deleteGroupBtn);
        trHeader.appendChild(tdActions);
        
        // Agregar la fila header al tbody
        tbody.appendChild(trHeader);
        
        // --- Crear las 4 subfilas restantes (para completar las 5 filas) ---
        for (let i = 1; i < 5; i++) {
          const tr = document.createElement("tr");
          tr.setAttribute("data-group-id", groupId);
          
          // En estas subfilas no se crean las columnas BOX, #BOXES y ACCIONES (ya que se fusionaron)
          
          // Columna VARIETY: asigna el valor fijo correspondiente
          const tdVar = document.createElement("td");
          tdVar.innerText = fixedVarieties[i];
          tr.appendChild(tdVar);
          
          // Columna BUNCHES/BOX: editable
          const tdBunch = document.createElement("td");
          tdBunch.contentEditable = true;
          tdBunch.innerText = (data.bunchesPerBox && data.bunchesPerBox[i]) ? data.bunchesPerBox[i] : "";
          tr.appendChild(tdBunch);
          
          // (No se agrega la columna ACCIONES en estas subfilas)
          tbody.appendChild(tr);
        }
    }

    function resetEmpaqueMixTable() {
        const tbody = document.querySelector("#empaqueMixTable tbody");
        tbody.innerHTML = "";
    }

});