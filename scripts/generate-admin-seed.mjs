/**
 * generate-admin-seed.mjs
 * 產生 admin 後台 JSON 假資料
 * Generates admin dashboard seed JSON files
 *
 * 目標 / Targets:
 *   customers 50 | products 30 | orders 200 | bookings 50 | reviews 50 | movement 100
 *   訂單 / 異動日期：近四個月（2026-03-01 ~ 2026-06-29）
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'admin', 'data');

// ── 固定參考日期（與 user_info 一致）──
const TODAY = new Date('2026-06-29T23:59:59');
const ORDER_START = new Date('2026-03-01T00:00:00'); // 近四個月起點

// ── 可重現的 pseudo-random ──
let seed = 20260629;
function rand() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pad(n, len) {
  return String(n).padStart(len, '0');
}

function formatDateTime(d) {
  const y = d.getFullYear();
  const mo = pad(d.getMonth() + 1, 2);
  const da = pad(d.getDate(), 2);
  const h = pad(d.getHours(), 2);
  const mi = pad(d.getMinutes(), 2);
  const s = pad(d.getSeconds(), 2);
  return `${y}-${mo}-${da} ${h}:${mi}:${s}`;
}

function formatDateShort(d) {
  const y = d.getFullYear();
  const mo = pad(d.getMonth() + 1, 2);
  const da = pad(d.getDate(), 2);
  return `${y}-${mo}-${da}`;
}

function formatDateTimeShort(d) {
  const y = d.getFullYear();
  const mo = pad(d.getMonth() + 1, 2);
  const da = pad(d.getDate(), 2);
  const h = pad(d.getHours(), 2);
  const mi = pad(d.getMinutes(), 2);
  return `${y}-${mo}-${da} ${h}:${mi}`;
}

/** 在 [start, end] 之間隨機日期時間 */
function randomDateBetween(start, end) {
  const t = start.getTime() + rand() * (end.getTime() - start.getTime());
  const d = new Date(t);
  d.setHours(randInt(8, 21), randInt(0, 59), randInt(0, 59));
  return d;
}

function addDays(d, days) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function addMinutes(d, mins) {
  return new Date(d.getTime() + mins * 60000);
}

// ── 既有客戶 U001-U010（保留姓名）──
const BASE_CUSTOMERS = [
  { name: '王小明', phone: '0912-345-678', email: 'wang@example.com', birthday: '1992-03-18', registeredAt: '2023-08-15' },
  { name: '林美惠', phone: '0923-456-789', email: 'lin@example.com', birthday: '1998-07-22', registeredAt: '2025-01-20' },
  { name: '張志偉', phone: '0934-567-890', email: 'chang@example.com', birthday: '1988-11-05', registeredAt: '2022-11-03' },
  { name: '黃淑芬', phone: '0945-678-901', email: 'huang@example.com', birthday: '1995-01-30', registeredAt: '2024-06-10' },
  { name: '李建明', phone: '0956-789-012', email: 'lee@example.com', birthday: '1990-09-12', registeredAt: '2023-03-28' },
  { name: '陳大華', phone: '0967-890-123', email: 'chen@example.com', birthday: '1985-04-08', registeredAt: '2025-02-14' },
  { name: '蔡佳玲', phone: '0978-901-234', email: 'tsai@example.com', birthday: '2000-12-25', registeredAt: '2025-05-01' },
  { name: '吳建宏', phone: '0989-012-345', email: 'wu@example.com', birthday: '1987-06-17', registeredAt: '2021-09-22' },
  { name: '劉雅婷', phone: '0990-123-456', email: 'liu@example.com', birthday: '1999-02-14', registeredAt: '2025-06-18' },
  { name: '許志明', phone: '0901-234-567', email: 'hsu@example.com', birthday: '1978-10-03', registeredAt: '2020-12-05' },
];

