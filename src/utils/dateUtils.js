export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('ru-RU', { month: 'long' });
  return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
};

export const getDaysUntil = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const birthDate = new Date(dateString);
  birthDate.setFullYear(today.getFullYear());
  birthDate.setHours(0, 0, 0, 0);
  
  if (birthDate < today) {
    birthDate.setFullYear(birthDate.getFullYear() + 1);
  }
  
  const diffTime = birthDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const getGroupLabel = (dateString) => {
  const daysUntil = getDaysUntil(dateString);
  
  if (daysUntil === 0) return { text: 'Сегодня', type: 'today' };
  if (daysUntil === 1) return { text: 'Завтра', type: 'tomorrow' };
  if (daysUntil <= 7) return { text: 'Ближайшие 7 дней', type: 'week' };
  
  return { text: 'Позже', type: 'later' };
};

export const filterByPeriod = (clients, days) => {
  return clients.filter(client => {
    const daysUntil = getDaysUntil(client.date);
    return daysUntil <= days;
  });
};

export const searchClients = (clients, query) => {
  if (!query) return clients;
  
  const lowerQuery = query.toLowerCase();
  return clients.filter(client => 
    client.name.toLowerCase().includes(lowerQuery) ||
    client.company.toLowerCase().includes(lowerQuery) ||
    client.email.toLowerCase().includes(lowerQuery)
  );
};