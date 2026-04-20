// src/utils/birthdaysApi.js
import { supabase } from '../lib/supabase';
import { getDaysUntil, getGroupLabel, formatDate } from './dateUtils';

export const fetchBirthdays = async ({ searchQuery = '' } = {}) => {
  console.log('🚀 fetchBirthdays start');
  
  try {
    // Создаём запрос
    let query = supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('birth_date', { ascending: true });

    // Поиск
    if (searchQuery) {
      const orQuery = [
        `name.ilike.%${searchQuery}%`,
        `phone.ilike.%${searchQuery}%`,
        `email.ilike.%${searchQuery}%`,
        `company.ilike.%${searchQuery}%`
      ].join(',');
      query = query.or(orQuery);
    }

    console.log('📡 Выполняю запрос к Supabase...');
    
    // 👇 Добавляем таймаут 10 секунд
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('⏱️ Request timeout')), 10000)
    );
    
    const resultPromise = query;
    
    const { data, error } = await Promise.race([
      resultPromise,
      timeoutPromise
    ]);
    
    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    
    console.log('✅ Данные получены:', data?.length, 'записей');
    if (data?.[0]) {
      console.log('📋 Пример:', {
        id: data[0].id,
        name: data[0].name,
        birth_date: data[0].birth_date,
        is_active: data[0].is_active
      });
    }

    // Преобразование данных
    const clients = (data || []).map(client => {
      const { type } = getGroupLabel(client.birth_date);
      return {
        id: client.id,
        name: client.name,
        date: client.birth_date,
        phone: client.phone,
        email: client.email,
        company: client.company,
        notes: client.notes,
        daysUntil: getDaysUntil(client.birth_date),
        groupType: type,
        formattedDate: formatDate(client.birth_date)
      };
    });

    clients.sort((a, b) => a.daysUntil - b.daysUntil);
    console.log('📦 После обработки:', clients.length, 'клиентов');
    
    return clients;
    
  } catch (error) {
    console.error('💥 fetchBirthdays failed:', error.message || error);
    throw error;
  }
};

export const exportBirthdaysToCSV = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true);
  
  if (error) throw error;
  
  const csvContent = [
    ['Имя', 'Дата рождения', 'Телефон', 'Email', 'Компания', 'Заметки'].join(','),
    ...data.map(item => [
      `"${item.name}"`,
      item.birth_date,
      `"${item.phone || ''}"`,
      `"${item.email || ''}"`,
      `"${item.company || ''}"`,
      `"${item.notes || ''}"`
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `birthdays_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};