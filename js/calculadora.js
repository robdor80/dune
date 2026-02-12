// --- LÓGICA DEL ESCUDO (DASHBOARD) ---
let shieldEndTime = null;
const shieldDocRef = db.collection("dune_settings").doc("shield_status");

async function loadShieldStatus() {
    try {
        const doc = await shieldDocRef.get();
        if (doc.exists) {
            shieldEndTime = doc.data().expiry.toDate();
        } else {
            shieldEndTime = new Date();
            await shieldDocRef.set({ expiry: shieldEndTime });
        }
        startTimer();
    } catch (error) {
        console.error("Error cargando escudo:", error);
    }
}

async function updateShield(hours) {
    if (!shieldEndTime) return;
    let baseTime = shieldEndTime > new Date() ? shieldEndTime : new Date();
    baseTime.setHours(baseTime.getHours() + hours);
    shieldEndTime = baseTime;
    try {
        await shieldDocRef.update({ expiry: shieldEndTime });
    } catch (error) {
        console.error("Error al actualizar energía:", error);
    }
}

function startTimer() {
    const timerDisplay = document.getElementById('shieldTimer');
    setInterval(() => {
        const now = new Date();
        const diff = shieldEndTime - now;
        if (diff <= 0) {
            timerDisplay.innerText = "00:00:00";
            timerDisplay.style.color = "#ff4444";
            return;
        }
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        timerDisplay.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        timerDisplay.style.color = "#00aaff";
    }, 1000);
}

// --- LÓGICA DE LA CALCULADORA RECURSIVA ---

let allItems = []; // Caché local para evitar consultas constantes

async function loadItemsForCalc() {
    const select = document.getElementById('calcItemSelect');
    try {
        const snapshot = await itemsRef.get();
        select.innerHTML = '<option value="">-- Selecciona Objeto --</option>';
        allItems = [];

        snapshot.forEach(doc => {
            const item = { id: doc.id, ...doc.data() };
            allItems.push(item);
            const option = document.createElement('option');
            option.value = item.nombre; 
            option.textContent = item.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando catálogo:", error);
    }
}

// LA FUNCIÓN MAESTRA
function calculateTotal() {
    const targetName = document.getElementById('calcItemSelect').value;
    const quantity = parseInt(document.getElementById('calcQuantity').value);
    
    if (!targetName || isNaN(quantity) || quantity <= 0) {
        alert("Selecciona un objeto y una cantidad válida.");
        return;
    }

    const rawMaterials = {}; // Diccionario para acumular: { "Agua": 10, "Mineral": 20 }

    // Función que se llama a sí misma para desglosar todo
    function findIngredients(itemName, qtyNeeded) {
        const item = allItems.find(i => i.nombre === itemName);
        
        if (!item) return;

        if (item.esMateriaPrima) {
            // Si es materia prima, sumamos la cantidad al total acumulado
            rawMaterials[itemName] = (rawMaterials[itemName] || 0) + qtyNeeded;
        } else {
            // Si es fabricado, calculamos cuántas recetas hay que ejecutar
            // (Usamos Math.ceil por si el rendimiento no es exacto)
            const recipeCycles = Math.ceil(qtyNeeded / (item.rendimiento || 1));
            
            if (item.receta && item.receta.length > 0) {
                item.receta.forEach(ing => {
                    // Llamada recursiva para cada ingrediente
                    findIngredients(ing.nombre, ing.cantidad * recipeCycles);
                });
            }
        }
    }

    // Iniciamos el desglose
    findIngredients(targetName, quantity);
    
    // Pintamos los resultados
    renderResults(rawMaterials);
}

function renderResults(materials) {
    const resultSection = document.getElementById('resultSection');
    const listContainer = document.getElementById('rawMaterialsList');
    
    resultSection.style.display = 'block'; // Mostramos la caja
    listContainer.innerHTML = ""; // Limpiamos lo anterior

    const entries = Object.entries(materials);
    
    if (entries.length === 0) {
        listContainer.innerHTML = "<p style='color:#888;'>Este objeto no requiere materias primas (es una materia prima en sí misma).</p>";
        return;
    }

    entries.forEach(([name, qty]) => {
        // Buscamos la imagen del material para que quede bonito
        const itemInfo = allItems.find(i => i.nombre === name);
        const imgUrl = itemInfo ? itemInfo.imagen : "https://via.placeholder.com/40";

        const div = document.createElement('div');
        div.className = 'ingredient-row';
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "space-between";
        div.style.padding = "10px";
        div.style.borderBottom = "1px solid #222";

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px;">
                <img src="${imgUrl}" style="width:35px; height:35px; border-radius:4px; border:1px solid #ff8c00;">
                <span style="font-weight:bold;">${name}</span>
            </div>
            <span style="color:#ff8c00; font-family:'Orbitron'; font-size:1.2rem;">x${qty.toLocaleString()}</span>
        `;
        listContainer.appendChild(div);
    });

    // Scroll suave hasta los resultados
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Vinculamos el botón
document.getElementById('btnCalculate').addEventListener('click', calculateTotal);

// Al cargar
window.onload = () => {
    loadShieldStatus();
    loadItemsForCalc();
};