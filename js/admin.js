// Variable global para guardar los items y usarlos en los desplegables
let editId = null;
let localItems = [];

// --- LÓGICA DE LA INTERFAZ ---

// Función para añadir fila de ingrediente con DESPLEGABLE de tus objetos
function addIngredientRow(selectedName = "", qty = "") {
    const container = document.getElementById('ingredientsList');
    const div = document.createElement('div');
    div.className = 'ingredient-row';
    
    // Generamos las opciones del select basadas en lo que ya tienes guardado
    let options = localItems.map(item => {
        const versionLabel = item.version && item.version !== 'Base' ? ` [${item.version}]` : '';
        return `<option value="${item.nombre}" ${item.nombre === selectedName ? 'selected' : ''}>${item.nombre}${versionLabel}</option>`;
    }).join('');

    div.innerHTML = `
        <select class="ing-name" required>
            <option value="">-- Seleccionar --</option>
            ${options}
        </select>
        <input type="number" class="ing-qty" placeholder="Cant." step="0.1" value="${qty}" required>
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
}

// --- OPERACIONES FIREBASE ---

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
        version: document.getElementById('itemVersion').value,
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
            await itemsRef.doc(editId).update(itemData);
            alert("¡Objeto actualizado!");
            editId = null;
        } else {
            itemData.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
            await itemsRef.add(itemData);
            alert("¡Objeto guardado!");
        }
        location.reload(); // Recargamos para que los desplegables vean el nuevo objeto
    } catch (error) {
        console.error("Error:", error);
        alert("Error al conectar con Arrakis");
    }
});

async function loadCatalog() {
    const catalogDiv = document.getElementById('itemsCatalog');
    try {
        const snapshot = await itemsRef.orderBy('nombre').get();
        localItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCatalog(localItems);
    } catch (error) {
        catalogDiv.innerHTML = "<p>Error al cargar catálogo.</p>";
    }
}

function renderCatalog(items) {
    const catalogDiv = document.getElementById('itemsCatalog');
    catalogDiv.innerHTML = "";
    items.forEach(item => {
        const badge = document.createElement('div');
        badge.className = 'item-badge';
        badge.dataset.category = item.categoria;
        badge.dataset.name = item.nombre.toLowerCase();
        
        const versionLabel = item.version && item.version !== 'Base' ? item.version : '';

        badge.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:10px;">
                <img src="${item.imagen}" style="width:50px; height:50px; border-radius:8px; object-fit:cover; border:2px solid #ff8c00;">
                <div style="flex:1;">
                    <h4 style="margin:0;">${item.nombre} <span style="color:#00aaff">${versionLabel}</span></h4>
                    <small style="color:#aaa;">${item.categoria}</small>
                </div>
            </div>
            <div style="display:flex; gap:10px;">
                <button class="btn-secondary" onclick="prepareEdit('${item.id}')" style="flex:1; font-size:0.7rem;">EDITAR</button>
                <button class="btn-secondary" onclick="deleteItem('${item.id}')" style="flex:1; font-size:0.7rem; border-color:#ff4444; color:#ff4444;">X</button>
            </div>
        `;
        catalogDiv.appendChild(badge);
    });
}

// Función de búsqueda y filtro del catálogo
function filterCatalog() {
    const text = document.getElementById('catalogSearch').value.toLowerCase();
    const cat = document.getElementById('catalogFilter').value;
    
    document.querySelectorAll('.item-badge').forEach(el => {
        const matchesText = el.dataset.name.includes(text);
        const matchesCat = (cat === 'all' || el.dataset.category === cat);
        el.style.display = (matchesText && matchesCat) ? 'block' : 'none';
    });
}

async function prepareEdit(id) {
    const item = localItems.find(i => i.id === id);
    editId = id;
    document.getElementById('itemName').value = item.nombre;
    document.getElementById('itemVersion').value = item.version || "Base";
    document.getElementById('itemImg').value = item.imagen;
    document.getElementById('itemCategory').value = item.categoria;
    document.getElementById('isRaw').value = item.esMateriaPrima ? 'yes' : 'no';
    toggleRecipe(); // Mostrar u ocultar receta según tipo
    
    if(!item.esMateriaPrima) {
        document.getElementById('ingredientsList').innerHTML = '<label>Ingredientes:</label>';
        item.receta.forEach(ing => addIngredientRow(ing.nombre, ing.cantidad));
    }
    document.querySelector('.btn-primary').innerText = "Actualizar Objeto";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteItem(id) {
    if (confirm("¿Borrar este objeto?")) {
        await itemsRef.doc(id).delete();
        location.reload();
    }
}

loadCatalog();