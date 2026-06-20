// =============================================
// ارجاع به المان‌های DOM
// =============================================
const timerElement = document.querySelector("#timerDisplay");
const testArea = document.querySelector("#test-area");
const originTextElement = document.querySelector("#origin-text p");
const testWrapper = document.querySelector(".test-wrapper");
const resetBtn = document.querySelector("#reset");
const resultResetBtn = document.querySelector("#resultResetBtn");
const accuracyElement = document.querySelector("#accuracy");
const wpmElement = document.querySelector("#wpm");
const charCountElement = document.querySelector("#charCount");
const themeToggle = document.querySelector("#themeToggle");
const langBtns = document.querySelectorAll(".lang-btn");
const progressBar = document.querySelector("#textProgress");
const stepCounter = document.querySelector("#stepCounter");
const resultModal = document.querySelector("#resultModal");
const resultIcon = document.querySelector("#resultIcon");
const resultTitle = document.querySelector("#resultTitle");
const resultMessage = document.querySelector("#resultMessage");
const finalWpm = document.querySelector("#finalWpm");
const finalAccuracy = document.querySelector("#finalAccuracy");
const finalTime = document.querySelector("#finalTime");

// =============================================
// لیست جملات فارسی و انگلیسی
// =============================================
const persianSentences = [

    "امروز روز خوبی برای شروع است.",
    "تمرین مداوم کلید موفقیت در تایپ است.",
    "سرعت و دقت دو اصل مهم در تایپ هستند.",


];

const englishSentences = [
    "Typing quickly is a skill that comes with practice.",
    "Today is a good day to start.",
    "Continuous practice is the key to typing success.",
    "Speed and accuracy are two important principles in typing.",
    "With each typing session, your skill increases.",
    "Technology helps us type better and faster."
];

let currentLang = "persian";
let currentSentences = [];
let currentStep = 0;
let originText = "";
let isComplete = false;
let totalAccuracy = 0;
let totalWpm = 0;
let stepCount = 0;
let startTime = 0;

// =============================================
// توابع GSAP برای انیمیشن
// =============================================
function animateCardIn() {
    gsap.from(".card", {
        duration: 1,
        y: 50,
        opacity: 0,
        scale: 0.95,
        ease: "power3.out",
        stagger: 0.2
    });
}

function animateTextChange() {
    gsap.from(".origin-text", {
        duration: 0.6,
        x: 30,
        opacity: 0,
        ease: "power2.out"
    });
}

function animateStats() {
    gsap.from(".stat", {
        duration: 0.8,
        y: 20,
        opacity: 0,
        scale: 0.9,
        stagger: 0.15,
        ease: "back.out(1.7)"
    });
}

function animateStepComplete() {
    gsap.to(".pattern-box", {
        duration: 0.3,
        scale: 1.02,
        boxShadow: "0 0 30px rgba(72, 187, 120, 0.2)",
        ease: "power2.out",
        yoyo: true,
        repeat: 1
    });
}

function animateReset() {
    gsap.to(".card", {
        duration: 0.3,
        scale: 0.95,
        ease: "power2.in",
        onComplete: () => {
            gsap.to(".card", {
                duration: 0.5,
                scale: 1,
                ease: "back.out(1.7)"
            });
        }
    });
}

function animateResult() {
    gsap.from(".result-content", {
        duration: 0.6,
        scale: 0.8,
        rotation: -5,
        opacity: 0,
        ease: "back.out(1.7)"
    });

    gsap.from(".result-stat", {
        duration: 0.5,
        y: 20,
        opacity: 0,
        stagger: 0.15,
        delay: 0.3,
        ease: "power2.out"
    });
}

