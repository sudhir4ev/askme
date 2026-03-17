from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from rag.ingest import ingest_document
from rag.pipeline import answer_question


router = APIRouter(prefix="/api/v1")


class DocumentIn(BaseModel):
    source_type: str = Field(..., description="Type of source, e.g. resume, blog, portfolio")
    title: str = Field(..., description="Human-readable title of the document")
    content: str = Field(..., description="Raw text content of the document")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Optional additional metadata for the document"
    )


class DocumentOut(BaseModel):
    chunks_indexed: int


class QueryIn(BaseModel):
    question: str
    max_context_chunks: int = Field(6, ge=1, le=16)


class SourceSnippet(BaseModel):
    content: str
    metadata: Dict[str, Any]


class QueryOut(BaseModel):
    answer: str
    sources: list[SourceSnippet]


@router.post("/documents", response_model=DocumentOut)
def create_document(payload: DocumentIn) -> DocumentOut:
    chunks_indexed = ingest_document(
        content=payload.content,
        metadata={
            "source_type": payload.source_type,
            "title": payload.title,
            **(payload.metadata or {}),
        },
    )
    return DocumentOut(chunks_indexed=chunks_indexed)


@router.post("/query", response_model=QueryOut)
def query_work_history(payload: QueryIn) -> QueryOut:
    result = answer_question(
        query=payload.question,
        max_chunks=payload.max_context_chunks,
    )
    sources = [
        SourceSnippet(content=snippet["content"], metadata=snippet["metadata"])
        for snippet in result["context"]
    ]
    return QueryOut(answer=result["answer"], sources=sources)

