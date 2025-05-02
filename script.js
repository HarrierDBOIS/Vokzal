async function loadTrains() {
    try {
        const response = await fetch('trains.json');
        const data = await response.json();
        console.log('Данные:', data);
        return data;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
    }
}

let trains = [];
let allStations = [];
let users = [];

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const error = document.getElementById('error');

    // Находим пользователя с введенными логином и паролем
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        sessionStorage.setItem('auth', 'true');
        sessionStorage.setItem('currentUserId', user.id);  // Сохраняем ID пользователя в sessionStorage
        window.location.href = 'home.html';  // Переходим на главную страницу
    } else {
        error.textContent = 'Неверные имя пользователя или пароль!';
    }
}

document.getElementById('loginBtn')?.addEventListener('click', login);

// Загрузка пользователей из JSON
fetch('users.json')
    .then(response => response.json())
    .then(data => {
        users = data;  // Записываем данные о пользователях в переменную
        console.log('Данные о пользователях:', users);
    })
    .catch(error => console.error('Ошибка при загрузке данных о пользователях:', error));

// Проверка авторизации
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, если находимся на странице home, search или tickets
    if (location.pathname.endsWith('home.html') || location.pathname.endsWith('search.html') || location.pathname.endsWith('tickets.html')) {
        // Проверяем, авторизован ли пользователь
        if (sessionStorage.getItem('auth') !== 'true') {
            window.location.href = 'index.html';  // Если не авторизован, перенаправляем на страницу логина
        }
    }

    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;  // Устанавливаем сегодняшнюю дату в поле ввода даты
    }
});

// Логаут
function logout() {
    sessionStorage.removeItem('auth');  // Удаляем информацию об авторизации
    sessionStorage.removeItem('currentUserId');  // Удаляем информацию о текущем пользователе
    window.location.href = 'index.html';  // Перенаправляем на страницу логина
}

// Если пользователь авторизован, можно отобразить его имя
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('auth') === 'true') {
        const currentUserId = sessionStorage.getItem('currentUserId');
        const user = users.find(u => u.id == currentUserId);
        if (user) {
            document.getElementById('userGreeting').textContent = `Привет, ${user.username}!`;
        }
    }
});
loadTrains().then(data => {
    trains = data;
    allStations = [...new Set(trains.flatMap(t => [t.from, t.to]))];
    console.log('Поезда загружены:', trains);

    if (document.getElementById('fromInput')) {
        setupAutocomplete('fromInput', 'fromSuggestions');
        setupAutocomplete('toInput', 'toSuggestions');
    }
    if (document.getElementById('stationSearch')) {
        setupAutocomplete('stationSearch', 'stationSuggestions');
    }
    // Теперь можно использовать trains
});

// Автозаполнение станций


function setupAutocomplete(inputId, suggestionId) {
    const input = document.getElementById(inputId);
    const suggestionBox = document.getElementById(suggestionId);
    console.log(allStations);
    input.addEventListener('input', () => {
        const value = input.value.trim().toLowerCase();
        suggestionBox.innerHTML = '';

        if (value === '') return;

        const matches = allStations.filter(st => st.toLowerCase().includes(value));
        matches.forEach(st => {
            const div = document.createElement('div');
            div.textContent = st;
            div.addEventListener('click', () => {
                input.value = st;
                suggestionBox.innerHTML = '';
                suggestionBox.style.display = 'none';
            });
            suggestionBox.appendChild(div);
        });

        suggestionBox.style.display = 'block';
        suggestionBox.style.width = input.offsetWidth + 'px';
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.innerHTML = '';
        }
    });
}

