"""Uçtan uca gecikme ölçer: sahte veli konuşur → ajanın ilk ses anını ms cinsinden ölçer."""
import asyncio, os, time, wave, json, statistics
from dotenv import load_dotenv
load_dotenv()
import numpy as np
from livekit import rtc, api

SR = 24000
SPEECH = "test-speech.wav"

def read_wav(path):
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        data = w.readframes(w.getnframes())
    return data, sr

def rms(frame_data):
    a = np.frombuffer(frame_data, dtype=np.int16).astype(np.float32)
    return float(np.sqrt(np.mean(a * a)) if len(a) else 0)

async def main():
    if not os.path.exists(SPEECH):
        print("test-speech.wav yok — önce Cartesia ile üret")
        return
    speech_data, sr = read_wav(SPEECH)
    chunk = 480  # 20ms
    frames = [speech_data[i:i+chunk*2] for i in range(0, len(speech_data), chunk*2)]

    token = (
        api.AccessToken(os.environ["LIVEKIT_API_KEY"], os.environ["LIVEKIT_API_SECRET"])
        .with_identity("prob-veli")
        .with_name("Ölçüm Velisi")
        .with_grants(api.VideoGrants(room_join=True, room="latency-probe", can_publish=True, can_subscribe=True))
        .to_jwt()
    )

    room = rtc.Room()
    agent_streams = []
    voiced = []          # (monotonic, rms)
    recorded = []        # (monotonic, bytes)

    @room.on("track_subscribed")
    def on_track(track, pub, _part):
        if "ambience" in track.name.lower():
            print(f"  (ambiyan track atlandı: {track.name})")
            return
        print(f"  + ajan ses track alındı: {track.name}")
        stream = rtc.AudioStream(track=track)
        agent_streams.append(stream)
        async def reader():
            async for ev in stream:
                fd = bytes(ev.frame.data)
                t = time.monotonic()
                r = rms(fd)
                voiced.append((t, r))
                recorded.append((t, fd))
        asyncio.create_task(reader())

    await room.connect(os.environ["LIVEKIT_URL"], token, options=rtc.RoomOptions(auto_subscribe=True))
    print("bağlandı:", room.name)

    source = rtc.AudioSource(SR, 1)
    track = rtc.LocalAudioTrack.create_audio_track("prob-speech", source)
    await room.local_participant.publish_track(
        track=track, options=rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
    )
    await asyncio.sleep(0.3)

    print("soru gönderiliyor:", len(frames), "frame")
    for f in frames:
        await source.capture_frame(rtc.AudioFrame(f, SR, 1, len(f)//2))
    t_send_end = time.monotonic()
    print(f"konuşma bitti @ +0ms — ajan sesi bekleniyor...")

    deadline = time.monotonic() + 25
    while time.monotonic() < deadline:
        after = [(t, r) for (t, r) in voiced if t > t_send_end + 0.05 and r > 400]
        if after:
            lat = (after[0][0] - t_send_end) * 1000
            print(f"İLK AJAN SESİ: +{lat:.0f} ms (rms={after[0][1]:.0f})")
            # toplu ses kümelerini göster
            clusters = []
            for t, r in after:
                if not clusters or t - clusters[-1][1] > 0.7:
                    clusters.append([t, t])
                else:
                    clusters[-1][1] = t
            print("SES KÜMELERİ:", [[f"+{(a-t_send_end)*1000:.0f}ms", f"+{(b-t_send_end)*1000:.0f}ms"] for a, b in clusters])
            break
        await asyncio.sleep(0.01)
    else:
        print("25 sn içinde ajan sesi gelmedi")
        await room.disconnect()
        return

    await asyncio.sleep(8)  # yanıtın tamamını kaydet
    if recorded:
        all_data = b"".join(r for _, r in recorded)
        with wave.open("agent-reply.wav", "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes(all_data)
        print("ajan sesi: agent-reply.wav")
    await room.disconnect()

asyncio.run(main())
