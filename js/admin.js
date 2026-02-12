// --- Lógica de la Interfaz del Formulario ---

function addIngredientRow() {
    const container = document.getElementById('ingredientsList');
    const div = document.createElement('div');
    div.className = 'ingredient-row';
    div.innerHTML = `
        <input type="text" class="ing-name" placeholder="Nombre ingrediente" required>
        <input type="number" class="ing-qty" placeholder="Cant." min="0.1" step="0.1" required>
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
}

// --- Operaciones con Firebase ---

document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const isRaw = document.getElementById('isRaw').value === 'yes';
    const ingredients = [];
    
    if (!isRaw) {
        document.querySelectorAll('.ingredient-row').forEach(row => {
            ingredients.push({
                nombre: row.querySelector('.ing-name').value,
                cantidad: parseFloat(row.querySelector('.ing-qty').value)
            });
        });
    }

    const newItem = {
        nombre: document.getElementById('itemName').value,
        imagen: document.getElementById('itemImg').value || "https://via.placeholder.com/80?text=DUNE",
        categoria: document.getElementById('itemCategory').value,
        esMateriaPrima: isRaw,
        rendimiento: isRaw ? 1 : parseFloat(document.getElementById('yield').value),
        estacion: isRaw ? "" : document.getElementById('station').value,
        receta: ingredients,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await itemsRef.add(newItem);
        alert("¡Objeto guardado en la Especia!");
        document.getElementById('itemForm').reset();
        document.getElementById('ingredientsList').innerHTML = "";
        loadCatalog(); 
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al conectar con Arrakis");
    }
});

async function loadCatalog() {
    const catalogDiv = document.getElementById('itemsCatalog');
    catalogDiv.innerHTML = "<p>Sincronizando con la base...</p>";

    try {
        const snapshot = await itemsRef.orderBy('fechaCreacion', 'desc').get();
        catalogDiv.innerHTML = "";

        snapshot.forEach(doc => {
            const item = doc.data();
            const badge = document.createElement('div');
            badge.className = 'item-badge';
            badge.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px;">
                    <img src="${item.imagen}" style="width:60px; height:60px; border-radius:8px; object-fit:cover; border:2px solid #ff8c00;">
                    <div>
                        <h4>${item.nombre}</h4>
                        <small>Cat: ${item.categoria}</small>
                        <small>${item.esMateriaPrima ? '🌿 Recolectable' : '⚙️ Fabricado'}</small>
                    </div>
                </div>
            `;
            catalogDiv.appendChild(badge);
        });
    } catch (error) {
        console.error("Error al cargar:", error);
        catalogDiv.innerHTML = "<p>Error al cargar catálogo.</p>";
    }
}

loadCatalog();