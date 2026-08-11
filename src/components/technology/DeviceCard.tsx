import Image from "next/image";
import Link from "next/link";

import type { Device } from "@/lib/equipment";
import { ArrowUpRight, Sparkle } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";

/**
 * One piece of equipment.
 *
 * The photo alternates sides down the page. That is not decoration: eight
 * identical left-image rows read as a spec sheet, and the point of this
 * page is that each device is a separate argument rather than a line item.
 *
 * `object-contain` on a padded tile rather than `object-cover`, because
 * manufacturer product shots are cut-outs on white — cropping them to fill
 * a box lops the end off a scanner wand.
 */
export default function DeviceCard({
  device,
  flipped,
  labels,
}: {
  device: Device;
  flipped: boolean;
  labels: {
    manufacturer: string;
    usedFor: string;
    highlights: string;
    photoPending: string;
  };
}) {
  return (
    <article id={device.slug} className="scroll-mt-28">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-14">
        <Reveal className={`lg:col-span-5 ${flipped ? "lg:order-last" : ""}`}>
          <figure className="relative aspect-[4/3] overflow-hidden rounded-card border border-ivory-400 bg-ivory-50 shadow-soft">
            <Image
              src={device.photo}
              /* Model plus manufacturer. "Scanner" alone tells an image
                 search nothing, and this is the one place on the site where
                 the alt text is also the product query someone would type. */
              alt={`${device.name} — ${device.manufacturer.name}`}
              fill
              sizes="(min-width: 1024px) 38vw, 100vw"
              className="object-contain p-6"
            />
            {device.photoPending && (
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-ivory-50/90 px-3 py-1 text-[0.6875rem] uppercase tracking-[0.12em] text-ink-600 ring-1 ring-inset ring-ivory-500">
                {labels.photoPending}
              </figcaption>
            )}
          </figure>
        </Reveal>

        <Reveal delay={90} className="lg:col-span-7">
          <p className="label-micro">
            {labels.manufacturer}:{" "}
            <a
              href={device.manufacturer.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 normal-case tracking-normal text-accent-700 underline decoration-ivory-600 underline-offset-4 transition-colors hover:decoration-accent-400"
            >
              {device.manufacturer.name}
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </p>

          <h3 className="mt-4 font-display text-2xl leading-snug lg:text-3xl">{device.name}</h3>
          <p className="mt-4 text-base leading-relaxed text-ink-800 sm:text-lg">{device.summary}</p>

          <div className="mt-6 space-y-4">
            {device.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-ink-700">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-8 rounded-card border border-accent-200 bg-accent-50 p-6">
            <p className="label-micro">{labels.highlights}</p>
            <ul className="mt-4 space-y-3">
              {device.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-3 text-sm leading-relaxed text-ink-800">
                  <Sparkle className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* The cross-link back into the service catalogue. A patient who
              has just read what the scanner does should be one click from
              the treatment it belongs to, and it keeps the two pages
              linked for crawlers rather than leaving this one a leaf. */}
          <div className="mt-6">
            <p className="label-micro">{labels.usedFor}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {device.services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={service.href}
                    className="inline-flex rounded-full border border-ivory-600 bg-ivory-50 px-4 py-2 text-xs text-ink-700 transition-colors hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </article>
  );
}
