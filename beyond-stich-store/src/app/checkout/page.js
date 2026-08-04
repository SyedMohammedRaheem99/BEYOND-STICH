'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import styles from './page.module.css';
import Image from 'next/image';

const STEPS = {
  ADDRESS: 'ADDRESS',
  SUMMARY: 'SUMMARY',
  PAYMENT: 'PAYMENT',
};

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pin: '',
};

const ADDRESS_KEY = 'bs_checkout_address';
const ORDER_KEY = 'bs_last_order';

function validate(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = 'Required';
  if (!form.lastName.trim()) errors.lastName = 'Required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
  if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) errors.phone = 'Enter a 10-digit phone';
  if (!form.address.trim()) errors.address = 'Required';
  if (!form.city.trim()) errors.city = 'Required';
  if (!form.state.trim()) errors.state = 'Required';
  if (!/^\d{6}$/.test(form.pin.trim())) errors.pin = 'Enter a 6-digit PIN';
  return errors;
}

export default function CheckoutPage() {
  const [step, setStep] = useState(STEPS.ADDRESS);
  const { items, getSubtotal, getSavings, getShipping } = useCartStore();
  const router = useRouter();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount, freeShipping, label }
  const [couponMsg, setCouponMsg] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Restore a previously used address (nicer for returning customers).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADDRESS_KEY);
      if (saved) setFormData({ ...EMPTY_FORM, ...JSON.parse(saved) });
    } catch {}
  }, []);

  // ---- Totals ----
  const subtotal = getSubtotal();
  const savings = getSavings();
  const couponDiscount = coupon?.discount || 0;
  const shipping = coupon?.freeShipping ? 0 : getShipping();
  const total = Math.max(0, subtotal - couponDiscount) + shipping;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: undefined });
  };

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCoupon({
          code: data.code,
          discount: data.discount,
          freeShipping: data.freeShipping,
          label: data.label,
        });
        setCouponMsg(data.message);
      } else {
        setCoupon(null);
        setCouponMsg(data.message || 'Invalid coupon');
      }
    } catch {
      setCoupon(null);
      setCouponMsg('Could not validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    setCouponMsg('');
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    const errs = validate(formData);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(formData));
    } catch {}
    setStep(STEPS.SUMMARY);
  };

  const handlePay = async () => {
    setStep(STEPS.PAYMENT);

    // Persist the order to the database. Payment is still mocked — when real
    // Razorpay lands, verify the signature before this call.
    const payload = {
      email: formData.email,
      items: items.map((i) => ({
        productSlug: i.slug,
        name: i.name,
        image: i.image,
        size: i.size,
        color: i.color,
        segment: i.segment,
        quantity: i.quantity,
        price: i.price,
      })),
      shippingAddress: {
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        street: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pin,
      },
      subtotal,
      discount: couponDiscount,
      shipping,
      total,
      couponCode: coupon?.code || '',
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.order) {
        // Save a snapshot for the success page display.
        const order = {
          id: data.order.orderNumber,
          items,
          address: formData,
          subtotal,
          savings,
          couponCode: coupon?.code || null,
          couponDiscount,
          shipping,
          total,
          placedAt: data.order.createdAt,
        };
        try { sessionStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch {}
        router.push(`/checkout/success?orderId=${data.order.orderNumber}`);
      } else {
        alert(data.error || 'Could not place your order. Please try again.');
        setStep(STEPS.SUMMARY);
      }
    } catch {
      alert('Network error placing your order. Please try again.');
      setStep(STEPS.SUMMARY);
    }
  };

  if (items.length === 0 && step !== STEPS.PAYMENT) {
    return (
      <div className={styles.emptyContainer}>
        <h2>YOUR BAG IS EMPTY</h2>
        <Link href="/shop" className={styles.backBtn}>BACK TO SHOP</Link>
      </div>
    );
  }

  const field = (name, placeholder, type = 'text', extra = {}) => (
    <div className={styles.field}>
      <input
        name={name}
        type={type}
        value={formData[name]}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`${styles.input} ${errors[name] ? styles.inputError : ''}`}
        aria-label={placeholder}
        aria-invalid={errors[name] ? 'true' : 'false'}
        {...extra}
      />
      {errors[name] && <span className={styles.errorText}>{errors[name]}</span>}
    </div>
  );

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
                noValidate
              >
                <h3>SHIPPING ADDRESS</h3>
                <div className={styles.formRow}>
                  {field('firstName', 'First Name')}
                  {field('lastName', 'Last Name')}
                </div>
                <div className={styles.formRow}>
                  {field('email', 'Email', 'email')}
                  {field('phone', 'Phone', 'tel', { inputMode: 'numeric', maxLength: 10 })}
                </div>
                {field('address', 'Address Line 1')}
                <div className={styles.formRow}>
                  {field('city', 'City')}
                  {field('state', 'State')}
                  {field('pin', 'PIN Code', 'text', { inputMode: 'numeric', maxLength: 6 })}
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

                <button onClick={handlePay} className={styles.mockPayBtn}>
                  PROCEED TO SECURE PAYMENT — ₹{total}
                </button>
              </motion.div>
            )}

            {/* Step 3: PAYMENT (mock gateway) */}
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
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className={styles.itemRow}>
                  <div className={styles.itemImgWrap}>
                    <Image
                      src={item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80'}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className={styles.itemMeta}>
                    <h4>{item.name}</h4>
                    <p>Size: {item.size} | Qty: {item.quantity}</p>
                    <p className={styles.itemPrice}>₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className={styles.couponBlock}>
              {coupon ? (
                <div className={styles.couponApplied}>
                  <span><strong>{coupon.code}</strong> — {coupon.label}</span>
                  <button onClick={removeCoupon} className={styles.couponRemove} aria-label="Remove coupon">
                    Remove
                  </button>
                </div>
              ) : (
                <div className={styles.couponForm}>
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code"
                    className={styles.couponInput}
                    aria-label="Coupon code"
                  />
                  <button onClick={applyCoupon} className={styles.couponBtn} type="button" disabled={couponLoading}>
                    {couponLoading ? '…' : 'APPLY'}
                  </button>
                </div>
              )}
              {couponMsg && (
                <span className={`${styles.couponMsg} ${coupon ? styles.couponMsgOk : styles.couponMsgErr}`}>
                  {couponMsg}
                </span>
              )}
            </div>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {savings > 0 && (
                <div className={styles.totalRow}>
                  <span>You save (MRP)</span>
                  <span className={styles.free}>−₹{savings}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className={styles.totalRow}>
                  <span>Coupon ({coupon.code})</span>
                  <span className={styles.free}>−₹{couponDiscount}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>Shipping</span>
                <span className={shipping === 0 ? styles.free : ''}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
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
