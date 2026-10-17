"""Compatibility exports for legacy imports of API user/profile services."""

from user_services import (
    create_profile,
    create_user,
    delete_user,
    get_all_users,
    get_profile_by_user_id,
    get_user_by_email,
    get_user_by_id,
    update_profile,
    update_user,
)

__all__ = [
    "create_profile",
    "create_user",
    "delete_user",
    "get_all_users",
    "get_profile_by_user_id",
    "get_user_by_email",
    "get_user_by_id",
    "update_profile",
    "update_user",
]