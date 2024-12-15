import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import MapDisplay from './components/MapDisplay/MapDisplay';
import RouteSelector from './components/RouteSelector/RouteSelector';
import Login from './components/Login/Login';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';
import PrivateRoute from "./components/Authentification/PrivateRoute";
import { keycloak } from "./components/Authentification/keycloak";
import LoadingPage from "./components/Authentification/LoadingPage";
import { getApiUrl } from './utils';
import API_ENDPOINTS from './apiConfig';

function App() {
    const [selectedCity1, setSelectedCity1] = useState('');
    const [selectedCity2, setSelectedCity2] = useState('');
    const [mapData, setMapData] = useState({ cities: [], connections: [] });
    const [route, setRoute] = useState(null);
    const [routeHistory, setRouteHistory] = useState([]);
    const [shortestPath, setShortestPath] = useState([]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [username, setUsername] = useState("");
    const [mapOptions, setMapOptions] = useState([]);
    const [selectedMap, setSelectedMap] = useState('skyrim');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMapOptions = async () => {
            try {
                const response = await axios.get(getApiUrl(API_ENDPOINTS.mapData));
                setMapOptions(response.data.maps);
            } catch (error) {
                console.error('Error fetching map options:', error);
            }
        };
        fetchMapOptions();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = keycloak.token;
                if (token) {
                    const validateResponse = await axios.get(getApiUrl(API_ENDPOINTS.validateToken), {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    setUsername(validateResponse.data.username);
                    setRouteHistory(validateResponse.data.history || []);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const response = await axios.get(getApiUrl(API_ENDPOINTS.mapData), {
                    params: { mapname: selectedMap }
                });
                setMapData(response.data);
            } catch (error) {
                console.error('Error fetching map data:', error);
            }
        };
        fetchMapData();
    }, [selectedMap]);

    const handleCitySelect = (cityName) => {
        if (!selectedCity1 || (selectedCity1 && selectedCity2)) {
            setSelectedCity1(cityName);
            setSelectedCity2('');
            setShortestPath([]); // Clear the shortest path when a new city is selected
        } else if (selectedCity1 && !selectedCity2) {
            setSelectedCity2(cityName);
            setShortestPath([]); // Clear the shortest path when a new city is selected
        }
    };

    const handleSelectionChange = (city1, city2) => {
        setSelectedCity1(city1);
        setSelectedCity2(city2);
    };

    const calculateRoute = () => {
        axios.post(getApiUrl(API_ENDPOINTS.getRoute), { start_city: selectedCity1, end_city: selectedCity2, map_name: selectedMap})
            .then(response => {
                const fullRoute = response.data.route;
                setRoute(fullRoute.join(' -> '));

                // Get the current date and time in German format and correct time zone
                const date = new Date().toLocaleString('de-DE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Berlin' // Ensure the time zone is set to Berlin
                });

                const newRoute = `${date} from ${selectedCity1} to ${selectedCity2}`;

                // Get the current date in ISO format and adjust for Berlin timezone
                const berlinDate = new Date().toLocaleString('sv-SE', {
                    timeZone: 'Europe/Berlin'
                }).replace(' ', 'T');

                axios.post(getApiUrl(API_ENDPOINTS.postHistory), {
                    history_entry: newRoute,
                    username: username,
                    target: selectedCity1,
                    destination: selectedCity2,
                    date: berlinDate,
                    map: selectedMap
                }).then(response => {
                    setRouteHistory(response.data.history || []);
                }).catch(error => {
                    console.error('Error posting history:', error);
                });

                setShortestPath(fullRoute); // Set the shortest path
            }).catch(error => {
                console.error('Error calculating route:', error);
            });
    };

    const deleteHistoryEntry = (id) => {
        axios.delete(`${getApiUrl(API_ENDPOINTS.deleteHistory)}/${username}/${id}`)
            .then(response => {
                setRouteHistory(response.data.history || []);
            }).catch(error => {
                console.error('Error deleting history entry:', error);
            });
    };

    const clearHistory = () => {
        axios.delete(`${getApiUrl(API_ENDPOINTS.clearHistory)}/${username}`)
            .then(response => {
                setRouteHistory([]);
            }).catch(error => {
                console.error('Error clearing history:', error);
            });
    };

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    const handleMapChange = async (event) => {
        const selectedMap = event.target.value;
        setSelectedMap(selectedMap);
        try {
            setLoading(true);
            const response = await axios.get(getApiUrl(API_ENDPOINTS.mapData), {
                params: { mapname: selectedMap }
            });
            setMapData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error updating map:', error);
            setLoading(false)
        }
    };

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/main" element={<PrivateRoute path="/main" element={
                    <div className="App">
                        <div className='title'>Skyrim Navigation App</div>
                        <Sidebar
                            HistoryObjects={routeHistory}
                            clearHistory={clearHistory}
                            toggleSidebar={toggleSidebar}
                            isVisible={isSidebarVisible}
                            username={username}
                            deleteHistoryEntry={deleteHistoryEntry}
                        />
                        <div className="route-selector-container">
                            <RouteSelector
                                mapOptions={mapOptions}
                                selectedMap={selectedMap}
                                onMapChange={handleMapChange}
                                cities={mapData.cities}
                                selectedCity1={selectedCity1}
                                selectedCity2={selectedCity2}
                                onSelectionChange={handleSelectionChange}
                                onCitySelect={handleCitySelect}
                                onCalculateRoute={calculateRoute}
                                route={route}
                                loading={loading}
                            />
                        </div>
                        <div className="map-display-container">
                            {selectedMap === 'skyrim' && (
                                <MapDisplay
                                    cities={mapData.cities}
                                    connections={mapData.connections}
                                    selectedCity1={selectedCity1}
                                    selectedCity2={selectedCity2}
                                    onCitySelect={handleCitySelect}
                                    shortestPath={shortestPath} // Pass the shortest path to the MapDisplay component
                                />
                            )}
                        </div>
                    </div>
                } />} />
                <Route path="/loading" element={<LoadingPage />} />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;