const EXTRA_NAMES = [
  ['鄭', '文豪'], ['周', '佩君'], ['楊', '承翰'], ['謝', '宜蓁'], ['洪', '偉傑'],
  ['郭', '欣怡'], ['邱', '冠宇'], ['曾', '雅雯'], ['廖', '俊傑'], ['賴', '思妤'],
  ['徐', '柏翰'], ['蘇', '品妍'], ['葉', '家豪'], ['莊', '淑惠'], ['江', '志豪'],
  ['何', '佳穎'], ['羅', '俊宏'], ['高', '詩涵'], ['潘', '宇軒'], ['簡', '惠如'],
  ['馬', '冠廷'], ['鍾', '怡君'], ['游', '承恩'], ['石', '雅琪'], ['方', '建志'],
  ['彭', '心怡'], ['韓', '宗翰'], ['唐', '美玲'], ['馮', '志偉'], ['董', '佳蓉'],
  ['程', '俊賢'], ['傅', '淑芬'], ['范', '冠霖'], ['戴', '雅婷'], ['段', '家銘'],
  ['曹', '佩珊'], ['袁', '宇翔'], ['鄧', '欣妤'], ['許', '柏均'], ['丁', '惠珍'],
];

const AVATARS = [
  '../assets/images/avatar-01.jpg',
  '../assets/images/avatar-02.jpg',
  '../assets/images/avatar-03.jpg',
];

const ADDRESSES = [
  '台北市信義區松仁路100號', '新北市板橋區文化路二段100號', '桃園市中壢區中山路300號',
  '新竹市東區光復路一段100號', '台中市西屯區台灣大道三段500號', '台南市東區長榮路二段200號',
  '高雄市左營區高鐵路100號', '基隆市仁愛區愛一路50號', '宜蘭市中山路二段80號',
  '花蓮市國聯一路20號', '台東市中山路120號', '彰化市中山路一段66號',
  '嘉義市西區垂楊路200號', '屏東市民生路88號', '苗栗市為公路150號',
];

const CAMPGROUNDS = [
  { id: 'C001', name: '雲海仙境露營區', region: '北部', zones: [
    { id: 'Z001', type: '草皮區', price: 1000 },
    { id: 'Z002', type: '雨棚區', price: 1800 },
  ]},
  { id: 'C002', name: '溪谷秘境野營地', region: '中部', zones: [
    { id: 'Z003', type: '碎石區', price: 1200 },
    { id: 'Z004', type: '棧板區', price: 1300 },
  ]},
  { id: 'C003', name: '太平山森林豪華露營', region: '北部', zones: [
    { id: 'Z005', type: '免搭帳／豪華露營 (Glamping)', price: 5000 },
  ]},
  { id: 'C004', name: '南台灣星空草原營地', region: '南部', zones: [
    { id: 'Z006', type: '草皮區', price: 1100 },
  ]},
  { id: 'C005', name: '花蓮海岸風露營區', region: '東部', zones: [
    { id: 'Z007', type: '草皮區', price: 1400 },
  ]},
  { id: 'C006', name: '阿里山雲霧繚繞營地', region: '南部', zones: [
    { id: 'Z009', type: '棧板區', price: 1700 },
  ]},
  { id: 'C007', name: '宜蘭礁溪湯泉露營', region: '北部', zones: [
    { id: 'Z010', type: '草皮區', price: 2200 },
  ]},
  { id: 'C008', name: '台中武陵溪流野營', region: '中部', zones: [
    { id: 'Z012', type: '碎石區', price: 950 },
  ]},
];

const CAMP_RENTALS = [
  { id: 'E001', name: '極限防水黑膠帳篷', unitPrice: 900 },
  { id: 'E002', name: '高山保暖睡袋 (-10°C)', unitPrice: 300 },
  { id: 'E003', name: '兒童戲水漂浮套件', unitPrice: 300 },
  { id: 'E004', name: '攜帶式燒烤爐組', unitPrice: 500 },
  { id: 'E006', name: '海上獨木舟（雙人）', unitPrice: 1600 },
  { id: 'E007', name: '防潮帳篷地墊組', unitPrice: 400 },
  { id: 'E008', name: '溯溪裝備套組', unitPrice: 700 },
];

const REVIEW_COMMENTS = {
  5: ['品質超棒，非常滿意！', '出貨快速，包裝完整，大推！', '露營必備，物超所值！', '使用體驗極佳，會再回購。'],
  4: ['整體不錯，小瑕疵可接受。', '功能符合期待，性價比高。', '品質良好，物流稍慢但可理解。'],
  3: ['尚可，但與期待有些落差。', '品質普通，價格略高。', '使用上沒大問題，包裝可再加強。'],
  2: ['顏色與圖片不符，有點失望。', '材質比想像中薄，不太耐用。'],
  1: ['收到瑕疵品，申請退換貨中。', '完全不符合描述，不推薦。'],
};

