let editId = null;
let localItems = [];

// Función para añadir fila de ingrediente con DESPLEGABLE
function addIngredientRow(selectedName = "", qty = "") {
    const container = document.getElementById('ingredientsList');
    const div = document.createElement('div');
    div.className = 'ingredient-row';
    
    // Creamos las opciones basadas en lo que ya hay en la base de datos
    let options = localItems.map(item => 
        `<option value="${item.nombre}" ${item.nombre === selectedName ? 'selected' : ''}>${item.nombre} (${item.version || 'Base'})</option>`
    ).join('');

    div.innerHTML = `
        <select class="ing-name" required>
            <option value="">-- Seleccionar --</option>
            ${options}
        </select>
        <input type="number" class="ing-qty" placeholder="Cant." step="0.1" value="${qty}" required>
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(div);
}

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
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (editId) {
            await itemsRef.doc(editId).update(itemData);
            editId = null;
        } else {
            await itemsRef.add(itemData);
        }
        alert("Sincronizado correctamente");
        location.reload(); // Recargamos para actualizar listas
    } catch (error) { alert("Error en Arrakis"); }
});

async function loadCatalog() {
    const snap = await itemsRef.orderBy('nombre').get();
    localItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderCatalog(localItems);
}

function renderCatalog(items) {
    const catalogDiv = document.getElementById('itemsCatalog');
    catalogDiv.innerHTML = "";
    items.forEach(item => {
        const badge = document.createElement('div');
        badge.className = 'item-badge';
        badge.dataset.category = item.categoria;
        badge.dataset.name = item.nombre.toLowerCase();
        badge.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${item.imagen}" style="width:40px; height:40px; border-radius:5px;">
                <div>
                    <h4 style="margin:0">${item.nombre} <span style="color:#00aaff">${item.version || ''}</span></h4>
                    <small>${item.categoria}</small>
                </div>
            </div>
            <div style="margin-top:10px; display:flex; gap:5px;">
                <button class="btn-secondary" onclick="prepareEdit('${item.id}')">Editar</button>
                <button class="btn-secondary" style="color:red" onclick="deleteItem('${item.id}')">X</button>
            </div>
        `;
        catalogDiv.appendChild(badge);
    });
}

function filterCatalog() {
    const text = document.getElementById('catalogSearch').value.toLowerCase();
    const cat = document.getElementById('catalogFilter').value;
    document.querySelectorAll('.item-badge').forEach(el => {
        const matchesText = el.dataset.name.includes(text);
        const matchesCat = cat === 'all' || el.dataset.category === cat;
        el.style.display = (matchesText && matchesCat) ? 'block' : 'none';
    });
}

async function prepareEdit(id) {
    const item = localItems.find(i => i.id === id);
    editId = id;
    document.getElementById('itemName').value = item.nombre;
    document.getElementById('itemVersion').value = item.version || "Base";
    document.getElementById('itemCategory').value = item.categoria;
    document.getElementById('isRaw').value = item.esMateriaPrima ? 'yes' : 'no';
    toggleRecipe();
    if(!item.esMateriaPrima) {
        document.getElementById('ingredientsList').innerHTML = "";
        item.receta.forEach(ing => addIngredientRow(ing.nombre, ing.cantidad));
    }
    window.scrollTo(0,0);
}

loadCatalog();