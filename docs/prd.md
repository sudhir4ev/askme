# Project Requirements Document


## Goal:
We are building a AI application that answer questions about a person's work history and key capabilities or shortcomings. It uses documents like resume, portfolio, published material like blogs articles journals etc. to answer the questions.

The user should provide documents to the system to build the vector database. After this is prepared, the system is ready to answer prompts.


## Functional requirements:
The whole system should run in a docker container which will run in a small VPS with 2gb memory and limited processing power. There is no GPU avaliable.

For reference
- 'LFM2-ColBERT-350M' for embedding and retrival
- 'LFM2-1.2B-RAG' can be used for response generation