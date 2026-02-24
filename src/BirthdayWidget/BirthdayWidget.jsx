import React, { useState } from 'react';
import './BirthdayWidget.css';

// Моковые данные (имитация ответа от сервера)
const birthdayData = [
  {
    category: 'Сегодня',
    items: [
      {
        id: 1,
        name: 'Имя Фамилия',
        date: '01 Января',
        phone: '+7 000 000 00 00',
        email: 'email@gmail.com',
        company: 'Название организации'
      }
    ]
  },
  {
    category: 'Завтра',
    items: [
      {
        id: 2,
        name: 'Имя Фамилия',
        date: '02 Января',
        phone: '+7 000 000 00 00',
        email: 'email@gmail.com',
        company: 'Название организации'
      }
    ]
  },
  {
    category: 'Через 2 дня',
    items: [
      {
        id: 3,
        name: 'Имя Фамилия',
        date: '03 Января',
        phone: '+7 000 000 00 00',
        email: 'email@gmail.com',
        company: 'Название организации'
      }
    ]
  }
];

const BirthdayWidget = () => {
  const [showAll, setShowAll] = useState(false);

  // Функция для обработки клика "Показать все"
  const handleShowAll = () => {
    alert('Здесь должна быть логика загрузки полного списка или переход на другую страницу.');
    setShowAll(!showAll);
  };

  return (
    <div className="widget-container">
      <header className="widget-header">
        <h1>Дни рождения</h1>
      </header>

      <main className="widget-content">
        {birthdayData.map((group) => (
          <div key={group.category} className="date-group">
            <div className="group-header">{group.category}</div>
            
            <div className="data-table">
              {/* Заголовки колонок */}
              <div className="table-row headers">
                <div className="col-name">Имя клиента</div>
                <div className="col-date">День</div>
                <div className="col-phone">Телефон</div>
                <div className="col-email">Email</div>
                <div className="col-company">Компания</div>
              </div>

              {/* Данные */}
              {group.items.map((item) => (
                <div key={item.id} className="table-row data">
                  <div className="col-name value">{item.name}</div>
                  <div className="col-date value">{item.date}</div>
                  <div className="col-phone value">{item.phone}</div>
                  <div className="col-email value">{item.email}</div>
                  <div className="col-company value">{item.company}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      <footer className="widget-footer">
        <button className="show-all-btn" onClick={handleShowAll}>
          Показать все
        </button>
      </footer>
    </div>
  );
};

export default BirthdayWidget;