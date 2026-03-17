from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.embeddings import Embeddings

from .settings import get_settings


def build_embeddings() -> Embeddings:
    settings = get_settings()
    return HuggingFaceEmbeddings(model_name=settings.embedding_model_name)

