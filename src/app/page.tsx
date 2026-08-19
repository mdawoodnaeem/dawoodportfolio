import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { About } from "@/components/sections/About";
import { Work } from "@/components/sections/Work";
import { Capabilities } from "@/components/sections/Capabilities";
import { Pricing } from "@/components/sections/Pricing";
import { Voices } from "@/components/sections/Voices";
import { Questions } from "@/components/sections/Questions";
import { Playground } from "@/components/sections/Playground";
import { Contact } from "@/components/sections/Contact";
import { profile, projects } from "@/content/site";

/**
 * SCROLL ORDER
 *
 * Hero → Manifesto → About → Work → Capabilities → Pricing → Voices →
 * Questions → Playground → Contact.
 *
 * The first three are locked together: they are the travelling portrait's
 * three stops, and the card has to move between adjacent sections or it spends
 * a whole unrelated section floating over the copy.
 *
 * After that, work comes before capabilities on purpose — proof earns the
 * right to make claims. Pricing follows, once there is a person and a track
 * record attached to the number. Playground is the last thing before the ask:
 * the visitor is given something before they are asked for anything.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <About />
      <Work />
      <Capabilities />
      <Pricing />
      <Voices />
      <Questions />
      <Playground />
      <Contact />

      {/* Structured data. Lets a search result show the real role and location
          instead of guessing them out of the first paragraph. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.name,
            alternateName: profile.short,
            jobTitle: profile.role,
            email: `mailto:${profile.email}`,
            telephone: profile.phoneHref,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Daska",
              addressRegion: "Punjab",
              addressCountry: "PK",
            },
            knowsAbout: [
              "Full-stack development",
              "WebGL",
              "Three.js",
              "Agentic AI",
              "Next.js",
              "Mobile app development",
            ],
            sameAs: profile.socials.map((s) => s.href),
            workExample: projects.map((p) => ({
              "@type": "CreativeWork",
              name: p.name,
              url: p.href,
              description: p.description,
            })),
          }),
        }}
      />
    </>
  );
}
