import { useState } from 'react';
import './LoginPage.css';

// SDLC-39 - login page, UI only.
// No authentication, API calls, submission, token handling, validation or
// routing live here. Sign In, the social buttons, Forgot Password and Sign Up
// are deliberately inert; the only state is what the user typed and whether the
// password is masked.

function LogoMark() {
  return (
    <svg className="login-page__logo-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.12" />
      <path
        d="M16 6 L25 16 L16 26 L7 16 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
    </svg>
  );
}

function BrandIllustration() {
  return (
    <svg viewBox="0 0 320 240" role="presentation" focusable="false">
      <defs>
        <linearGradient id="lp-grad-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="120" r="92" fill="url(#lp-grad-a)" opacity="0.18" />
      <circle cx="160" cy="120" r="62" fill="none" stroke="#c7d2fe" strokeWidth="1.5" opacity="0.55" />
      <g stroke="#c7d2fe" strokeWidth="1.5" opacity="0.8">
        <line x1="160" y1="120" x2="78" y2="74" />
        <line x1="160" y1="120" x2="246" y2="76" />
        <line x1="160" y1="120" x2="70" y2="168" />
        <line x1="160" y1="120" x2="252" y2="166" />
        <line x1="160" y1="120" x2="160" y2="206" />
        <line x1="78" y1="74" x2="246" y2="76" />
        <line x1="70" y1="168" x2="160" y2="206" />
        <line x1="252" y1="166" x2="160" y2="206" />
      </g>
      <g fill="#e0e7ff">
        <circle cx="78" cy="74" r="7" />
        <circle cx="246" cy="76" r="9" />
        <circle cx="70" cy="168" r="6" />
        <circle cx="252" cy="166" r="8" />
        <circle cx="160" cy="206" r="7" />
      </g>
      <rect x="128" y="88" width="64" height="64" rx="16" fill="#eef2ff" opacity="0.95" />
      <path
        d="M146 120h28M160 106v28"
        stroke="#4338ca"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ crossed }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      {crossed && (
        <line
          x1="4"
          y1="20"
          x2="20"
          y2="4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285f4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3.01h3.86c2.26-2.08 3.56-5.15 3.56-8.82Z"
      />
      <path
        fill="#34a853"
        d="M12 24c3.23 0 5.94-1.07 7.92-2.91l-3.86-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.76-2.11-6.71-4.94H1.3v3.11A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#fbbc05"
        d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.3a12 12 0 0 0 0 10.8l3.99-3.11Z"
      />
      <path
        fill="#ea4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.42-3.42C17.94 1.18 15.23 0 12 0 7.39 0 3.4 2.64 1.3 6.6l3.99 3.11C6.24 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="10" height="10" fill="#f25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7fba00" />
      <rect x="1" y="13" width="10" height="10" fill="#00a4ef" />
      <rect x="13" y="13" width="10" height="10" fill="#ffb900" />
    </svg>
  );
}

/**
 * Login page.
 *
 * `identifierError`, `passwordError` and `signInDisabled` exist so the error and
 * disabled visuals can be shown on demand (Storybook, tests, design review)
 * without any validation service deciding them.
 */
function LoginPage({ identifierError = '', passwordError = '', signInDisabled = false }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Blocks the browser's native submit only. Nothing is sent anywhere.
  const handleSubmit = (event) => event.preventDefault();

  return (
    <main className="login-page">
      <section className="login-page__brand" aria-labelledby="lp-brand-heading">
        <div className="login-page__brand-inner">
          <div className="login-page__logo">
            <LogoMark />
            <span>Northstar</span>
          </div>
          <h1 id="lp-brand-heading" className="login-page__title">
            Welcome Back!
          </h1>
          <p className="login-page__subtitle">Sign in to continue to your workspace.</p>
          <div className="login-page__illustration" data-testid="login-illustration">
            <BrandIllustration />
          </div>
        </div>
      </section>

      <section className="login-page__form-panel">
        <div className="login-page__card" data-testid="login-card">
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-form__field">
              <label className="login-form__label" htmlFor="lp-identifier">
                Email or Username
              </label>
              <input
                id="lp-identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                className={`login-form__input${identifierError ? ' login-form__input--error' : ''}`}
                placeholder="Enter your email or username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                aria-invalid={identifierError ? true : undefined}
                aria-describedby={identifierError ? 'lp-identifier-error' : undefined}
              />
              {identifierError && (
                <p className="login-form__error" id="lp-identifier-error">
                  {identifierError}
                </p>
              )}
            </div>

            <div className="login-form__field">
              <label className="login-form__label" htmlFor="lp-password">
                Password
              </label>
              <div className="login-form__input-wrap">
                <input
                  id="lp-password"
                  name="password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`login-form__input login-form__input--with-affix${
                    passwordError ? ' login-form__input--error' : ''
                  }`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={passwordError ? true : undefined}
                  aria-describedby={passwordError ? 'lp-password-error' : undefined}
                />
                <button
                  type="button"
                  className="login-form__eye"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={passwordVisible}
                  aria-controls="lp-password"
                >
                  <EyeIcon crossed={passwordVisible} />
                </button>
              </div>
              {passwordError && (
                <p className="login-form__error" id="lp-password-error">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="login-form__row">
              <label className="login-form__checkbox" htmlFor="lp-remember">
                <input
                  id="lp-remember"
                  name="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Remember me
              </label>
              <button type="button" className="login-page__link">
                Forgot Password?
              </button>
            </div>

            <button type="button" className="login-form__submit" disabled={signInDisabled}>
              Sign In
            </button>

            <div className="login-form__divider">OR</div>

            <div className="login-form__social">
              <button type="button" className="login-form__social-button">
                <GoogleIcon />
                Continue with Google
              </button>
              <button type="button" className="login-form__social-button">
                <MicrosoftIcon />
                Continue with Microsoft
              </button>
            </div>

            <p className="login-page__footer">
              Don&apos;t have an account?{' '}
              <button type="button" className="login-page__link">
                Sign Up
              </button>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
