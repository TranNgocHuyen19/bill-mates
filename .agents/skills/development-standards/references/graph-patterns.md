# Pydantic Graph Patterns & Guidelines

## Topology Definition
Dùng `GraphBuilder` hoặc Class-based `BaseNode[ChatState, ChatDeps, str]` để định nghĩa các Node trong Graph.

## State Management (`ChatState`)
`ChatState` phải là a `@dataclass` thuần túy, lưu trữ query, intent, chunks và final response.

## Node Example
```python
from dataclasses import dataclass
from pydantic_graph import BaseNode, GraphRunContext, End
from app.graph.state import ChatState
from app.graph.deps import ChatDeps

@dataclass
class IntentNode(BaseNode[ChatState, ChatDeps, str]):
    async def run(self, ctx: GraphRunContext[ChatState, ChatDeps]) -> BaseNode[ChatState, ChatDeps, str] | End[str]:
        # Business logic for intent classification
        if "chào" in ctx.state.query.lower():
            return End("Xin chào! Tôi là trợ lý học vụ UniSage.")
        return RAGNode()
```
