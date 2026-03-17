from fastapi import FastAPI

from api.routes import router as api_router

app = FastAPI(title="Work History RAG API", version="0.1.0")

app.include_router(api_router)


@app.get("/api/v1/health")
def health_check() -> dict:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
