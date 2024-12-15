import networkx as nx
from pymongo import MongoClient
import os

MONGO_USERNAME = os.environ.get("MONGO_USERNAME")
MONGO_PASSWORD = os.environ.get("MONGO_PASSWORD")
MONGO_DATABASE = os.environ.get("MONGO_DATABASE")
MONGO_DATABASE_CONNECTION = os.environ.get("MONGO_DATABASE_CONNECTION")

client: MongoClient = MongoClient(
    f"mongodb://{MONGO_USERNAME}:{MONGO_PASSWORD}{MONGO_DATABASE_CONNECTION}"
)


def calculate_shortest_path(start_city, end_city, map_name):
    db = client[f"{MONGO_DATABASE}"]
    connections = db["connections"].find({"map": map_name})
    G = nx.Graph()

    for connection in connections:
        G.add_weighted_edges_from(
            [(connection["parent"], connection["child"], connection["weight"])]
        )
    path = nx.shortest_path(G, start_city, end_city)
    return path