const REPLY_TEXTS = [
  '感謝您的五星好評！祝露營愉快，歡迎再次選購。',
  '謝謝您的愛用與支持，我們會持續提升品質！',
  '非常抱歉造成不便，我們已記錄並會改善物流包裝。',
  '感謝寶貴意見，客服將盡快與您聯繫處理。',
];

const CAMP_NAMES = ['租借主倉', '湖畔星空營地', '松林野營基地', '溪谷森林營地', '雲海高原營地', '海岸微風營地'];

// ── 商品定義 P001-P030 ──
function buildProducts() {
  const defs = [
    { id: 'P001', rentalId: 'R001', rentalEnabled: true, name: 'Coleman 六人帳篷', category: '帳篷', spec: '深橄欖綠', price: 3200, status: 'active' },
    { id: 'P002', rentalId: 'R002', rentalEnabled: true, name: 'MSR 超輕量帳篷', category: '帳篷', spec: '沙漠卡其', price: 9800, status: 'active' },
    { id: 'P003', rentalId: 'R018', rentalEnabled: true, name: '充氣式睡墊 L號', category: '睡袋', spec: '藍灰色', price: 1200, status: 'active' },
    { id: 'P004', rentalId: 'R005', rentalEnabled: true, name: '羽絨睡袋 -10°C', category: '睡袋', spec: '碳黑', price: 2800, status: 'active' },
    { id: 'P005', rentalId: 'R006', rentalEnabled: true, name: 'Coleman 氣化爐', category: '炊具', spec: '標準版', price: 5000, status: 'active' },
    { id: 'P006', rentalId: 'R007', rentalEnabled: true, name: 'Snow Peak 鈦合金杯組', category: '炊具', spec: '鈦金屬原色', price: 1800, status: 'active' },
    { id: 'P007', rentalId: 'R011', rentalEnabled: true, name: 'LED 露營燈', category: '燈具', spec: '暖白光', price: 800, status: 'active' },
    { id: 'P008', rentalId: 'R013', rentalEnabled: true, name: '防水登山背包 45L', category: '背包', spec: '森林綠', price: 1600, status: 'active' },
    { id: 'P009', rentalId: 'R008', rentalEnabled: true, name: '折疊桌椅組', category: '其他', spec: '鋁合金輕量版', price: 2800, status: 'active' },
    { id: 'P010', rentalId: null, rentalEnabled: false, name: '保溫壺 1L', category: '其他', spec: '消光黑', price: 880, status: 'disabled' },
    { id: 'P011', rentalId: 'R003', rentalEnabled: true, name: 'Snow Peak 客廳帳', category: '帳篷', spec: '象牙白', price: 8500, status: 'active' },
    { id: 'P012', rentalId: 'R004', rentalEnabled: true, name: '四季保暖睡袋', category: '睡袋', spec: '深藍', price: 2200, status: 'active' },
    { id: 'P013', rentalId: 'R009', rentalEnabled: true, name: '折疊蛋捲桌', category: '其他', spec: '胡桃木紋', price: 1500, status: 'active' },
    { id: 'P014', rentalId: 'R010', rentalEnabled: true, name: '高背月亮椅', category: '其他', spec: '軍綠', price: 980, status: 'active' },
    { id: 'P015', rentalId: 'R012', rentalEnabled: true, name: '充電式頭燈', category: '燈具', spec: 'USB-C', price: 650, status: 'active' },
    { id: 'P016', rentalId: 'R014', rentalEnabled: true, name: '65L 重裝背包', category: '背包', spec: '岩石灰', price: 4200, status: 'active' },
    { id: 'P017', rentalId: 'R015', rentalEnabled: true, name: '露營拖車', category: '其他', spec: '折疊式', price: 3600, status: 'active' },
    { id: 'P018', rentalId: 'R016', rentalEnabled: true, name: '大型天幕', category: '帳篷', spec: '4x4m', price: 2400, status: 'active' },
    { id: 'P019', rentalId: 'R017', rentalEnabled: true, name: '營柱與營繩組', category: '其他', spec: '標準套組', price: 450, status: 'active' },
    { id: 'P020', rentalId: 'R019', rentalEnabled: true, name: '行動電源站', category: '其他', spec: '500Wh', price: 12800, status: 'active' },
    { id: 'P021', rentalId: 'R020', rentalEnabled: true, name: '保冷冰桶 45L', category: '其他', spec: '深藍', price: 1900, status: 'active' },
    { id: 'P022', rentalId: 'R021', rentalEnabled: true, name: '雙層防風外套', category: '其他', spec: 'L號', price: 3200, status: 'active' },
    { id: 'P023', rentalId: 'R022', rentalEnabled: true, name: '快煮鍋 1.5L', category: '炊具', spec: '不鏽鋼', price: 1100, status: 'active' },
    { id: 'P024', rentalId: 'R023', rentalEnabled: true, name: '碳纖維登山杖', category: '其他', spec: '一對', price: 1400, status: 'active' },
    { id: 'P025', rentalId: 'R024', rentalEnabled: true, name: '防水戶外手錶', category: '其他', spec: 'GPS版', price: 5600, status: 'active' },
    { id: 'P026', rentalId: 'R025', rentalEnabled: true, name: '輕量吊床', category: '其他', spec: '雙人', price: 890, status: 'active' },
    { id: 'P027', rentalId: 'R026', rentalEnabled: true, name: '戶外淋浴袋', category: '其他', spec: '20L', price: 680, status: 'active' },
    { id: 'P028', rentalId: 'R027', rentalEnabled: true, name: '折疊式焚火台', category: '炊具', spec: '不鏽鋼', price: 2100, status: 'active' },
    { id: 'P029', rentalId: 'R028', rentalEnabled: true, name: '防蚊帳篷內帳', category: '帳篷', spec: '通用型', price: 750, status: 'active' },
    { id: 'P030', rentalId: null, rentalEnabled: false, name: '露營貼紙組', category: '其他', spec: '50入', price: 199, status: 'disabled' },
  ];

  return defs.map(function (d, i) {
    const main = randInt(1, 3);
    const b1 = randInt(0, 8);
    const b2 = randInt(0, 8);
    const b3 = randInt(0, 8);
    const branch = { main, 'branch-001': b1, 'branch-002': b2, 'branch-003': b3 };
    if (d.status === 'disabled') {
      branch.main = 1;
      branch['branch-001'] = 0;
      branch['branch-002'] = 0;
      branch['branch-003'] = 0;
    }
    return {
      ...d,
      thumbnail: '../assets/images/tent-01.jpg',
      'total-stock': main + b1 + b2 + b3,
      branch,
    };
  });
}

