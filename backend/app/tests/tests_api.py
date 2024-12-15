"""
import json
from fastapi.testclient import TestClient
from unittest.mock import patch
from ..main import app

client = TestClient(app)


@patch("app.tests.tests_api.client.get")
def test_get_mapdata(mock_get):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {
        "connections": ["A-B", "B-C"],
        "cities": ["A", "B", "C"],
    }

    response = client.get("/mapdata")
    assert response.status_code == 200
    data = response.json()
    assert "connections" in data
    assert "cities" in data


@patch("app.tests.tests_api.client.post")
def test_give_shortest_path(mock_post):
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {
        "route": ["Solitude", "Markarth", "Riften"]
    }

    headers = {"Content-Type": "application/json"}
    data = json.dumps({"start_city": "Solitude", "end_city": "Markarth"})

    response = client.post("/route", headers=headers, data=data)
    assert response.status_code == 200
    result = response.json()
    assert "route" in result


@patch("app.tests.tests_api.client.post")
def test_give_shortest_path_invalid_input(mock_post):
    mock_post.return_value.status_code = 400
    mock_post.return_value.json.return_value = {"detail": "Invalid input"}

    headers = {"Content-Type": "application/json"}
    data = json.dumps({"start_city": "City A", "end_city": "Invalid City"})

    response = client.post("/route", headers=headers, data=data)
    assert response.status_code == 400
    error = response.json()
    assert "detail" in error
"""
