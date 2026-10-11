"""Application settings loaded from environment / .env."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongo_uri: str = "mongodb://localhost:27017/?replicaSet=rs0"
    mongo_db: str = "rankstack"
    mongo_server_selection_timeout_ms: int = 5000
    mongo_connect_timeout_ms: int = 5000
    mongo_socket_timeout_ms: int = 10000

    redis_uri: str = "redis://localhost:6379/0"
    redis_socket_timeout_seconds: int = 5
    redis_socket_connect_timeout_seconds: int = 5

    # Comma-separated list of allowed browser origins for the frontend.
    cors_origins: str = "http://localhost:3000"

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    session_ttl_seconds: int = 3600
    rate_limit_window_seconds: int = 60
    rate_limit_max_submissions: int = 10


settings = Settings()
