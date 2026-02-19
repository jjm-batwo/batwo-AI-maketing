'use client'

import Script from 'next/script'

export function FacebookSDK() {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID

  if (!appId) {
    return null
  }

  return (
    <>
      {/* Facebook SDK는 CDN에서 동적 제공되어 SRI 해시가 불안정하므로 SRI 미적용.
          대신 crossOrigin과 CSP로 보안 확보 */}
      <Script
        id="facebook-sdk"
        strategy="lazyOnload"
        src="https://connect.facebook.net/en_US/sdk.js"
        crossOrigin="anonymous"
        onLoad={() => {
          if (window.FB) {
            window.FB.init({
              appId: appId,
              cookie: true,
              xfbml: true,
              version: 'v25.0',
            })
            window.FB.AppEvents.logPageView()
          }
        }}
      />
    </>
  )
}
