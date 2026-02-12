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

// Inicializar SOLO Firestore (Base de datos)
const db = firebase.firestore();

// Referencias
const itemsRef = db.collection("dune_items");
const baseRef = db.collection("dune_base_machines");
const planosRef = db.collection("dune_planos");

console.log("🔥 Conexión limpia: Firestore activo.");