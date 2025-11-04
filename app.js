document.addEventListener('DOMContentLoaded', () => {

    // 
    // ***** КОНФИГУРАЦИЯ *****
    //
    const YOUR_BOT_TOKEN = '8590877518:AAFwm5LqTunjOnvFs2eRFpE-s2buJneBio4';
    const YOUR_CHAT_ID = '5844521663'; 
    //
    // *********************************************************
    //

    // 1. Инициализация Telegram
    const tg = window.Telegram.WebApp;
    if (!tg) {
        // Fallback для диагностики, если tg не загружен
        document.getElementById('app-container').innerHTML = '<h2>Ошибка: Telegram WebApp не загружен.</h2>';
        return;
    }
    tg.ready();

    // 2. Получаем главный контейнер
    const appContainer = document.getElementById('app-container');

    // 3. Данные (Прайс-лист)
    const priceList = {
        "categories": [
            { "id": "electro", "title": "Электрика", "icon": "⚡️" },
            { "id": "plumbing", "title": "Сантехника", "icon": "🔧" },
            { "id": "assembly", "title": "Сборка и установка мебели", "icon": "🪚" },
            { "id": "doors", "title": "Двери и окна", "icon": "🚪" },
            { "id": "fasteners", "title": "Крепёж и навес", "icon": "🧗" }
        ],
        "services": {
            "electro": [
                { "id": "e1", "title": "Замена розетки / выключателя", "price": 1000 },
                { "id": "e2", "title": "Установка люстры", "price": 3000 }
            ],
            "plumbing": [
                { "id": "p1", "title": "Замена смесителя", "price": 2500 },
                { "id": "p2", "title": "Замена унитаза", "price": 3500 }
            ],
            "assembly": [
                { "id": "a1", "title": "Сборка шкафа", "price": 5000 }
            ],
            "doors": [
                { "id": "d1", "title": "Установка межкомнатной двери", "price": 6000 }
            ],
            "fasteners": [
                { "id": "f1", "title": "Навесить телевизор (бетон)", "price": 3500 }
            ]
        }
    };
    
    let cart = {};
    const MIN_ORDER_PRICE = 4000;

    // ----- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (без изменений) -----

    function getServiceById(serviceId) {
        for (const categoryId in priceList.services) {
            const service = priceList.services[categoryId].find(s => s.id === serviceId);
            if (service) return service;
        }
        return null;
    }

    function calculateCartTotal() {
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
        return { totalPrice, totalItems };
    }

    // ----- ОСНОВНЫЕ ФУНКЦИИ ЭКРАНОВ -----

    function showMainScreen() {
        appContainer.innerHTML = '<h2>Какая помощь вам нужна?</h2>';
        priceList.categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-button';
            button.innerHTML = `<span>${category.icon}</span> ${category.title}`;
            button.onclick = () => { showServicesScreen(category.id); };
            appContainer.appendChild(button);
        });
        tg.BackButton.hide();
        updateCartView();
    }

    function showServicesScreen(categoryId) {
        const category = priceList.categories.find(c => c.id === categoryId);
        const services = priceList.services[categoryId] || [];
        
        appContainer.innerHTML = `<h2 class="category-title">${category.icon} ${category.title}</h2>`;

        services.forEach(service => {
            const item = document.createElement('div');
            item.className = 'service-item';
            item.innerHTML = `
                <div class="service-details">
                    <span class="service-title">${service.title}</span>
                    <span class="service-price">${service.price} ₽</span>
                </div>
                <div class="service-controls" id="controls-${service.id}"></div>
            `;
            appContainer.appendChild(item);
            updateServiceControls(service.id);
        });

        tg.BackButton.show();
        tg.BackButton.onClick(showMainScreen);
        updateCartView();
    }

    // Экран Оформления Заказа
    function showOrderScreen() {
        const { totalPrice, totalItems } = calculateCartTotal();
        if (totalItems === 0) {
            showMainScreen();
            return;
        }

        let finalPrice = Math.max(totalPrice, MIN_ORDER_PRICE);
        
        appContainer.innerHTML = `
            <h2>Оформление заказа</h2>
            <p><strong>Сумма заказа:</strong> ${totalPrice} ₽</p>
            ${totalPrice < MIN_ORDER_PRICE ? `<p class="note">⚠️ Минимальный заказ ${MIN_ORDER_PRICE} ₽. Итого к оплате: ${finalPrice} ₽</p>` : ''}
            
            <form id="order-form" class="order-form">
                <label for="address">Адрес (город, улица, дом, кв)</label>
                <input type="text" id="address" required placeholder="Москва, Тверская, 10, кв 5">
                
                <label for="phone">Ваш телефон</label>
                <input type="tel" id="phone" required placeholder="+7 999 123-45-67">

                <label for="comment">Комментарий для мастера (необязательно)</label>
                <input type="text" id="comment" placeholder="Нужен стремянка, старый фонд">
            </form>
        `;
        
        // *** НОВОЕ: Принудительная отрисовка и фокус ***
        // Даем браузеру секунду, чтобы отрисовать форму, затем ставим фокус
        setTimeout(() => {
            const addressInput = document.getElementById('address');
            if (addressInput) {
                addressInput.focus();
                addressInput.blur(); // Сразу убираем фокус, чтобы не вызывать клавиатуру
            }
        }, 100);
        // **********************************************

        tg.MainButton.setText(`ПОДТВЕРДИТЬ ЗАКАЗ на ${finalPrice} ₽`);
        tg.MainButton.show();
        tg.MainButton.onClick(handleSendOrder);
        
        tg.BackButton.show();
        tg.BackButton.onClick(updateCartView); 
    }

    function updateCartView() {
        const { totalPrice, totalItems } = calculateCartTotal();

        if (totalItems === 0) {
            tg.MainButton.hide();
            tg.BackButton.onClick(showMainScreen);
        } else {
            let finalPrice = Math.max(totalPrice, MIN_ORDER_PRICE);
            let buttonText = `🛒 Корзина (${totalPrice} ₽ / Итого: ${finalPrice} ₽)`;
            
            tg.MainButton.setText(buttonText);
            tg.MainButton.show();
            
            tg.MainButton.onClick(showOrderScreen);
        }
    }

   // ФУНКЦИЯ ОТПРАВКИ ЗАКАЗА В TELEGRAM
