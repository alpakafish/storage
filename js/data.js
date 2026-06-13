// Data management — Firebase Firestore backend
const FIRESTORE_DOC = ['storage', 'data'];

const DEFAULT_DATA = {
  mainPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  items: [
    {
      id: 'shelf1',
      label: 'Стеллаж 1, Полка 1',
      type: 'shelf-multi',
      x: 32, y: 38,
      photo: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80',
      boxes: [
        {
          id: 'shelf1-box1',
          label: 'Коробка «Инструменты»',
          x: 18, y: 55,
          contents: ['Отвёртка крестовая', 'Отвёртка плоская', 'Молоток', 'Рулетка 5м', 'Дюбели 6мм']
        },
        {
          id: 'shelf1-box2',
          label: 'Коробка «Провода»',
          x: 45, y: 50,
          contents: ['HDMI кабель 2м', 'USB-C кабель', 'Удлинитель 3м', 'Сетевой кабель']
        },
        {
          id: 'shelf1-box3',
          label: 'Коробка «Запчасти»',
          x: 72, y: 57,
          contents: ['Лампочки E27 (3 шт)', 'Батарейки AA', 'Батарейки AAA', 'Предохранители']
        }
      ]
    },
    {
      id: 'shelf2',
      label: 'Стеллаж 1, Полка 2',
      type: 'item',
      x: 32, y: 55,
      contents: ['Зимние сапоги', 'Кроссовки старые', 'Галоши']
    },
    {
      id: 'shelf3',
      label: 'Стеллаж 2, Полка 1',
      type: 'shelf-multi',
      x: 62, y: 35,
      photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
      boxes: [
        {
          id: 'shelf3-box1',
          label: 'Коробка «Новый год»',
          x: 25, y: 48,
          contents: ['Гирлянда 5м', 'Ёлочные игрушки (30 шт)', 'Мишура', 'Дождик', 'Звезда на ёлку']
        },
        {
          id: 'shelf3-box2',
          label: 'Коробка «Документы»',
          x: 55, y: 52,
          contents: ['Паспорт (копия)', 'Гарантийные талоны', 'Инструкции к технике']
        }
      ]
    },
    {
      id: 'shelf4', label: 'Стеллаж 2, Полка 2', type: 'item', x: 62, y: 52,
      contents: ['Средство для мытья полов', 'Освежитель воздуха (2 шт)', 'Губки кухонные (10 шт)', 'Мусорные пакеты']
    },
    {
      id: 'shelf5', label: 'Стеллаж 1, Полка 3', type: 'item', x: 28, y: 67,
      contents: ['Краска белая 3л', 'Шпатель', 'Валик малярный', 'Малярный скотч']
    },
    {
      id: 'shelf6', label: 'Стеллаж 1, Полка 4', type: 'item', x: 28, y: 78,
      contents: ['Дрель', 'Сверла набор', 'Саморезы 50мм', 'Саморезы 30мм']
    },
    {
      id: 'shelf7', label: 'Стеллаж 2, Полка 3', type: 'item', x: 65, y: 65,
      contents: ['Термос', 'Термокружка', 'Пикниковый набор']
    },
    {
      id: 'shelf8', label: 'Стеллаж 2, Полка 4', type: 'item', x: 65, y: 77,
      contents: ['Велосипедный насос', 'Шлем велосипедный', 'Замок велосипедный']
    },
    {
      id: 'hanger', label: 'Вешалка', type: 'item', x: 85, y: 50,
      contents: ['Куртка зимняя пуховик', 'Пальто демисезонное', 'Дождевик жёлтый', 'Жилет строительный']
    }
  ]
};

// Firebase instances (set after SDK loads)
let _db = null;

function getDb() {
  if (_db) return _db;
  const app = firebase.apps.length
    ? firebase.app()
    : firebase.initializeApp(firebaseConfig);
  _db = firebase.firestore(app);
  return _db;
}

async function loadData() {
  try {
    const db = getDb();
    const snap = await db.collection(FIRESTORE_DOC[0]).doc(FIRESTORE_DOC[1]).get();
    if (snap.exists) return snap.data().payload;
  } catch (e) {
    console.warn('Firestore read failed, using defaults:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

async function saveData(data) {
  const db = getDb();
  await db.collection(FIRESTORE_DOC[0]).doc(FIRESTORE_DOC[1]).set({ payload: data });
}

// Subscribe to realtime updates; calls callback(data) on every change
function subscribeData(callback) {
  const db = getDb();
  return db.collection(FIRESTORE_DOC[0]).doc(FIRESTORE_DOC[1])
    .onSnapshot(snap => {
      if (snap.exists) callback(snap.data().payload);
      else callback(JSON.parse(JSON.stringify(DEFAULT_DATA)));
    }, err => {
      console.warn('Firestore snapshot error:', err);
    });
}

async function resetData() {
  const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
  await saveData(fresh);
  return fresh;
}

window.StorageData = { loadData, saveData, subscribeData, resetData, DEFAULT_DATA };
