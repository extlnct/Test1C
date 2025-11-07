// Глобальные переменные
let currentPageQuestions = null;
let currentPart = 'A';
let currentQuestionIndex = 0;
let selectedAnswer = null;
let shuffledQuestions = {}; // Храним перемешанные вопросы для каждой части
let currentShuffledAnswers = []; // Текущие перемешанные ответы для отображения
let currCount = 0;
let countA = 0;
let countB = 0;
let countC = 0;
let countD = 0;
let countE = 0;
let totalTime = 15 * 60; // 15 минут в секундах
let timerInterval = null;
let isAnswerSelected = false; // Флаг, что ответ уже выбран


function startTimer() {
    const timerElement = document.getElementById('timer');

    // Останавливаем предыдущий таймер если был
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    totalTime = 15 * 60; // Сбрасываем время
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        totalTime--;
        updateTimerDisplay();

        if (totalTime <= 0) {
            clearInterval(timerInterval);
            completeTest();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Меняем цвет при малом времени
        if (totalTime <= 300) { // 5 минут
            timerElement.style.color = '#ff4444';
        } else {
            timerElement.style.color = '';
        }
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Элементы DOM
let questionElement, progressElement, progressPartsElement, checkboxes, labels, nextBtn, feedbackElement, nextBt, startBt, paddingElements;

// Функция для перемешивания массива (алгоритм Фишера-Йейтса)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Функция для случайного выбора N вопросов из массива
function selectRandomQuestions(questions, count) {
    // Создаем копию массива вопросов
    const questionsCopy = [...questions];
    // Перемешиваем вопросы
    const shuffled = shuffleArray(questionsCopy);
    // Берем первые count вопросов
    return shuffled.slice(0, count);
}

// Функция для перемешивания вопросов в части (ОБНОВЛЕННАЯ)
function shuffleQuestionsForPart(partQuestions) {
    // Выбираем случайные 5 вопросов из 10
    const randomQuestions = selectRandomQuestions(partQuestions, 5);

    // Для каждого выбранного вопроса перемешиваем варианты ответов
    return randomQuestions.map(question => {
        // Создаем массив индексов ответов [0, 1, 2, 3]
        const answerIndices = question.options.map((_, index) => index);
        // Перемешиваем индексы
        const shuffledIndices = shuffleArray(answerIndices);

        // Создаем новые перемешанные варианты ответов
        const shuffledOptions = shuffledIndices.map(index => question.options[index]);

        // Находим новый индекс правильного ответа
        const newCorrectAnswer = shuffledIndices.indexOf(question.correctAnswer);

        return {
            ...question,
            options: shuffledOptions,
            correctAnswer: newCorrectAnswer,
            originalCorrectAnswer: question.correctAnswer, // Сохраняем оригинальный для отладки
            shuffleMap: shuffledIndices // Сохраняем карту перемешивания
        };
    });
}

// Функция для сброса счетчиков
function resetCounters() {
    currCount = 0;
    countA = 0;
    countB = 0;
    countC = 0;
    countD = 0;
    countE = 0;
    isAnswerSelected = false;
}

// Функция для увеличения счетчика текущей части
function incrementPartCounter(isCorrect) {
    if (isCorrect) {
        switch (currentPart) {
            case 'A': countA++; break;
            case 'B': countB++; break;
            case 'C': countC++; break;
            case 'D': countD++; break;
            case 'E': countE++; break;
        }
    }
}

// Инициализация теста
function initTest() {
    // Определяем текущую страницу
    const currentPage = window.location.pathname.split('/').pop() || 'index1.html';

    // Получаем вопросы для текущей страницы
    currentPageQuestions = questionsByPage[currentPage];

    if (!currentPageQuestions) {
        console.error('Вопросы для страницы ' + currentPage + ' не найдены');
        return;
    }

    // Сбрасываем счетчики при инициализации
    resetCounters();

    // Перемешиваем вопросы для всех частей
    shuffledQuestions = {};
    for (const part in currentPageQuestions) {
        shuffledQuestions[part] = shuffleQuestionsForPart(currentPageQuestions[part]);
    }

    // Находим элементы только после загрузки DOM
    questionElement = document.getElementById('question');
    progressElement = document.querySelector('.progress');
    progressPartsElement = document.querySelector('.progressParts');
    checkboxes = document.querySelectorAll('input[type="checkbox"]');
    labels = document.querySelectorAll('.padding label');
    nextBtn = document.querySelector('.next-btn');
    feedbackElement = document.getElementById('feedback');
    nextBt = document.getElementById('nextTBtn');
    startBt = document.getElementById('startBtn');
    paddingElements = document.querySelectorAll('.padding');

    // Проверяем, что все элементы найдены
    if (!questionElement || !progressElement || !progressPartsElement || checkboxes.length === 0 || labels.length === 0 || !nextBtn || !feedbackElement) {
        console.error('Не все элементы найдены в DOM');
        return;
    }

    startTimer();

    // Скрываем кнопки "В начало" и "Следующий тест" при старте
    if (nextBt) nextBt.style.display = 'none';
    if (startBt) startBt.style.display = 'none';

    showQuestion(currentQuestionIndex);
    setupEventListeners();
}

// Показать вопрос
function showQuestion(index) {
    const questions = shuffledQuestions[currentPart];
    const question = questions[index];

    if (questionElement) {
        questionElement.textContent = question.question;
    }

    if (progressElement) {
        progressElement.textContent = `Вопрос ${index + 1} из ${questions.length}`;
    }

    if (progressPartsElement) {
        progressPartsElement.textContent = `Часть ${currentPart}`;
    }

    if (labels && labels.length > 0) {
        question.options.forEach((option, optionIndex) => {
            if (labels[optionIndex]) {
                labels[optionIndex].textContent = option;
            }
        });
    }

    resetCheckboxes();
    hideFeedback();
    if (nextBtn) {
        nextBtn.style.display = 'none';
    }
    selectedAnswer = null;
    isAnswerSelected = false;
    
    // Разблокируем все элементы для нового вопроса
    enableAnswerElements();
}

// Сброс чекбоксов
function resetCheckboxes() {
    if (checkboxes && checkboxes.length > 0) {
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.disabled = false;
            if (checkbox.parentElement) {
                checkbox.parentElement.classList.remove('correct', 'incorrect');
            }
        });
    }
}

