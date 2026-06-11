import asyncio

from migrate_cloud_fields import migrate_cloud_fields


async def main() -> None:
    await migrate_cloud_fields()


if __name__ == "__main__":
    asyncio.run(main())
