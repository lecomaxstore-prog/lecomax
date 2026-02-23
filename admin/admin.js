import { getApp, getApps } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

if (!getApps().length) {
  throw new Error("Firebase is not initialized. Add the Firebase module script in dashboard.html before admin.js.");
}

const app = getApp();
const db = getFirestore(app);

function formatMad(value) {
  return `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} MAD`;
}

async function loadStats() {
  try {
    const querySnapshot = await getDocs(collection(db, "orders"));

    let totalOrders = 0;
    let totalRevenue = 0;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() || {};
      totalOrders += 1;
      totalRevenue += Number(data.price || 0);
    });

    const totalOrdersEl = document.getElementById("totalOrders");
    const totalRevenueEl = document.getElementById("totalRevenue");

    if (totalOrdersEl) {
      totalOrdersEl.textContent = String(totalOrders);
    }

    if (totalRevenueEl) {
      totalRevenueEl.textContent = formatMad(totalRevenue);
    }
  } catch (error) {
    console.error("Failed to load Firestore stats:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadStats();
});
