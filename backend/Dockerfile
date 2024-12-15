ARG GITLAB_PROXY

FROM ${GITLAB_PROXY}python:3.12-slim

WORKDIR /app

COPY ./app /app
COPY ./requirements.txt /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pwd
RUN ls -la

CMD ["uvicorn", "main:app", "--log-config=log_conf.yaml", "--host", "0.0.0.0", "--port", "4243"]