// Включить элементы ответа
function enableAnswerElements() {
    if (paddingElements && paddingElements.length > 0) {
        paddingElements.forEach(padding => {
            padding.style.pointerEvents = 'auto';
            padding.style.opacity = '1';
        });
    }
}

// Заблокировать элементы ответа
function disableAnswerElements() {
    if (paddingElements && paddingElements.length > 0) {
        paddingElements.forEach(padding => {
            padding.style.pointerEvents = 'none';
            // Можно добавить легкое затемнение для визуального обозначения блокировки
            padding.style.opacity = '0.9';
        });
    }
}

// Скрыть обратную связь
function hideFeedback() {
    if (feedbackElement) {
        feedbackElement.style.display = 'none';
        feedbackElement.className = 'feedback';
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчики для клика по блоку ответа
    if (paddingElements && paddingElements.length > 0) {
        paddingElements.forEach((padding, index) => {
            padding.addEventListener('click', function() {
                // Если ответ уже выбран, игнорируем клик
                if (isAnswerSelected) return;
                
                // Снимаем выделение со всех чекбоксов
                checkboxes.forEach((cb, i) => {
                    cb.checked = i === index;
                });
                
                // Устанавливаем выбранный ответ
                selectedAnswer = index;
                isAnswerSelected = true;
                
                // Блокируем все элементы ответа
                disableAnswerElements();
                
                checkAnswer();
            });
        });
    }

    // Обработчики для чекбоксов (на случай прямого клика по чекбоксу)
    if (checkboxes && checkboxes.length > 0) {
        checkboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', function () {
                // Если ответ уже выбран, игнорируем изменение
                if (isAnswerSelected) {
                    this.checked = false;
                    return;
                }
                
                if (this.checked) {
                    checkboxes.forEach((cb, i) => {
                        if (i !== index) {
                            cb.checked = false;
                        }
                    });
                    selectedAnswer = index;
                    isAnswerSelected = true;
                    
                    // Блокируем все элементы ответа
                    disableAnswerElements();
                    
                    checkAnswer();
                } else {
                    selectedAnswer = null;
                }
            });
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextQuestion);
    }

    // Добавляем обработчики для кнопок "В начало" и "Следующий тест"
    if (nextBt) {
        nextBt.addEventListener('click', function () {
            stopTimer();
            // Логика перехода к следующему тесту
            const currentPage = window.location.pathname.split('/').pop();
            const pageNumber = parseInt(currentPage.replace('index', '').replace('.html', ''));
            if (pageNumber < 17) {
                window.location.href = `index${pageNumber + 1}.html`;
            }
        });
    }

    if (startBt) {
        startBt.addEventListener('click', function () {
            stopTimer();
            // Возврат на главную страницу
            window.location.href = 'index.html';
        });
    }
}

