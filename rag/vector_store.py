from pathlib import Path
from typing import List

from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

from .embeddings import build_embeddings
from .settings import get_settings


_VECTOR_STORE: Chroma | None = None


def get_vector_store() -> Chroma:
    global _VECTOR_STORE
    if _VECTOR_STORE is not None:
        return _VECTOR_STORE

    settings = get_settings()
    persist_dir = Path(settings.vector_store_dir)
    persist_dir.mkdir(parents=True, exist_ok=True)

    embeddings = build_embeddings()
    _VECTOR_STORE = Chroma(
        embedding_function=embeddings,
        persist_directory=str(persist_dir),
    )
    return _VECTOR_STORE


def add_documents(docs: List[Document]) -> None:
    store = get_vector_store()
    store.add_documents(docs)
    store.persist()


def similarity_search(query: str, k: int = 6) -> List[Document]:
    store = get_vector_store()
    return store.similarity_search(query, k=k)

