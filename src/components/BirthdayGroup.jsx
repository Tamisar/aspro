import BirthdayCard from './BirthdayCard';
import './BirthdayGroup.css';

const groupColors = {
  today: { bg: '#d1fae5', text: '#059669', label: 'Сегодня' },
  tomorrow: { bg: '#fce7f3', text: '#db2777', label: 'Завтра' },
  week: { bg: '#dbeafe', text: '#2563eb', label: 'Ближайшие 7 дней' },
  later: { bg: '#f3f4f6', text: '#6b7280', label: 'Позже' }
};

function BirthdayGroup({ title, clients, type }) {
  const colors = groupColors[type] || groupColors.later;
  
  if (clients.length === 0) return null;
  
  return (
    <div className="birthday-group">
      <div className="group-header">
        <h3 className="group-title" style={{ color: colors.text }}>
          {title}
        </h3>
        <span className="group-count" style={{ background: colors.bg, color: colors.text }}>
          {clients.length}
        </span>
      </div>
      
      <div className="group-cards">
        {clients.map(client => (
          <BirthdayCard key={client.id} client={client} />
        ))}
      </div>
    </div>
  );
}

export default BirthdayGroup;