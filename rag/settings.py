from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    gguf_model_path: Path = Field(
        ...,
        description="Filesystem path to the quantized GGUF model used by llama-cpp.",
        env="GGUF_MODEL_PATH",
    )
    llm_n_ctx: int = Field(4096, env="LLM_N_CTX")
    llm_n_batch: int = Field(128, env="LLM_N_BATCH")
    llm_temperature: float = Field(0.3, env="LLM_TEMPERATURE")
    llm_top_p: float = Field(0.9, env="LLM_TOP_P")
    llm_max_tokens: int = Field(512, env="LLM_MAX_TOKENS")
    llm_repeat_penalty: float = Field(1.1, env="LLM_REPEAT_PENALTY")
    llm_n_threads: Optional[int] = Field(
        None,
        description="Override for llama-cpp thread count; defaults to CPU count if unset.",
        env="LLM_N_THREADS",
    )

    embedding_model_name: str = Field(
        "sentence-transformers/all-MiniLM-L6-v2",
        env="EMBEDDING_MODEL_NAME",
    )

    vector_store_dir: Path = Field(
        Path("./data/vector_store"),
        env="VECTOR_STORE_DIR",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

