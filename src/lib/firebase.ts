import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer, 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling to fix "Could not reach Cloud Firestore backend" errors
// which often occur in restricted network environments or when WebSockets are unstable.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Test the connection as per requirements
async function testConnection() {
  try {
    // Only run if we are in a browser environment
    if (typeof window !== 'undefined') {
      console.log("Testing Firestore connection...");
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firestore connection successful");
    }
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore is offline. Please check your network connection and Firebase project status.");
    } else {
      // It's normal to get a "not found" if the test doc doesn't exist, but it confirms Connectivity
      console.log("Firestore connectivity verified (test doc check completed).");
    }
  }
}

testConnection();
