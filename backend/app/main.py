import time
import os
import jwt
import httpx
import logging
import requests
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from fastapi import FastAPI, Request, HTTPException, Query, Depends
from jwt import algorithms
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from prometheus_fastapi_instrumentator import Instrumentator
from api.routing import calculate_shortest_path
from database_init import initialize_db
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

MONGO_USERNAME = os.environ.get("MONGO_USERNAME")
MONGO_PASSWORD = os.environ.get("MONGO_PASSWORD")
MONGO_DATABASE = os.environ.get("MONGO_DATABASE")
MONGO_DATABASE_CONNECTION = os.environ.get("MONGO_DATABASE_CONNECTION")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "")
KEYCLOAK_URL = os.environ.get("KEYCLOAK_URL")
KEYCLOAK_CERTS_URL = os.environ.get("KEYCLOAK_CERTS_URL")

initialize_db()

logger = logging.getLogger(__name__)

app = FastAPI()

instrumentator = Instrumentator().instrument(app)

trace.set_tracer_provider(
    TracerProvider(resource=Resource.create({"service.name": "my-fastapi-service"}))
)

tracer = trace.get_tracer(__name__)

jaeger_exporter = OTLPSpanExporter(
    endpoint="http://db.devops-pse.users.h-da.cloud:4317", insecure=True
)

span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

FastAPIInstrumentor.instrument_app(app)
RequestsInstrumentor().instrument()


@app.on_event("startup")
async def _startup():
    instrumentator.expose(app)


client: MongoClient = MongoClient(
    f"mongodb://{MONGO_USERNAME}:{MONGO_PASSWORD}{MONGO_DATABASE_CONNECTION}"
)

db = client[f"{MONGO_DATABASE}"]
security = HTTPBearer()
# CORS Middleware is necessary to allow react to access the backend
origins = CORS_ORIGINS


username = "default"
user_history = []
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CityPair(BaseModel):
    start_city: str
    end_city: str
    map_name: str


class HistoryEntry(BaseModel):
    start_city: str
    end_city: str


@app.get("/mapdata", response_class=JSONResponse)
def get_mapdata(
    mapname: str = Query(None, description="The name of the map to filter by")
):
    response = requests.get("https://maps.proxy.devops-pse.users.h-da.cloud/maps")
    response.encoding = "utf-8"
    json_data = response.json()
    # Filter cities and connections by map name if provided
    if mapname:
        connections_data = list(db["connections"].find({"map": mapname}, {"_id": 0}))
        cities_data = list(db["cities"].find({"map": mapname}, {"_id": 0}))
    else:
        connections_data = list(db["connections"].find({}, {"_id": 0}))
        cities_data = list(db["cities"].find({}, {"_id": 0}))

    return {"connections": connections_data, "cities": cities_data, "maps": json_data}


@app.get("/history/{username}", response_class=JSONResponse)
def get_history(username: str):
    user = db["user"].find_one({"username": username}, {"_id": 0, "history": 1})
    if user:
        return {"history": user.get("history", [])}
    else:
        return {"history": []}


@app.get("/validate-token")
async def validate_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        global username
        global user_history
        leeway = 60  # seconds
        access_token = credentials.credentials
        if not access_token:
            raise HTTPException(status_code=400, detail="Access token is required")

        if KEYCLOAK_CERTS_URL is None:
            raise ValueError("KEYCLOAK_CERTS_URL must be set")
        async with httpx.AsyncClient() as client:
            response = await client.get(KEYCLOAK_CERTS_URL)
            jwks = response.json()

        headers = jwt.get_unverified_header(access_token)
        kid = headers.get("kid")
        key = None

        for jwk in jwks["keys"]:
            if jwk["kid"] == kid:
                key = jwk
                break

        if not key:
            raise HTTPException(
                status_code=400, detail="Public key not found for key ID"
            )

        decoded_token = jwt.decode(
            jwt=access_token,
            key=algorithms.RSAAlgorithm.from_jwk(key),
            leeway=leeway,
            algorithms=["RS256"],
            audience="account",
        )

        if "exp" in decoded_token and decoded_token["exp"] < time.time():
            return {"isValid": False, "message": "Token is expired"}
        if "preferred_username" in decoded_token:
            username = decoded_token.get("preferred_username")
        else:
            raise HTTPException(status_code=400, detail="No username")

        user = db["user"].find_one({"username": username}, {"_id": 0, "history": 1})
        if user:
            user_history = user.get("history", [])
        else:
            raise HTTPException(status_code=400, detail="No user")
        return {"isValid": True, "history": user_history, "username": username}
    except Exception as e:
        return {"isValid": False, "message": str(e)}


@app.post("/save-route", response_class=JSONResponse)
def give_shortest_path(city_pair: CityPair):
    try:
        with tracer.start_as_current_span("give_shortest_path"):
            route = calculate_shortest_path(
                city_pair.start_city, city_pair.end_city, city_pair.map_name
            )
            return {"route": route}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/route", response_class=JSONResponse)
def get_shortest_path(city_pair: CityPair):
    try:
        with tracer.start_as_current_span("get_shortest_path"):
            route = calculate_shortest_path(
                city_pair.start_city, city_pair.end_city, city_pair.map_name
            )
            return {"route": route}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/user")
async def register_user(request: Request):
    try:
        data = await request.json()
        username = data.get("username")
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        user_collection = db["user"]
        existing_user = user_collection.find_one({"username": username})
        if existing_user:
            return {"message": "Username already exists"}
        new_user = {
            "username": username,
            "history": [],
        }
        user_collection.insert_one(new_user)
        return {"message": "User created successfully", "username": username}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/post-history")
async def post_history(request: Request):
    try:
        data = await request.json()
        history_entry = data.get("history_entry")
        departure = data.get("departure")
        destination = data.get("destination")
        nameofuser = data.get("username")
        date = data.get("date")
        user_collection = db["user"]
        user = user_collection.find_one({"username": nameofuser})
        selectedmap = data.get("map")
        if user:
            max_id = max(
                [entry.get("id", 0) for entry in user.get("history", [])], default=0
            )
        else:
            max_id = 0
        new_id = max_id + 1
        new_history_entry = {
            "id": new_id,
            "history_entry": history_entry,
            "departure": departure,
            "destination": destination,
            "date": date,
            "map": selectedmap,
        }
        user_collection.update_one(
            {"username": nameofuser}, {"$push": {"history": new_history_entry}}
        )
        user = user_collection.find_one(
            {"username": nameofuser}, {"_id": 0, "history": 1}
        )
        updated_history = user.get("history", [])
        return {
            "message": "History entry added successfully",
            "history": updated_history,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/delete-history/{username}/{history_id}")
async def delete_history(username: str, history_id: int):
    try:
        user_collection = db["user"]
        result = user_collection.update_one(
            {"username": username}, {"$pull": {"history": {"id": history_id}}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="History entry not found")
        user = user_collection.find_one(
            {"username": username}, {"_id": 0, "history": 1}
        )
        if user:
            updated_history = user.get("history", [])
        else:
            updated_history = []
        return {
            "message": "History entry deleted successfully",
            "history": updated_history,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/clear-history/{username}")
async def clear_history(username: str):
    try:
        user_collection = db["user"]
        result = user_collection.update_one(
            {"username": username}, {"$set": {"history": []}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "History cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
