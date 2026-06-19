// Firebase compat SDK — chargé après les scripts CDN firebase-app-compat + firebase-firestore-compat
const firebaseConfig = {
  apiKey:            "AIzaSyBxFBoZNzJkUnmUEwXlMC3ZIiYB5lcDyrI",
  authDomain:        "cinq-freres-4fa94.firebaseapp.com",
  projectId:         "cinq-freres-4fa94",
  storageBucket:     "cinq-freres-4fa94.firebasestorage.app",
  messagingSenderId: "677505850317",
  appId:             "1:677505850317:web:e7ddba010bda9746134284"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
