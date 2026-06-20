var cityInput = document.getElementById("cityInput");
var addInput = document.getElementById("add");
var cityOutput = document.getElementById("cityoutput");
var descOutput = document.getElementById("description");
var tempOutput = document.getElementById("temp");
var windOutput = document.getElementById("wind");
const apiKey = "55780ea01cf2bbc88377da3f7bd25a01";

function convertToCel(value) {
    return (value - 273.15).toFixed(2);
}

async function GetWeather() {
    if (!cityInput.value.trim()) {
        alert("لطفاً نام شهر را وارد کنید");
        return;
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${cityInput.value}&appid=${apiKey}`
        );

        if (!response.ok) {
            throw new Error("شهر مورد نظر یافت نشد");
        }

        const weatherResult = await response.json();
        setInfo(weatherResult);
    } catch (error) {
        alert(error.message);
        console.error("خطا:", error);
    }
}

function setInfo(data) {
    var cityName = data["name"];
    var description = data["weather"][0]["description"];
    var temp = data["main"]["temp"];
    var wind = data["wind"]["speed"];

    cityOutput.innerHTML = `شهر: ${cityName}`;
    descOutput.innerHTML = `وضعیت: ${description}`;
    tempOutput.innerHTML = `دما: ${convertToCel(temp)} درجه سانتی‌گراد`;
    windOutput.innerHTML = `سرعت باد: ${wind} کیلومتر بر ساعت`;
}

addInput.addEventListener("click", GetWeather);

// اضافه کردن قابلیت Enter کردن
cityInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        GetWeather();
    }
});