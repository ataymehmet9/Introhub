import { TbInfoCircle, TbSearch } from 'react-icons/tb'

interface NoSearchResultsProps {
  query: string
}

const NoSearchResults = ({ query }: NoSearchResultsProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <TbSearch className="text-5xl text-gray-400 dark:text-gray-600" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No connections found
      </h3>

      <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
        We couldn't find any contacts matching{' '}
        <span className="font-semibold">"{query}"</span>
      </p>

      <div className="bg-info-subtle border border-info rounded-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          <TbInfoCircle className="text-xl text-info flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-900 dark:text-gray-100">
            <p className="font-semibold mb-2">Tips for finding connections:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Try different keywords or spellings</li>
              <li>Use broader search terms</li>
              <li>Check for typos in your query</li>
              <li>Try searching by company name or position</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoSearchResults
