'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  const { items, hydrated, getSubtotal, getSavings, getShipping } = useCartStore();
  const router = useRouter();
  // Checkout was entirely session-blind: a signed-in customer got no prefill,
  // no saved addresses, and no prompt to sign in — so returning customers kept
  // creating guest orders they could never see in their account.
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount, freeShipping, label }
  const [couponMsg, setCouponMsg] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  // Online is offered first now that live Razorpay keys are configured; an
  // order only reaches paymentStatus 'paid' after /api/razorpay/verify checks
  // the HMAC signature, so the mock path can no longer mark anything paid.
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cod'
  const [placingOrder, setPlacingOrder] = useState(false);
  // Checkout failures used to fire setOrderError(), which is easy to dismiss by
  // accident on mobile and loses the reason the order failed.
  const [orderError, setOrderError] = useState('');

  // Saved addresses for signed-in customers. The address book existed but
  // checkout never read it, so curated addresses were ignored.
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Restore a previously used address (nicer for returning customers).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADDRESS_KEY);
      if (saved) setFormData({ ...EMPTY_FORM, ...JSON.parse(saved) });
    } catch {}
  }, []);

  // Prefill from the signed-in account and offer their saved addresses.
  useEffect(() => {
    if (status !== 'authenticated') return;

    setFormData((prev) => ({
      ...prev,
      email: prev.email || session?.user?.email || '',
      firstName: prev.firstName || (session?.user?.name || '').split(' ')[0] || '',
      lastName:
        prev.lastName || (session?.user?.name || '').split(' ').slice(1).join(' ') || '',
    }));

    fetch('/api/user/addresses')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.addresses)) setSavedAddresses(data.addresses);
      })
      .catch(() => {});
  }, [status, session]);

  const useSavedAddress = (addr) => {
    const [firstName, ...rest] = (addr.fullName || '').split(' ');
    setFormData({
      firstName: firstName || '',
      lastName: rest.join(' '),
      email: formData.email || session?.user?.email || '',
      phone: addr.phone || '',
      address: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pin: addr.pincode || '',
    });
    setErrors({});
  };

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

  const buildOrderPayload = () => ({
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
  });

  const saveOrderAndRedirect = (dbOrder) => {
    // Prefer the server's figures over the client's. Prices are re-read from
    // the database at order time, and an expired coupon is dropped there — so
    // showing the cart's own totals could tell a COD customer to keep ₹799
    // ready for an order actually written as ₹1299.
    const order = {
      id: dbOrder.orderNumber,
      items, address: formData,
      savings,
      subtotal: dbOrder.subtotal ?? subtotal,
      couponCode: dbOrder.couponCode ?? (coupon?.code || null),
      couponDiscount: dbOrder.discount ?? couponDiscount,
      shipping: dbOrder.shipping ?? shipping,
      total: dbOrder.total ?? total,
      placedAt: dbOrder.createdAt,
      paymentMethod,
    };
    try { sessionStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch {}
    router.push(`/checkout/success?orderId=${dbOrder.orderNumber}`);
  };

  const handlePay = async () => {
    // Guard against a double-tap or an impatient retry creating two orders:
    // there is no idempotency key, so each POST would be a separate COD
    // parcel the customer never asked for.
    if (placingOrder) return;
    setPlacingOrder(true);
    setOrderError('');

    setStep(STEPS.PAYMENT);
    const orderPayload = buildOrderPayload();

    // COD: skip payment gateway entirely
    if (paymentMethod === 'cod') {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...orderPayload, paymentMethod: 'cod' }),
        });
        const data = await res.json();
        if (res.ok && data.order) {
          saveOrderAndRedirect(data.order);
        } else {
          setOrderError(data.error || 'Could not place your order. Please try again.');
          setStep(STEPS.SUMMARY);
          setPlacingOrder(false);
        }
      } catch {
        setOrderError('Network error. Please try again.');
        setStep(STEPS.SUMMARY);
        setPlacingOrder(false);
      }
      return;
    }

    // ONLINE: Razorpay flow
    try {
      // Send the cart, not a total: the server prices it so the amount
      // charged can't be tampered with.
      const rzpOrderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderPayload.items,
          couponCode: orderPayload.couponCode,
          currency: 'INR',
          notes: { email: formData.email },
        }),
      });
      const rzpOrderData = await rzpOrderRes.json();

      if (!rzpOrderData.success) {
        throw new Error(rzpOrderData.error || 'Could not initiate payment.');
      }

      const rzpOrder = rzpOrderData.order;

      // Mock mode (no real Razorpay keys)
      if (rzpOrder.mock) {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...orderPayload, paymentMethod: 'online' }),
        });
        const data = await res.json();
        if (res.ok && data.order) {
          saveOrderAndRedirect(data.order);
        } else {
          setOrderError(data.error || 'Could not place your order. Please try again.');
          setStep(STEPS.SUMMARY);
          setPlacingOrder(false);
        }
        return;
      }

      // Real Razorpay modal
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      const options = {
        key: razorpayKey,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'Beyond Stich',
        description: `Order of ${items.length} item${items.length !== 1 ? 's' : ''}`,
        order_id: rzpOrder.id,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: '#C6A14A' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                ...orderPayload,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              saveOrderAndRedirect(verifyData.order);
            } else {
              setOrderError(verifyData.error || 'Payment verification failed. Contact support with your payment ID.');
              setStep(STEPS.SUMMARY);
              setPlacingOrder(false);
            }
          } catch {
            setOrderError('Network error during verification. Please contact support.');
            setStep(STEPS.SUMMARY);
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            setStep(STEPS.SUMMARY);
            setPlacingOrder(false);
          },
        },
      };

      if (typeof window.Razorpay !== 'function') {
        throw new Error('Payment could not load. Check your connection and try again.');
      }

      const razorpay = new window.Razorpay(options);

      // A declined card fires this instead of `handler`, so without it the
      // customer would sit on the processing screen with no explanation.
      razorpay.on('payment.failed', (response) => {
        setOrderError(
          response?.error?.description ||
            'Payment failed. No money was taken — please try again or choose Cash on Delivery.'
        );
        setStep(STEPS.SUMMARY);
        setPlacingOrder(false);
      });

      razorpay.open();

    } catch (err) {
      setOrderError(err.message || 'Something went wrong. Please try again.');
      setStep(STEPS.SUMMARY);
      setPlacingOrder(false);
    }
  };


  // Wait for the persisted cart to load before deciding the bag is empty,
  // otherwise this screen flashes on every visit to checkout.
  if (!hydrated) {
    return (
      <div className={styles.emptyContainer}>
        <h2>LOADING YOUR BAG…</h2>
      </div>
    );
  }

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
                {/* Returning customers who forget to sign in create orders
                    that never show up in their account. */}
                {status === 'unauthenticated' && (
                  <p className={styles.signInPrompt}>
                    Have an account?{' '}
                    <Link href="/login?callbackUrl=%2Fcheckout">Sign in</Link> to
                    use your saved addresses and see this order in your account.
                  </p>
                )}

                {savedAddresses.length > 0 && (
                  <div className={styles.savedAddresses}>
                    <h3>USE A SAVED ADDRESS</h3>
                    <div className={styles.savedList}>
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr._id}
                          type="button"
                          className={styles.savedCard}
                          onClick={() => useSavedAddress(addr)}
                        >
                          <span className={styles.savedName}>{addr.fullName}</span>
                          <span className={styles.savedLine}>
                            {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                          </span>
                          <span className={styles.savedLine}>{addr.phone}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Payment Method Selection */}
                <div className={styles.paymentMethodBlock}>
                  <h3>PAYMENT METHOD</h3>
                  <label className={`${styles.paymentOption} ${paymentMethod === 'online' ? styles.paymentOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className={styles.paymentRadio}
                    />
                    <div>
                      <span className={styles.paymentLabel}>PAY ONLINE</span>
                      <span className={styles.paymentDesc}>UPI, Cards, Net Banking via Razorpay</span>
                    </div>
                  </label>
                  <label className={`${styles.paymentOption} ${paymentMethod === 'cod' ? styles.paymentOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className={styles.paymentRadio}
                    />
                    <div>
                      <span className={styles.paymentLabel}>CASH ON DELIVERY</span>
                      <span className={styles.paymentDesc}>Pay when your order arrives</span>
                    </div>
                  </label>
                </div>

                {orderError && (
                  <p className={styles.orderError} role="alert">
                    {orderError}
                  </p>
                )}

                <button onClick={handlePay} className={styles.mockPayBtn} disabled={placingOrder}>
                  {placingOrder
                    ? 'PLACING YOUR ORDER…'
                    : paymentMethod === 'cod'
                      ? `PLACE ORDER — ₹${total}`
                      : `PROCEED TO SECURE PAYMENT — ₹${total}`}
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
