const censusForm = document.getElementById('censusForm');
const censusContainer = document.getElementById('censusContainer');
const censusRef = db.collection("dune_census");

// 1. CARGAR DESPLEGABLE CON TU CATÁLOGO REAL
async function loadItemSelect() {
    try {
        const snap = await itemsRef.orderBy('nombre').get();
        const select = document.getElementById('censusItem');
        select.innerHTML = '<option value="">-- Selecciona Máquina --</option>';
        
        snap.forEach(doc => {
            const item = doc.data();
            if (item.categoria !== "Basicos") {
                const opt = document.createElement('option');
                opt.value = item.nombre;
                const mk = item.version && item.version !== 'Base' ? ` [${item.version}]` : '';
                opt.textContent = item.nombre + mk;
                select.appendChild(opt);
            }
        });
    } catch (e) { 
        console.error("Error catálogo:", e);
        document.getElementById('censusItem').innerHTML = '<option>Error al cargar</option>';
    }
}

// 2. GUARDAR REGISTRO
censusForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        planta: document.getElementById('censusFloor').value,
        zona: document.getElementById('censusZone').value,
        nombre: document.getElementById('censusItem').value,
        cantidad: parseInt(document.getElementById('censusQty').value),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await censusRef.add(data);
        censusForm.reset();
        loadCensus();
    } catch (e) { 
        alert("Error al guardar en Firebase"); 
    }
});

// 3. CARGAR Y RENDERIZAR EL CENSO
async function loadCensus() {
    const floorFilter = document.getElementById('filterFloor').value;
    censusContainer.innerHTML = "<p style='color: #888;'>Sincronizando con Arrakis...</p>";

    try {
        let query = censusRef.orderBy("zona");
        if (floorFilter !== "all") {
            query = query.where("planta", "==", floorFilter);
        }

        const snap = await query.get();
        censusContainer.innerHTML = "";

        if (snap.empty) {
            censusContainer.innerHTML = "<div style='color:#666; padding:20px;'>No hay maquinaria registrada aquí.</div>";
            return;
        }

        const groups = {};
        snap.forEach(doc => {
            const d = doc.data();
            if (!groups[d.zona]) groups[d.zona] = [];
            groups[d.zona].push({ id: doc.id, ...d });
        });

        for (const zona in groups) {
            const section = document.createElement('div');
            section.className = "census-zone-card";
            
            let html = `<h3><i class="fas fa-th-large"></i> ZONA: ${zona}</h3>`;
            groups[zona].forEach(item => {
                html += `
                    <div class="census-item">
                        <div class="info">
                            <span class="qty">${item.cantidad}x</span>
                            <span class="name">${item.nombre}</span>
                            <span class="planta-tag">${item.planta}</span>
                        </div>
                        <button class="btn-del" onclick="deleteCensus('${item.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            });
            section.innerHTML = html;
            censusContainer.appendChild(section);
        }
    } catch (e) { 
        console.error(e);
        censusContainer.innerHTML = "<p style='color:red;'>Error de conexión.</p>";
    }
}

async function deleteCensus(id) {
    if (confirm("¿Eliminar este registro de la base de datos?")) {
        await censusRef.doc(id).delete();
        loadCensus();
    }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    loadItemSelect();
    loadCensus();
});