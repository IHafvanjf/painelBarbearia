document.addEventListener('DOMContentLoaded', () => {
    const calendar = document.getElementById('calendar');
    const calendarTitle = document.getElementById('monthYear');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const timeSlots = document.getElementById('timeSlots');
    const slotsList = document.getElementById('slotsList');
    const closeTimeSlots = document.getElementById('closeTimeSlots');
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const closeDeleteConfirmationModal = document.getElementById('closeDeleteConfirmationModal');
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');

    let currentMonth = new Date();
    let currentDate = null;
    let bookings = JSON.parse(localStorage.getItem('bookedDates')) || {};
    let timeSlotsData = JSON.parse(localStorage.getItem('timeSlots')) || {};
    let slotToDelete = null;

    const pusher = new Pusher('c5dc5b55973c301f7482', {
        cluster: 'sa1',
        encrypted: true
    });

    function renderCalendar() {
        const month = currentMonth.getMonth();
        const year = currentMonth.getFullYear();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();
        const endDay = lastDay.getDay();

        calendar.innerHTML = '';

        const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const headerRow = document.createElement('div');
        headerRow.className = 'day-header';
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.textContent = day;
            headerRow.appendChild(dayHeader);
        });
        calendar.appendChild(headerRow);

        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            calendar.appendChild(emptyDay);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = i;

            if (i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                dayElement.classList.add('current-day');
            }

            dayElement.addEventListener('click', () => {
                currentDate = `${year}-${month + 1}-${i}`;
                openTimeSlots();
            });

            if (new Date(year, month, i) < new Date()) {
                dayElement.classList.add('past-day');
            }

            if (bookings[currentDate] && bookings[currentDate].includes(i)) {
                dayElement.classList.add('booked');
            }

            calendar.appendChild(dayElement);
        }

        for (let i = endDay; i < 6; i++) {
            const emptyDay = document.createElement('div');
            calendar.appendChild(emptyDay);
        }

        calendarTitle.textContent = `${currentMonth.toLocaleString('default', { month: 'long' })} ${year}`;
    }

    function openTimeSlots() {
        const dateKey = currentDate;
        slotsList.innerHTML = '';

        if (timeSlotsData[dateKey]) {
            if (timeSlotsData[dateKey].length === 0) {
                slotsList.innerHTML = '<li>Nenhum horário para excluir</li>';
            } else {
                timeSlotsData[dateKey].forEach(slot => {
                    const listItem = document.createElement('li');
                    listItem.textContent = slot;
                    listItem.style.cursor = 'pointer';

                    if (bookings[dateKey] && bookings[dateKey].includes(slot)) {
                        listItem.classList.add('booked');
                        listItem.addEventListener('click', () => {
                            slotToDelete = { dateKey, slot };
                            deleteConfirmationModal.style.display = 'block';
                        });
                    }

                    slotsList.appendChild(listItem);
                });
            }
        } else {
            slotsList.innerHTML = '<li>Nenhum horário para excluir</li>';
        }

        timeSlots.style.display = 'block';
    }

    function closeTimeSlotsFunc() {
        timeSlots.style.display = 'none';
        slotToDelete = null;
    }

    function closeDeleteConfirmationModalFunc() {
        deleteConfirmationModal.style.display = 'none';
    }

    function deleteBooking() {
        if (slotToDelete) {
            const { dateKey, slot } = slotToDelete;

            if (bookings[dateKey]) {
                bookings[dateKey] = bookings[dateKey].filter(s => s !== slot);
                if (bookings[dateKey].length === 0) {
                    delete bookings[dateKey];
                }
            }

            if (timeSlotsData[dateKey]) {
                timeSlotsData[dateKey] = timeSlotsData[dateKey].filter(s => s !== slot);
                if (timeSlotsData[dateKey].length === 0) {
                    delete timeSlotsData[dateKey];
                }
            }

            localStorage.setItem('bookedDates', JSON.stringify(bookings));
            localStorage.setItem('timeSlots', JSON.stringify(timeSlotsData));

            // Envia notificação Pusher de exclusão
            fetch('http://192.168.1.107:3000/pusher-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event: 'booking-deleted',
                    date: dateKey,
                    slot: slot
                })
            }).then(response => response.json())
            .then(data => {
                console.log('Evento Pusher de exclusão enviado:', data);
            }).catch(error => {
                console.error('Erro ao enviar evento Pusher:', error);
            });

            renderCalendar();
            closeTimeSlotsFunc();
            closeDeleteConfirmationModalFunc();
        }
    }

    prevMonth.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });

    nextMonth.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });

    closeTimeSlots.addEventListener('click', closeTimeSlotsFunc);
    closeDeleteConfirmationModal.addEventListener('click', closeDeleteConfirmationModalFunc);
    confirmDelete.addEventListener('click', deleteBooking);
    cancelDelete.addEventListener('click', closeDeleteConfirmationModalFunc);

    renderCalendar();
});
