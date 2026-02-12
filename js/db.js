// Configuración de Firebase de tu proyecto "dune-1aab2"
const firebaseConfig = {
  apiKey: "AIzaSyCyZToFrHjgccIE8870W_l8lyIbjO1X-JM",
  authDomain: "dune-1aab2.firebaseapp.com",
  projectId: "dune-1aab2",
  storageBucket: "dune-1aab2.firebasestorage.app",
  messagingSenderId: "852647141339",
  appId: "1:852647141339:web:39fcc566166609ea94d1fe"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar servicios
const db = firebase.firestore();
const storage = firebase.storage();

// Referencias a las colecciones que usaremos
const itemsRef = db.collection("dune_items");          // Catálogo y recetas
const baseRef = db.collection("dune_base_machines");  // Máquinas en el plano
const planosRef = db.collection("dune_planos");       // Imágenes de los pisos

console.log("🔥 Firebase conectado correctamente al proyecto: dune-1aab2");