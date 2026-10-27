/* eslint-disable testing-library/no-node-access --
 * Several criteria here are about structure that accessible queries cannot
 * reach: that the page contains no anchors or submitting form (AC-13), that no
 * control is pulled out of the tab order (AC-12), and that no error element
 * exists until one is asked for (AC-11). Absence of an element and raw
 * attributes are exactly what the DOM API is for.
 */
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';

// SDLC-39 acceptance criteria.
//
// jsdom neither evaluates media queries nor applies the imported stylesheet, so
// the responsive and visual criteria (AC-01..AC-04, and the state styles behind
// AC-08/AC-11/AC-12) are asserted against the stylesheet text instead of
// computed layout. Everything behavioural is asserted against the rendered DOM.

const css = fs.readFileSync(path.join(__dirname, 'LoginPage.css'), 'utf8');
// Comments mention the forbidden concepts by name, so scan the code without them.
const source = fs
  .readFileSync(path.join(__dirname, 'LoginPage.js'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

/** Body of the first rule or at-rule in `scope` whose header starts with `header`. */
function ruleBody(scope, header) {
  const start = scope.indexOf(header);
  if (start === -1) throw new Error(`no rule found for: ${header}`);
  const open = scope.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < scope.length; i += 1) {
    if (scope[i] === '{') depth += 1;
    if (scope[i] === '}') {
      depth -= 1;
      if (depth === 0) return scope.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated rule: ${header}`);
}

/** First pixel value of `property` inside `scope`, as a number. */
function px(scope, property) {
  const match = new RegExp(`${property}:\\s*([^;]+);`).exec(scope);
  if (!match) throw new Error(`no ${property} declaration found`);
  const value = /(-?\d+(?:\.\d+)?)px/.exec(match[1]);
  if (!value) throw new Error(`${property} is not a pixel value: ${match[1]}`);
  return Number(value[1]);
}

const MOBILE = css.slice(0, css.indexOf('@media (min-width: 768px)'));
const TABLET = ruleBody(css, '@media (min-width: 768px)');
const DESKTOP = ruleBody(css, '@media (min-width: 1024px)');

describe('AC-01 desktop split-screen', () => {
  test('the branding panel precedes the login card and both are present', () => {
    render(<LoginPage />);

    const brand = screen.getByRole('region', { name: 'Welcome Back!' });
    const card = screen.getByTestId('login-card');

    expect(brand).toBeInTheDocument();
    expect(card).toBeInTheDocument();
    // Node.DOCUMENT_POSITION_FOLLOWING: the card comes after the brand panel.
    expect(brand.compareDocumentPosition(card) & 4).toBeTruthy();
  });

  test('the branding panel carries the logo, heading, subtitle and illustration', () => {
    render(<LoginPage />);

    const brand = screen.getByRole('region', { name: 'Welcome Back!' });
    expect(brand).toHaveTextContent('Northstar');
    expect(screen.getByRole('heading', { name: 'Welcome Back!' })).toBeInTheDocument();
    expect(screen.getByText('Sign in to continue to your workspace.')).toBeInTheDocument();
    expect(screen.getByTestId('login-illustration').querySelector('svg')).toBeInTheDocument();
  });

  test('the layout is two equal columns from 1024px, on a gradient branding panel', () => {
    // The 768px rules still apply at 1024px, so the 50/50 split is inherited.
    expect(ruleBody(TABLET, '.login-page {')).toContain('grid-template-columns: 1fr 1fr');
    expect(ruleBody(TABLET, '.login-page__brand {')).toContain('linear-gradient');
    expect(DESKTOP).toBeTruthy();
  });
});

describe('AC-02 tablet', () => {
  test('both panels stay visible between 768px and 1023px', () => {
    const brand = ruleBody(TABLET, '.login-page__brand {');
    const panel = ruleBody(TABLET, '.login-page__form-panel {');

    expect(brand).not.toContain('display: none');
    expect(panel).not.toContain('display: none');
    expect(ruleBody(TABLET, '.login-page__illustration {')).toContain('display: block');
  });

  test('spacing and illustration are smaller than at desktop', () => {
    const tabletIllustration = px(ruleBody(TABLET, '.login-page__illustration {'), 'max-width');
    const desktopIllustration = px(ruleBody(DESKTOP, '.login-page__illustration {'), 'max-width');
    expect(tabletIllustration).toBeLessThan(desktopIllustration);

    const tabletPadding = px(ruleBody(TABLET, '.login-page__brand {'), 'padding');
    const desktopPadding = px(ruleBody(DESKTOP, '.login-page__brand {'), 'padding');
    expect(tabletPadding).toBeLessThan(desktopPadding);
  });
});

describe('AC-03 mobile', () => {
  test('the illustration is hidden and the page is a single centred column', () => {
    expect(ruleBody(MOBILE, '.login-page__illustration {')).toContain('display: none');

    const page = ruleBody(MOBILE, '.login-page {');
    expect(page).toContain('grid-template-columns: 1fr');
    expect(page).not.toContain('grid-template-columns: 1fr 1fr');

    const panel = ruleBody(MOBILE, '.login-page__form-panel {');
    expect(panel).toContain('justify-content: center');
  });

  test('side padding sits in the 20-24px band and nothing scrolls sideways', () => {
    const panel = ruleBody(MOBILE, '.login-page__form-panel {');
    const sidePadding = Number(/padding:\s*\d+px\s+(\d+)px/.exec(panel)[1]);
    expect(sidePadding).toBeGreaterThanOrEqual(20);
    expect(sidePadding).toBeLessThanOrEqual(24);

    expect(ruleBody(MOBILE, '.login-page {')).toContain('overflow-x: hidden');
    expect(ruleBody(MOBILE, '.login-page *,')).toContain('box-sizing: border-box');
  });
});

describe('AC-04 card and page surfaces', () => {
  test('white card, 10-14px radius and a subtle shadow on a light gray page', () => {
    const tokens = ruleBody(MOBILE, '.login-page {');
    expect(tokens).toContain('--lp-card-bg: #ffffff');
    expect(tokens).toContain('--lp-page-bg: #f3f4f6');
    expect(tokens).toContain('background-color: var(--lp-page-bg)');

    const radius = px(tokens, '--lp-radius-card');
    expect(radius).toBeGreaterThanOrEqual(10);
    expect(radius).toBeLessThanOrEqual(14);

    const card = ruleBody(MOBILE, '.login-page__card {');
    expect(card).toContain('background-color: var(--lp-card-bg)');
    expect(card).toContain('border-radius: var(--lp-radius-card)');
    expect(card).toContain('box-shadow: var(--lp-shadow-card)');
    expect(tokens).toMatch(/--lp-shadow-card:.*rgba\(/);
  });
});

describe('AC-05 fields and labels', () => {
  test('both fields have a visible label bound to the input and the right placeholder', () => {
    render(<LoginPage />);

    const identifier = screen.getByLabelText('Email or Username');
    const password = screen.getByLabelText('Password');

    expect(identifier).toHaveAttribute('placeholder', 'Enter your email or username');
    expect(password).toHaveAttribute('placeholder', 'Enter your password');

    // The labels are real, visible <label> elements pointing at the inputs.
    const identifierLabel = screen.getByText('Email or Username');
    const passwordLabel = screen.getByText('Password');
    expect(identifierLabel.tagName).toBe('LABEL');
    expect(passwordLabel.tagName).toBe('LABEL');
    expect(identifierLabel).toHaveAttribute('for', identifier.id);
    expect(passwordLabel).toHaveAttribute('for', password.id);
    expect(identifierLabel).toBeVisible();
    expect(passwordLabel).toBeVisible();
  });

  test('typing updates both fields', () => {
    render(<LoginPage />);

    userEvent.type(screen.getByLabelText('Email or Username'), 'ada');
    userEvent.type(screen.getByLabelText('Password'), 'secret');

    expect(screen.getByLabelText('Email or Username')).toHaveValue('ada');
    expect(screen.getByLabelText('Password')).toHaveValue('secret');
  });
});

describe('AC-06 password visibility toggle', () => {
  test('the eye button toggles the field and renames itself for each state', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');

    const show = screen.getByRole('button', { name: 'Show password' });
    expect(show).toHaveAttribute('aria-pressed', 'false');
    userEvent.click(show);

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    const hide = screen.getByRole('button', { name: 'Hide password' });
    expect(hide).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: 'Show password' })).not.toBeInTheDocument();

    userEvent.click(hide);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
  });

  test('the typed value survives the toggle', () => {
    render(<LoginPage />);

    userEvent.type(screen.getByLabelText('Password'), 'secret');
    userEvent.click(screen.getByRole('button', { name: 'Show password' }));

    expect(screen.getByLabelText('Password')).toHaveValue('secret');
  });
});

describe('AC-07 remember me and forgot password', () => {
  test('the checkbox is present and togglable', () => {
    render(<LoginPage />);

    const remember = screen.getByLabelText('Remember me');
    expect(remember).toHaveAttribute('type', 'checkbox');
    expect(remember).not.toBeChecked();

    userEvent.click(remember);
    expect(screen.getByLabelText('Remember me')).toBeChecked();
  });

  test('a Forgot Password? control is present and link-styled', () => {
    render(<LoginPage />);

    const forgot = screen.getByRole('button', { name: 'Forgot Password?' });
    expect(forgot).toHaveClass('login-page__link');
    expect(ruleBody(MOBILE, '.login-page__link {')).toContain('color: var(--lp-accent)');
  });
});

describe('AC-08 sign in button', () => {
  test('it is full width and has default, hover, focus and disabled styles', () => {
    const submit = ruleBody(MOBILE, '.login-form__submit {');
    expect(submit).toContain('width: 100%');
    expect(submit).toContain('background-color: var(--lp-accent)');

    expect(ruleBody(MOBILE, '.login-form__submit:hover:not(:disabled) {')).toContain(
      'background-color: var(--lp-accent-hover)'
    );
    expect(ruleBody(MOBILE, '.login-form__submit:disabled {')).toContain('cursor: not-allowed');
    expect(ruleBody(MOBILE, '.login-page :focus-visible {')).toContain('outline:');
  });

  test('it renders enabled by default and disabled on demand', () => {
    const { unmount } = render(<LoginPage />);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled();
    unmount();

    render(<LoginPage signInDisabled />);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeDisabled();
  });
});

describe('AC-09 social sign-in', () => {
  test('an OR divider sits above the Google and Microsoft buttons', () => {
    render(<LoginPage />);

    expect(screen.getByText('OR')).toBeInTheDocument();

    const google = screen.getByRole('button', { name: 'Continue with Google' });
    const microsoft = screen.getByRole('button', { name: 'Continue with Microsoft' });
    expect(google).toHaveClass('login-form__social-button');
    expect(microsoft).toHaveClass('login-form__social-button');
    expect(screen.getByText('OR').compareDocumentPosition(google) & 4).toBeTruthy();
  });

  test('they are styled consistently with the rest of the form', () => {
    const social = ruleBody(MOBILE, '.login-form__social-button {');
    expect(social).toContain('width: 100%');
    expect(social).toContain('border-radius: var(--lp-radius-control)');
  });
});

describe('AC-10 sign up footer', () => {
  test('the footer reads the prompt with Sign Up styled as a link', () => {
    render(<LoginPage />);

    const signUp = screen.getByRole('button', { name: 'Sign Up' });
    expect(signUp).toHaveClass('login-page__link');
    expect(signUp.closest('.login-page__footer')).toHaveTextContent(
      "Don't have an account? Sign Up"
    );
  });
});

describe('AC-11 input error state', () => {
  test('no error is shown by default', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Email or Username')).not.toHaveClass(
      'login-form__input--error'
    );
    expect(screen.getByLabelText('Email or Username')).not.toHaveAttribute('aria-invalid');
    expect(document.querySelector('.login-form__error')).toBeNull();
  });

  test('errors can be shown on demand on either field', () => {
    render(
      <LoginPage identifierError="Enter your email or username" passwordError="Enter your password" />
    );

    const identifier = screen.getByLabelText('Email or Username');
    const password = screen.getByLabelText('Password');

    expect(identifier).toHaveClass('login-form__input--error');
    expect(password).toHaveClass('login-form__input--error');
    expect(identifier).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAttribute('aria-invalid', 'true');

    const identifierMessage = document.getElementById(
      identifier.getAttribute('aria-describedby')
    );
    expect(identifierMessage).toHaveTextContent('Enter your email or username');
    expect(identifierMessage).toHaveClass('login-form__error');
  });

  test('the error style changes the border colour and the message colour', () => {
    expect(ruleBody(MOBILE, '.login-form__input--error,')).toContain(
      'border-color: var(--lp-error)'
    );
    expect(ruleBody(MOBILE, '.login-form__error {')).toContain('color: var(--lp-error)');
  });
});

describe('AC-12 keyboard access', () => {
  test('every control is reachable by Tab in reading order', () => {
    render(<LoginPage />);

    const expected = [
      screen.getByLabelText('Email or Username'),
      screen.getByLabelText('Password'),
      screen.getByRole('button', { name: 'Show password' }),
      screen.getByLabelText('Remember me'),
      screen.getByRole('button', { name: 'Forgot Password?' }),
      screen.getByRole('button', { name: 'Sign In' }),
      screen.getByRole('button', { name: 'Continue with Google' }),
      screen.getByRole('button', { name: 'Continue with Microsoft' }),
      screen.getByRole('button', { name: 'Sign Up' }),
    ];

    expected.forEach((control) => {
      userEvent.tab();
      expect(control).toHaveFocus();
    });
  });

  test('focus is visible, including in forced-colors mode', () => {
    const focus = ruleBody(MOBILE, '.login-page :focus-visible {');
    expect(focus).toMatch(/outline:\s*2px solid/);
    expect(focus).toContain('outline-offset: 2px');

    const forced = ruleBody(MOBILE, '@media (forced-colors: active)');
    expect(forced).toContain('outline: 3px solid Highlight');
  });

  test('nothing is removed from the tab order', () => {
    render(<LoginPage />);
    expect(document.querySelectorAll('[tabindex="-1"]')).toHaveLength(0);
  });
});

describe('AC-13 no authentication or navigation', () => {
  test('the source contains no network, storage, token or routing code', () => {
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/XMLHttpRequest|axios/);
    expect(source).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
    expect(source).not.toMatch(/react-router|useNavigate|window\.location/);
    expect(source).not.toMatch(/token|jwt/i);
  });

  test('no control navigates or submits', () => {
    render(<LoginPage />);

    const inert = [
      'Sign In',
      'Continue with Google',
      'Continue with Microsoft',
      'Forgot Password?',
      'Sign Up',
    ].map((name) => screen.getByRole('button', { name }));

    inert.forEach((control) => {
      expect(control).toHaveAttribute('type', 'button');
      expect(control.closest('a')).toBeNull();
    });

    expect(document.querySelectorAll('a')).toHaveLength(0);
    expect(document.querySelector('form')).not.toHaveAttribute('action');
  });

  test('clicking the inert controls changes nothing and calls nothing', () => {
    const fetchSpy = jest.fn();
    const originalFetch = global.fetch;
    global.fetch = fetchSpy;
    const submit = jest.fn();

    render(<LoginPage />);
    document.querySelector('form').addEventListener('submit', submit);

    userEvent.type(screen.getByLabelText('Email or Username'), 'ada');
    ['Sign In', 'Continue with Google', 'Continue with Microsoft', 'Forgot Password?', 'Sign Up']
      .forEach((name) => userEvent.click(screen.getByRole('button', { name })));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Email or Username')).toHaveValue('ada');

    global.fetch = originalFetch;
  });
});
