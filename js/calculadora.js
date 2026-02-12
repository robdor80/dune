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

let allItems = []; // Almacén local de datos para no pedir a Firebase cada segundo

async function loadItemsForCalc() {
    const select = document.getElementById('calcItemSelect');
    try {
        const snapshot = await itemsRef.orderBy('nombre').get();
        select.innerHTML = '<option value="">-- Selecciona Objeto --</option>';
        allItems = [];

        snapshot.forEach(doc => {
            const item = { id: doc.id, ...doc.data() };
            allItems.push(item);
            const option = document.createElement('option');
            option.value = item.nombre; // Usamos el nombre como referencia
            option.textContent = item.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando select:", error);
    }
}

// Función Maestra de Desglose
async function calculateTotal() {
    const targetName = document.getElementById('calcItemSelect').value;
    const quantity = parseInt(document.getElementById('calcQuantity').value);
    
    if (!targetName || isNaN(quantity)) return;

    const summary = {}; // Aquí sumaremos todo: { "Hierro": 50, "Agua": 10 }

    function breakdown(name, qty) {
        const item = allItems.find(i => i.nombre === name);
        if (!item) return;

        if (item.esMateriaPrima) {
            // Si es materia prima, sumamos al total
            summary[name] = (summary[name] || 0) + qty;
        } else {
            // Si es fabricado, calculamos cuántas veces hay que hacer la receta
            const cycles = Math.ceil(qty / item.rendimiento);
            item.receta.forEach(ing => {
                breakdown(ing.nombre, ing.cantidad * cycles);
            });
        }
    }

    breakdown(targetName, quantity);
    displayResults(summary);
}

function displayResults(summary) {
    const section = document.getElementById('resultSection');
    const list = document.getElementById('rawMaterialsList');
    
    section.style.display = 'block';
    list.innerHTML = "";

    for (const [name, qty] of Object.entries(summary)) {
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        row.style.gridTemplateColumns = "1fr auto";
        row.innerHTML = `
            <span>${name}</span>
            <strong style="color: #ff8c00;">x${qty.toLocaleString()}</strong>
        `;
        list.appendChild(row);
    }
}

// Evento del botón
document.getElementById('btnCalculate').addEventListener('click', calculateTotal);

window.onload = () => {
    loadShieldStatus();
    loadItemsForCalc();
};