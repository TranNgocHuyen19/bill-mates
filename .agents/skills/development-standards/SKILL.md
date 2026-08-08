---
name: development-standards
description: >-
  MANDATORY skill for uniSage AI Agent project. MUST activate BEFORE writing, creating, modifying, fixing,
  refactoring, or debugging any backend Python/FastAPI code in this repository. Covers coding conventions:
  module ordering, class member ordering, Python 3.12+ type hints, exception handling, Pydantic v2 validation,
  FastAPI standards, async SQLAlchemy 2.0 database access, and pydantic-graph orchestration patterns.
---

# UniSage Development Standards & Best Practices

Tài liệu hướng dẫn tiêu chuẩn kỹ thuật bắt buộc khi phát triển hệ thống `unisage-agent`.

## Quick References (`references/`)

- **[graph-patterns.md](references/graph-patterns.md)**: Chuẩn thiết kế `pydantic-graph` (Nodes, State, Deps, Transitions, Exceptions).
- **[api-standards.md](references/api-standards.md)**: Quy chuẩn RESTful API cho FastAPI, DTO Schemas & Standard Response.
- **[pydantic.md](references/pydantic.md)**: Chuẩn Pydantic v2 Models (ConfigDict, Field validation, Type constraints).
- **[exception-handling.md](references/exception-handling.md)**: Chuẩn bắt lỗi tập trung (AppException, ErrorCode Enum).
- **[database.md](references/database.md)**: Quy chuẩn Async SQLAlchemy 2.0 & Repository Data Access.
- **[code-style.md](references/code-style.md)**: Chuẩn Code Style Python 3.12+, Type Hinting & Member ordering.

---

## Core Rules

1. **Python 3.12+ Syntax**: Dùng `list[str]`, `dict[str, Any]`, `str | None` thay cho `typing.List`, `typing.Optional`.
2. **Dependency Direction**: `API -> Graph -> RAG Services -> Repositories`.
3. **Async DB Operations**: Tất cả truy vấn DB bắt buộc dùng `async/await` với SQLAlchemy 2.0.
4. **Graph State Isolation**: `ChatState` là dataclass mang dữ liệu duy nhất trong luồng Pydantic Graph execution.
