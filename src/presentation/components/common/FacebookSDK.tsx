'use client'

import Script from 'next/script'

export function FacebookSDK() {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID

  if (!appId) {
    return null
  }

  return (
    <Script
      id="facebook-sdk"
      strategy="afterInteractive"
      src="https://connect.facebook.net/en_US/sdk.js"
      onLoad={() => {
        if (window.FB) {
          window.FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: 'v21.0',
          })
          window.FB.AppEvents.logPageView()
        }
      }}
    />
  )
}
