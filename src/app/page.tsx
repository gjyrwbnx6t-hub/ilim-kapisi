import DepartmentCard from "@/components/ui/DepartmentCard";
import { departments } from "@/data/departments";

export default function HomePage() {
  return (
    <>
      <section className="border-b-2 border-slate-200 bg-white px-[5%] py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold text-primary max-md:text-3xl">
          Çalışma Portalımıza Hoş Geldiniz
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-surface-muted">
          İki bölümün resmî müfredatını tek yerde topladık. Çalışmak istediğin
          bölümü seç, ders kategorilerine ve derslerin içeriğine ulaş.
        </p>
      </section>

      <section className="px-[5%] py-16">
        <h2 className="mb-10 text-center text-2xl font-bold text-slate-900">
          Bölümünü Seç
        </h2>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {departments.map((department) => (
            <DepartmentCard key={department.id} department={department} />
          ))}
        </div>
      </section>
    </>
  );
}
