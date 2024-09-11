import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  get,
  runTransaction ,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCB7FcpA7R7wxcAHdWTzK9SQV9W8QkMTTw",
  authDomain: "wedding-cn-f9db4.firebaseapp.com",
  databaseURL:
    "https://wedding-cn-f9db4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wedding-cn-f9db4",
  storageBucket: "wedding-cn-f9db4.appspot.com",
  messagingSenderId: "29911108915",
  appId: "1:29911108915:web:2173ad141ce4dd0588c246",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const customersRef = ref(db, "customers");
const inVoiceRef = ref(db, "invoices");

export function addCustomerToFirebase(newCustomer) {
  const newCustomerRef = push(customersRef);
  return set(newCustomerRef, newCustomer);
}

export function getCustomerData(callback) {
  onValue(
    customersRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        callback(data);
      } else {
        console.log("No data available");
        callback(null);
      }
    },
    (error) => {
      console.error("Error fetching data:", error);
    }
  );
}


// Function to generate the invoice number
function generateInvoiceNumber(shortname, runNumber) {
  const currentDate = new Date();
  const year = currentDate.getFullYear();  // ปี ค.ศ.
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');  // เดือน 2 หลัก
  const paddedRunNumber = String(runNumber).padStart(4, '0');  // ลำดับ 4 หลัก

  // สร้างหมายเลขใบแจ้งหนี้: shortname + "0" + ปี + เดือน + ลำดับ
  return `${shortname}0${year}${month}${paddedRunNumber}`;
}


export function saveInvoiceToFirebase(invoiceData, invoiceType) {
  const db = getDatabase();
  const invoiceTypeRef = ref(db, `invoices/${invoiceType}/runNumbers/${new Date().getFullYear()}`);


  return runTransaction(invoiceTypeRef, (lastRunNumber) => {
    if (lastRunNumber === null) {
      return 1;  
    }
    return lastRunNumber + 1;  // Increment run number
  })
  .then((result) => {
    const runNumber = result.snapshot.val();
    const invoiceNumber = generateInvoiceNumber(invoiceData.documentType.shortname, runNumber);

    
    const newInvoiceRef = push(ref(db, `invoices/${invoiceType}/invoiceList`));

    // Save the invoice data with the new run number and invoice number
    return set(newInvoiceRef, {
      ...invoiceData,
      runNumber: runNumber,
      invoiceNumber: invoiceNumber
    })
    .then(() => {
      return newInvoiceRef.key;  
    });
  })
  .catch((error) => {
    console.error("Error saving invoice:", error);
    throw error;
  });
}



/* 
export function getAllInvoices(callback) {
  onValue(
    inVoiceRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        callback(data); // Send the data to the caller
      } else {
        console.log("No invoices available");
        callback(null);
      }
    },
    (error) => {
      console.error("Error fetching invoices:", error);
    }
  );
} */

  export function getInvoiceById(invoiceType, invoiceId, callback) {
  
    const invoiceRef = ref(db, `invoices/${invoiceType}/invoiceList/${invoiceId}`);
  
    // Fetch the invoice data
    get(invoiceRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          callback(data); // Send the data to the caller
        } else {
          console.log("No data available for this invoice.");
          callback(null);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }
