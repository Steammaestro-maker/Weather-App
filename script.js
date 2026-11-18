// ===== 1. Настройки =====
// Open-Meteo — бесплатный API погоды: без регистрации и ключа
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"; // город → координаты
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";     // координаты → погода
const DEFAULT_CITY = "London"; // город при открытии сайта (можно поменять на свой)

// ===== 2. Элементы страницы =====
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const statusEl = document.getElementById("status");
const weatherEl = document.getElementById("weather");

// ===== 3. Код погоды (WMO) → текст и иконка =====
// API возвращает погоду числом (weather_code), мы переводим его в понятный вид
function describe(code) {
  if (code === 0) return ["Ясно", "☀️"];
  if (code <= 2) return ["Малооблачно", "🌤️"];
  if (code === 3) return ["Пасмурно", "☁️"];
  if (code <= 48) return ["Туман", "🌫️"];
  if (code <= 57) return ["Морось", "🌦️"];
  if (code <= 67) return ["Дождь", "🌧️"];
  if (code <= 77) return ["Снег", "🌨️"];
  if (code <= 82) return ["Ливень", "🌧️"];
  if (code <= 86) return ["Снегопад", "🌨️"];
  return ["Гроза", "⛈️"];
}

// ===== 4. Запросы к API =====
async function getJSON(url) {
  const response = await fetch(url); // отправляем запрос
  if (!response.ok) throw new Error("Ошибка сервера: " + response.status);
  return response.json(); // ответ (JSON) → объект JavaScript
}

async function loadWeather(city) {
  weatherEl.hidden = true;
  statusEl.textContent = "Загрузка…";

  try {
    // Шаг 1: город → координаты
    const geo = await getJSON(
      `${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=ru`
    );
    if (!geo.results) {
      statusEl.textContent = "Город не найден. Проверьте название.";
      return;
    }
    const { name, country, latitude, longitude } = geo.results[0];

    // Шаг 2: координаты → погода
    const data = await getJSON(
      `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&forecast_days=5`
    );

    render(name, country, data);
    statusEl.textContent = "";
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Не удалось загрузить данные. Проверьте подключение к интернету.";
  }
}

// ===== 5. Вывод данных на страницу =====
function render(name, country, data) {
  const now = data.current;
  const [text, icon] = describe(now.weather_code);

  document.getElementById("city").textContent = country ? `${name}, ${country}` : name;
  document.getElementById("temp").textContent = Math.round(now.temperature_2m) + "°";
  document.getElementById("desc").textContent = text;
  document.getElementById("icon").textContent = icon;
  document.getElementById("feels").textContent = Math.round(now.apparent_temperature) + "°";
  document.getElementById("humidity").textContent = now.relative_humidity_2m + "%";
  document.getElementById("wind").textContent = Math.round(now.wind_speed_10m) + " км/ч";

  // Прогноз: по одной строке на каждый день
  const days = data.daily;
  document.getElementById("forecast").innerHTML = days.time.map((date, i) => {
    const day = i === 0
      ? "Сегодня"
      : new Date(date + "T12:00:00").toLocaleDateString("ru-RU", { weekday: "long" });
    const [, dayIcon] = describe(days.weather_code[i]);
    const max = Math.round(days.temperature_2m_max[i]);
    const min = Math.round(days.temperature_2m_min[i]);
    return `<li><span class="day">${day}</span><span class="ico">${dayIcon}</span><span class="range"><b>${max}°</b>${min}°</span></li>`;
  }).join("");

  weatherEl.hidden = false;
}

// ===== 6. События =====
form.addEventListener("submit", (event) => {
  event.preventDefault(); // страница не перезагружается
  const city = input.value.trim();
  if (city) loadWeather(city);
});

loadWeather(DEFAULT_CITY); // первая загрузка при открытии сайта
