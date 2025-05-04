let trains = [];
let users = [];
let allStations = [];

async function loadInitialData() {
    // Загрузка поездов
    if (!sessionStorage.getItem('trains')) {
        const trainsResponse = await fetch('trains.json');
        trains = await trainsResponse.json();
        sessionStorage.setItem('trains', JSON.stringify(trains));
    } else {
        trains = JSON.parse(sessionStorage.getItem('trains'));
    }

    // Загрузка пользователей
    if (!sessionStorage.getItem('users')) {
        const usersResponse = await fetch('users.json');
        users = await usersResponse.json();
        sessionStorage.setItem('users', JSON.stringify(users));
    } else {
        users = JSON.parse(sessionStorage.getItem('users'));
    }

    // Формирование списка станций
    if (!sessionStorage.getItem('allStations')) {
        allStations = [...new Set(trains.flatMap(t => [t.from, t.to]))];
        sessionStorage.setItem('allStations', JSON.stringify(allStations));
    } else {
        allStations = JSON.parse(sessionStorage.getItem('allStations'));
    }
}

// Если данных нет — можно здесь инициализировать пустыми или предзаполненными массивами
if (trains.length === 0) {
    // Пример: sessionStorage.setItem('trains', JSON.stringify([...]));
    console.warn("Trains not found in sessionStorage");
}

if (users.length === 0) {
    console.warn("Users not found in sessionStorage");
}

function saveTrains() {
    sessionStorage.setItem('trains', JSON.stringify(trains));
}

function saveUsers() {
    sessionStorage.setItem('users', JSON.stringify(users));
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const error = document.getElementById('error');

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        sessionStorage.setItem('auth', 'true');
        sessionStorage.setItem('currentUserId', user.id);
        window.location.href = 'home.html';
    } else {
        error.textContent = 'Неверные имя пользователя или пароль!';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('auth') !== 'true') {
        document.querySelector('.nav').style.display = 'none';
    }
});
function register() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const error = document.getElementById('regError');

    if (!username || !password) {
        error.textContent = 'Пожалуйста, заполните все поля.';
        return;
    }

    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        error.textContent = 'Пользователь с таким именем уже существует.';
        return;
    }

    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username,
        password
    };

    users.push(newUser);
    saveUsers();
    sessionStorage.setItem('users', JSON.stringify(users));

    // Автоматический вход
    sessionStorage.setItem('auth', 'true');
    sessionStorage.setItem('currentUserId', newUser.id);

    window.location.href = 'home.html';
}

document.getElementById('loginBtn')?.addEventListener('click', login);

document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    if (location.pathname.endsWith('home.html') || location.pathname.endsWith('search.html') || location.pathname.endsWith('bookings.html')) {
        if (sessionStorage.getItem('auth') !== 'true') {
            window.location.href = 'index.html';
        }
    }

    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    if (sessionStorage.getItem('auth') === 'true') {
        
        const currentUserId = sessionStorage.getItem('currentUserId');
        const user = users.find(u => u.id == currentUserId);
    }

    if (trains.length > 0) {
        allStations = [...new Set(trains.flatMap(t => [t.from, t.to]))];

        if (document.getElementById('fromInput')) {
            setupAutocomplete('fromInput', 'fromSuggestions');
            setupAutocomplete('toInput', 'toSuggestions');
        }
        if (document.getElementById('stationSearch')) {
            setupAutocomplete('stationSearch', 'stationSuggestions');
        }
    }
});

function logout() {
    sessionStorage.removeItem('auth');
    sessionStorage.removeItem('currentUserId');
    window.location.href = 'index.html';
}

