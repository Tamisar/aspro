import React, { useState, useEffect, useCallback, useRef } from 'react';
import './BirthdayWidget.css';

// =========================================
// КОНФИГУРАЦИЯ API
// =========================================
const API_BASE_URL = '/api/birthdays';

// Параметры пагинации
const PAGE_SIZE = 20; // Записей на страницу
const DEBOUNCE_DELAY = 400; // Задержка перед поиском (мс)

// =========================================
// МОКОВЫЕ ДАННЫЕ (для демонстрации)
// =========================================
const generateMockData = (page, limit, searchQuery = '') => {
  const allData = [
    { id: 1, name: 'Иван Петров', date: '10 Марта', phone: '+7 999 111 22 33', email: 'ivan@mail.ru', company: 'ООО "Ромашка"', category: 'Сегодня' },
    { id: 2, name: 'Анна Сидорова', date: '10 Марта', phone: '+7 999 444 55 66', email: 'anna@mail.ru', company: 'ЗАО "Вектор"', category: 'Сегодня' },
    { id: 3, name: 'Сергей Козлов', date: '11 Марта', phone: '+7 999 777 88 99', email: 'sergey@mail.ru', company: 'ИП Козлов', category: 'Завтра' },
    { id: 4, name: 'Мария Иванова', date: '12 Марта', phone: '+7 999 000 11 22', email: 'maria@mail.ru', company: 'ООО "Старт"', category: 'Через 2 дня' },
    { id: 5, name: 'Дмитрий Волков', date: '15 Марта', phone: '+7 999 333 44 55', email: 'dmitry@mail.ru', company: 'ООО "Техно"', category: 'В этом месяце' },
    { id: 6, name: 'Елена Морозова', date: '20 Марта', phone: '+7 999 666 77 88', email: 'elena@mail.ru', company: 'ЗАО "Финанс"', category: 'В этом месяце' },
    { id: 7, name: 'Алексей Смирнов', date: '25 Марта', phone: '+7 999 123 45 67', email: 'alexey@mail.ru', company: 'ООО "Альфа"', category: 'В этом месяце' },
    { id: 8, name: 'Ольга Новикова', date: '28 Марта', phone: '+7 999 765 43 21', email: 'olga@mail.ru', company: 'ИП Новикова', category: 'В этом месяце' },
    { id: 9, name: 'Павел Лебедев', date: '01 Апреля', phone: '+7 999 111 00 00', email: 'pavel@mail.ru', company: 'ООО "Бета"', category: 'Следующий месяц' },
    { id: 10, name: 'Наталья Козлова', date: '05 Апреля', phone: '+7 999 222 00 00', email: 'nataly@mail.ru', company: 'ЗАО "Гамма"', category: 'Следующий месяц' },
    // Генерируем больше данных для демонстрации пагинации
    ...Array.from({ length: 90 }, (_, i) => ({
      id: i + 11,
      name: `Клиент ${i + 11}`,
      date: `${(i % 28) + 1} ${['Марта', 'Апреля', 'Мая'][i % 3]}`,
      phone: `+7 999 ${100 + i} ${200 + i} ${30 + i % 10}`,
      email: `client${i + 11}@mail.ru`,
      company: `Компания ${String.fromCharCode(65 + (i % 26))}`,
      category: ['Сегодня', 'Завтра', 'Через 2 дня', 'В этом месяце', 'Следующий месяц'][i % 5]
    }))
  ];

  // Фильтрация по поисковому запросу
  let filtered = allData;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = allData.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.phone.includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.company.toLowerCase().includes(query)
    );
  }

  // Пагинация
  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const items = filtered.slice(start, end);

  // Группировка по категориям
  const grouped = items.reduce((acc, item) => {
    const existing = acc.find(g => g.category === item.category);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ category: item.category, items: [item] });
    }
    return acc;
  }, []);

  return {
    data: grouped,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNext: end < total,
      hasPrev: page > 1
    }
  };
};

