import parse from 'html-react-parser'
import type { ArticleContent } from '../-types/Content'

type ArticleBodyProps = {
  content: ArticleContent | null
}

const ArticleBody = ({ content }: ArticleBodyProps) => {
  if (!content) return null

  return (
    <article className="prose dark:prose-invert max-w-none">
      <h1>{content.title}</h1>
      {content.sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          <div>{parse(section.content)}</div>
        </section>
      ))}
    </article>
  )
}

export default ArticleBody
