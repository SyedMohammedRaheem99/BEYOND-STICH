'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ToastManager.module.css';
import { getAllProducts } from '@/lib/data/products';

const NAMES = ["Ravi", "Aman", "Neha", "Priya", "Karan", "Siddharth", "Anjali", "Vikram"];
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Goa", "Chennai"];
const CATALOG = getAllProducts();

export default function ToastManager() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Fire a random toast every 12 to 25 seconds
    const triggerToast = () => {
      const showFor = 4000;
      const nextIn = Math.floor(Math.random() * 15000) + 10000;

      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
      const randomProduct = CATALOG[Math.floor(Math.random() * CATALOG.length)];
      
      setToast({
        id: Date.now(),
        name: randomName,
        city: randomCity,
        productName: randomProduct.name,
        image: randomProduct.images[0]
      });

      // Hide toast
      setTimeout(() => {
        setToast(null);
      }, showFor);

      // Recursive loop
      setTimeout(triggerToast, nextIn + showFor);
    };

    // Initial timeout before first toast
    const initTimer = setTimeout(triggerToast, 5000);
    return () => clearTimeout(initTimer);
  }, []);

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
