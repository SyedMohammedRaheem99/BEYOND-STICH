import Script from 'next/script';

/**
 * Loads whichever analytics providers are configured.
 *
 * Each is independent: set the measurement ID and it loads, leave it
 * unset and nothing is injected — no empty script tag, no console error,
 * no cookie. That matters for a store with no analytics consent banner
 * yet, since a provider that is off writes nothing at all.
 *
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 *   NEXT_PUBLIC_META_PIXEL_ID=1234567890
 *
 * `afterInteractive` deliberately, not `beforeInteractive`: analytics must
 * never sit on the critical path of a page a customer is trying to buy
 * from.
 */
export default function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const metaId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  if (!gaId && !metaId) return null;

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                // Routing is client-side, so the automatic pageview would
                // only ever fire for the first page. PageViewTracker sends
                // one per navigation instead.
                send_page_view: false,
                currency: 'INR',
                country: 'IN',
              });
            `}
          </Script>
        </>
      )}

      {metaId && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element --
                the pixel's own fallback; next/image would defeat it. */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              alt=""
              src={`https://www.facebook.com/tr?id=${metaId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
    </>
  );
}
