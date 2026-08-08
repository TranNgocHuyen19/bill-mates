# Testing Patterns & Guidelines (Pytest)

## 1. Stack
- Test Runner: `pytest`
- Async plugin: `pytest-asyncio`
- Coverage: `pytest-cov`
- HTTP Client: `httpx.AsyncClient`

## 2. Directory Structure
```text
tests/
├── conftest.py            # Global fixtures (client, db_session, mock_llm)
├── test_health.py         # API health check test
├── test_chat.py           # API /chat endpoint test
├── test_ingestion.py      # API /ingestion endpoint test
└── test_graph.py          # Pydantic Graph nodes unit tests
```

## 3. Writing Async Tests
Tất cả test hàm async bắt buộc đánh dấu `@pytest.mark.asyncio`:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

## 4. Testing Graph Nodes directly
Có thể test từng Node trong Graph độc lập mà không cần qua HTTP API:

```python
import pytest
from app.graph.state import ChatState
from app.graph.deps import ChatDeps
from app.graph.nodes.greeting_node import GreetingNode

@pytest.mark.asyncio
async def test_greeting_node():
    state = ChatState(query="Xin chào")
    deps = ChatDeps()
    node = GreetingNode()

    # Run node
    result = await node.run(type("Context", (), {"state": state, "deps": deps})())
    assert state.final_response is not None
```