// Поиск поездов
document.getElementById('searchBtn')?.addEventListener('click', () => {
    const from = document.getElementById('fromInput').value.trim();
    const to = document.getElementById('toInput').value.trim();
    const date = document.getElementById('dateInput').value;
    const results = document.getElementById('searchResults');
    const routeResults = document.getElementById('routeResults');

    results.innerHTML = '';
    routeResults.innerHTML = '';

    if (!from || !to || !date) {
        results.textContent = 'Пожалуйста, заполните все поля.';
        return;
    }

    const matchedTrains = trains.filter(t => t.from === from && t.to === to && t.date === date);

    if (matchedTrains.length === 0) {
        results.textContent = 'Подходящих поездов не найдено.';
        return;
    }

    matchedTrains.forEach(t => {
        const card = document.createElement('div');
        card.className = 'train-card';

        card.innerHTML = `
            <div class="train-header">
                <span class="train-number">Поезд №${t.number}</span>
                <span class="train-status">${t.status}</span>
            </div>
            <div class="train-body">
                <div><strong>Куда:</strong> ${t.to}</div>
                <div><strong>Время:</strong> ${t.time}</div>
                <div><strong>Платформа:</strong> ${t.platform}</div>
                <div><strong>Стоимость:</strong> ${t.price}₽</div>
                <div><strong>Места:</strong> Верхние: ${t.upperSeats}, Нижние: ${t.lowerSeats}</div>
            </div>
        `;
        routeResults.appendChild(card);
    });
});

// Диалог выбора места
function openSeatDialog(trainNumber) {
    const train = trains.find(t => t.number === trainNumber);
    if (!train) return;

    const seatType = prompt(`Выберите тип места (верхнее/нижнее)\nСвободно: Верхние: ${train.upperSeats}, Нижние: ${train.lowerSeats}`);

    if (!seatType || !['верхнее', 'нижнее'].includes(seatType.toLowerCase())) return;

    if (seatType === 'верхнее' && train.upperSeats <= 0) {
        alert('Нет доступных верхних мест!');
        return;
    }
    if (seatType === 'нижнее' && train.lowerSeats <= 0) {
        alert('Нет доступных нижних мест!');
        return;
    }

    // Бронирование
    if (seatType === 'верхнее') train.upperSeats--;
    if (seatType === 'нижнее') train.lowerSeats--;

    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    tickets.push({ trainNumber: train.number, to: train.to, time: train.time, date: train.date, seat: seatType });
    localStorage.setItem('tickets', JSON.stringify(tickets));

    alert(`Вы забронировали ${seatType} место на поезд №${train.number}`);
}

// Страница "Мои билеты"
if (location.pathname.endsWith('tickets.html')) {
    const myTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const container = document.getElementById('myTickets');
    container.innerHTML = '';

    if (myTickets.length === 0) {
        container.textContent = 'У вас нет забронированных билетов.';
    } else {
        myTickets.forEach((t, index) => {
            const div = document.createElement('div');
            div.className = 'ticket';
            div.innerHTML = `
                <div><strong>Поезд:</strong> №${t.trainNumber}</div>
                <div><strong>Куда:</strong> ${t.to}</div>
                <div><strong>Дата:</strong> ${t.date}</div>
                <div><strong>Время:</strong> ${t.time}</div>
                <div><strong>Место:</strong> ${t.seat}</div>
                <button onclick="cancelTicket(${index})">Отменить бронь</button>
            `;
            container.appendChild(div);
        });
    }
}

function cancelTicket(index) {
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const t = tickets[index];
    const train = trains.find(tr => tr.number === t.trainNumber);
    if (train) {
        if (t.seat === 'верхнее') train.upperSeats++;
        if (t.seat === 'нижнее') train.lowerSeats++;
    }
    tickets.splice(index, 1);
    localStorage.setItem('tickets', JSON.stringify(tickets));
    location.reload();
}

// Навигационное меню
document.getElementById('burgerBtn')?.addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('active');
});

