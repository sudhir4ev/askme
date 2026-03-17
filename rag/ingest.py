from typing import List, Mapping, Any

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from .vector_store import add_documents


def _build_text_splitter() -> RecursiveCharacterTextSplitter:
    return RecursiveCharacterTextSplitter(
        chunk_size=1024,
        chunk_overlap=100,
    )


def ingest_document(
    *, content: str, metadata: Mapping[str, Any] | None = None
) -> int:
    splitter = _build_text_splitter()
    chunks = splitter.split_text(content)

    print(f"Split into {len(chunks)} chunks")
    print(chunks)

    docs: List[Document] = []
    for idx, chunk in enumerate(chunks):
        doc_metadata = dict(metadata or {})
        doc_metadata["chunk_index"] = idx
        docs.append(Document(page_content=chunk, metadata=doc_metadata))

    if not docs:
        return 0

    add_documents(docs)
    return len(docs)

