import { useState, useMemo } from 'react';
import PeriodFilter from './PeriodFilter';
import SearchBar from './SearchBar';
import BirthdayGroup from './BirthdayGroup';
import { mockClients } from '../data/mockData';
import { filterByPeriod, searchClients, getDaysUntil, getGroupLabel } from '../utils/dateUtils';
import './Widget.css';

function Widget() {
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredClients = useMemo(() => {
    let result = filterByPeriod(mockClients, selectedPeriod);
    result = searchClients(result, searchQuery);
    
    // Sort by days until birthday
    result.sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date));
    
    // Limit to 5 if not showing all
    if (!showAll) {
      result = result.slice(0, 5);
    }
    
    return result;
  }, [selectedPeriod, searchQuery, showAll]);

  const groupedClients = useMemo(() => {
    const groups = {
      today: [],
      tomorrow: [],
      week: [],
      later: []
    };

    filteredClients.forEach(client => {
      const { type } = getGroupLabel(client.date);
      groups[type].push(client);
    });

    return groups;
  }, [filteredClients]);

  const totalVisible = filteredClients.length;
  const hasMore = !showAll && mockClients.length > 5;

  return (
    <div className="widget">
      <div className="widget-header">
        <h1 className="widget-title">Дни рождения</h1>
        <PeriodFilter 
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </div>

      <SearchBar 
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <div className="widget-content">
        {groupedClients.today.length > 0 && (
          <BirthdayGroup 
            title="Сегодня"
            clients={groupedClients.today}
            type="today"
          />
        )}

        {groupedClients.tomorrow.length > 0 && (
          <BirthdayGroup 
            title="Завтра"
            clients={groupedClients.tomorrow}
            type="tomorrow"
          />
        )}

        {groupedClients.week.length > 0 && (
          <BirthdayGroup 
            title="Ближайшие 7 дней"
            clients={groupedClients.week}
            type="week"
          />
        )}

        {groupedClients.later.length > 0 && (
          <BirthdayGroup 
            title="Позже"
            clients={groupedClients.later}
            type="later"
          />
        )}

        {filteredClients.length === 0 && (
          <div className="empty-state">
            <p>Нет дней рождений в выбранный период</p>
          </div>
        )}
      </div>

      {hasMore && (
        <button 
          className="show-all-button"
          onClick={() => setShowAll(true)}
        >
          Показать все
        </button>
      )}
    </div>
  );
}

export default Widget;