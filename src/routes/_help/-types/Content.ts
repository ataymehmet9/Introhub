type TableOfContent = {
  id: string
  label: string
}

type ArticleSection = {
  id: string
  title: string
  content: string
}

export type ArticleContent = {
  id: string
  title: string
  sections: Array<ArticleSection>
  tableOfContents: Array<TableOfContent>
  updateTime?: string
  createdBy?: string
  timeToRead?: number
}
