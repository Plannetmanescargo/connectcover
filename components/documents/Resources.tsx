import { Page, Section, s } from "./Pages";
import { guides, articles } from "@/content/documents/resources";
export default function Resources({ blog = false }: { blog?: boolean }) {
  const items = blog ? articles : guides;
  return (
    <Page
      eyebrow={blog ? "Coverza journal" : "Practical guides"}
      title={
        blog
          ? "A closer look at the details."
          : "Good information. Easier to use."
      }
      intro={
        blog
          ? "Short reads on clear technical documentation, useful references and keeping information organised."
          : "Practical guidance for scoping, receiving and maintaining your automotive documents."
      }
    >
      <Section>
        <nav className={s.toc} aria-label="On this page">
          {items.map((x) => (
            <a key={x.id} href={`#${x.id}`}>
              {x.title}
            </a>
          ))}
        </nav>
        <div className={s.article}>
          {items.map((x) => (
            <section key={x.id} id={x.id}>
              <h2>{x.title}</h2>
              <p>
                <strong>{x.intro}</strong>
              </p>
              {x.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
        </div>
      </Section>
    </Page>
  );
}
