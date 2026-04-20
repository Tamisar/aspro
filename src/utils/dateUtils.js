// src/utils/dateUtils.js

/**
 * Надёжный парсинг даты из разных форматов
 */
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  
  // Если уже объект Date
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  // Если строка в формате '1990-04-20' или '1990-04-20T00:00:00Z'
  if (/^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // Если формат '20.04.1990' (DD.MM.YYYY)
  if (/^\d{2}\.\d{2}\.\d{4}/.test(dateValue)) {
    const [day, month, year] = dateValue.split('.');
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // Если формат '20/04/1990' (DD/MM/YYYY)
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateValue)) {
    const [day, month, year] = dateValue.split('/');
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // Попробовать стандартный парсинг
  const d = new Date(dateValue);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Форматирование даты: "20 апреля"
 */
export const formatDate = (dateString) => {
  const date = parseDate(dateString);
  if (!date) return '';
  
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long' 
  });
};

/**
 * Расчёт дней до дня рождения (надёжная версия)
 */
export const getDaysUntil = (dateString) => {
  const birthDate = parseDate(dateString);
  if (!birthDate) {
    console.warn('⚠️ Invalid birth_date:', dateString);
    return 999;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentYear = today.getFullYear();
  
  // Создаём следующий день рождения в текущем году
  let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
  nextBirthday.setHours(0, 0, 0, 0);
  
  // Если уже прошло в этом году — берём следующий год
  if (nextBirthday < today) {
    nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
  }
  
  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Определение категории и типа группы
 */
export const getGroupLabel = (dateString) => {
  const daysUntil = getDaysUntil(dateString);
  
  if (daysUntil === 0) return { text: 'Сегодня', type: 'today' };
  if (daysUntil === 1) return { text: 'Завтра', type: 'tomorrow' };
  if (daysUntil <= 7) return { text: 'Ближайшие 7 дней', type: 'week' };
  
  return { text: 'Позже', type: 'later' };
};

/**
 * Фильтрация по периоду (в днях)
 */
export const filterByPeriod = (clients, days) => {
  return clients.filter(client => {
    const daysUntil = getDaysUntil(client.birth_date || client.date);
    return daysUntil <= days;
  });
};

/**
 * Поиск по полям пользователя
 */
export const searchClients = (clients, query) => {
  if (!query) return clients;
  
  const lowerQuery = query.toLowerCase();
  return clients.filter(client => 
    client.name?.toLowerCase().includes(lowerQuery) ||
    client.phone?.toLowerCase().includes(lowerQuery) ||
    client.email?.toLowerCase().includes(lowerQuery) ||
    client.company?.toLowerCase().includes(lowerQuery)
  );
};