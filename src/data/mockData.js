// Генерация 100 тестовых клиентов
const firstNames = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём', 
  'Илья', 'Кирилл', 'Михаил', 'Никита', 'Матвей', 'Роман', 'Егор', 'Арсений',
  'Иван', 'Денис', 'Евгений', 'Даниил', 'Тимофей', 'Владимир', 'Константин',
  'Павел', 'Лев', 'Мария', 'Анна', 'Екатерина', 'Александра', 'Дарья', 'Елена',
  'Ольга', 'Наталья', 'Светлана', 'Татьяна', 'Юлия', 'Ирина', 'Анастасия',
  'Полина', 'Виктория', 'Алина', 'Ксения', 'Валерия', 'София', 'Вероника'
];

const lastNames = [
  'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов',
  'Михайлов', 'Новиков', 'Фёдоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев',
  'Семёнов', 'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев', 'Орлов',
  'Андреев', 'Макаров', 'Зайцев', 'Соловьёв', 'Васильев', 'Зубов', 'Воробьёв',
  'Козлова', 'Новикова', 'Павлова', 'Соколова', 'Кузнецова', 'Волкова',
  'Алексеева', 'Лебедева', 'Семёнова', 'Егорова', 'Попова', 'Михайлова'
];

const companies = [
  'ООО "Технологии"', 'АО "Инновации"', 'ООО "Прогресс"', 'ЗАО "Вектор"',
  'ООО "Горизонт"', 'АО "Спектр"', 'ООО "Феникс"', 'ЗАО "Альфа"',
  'ООО "Бета"', 'АО "Гамма"', 'ООО "Дельта"', 'ЗАО "Омега"',
  'ООО "Сигма"', 'АО "Лямбда"', 'ООО "Каппа"', 'ЗАО "Тета"',
  'ИП Иванов', 'ИП Петров', 'ИП Сидоров', 'ИП Козлов',
  'Группа компаний "Север"', 'Группа компаний "Юг"', 'ГК "Запад"', 'ГК "Восток"',
  'Корпорация "Центр"', 'Холдинг "Регион"', 'Компания "Партнёр"', 'Фирма "Профи"'
];

// Функция для генерации случайной даты в пределах указанного количества дней от сегодня
const getRandomDate = (daysFromToday) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Генерируем случайное количество дней от 0 до daysFromToday
  const randomDays = Math.floor(Math.random() * daysFromToday);
  const randomDate = new Date(today);
  randomDate.setDate(today.getDate() + randomDays);
  
  // Иногда делаем даты в следующем году (для перехода через Новый год)
  if (Math.random() > 0.9) {
    randomDate.setFullYear(currentYear + 1);
  }
  
  return randomDate.toISOString().split('T')[0];
};

// Генерация 100 клиентов
export const mockClients = Array.from({ length: 100 }, (_, index) => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  // Распределяем даты: больше в ближайшие дни, меньше в дальние
  let dateRange;
  const rand = Math.random();
  if (rand < 0.15) {
    dateRange = 1; // 15% - сегодня/завтра
  } else if (rand < 0.40) {
    dateRange = 7; // 25% - в течение недели
  } else if (rand < 0.70) {
    dateRange = 30; // 30% - в течение месяца
  } else {
    dateRange = 90; // 30% - в течение 90 дней
  }
  
  return {
    id: index + 1,
    name: `${lastName} ${firstName}`,
    date: getRandomDate(dateRange),
    phone: `+7 (${String(Math.floor(Math.random() * 900) + 100)}) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 90) + 10)}-${String(Math.floor(Math.random() * 90) + 10).padStart(2, '0')}`,
    email: `client${index + 1}@${['gmail.com', 'mail.ru', 'yandex.ru', 'company.ru', 'business.com'][Math.floor(Math.random() * 5)]}`,
    company: companies[Math.floor(Math.random() * companies.length)]
  };
});

// Экспорт для отладки
console.log(`Сгенерировано ${mockClients.length} клиентов`);