function buildReantal(products) {
  const categoryMap = {
    帳篷: '帳篷', 睡袋: '睡袋', 炊具: '炊具', 燈具: '燈具', 背包: '背包', 其他: '配件',
  };
  return products
    .filter(function (p) { return p.rentalEnabled && p.rentalId; })
    .map(function (p) {
      const camps = CAMP_NAMES.map(function (name, idx) {
        return { name, quantity: idx === 0 ? 1 : randInt(1, 6) };
      });
      return {
        id: p.rentalId,
        image: p.thumbnail,
        name: p.name,
        category: categoryMap[p.category] || '配件',
        camp: camps,
      };
    });
}

function buildMinStock(products, rentals) {
  const store = {};
  products.forEach(function (p) {
    store[p.id] = { main: 1, 'branch-001': 1, 'branch-002': 1, 'branch-003': 1 };
  });
  const rental = {};
  rentals.forEach(function (r) {
    rental[r.id] = {
      'rental-main': 1,
      'camp-001': 1, 'camp-002': 1, 'camp-003': 1, 'camp-004': 1, 'camp-005': 1,
    };
  });
  return { store, rental };
}

function buildCustomers() {
  const customers = BASE_CUSTOMERS.map(function (c, i) {
    return {
      id: 'U' + pad(i + 1, 3),
      avatar: AVATARS[i % 3],
      name: c.name,
      phone: c.phone,
      email: c.email,
      birthday: c.birthday,
      registeredAt: c.registeredAt,
      totalSpent: 0,
      tier: '一般',
      points: 0,
      coupons: randInt(0, 3),
      tags: [],
      orders: [],
    };
  });

  EXTRA_NAMES.forEach(function ([surname, given], i) {
    const idx = i + 11;
    const name = surname + given;
    const phoneNum = pad(900 + ((idx * 37) % 100), 3) + '-' + pad((idx * 13) % 1000, 3) + '-' + pad((idx * 71) % 1000, 3);
    const year = 1975 + (idx % 25);
    const month = pad((idx % 12) + 1, 2);
    const day = pad((idx % 28) + 1, 2);
    const regYear = 2019 + (idx % 7);
    customers.push({
      id: 'U' + pad(idx, 3),
      avatar: AVATARS[idx % 3],
      name,
      phone: '0' + phoneNum.replace(/^0/, ''),
      email: 'user' + pad(idx, 3) + '@example.com',
      birthday: `${year}-${month}-${day}`,
      registeredAt: `${regYear}-${month}-${day}`,
      totalSpent: 0,
      tier: '一般',
      points: 0,
      coupons: randInt(0, 2),
      tags: [],
      orders: [],
    });
  });

  return customers;
}

