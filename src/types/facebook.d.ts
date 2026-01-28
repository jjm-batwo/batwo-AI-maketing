// Facebook SDK global type definitions

export interface FacebookAuthResponse {
  accessToken: string
  expiresIn: number
  signedRequest: string
  userID: string
}

export interface FacebookStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse?: FacebookAuthResponse
}

export interface FacebookSDK {
  init: (params: {
    appId: string
    cookie: boolean
    xfbml: boolean
    version: string
  }) => void
  getLoginStatus: (callback: (response: FacebookStatusResponse) => void) => void
  login: (callback: (response: FacebookStatusResponse) => void, options?: { scope: string }) => void
  AppEvents: {
    logPageView: () => void
  }
}

declare global {
  interface Window {
    FB?: FacebookSDK
    fbAsyncInit?: () => void
  }
}
