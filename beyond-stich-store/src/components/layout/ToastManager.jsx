'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ToastManager.module.css';

const NAMES = ["Ravi", "Aman", "Neha", "Priya", "Karan", "Siddharth", "Anjali", "Vikram"];
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Goa", "Chennai"];

export default function ToastManager() {
  const [toast, setToast] = useState(null);
  const [catalog, setCatalog] = useState([]);

  // Fetch products once on mount
  useEffect(() => {
    fetch('/api/products?sort=newest&limit=16')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length) setCatalog(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (catalog.length === 0) return;

    const triggerToast = () => {
      const showFor = 4000;
      const nextIn = Math.floor(Math.random() * 15000) + 10000;

      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
      const randomProduct = catalog[Math.floor(Math.random() * catalog.length)];
      
      setToast({
        id: Date.now(),
        name: randomName,
        city: randomCity,
        productName: randomProduct.name,
        image: randomProduct.images?.[0]
      });

      setTimeout(() => { setToast(null); }, showFor);
      setTimeout(triggerToast, nextIn + showFor);
    };

    const initTimer = setTimeout(triggerToast, 5000);
    return () => clearTimeout(initTimer);
  }, [catalog]);

  return (
    <div className={styles.toastContainer}>
      <AnimatePresence>
        {toast && (
          <motion.div 
            key={toast.id}
            className={styles.toast}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <img src={toast.image} alt={toast.productName} className={styles.toastImg} />
            <div className={styles.toastContent}>
              <p className={styles.toastBold}>{toast.name} from {toast.city} just bought</p>
              <p className={styles.toastProduct}>{toast.productName}</p>
              <span className={styles.timeTag}>Just now</span>
            </div>
            <button className={styles.closeBtn} onClick={() => setToast(null)}>×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
