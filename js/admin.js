// Variable para saber si estamos editando
let editId = null;

// --- Lógica de la Interfaz del Formulario ---

function addIngredientRow(nombre = "", cantidad = "") {
    const container = document.getElementById('ingredientsList');
    const div = document.createElement('div');
    div.className = 'ingredient-row';
    div.innerHTML = `
        <input type="text" class="ing-name" placeholder="Nombre ingrediente" value="${nombre}" required>
        <input type="number" class="ing-qty" placeholder="Cant." min="0.1" step="0.1" value="${cantidad}" required>
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

    const itemData = {
        nombre: document.getElementById('itemName').value,
        imagen: document.getElementById('itemImg').value || "https://via.placeholder.com/80?text=DUNE",
        categoria: document.getElementById('itemCategory').value,
        esMateriaPrima: isRaw,
        rendimiento: isRaw ? 1 : parseFloat(document.getElementById('yield').value),
        estacion: isRaw ? "" : document.getElementById('station').value,
        receta: ingredients,
        fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (editId) {
            // ACTUALIZAR
            await itemsRef.doc(editId).update(itemData);
            alert("¡Objeto actualizado en el Destiltraje!");
            editId = null;
            document.querySelector('.btn-primary').innerText = "Guardar Objeto en la Especia";
        } else {
            // CREAR NUEVO
            itemData.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
            await itemsRef.add(itemData);
            alert("¡Objeto guardado en la Especia!");
        }
        
        document.getElementById('itemForm').reset();
        document.getElementById('ingredientsList').innerHTML = "";
        document.getElementById('recipeSection').style.display = 'block'; // reset view
        loadCatalog(); 
    } catch (error) {
        console.error("Error:", error);
        alert("Error al conectar con Arrakis");
    }
});

// Cargar catálogo con botones de acción
async function loadCatalog() {
    const catalogDiv = document.getElementById('itemsCatalog');
    catalogDiv.innerHTML = "<p>Sincronizando con la base...</p>";

    try {
        const snapshot = await itemsRef.orderBy('fechaCreacion', 'desc').get();
        catalogDiv.innerHTML = "";

        snapshot.forEach(doc => {
            const item = doc.data();
            const id = doc.id;
            const badge = document.createElement('div');
            badge.className = 'item-badge';
            badge.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                    <img src="${item.imagen}" style="width:60px; height:60px; border-radius:8px; object-fit:cover; border:2px solid #ff8c00;">
                    <div style="flex:1;">
                        <h4 style="margin:0;">${item.nombre}</h4>
                        <small style="color:#aaa;">${item.categoria} | ${item.esMateriaPrima ? '🌿 Recolectable' : '⚙️ Fabricado'}</small>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn-secondary" onclick="editItem('${id}')" style="flex:1; padding:5px; font-size:0.8rem;">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-secondary" onclick="deleteItem('${id}')" style="flex:1; padding:5px; font-size:0.8rem; border-color:#ff4444; color:#ff4444;">
                        <i class="fas fa-trash"></i> Borrar
                    </button>
                </div>
            `;
            catalogDiv.appendChild(badge);
        });
    } catch (error) {
        console.error("Error al cargar:", error);
        catalogDiv.innerHTML = "<p>Error al cargar catálogo.</p>";
    }
}

// Función para preparar la edición
async function editItem(id) {
    try {
        const doc = await itemsRef.doc(id).get();
        const item = doc.data();
        editId = id;

        // Rellenar campos básicos
        document.getElementById('itemName').value = item.nombre;
        document.getElementById('itemImg').value = item.imagen;
        document.getElementById('itemCategory').value = item.categoria;
        document.getElementById('isRaw').value = item.esMateriaPrima ? 'yes' : 'no';
        document.getElementById('yield').value = item.rendimiento;
        document.getElementById('station').value = item.estacion;

        // Gestionar sección de receta
        const section = document.getElementById('recipeSection');
        section.style.display = item.esMateriaPrima ? 'none' : 'block';

        // Limpiar y cargar ingredientes
        document.getElementById('ingredientsList').innerHTML = '<label>Ingredientes:</label>';
        if (item.receta && item.receta.length > 0) {
            item.receta.forEach(ing => {
                addIngredientRow(ing.nombre, ing.cantidad);
            });
        }

        // Cambiar texto del botón y hacer scroll arriba
        document.querySelector('.btn-primary').innerText = "Actualizar Objeto";
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        alert("Error al recuperar el objeto");
    }
}

// Función para borrar
async function deleteItem(id) {
    if (confirm("¿Seguro que quieres borrar este objeto de la base de datos?")) {
        try {
            await itemsRef.doc(id).delete();
            loadCatalog();
        } catch (error) {
            alert("No se pudo borrar el objeto.");
        }
    }
}

loadCatalog();