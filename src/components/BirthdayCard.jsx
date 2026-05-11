import { formatDate } from '../utils/dateUtils';
import './BirthdayCard.css';

function BirthdayCard({ client }) {
  return (
    <div className="birthday-card">
      <div className="card-row">
        <div className="card-column">
          <label className="card-label">Имя клиента</label>
          <div className="card-value name">{client.name}</div>
        </div>
        
        <div className="card-column">
          <label className="card-label">День</label>
          <div className="card-value">{formatDate(client.date)}</div>
        </div>
        
        <div className="card-column">
          <label className="card-label">Телефон</label>
          <div className="card-value">{client.phone}</div>
        </div>
        
        <div className="card-column">
          <label className="card-label">Email</label>
          <div className="card-value email">{client.email}</div>
        </div>
        
        <div className="card-column">
          <label className="card-label">Компания</label>
          <div className="card-value company">{client.company}</div>
        </div>
      </div>
    </div>
  );
}

export default BirthdayCard;