function setupAutocomplete(inputId, suggestionId) {
    const input = document.getElementById(inputId);
    const suggestionBox = document.getElementById(suggestionId);

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
                <div><button onclick="showBookingDialog('${t.number}')">Забронировать</button></div>
            </div>
        `;
        routeResults.appendChild(card);
    });
});

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

    if (seatType === 'верхнее') train.upperSeats--;
    if (seatType === 'нижнее') train.lowerSeats--;

    saveTrains();

    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    tickets.push({ trainNumber: train.number, to: train.to, time: train.time, date: train.date, seat: seatType });
    localStorage.setItem('tickets', JSON.stringify(tickets));

    alert(`Вы забронировали ${seatType} место на поезд №${train.number}`);
}

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
        saveTrains();
    }
    tickets.splice(index, 1);
    localStorage.setItem('tickets', JSON.stringify(tickets));
    location.reload();
}

document.getElementById('burgerBtn')?.addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('active');
});

document.getElementById('searchTabloBtn')?.addEventListener('click', () => {
    const station = document.getElementById('stationSearch').value.trim();
    const date = document.getElementById('dateInput').value;
    const stationBoard = document.getElementById('stationBoard');
    const results = document.getElementById('searchResults');

    stationBoard.innerHTML = '';

    if (!station || !date) {
        results.textContent = 'Пожалуйста, заполните все поля.';
        return;
    }

    const matchedTrains = trains.filter(t => {
        const matchStation = t.from.toLowerCase() === station.toLowerCase();
        const matchDate = t.date.startsWith(date);
        return matchStation && matchDate;
    });

    if (matchedTrains.length === 0) {
        results.textContent = 'Подходящих поездов не найдено.';
        return;
    } else {
        results.textContent = '';
    }

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
                <div><button onclick="showBookingDialog('${t.number}')">Забронировать</button></div>

        `;
        stationBoard.appendChild(card);
    });
});

let selectedTrainNumber = null;

function showBookingDialog(trainNumber) {
    const dialog = document.getElementById('bookingDialog');
    const trains = JSON.parse(sessionStorage.getItem('trains')) || [];
    const train = trains.find(t => t.number === trainNumber);
    selectedTrainNumber = trainNumber;

    if (!train) return;

    document.getElementById('selectedTrain').textContent = `Поезд №${train.number} — ${train.from} → ${train.to}, ${train.date}, ${train.time}`;
    document.getElementById('seatType').value = 'upper'; // Начнем с верхнего места по умолчанию
    dialog.showModal();
}

document.getElementById('closeDialogBtn')?.addEventListener('click', () => {
    document.getElementById('bookingDialog').close();
});

document.getElementById('bookingForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const seatType = document.getElementById('seatType').value;
    const trains = JSON.parse(sessionStorage.getItem('trains')) || [];
    const users = JSON.parse(sessionStorage.getItem('users')) || [];
    const currentUserId = parseInt(sessionStorage.getItem('currentUserId'));
    const user = users.find(u => u.id === currentUserId);
    const train = trains.find(t => t.number === selectedTrainNumber);

    const messageEl = document.getElementById('bookingMessage');
    messageEl.textContent = ''; // очистить старое сообщение

    if (!train || !user) return;

    const seatList = seatType === 'upper' ? train.reservedUpperSeats : train.reservedLowerSeats;
    const maxSeats = seatType === 'upper' ? train.upperSeats : train.lowerSeats;

    let seatNumber = null;
    for (let i = 1; i <= maxSeats; i++) {
        if (!seatList.includes(i)) {
            seatNumber = i;
            break;
        }
    }

    if (!seatNumber) {
        messageEl.style.color = 'red';
        messageEl.textContent = `Нет доступных ${seatType === 'upper' ? 'верхних' : 'нижних'} мест!`;
        return;
    }

    seatList.push(seatNumber);
    if (seatType === 'upper') train.upperSeats--;
    else train.lowerSeats--;

    sessionStorage.setItem('trains', JSON.stringify(trains));

    user.bookings.push({
        trainNumber: train.number,
        seat: `${seatType === 'upper' ? 'верхнее' : 'нижнее'} №${seatNumber}`,
        status: 'забронировано'
    });

    sessionStorage.setItem('users', JSON.stringify(users));

    messageEl.style.color = 'green';
    messageEl.textContent = `Вы забронировали ${seatType === 'upper' ? 'верхнее' : 'нижнее'} место №${seatNumber} на поезд №${train.number}`;

    // Не закрываем модалку сразу, чтобы пользователь видел результат
    // Можно закрыть через timeout, если нужно
});

document.addEventListener('DOMContentLoaded', () => {
    const userId = sessionStorage.getItem('currentUserId');
    const users = JSON.parse(sessionStorage.getItem('users') || '[]');

    const currentUser = users.find(u => u.id == userId);
    if (currentUser) {
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) {
            userDisplay.textContent = `Пользователь: ${currentUser.username}`;
        }
    }
});

