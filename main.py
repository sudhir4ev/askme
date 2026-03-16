import multiprocessing

from langchain_community.chat_models import ChatLlamaCpp

local_model = "/Volumes/data/wk/downloads/Qwen2.5-7B-Instruct-Q4_K_M.gguf"

def main():
    llm = ChatLlamaCpp(
    temperature=0.5,
    model_path=local_model,
    n_ctx=10000,
    n_gpu_layers=8,
    n_batch=300,  # Should be between 1 and n_ctx, consider the amount of VRAM in your GPU.
    max_tokens=512,
    n_threads=multiprocessing.cpu_count() - 1,
    repeat_penalty=1.5,
    top_p=0.5,
    verbose=True,
    )

    messages = [
        (
            "system",
            "You are a helpful assistant that translates English to French. Translate the user sentence.",
        ),
        ("human", "I love programming."),
    ]

    # ai_msg = llm.invoke(messages)
    # print(ai_msg.content)

    for chunk in llm.stream(messages):
        print(chunk.content, end="", flush=True)


if __name__ == "__main__":
    main()
