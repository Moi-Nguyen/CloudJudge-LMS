import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine

ROOT_DIR = Path(__file__).resolve().parents[3]
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(ROOT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env")

REQUIRED_TABLES = {
    "notifications": """
        CREATE TABLE `notifications` (
            `id` VARCHAR(36) NOT NULL,
            `user_id` VARCHAR(36) NOT NULL,
            `title` VARCHAR(255) NOT NULL,
            `message` TEXT NOT NULL,
            `notification_type` VARCHAR(50) NOT NULL,
            `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
            `created_at` DATETIME NOT NULL,
            `metadata_json` TEXT NULL,
            PRIMARY KEY (`id`),
            INDEX `ix_notifications_user_id` (`user_id`),
            INDEX `ix_notifications_notification_type` (`notification_type`),
            CONSTRAINT `fk_notifications_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        )
    """,
}

REQUIRED_COLUMNS = {
    "lessons": {
        "file_url": "VARCHAR(500) NULL",
        "external_url": "VARCHAR(500) NULL",
        "file_name": "VARCHAR(255) NULL",
        "file_type": "VARCHAR(100) NULL",
        "file_size": "INT NULL",
        "storage_provider": "VARCHAR(50) NOT NULL DEFAULT 'local'",
        "is_published": "BOOLEAN NOT NULL DEFAULT FALSE",
        "published_at": "DATETIME NULL",
    },
    "documents": {
        "file_url": "VARCHAR(500) NULL",
        "file_name": "VARCHAR(255) NULL",
        "file_type": "VARCHAR(100) NULL",
        "file_size": "INT NULL",
        "storage_provider": "VARCHAR(50) NOT NULL DEFAULT 'local'",
    },
}


async def table_exists(connection, table_name: str) -> bool:
    result = await connection.execute(text("SHOW TABLES LIKE :table_name"), {"table_name": table_name})
    return result.first() is not None


async def get_existing_columns(connection, table_name: str) -> set[str]:
    result = await connection.execute(text(f"SHOW COLUMNS FROM `{table_name}`"))
    return {row[0] for row in result.fetchall()}


async def migrate_cloud_fields() -> dict[str, list[str]]:
    database_url_value = os.getenv("DATABASE_URL")
    if not database_url_value:
        raise RuntimeError(
            "DATABASE_URL is not set. Add it to .env or export it before running this migration."
        )

    database_url = make_url(database_url_value)
    if not database_url.drivername.startswith("mysql"):
        raise RuntimeError(
            "This local migration is intentionally limited to MySQL DATABASE_URL values."
        )

    engine = create_async_engine(database_url_value, pool_pre_ping=True)
    added_columns: dict[str, list[str]] = {table_name: [] for table_name in REQUIRED_COLUMNS}

    try:
        async with engine.begin() as connection:
            for table_name, create_statement in REQUIRED_TABLES.items():
                if await table_exists(connection, table_name):
                    print(f"{table_name}: skipped table already exists")
                    continue

                await connection.execute(text(create_statement))
                print(f"{table_name}: created")

            for table_name, required_columns in REQUIRED_COLUMNS.items():
                if not await table_exists(connection, table_name):
                    print(f"{table_name}: skipped table missing")
                    continue

                existing_columns = await get_existing_columns(connection, table_name)

                for column_name, column_definition in required_columns.items():
                    if column_name in existing_columns:
                        print(f"{table_name}.{column_name}: skipped already exists")
                        continue

                    await connection.execute(
                        text(
                            f"ALTER TABLE `{table_name}` "
                            f"ADD COLUMN `{column_name}` {column_definition}"
                        )
                    )
                    added_columns[table_name].append(column_name)
                    print(f"{table_name}.{column_name}: added")

                verified_columns = await get_existing_columns(connection, table_name)
                missing_columns = sorted(set(required_columns) - verified_columns)
                if missing_columns:
                    print(f"{table_name}: missing {', '.join(missing_columns)}")
                else:
                    print(f"{table_name}: OK")
    finally:
        await engine.dispose()

    return added_columns


async def main() -> None:
    added_columns = await migrate_cloud_fields()
    flattened_added_columns = [
        f"{table_name}.{column_name}"
        for table_name, column_names in added_columns.items()
        for column_name in column_names
    ]

    if flattened_added_columns:
        print("Migration complete. Added columns: " + ", ".join(flattened_added_columns))
    else:
        print("Migration complete. No columns were missing.")


if __name__ == "__main__":
    asyncio.run(main())
