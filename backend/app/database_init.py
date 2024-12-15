import requests
import math
import os
from pymongo import MongoClient

# MongoDB credentials and connection string
MONGO_USERNAME = os.environ.get("MONGO_USERNAME")
MONGO_PASSWORD = os.environ.get("MONGO_PASSWORD")
MONGO_DATABASE = os.environ.get("MONGO_DATABASE")
MONGO_DATABASE_CONNECTION = os.environ.get("MONGO_DATABASE_CONNECTION")

# MongoDB client and database initialization
client: MongoClient = MongoClient(
    f"mongodb://{MONGO_USERNAME}:{MONGO_PASSWORD}{MONGO_DATABASE_CONNECTION}"
)
db = client[f"{MONGO_DATABASE}"]


# Function to calculate distance between two cities
def calculate_distance(city1, city2):
    return math.hypot(
        city2["positionX"] - city1["positionX"], city2["positionY"] - city1["positionY"]
    )


# Function to create city documents
def create_city_documents(cities, map_name):
    city_documents = []
    for city in cities:
        city_document = {
            "name": city["name"],
            "positionX": city["positionX"],
            "positionY": city["positionY"],
            "map": map_name,
        }
        city_documents.append(city_document)
    return city_documents


# Function to create connection documents
def create_connection_documents(connections, cities, map_name):
    connection_documents = []

    city_lookup = {city["name"]: city for city in cities if city["map"] == map_name}

    for connection in connections:
        parent_city = city_lookup.get(connection["parent"])
        child_city = city_lookup.get(connection["child"])

        if parent_city and child_city:
            distance = calculate_distance(parent_city, child_city)
            connection_document = {
                "parent": connection["parent"],
                "child": connection["child"],
                "weight": distance,  # Use distance directly as the weight
                "map": map_name,
            }
            connection_documents.append(connection_document)
    return connection_documents


# Function to create map document
def create_map_document(map_data):
    map_document = {
        "name": map_data["mapname"],
        "sizeX": map_data["mapsizeX"],
        "sizeY": map_data["mapsizeY"],
    }
    return map_document


# Main function to initialize the database
def initialize_db():
    # Fetch all map names from the API
    response = requests.get("https://maps.proxy.devops-pse.users.h-da.cloud/maps")
    response.encoding = "utf-8"
    map_names = response.json()

    # MongoDB collections initialization
    CityCollection = db["cities"]
    SkyrimCollection = db["map"]
    ConnectionCollection = db["connections"]

    # Clear existing documents in collections
    CityCollection.delete_many({})
    SkyrimCollection.delete_many({})
    ConnectionCollection.delete_many({})

    # Iterate through each map and fetch data
    for map_name in map_names:
        response = requests.get(
            f"https://maps.proxy.devops-pse.users.h-da.cloud/map?name={map_name}"
        )
        response.encoding = "utf-8"
        map_data = response.json()

        cities = map_data["cities"]
        connections = map_data["connections"]

        # Create documents
        City_documents = create_city_documents(cities, map_name)
        Skyrim_documents = create_map_document(map_data)

        # Batch insert documents into MongoDB
        CityCollection.insert_many(City_documents)
        SkyrimCollection.insert_one(Skyrim_documents)
        Connection_documents = create_connection_documents(
            connections, City_documents, map_name
        )
        ConnectionCollection.insert_many(Connection_documents)