function buildOrderHistory(createdAt, paymentStatus, orderStatus) {
  const t0 = createdAt;
  const history = [
    { time: formatDateTime(t0), action: '訂單產生' },
  ];

  if (paymentStatus === 'cod') {
    history.push({ time: formatDateTime(t0), action: '貨到付款' });
    history.push({ time: formatDateTime(t0), action: '待出貨' });
    if (orderStatus === 'shipped') {
      history.push({ time: formatDateTime(addDays(t0, randInt(1, 3))), action: '已出貨' });
    }
    return history;
  }

  if (paymentStatus === 'unpaid') {
    history.push({ time: formatDateTime(t0), action: '待付款' });
    return history;
  }

  // paid
  history.push({ time: formatDateTime(t0), action: '待付款' });
  const paidAt = addMinutes(t0, randInt(2, 30));
  history.push({ time: formatDateTime(paidAt), action: '已付款' });
  history.push({ time: formatDateTime(paidAt), action: '待出貨' });

  if (orderStatus === 'unshipped') return history;

  const shipAt = addDays(paidAt, randInt(1, 4));
  history.push({ time: formatDateTime(shipAt), action: '已出貨' });

  if (orderStatus === 'shipped') return history;

  if (orderStatus === 'returned') {
    history.push({ time: formatDateTime(addDays(shipAt, randInt(2, 7))), action: '已退貨' });
    return history;
  }

  if (orderStatus === 'completed') {
    history.push({ time: formatDateTime(addDays(shipAt, randInt(2, 5))), action: '已完成' });
  }
  return history;
}

function buildOrders(customers, products) {
  const activeProducts = products.filter(function (p) { return p.status === 'active'; });
  const orders = [];
  const statusPool = [];
  for (let i = 0; i < 30; i++) statusPool.push('unshipped');
  for (let i = 0; i < 80; i++) statusPool.push('shipped');
  for (let i = 0; i < 60; i++) statusPool.push('completed');
  for (let i = 0; i < 10; i++) statusPool.push('returned');
  for (let i = 0; i < 20; i++) statusPool.push('unshipped'); // unpaid orders

  for (let n = 1; n <= 200; n++) {
    const customer = customers[(n - 1) % customers.length];
    const createdAt = randomDateBetween(ORDER_START, TODAY);
    const orderStatus = pick(statusPool);

    let paymentStatus;
    if (orderStatus === 'unshipped' && rand() < 0.35) {
      paymentStatus = 'unpaid';
    } else if (rand() < 0.1) {
      paymentStatus = 'cod';
    } else {
      paymentStatus = 'paid';
    }

    const itemCount = randInt(1, 3);
    const items = [];
    const usedIdx = new Set();
    for (let j = 0; j < itemCount; j++) {
      let pi;
      do { pi = randInt(0, activeProducts.length - 1); } while (usedIdx.has(pi));
      usedIdx.add(pi);
      const prod = activeProducts[pi];
      items.push({ name: prod.name, qty: randInt(1, 2), price: prod.price });
    }
    const total = items.reduce(function (s, it) { return s + it.qty * it.price; }, 0);

    const order = {
      id: '#' + pad(n, 4),
      createdAt: formatDateTime(createdAt),
      buyerName: customer.name,
      total,
      paymentStatus,
      orderStatus: paymentStatus === 'unpaid' ? 'unshipped' : orderStatus,
      items,
      address: pick(ADDRESSES),
      history: buildOrderHistory(createdAt, paymentStatus, paymentStatus === 'unpaid' ? 'unshipped' : orderStatus),
    };
    if (rand() < 0.25) {
      order.customerNote = pick(['請用環保紙箱包裝，謝謝！', '商品易碎，煩請小心包裝。', '', '門口有電梯，直接放門口即可。']);
      if (order.customerNote === '') delete order.customerNote;
    }
    orders.push(order);
  }

  orders.sort(function (a, b) { return a.createdAt.localeCompare(b.createdAt); });
  return orders;
}