async function handleSendOrder() {
    
    // *** НОВОЕ: Принудительно убираем фокус со всех полей ввода ***
    document.querySelectorAll('.order-form input').forEach(input => {
        if (document.activeElement === input) {
            input.blur();
        }
    });
    // ************************************************************

    const addressElement = document.getElementById('address');
    const phoneElement = document.getElementById('phone');
    const commentElement = document.getElementById('comment');
    
    // **УСИЛЕННАЯ ПРОВЕРКА:**
    if (!addressElement || !phoneElement || !addressElement.value.trim() || !phoneElement.value.trim()) { 
        alert("Пожалуйста, заполните Адрес и Телефон.");
        return;
    }
    
    // ... (Остальной код функции без изменений, начиная с: const address = addressElement.value; ...)

    const address = addressElement.value;
    const phone = phoneElement.value;
    const comment = commentElement.value;
    
    // 1. Формируем список заказа для сообщения
    // ... (остальной код формирования сообщения)

    // 2. Отправляем через Telegram API
    const url = `https://api.telegram.org/bot${YOUR_BOT_TOKEN}/sendMessage`;
    
    try {
        // ... (блок try...catch для отправки)
        tg.MainButton.showProgress(true);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: YOUR_CHAT_ID,
                text: orderDetails,
                parse_mode: 'Markdown' 
            })
        });

        if (response.ok) {
            showSuccessScreen(phone);
        } else {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.description || 'Unknown error'}`);
        }
    } catch (error) {
        alert(`Ошибка! Не удалось отправить заказ. Проверьте токен бота и Chat ID. ${error.message}`);
        console.error("Sending error:", error);
        showMainScreen(); 
    } finally {
        tg.MainButton.hideProgress();
    }
}
    function showSuccessScreen(phone) {
        appContainer.innerHTML = `
            <h2>🎉 Заказ принят!</h2>
            <p>В ближайшее время менеджер свяжется с вами по номеру <strong>${phone}</strong>.</p>
        `;
        cart = {};
        tg.MainButton.setText("ЗАКРЫТЬ");
        tg.MainButton.onClick(() => { tg.close(); }); 
        tg.BackButton.hide();
    }

    // ... (Остальные функции корзины и обработчики кликов без изменений) ...
    function updateServiceControls(serviceId) {
        const controlsContainer = document.getElementById(`controls-${serviceId}`);
        if (!controlsContainer) return;

        const quantity = cart[serviceId] || 0;

        if (quantity === 0) {
            controlsContainer.innerHTML = `<button class="btn-add" data-service-id="${serviceId}">Добавить</button>`;
        } else {
            controlsContainer.innerHTML = `
                <button class="btn-count" data-action="remove" data-service-id="${serviceId}">-</button>
                <span class="count">${quantity}</span>
                <button class="btn-count" data-action="add" data-service-id="${serviceId}">+</button>
            `;
        }
    }

    function addToCart(serviceId) {
        cart[serviceId] = (cart[serviceId] || 0) + 1;
        updateCartView();
        updateServiceControls(serviceId);
    }

    function removeFromCart(serviceId) {
        cart[serviceId] = (cart[serviceId] || 0) - 1;
        if (cart[serviceId] <= 0) {
            delete cart[serviceId];
        }
        updateCartView();
        updateServiceControls(serviceId);
    }
    
    appContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('btn-add')) {
            addToCart(target.dataset.serviceId);
        }
        if (target.classList.contains('btn-count')) {
            const action = target.dataset.action;
            if (action === 'add') {
                addToCart(target.dataset.serviceId);
            } else if (action === 'remove') {
                removeFromCart(target.dataset.serviceId);
            }
        }
    });

    // ----- СТАРТ ПРИЛОЖЕНИЯ -----
    showMainScreen(); 
});
