import type { Metadata } from "next";
import CareerTrackerClient from "@/components/career/CareerTrackerClient";

export const metadata: Metadata = {
  title: "Kariyer Takibi",
  description:
    "Üniversite dönemlerini, ders puanlarını, geçme durumunu ve harf notu ortalamasını takip et.",
};

export default function KariyerPage() {
  return <CareerTrackerClient />;
}
