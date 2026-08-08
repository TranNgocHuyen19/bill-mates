# Code Style Guidelines (UniSage Agent)

## 1. Python Version & Syntax
Dự án sử dụng **Python 3.12+**. Bắt buộc dùng cú pháp type hints mới:
- ✅ `list[str]` thay cho `typing.List[str]`
- ✅ `dict[str, Any]` thay cho `typing.Dict[str, Any]`
- ✅ `str | None` thay cho `typing.Optional[str]`
- ✅ `type Vector = list[float]` (Python 3.12 type alias)

## 2. Thứ tự Import
Chia làm 3 nhóm, phân cách bởi 1 dòng trống:
1. Standard library imports (`import os`, `from dataclasses import dataclass`)
2. Third-party imports (`from fastapi import APIRouter`, `from pydantic import BaseModel`)
3. First-party / Local imports (`from app.core.config import settings`, `from app.graph.state import ChatState`)

## 3. Thứ tự Class Members
Theo thứ tự từ trên xuống dưới:
1. Class attributes & constants
2. `__init__` / Pydantic field definitions
3. Public methods
4. Protected methods (`_helper_method`)
5. Private methods (`__internal_method`)

## 4. Docstrings (Google Style)
Dùng docstring tiếng Việt mô tả mục đích function/class.
```python
def process_chunk(content: str, max_tokens: int = 500) -> list[str]:
    """Chia nhỏ văn bản thành các chunk phù hợp với kích thước token.

    Args:
        content: Nội dung văn bản thô.
        max_tokens: Số lượng token tối đa cho mỗi chunk.

    Returns:
        Danh sách các đoạn văn bản đã chia.
    """
    ...
```
