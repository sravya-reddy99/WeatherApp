// API keys for weather and city search services
const WEATHER_API_KEY = '3345ad20107471e0ae748102a0c1b009';
const CITY_API_KEY = '5826378f1emsh343557f8a132c9ep151cc0jsndc67c7cf7592';

// Searches for cities matching the provided name prefix, returns top 5 results sorted by population
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

// Fetches 5-day weather forecast data for a given city using OpenWeather API
export const getWeatherData = async (city) => {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) throw new Error('City not found');
    
    return await response.json();
};