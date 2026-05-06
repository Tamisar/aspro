// Настройки виджета дней рождения.
// Этот файл копируется в dist/config.js и его можно править прямо в GitHub repo
// без изменения React-кода.
window.ASPRO_BIRTHDAY_WIDGET = {
  // Если в вашем портале список клиентов/контактов доступен по другому методу,
  // впишите его первым в массив. Виджет попробует методы по порядку.
  crmMethods: [
    '/crm/account/list',
    '/crm/contact/list',
    '/crm/client/list',
    '/crm/customer/list',
    '/account/account/list',
  ],

  // Сколько записей брать за один запрос и сколько страниц максимум читать.
  limit: 100,
  maxPages: 5,

  // Поля, которые просим у API. Можно добавить свое пользовательское поле дня рождения.
  fields: [
    'id', 'name', 'title', 'first_name', 'last_name', 'middle_name',
    'birthday', 'birthdate', 'birth_date', 'date_birth',
    'uf_crm_birthday', 'UF_CRM_BIRTHDAY',
    'phone', 'email', 'company', 'company_title', 'avatar', 'photo'
  ],
};
