import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const mainRuntimeOrder = ['config.js', 'storage.js', 'state.js', 'formatters.js', 'validators.js', 'cart-service.js'];

/**
 * Reads a project file as UTF-8 text.
 * @param {string} relativePath - Project-relative file path.
 * @returns {string} File contents.
 */
function readProjectFile(relativePath) {
  return readFileSync(join(rootDir, relativePath), 'utf8');
}

/**
 * Fails the smoke test with a readable message when a required condition is false.
 * @param {boolean} condition - Condition to validate.
 * @param {string} message - Failure message.
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Checks that a file exists before deeper content assertions run.
 * @param {string} relativePath - Project-relative file path.
 */
function assertFileExists(relativePath) {
  assert(existsSync(join(rootDir, relativePath)), `Missing required file: ${relativePath}`);
}

/**
 * Verifies split runtime scripts are loaded in the expected dependency order.
 * @param {string} relativePath - HTML file path.
 */
function assertRuntimeScriptOrder(relativePath) {
  const html = readProjectFile(relativePath);
  const positions = mainRuntimeOrder.map((fileName) => html.indexOf(fileName));
  assert(positions.every((index) => index !== -1), `${relativePath} is missing split runtime scripts`);
  positions.slice(1).forEach((position, index) => {
    assert(position > positions[index], `${relativePath} runtime scripts are out of order`);
  });
}

/**
 * Returns every main-site HTML page that loads the shared runtime.
 * @returns {string[]} Project-relative HTML paths.
 */
function getMainHtmlPages() {
  const pageFiles = readdirSync(join(rootDir, 'pages'))
    .filter((fileName) => fileName.endsWith('.html'))
    .map((fileName) => `pages/${fileName}`);
  return ['index.html', ...pageFiles].filter((relativePath) => readProjectFile(relativePath).includes('config.js'));
}

[
  'package.json',
  'vite.config.js',
  'eslint.config.js',
  'stylelint.config.cjs',
  '.prettierrc.json',
  'src/styles.js',
  'js/storage.js',
  'js/state.js',
  'js/formatters.js',
  'js/validators.js',
  'js/cart-service.js',
].forEach(assertFileExists);

getMainHtmlPages().forEach(assertRuntimeScriptOrder);

const header = readProjectFile('components/header.partial');
assert(header.includes('id="siteCartDrawer"'), 'Header must include shared cart drawer');
assert(header.includes('class="navbar-cart-btn"'), 'Header must include shared cart button');
assert(!header.includes('id="bkLoginBtn"'), 'Legacy booking login button should be removed');
assert(!header.includes('id="bkUserMenu"'), 'Legacy booking user menu should be removed');
assert(!/style=/.test(header), 'Header partial should not contain inline styles');
assert((header.match(/data-layout-part="shared-auth"/g) || []).length === 1, 'Header partial must define exactly one shared-auth part');
assert(header.includes('data-layout-part="shared-site-header"'), 'Header partial must define shared-site-header part');
assert(header.includes('data-layout-part="shared-site-cart-panel"'), 'Header partial must define shared-site-cart-panel part');
assert(header.includes('data-layout-part="shared-booking-cart-panel"'), 'Header partial must define shared-booking-cart-panel part');

const sharedHeaderFragment = header
  .split('<div data-layout-part="shared-site-header">')[1]
  ?.split('<div data-layout-part="shared-site-cart-panel">')[0] || '';
assert(!sharedHeaderFragment.includes('id="siteCartDrawer"'), 'shared-site-header should not inline shop cart drawer panel');
assert(!sharedHeaderFragment.includes('id="cartPanel"'), 'shared-site-header should not inline booking cart panel');
assert(!header.includes('id="siteCartDrawer" class="cart-drawer is-open"'), 'shop cart drawer should not start open in partial markup');
assert(!header.includes('id="cartPanel" class="bk-slide-panel is-open"'), 'booking cart panel should not start open in partial markup');

assert(!existsSync(join(rootDir, 'pages/cart.html')), 'Legacy cart page should be removed');
assert(!existsSync(join(rootDir, 'js/pages/cart.js')), 'Legacy cart page script should be removed');

const homePage = readProjectFile('pages/home.html');
assert(!/style=/.test(homePage), 'Home page should not contain inline style attributes');
assert(!/<style/i.test(homePage), 'Home page should not contain inline style blocks');

const mainJs = readProjectFile('js/main.js');
assert(!mainJs.includes('async function initLayout'), 'main.js should not keep the legacy initLayout flow');
assert(!mainJs.includes('DOMContentLoaded", initLayout'), 'main.js should not bind legacy initLayout');
assert(mainJs.includes("appendPartial(\"header\", `${rootPrefix}/components/header.partial`, '[data-layout-part=\"shared-auth\"]')"), 'main.js should append shared-auth after loading header');
assert(mainJs.includes('[data-layout-part="shared-site-cart-panel"]'), 'main.js should append shared-site cart panel for shop context');
assert(mainJs.includes("!document.getElementById('siteCartDrawer')"), 'main.js should guard against duplicate shop cart drawer injection');

const apiMock = readProjectFile('js/api-mock.js');
assert(apiMock.includes('productsCache'), 'api-mock.js should cache products.json');
assert(apiMock.includes('const _getProducts'), 'api-mock.js should expose the shared product loader');

const sharedHeaderController = readProjectFile('js/components/header.js');
assert(sharedHeaderController.includes('data-auth-login-trigger'), 'Shared header must render auth login trigger hook');
assert(sharedHeaderController.includes('root.dataset.headerInitializedContext = context;'), 'Shared header should persist initialized context for re-init guard');
assert(sharedHeaderController.includes('_sharedHeaderStructureReady(root)'), 'Shared header should validate structure before considering initialization complete');
assert(sharedHeaderController.includes('_sharedHeaderContentReady(root)'), 'Shared header should validate rendered actions/navigation content before completing initialization');

const authJs = readProjectFile('js/components/auth.js');
assert(authJs.includes('window.initAuth = function initAuth()'), 'auth.js should expose initAuth for safe re-sync');

const bookingLayoutJs = readProjectFile('booking/js/layout.js');
assert(bookingLayoutJs.includes('[data-layout-part="shared-booking-cart-panel"]'), 'booking layout should append shared booking cart panel for camp context');
assert(bookingLayoutJs.includes("if (document.getElementById('cartPanel')) return true;"), 'booking layout should guard against duplicate booking cart panel injection');

const pilotPages = [
  ['pages/home.html', 'data-header-context="shop"'],
  ['pages/products.html', 'data-header-context="shop"'],
  ['booking/pages/camp-search.html', 'data-header-context="camp"'],
  ['booking/pages/booking-cart.html', 'data-header-context="camp"'],
];
pilotPages.forEach(([pagePath, expectedContext]) => {
  const html = readProjectFile(pagePath);
  assert(html.includes(expectedContext), `${pagePath} should declare ${expectedContext}`);
});

console.log('Smoke checks passed');
