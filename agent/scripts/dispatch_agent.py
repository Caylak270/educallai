"""Bir odaya ajan dispatch eder — dashboard sesli testi için.

Kullanım: dispatch_agent.py <room> <agent_name>

Neden ayrı script: Node livekit-server-sdk'nın AgentDispatchClient'ı
Cloud-hosted agent servisine gidiyor ve external worker'ı görmüyor;
python livekit-api (voice-e2e.py'nin kullandığı yol) kanıtlanmış çalışıyor.
"""

import asyncio
import os
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from livekit import api  # noqa: E402


async def main() -> None:
    room, agent_name = sys.argv[1], sys.argv[2]
    lk = api.LiveKitAPI(
        url=os.environ["LIVEKIT_URL"].replace("wss://", "https://"),
        api_key=os.environ["LIVEKIT_API_KEY"],
        api_secret=os.environ["LIVEKIT_API_SECRET"],
    )
    await lk.agent_dispatch.create_dispatch(
        api.CreateAgentDispatchRequest(agent_name=agent_name, room=room)
    )
    await lk.aclose()
    print("dispatched")


if __name__ == "__main__":
    asyncio.run(main())
