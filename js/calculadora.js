// --- LÓGICA DEL ESCUDO ---
let shieldEndTime = null;
const shieldDocRef = db.collection("dune_settings").doc("shield_status");

async function loadShieldStatus() {
    const doc = await shieldDocRef.get();
    shieldEndTime = doc.exists ? doc.data().expiry.toDate() : new Date();
    startTimer();
}

async function updateShield(hours) {
    let baseTime = shieldEndTime > new Date() ? shieldEndTime : new Date();
    baseTime.setHours(baseTime.getHours() + hours);
    shieldEndTime = baseTime;
    await shieldDocRef.set({ expiry: shieldEndTime });
}

function startTimer() {
    const timerDisplay = document.getElementById('shieldTimer');
    setInterval(() => {
        const diff = shieldEndTime - new Date();
        if (diff <= 0) { timerDisplay.innerText = "00:00:00"; return; }
        const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
        timerDisplay.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, 1000);
}

// --- LÓGICA CALCULADORA FILTRADA ---
let allItems = [];

async function loadItemsForCalc() {
    const snapshot = await itemsRef.get();
    allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // No llenamos el segundo select todavía, esperamos al filtro
    updateCalcOptions(); 
}

// ESTA ES LA FUNCIÓN QUE CORRIGE TU ERROR
function updateCalcOptions() {
    const categoryFilter = document.getElementById('filterCategory').value;
    const itemSelect = document.getElementById('calcItemSelect');
    
    itemSelect.innerHTML = '<option value="">-- Selecciona Objeto --</option>';

    // Filtramos los items según la categoría seleccionada
    const filteredItems = (categoryFilter === 'all') 
        ? allItems 
        : allItems.filter(item => item.categoria === categoryFilter);

    filteredItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.nombre;
        const versionLabel = item.version && item.version !== 'Base' ? ` [${item.version}]` : '';
        option.textContent = item.nombre + versionLabel;
        itemSelect.appendChild(option);
    });
}

function calculateTotal() {
    const targetName = document.getElementById('calcItemSelect').value;
    const quantity = parseInt(document.getElementById('calcQuantity').value);
    if (!targetName || !quantity) return;

    const rawMaterials = {};

    function findIngredients(name, qty) {
        const item = allItems.find(i => i.nombre === name);
        if (!item) return;
        if (item.esMateriaPrima) {
            rawMaterials[name] = (rawMaterials[name] || 0) + qty;
        } else {
            const cycles = Math.ceil(qty / (item.rendimiento || 1));
            item.receta.forEach(ing => findIngredients(ing.nombre, ing.cantidad * cycles));
        }
    }

    findIngredients(targetName, quantity);
    renderResults(rawMaterials);
}

function renderResults(materials) {
    const list = document.getElementById('rawMaterialsList');
    document.getElementById('resultSection').style.display = 'block';
    list.innerHTML = "";
    Object.entries(materials).forEach(([name, qty]) => {
        const info = allItems.find(i => i.nombre === name);
        list.innerHTML += `<div class="ingredient-row" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #222;">
            <span><img src="${info?.imagen}" style="width:30px; vertical-align:middle; margin-right:10px;"> ${name}</span>
            <strong style="color:#ff8c00">x${qty.toLocaleString()}</strong>
        </div>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnCalculate').addEventListener('click', calculateTotal);
    loadShieldStatus();
    loadItemsForCalc();
});