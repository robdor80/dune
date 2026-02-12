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
        await shieldDocRef.update({ expiry: shieldEndTime });
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

// --- LÓGICA DE LA CALCULADORA ---

// Cargar objetos en el selector
async function loadItemsForCalc() {
    const select = document.getElementById('calcItemSelect');
    try {
        const snapshot = await itemsRef.orderBy('nombre').get();
        select.innerHTML = '<option value="">-- Selecciona Objeto --</option>';
        
        snapshot.forEach(doc => {
            const item = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = item.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando select:", error);
    }
}

// Inicialización al cargar la página
window.onload = () => {
    loadShieldStatus();
    loadItemsForCalc();
};