function syncCustomersFromOrders(customers, orders) {
  const byName = {};
  customers.forEach(function (c) {
    c.orders = [];
    c.totalSpent = 0;
    c.tags = [];
    byName[c.name] = c;
  });

  orders.forEach(function (o) {
    const c = byName[o.buyerName];
    if (!c) return;
    c.orders.push(o.id);
    if (o.paymentStatus === 'paid' || o.paymentStatus === 'cod') {
      c.totalSpent += o.total;
    }
  });

  customers.forEach(function (c) {
    c.points = Math.floor(c.totalSpent / 10);
    if (c.totalSpent >= 30000) c.tier = 'SVIP';
    else if (c.totalSpent >= 10000) c.tier = 'VIP';
    else c.tier = '一般';

    const regDate = new Date(c.registeredAt);
    const oneYearAgo = addDays(TODAY, -365);
    if (regDate >= oneYearAgo) c.tags.push('新會員');
    if (c.totalSpent >= 15000) c.tags.push('高消費');

    const customerOrders = orders.filter(function (o) { return o.buyerName === c.name; });
    const hasReturn = customerOrders.some(function (o) { return o.orderStatus === 'returned'; });
    if (hasReturn) c.tags.push('高退貨率');

    c.coupons = Math.min(10, Math.floor(c.totalSpent / 5000) + randInt(0, 1));
  });
}

function buildBookingHistory(submittedAt, status, paymentStatus) {
  const history = [
    { time: formatDateTime(submittedAt), action: '預約單已送出' },
    { time: formatDateTime(submittedAt), action: '已付款' },
  ];
  if (status === 'pending') return history;
  if (status === 'confirmed') {
    history.push({ time: formatDateTime(addMinutes(submittedAt, randInt(30, 480))), action: '已確認預約' });
    return history;
  }
  if (status === 'completed') {
    history.push({ time: formatDateTime(addMinutes(submittedAt, randInt(30, 480))), action: '已確認預約' });
    history.push({ time: formatDateTime(addDays(submittedAt, randInt(3, 14))), action: '已完成' });
    return history;
  }
  if (status === 'cancelled') {
    history.push({
      time: formatDateTime(addDays(submittedAt, randInt(1, 5))),
      action: '已取消（原因：' + pick(['顧客臨時有事', '遇颱風警報', '行程變更']) + '）',
    });
    if (paymentStatus === 'refunded') {
      history.push({ time: formatDateTime(addDays(submittedAt, randInt(1, 5))), action: '已退款' });
    }
    return history;
  }
  return history;
}

