import { Link } from 'react-scroll'
import type { ArticleContent } from '../-types/Content'
import useLayoutGap from '@/utils/hooks/useLayoutGap'
import useResponsive from '@/utils/hooks/useResponsive'
import { Affix } from '@/components/shared'
import { Card } from '@/components/ui'

type TableOfContentsProps = {
  content: ArticleContent['tableOfContents']
}

const TableOfContents = ({ content }: TableOfContentsProps) => {
  const { getTopGapValue } = useLayoutGap()

  const { larger } = useResponsive()

  if (!content.length) return null

  return (
    <>
      {larger.lg && (
        <div className="lg:w-[380px] mt-6 md:px-8">
          <Affix offset={getTopGapValue()}>
            <Card>
              <h6 className="font-bold">On this page</h6>
              <ul className="text-gray-500 dark:text-gray-400 font-medium mt-4 relative">
                {content.map((link) => (
                  <li key={`anchor${link.id}`}>
                    <Link
                      activeClass="text-primary dark:text-gray-50 after:content-[''] after:absolute after:-left-5 after:bg-primary after:w-[2px] after:h-5"
                      className="cursor-pointer block transform transition-colors duration-200 py-2 hover:text-primary dark:hover:text-gray-100 "
                      to={link.id}
                      spy={true}
                      smooth={true}
                      duration={500}
                      offset={-80}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </Affix>
        </div>
      )}
    </>
  )
}

export default TableOfContents
