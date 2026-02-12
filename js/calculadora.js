// --- LÓGICA DEL ESCUDO (DASHBOARD) ---
let shieldEndTime = null;
const shieldDocRef = db.collection("dune_settings").doc("shield_status");

// Cargar el estado inicial del escudo desde Firebase
async function loadShieldStatus() {
    try {
        const doc = await shieldDocRef.get();
        if (doc.exists) {
            shieldEndTime = doc.data().expiry.toDate();
        } else {
            // Si no existe, creamos uno con la hora actual
            shieldEndTime = new Date();
            await shieldDocRef.set({ expiry: shieldEndTime });
        }
        startTimer();
    } catch (error) {
        console.error("Error cargando escudo:", error);
    }
}

// Función para añadir o quitar energía (en horas)
async function updateShield(hours) {
    if (!shieldEndTime) return;

    // Si el escudo ya caducó, empezamos a contar desde "ahora"
    let baseTime = shieldEndTime > new Date() ? shieldEndTime : new Date();
    
    // Añadimos las horas
    baseTime.setHours(baseTime.getHours() + hours);
    shieldEndTime = baseTime;

    // Guardar en Firebase
    try {
        await shieldDocRef.set({ expiry: shieldEndTime });
        console.log("Energía actualizada:", shieldEndTime);
    } catch (error) {
        console.error("Error al actualizar energía:", error);
    }
}

// El segundero del reloj
function startTimer() {
    const timerDisplay = document.getElementById('shieldTimer');
    
    setInterval(() => {
        const now = new Date();
        const diff = shieldEndTime - now;

        if (diff <= 0) {
            timerDisplay.innerText = "00:00:00";
            timerDisplay.style.color = "#ff4444"; // Rojo si está apagado
            return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        timerDisplay.innerText = 
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        timerDisplay.style.color = "#00aaff"; // Azul si está activo
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
        console.log("Catálogo cargado para calculadora:", allItems.length, "items");
    } catch (error) {
        console.error("Error cargando catálogo:", error);
    }
}

// LA FUNCIÓN MAESTRA DE DESGLOSE
function calculateTotal() {
    const targetName = document.getElementById('calcItemSelect').value;
    const quantity = parseInt(document.getElementById('calcQuantity').value);
    
    if (!targetName || isNaN(quantity) || quantity <= 0) {
        alert("Selecciona un objeto y una cantidad válida.");
        return;
    }

    const rawMaterials = {}; // Acumulador de materias primas

    // Función recursiva
    function findIngredients(itemName, qtyNeeded) {
        // Buscamos el item en nuestra caché local
        const item = allItems.find(i => i.nombre === itemName);
        
        if (!item) {
            console.warn("No se encontró el item:", itemName);
            return;
        }

        if (item.esMateriaPrima) {
            // Es el final de la cadena (Mineral, Agua, etc.)
            rawMaterials[itemName] = (rawMaterials[itemName] || 0) + qtyNeeded;
        } else {
            // Es un objeto fabricado, necesitamos su receta
            const yieldPerRecipe = parseFloat(item.rendimiento) || 1;
            const recipeCycles = Math.ceil(qtyNeeded / yieldPerRecipe);
            
            if (item.receta && item.receta.length > 0) {
                item.receta.forEach(ing => {
                    findIngredients(ing.nombre, ing.cantidad * recipeCycles);
                });
            } else {
                console.warn("El objeto fabricado no tiene receta definida:", itemName);
            }
        }
    }

    // Ejecutar desglose
    findIngredients(targetName, quantity);
    
    // Mostrar resultados
    renderResults(rawMaterials);
}

function renderResults(materials) {
    const resultSection = document.getElementById('resultSection');
    const listContainer = document.getElementById('rawMaterialsList');
    
    resultSection.style.display = 'block'; 
    listContainer.innerHTML = ""; 

    const entries = Object.entries(materials);
    
    if (entries.length === 0) {
        listContainer.innerHTML = "<p style='color:#ff8c00; padding:10px;'>Asegúrate de que el objeto tenga ingredientes configurados en el Administrador y que no esté marcado como 'Materia Prima'.</p>";
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
        div.style.borderBottom = "1px solid #222";

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px;">
                <img src="${imgUrl}" style="width:35px; height:35px; border-radius:4px; border:1px solid #ff8c00; object-fit:cover;">
                <span style="font-weight:bold; font-family:'Rajdhani';">${name}</span>
            </div>
            <span style="color:#ff8c00; font-family:'Orbitron'; font-size:1.2rem;">x${qty.toLocaleString()}</span>
        `;
        listContainer.appendChild(div);
    });

    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Vincular botones y eventos
document.addEventListener('DOMContentLoaded', () => {
    const btnCalc = document.getElementById('btnCalculate');
    if(btnCalc) btnCalc.addEventListener('click', calculateTotal);
    
    loadShieldStatus();
    loadItemsForCalc();
});