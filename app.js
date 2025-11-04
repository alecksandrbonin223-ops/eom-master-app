document.addEventListener('DOMContentLoaded', () => {

    // 1. Инициализация Telegram
    const tg = window.Telegram.WebApp;
    tg.ready();

    // 2. Получаем главный контейнер
    const appContainer = document.getElementById('app-container');

    // 3. Данные (Расширяем ваш прайс-лист)
    const priceList = {
        "categories": [
            { "id": "electro", "title": "Электрика", "icon": "⚡️" },
            { "id": "plumbing", "title": "Сантехника", "icon": "🔧" },
            { "id": "assembly", "title": "Сборка и установка мебели", "icon": "🪚" },
            { "id": "doors", "title": "Двери и окна", "icon": "🚪" },
            { "id": "fasteners", "title": "Крепёж и навес", "icon": "🧗" }
        ],
        "services": {
            // Электрика
            "electro": [
                { "id": "e1", "title": "Замена розетки / выключателя", "price": 1000 },
                { "id": "e2", "title": "Установка люстры", "price": 3000 },
                { "id": "e3", "title": "Установка светильника (точечного)", "price": 800 },
                { "id": "e4", "title": "Монтаж бра", "price": 1200 }
            ],
            // Сантехника
            "plumbing": [
                { "id": "p1", "title": "Замена смесителя", "price": 2500 },
                { "id": "p2", "title": "Установка раковины", "price": 3000 },
                { "id": "p3", "title": "Замена унитаза", "price": 3500 },
                { "id": "p4", "title": "Установка стиральной машины", "price": 2000 }
            ],
            // Сборка
            "assembly": [
                { "id": "a1", "title": "Сборка шкафа", "price": 5000 },
                { "id": "a2", "title": "Сборка кровати", "price": 3000 },
                { "id": "a3", "title": "Сборка комода", "price": 2000 }
            ],
            // Двери
            "doors": [
                { "id": "d1", "title": "Установка межкомнатной двери", "price": 6000 },
                { "id": "d2", "title": "Замена личинки замка", "price": 1000 },
                { "id": "d3", "title": "Регулировка балконной двери", "price": 1500 }
            ],
            // Крепеж
            "fasteners": [
                { "id": "f1", "title": "Навесить телевизор (бетон)", "price": 3500 },
                { "id": "f2", "title": "Повесить карниз", "price": 2000 },
                { "id": "f3", "title": "Повесить зеркало", "price": 2000 }
            ]
        }
    };
    
    // 4. Наша корзина
    // { "p1": 1, "e2": 3 } - "Замена смесителя": 1шт, "Установка люстры": 3шт
    let cart = {};

    // 5. Минимальный заказ
    const MIN_ORDER_PRICE = 4000;

    // ----- НОВЫЕ ФУНКЦИИ -----

    // Функция для отрисовки Главного экрана (Категории)
    function showMainScreen() {
        appContainer.innerHTML = '<h2>Какая помощь вам нужна?</h2>';
        
        priceList.categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-button';
            button.innerHTML = `<span>${category.icon}</span> ${category.title}`;
            
            // ОБНОВЛЕННЫЙ КЛИК:
            // Теперь он вызывает функцию 'showServicesScreen'
            button.onclick = () => {
                showServicesScreen(category.id);
            };
            
            appContainer.appendChild(button);
        });

        // На главном экране кнопка "Назад" не нужна
        tg.BackButton.hide();
    }

    // НОВАЯ ФУНКЦИЯ: Отрисовка Экрана Услуг
    function showServicesScreen(categoryId) {
        // Находим категорию по ID
        const category = priceList.categories.find(c => c.id === categoryId);
        // Находим список услуг для этой категории
        const services = priceList.services[categoryId] || [];
        
        appContainer.innerHTML = `<h2 class="category-title">${category.icon} ${category.title}</h2>`;

        if (services.length === 0) {
            appContainer.innerHTML += '<p>В этой категории пока нет услуг.</p>';
        }

        // Отрисовываем каждую услугу
        services.forEach(service => {
            const item = document.createElement('div');
            item.className = 'service-item';

            item.innerHTML = `
                <div class="service-details">
                    <span class="service-title">${service.title}</span>
                    <span class="service-price">${service.price} ₽</span>
                </div>
                <div class="service-controls" id="controls-${service.id}">
                    </div>
            `;
            appContainer.appendChild(item);
            // Отрисовываем кнопки (+ / -) для этого товара
            updateServiceControls(service.id);
        });

        // Показываем нативную кнопку "Назад" в Telegram
        tg.BackButton.show();
        // При клике на "Назад", возвращаемся на главный экран
        tg.BackButton.onClick(showMainScreen);
    }

    // НОВАЯ ФУНКЦИЯ: Обновляет кнопки [ + ] или [ - 1 + ] для товара
    function updateServiceControls(serviceId) {
        const controlsContainer = document.getElementById(`controls-${serviceId}`);
        if (!controlsContainer) return;

        const quantity = cart[serviceId] || 0;

        if (quantity === 0) {
            // Если товара нет в корзине - показываем кнопку "Добавить"
            controlsContainer.innerHTML = `
                <button class="btn-add" data-service-id="${serviceId}">Добавить</button>
            `;
        } else {
            // Если товар в корзине - показываем счетчик
            controlsContainer.innerHTML = `
                <button class="btn-count" data-action="remove" data-service-id="${serviceId}">-</button>
                <span class="count">${quantity}</span>
                <button class="btn-count" data-action="add" data-service-id="${serviceId}">+</button>
            `;
        }
    }

    // НОВАЯ ФУНКЦИЯ: Добавить 1 товар в корзину
    function addToCart(serviceId) {
        cart[serviceId] = (cart[serviceId] || 0) + 1;
        updateCartView();
        updateServiceControls(serviceId); // Обновляем только кнопки этого товара
    }

    // НОВАЯ ФУНКЦИЯ: Убрать 1 товар из корзины
    function removeFromCart(serviceId) {
        cart[serviceId] = (cart[serviceId] || 0) - 1;
        if (cart[serviceId] <= 0) {
            delete cart[serviceId];
        }
        updateCartView();
        updateServiceControls(serviceId); // Обновляем только кнопки этого товара
    }

    // НОВАЯ ФУНКЦИЯ: Найти услугу по ID (нужно для подсчета цены)
    function getServiceById(serviceId) {
        for (const categoryId in priceList.services) {
            const service = priceList.services[categoryId].find(s => s.id === serviceId);
            if (service) return service;
        }
        return null;
    }

    // НОВАЯ ФУНКЦИЯ: Обновляет главную кнопку "Корзина"
    function updateCartView() {
        let totalPrice = 0;
        let totalItems = 0;

        for (const serviceId in cart) {
            const quantity = cart[serviceId];
            const service = getServiceById(serviceId);
            
            if (service) {
                totalPrice += service.price * quantity;
                totalItems += quantity;
            }
        }

        if (totalItems === 0) {
            // Если корзина пуста - прячем кнопку
            tg.MainButton.hide();
        } else {
            // Если в корзине что-то есть
            
            let finalPrice = totalPrice;
            let buttonText = `🛒 Корзина (${totalPrice} ₽)`;

            // Проверяем на минимальный заказ
            if (totalPrice < MIN_ORDER_PRICE) {
                finalPrice = MIN_ORDER_PRICE;
                buttonText = `🛒 Корзина (${totalPrice} ₽ / мин. ${MIN_ORDER_PRICE} ₽)`;
            }

            // Показываем Главную Кнопку Telegram
            tg.MainButton.setText(buttonText);
            tg.MainButton.show();
            // ВАЖНО: Мы пока не задали .onClick() для этой кнопки.
            // Это будет в Шаге 5 (Отправка заказа).
        }
    }

    // ----- ОБРАБОТЧИК КЛИКОВ (для кнопок + / -) -----

    // Мы "слушаем" клики по всему контейнеру, но реагируем
    // только на те, что были на кнопках
    appContainer.addEventListener('click', (event) => {
        const target = event.target;
        
        // Клик на кнопку "Добавить"
        if (target.classList.contains('btn-add')) {
            const serviceId = target.dataset.serviceId;
            addToCart(serviceId);
        }
        
        // Клик на кнопки счетчика (+ или -)
        if (target.classList.contains('btn-count')) {
            const serviceId = target.dataset.serviceId;
            const action = target.dataset.action;
            
            if (action === 'add') {
                addToCart(serviceId);
            } else if (action === 'remove') {
                removeFromCart(serviceId);
            }
        }
    });

    // ----- СТАРТ ПРИЛОЖЕНИЯ -----
    showMainScreen(); // Показываем главный экран при запуске
});