// =========================================
// API ФУНКЦИИ
// =========================================
const fetchBirthdays = async ({ page = 1, limit = PAGE_SIZE, searchQuery = '' } = {}) => {
  // ДЛЯ ДЕМО - используем моковые данные
  await new Promise(resolve => setTimeout(resolve, 500)); // Имитация задержки сети
  
  // return generateMockData(page, limit, searchQuery);

  // ДЛЯ РЕАЛЬНОГО API - раскомментируйте:
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(searchQuery && { q: searchQuery })
  });

  const response = await fetch(`${API_BASE_URL}?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}` // если нужна авторизация
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

// =========================================
// ХУК ДЛЯ DEBOUNCE
// =========================================
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// =========================================
// ОСНОВНОЙ КОМПОНЕНТ
// =========================================
const BirthdayWidget = () => {
  // Состояния данных
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: PAGE_SIZE,
    hasNext: false,
    hasPrev: false
  });

  // Состояния UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    name: true,
    phone: false,
    email: false,
    company: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // date, name, company
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Refs
  const searchInputRef = useRef(null);
  const debounceSearch = useDebounce(searchQuery, DEBOUNCE_DELAY);

  // =========================================
  // ЗАГРУЗКА ДАННЫХ
  // =========================================
  const loadData = useCallback(async (page = 1, query = searchQuery) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await fetchBirthdays({
        page,
        limit: PAGE_SIZE,
        searchQuery: query
      });

      setData(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить данные');
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Первоначальная загрузка
  useEffect(() => {
    loadData(1);
  }, []);

  // Загрузка при изменении поискового запроса (с debounce)
  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(1, debounceSearch);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(handler);
  }, [debounceSearch, loadData]);

  // =========================================
  // ОБРАБОТЧИКИ СОБЫТИЙ
  // =========================================
  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    loadData(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleFilterToggle = (filter) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleRetry = () => {
    loadData(pagination.currentPage);
  };

  const handleExport = async () => {
    // Экспорт данных (можно реализовать скачивание CSV)
    alert('Функция экспорта будет доступна в следующей версии');
  };

  // =========================================
  // ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ
  // =========================================
  
  // Иконка поиска
  const SearchIcon = () => (
    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );

  // Иконка очистки
  const ClearIcon = () => (
    <svg className="clear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );

  // Иконка фильтра
  const FilterIcon = () => (
    <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  );

  // Иконка сортировки
  const SortIcon = ({ direction }) => (
    <svg className="sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {direction === 'asc' ? (
        <path d="M12 19V5M5 12l7-7 7 7" />
      ) : (
        <path d="M12 5v14M5 12l7 7 7-7" />
      )}
    </svg>
  );

  // Индикатор загрузки
  const Loader = () => (
    <div className="loader">
      <div className="loader-spinner"></div>
      <span>Загрузка данных...</span>
    </div>
  );

  // Сообщение об ошибке
  const ErrorMessage = ({ message, onRetry }) => (
    <div className="error-message">
      <div className="error-icon">⚠️</div>
      <p>{message}</p>
      <button onClick={onRetry} className="retry-btn">Попробовать снова</button>
    </div>
  );

  // Пустое состояние
  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon">📭</div>
      <h3>Ничего не найдено</h3>
      <p>Попробуйте изменить поисковый запрос или фильтры</p>
      {searchQuery && (
        <button onClick={handleSearchClear} className="clear-search-btn">
          Очистить поиск
        </button>
      )}
    </div>
  );

  // Строка таблицы
  const TableRow = ({ item, isHeader = false }) => (
    <div className={`table-row ${isHeader ? 'header-row' : 'data-row'}`}>
      <div className="col-name">
        {isHeader ? (
          <button className="sort-btn" onClick={() => handleSort('name')}>
            Имя клиента
            <SortIcon direction={sortBy === 'name' ? sortOrder : 'asc'} />
          </button>
        ) : (
          item.name
        )}
      </div>
      <div className="col-date">
        {isHeader ? (
          <button className="sort-btn" onClick={() => handleSort('date')}>
            День
            <SortIcon direction={sortBy === 'date' ? sortOrder : 'asc'} />
          </button>
        ) : (
          item.date
        )}
      </div>
      <div className="col-phone">{isHeader ? 'Телефон' : item.phone}</div>
      <div className="col-email">{isHeader ? 'Email' : item.email}</div>
      <div className="col-company">
        {isHeader ? (
          <button className="sort-btn" onClick={() => handleSort('company')}>
            Компания
            <SortIcon direction={sortBy === 'company' ? sortOrder : 'asc'} />
          </button>
        ) : (
          item.company
        )}
      </div>
    </div>
  );

  // Фильтры чекбоксы
  const FilterCheckboxes = () => (
    <div className="filter-checkboxes">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={activeFilters.name}
          onChange={() => handleFilterToggle('name')}
        />
        <span>Имя</span>
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={activeFilters.phone}
          onChange={() => handleFilterToggle('phone')}
        />
        <span>Телефон</span>
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={activeFilters.email}
          onChange={() => handleFilterToggle('email')}
        />
        <span>Email</span>
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={activeFilters.company}
          onChange={() => handleFilterToggle('company')}
        />
        <span>Компания</span>
      </label>
    </div>
  );

  // Пагинация
  const Pagination = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (pagination.totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(1)}
          disabled={!pagination.hasPrev}
          className="page-btn first"
          title="Первая страница"
        >
          ««
        </button>
        
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrev}
          className="page-btn prev"
        >
          ←
        </button>

        {startPage > 1 && (
          <>
            <button onClick={() => handlePageChange(1)} className="page-btn">1</button>
            {startPage > 2 && <span className="page-ellipsis">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`page-btn ${page === pagination.currentPage ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}

        {endPage < pagination.totalPages && (
          <>
            {endPage < pagination.totalPages - 1 && <span className="page-ellipsis">...</span>}
            <button onClick={() => handlePageChange(pagination.totalPages)} className="page-btn">
              {pagination.totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNext}
          className="page-btn next"
        >
          →
        </button>

        <button
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={!pagination.hasNext}
          className="page-btn last"
          title="Последняя страница"
        >
          »»
        </button>
      </div>
    );
  };

  // =========================================
  // РЕНДЕР
  // =========================================
  return (
    <div className="widget-container">
      {/* Заголовок */}
      <header className="widget-header">
        <div className="header-left">
          <h1>Дни рождения</h1>
          <span className="total-count">
            Найдено: {pagination.totalItems}
          </span>
        </div>
        <button onClick={handleExport} className="export-btn">
          📥 Экспорт
        </button>
      </header>

      {/* Поиск и фильтры */}
      <div className="search-section">
        <div className="search-container">
          <SearchIcon />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Поиск по имени, телефону, email, компании..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Поиск клиентов"
          />
          {searchQuery && (
            <button onClick={handleSearchClear} className="clear-btn" aria-label="Очистить поиск">
              <ClearIcon />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`filters-toggle ${showFilters ? 'active' : ''}`}
          aria-expanded={showFilters}
        >
          <FilterIcon />
          Фильтры
        </button>
      </div>

      {/* Расширенные фильтры */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-section">
            <h4>Поиск в полях:</h4>
            <FilterCheckboxes />
          </div>
          
          <div className="filter-section">
            <h4>Сортировка:</h4>
            <div className="sort-options">
              <button
                onClick={() => handleSort('date')}
                className={`sort-option ${sortBy === 'date' ? 'active' : ''}`}
              >
                По дате {sortBy === 'date' && <SortIcon direction={sortOrder} />}
              </button>
              <button
                onClick={() => handleSort('name')}
                className={`sort-option ${sortBy === 'name' ? 'active' : ''}`}
              >
                По имени {sortBy === 'name' && <SortIcon direction={sortOrder} />}
              </button>
              <button
                onClick={() => handleSort('company')}
                className={`sort-option ${sortBy === 'company' ? 'active' : ''}`}
              >
                По компании {sortBy === 'company' && <SortIcon direction={sortOrder} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && <ErrorMessage message={error} onRetry={handleRetry} />}

      {/* Основной контент */}
      <main className="widget-content">
        {isLoading ? (
          <Loader />
        ) : data.length === 0 ? (
          <EmptyState />
        ) : (
          data.map((group) => (
            <div key={group.category} className="date-group">
              <div className="group-header">
                <span className="category-name">{group.category}</span>
                <span className="items-count">{group.items.length}</span>
              </div>
              
              <div className="data-table">
                <TableRow item={{}} isHeader={true} />
                {group.items.map((item) => (
                  <TableRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Пагинация */}
      {!isLoading && data.length > 0 && <Pagination />}

      {/* Информация о пагинации */}
      {!isLoading && data.length > 0 && (
        <div className="pagination-info">
          Показано {data.reduce((acc, g) => acc + g.items.length, 0)} из {pagination.totalItems} записей
        </div>
      )}

      {/* Футер */}
      <footer className="widget-footer">
        <span className="footer-info">
          Страница {pagination.currentPage} из {pagination.totalPages}
        </span>
      </footer>
    </div>
  );
};

export default BirthdayWidget;