// =============================================
// ایجاد ذرات پس‌زمینه
// =============================================
function createParticles() {
    const container = document.getElementById('particles-bg');
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = (Math.random() * 4 + 2) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
        particle.style.animationDelay = (Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

// =============================================
// توابع تولید جملات
// =============================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateSentences(lang) {
    let sentences = [];
    let count = 5; // تعداد جملات

    if (lang === "persian") {
        sentences = shuffleArray([...persianSentences]).slice(0, count);
    } else if (lang === "english") {
        sentences = shuffleArray([...englishSentences]).slice(0, count);
    } else if (lang === "mixed") {
        let allSentences = [...persianSentences, ...englishSentences];
        sentences = shuffleArray(allSentences).slice(0, count);
    }

    return sentences;
}

// =============================================
// تابع دریافت جمله فعلی
// =============================================
function getCurrentSentence() {
    if (currentStep < currentSentences.length) {
        return currentSentences[currentStep];
    }
    return null;
}

// =============================================
// بارگذاری مرحله بعد
// =============================================
function loadNextStep() {
    if (currentStep < currentSentences.length) {
        originText = currentSentences[currentStep];
        originTextElement.textContent = originText;
        stepCounter.textContent = `${currentStep + 1} / ${currentSentences.length}`;
        progressBar.style.width = `${((currentStep) / currentSentences.length) * 100}%`;
        testArea.value = "";
        testArea.disabled = false;
        testArea.focus();
        charCountElement.innerHTML = "0";
        animateTextChange();
    } else {
        // پایان تمام مراحل
        showResult();
    }
}

// =============================================
// نمایش نتیجه نهایی
// =============================================
function showResult() {
    testArea.disabled = true;
    clearInterval(interval);
    timerRunning = false;

    const avgAccuracy = Math.floor(totalAccuracy / stepCount);
    const avgWpm = Math.floor(totalWpm / stepCount);
    const timeSpent = timerElement.textContent;

    finalWpm.textContent = avgWpm;
    finalAccuracy.textContent = avgAccuracy + '%';
    finalTime.textContent = timeSpent;

    // تعیین پیغام بر اساس عملکرد
    let icon, title, message;

    if (avgWpm >= 40 && avgAccuracy >= 90) {
        icon = '🏆';
        title = 'عالی!';
        message = 'شما یک تایپیست حرفه‌ای هستید! سرعت و دقت شما فوق‌العاده است.';
    } else if (avgWpm >= 30 && avgAccuracy >= 80) {
        icon = '🌟';
        title = 'خیلی خوب!';
        message = 'شما عملکرد خوبی داشتید. با کمی تمرین بیشتر به سطح حرفه‌ای می‌رسید.';
    } else if (avgWpm >= 20 && avgAccuracy >= 70) {
        icon = '📈';
        title = 'متوسط';
        message = 'شما در مسیر درستی هستید. تمرین بیشتر باعث بهبود سرعت و دقت شما می‌شود.';
    } else {
        icon = '💪';
        title = 'نیاز به تمرین!';
        message = 'نگران نباشید، تایپ یک مهارت است و با تمرین بهبود می‌یابد. ادامه دهید!';
    }

    resultIcon.textContent = icon;
    resultTitle.textContent = title;
    resultMessage.textContent = message;

    resultModal.classList.add('active');
    animateResult();
}

// =============================================
// متغیرهای تایمر
// =============================================
var timer = [0, 0, 0, 0];
var timerRunning = false;
var interval;

// =============================================
// توابع کمکی
// =============================================
function leadingZero(time) {
    return time <= 9 ? "0" + time : time;
}

// =============================================
// تابع اجرای تایمر
// =============================================
function runTimer() {
    let currentTime = leadingZero(timer[0]) + ":" + leadingZero(timer[1]) + ":" + leadingZero(timer[2]);
    timerElement.innerHTML = currentTime;

    timer[3]++;

    timer[0] = Math.floor(timer[3] / 100 / 60);
    timer[1] = Math.floor(timer[3] / 100 - (timer[0] * 60));
    timer[2] = Math.floor(timer[3] - (timer[1] * 100) - (timer[0] * 1000));

    calculateWPM();
}

// =============================================
// آپدیت پیشرفت متن
// =============================================
function updateProgress() {
    let textEntered = testArea.value;
    let progress = (textEntered.length / originText.length) * 100;
    progressBar.style.width = Math.min(progress, 100) + '%';
}

// =============================================
// محاسبه دقت
// =============================================
function calculateAccuracy() {
    let textEntered = testArea.value;
    let correctChars = 0;

    for (let i = 0; i < textEntered.length; i++) {
        if (i < originText.length && textEntered[i] === originText[i]) {
            correctChars++;
        }
    }

    let accuracy = textEntered.length === 0 ? 100 : (correctChars / textEntered.length) * 100;
    accuracyElement.innerHTML = Math.floor(accuracy) + "%";

    if (accuracy >= 90) {
        accuracyElement.style.color = '#48bb78';
    } else if (accuracy >= 70) {
        accuracyElement.style.color = '#ecc94b';
    } else {
        accuracyElement.style.color = '#f56565';
    }

    return accuracy;
}

// =============================================
// محاسبه سرعت (WPM)
// =============================================
function calculateWPM() {
    let textEntered = testArea.value;
    let wordsTyped = textEntered.trim().split(/\s+/).filter(word => word.length > 0).length;
    let minutesElapsed = (timer[0] * 60 + timer[1] + timer[2] / 100) / 60;

    let wpm = minutesElapsed > 0 ? Math.floor(wordsTyped / minutesElapsed) : 0;
    wpmElement.innerHTML = wpm;
    return wpm;
}

// =============================================
// بررسی املای کلمات
// =============================================
function spellcheck() {
    if (testArea.disabled) return;

    let textEntered = testArea.value;
    let originTextMatch = originText.substring(0, textEntered.length);

    charCountElement.innerHTML = textEntered.length;

    let accuracy = calculateAccuracy();
    let wpm = calculateWPM();

    if (textEntered === originText) {
        // مرحله کامل شد
        testWrapper.style.border = "3px solid #48bb78";
        testArea.disabled = true;
        clearInterval(interval);
        timerRunning = false;

        // ذخیره آمار این مرحله
        totalAccuracy += accuracy;
        totalWpm += wpm;
        stepCount++;

        animateStepComplete();

        // رفتن به مرحله بعد
        currentStep++;
        setTimeout(() => {
            loadNextStep();
            // شروع مجدد تایمر
            timer = [0, 0, 0, 0];
            timerRunning = false;
            if (currentStep < currentSentences.length) {
                testArea.focus();
            }
        }, 800);
    } else {
        if (textEntered === originTextMatch) {
            testWrapper.style.border = "3px solid #ecc94b";
        } else {
            testWrapper.style.border = "3px solid #f56565";
        }
    }
}

// =============================================
// ریست کردن تست
// =============================================
function reset() {
    clearInterval(interval);
    interval = null;
    timer = [0, 0, 0, 0];
    timerRunning = false;
    isComplete = false;
    totalAccuracy = 0;
    totalWpm = 0;
    stepCount = 0;
    currentStep = 0;

    testArea.value = "";
    testArea.disabled = false;
    timerElement.innerHTML = "00:00:00";
    testWrapper.style.border = "3px solid rgba(226, 232, 240, 0.8)";
    accuracyElement.innerHTML = "100%";
    wpmElement.innerHTML = "0";
    charCountElement.innerHTML = "0";
    progressBar.style.width = "0%";
    resultModal.classList.remove('active');

    // تولید جملات جدید
    currentSentences = generateSentences(currentLang);
    loadNextStep();

    animateReset();
}

// =============================================
// شروع تایمر
// =============================================
function start() {
    let textEnteredLength = testArea.value.length;
    if (textEnteredLength === 0 && !timerRunning && !testArea.disabled) {
        timerRunning = true;
        interval = setInterval(runTimer, 10);
    }
}

// =============================================
// تغییر زبان متن
// =============================================
function changeLanguage(lang) {
    currentLang = lang;
    resultModal.classList.remove('active');
    reset();

    langBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
}

// =============================================
// تغییر تم (لایت/دارک مود)
// =============================================
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');

    if (isDark) {
        themeToggle.innerHTML = '<span class="icon">☀️</span><span class="text">لایت مود</span>';
    } else {
        themeToggle.innerHTML = '<span class="icon">🌙</span><span class="text">دارک مود</span>';
    }
}

// =============================================
// رویدادها (Event Listeners)
// =============================================
testArea.addEventListener("keypress", start);
testArea.addEventListener("keyup", spellcheck);
resetBtn.addEventListener("click", reset);
resultResetBtn.addEventListener("click", reset);

langBtns.forEach(btn => {
    btn.addEventListener("click", function() {
        let lang = this.dataset.lang;
        changeLanguage(lang);
    });
});

themeToggle.addEventListener("click", toggleTheme);

// =============================================
// تنظیم اولیه
// =============================================
createParticles();
changeLanguage('persian');

window.addEventListener('load', () => {
    animateCardIn();
    setTimeout(animateStats, 500);
});