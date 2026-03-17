from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_documents_and_query_smoke(monkeypatch) -> None:
    # Avoid hitting real LLM and embeddings/vector store in this smoke test.
    from rag import pipeline

    def fake_answer_question(query: str, max_chunks: int = 6):
        return {
            "answer": "This is a fake answer.",
            "context": [
                {"content": "dummy content", "metadata": {"title": "Dummy", "source_type": "test"}}
            ],
        }

    monkeypatch.setattr(pipeline, "answer_question", fake_answer_question)

    doc_payload = {
        "source_type": "resume",
        "title": "Sample Resume",
        "content": "Alice is a software engineer with experience in Python and FastAPI.",
        "metadata": {"role": "Software Engineer"},
    }
    doc_resp = client.post("/api/v1/documents", json=doc_payload)
    assert doc_resp.status_code == 200
    assert doc_resp.json()["chunks_indexed"] >= 0

    query_payload = {"question": "What technologies does this person know?", "max_context_chunks": 3}
    query_resp = client.post("/api/v1/query", json=query_payload)
    assert query_resp.status_code == 200
    body = query_resp.json()
    assert "answer" in body
    assert isinstance(body["sources"], list)

