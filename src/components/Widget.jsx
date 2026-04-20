// src/components/Widget/Widget.jsx
import { useState, useEffect, useMemo } from 'react';
import PeriodFilter from './PeriodFilter';
import SearchBar from './SearchBar';
import BirthdayGroup from './BirthdayGroup';
import { fetchBirthdays, exportBirthdaysToCSV } from '../utils/birthdaysApi';
import { filterByPeriod, searchClients } from '../utils/dateUtils';
import './Widget.css';

function Widget() {
  const [clients, setClients] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка данных из Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchBirthdays();
        setClients(data);
      } catch (err) {
        console.error('Load error:', err);
        setError('Не удалось загрузить данные');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Фильтрация и поиск (мемоизировано)
  const filteredClients = useMemo(() => {
    let result = filterByPeriod(clients, selectedPeriod);
    result = searchClients(result, searchQuery);
    
    if (!showAll) {
      result = result.slice(0, 5);
    }
    
    return result;
  }, [clients, selectedPeriod, searchQuery, showAll]);

  // Группировка по категориям
  const groupedClients = useMemo(() => {
    const groups = { today: [], tomorrow: [], week: [], later: [] };

    filteredClients.forEach(client => {
      // 👈 client.groupType уже рассчитан в API
      const type = client.groupType || 'later';
      groups[type].push(client);
    });

    return groups;
  }, [filteredClients]);

  const totalVisible = filteredClients.length;
  const hasMore = !showAll && clients.length > 5;

  const handleExport = async () => {
    try {
      await exportBirthdaysToCSV();
    } catch (err) {
      alert('Ошибка экспорта: ' + err.message);
    }
  };

  if (error) {
    return (
      <div className="widget">
        <div className="widget-header">
          <h1 className="widget-title">Дни рождения</h1>
        </div>
        <div className="widget-error">
          <p>⚠️ {error}</p>
          <button onClick={() => window.location.reload()}>Повторить</button>
        </div>
      </div>
    );
  }

  console.log('🔍 Widget render:', {
  isLoading,
  error,
  clientsCount: clients.length,
  filteredCount: filteredClients.length,
  groups: {
    today: groupedClients.today.length,
    tomorrow: groupedClients.tomorrow.length,
    week: groupedClients.week.length,
    later: groupedClients.later.length
  }
});
  return (
    <div className="widget">
      <div className="widget-header">
        <h1 className="widget-title">Дни рождения</h1>
        <PeriodFilter 
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
        <button onClick={handleExport} className="export-btn">📥 Экспорт</button>
      </div>

      <SearchBar 
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <div className="widget-content">
        {isLoading ? (
          <div className="loader">Загрузка...</div>
        ) : (
          <>
            {groupedClients.today.length > 0 && (
              <BirthdayGroup title="Сегодня" clients={groupedClients.today} type="today" />
            )}
            {groupedClients.tomorrow.length > 0 && (
              <BirthdayGroup title="Завтра" clients={groupedClients.tomorrow} type="tomorrow" />
            )}
            {groupedClients.week.length > 0 && (
              <BirthdayGroup title="Ближайшие 7 дней" clients={groupedClients.week} type="week" />
            )}
            {groupedClients.later.length > 0 && (
              <BirthdayGroup title="Позже" clients={groupedClients.later} type="later" />
            )}
            {totalVisible === 0 && !isLoading && (
              <div className="empty-state">
                <p>📭 Нет дней рождений в выбранный период</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="clear-search-btn">
                    Очистить поиск
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {hasMore && !isLoading && (
        <button className="show-all-button" onClick={() => setShowAll(true)}>
          Показать все ({clients.length})
        </button>
      )}
    </div>
  );
}

export default Widget;