function buildBookings(customers) {
  const bookings = [];
  const statusPool = [];
  for (let i = 0; i < 10; i++) statusPool.push('pending');
  for (let i = 0; i < 15; i++) statusPool.push('confirmed');
  for (let i = 0; i < 18; i++) statusPool.push('completed');
  for (let i = 0; i < 7; i++) statusPool.push('cancelled');

  for (let n = 1; n <= 50; n++) {
    const customer = customers[(n - 1) % customers.length];
    const submittedAt = randomDateBetween(ORDER_START, TODAY);
    const status = pick(statusPool);
    const paymentStatus = status === 'cancelled' ? 'refunded' : 'paid';
    const camp = pick(CAMPGROUNDS);
    const zone = pick(camp.zones);
    const days = pick([1, 2, 2, 3]);
    const checkIn = addDays(submittedAt, randInt(5, 30));
    const checkOut = addDays(checkIn, days);

    const zoneQty = randInt(1, 2);
    const zoneSubtotal = zone.price * zoneQty * days;

    const selectedRentals = [];
    if (rand() < 0.55) {
      const count = randInt(1, 2);
      const used = new Set();
      for (let r = 0; r < count; r++) {
        let eq;
        do { eq = pick(CAMP_RENTALS); } while (used.has(eq.id));
        used.add(eq.id);
        const qty = randInt(1, 2);
        selectedRentals.push({
          equipment_id: eq.id,
          name: eq.name,
          quantity: qty,
          subtotal: eq.unitPrice * qty,
        });
      }
    }
    const rentalTotal = selectedRentals.reduce(function (s, r) { return s + r.subtotal; }, 0);
    const discount = rand() < 0.3 ? randInt(50, 200) : 0;

    bookings.push({
      id: 'BK-' + pad(n, 4),
      customer_id: customer.id,
      submitted_at: formatDateTime(submittedAt),
      payment_status: paymentStatus,
      status,
      equipment_returned: status === 'completed' && rand() < 0.7,
      booking_info: {
        campground_id: camp.id,
        campground_name: camp.name,
        region: camp.region,
        check_in: formatDateShort(checkIn),
        check_out: formatDateShort(checkOut),
        total_days: days,
        weekday_count: randInt(0, days),
        holiday_count: days - randInt(0, days),
        guest_count: randInt(2, 6),
      },
      selected_zones: [{
        zone_id: zone.id,
        zone_type: zone.type,
        quantity: zoneQty,
        subtotal: zoneSubtotal,
      }],
      selected_rentals: selectedRentals,
      summary: {
        zone_total: zoneSubtotal,
        rental_total: rentalTotal,
        applied_discount: discount,
        final_amount: zoneSubtotal + rentalTotal - discount,
      },
      history: buildBookingHistory(submittedAt, status, paymentStatus),
    });
  }

  bookings.sort(function (a, b) { return a.submitted_at.localeCompare(b.submitted_at); });
  return bookings;
}

function buildReviews(customers, products, orders) {
  const activeProducts = products.filter(function (p) { return p.status === 'active'; });
  const reviews = [];
  const shippedOrders = orders.filter(function (o) {
    return o.orderStatus === 'shipped' || o.orderStatus === 'completed';
  });

  for (let n = 1; n <= 50; n++) {
    const order = shippedOrders[(n - 1) % shippedOrders.length];
    const customer = customers.find(function (c) { return c.name === order.buyerName; }) || customers[n % customers.length];
    const item = order.items[randInt(0, order.items.length - 1)];
    const rating = pick([5, 5, 4, 4, 4, 3, 3, 2, 1]);
    const replied = rand() < 0.4;
    const createdAt = addDays(new Date(order.createdAt.replace(' ', 'T')), randInt(3, 20));
    if (createdAt > TODAY) createdAt.setTime(TODAY.getTime() - randInt(1, 5) * 86400000);

    const review = {
      id: 'R' + pad(n, 3),
      buyerName: customer.name,
      buyerAvatar: customer.avatar,
      rating,
      comment: pick(REVIEW_COMMENTS[rating]),
      photos: [],
      productName: item.name,
      createdAt: formatDateTimeShort(createdAt),
      replied,
      replyText: '',
      replyAt: null,
      repliedBy: null,
      repliedByName: null,
      replyUpdatedAt: null,
    };

    if (replied) {
      const replyAt = addMinutes(createdAt, randInt(30, 480));
      review.replyText = pick(REPLY_TEXTS);
      review.replyAt = formatDateTimeShort(replyAt);
      review.repliedBy = '01';
      review.repliedByName = '王老闆';
    }
    reviews.push(review);
  }

  reviews.sort(function (a, b) { return a.createdAt.localeCompare(b.createdAt); });
  return reviews;
}

// ── 庫存異動（對齊 products.js / movement.js 的地點與 type 欄位）──
const MOVEMENT_STORE_LOCATIONS = ['商店主倉', '分店 A', '分店 B', '分店 C'];
const MOVEMENT_RENTAL_LOCATIONS = [
  '租借主倉', '湖畔星空營地', '松林野營基地',
  '溪谷森林營地', '雲海高原營地', '海岸微風營地',
];
const MOVEMENT_RENTAL_CAMPS = MOVEMENT_RENTAL_LOCATIONS.filter(function (l) {
  return l !== '租借主倉';
});
const MOVEMENT_EMPLOYEE_IDS = ['01', '02', '03'];
const MOVEMENT_TYPES = ['進貨', '移轉', '調撥', '營地互轉', '損耗'];

function pickTwoDifferent(arr) {
  const a = pick(arr);
  let b = pick(arr);
  let guard = 0;
  while (b === a && arr.length > 1 && guard < 20) {
    b = pick(arr);
    guard += 1;
  }
  return [a, b];
}

