import type { Metadata } from "next";
import HabitTrackerClient from "@/components/habits/HabitTrackerClient";

export const metadata: Metadata = {
  title: "Rutin Defteri",
  description:
    "Uyku, kitap okuma, Kur'an-ı Kerim ve kişisel alışkanlıkları sayı girerek takip et.",
};

export default function RutinPage() {
  return <HabitTrackerClient />;
}
