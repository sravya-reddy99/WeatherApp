# Weather App

A simple and responsive weather application built with React. This app allows users to search for cities and view real-time weather updates, including an hourly forecast and other details such as temperature, humidity, and wind speed.

## Features

- **City Search**: Quickly search for any city worldwide and get accurate weather information.
- **Hourly Forecast**: View the upcoming weather forecast for the next few hours.
- **Dynamic Backgrounds**: Background visuals change based on current weather conditions.
- **Recent Searches**: Track recent search history for easy access.
- **Responsive Design**: Built with Tailwind CSS for optimized, responsive layouts.

## Tech Stack

- **React**: Frontend library for building interactive user interfaces.
- **Tailwind CSS**: Utility-first CSS framework for responsive and modern styling.
- **OpenWeather API**: Provides weather data and hourly forecast information.
- **GeoDB Cities API**: Allows city search and geolocation data.

## Getting Started

### Prerequisites

- **Node.js**: Make sure you have Node.js installed on your machine. You can download it [here](https://nodejs.org/).

### Installation

**Clone the repository**:

   git clone https://github.com/your-username/WeatherApp.git
   cd WeatherApp

### Install dependencies:

npm install

### Create a .env file in the root directory to store your API keys:

REACT_APP_WEATHER_API_KEY=your_openweather_api_key
REACT_APP_CITY_API_KEY=your_geodb_city_api_key

Replace your_openweather_api_key and your_geodb_city_api_key with your actual API keys from OpenWeather and GeoDB Cities.

### Run the application:

npm start