// Проверка ответа
function checkAnswer() {
    if (selectedAnswer === null) return;

    const questions = shuffledQuestions[currentPart];
    const question = questions[currentQuestionIndex];
    const correctAnswer = question.correctAnswer;
    const isCorrect = selectedAnswer === correctAnswer;

    if (checkboxes && checkboxes.length > 0) {
        checkboxes.forEach(checkbox => {
            checkbox.disabled = true;
        });

        checkboxes.forEach((checkbox, index) => {
            if (checkbox.parentElement) {
                if (index === correctAnswer) {
                    checkbox.parentElement.classList.add('correct');
                } else if (index === selectedAnswer && !isCorrect) {
                    checkbox.parentElement.classList.add('incorrect');
                }
            }
        });
    }

    if (feedbackElement) {
        feedbackElement.innerHTML = isCorrect ?
            "🖤 Правильно! 🖤" :
            `<img src='../images/heart.png' style='width:12px'> Неправильно! <img src='../images/heart.png' style='width: 12px'>`;
        feedbackElement.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedbackElement.style.display = 'block';
    }

    if (nextBtn) {
        nextBtn.style.display = 'block';
    }

    if (isCorrect) {
        currCount++;
        incrementPartCounter(true); // Увеличиваем счетчик текущей части
    }
}

// Следующий вопрос
function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < shuffledQuestions[currentPart].length) {
        showQuestion(currentQuestionIndex);
    } else {
        goToNextPart();
    }
}

// Переход к следующей части
function goToNextPart() {
    const parts = ['A', 'B', 'C', 'D', 'E'];
    const currentIndex = parts.indexOf(currentPart);

    if (currentIndex < parts.length - 1) {
        currentPart = parts[currentIndex + 1];
        currentQuestionIndex = 0;
        showQuestion(currentQuestionIndex);
    } else {
        completeTest();
    }
}

function completeTest() {
    stopTimer();
    if (questionElement) {
        questionElement.innerHTML = `Тест завершен! Поздравляем!<br>
        Всего: ${currCount} правильных ответов из 25<br>
        Часть A: ${countA} из 5<br>
        Часть B: ${countB} из 5<br>
        Часть C: ${countC} из 5<br>
        Часть D: ${countD} из 5<br>
        Часть E: ${countE} из 5`;
    }

    const paddingElements = document.querySelectorAll('.padding');
    if (paddingElements && paddingElements.length > 0) {
        paddingElements.forEach(padding => {
            padding.style.display = 'none';
        });
    }

    if (nextBtn) {
        nextBtn.style.display = 'none';
    }

    if (nextBt) {
        nextBt.style.display = 'block';
    }

    if (startBt) {
        startBt.style.display = 'block';
    }

    if (feedbackElement) {
        feedbackElement.style.display = 'none';
    }

    if (progressPartsElement) {
        progressPartsElement.style.display = 'none';
    }

    if (progressElement) {
        progressElement.textContent = "Все части пройдены";
    }
}

// Запуск теста при загрузке страницы
document.addEventListener('DOMContentLoaded', initTest);