import React, { useState, useEffect } from 'react';
import './RouteSelector.css';

const RouteSelector = ({
  mapOptions,
  selectedMap,
  onMapChange,
  selectedCity1,
  selectedCity2,
  onCalculateRoute,
  route,
  onSelectionChange,
  cities,
  loading
}) => {
  const [isRouteCalculated, setIsRouteCalculated] = useState(false);
  const [localSelectedCity1, setLocalSelectedCity1] = useState(selectedCity1);
  const [localSelectedCity2, setLocalSelectedCity2] = useState(selectedCity2);

  useEffect(() => {
    setLocalSelectedCity1(selectedCity1);
    setLocalSelectedCity2(selectedCity2);
  }, [selectedCity1, selectedCity2]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSelectionChange(localSelectedCity1, localSelectedCity2);
    onCalculateRoute(localSelectedCity1, localSelectedCity2);
    setIsRouteCalculated(true);
  };

  const handleCity1Change = (event) => {
    setLocalSelectedCity1(event.target.value);
    setIsRouteCalculated(false);  // Clear route field when city selection changes
  };

  const handleCity2Change = (event) => {
    setLocalSelectedCity2(event.target.value);
    setIsRouteCalculated(false);  // Clear route field when city selection changes
  };

  return (
    <div className="route-selector-container">
      <div className="map-selector">
        <label htmlFor="map-select">Select Map:</label>
        <select id="map-select" value={selectedMap} onChange={onMapChange}>
          <option value="" disabled>Select a map</option>
          {mapOptions.map((map) => (
            <option key={map} value={map}>{map}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div>Loading cities...</div>
      ) : (
        <form className="route-selector-form" onSubmit={handleSubmit}>
          <div className="selected-city-display">
            <label>
              City 1:
              <select
                value={localSelectedCity1}
                onChange={handleCity1Change}
              >
                <option value="">Select a city</option>
                {cities.map(city => (
                  <option key={city.name} value={city.name}>{city.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="selected-city-display">
            <label>
              City 2:
              <select
                value={localSelectedCity2}
                onChange={handleCity2Change}
              >
                <option value="">Select a city</option>
                {cities.map(city => (
                  <option key={city.name} value={city.name}>{city.name}</option>
                ))}
              </select>
            </label>
          </div>
          <button className='calculate-button' type="submit">
            Calculate Route
          </button>
        </form>
      )}
      {isRouteCalculated && route && (
        <div className="route-display">
          Shortest Route: {route}
        </div>
      )}
    </div>
  );
};

export default RouteSelector;