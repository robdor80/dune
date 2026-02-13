const censusForm = document.getElementById('censusForm');
const censusContainer = document.getElementById('censusContainer');
const censusRef = db.collection("dune_census");
let itemImages = {}; // Guardaremos las URLs aquí

// 1. CARGAR CATÁLOGO Y MAPEAR IMÁGENES
async function loadItemSelect() {
    try {
        const snap = await itemsRef.orderBy('nombre').get();
        const select = document.getElementById('censusItem');
        select.innerHTML = '<option value="">-- Selecciona Máquina --</option>';
        
        snap.forEach(doc => {
            const item = doc.data();
            // Guardamos la imagen asociada al nombre para usarla luego
            if (item.imagen) {
                itemImages[item.nombre] = item.imagen;
            }

            if (item.categoria !== "Basicos") {
                const opt = document.createElement('option');
                opt.value = item.nombre;
                const mk = item.version && item.version !== 'Base' ? ` [${item.version}]` : '';
                opt.textContent = item.nombre + mk;
                select.appendChild(opt);
            }
        });
        // Una vez cargadas las imágenes, cargamos el censo
        loadCensus();
    } catch (e) { 
        console.error("Error catálogo:", e);
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
        alert("Error al guardar"); 
    }
});

// 3. CARGAR Y RENDERIZAR
async function loadCensus() {
    const floorFilter = document.getElementById('filterFloor').value;
    censusContainer.innerHTML = "<p style='color: #888;'>Sincronizando...</p>";

    try {
        let query = censusRef.orderBy("zona");
        if (floorFilter !== "all") {
            query = query.where("planta", "==", floorFilter);
        }

        const snap = await query.get();
        censusContainer.innerHTML = "";

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
                // Buscamos si tenemos imagen para este objeto, si no, una por defecto
                const imgUrl = itemImages[item.nombre] || 'https://via.placeholder.com/40?text=?';
                
                html += `
                    <div class="census-item">
                        <div class="info">
                            <img src="${imgUrl}" class="census-img" alt="${item.nombre}">
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
    } catch (e) { console.error(e); }
}

async function deleteCensus(id) {
    if (confirm("¿Eliminar registro?")) {
        await censusRef.doc(id).delete();
        loadCensus();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadItemSelect();
});