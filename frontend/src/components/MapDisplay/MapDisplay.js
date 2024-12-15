import './MapDisplay.css';

const MapDisplay = ({ cities, connections, selectedCity1, selectedCity2, onCitySelect, shortestPath }) => {
  const viewBox = `0 0 3066 2326`; // Adjust these values based on your map dimensions

  const handleCityClick = (cityName) => {
    onCitySelect(cityName);
  };

  const isSelected = (cityName) => {
    return cityName === selectedCity1 || cityName === selectedCity2;
  };

  const isPartOfShortestPath = (city1, city2) => {
    for (let i = 0; i < shortestPath.length - 1; i++) {
      if (
        (shortestPath[i] === city1 && shortestPath[i + 1] === city2) ||
        (shortestPath[i] === city2 && shortestPath[i + 1] === city1)
      ) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="map-container">
      <svg className="map-svg" viewBox={viewBox}>
        <image href="map-image.jpeg" x="0" y="0" width="3066" height="2326" />
        {connections.map((connection, index) => {
          const { parent, child } = connection;
          const parentCity = cities.find(city => city.name === parent);
          const childCity = cities.find(city => city.name === child);

          if (!parentCity || !childCity) return null;

          const lineClass = isPartOfShortestPath(parent, child) ? "line animated-line" : "line";

          return (
            <line key={index}
              className={lineClass}
              x1={parentCity.positionX}
              y1={parentCity.positionY}
              x2={childCity.positionX}
              y2={childCity.positionY}
              stroke={isPartOfShortestPath(parent, child) ? "red" : "black"}
              strokeWidth={isPartOfShortestPath(parent, child) ? "10" : "3"} // Make red line bigger
            />
          );
        })}
        {cities.map((city, index) => (
          <g key={index} onClick={() => handleCityClick(city.name)} className="city-marker">
            <image
              href="city-icon.png"
              x={city.positionX - (isSelected(city.name) ? 60 : 37.5)}
              y={city.positionY - (isSelected(city.name) ? 60 : 37.5)}
              height={isSelected(city.name) ? "120px" : "75px"}
              width={isSelected(city.name) ? "120px" : "75px"}
              className="city-icon"
            />
            <text
              x={city.positionX}
              y={city.positionY - (isSelected(city.name) ? 50 : 40)}
              className={`city-name ${isSelected(city.name) ? 'selected' : ''}`}
            >
              {city.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default MapDisplay;
