// --- LÓGICA DEL ESCUDO (DASHBOARD CON FORMATO DÍAS) ---
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
        await shieldDocRef.set({ expiry: shieldEndTime });
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

        // Cálculos de tiempo
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horasTotales = Math.floor(diff / (1000 * 60 * 60));
        const horasRelativas = horasTotales % 24; // Las horas que sobran después de sacar los días
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);

        // Formateo visual
        let textoDisplay = "";
        
        if (dias > 0) {
            // Si hay días, mostramos: Xd HH:MM:SS
            textoDisplay = `${dias}d ${horasRelativas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
        } else {
            // Si no hay días, mostramos el formato clásico: HH:MM:SS
            textoDisplay = `${horasTotales.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
        }

        timerDisplay.innerText = textoDisplay;
        timerDisplay.style.color = "#00aaff";
    }, 1000);
}

// --- LÓGICA DE LA CALCULADORA FILTRADA ---

let allItems = [];

async function loadItemsForCalc() {
    try {
        const snapshot = await itemsRef.get();
        allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCalcOptions(); 
    } catch (error) {
        console.error("Error cargando catálogo:", error);
    }
}

function updateCalcOptions() {
    const categoryFilter = document.getElementById('filterCategory').value;
    const itemSelect = document.getElementById('calcItemSelect');
    
    itemSelect.innerHTML = '<option value="">-- Selecciona Objeto --</option>';

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
    
    if (!targetName || isNaN(quantity) || quantity <= 0) {
        alert("Selecciona un objeto y cantidad.");
        return;
    }

    const rawMaterials = {};

    function findIngredients(itemName, qtyNeeded) {
        const item = allItems.find(i => i.nombre === itemName);
        if (!item) return;

        if (item.esMateriaPrima) {
            rawMaterials[itemName] = (rawMaterials[itemName] || 0) + qtyNeeded;
        } else {
            const yieldPerRecipe = parseFloat(item.rendimiento) || 1;
            const recipeCycles = Math.ceil(qtyNeeded / yieldPerRecipe);
            
            if (item.receta) {
                item.receta.forEach(ing => {
                    findIngredients(ing.nombre, ing.cantidad * recipeCycles);
                });
            }
        }
    }

    findIngredients(targetName, quantity);
    renderResults(rawMaterials);
}

function renderResults(materials) {
    const resultSection = document.getElementById('resultSection');
    const listContainer = document.getElementById('rawMaterialsList');
    
    resultSection.style.display = 'block'; 
    listContainer.innerHTML = ""; 

    const entries = Object.entries(materials);
    
    if (entries.length === 0) {
        listContainer.innerHTML = "<p style='color:#ff8c00;'>Objeto sin ingredientes base configurados.</p>";
        return;
    }

    entries.forEach(([name, qty]) => {
        const itemInfo = allItems.find(i => i.nombre === name);
        const imgUrl = itemInfo ? itemInfo.imagen : "https://via.placeholder.com/40";

        const div = document.createElement('div');
        div.className = 'ingredient-row';
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "space-between";
        div.style.padding = "10px";

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px;">
                <img src="${imgUrl}" style="width:35px; height:35px; border-radius:4px; border:1px solid #ff8c00; object-fit:cover;">
                <span style="font-weight:bold;">${name}</span>
            </div>
            <span style="color:#ff8c00; font-family:'Orbitron'; font-size:1.2rem;">x${qty.toLocaleString()}</span>
        `;
        listContainer.appendChild(div);
    });

    resultSection.scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    const btnCalc = document.getElementById('btnCalculate');
    if(btnCalc) btnCalc.addEventListener('click', calculateTotal);
    
    loadShieldStatus();
    loadItemsForCalc();
});