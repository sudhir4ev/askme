from typing import Any, Dict, List

from langchain_core.messages import HumanMessage, SystemMessage

from .llm import generate_answer
from .vector_store import similarity_search


SYSTEM_PROMPT = (
    "You are an assistant that answers questions about a single person's "
    "work history, professional experience, capabilities, and shortcomings. "
    "Use ONLY the provided context from their documents (resume, portfolio, "
    "blogs, articles, journals, etc.). If the context does not contain "
    "enough information to answer, say that you do not know and avoid "
    "hallucinating."
)


def build_context_snippets(query: str, max_chunks: int = 6) -> List[Dict[str, Any]]:
    docs = similarity_search(query, k=max_chunks)
    return [
        {
            "content": doc.page_content,
            "metadata": doc.metadata,
        }
        for doc in docs
    ]


def build_prompt(query: str, context_snippets: List[Dict[str, Any]]) -> str:
    context_parts: List[str] = []
    for idx, snippet in enumerate(context_snippets, start=1):
        context_parts.append(f"[Snippet {idx}]\n{snippet['content']}\n")

    context_block = "\n".join(context_parts) if context_parts else "No context found."
    prompt = (
        "You are answering questions about a person's work history based on the "
        "following context snippets from their documents.\n\n"
        f"{context_block}\n\n"
        "Question:\n"
        f"{query}\n\n"
        "Answer in a concise, professional tone. If the context does not support "
        "a confident answer, explicitly say that the information is not available "
        "in the provided documents."
    )
    return prompt


def answer_question(query: str, max_chunks: int = 6) -> Dict[str, Any]:
    context_snippets = build_context_snippets(query, max_chunks=max_chunks)
    prompt = build_prompt(query, context_snippets)

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt),
    ]

    answer = generate_answer(messages)
    return {
        "answer": answer,
        "context": context_snippets,
    }