document.getElementById('searchTabloBtn')?.addEventListener('click', () => {
    const station = document.getElementById('stationSearch').value.trim();
    const date = document.getElementById('dateInput').value;
    const stationBoard = document.getElementById('stationBoard');
    const results = document.getElementById('searchResults');

    stationBoard.innerHTML = '';  // Очистить результаты поиска

    // Проверка на наличие обязательных данных
    if (!station || !date) {
        results.textContent = 'Пожалуйста, заполните все поля.';
        return;
    }

    // Фильтруем по станции и дате
    const matchedTrains = trains.filter(t => {
        const matchStation = t.from.toLowerCase() === station.toLowerCase() || t.to.toLowerCase() === station.toLowerCase();
        const matchDate = t.date.startsWith(date);
        return matchStation && matchDate;
    });

    if (matchedTrains.length === 0) {
        results.textContent = 'Подходящих поездов не найдено.';
        return;
    }

    // Отображение найденных поездов
    matchedTrains.forEach(t => {
        const card = document.createElement('div');
        card.className = 'train-card';

        card.innerHTML = `
            <div class="train-header">
                <span class="train-number">Поезд №${t.number}</span>
                <span class="train-status ${t.status.toLowerCase()}">${t.status}</span>
            </div>
            <div class="train-body">
                <div><strong>Куда:</strong> ${t.to}</div>
                <div><strong>Время отправления:</strong> ${t.departure}</div>
                <div><strong>Время прибытия:</strong> ${t.arrival}</div>
                <div><strong>Платформа:</strong> ${t.platform}</div>
                <div><strong>Стоимость:</strong> ${t.price}₽</div>
                <div><strong>Места:</strong> Верхние: ${t.upperSeats}, Нижние: ${t.lowerSeats}</div>
            </div>
        `;
        stationBoard.appendChild(card);
    });
});

// let selectedSeatType = null;
// let selectedTrain = null;

// // Открыть модальное окно с информацией о поезде
// function openSeatDialog(trainNumber) {
//     selectedTrain = trains.find(t => t.number === trainNumber);
//     if (!selectedTrain) return;

//     // Заполнить информацию о поезде
//     const trainInfo = document.getElementById('trainInfo');
//     trainInfo.innerHTML = `
//         <p><strong>Маршрут:</strong> ${selectedTrain.from} → ${selectedTrain.to}</p>
//         <p><strong>Стоимость:</strong> ${selectedTrain.price}₽</p>
//     `;

//     // Сброс выбора
//     selectedSeatType = null;
//     document.getElementById('upperSeatBtn').classList.remove('selected');
//     document.getElementById('lowerSeatBtn').classList.remove('selected');

//     // Показать модальное окно
//     document.getElementById('seatModal').style.display = 'block';
// }

// // Закрыть модальное окно
// function closeSeatDialog() {
//     document.getElementById('seatModal').style.display = 'none';
// }

// // Выбор верхнего места
// document.getElementById('upperSeatBtn').addEventListener('click', () => {
//     selectedSeatType = 'upper';
//     document.getElementById('upperSeatBtn').classList.add('selected');
//     document.getElementById('lowerSeatBtn').classList.remove('selected');
// });

// // Выбор нижнего места
// document.getElementById('lowerSeatBtn').addEventListener('click', () => {
//     selectedSeatType = 'lower';
//     document.getElementById('lowerSeatBtn').classList.add('selected');
//     document.getElementById('upperSeatBtn').classList.remove('selected');
// });

// // Бронирование места
// document.getElementById('bookBtn').addEventListener('click', () => {
//     if (!selectedSeatType || !selectedTrain) {
//         alert('Пожалуйста, выберите тип места.');
//         return;
//     }

//     const seatField = selectedSeatType === 'upper' ? 'upperSeats' : 'lowerSeats';

//     if (selectedTrain[seatField] > 0) {
//         selectedTrain[seatField]--;

//         // Сохранить заказ пользователю (предполагаем, что есть currentUserId)
//         const userId = sessionStorage.getItem('currentUserId');
//         if (userId) {
//             // Здесь должен быть код для записи в users.json (в реальности через сервер)
//             console.log(`Пользователь ${userId} забронировал ${selectedSeatType} место в поезде ${selectedTrain.number}`);
//         }

//         alert(`Место забронировано! ${seatField === 'upperSeats' ? 'Верхнее' : 'Нижнее'} место.`);

//         closeSeatDialog();
//     } else {
//         alert('К сожалению, такие места закончились.');
//     }
// });

// // Кнопка закрытия окна
// document.getElementById('closeModalBtn').addEventListener('click', closeSeatDialog);

// // Дополнительно можно закрывать окно при клике вне него
// window.addEventListener('click', (e) => {
//     const modal = document.getElementById('seatModal');
//     if (e.target === modal) {
//         closeSeatDialog();
//     }
// });