function buildMovementItem(type, productName) {
  const qty = type === '損耗' ? randInt(1, 3) : randInt(1, 12);

  if (type === '進貨') {
    return {
      productName,
      quantity: qty,
      fromStore: '進貨',
      toStore: pick(['商店主倉', '租借主倉']),
      type: '進貨',
    };
  }
  if (type === '移轉') {
    const pair = pickTwoDifferent(MOVEMENT_STORE_LOCATIONS);
    return {
      productName,
      quantity: qty,
      fromStore: pair[0],
      toStore: pair[1],
      type: '移轉',
    };
  }
  if (type === '調撥') {
    return {
      productName,
      quantity: qty,
      fromStore: pick(MOVEMENT_STORE_LOCATIONS),
      toStore: pick(MOVEMENT_RENTAL_CAMPS),
      type: '調撥',
    };
  }
  if (type === '營地互轉') {
    const pair = pickTwoDifferent(MOVEMENT_RENTAL_CAMPS);
    return {
      productName,
      quantity: qty,
      fromStore: pair[0],
      toStore: pair[1],
      type: '營地互轉',
    };
  }
  // 損耗
  return {
    productName,
    quantity: qty,
    fromStore: pick(MOVEMENT_STORE_LOCATIONS.concat(MOVEMENT_RENTAL_LOCATIONS)),
    toStore: '損耗',
    type: '損耗',
  };
}

/**
 * 產生 100 筆庫存異動主檔（MV001~MV100）
 * Generate 100 movement records aligned with admin/js/movement.js filters
 */
function buildMovements(products) {
  const productNames = products.map(function (p) { return p.name; });
  const typePool = [];
  MOVEMENT_TYPES.forEach(function (type) {
    const count = type === '進貨' ? 18
      : type === '移轉' ? 22
      : type === '調撥' ? 25
      : type === '營地互轉' ? 15
      : 20; // 損耗
    for (let i = 0; i < count; i++) typePool.push(type);
  });

  const records = [];
  for (let n = 1; n <= 100; n++) {
    const date = randomDateBetween(ORDER_START, TODAY);
    const primaryType = typePool[n - 1] || pick(MOVEMENT_TYPES);
    const itemCount = rand() < 0.72 ? 1 : randInt(2, 3);
    const items = [];

    for (let j = 0; j < itemCount; j++) {
      const type = j === 0 ? primaryType : pick(MOVEMENT_TYPES);
      items.push(buildMovementItem(type, pick(productNames)));
    }

    records.push({
      id: 'MV' + pad(n, 3),
      date: formatDateShort(date),
      items,
      employeeId: MOVEMENT_EMPLOYEE_IDS[(n - 1) % MOVEMENT_EMPLOYEE_IDS.length],
    });
  }

  records.sort(function (a, b) {
    return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
  });
  return records;
}

function writeJson(filename, data) {
  writeFileSync(join(DATA_DIR, filename), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ── 主流程 ──
const products = buildProducts();
const rentals = buildReantal(products);
const minStock = buildMinStock(products, rentals);
const customers = buildCustomers();
const orders = buildOrders(customers, products);
syncCustomersFromOrders(customers, orders);
const bookings = buildBookings(customers);
const reviews = buildReviews(customers, products, orders);
const movements = buildMovements(products);

writeJson('products.json', products);
writeJson('reantal.json', rentals);
writeJson('min_stock.json', minStock);
writeJson('customers.json', customers);
writeJson('orders.json', orders);
writeJson('bookings.json', bookings);
writeJson('reviews.json', reviews);
writeJson('movement.json', movements);

console.log('✅ 假資料已寫入 admin/data/');
console.log('   customers:', customers.length);
console.log('   products:', products.length);
console.log('   orders:', orders.length);
console.log('   bookings:', bookings.length);
console.log('   reviews:', reviews.length);
console.log('   movement:', movements.length);
console.log('   reantal:', rentals.length);

const orderDates = orders.map(function (o) { return o.createdAt.slice(0, 10); });
console.log('   訂單日期範圍:', orderDates[0], '~', orderDates[orderDates.length - 1]);

const movementDates = movements.map(function (m) { return m.date; });
console.log('   異動日期範圍:', movementDates[0], '~', movementDates[movementDates.length - 1]);
