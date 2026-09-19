"""pytest yapılandırması: repo kökünü sys.path'e ekler.

Böylece ``agent.tests`` altındaki testler, ``agent.agent.*`` paketlerini
kurulum yapmadan import edebilir (pytest test dizinini sys.path'e
eklediği için kök dizin elle bağlanır).
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
