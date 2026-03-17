from typing import Iterable

import multiprocessing
from langchain_community.chat_models import ChatLlamaCpp
from langchain_core.messages import BaseMessage

from .settings import get_settings


def build_llm() -> ChatLlamaCpp:
    settings = get_settings()

    n_threads = (
        settings.llm_n_threads
        if settings.llm_n_threads is not None
        else max(multiprocessing.cpu_count() - 1, 1)
    )

    llm = ChatLlamaCpp(
        model_path=str(settings.gguf_model_path),
        n_ctx=settings.llm_n_ctx,
        n_batch=settings.llm_n_batch,
        temperature=settings.llm_temperature,
        top_p=settings.llm_top_p,
        max_tokens=settings.llm_max_tokens,
        repeat_penalty=settings.llm_repeat_penalty,
        n_threads=n_threads,
        n_gpu_layers=0,
        verbose=False,
    )
    return llm


def generate_answer(messages: Iterable[BaseMessage]) -> str:
    llm = build_llm()
    ai_msg = llm.invoke(list(messages))
    return ai_msg.content or ""

