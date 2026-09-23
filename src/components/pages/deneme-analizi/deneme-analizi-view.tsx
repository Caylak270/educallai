"use client";

import { useState } from "react";
import {
  examSegments,
  rosterStudents,
  type ExamsView,
  type HighlightView,
} from "@/lib/mock/exams";
import { BatchBanner, type BatchCallTarget } from "./batch-banner";
import { SegmentStrip } from "./segment-strip";
import { StudentDetailCard } from "./student-detail-card";
import { StudentRoster } from "./student-roster";

/**
 * Deneme Analizi ekranının client sarmalayıcısı.
 * Segment kartları ile öğrenci listesini tek `activeSegment` state'inde birleştirir:
 * karta tıklamak listeyi o segmente filtreler, tekrar tıklamak filtreyi kaldırır.
 * Canlı veri yoksa mock veriye düşer (sayfanın geri kalanıyla aynı davranış).
 */
export function DenemeAnaliziView({
  view,
  highlight,
}: {
  view?: ExamsView | null;
  highlight?: HighlightView | null;
}) {
  const segments = view?.segments ?? examSegments;
  const roster = view?.roster ?? rosterStudents;

  // Segment filtresi için tek kaynak — strip ve roster aynı state'i kullanır.
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  function toggleSegment(segmentId: string) {
    setActiveSegment((current) => (current === segmentId ? null : segmentId));
  }

  // Toplu arama hedefleri: düşüş alarmı segmentindeki öğrenciler
  const batchCalls: BatchCallTarget[] = roster
    .filter((student) => student.segmentKey === "dusus-alarmi")
    .map((student) => ({
      name: student.name,
      parent: student.action.toast?.parent,
      phone: student.phone,
    }));

  return (
    <div className="flex flex-col gap-6">
      {/* Segment kartları */}
      <SegmentStrip
        activeSegment={activeSegment}
        segments={segments}
        onToggle={toggleSegment}
      />

      {/* Vurgulanan öğrenci detay paneli */}
      <StudentDetailCard highlight={highlight} />

      {/* Öğrenci trend listesi */}
      <StudentRoster
        activeSegment={activeSegment}
        onSegmentChange={setActiveSegment}
        segments={segments}
        students={roster}
      />

      {/* Toplu kampanya şeridi */}
      <BatchBanner calls={batchCalls} />
    </div>
  );
}
