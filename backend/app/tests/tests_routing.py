import networkx as nx

# Create a test graph
G = nx.Graph()
G.add_weighted_edges_from([("A", "B", 10), ("B", "A", 5), ("C", "A", 15)])


def test_calculate_shortest_path():
    # Test case 1: Shortest path exists
    start_city = "A"
    end_city = "B"
    path = nx.shortest_path(G, start_city, end_city)
    expected_path = " -> ".join(path)
    assertion = "The shortest path from A to B is: A -> B"
    path_string = (
        f"The shortest path from {start_city} to {end_city} is: {expected_path}"
    )
    assert path_string == assertion
