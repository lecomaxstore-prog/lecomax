import Image from "next/image";

export default function HeroBanner() {
  return (
    <>
      {/* Desktop hero */}
      <section className="hidden md:block w-full">
        <Image
          src="/images/hero secrtion/hero section web version.png"
          alt="L'ecomax — Hero"
          width={1920}
          height={900}
          priority
          className="w-full h-auto object-cover"
        />
      </section>

      {/* Mobile hero */}
      <section className="md:hidden w-full">
        <Image
          src="/images/hero secrtion/hero section mobile version.png"
          alt="L'ecomax — Hero"
          width={1080}
          height={1350}
          priority
          className="w-full h-auto object-cover"
        />
      </section>
    </>
  );
}
