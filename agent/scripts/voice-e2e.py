"""Uçtan uca SES testi: gerçek Türkçe ses çalar → ajanın yanıtı kaydedilir →
Deepgram ile transkript edilir. STT+LLM+TTS+oda akışının tamamını doğrular."""
import asyncio, os, time, wave, json
from dotenv import load_dotenv
load_dotenv(".env")
import numpy as np
import httpx
from livekit import rtc, api

SR = 24000
QUESTION = "Merhaba, YKS hazırlık programınızın fiyatları ne kadar?"

def read_wav(path):
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        return w.readframes(w.getnframes()), sr

def rms(data):
    a = np.frombuffer(data, dtype=np.int16).astype(np.float32)
    return float(np.sqrt(np.mean(a * a)) if len(a) else 0)

async def main():
    speech, sr = read_wav("test-speech.wav")
    chunk = sr // 50  # 20ms
    frames = [speech[i : i + chunk * 2] for i in range(0, len(speech), chunk * 2)]
    print(f"soru: {len(frames)} frame ({len(speech)/2/sr:.1f} sn)")

    token = (
        api.AccessToken(os.environ["LIVEKIT_API_KEY"], os.environ["LIVEKIT_API_SECRET"])
        .with_identity("prob-veli")
        .with_name("Test Velisi")
        .with_grants(api.VideoGrants(room_join=True, room="voice-e2e", can_publish=True, can_subscribe=True))
        .to_jwt()
    )

    # E2E için İSİMLİ ajan işçisi başlat (dispatch edilebilmesi için)
    import subprocess, sys
    worker = subprocess.Popen(
        [sys.executable, "scripts/agent_main.py", "dev"],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        env={**os.environ, "AGENT_NAME": "velipilot-e2e"},
        stdout=open("e2e-worker.log", "wb"),
        stderr=subprocess.STDOUT,
    )
    print("e2e işçisi başlatıldı")
    await asyncio.sleep(10)  # kayıt için bekle

    room = rtc.Room()
    agent_frames = []   # (monotonic, bytes)
    agent_track = asyncio.Event()

    @room.on("track_subscribed")
    def on_track(track, pub, _part):
        if "ambience" in track.name.lower():
            print("  (ambiyan atlandı)")
            return
        print(f"  + ajan ses track: {track.name}")
        agent_track.set()
        stream = rtc.AudioStream(track=track)
        async def reader():
            async for ev in stream:
                agent_frames.append((time.monotonic(), bytes(ev.frame.data)))
        asyncio.create_task(reader())

    await room.connect(os.environ["LIVEKIT_URL"], token, options=rtc.RoomOptions(auto_subscribe=True))
    print("bağlandı, ajan dispatch ediliyor...")

    # Ajan dispatch'i — isimli ajan açıkça çağrılır
    lk = api.LiveKitAPI(
        os.environ["LIVEKIT_URL"].replace("wss://", "https://"),
        os.environ["LIVEKIT_API_KEY"],
        os.environ["LIVEKIT_API_SECRET"],
    )
    try:
        await lk.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(agent_name="velipilot-e2e", room="voice-e2e")
        )
        print("  dispatch oluşturuldu (velipilot-e2e)")
    except Exception as e:
        print("  dispatch:", str(e)[:100])

    await asyncio.wait_for(agent_track.wait(), timeout=25)

    # Soruyu gönder
    source = rtc.AudioSource(SR, 1)
    track = rtc.LocalAudioTrack.create_audio_track("prob-speech", source)
    await room.local_participant.publish_track(
        track=track, options=rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
    )
    t0 = time.monotonic()
    for f in frames:
        await source.capture_frame(rtc.AudioFrame(f, SR, 1, len(f) // 2))
    t_end = time.monotonic()
    print(f"soru bitti: +{(t_end - t0):.1f} sn — ajan sesi bekleniyor...")

    # İlk anlamlı ses anını yakala (ajanın ilk çıkışı)
    first_voice = None
    deadline = t_end + 15
    while time.monotonic() < deadline:
        after = [(t, d) for (t, d) in agent_frames if t > t_end + 0.1 and rms(d) > 500]
        if after:
            first_voice = (after[0][0] - t_end) * 1000
            print(f"İLK AJAN SESİ: +{first_voice:.0f} ms")
            break
        await asyncio.sleep(0.02)

    await asyncio.sleep(6)  # yanıtın kalanını da kaydet

    # Ajan sesini wav'a yaz + Deepgram ile transkript et
    if agent_frames:
        all_data = b"".join(d for _, d in agent_frames)
        with wave.open("agent-reply.wav", "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes(all_data)
        dg = os.environ["DEEPGRAM_API_KEY"]
        async with httpx.AsyncClient(timeout=30) as hc:
            with open("agent-reply.wav", "rb") as f:
                res = await hc.post(
                    "https://api.deepgram.com/v1/listen?model=nova-3&language=tr",
                    headers={"Authorization": f"Token {dg}", "Content-Type": "audio/wav"},
                    content=f.read(),
                )
        try:
            tr = res.json()["results"]["channels"][0]["alternatives"][0]["transcript"]
            print("AJANIN SÖYLEDİĞİ:", tr[:250])
        except Exception:
            print("transkript alınamadı:", res.status_code)
    else:
        print("HATA: ajan hiç ses yayınlamadı")

    await room.disconnect()
    worker.terminate()

asyncio.run(main())
