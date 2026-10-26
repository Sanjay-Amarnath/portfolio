import { getFirebaseServices } from "@/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export async function getJobs(filters = {}) {
  const { db } = getFirebaseServices();
  const jobsCol = collection(db, "jobs");

  let q = query(jobsCol, orderBy("postedAt", "desc"));

  // Basic filtering can be added here
  // if (filters.workMode) q = query(q, where("workMode", "==", filters.workMode));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
