import './PeriodFilter.css';

const periods = [
  { value: 7, label: '7 дней' },
  { value: 14, label: '14 дней' },
  { value: 30, label: '30 дней' },
  { value: 90, label: '90 дней' }
];

function PeriodFilter({ selectedPeriod, onPeriodChange }) {
  return (
    <div className="period-filter">
      {periods.map(period => (
        <button
          key={period.value}
          className={`period-button ${selectedPeriod === period.value ? 'active' : ''}`}
          onClick={() => onPeriodChange(period.value)}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

export default PeriodFilter;