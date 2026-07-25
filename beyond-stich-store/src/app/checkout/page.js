'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import styles from './page.module.css';
import Image from 'next/image';

const STEPS = {
  ADDRESS: 'ADDRESS',
  SUMMARY: 'SUMMARY',
  PAYMENT: 'PAYMENT'
};

export default function CheckoutPage() {
  const [step, setStep] = useState(STEPS.ADDRESS);
  const { items, total } = useCartStore();
  const router = useRouter();

  // Mock Form Data
  const [formData, setFormData] = useState({
    firstName: 'Ravi',
    lastName: 'Sharma',
    email: 'ravi@example.com',
    phone: '9876543210',
    address: '123, Fashion Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin: '400001'
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setStep(STEPS.SUMMARY);
  };

  const handleMockPay = () => {
    // In a real flow, this initializes Razorpay
    setStep(STEPS.PAYMENT);
    
    // Simulate API delay and redirect
    setTimeout(() => {
      router.push('/checkout/success?orderId=ORD_928374928');
    }, 1500);
  };

  if (items.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h2>YOUR BAG IS EMPTY</h2>
        <Link href="/shop" className={styles.backBtn}>BACK TO SHOP</Link>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={`${styles.container} container`}>
        
        {/* Left Col: Flow */}
        <div className={styles.mainFlow}>
          
          {/* Breadcrumb Steps */}
          <div className={styles.steps}>
            <div className={`${styles.stepIndicator} ${step === STEPS.ADDRESS ? styles.activeStep : ''}`}>
              <span>1</span> ADDRESS
            </div>
            <div className={styles.stepLines} />
            <div className={`${styles.stepIndicator} ${step === STEPS.SUMMARY || step === STEPS.PAYMENT ? styles.activeStep : ''}`}>
              <span>2</span> SUMMARY
            </div>
          </div>

          <AnimatePresence mode="wait">
            
            {/* Step 1: ADDRESS */}
            {step === STEPS.ADDRESS && (
              <motion.form 
                key="address"
                className={styles.formGroup}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleAddressSubmit}
              >
                <h3>SHIPPING ADDRESS</h3>
                <div className={styles.formRow}>
                  <input required name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" className={styles.input} />
                  <input required name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" className={styles.input} />
                </div>
                <div className={styles.formRow}>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className={styles.input} />
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone" className={styles.input} />
                </div>
                <input required name="address" value={formData.address} onChange={handleInputChange} placeholder="Address Line 1" className={styles.input} />
                <div className={styles.formRow}>
                  <input required name="city" value={formData.city} onChange={handleInputChange} placeholder="City" className={styles.input} />
                  <input required name="state" value={formData.state} onChange={handleInputChange} placeholder="State" className={styles.input} />
                  <input required name="pin" value={formData.pin} onChange={handleInputChange} placeholder="PIN Code" className={styles.input} />
                </div>
                <button type="submit" className={styles.ctaBtn}>
                  CONTINUE TO SUMMARY
                </button>
              </motion.form>
            )}

            {/* Step 2: SUMMARY */}
            {step === STEPS.SUMMARY && (
              <motion.div 
                key="summary"
                className={styles.summaryBlock}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className={styles.deliverTo}>
                  <div className={styles.deliverHeader}>
                    <h3>DELIVERING TO</h3>
                    <button onClick={() => setStep(STEPS.ADDRESS)} className={styles.editBtn}>EDIT</button>
                  </div>
                  <p><strong>{formData.firstName} {formData.lastName}</strong> | {formData.phone}</p>
                  <p>{formData.address}</p>
                  <p>{formData.city}, {formData.state} - {formData.pin}</p>
                </div>

                <button onClick={handleMockPay} className={styles.mockPayBtn}>
                  PROCEED TO SECURE PAYMENT
                </button>
              </motion.div>
            )}

            {/* Step 3: PAYMENT (MOCK) */}
            {step === STEPS.PAYMENT && (
              <motion.div 
                key="payment"
                className={styles.processingBlock}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className={styles.spinner} />
                <h3>INITIALIZING SECURE GATEWAY...</h3>
                <p>Please do not close this window.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right Col: Order Snapshot */}
        <div className={styles.orderSnapshot}>
          <div className={styles.snapshotInner}>
            <h3>ORDER TOTAL</h3>
            
            <div className={styles.itemList}>
              {items.map(item => (
                <div key={item.cartId} className={styles.itemRow}>
                  <div className={styles.itemImgWrap}>
                    <Image src={item.images?.[0] || item.image || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&q=80'} alt={item.name} fill style={{objectFit: 'cover'}} />
                  </div>
                  <div className={styles.itemMeta}>
                    <h4>{item.name}</h4>
                    <p>Size: {item.size} | Qty: {item.quantity}</p>
                    <p className={styles.itemPrice}>₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Shipping</span>
                <span className={styles.free}>FREE</span>
              </div>
              <div className={styles.grandTotal}>
                <span>TOTAL</span>
                <span>₹{total}</span>
              </div>
            </div>
            
            <p className={styles.secureBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              100% Secure Checkout
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
