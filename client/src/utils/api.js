const WEATHER_API_KEY = '3345ad20107471e0ae748102a0c1b009';
const CITY_API_KEY = '5826378f1emsh343557f8a132c9ep151cc0jsndc67c7cf7592';

export const searchCities = async (namePrefix) => {
  const url = `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${namePrefix}&limit=5&sort=-population`;

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': CITY_API_KEY,
      'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
    }
  };

  const response = await fetch(url, options);
  const data = await response.json();
  return data.data || [];
};

export const getWeatherData = async (city) => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric`
  );

  if (!response.ok) throw new Error('City not found');
  return await response.json();
};

export const getWeatherByCoordinates = async (lat, lon) => {
  // NOTE: this returns "current weather" shape (no list/city)
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch weather data by coordinates.');
  return await response.json();
};

//forecast directly by coordinates to match your UI shape
export const getForecastByCoordinates = async (lat, lon) => {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch forecast by coordinates.');
  return await response.json();
};

// UV index via One Call (requires OpenWeather One Call access)
export const getOneCallByCoordinates = async (lat, lon) => {
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${WEATHER_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('One Call not available for this key/plan.');
  return await response.json();
};