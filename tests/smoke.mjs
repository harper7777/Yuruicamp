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

assert(!existsSync(join(rootDir, 'pages/cart.html')), 'Legacy cart page should be removed');
assert(!existsSync(join(rootDir, 'js/pages/cart.js')), 'Legacy cart page script should be removed');

const homePage = readProjectFile('pages/home.html');
assert(!/style=/.test(homePage), 'Home page should not contain inline style attributes');
assert(!/<style/i.test(homePage), 'Home page should not contain inline style blocks');

const mainJs = readProjectFile('js/main.js');
assert(!mainJs.includes('async function initLayout'), 'main.js should not keep the legacy initLayout flow');
assert(!mainJs.includes('DOMContentLoaded", initLayout'), 'main.js should not bind legacy initLayout');

const apiMock = readProjectFile('js/api-mock.js');
assert(apiMock.includes('productsCache'), 'api-mock.js should cache products.json');
assert(apiMock.includes('const _getProducts'), 'api-mock.js should expose the shared product loader');

console.log('Smoke checks passed');
